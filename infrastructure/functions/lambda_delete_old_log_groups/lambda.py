from typing import Dict, Any, Optional
import json
import logging
import os
from time import sleep
from datetime import datetime, timedelta
from dateutil import tz

import boto3
from botocore.config import Config
from botocore.exceptions import ClientError

# Environment variables
SKIP_DELETE_LOG_GROUP_TAG_NAME = 'skip_delete_log_group'

level = getattr(logging, os.getenv('LOG_LEVEL'))
logging.basicConfig(format='%(name)s - %(asctime)s - %(levelname)s: - %(message)s')
logger = logging.getLogger(__name__)
logger.setLevel(level)

config = Config(connect_timeout=5, read_timeout=60, retries={'max_attempts': 6})
client = boto3.client('logs', config=config)


def get_log_groups():
    try:
        paginator = client.get_paginator("describe_log_groups")
        resources = paginator.paginate().build_full_result().get("logGroups")
    except ClientError as err:
        logging.error("Could not list all CloudWatch Log Groups.")
        raise Exception(err)

    return resources


def parse_log_group_arn(log_group):
    # Describing log groups the arn of these finish with ':*' and it is not what we want
    log_group_arn = log_group["arn"]
    if log_group_arn.endswith(":*"):
        log_group_arn = log_group_arn[:-2]
    return log_group_arn


def log_group_tag_check(log_group: Dict, tag_name: str, tag_value: str) -> bool:
    log_group_arn = parse_log_group_arn(log_group)
    log_group_name = log_group["logGroupName"]
    tags = {}
    try:
        log_groups_tags_list = client.list_tags_for_resource(
            resourceArn=log_group_arn
        )
        tags = log_groups_tags_list.get('tags')
    except ClientError as err:
        logger.error(f"Could not list tags for CloudWatch Log Group '{log_group_name}'.")
        logger.debug(err)
    except KeyError as err:
        logger.error(f"Could not extrapolate tags from boto response")
        raise err
    except Exception as err:
        logger.error(f"Not caught exception trying to list tags for CloudWatch Log Group '{log_group_name}'.")
        raise err
    else:
        logger.info(f"Tags CloudWatch Log Group '{log_group_name}' has been retrieved.")

    if tag_name in tags and tags.get(tag_name) == tag_value:
        return True
    else:
        return False


def delete_log_group(log_group):
    log_group_name = log_group["logGroupName"]

    if log_group_tag_check(log_group, SKIP_DELETE_LOG_GROUP_TAG_NAME, 'true'):
        # Log group has skip tag set, we're done here.
        logger.warning(f"Skip delete log group, Log Group's {log_group_name} Tag '{SKIP_DELETE_LOG_GROUP_TAG_NAME}' sets "
                       "to 'true'")
        return

    try:
        client.delete_log_group(
            logGroupName=log_group_name
        )
    except Exception as err:
        logger.error(f"Could not delete CloudWatch Log Group '{log_group_name}'.")
        logger.debug(err)
    else:
        logger.info(
            f"CloudWatch Log Group '{log_group_name}' has been deleted."
        )


def set_log_group_retention(log_group):
    if 'retentionInDays' in log_group:
        logger.debug("Log Group already has an expiration set, skipping.")
        return False
    log_group_name = log_group["logGroupName"]
    retention_in_days = 180
    try:
        client.put_retention_policy(
            logGroupName=log_group_name, retentionInDays=retention_in_days
        )
    except ClientError as err:
        logger.error(f"Failed to set retention period of log stream {log_group_name} to {retention_in_days}")
        logger.debug(err)
        return False
    return True


def set_log_group_tag(log_group):
    log_group_arn = parse_log_group_arn(log_group)
    log_group_name = log_group["logGroupName"]
    logger.debug(log_group_arn)
    try:
        client.tag_resource(
            resourceArn=log_group_arn,
            tags={'automatic_expiration': 'true'}
        )
    except ClientError as err:
        logger.error(f"Could not tag CloudWatch Log Group '{log_group_name}'.")
        logger.debug(err)
    else:
        logger.info(f"CloudWatch Log Group '{log_group_name}' has been tagged.")


def log_group_own_streams(log_group):
    # Does the input log group have at least 1 log stream?
    opts = {
        'logGroupName': log_group['logGroupName'],
        'limit': 10
    }

    response = client.describe_log_streams(**opts)
    if len(response["logStreams"]) > 0:
        return True
    else:
        return False


def get_streams(log_group, next_token=None):
    opts = {
        'logGroupName': log_group['logGroupName'],
        'limit': 50  # Max
    }
    if next_token:
        opts['nextToken'] = next_token

    response = client.describe_log_streams(**opts)

    if response:
        for stream in response['logStreams']:
            yield stream
        if 'nextToken' in response:
            yield from get_streams(log_group, response['nextToken'])


def delete_old_streams(log_group):
    """
    Delete old empty log streams. Events get cleaned up by log_group['retentionInDays'] but the streams don't.
    """
    logger.debug(f"Checking for old streams in log group: {log_group}")

    now = datetime.utcnow().replace(tzinfo=tz.tzutc())
    if 'retentionInDays' in log_group:
        oldest_valid_event = now - timedelta(days=log_group['retentionInDays'])
    else:
        # Log group has no expiration set, we're done here.
        logger.info("Log Group has no expiration set, skipping.")
        return

    logger.debug(f"Streams in group: {log_group['logGroupName']}")
    for stream in get_streams(log_group):

        # lastEventTimestamp doesn't update right away sometimes or if the stream was created with no events
        # it is missing
        if 'lastEventTimestamp' in stream:
            stream_time = datetime.fromtimestamp(stream['lastEventTimestamp'] / 1000, tz=tz.tzutc())
        else:
            # Assume stream creation if we don't have a lastEventTimestamp
            stream_time = datetime.fromtimestamp(stream['creationTime'] / 1000, tz=tz.tzutc())

        if stream_time < oldest_valid_event:
            client.delete_log_stream(
                logGroupName=log_group['logGroupName'],
                logStreamName=stream['logStreamName']
            )
            logger.info(f"Deleted expired stream: {stream['logStreamName']} in log group: {log_group}")
            # The AWS API gets overloaded if we go too fast.
            sleep(0.2)
        else:
            logger.debug(f"Checked stream, keeping:  {stream['logStreamName']} in log group {log_group}")


def handler(event: Dict[str, Optional[Any]], context):
    for log_group in get_log_groups():
        logger.debug(json.dumps(log_group))
        delete_old_streams(log_group)
        if not log_group_own_streams(log_group):
            delete_log_group(log_group)
            continue
        if set_log_group_retention(log_group):
            set_log_group_tag(log_group)
    logger.info("Done")
