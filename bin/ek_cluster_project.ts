#!/usr/bin/env node
import { EkClusterProjectStack } from '../lib/ek_cluster_project-stack';
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';

const app = new cdk.App();
const account = app.node.tryGetContext('account') || process.env.CDK_INTEG_ACCOUNT || process.env.CDK_DEFAULT_ACCOUNT;
const primaryRegion = { account: account, region: 'eu-central-1' };
// const secondaryRegion = {account: account, region: 'eu-central 2'};

new EkClusterProjectStack(app, `ClusterStack-${primaryRegion.region}`, { env: primaryRegion })
