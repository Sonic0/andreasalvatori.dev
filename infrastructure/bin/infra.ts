#!/usr/bin/env node
import * as dotenv from 'dotenv'
dotenv.config()
import * as cdk from 'aws-cdk-lib'
import 'source-map-support/register'
import { SiteStack } from '../lib/main-stack'
import { CertificateStack } from '../lib/cert-stack-us'
import { Monitoring } from '../lib/monitoring-us'

const app = new cdk.App()

const deployEnv = app.node.tryGetContext('deploy-env') || 'prod'
const domainName = app.node.tryGetContext('infraStaticConfs')['domainName'] ?? ''

const sharedProps: cdk.StackProps = {
  tags: {
    "env": deployEnv,
    "resource": `${domainName}`
  }
}

const certEnv = {
  account: process.env.CDK_DEFAULT_ACCOUNT,
  region: 'us-east-1',
};

const { certificate, R53HostedZone } = new CertificateStack(
  app, `Certificate-${deployEnv}-US`, { 
    ...sharedProps,
    env: certEnv,
    crossRegionReferences: true,
    deployEnv,
    domainName,
  }
)

const siteEnv = {
  account: process.env.CDK_DEFAULT_ACCOUNT,
  region: 'eu-central-1',
};
const { bucket, distribution, notificationsEmail } = new SiteStack(
  app, `Site-${deployEnv}`, {
    ...sharedProps,
    env: siteEnv,
    crossRegionReferences: true,
    deployEnv,
    domainName,
    R53HostedZone,
    certificate
  }
)

new Monitoring(
  app, `Monitoring-${deployEnv}-US`, { 
    ...sharedProps,
    env: certEnv,
    crossRegionReferences: true,
    deployEnv,
    distribution,
    notificationsEmail: notificationsEmail
  }
)