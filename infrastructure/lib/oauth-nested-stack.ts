import type { Construct } from 'constructs'
import * as cdk from 'aws-cdk-lib'
import { CfnOutput, Duration } from 'aws-cdk-lib'
import * as iam from 'aws-cdk-lib/aws-iam'

export interface StackResources {
  deployEnv: string,
  domainName: string,
  codeBucketName: string,
  CFDistributionId: string,
  readonly thumbprints?: string[],
  readonly repoOwner?: string
}

export class Oauth2PoliciesStack extends cdk.NestedStack {
  constructor(scope: Construct, id: string, props: cdk.NestedStackProps & StackResources) {
    super(scope, id, props)

    /**
     * GitHub OIDC thumbprints updated 2023-07-27
     *
     * https://github.blog/changelog/2023-06-27-github-actions-update-on-oidc-integration-with-aws/
     */
    const GITHUB_OIDC_THUMBPRINTS = [
      '6938fd4d98bab03faadb97b34396831e3780aea1',
      '1c58a3a8518e8759bf075b76b750d4f2df264fcd',
    ];
    const rawEndpoint = 'token.actions.githubusercontent.com';
    const providerUrl = `https://${rawEndpoint}`;
    const repoName = props.domainName;

    const githubOidcProvider = new iam.OpenIdConnectProvider(this, 'GithubOIDC', {
      url: providerUrl,
      thumbprints: props.thumbprints ?? GITHUB_OIDC_THUMBPRINTS,
      clientIds: ['sts.amazonaws.com']
    })

    const githubActionsRole = new iam.Role(this, "DeployIntoBucketRole", {
      maxSessionDuration: Duration.hours(1),
      roleName: `github-${props.domainName}-actions-role`,
      description: "Github actions AWS operations",
      assumedBy: new iam.FederatedPrincipal(
          githubOidcProvider.openIdConnectProviderArn,
          {
            StringEquals: {
              [`${rawEndpoint}:aud`]: "sts.amazonaws.com",
            },
            StringLike: {
              [`${rawEndpoint}:sub`]: `repo:${props.repoOwner}/${repoName}:*`
            }
          },
          "sts:AssumeRoleWithWebIdentity"
      )
    })

    githubActionsRole.attachInlinePolicy(new iam.Policy(
      this, "DeployCodeS3Policy", {
      policyName: `github-${props.domainName}-pipelines-s3-deploy`,
      statements: [
        new iam.PolicyStatement({
          actions: [
            "s3:DeleteObject",
            "s3:GetBucketLocation",
            "s3:GetObject",
            "s3:ListBucket",
            "s3:PutObject"
          ],
          effect: iam.Effect.ALLOW,
          resources:[
              `arn:aws:s3:::${props.codeBucketName}`,
              `arn:aws:s3:::${props.codeBucketName}/*`
          ]
        }),
        new iam.PolicyStatement({
          actions: [
            "cloudfront:ListDistributions"
          ],
          effect: iam.Effect.ALLOW,
          resources:['*']
        }),
        new iam.PolicyStatement({
          actions: [
            "cloudfront:CreateInvalidation"
          ],
          effect: iam.Effect.ALLOW,
          resources:[
              `arn:aws:cloudfront::${this.account}:distribution/${props.CFDistributionId}`
          ]
        })
      ]}
    ))

    // -- A policy to permit assumption of the default AWS CDK roles. --
    // Allows assuming roles tagged with an aws-cdk:bootstrap-role tag of
    // certain values (file-publishing, lookup, deploy) which permit the CDK
    // application to look up existing values, publish assets, and create
    // CloudFormation changesets. These roles are created by CDK's
    // bootstrapping process. See:
    // https://docs.aws.amazon.com/cdk/latest/guide/bootstrapping.html
    //
    // WARNING: The CDK `deploy` role allows the CDK to execute changes via
    //          CloudFormation with its execution role. The execution role
    //          has full administrative permissions. It can only be assumed
    //          by CloudFormation, but you should still be aware.
    githubActionsRole.attachInlinePolicy(new iam.Policy(
      this, "CDKAutoDeploy", {
      policyName: `github-${props.domainName}-pipelines-cdk-deploy`,
      statements: [
        new iam.PolicyStatement({
          effect: iam.Effect.ALLOW,
          actions: ["sts:AssumeRole"],
          resources: ["arn:aws:iam::*:role/cdk-*"],
          conditions: {
            StringEquals: {
              "aws:ResourceTag/aws-cdk:bootstrap-role": [
                "file-publishing",
                "lookup",
                "deploy",
              ],
            },
          },
        })
      ]}
    ));
    
    new cdk.CfnOutput(this, "GitHubActionsRoleArn", {
      value: githubActionsRole.roleArn,
      description: (
        "The role ARN for GitHub Actions to use during deployment."
      )
    })
  }
}
