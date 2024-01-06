import type { Construct } from 'constructs'
import * as cdk from 'aws-cdk-lib'
import { aws_cloudfront as cf, aws_route53_patterns, CfnOutput, Duration } from 'aws-cdk-lib'
import * as acm from 'aws-cdk-lib/aws-certificatemanager'
import * as route53 from 'aws-cdk-lib/aws-route53'

export interface StackResources {
  deployEnv: string,
  domainName: string
}

export class CertificateStack extends cdk.Stack {
  certificate: acm.Certificate
  R53HostedZone: route53.HostedZone

  constructor(scope: Construct, id: string, props: cdk.StackProps & StackResources) {
    super(scope, id, props)
    
    this.R53HostedZone = new route53.HostedZone(this, 'HostedZone', {
      zoneName: props.domainName,
      comment: "Hosted Zone for my principal personal website"
    });

    this.certificate = new acm.Certificate(this, 'SiteCertificate', {
      domainName: props.domainName,
      subjectAlternativeNames: [`www.${props.domainName}`],
      validation: acm.CertificateValidation.fromDns(this.R53HostedZone)
    })
    new CfnOutput(this, 'Certificate', { value: this.certificate.certificateArn })

  }
}
