export interface EnvironmentConfig {
  env: {
    account: string;
    region: string;
  };
  stage: string;
  apiVersion: string;
}

export const environments: { [key: string]: EnvironmentConfig } = {
  staging: {
    env: {
      account: process.env.CDK_DEFAULT_ACCOUNT || '',
      region: process.env.CDK_DEFAULT_REGION || 'us-east-1'
    },
    stage: 'staging',
    apiVersion: 'v2'
  },
  production: {
    env: {
      account: process.env.CDK_DEFAULT_ACCOUNT || '',
      region: process.env.CDK_DEFAULT_REGION || 'us-east-1'
    },
    stage: 'production',
    apiVersion: 'v2'
  }
}; 