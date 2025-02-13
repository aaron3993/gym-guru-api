import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";

import { NodejsFunction } from "aws-cdk-lib/aws-lambda-nodejs";
import * as iam from "aws-cdk-lib/aws-iam";
import * as apigateway from "aws-cdk-lib/aws-apigateway";
import * as sqs from "aws-cdk-lib/aws-sqs";
import * as lambdaEventSources from "aws-cdk-lib/aws-lambda-event-sources";
import { Cors, LambdaIntegration, RestApi } from "aws-cdk-lib/aws-apigateway";

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
    
    const api = new RestApi(this, 'GymGuruApi', {
      restApiName: 'GymGuru API',
      defaultCorsPreflightOptions: {
        allowOrigins: Cors.ALL_ORIGINS,
        // allowOrigins: ["http://localhost:3000"],
        allowMethods: Cors.ALL_METHODS,
        allowHeaders: Cors.DEFAULT_HEADERS,
        allowCredentials: true
      },
    });

    const queue = new sqs.Queue(this, "RoutineQueue", {
      visibilityTimeout: cdk.Duration.seconds(120), // Match Lambda timeout
    });
  
    const generateRoutineLambda = new NodejsFunction(this, 'GenerateRoutine', {
      entry: 'src/handlers/generate-routine.ts',
      handler: 'handler',
      environment: {
        SQS_QUEUE_URL: queue.queueUrl,
      },
      // environment: {
      //   // SECRET_NAME: fireBaseServiceAccount,
      //   // OPENAI_API_KEY: process.env.OPENAI_API_KEY || '',
      // },
      role: lambdaExecutionRole,
      timeout: cdk.Duration.seconds(120),
      memorySize: 256
    })

    const generateRoutineResource = api.root.addResource('generate-routine');
    const generateRoutineIntegration = new LambdaIntegration(generateRoutineLambda)
    generateRoutineResource.addMethod('POST', generateRoutineIntegration, {
      authorizationType: apigateway.AuthorizationType.NONE,
      methodResponses: [
        {
          statusCode: '200',
          responseParameters: {
            'method.response.header.Access-Control-Allow-Origin': true,
            'method.response.header.Access-Control-Allow-Methods': true,
            'method.response.header.Access-Control-Allow-Headers': true,
            "method.response.header.Access-Control-Allow-Credentials": true,
          },
        },
      ],
    })

    queue.grantSendMessages(generateRoutineLambda);

    const processRoutineLambda = new NodejsFunction(this, "ProcessRoutineLambda", {
      entry: "src/handlers/process-routine.ts",
      handler: "handler",
      role: lambdaExecutionRole,
      timeout: cdk.Duration.seconds(120),
      memorySize: 256,
    });

    processRoutineLambda.addEventSource(
      new lambdaEventSources.SqsEventSource(queue, { batchSize: 1 })
    );

    queue.grantConsumeMessages(processRoutineLambda);

    new cdk.CfnOutput(this, "QueueURL", { value: queue.queueUrl });
  }
}
