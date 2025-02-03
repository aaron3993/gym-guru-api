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
      methodResponses: [
        {
          statusCode: '200',
          responseParameters: {
            'method.response.header.Access-Control-Allow-Origin': true,
            'method.response.header.Access-Control-Allow-Methods': true,
            'method.response.header.Access-Control-Allow-Headers': true,
          },
        },
      ],
    });

    generateRoutineResource.addMethod('OPTIONS', new apigateway.MockIntegration({
      integrationResponses: [{
        statusCode: '200',
        responseParameters: {
          'method.response.header.Access-Control-Allow-Origin': "'http://localhost:3000'",
          'method.response.header.Access-Control-Allow-Methods': "'OPTIONS,POST'",
          'method.response.header.Access-Control-Allow-Headers': "'Content-Type,Authorization'",
        },
      }],
      passthroughBehavior: apigateway.PassthroughBehavior.WHEN_NO_MATCH,
      requestTemplates: { "application/json": '{"statusCode": 200}' },
    }), {
      methodResponses: [{
        statusCode: '200',
        responseParameters: {
          'method.response.header.Access-Control-Allow-Origin': true,
          'method.response.header.Access-Control-Allow-Methods': true,
          'method.response.header.Access-Control-Allow-Headers': true,
        },
      }],
    });
  }
}
