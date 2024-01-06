import type { Construct } from 'constructs'
import * as cdk from 'aws-cdk-lib'
import { 
  aws_cloudfront as cf, 
  aws_route53_patterns,
  CfnOutput, Duration,
  aws_sns as sns,
  aws_sns_subscriptions as snsSubscriptions,
  aws_cloudwatch as cloudwatch,
  aws_cloudwatch_actions as cw_actions
} from 'aws-cdk-lib'

export interface StackResources {
  readonly deployEnv: string
  readonly distribution: cf.Distribution
  readonly notificationsEmail: string
}

export class Monitoring extends cdk.Stack {
  constructor(scope: Construct, id: string, props: cdk.StackProps & StackResources) {
    super(scope, id, props)

    const isProd = props?.deployEnv === 'prod'
    
    const alarmsTopic = new sns.Topic(this, 'Alarm topic', {
      displayName: `SendEmail${props.deployEnv}`
    });
    alarmsTopic.addSubscription(
      new snsSubscriptions.EmailSubscription(props.notificationsEmail)
    );
    
    // ERRORS
    const cloudFrontErrors = new cloudwatch.Metric({
      namespace: "AWS/CloudFront",
      metricName: "5xxErrorRate",
      dimensionsMap: {"DistributionId": props.distribution.distributionId, "Region": "Global"},
      statistic: "Average",
      period: Duration.minutes(1),
      region: "us-east-1"
    });

    cloudFrontErrors.createAlarm(this, 'AlarmCloudFront5xx', {
      alarmDescription: "10 or more percentage of all HTTP responses status code is 5xx over the last 5 minutes",
      threshold: 10,
      evaluationPeriods: 5,
      comparisonOperator: cloudwatch.ComparisonOperator.GREATER_THAN_THRESHOLD,
      treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING
    }).addAlarmAction(new cw_actions.SnsAction(alarmsTopic));
    
    // REQUESTS
    const cloudFrontRequests = new cloudwatch.Metric({
      namespace: "AWS/CloudFront",
      metricName: "Requests",
      dimensionsMap: {"DistributionId": props.distribution.distributionId, "Region": "Global"},
      statistic: "Average",
      period: Duration.minutes(5),
      region: "us-east-1"
    });

    cloudFrontRequests.createAlarm(this, 'AlarmCloudFrontRequests', {
      alarmDescription: "500 or more viewer requests received by CloudFront over the last 15 minutes",
      threshold: 500,
      evaluationPeriods: 3,
      comparisonOperator: cloudwatch.ComparisonOperator.GREATER_THAN_THRESHOLD,
      treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING
    }).addAlarmAction(new cw_actions.SnsAction(alarmsTopic));
  }
}
