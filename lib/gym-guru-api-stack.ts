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

    const lambdaExecutionRole = new iam.Role(this, 'LambdaExecutionRole', {
      assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com'),
    });

    lambdaExecutionRole.addToPolicy(new iam.PolicyStatement({
      actions: ['ssm:GetParameter'],
      resources: [
        `arn:aws:ssm:${this.region}:${this.account}:parameter/gemini-api-key`,
        `arn:aws:ssm:${this.region}:${this.account}:parameter/firebase-service-account`
      ],
    }));

    lambdaExecutionRole.addToPolicy(new iam.PolicyStatement({
      actions: [
        'logs:CreateLogGroup',
        'logs:CreateLogStream',
        'logs:PutLogEvents'
      ],
      resources: ['arn:aws:logs:*:*:*'],
    }));

    const allowedOrigins = ["http://localhost:3000", "https://gymguru-37ed9.web.app"];
    
    const api = new RestApi(this, 'GymGuruApi', {
      restApiName: 'GymGuru API',
      defaultCorsPreflightOptions: {
        allowOrigins: allowedOrigins,
        allowMethods: Cors.ALL_METHODS,
        allowHeaders: Cors.DEFAULT_HEADERS,
        allowCredentials: true
      },
    });

    const queue = new sqs.Queue(this, "RoutineQueue", {
      visibilityTimeout: cdk.Duration.seconds(60),
    });
  
    const generateRoutineLambda = new NodejsFunction(this, 'GenerateRoutine', {
      entry: 'src/handlers/generate-routine.ts',
      handler: 'handler',
      environment: {
        SQS_QUEUE_URL: queue.queueUrl,
      },
      role: lambdaExecutionRole,
      timeout: cdk.Duration.seconds(60),
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
      timeout: cdk.Duration.seconds(60),
      memorySize: 256,
    });

    processRoutineLambda.addEventSource(
      new lambdaEventSources.SqsEventSource(queue, { batchSize: 1 })
    );

    queue.grantConsumeMessages(processRoutineLambda);

    new cdk.CfnOutput(this, "QueueURL", { value: queue.queueUrl });
  }
}
