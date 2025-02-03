import * as cdk from 'aws-cdk-lib';
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs';
import { Construct } from 'constructs';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';

export class GymGuruApiStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const fireBaseServiceAccount = 'firebase-service-account'
    const lambdaExecutionRole = new iam.Role(this, 'LambdaExecutionRole', {
      assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com'),
    });
    lambdaExecutionRole.addToPolicy(new iam.PolicyStatement({
      actions: ['secretsmanager:ListSecrets', 'secretsmanager:GetSecretValue'],
      resources: ['*'],
    }));

    lambdaExecutionRole.addToPolicy(new iam.PolicyStatement({
      actions: [
        'logs:CreateLogGroup',
        'logs:CreateLogStream',
        'logs:PutLogEvents'
      ],
      resources: ['arn:aws:logs:*:*:*'],
    }));
    

    const generateRoutine = new NodejsFunction(this, 'GenerateRoutine', {
      entry: 'src/handlers/generate-routine.ts',
      handler: 'handler',
      environment: {
        SECRET_NAME: fireBaseServiceAccount,
      },
      role: lambdaExecutionRole
    })

    const api = new apigateway.RestApi(this, 'GymGuruApi', {
      restApiName: 'GymGuru API',
    });

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
