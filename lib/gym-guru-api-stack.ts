import * as cdk from 'aws-cdk-lib';
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs';
import { Construct } from 'constructs';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';

export class GymGuruApiStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const generateRoutine = new NodejsFunction(this, 'GenerateRoutine', {
      entry: 'src/handlers/generate-routine.ts',
      handler: 'handler'
    })

    // Create API Gateway
    const api = new apigateway.RestApi(this, 'GymGuruApi', {
      restApiName: 'GymGuru API',
    });

    // Add Lambda Integration
    const generateRoutineResource = api.root.addResource('generate-routine');
    generateRoutineResource.addMethod('POST', new apigateway.LambdaIntegration(generateRoutine), {
      authorizationType: apigateway.AuthorizationType.NONE,  // No authorization required
    });
  }
}
