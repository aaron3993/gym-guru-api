import * as cdk from 'aws-cdk-lib';
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs';
import { Construct } from 'constructs';

export class GymGuruApiStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const generateRoutine = new NodejsFunction(this, 'GenerateRoutine', {
      entry: 'src/handlers/generate-routine.ts',
      handler: 'handler'
    })
  }
}
