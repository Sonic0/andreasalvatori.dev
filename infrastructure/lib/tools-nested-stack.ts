import type { Construct } from 'constructs'
import * as path from 'path';
import * as cdk from 'aws-cdk-lib'
import {
  Duration,
  TimeZone,
  aws_iam as iam,
  aws_lambda as lambda,
  aws_logs as logs,
  aws_cloudwatch as cloudwatch,
  aws_cloudwatch_actions as cloudwatchActions,
  aws_sns as sns
} from 'aws-cdk-lib'
import { Schedule, ScheduleExpression, Group } from "@aws-cdk/aws-scheduler-alpha";
import { LambdaInvoke } from "@aws-cdk/aws-scheduler-targets-alpha";

export interface StackResources {
  readonly deployEnv: string,
  readonly domainName: string,
  readonly alarmsTopic: sns.Topic
}

export class ToolsStack extends cdk.NestedStack {
  
  constructor(scope: Construct, id: string, props: cdk.NestedStackProps & StackResources) {
    super(scope, id, props)

    const lambdaDeleteLogsName = 'delete_old_log_groups';

    const isProd = props?.deployEnv === 'prod';

    const schedulerGroup = new Group(this, 'schedulerToolsGroup', {
      groupName: `${props.domainName.replace('.', '')}${props.deployEnv.toUpperCase()}`
    })

    const LambdaDeleteLogsRole = new iam.Role(this, 'deleteLogsLambdaRole', {
      description: `Policy assumed by ${lambdaDeleteLogsName} Lambda`,
      assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com'),
      managedPolicies: [
          iam.ManagedPolicy.fromAwsManagedPolicyName("service-role/AWSLambdaBasicExecutionRole")
      ],
      inlinePolicies: {
          "CloudWatchLogs": new iam.PolicyDocument({
              statements: [
                new iam.PolicyStatement({
                  actions: [
                        "logs:DescribeLogStreams",
                        "logs:DescribeLogGroups",
                        "logs:ListTagsLogGroup",
                        "logs:TagResource",
                        "logs:ListTagsForResource",
                        "logs:DeleteLogGroup",
                        "logs:DeleteLogStream",
                        "logs:PutRetentionPolicy"
                    ],
                    effect: iam.Effect.ALLOW,
                    resources: ["*"]
                })
              ]
            }
          )
        }
      }
    )

    const deleteLogsLambda = new lambda.Function(this, 'deleteLogsLambda', {
      code: lambda.Code.fromAsset(path.resolve(__dirname, `../functions/lambda_${lambdaDeleteLogsName}`)),
      description: 'Delete empty log groups and set expiration in case of "never expire"',
      handler: `lambda.handler`,
      runtime: lambda.Runtime.PYTHON_3_11,
      environment: {
        REGION: this.region,
        ENV_NAME: props.deployEnv,
        LOG_LEVEL: isProd ? 'INFO' : 'DEBUG'
      },
      logRetention: isProd ? logs.RetentionDays.ONE_MONTH : logs.RetentionDays.ONE_DAY,
      timeout: Duration.minutes(15),
      memorySize: 128,
      role: LambdaDeleteLogsRole
    });
    
    new Schedule(this, `schedulerRule`, {
      scheduleName: `lambda-${lambdaDeleteLogsName}-scheduler-${props.deployEnv}`,
      schedule: ScheduleExpression.cron({
          minute: '0',
          hour: '3',
          weekDay: '1',
          timeZone: TimeZone.EUROPE_ROME,
      }),
      target: new LambdaInvoke(deleteLogsLambda, {
        retryAttempts: 3, 
        maxEventAge: Duration.hours(1)
      }),
      description: 'Schedule to clear CloudWatch LogGroups every Monday at 3am',
      group: schedulerGroup
    });

    const deleteLogsLambdaErrorsAlarms = new cloudwatch.Alarm(this, `deleteLogsLambda${props.deployEnv.toUpperCase()}ErrorsAlarm`, {
      metric: deleteLogsLambda.metricErrors({period: Duration.days(1), statistic: "Sum"}),
      evaluationPeriods: 1,
      threshold: 1,
      alarmDescription: 'The number of invocations that result in a function error over a day',
      comparisonOperator: cloudwatch.ComparisonOperator.GREATER_THAN_OR_EQUAL_TO_THRESHOLD,
      treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING
    });
    deleteLogsLambdaErrorsAlarms.addAlarmAction(new cloudwatchActions.SnsAction(props.alarmsTopic));
  }
}
