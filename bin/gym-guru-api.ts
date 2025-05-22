#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib';
import { GymGuruApiStack } from '../lib/gym-guru-api-stack';
import { environments } from '../lib/config/environment';

const app = new cdk.App();

const stage = app.node.tryGetContext('stage') || 'staging';
const config = environments[stage];

new GymGuruApiStack(app, `GymGuruApiStack-${stage}`, {
  env: config.env,
  stage: config.stage,
  apiVersion: config.apiVersion
});