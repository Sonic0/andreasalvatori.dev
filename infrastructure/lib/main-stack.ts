import type { Construct } from 'constructs'
import * as cdk from 'aws-cdk-lib'
import { 
  aws_cloudfront as cf,
  CfnOutput,
  Duration,
  aws_cloudwatch as cloudwatch,
  aws_certificatemanager as acm,
  aws_route53 as route53,
  aws_route53_targets as route53targets,
  aws_s3 as s3,
  aws_ssm as ssm,
  aws_sns as sns,
  aws_sns_subscriptions as snsSubscriptions
} from 'aws-cdk-lib'
import { StaticSiteStack } from './static-site-nested-stack'
import { Oauth2PoliciesStack } from './oauth-nested-stack'

export interface StackResources {
  readonly deployEnv: string,
  readonly domainName: string,
  R53HostedZone: route53.IHostedZone,
  certificate: acm.Certificate
}

export class SiteStack extends cdk.Stack {
  readonly bucket: s3.Bucket
  readonly distribution: cf.Distribution
  readonly notificationsEmail: string

  constructor(scope: Construct, id: string, props: cdk.StackProps & StackResources) {
    super(scope, id, props)

    const { bucket, distribution } = new StaticSiteStack(
      this, `StaticSite-${props.deployEnv}`, {
        deployEnv: props.deployEnv,
        domainName: props.domainName,
        certificate: props.certificate,
        route53Zone: props.R53HostedZone
      }
    )
    this.bucket = bucket
    this.distribution = distribution

    // Route53 alias IPv4 to CloudFront
    new route53.ARecord(this, 'AliasRecord', {
      recordName: props.domainName,
      target: route53.RecordTarget.fromAlias(new route53targets.CloudFrontTarget(this.distribution)),
      zone: props.R53HostedZone
    })
    // Route53 alias IPv6 to CloudFront
    new route53.AaaaRecord(this, 'AaaaAliasRecord', {
      recordName: props.domainName,
      target: route53.RecordTarget.fromAlias(new route53targets.CloudFrontTarget(this.distribution)),
      zone: props.R53HostedZone
    })

    new route53.CnameRecord(this, 'WWWRecord', {
      recordName: `www.${props.domainName}`,
      zone: props.R53HostedZone,
      domainName: props.domainName
    })

    new Oauth2PoliciesStack(
      this, `Oauth2Policies-${props.deployEnv}`, {
        deployEnv: props.deployEnv,
        domainName: props.domainName,
        CFDistributionId: this.distribution.distributionId,
        codeBucketName: this.bucket.bucketName,
        repoOwner: "Sonic0"
      }
    )
    
    // Import email address from a Parameter Store parameter
    this.notificationsEmail = ssm.StringParameter.valueForStringParameter(
      this, `/${props.domainName}/${props.deployEnv}/alarmsEmail`
    ); // latest version
    const alarmsTopic = new sns.Topic(this, 'Alarm topic', {
      displayName: `SendEmail${props.deployEnv}`
    });
    alarmsTopic.addSubscription(
      new snsSubscriptions.EmailSubscription(this.notificationsEmail)
    );

  }
}
