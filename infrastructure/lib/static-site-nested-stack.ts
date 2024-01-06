import type { Construct } from 'constructs'
import * as cdk from 'aws-cdk-lib'
import * as origins from 'aws-cdk-lib/aws-cloudfront-origins'
import { aws_cloudfront as cf, CfnOutput, Duration } from 'aws-cdk-lib'
import * as acm from 'aws-cdk-lib/aws-certificatemanager'
import * as s3 from 'aws-cdk-lib/aws-s3'
import * as iam from 'aws-cdk-lib/aws-iam'
import * as route53 from 'aws-cdk-lib/aws-route53'

export interface StackResources {
  readonly deployEnv: string,
  readonly domainName: string,
  readonly certificate: acm.ICertificate,
  route53Zone: route53.IHostedZone
}

export class StaticSiteStack extends cdk.NestedStack {
  bucket: s3.Bucket
  distribution: cf.Distribution
  
  constructor(scope: Construct, id: string, props: cdk.NestedStackProps & StackResources) {
    super(scope, id, props)

    const isProd = props?.deployEnv === 'prod'
    
    // Code S3 Bucket
    this.bucket = new s3.Bucket(this, 'SiteBucket', {
      bucketName: `${props.domainName}-${props?.deployEnv}`,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      removalPolicy: isProd ? cdk.RemovalPolicy.RETAIN : cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: ! isProd,
      encryption: s3.BucketEncryption.S3_MANAGED,
      enforceSSL: true
    })
    new CfnOutput(this, 'Bucket', {
      description: 'The name of the s3 bucket',
      value: this.bucket.bucketName,
      exportName: 'codeBucket'
    });

    // CF OAI
    const originAccessIdentity = new cf.OriginAccessIdentity(this, 'CfOriginAccessIdentity')
    this.bucket.addToResourcePolicy(
      new iam.PolicyStatement({
        actions: [
          's3:GetObject'
        ],
        resources: [
          this.bucket.arnForObjects('*')
        ],
        principals: [
          new iam.CanonicalUserPrincipal(
            originAccessIdentity.cloudFrontOriginAccessIdentityS3CanonicalUserId
          ),
        ],
      })
    )

    const responseHeadersPolicy = new cf.ResponseHeadersPolicy(this, 'ResponseHeadersPolicy', {
      responseHeadersPolicyName: 'CustomResponseHeadersPolicy',
      securityHeadersBehavior: {
        /**
         * @todo ResponseHeadersPolicy CSP (for you)
         *
         * Implementing a proper Content Security Policy (CSP) can be
         * challenging when there is limited control over the scripts included on the site.
         */
        // contentSecurityPolicy: { contentSecurityPolicy: 'default-src https:;', override: true },
        contentTypeOptions: { override: true },
        frameOptions: { frameOption: cf.HeadersFrameOption.DENY, override: true },
        referrerPolicy: {
          referrerPolicy: cf.HeadersReferrerPolicy.NO_REFERRER,
          override: true,
        },
        strictTransportSecurity: {
          override: true,
          accessControlMaxAge: Duration.days(365 * 2),
          includeSubdomains: true,
          preload: true,
        },
        xssProtection: { override: true, protection: true, modeBlock: true },
      },
    })
    this.distribution = new cf.Distribution(this, 'BlogCfDistribution', {
      comment: `${props.domainName}-${props.deployEnv}`,
      defaultRootObject: 'index.html',
      defaultBehavior: {
        functionAssociations: [],
        origin: new origins.S3Origin(this.bucket, { originAccessIdentity }),
        responseHeadersPolicy,
        viewerProtocolPolicy: cf.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
        compress: true,
        allowedMethods: cf.AllowedMethods.ALLOW_GET_HEAD_OPTIONS,
      },
      priceClass: cf.PriceClass.PRICE_CLASS_100,
      domainNames: [props.domainName, `www.${props.domainName}`],
      certificate: props.certificate,
      errorResponses: [
        {
          httpStatus: 403,
          responseHttpStatus: 404,
          responsePagePath: '/404.html'
        }
      ],
      minimumProtocolVersion: cf.SecurityPolicyProtocol.TLS_V1_2_2021,
      httpVersion: cf.HttpVersion.HTTP2_AND_3
    })

  }
}
