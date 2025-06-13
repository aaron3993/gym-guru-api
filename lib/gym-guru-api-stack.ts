import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";

import { NodejsFunction } from "aws-cdk-lib/aws-lambda-nodejs";
import * as iam from "aws-cdk-lib/aws-iam";
import * as apigateway from "aws-cdk-lib/aws-apigateway";
import * as sqs from "aws-cdk-lib/aws-sqs";
import * as lambdaEventSources from "aws-cdk-lib/aws-lambda-event-sources";
import { Cors, LambdaIntegration, RestApi } from "aws-cdk-lib/aws-apigateway";

interface GymGuruApiStackProps extends cdk.StackProps {
  stage: string;
  apiVersion: string;
} 

export class GymGuruApiStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: GymGuruApiStackProps) {
    super(scope, id, props);

    // Environment-specific resource names
    const geminiApiName = `GeminiApi-${props.stage}`;
    const rapidApiName = `RapidApi-${props.stage}`;
    const queueName = `RoutineQueue-${props.stage}`;
    const lambdaRoleName = `LambdaExecutionRole-${props.stage}`;

    // Environment-specific configurations
    const lambdaTimeout = props.stage === 'production' ? 60 : 30;
    const lambdaMemory = props.stage === 'production' ? 512 : 256;
    const queueVisibilityTimeout = props.stage === 'production' ? 120 : 60;

    const lambdaExecutionRole = new iam.Role(this, lambdaRoleName, {
      assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com'),
      roleName: lambdaRoleName,
    });

    lambdaExecutionRole.addToPolicy(new iam.PolicyStatement({
      actions: ['ssm:GetParameter'],
      resources: [
        `arn:aws:ssm:${this.region}:${this.account}:parameter/${props.stage}/gemini-api-key`,
        `arn:aws:ssm:${this.region}:${this.account}:parameter/${props.stage}/rapid-api-key`,
        `arn:aws:ssm:${this.region}:${this.account}:parameter/${props.stage}/firebase-service-account`,
        `arn:aws:ssm:${this.region}:${this.account}:parameter/${props.stage}/neon-db-url`,
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

    const allowedOrigins = props.stage === 'production' 
      ? ["https://gymguru-37ed9.web.app"]
      : ["http://localhost:3000", "https://gym-guru-staging.web.app"];
    
    const geminiApi = new RestApi(this, geminiApiName, {
      restApiName: geminiApiName,
      defaultCorsPreflightOptions: {
        allowOrigins: allowedOrigins,
        allowMethods: Cors.ALL_METHODS,
        allowHeaders: Cors.DEFAULT_HEADERS,
        allowCredentials: true
      },
      deployOptions: {
        stageName: props.apiVersion,
        loggingLevel: props.stage === 'production' ? apigateway.MethodLoggingLevel.ERROR : apigateway.MethodLoggingLevel.INFO,
        dataTraceEnabled: props.stage !== 'production',
      }
    });
    
    const rapidApi = new RestApi(this, rapidApiName, {
      restApiName: rapidApiName,
      defaultCorsPreflightOptions: {
        allowOrigins: allowedOrigins,
        allowMethods: Cors.ALL_METHODS,
        allowHeaders: Cors.DEFAULT_HEADERS,
        allowCredentials: true
      },
      deployOptions: {
        stageName: props.apiVersion,
        loggingLevel: props.stage === 'production' ? apigateway.MethodLoggingLevel.ERROR : apigateway.MethodLoggingLevel.INFO,
        dataTraceEnabled: props.stage !== 'production',
      }
    });

    const queue = new sqs.Queue(this, queueName, {
      queueName: queueName,
      visibilityTimeout: cdk.Duration.seconds(queueVisibilityTimeout),
      retentionPeriod: props.stage === 'production' ? cdk.Duration.days(14) : cdk.Duration.days(4),
    });
  
    const fetchExercisesLambda = new NodejsFunction(this, `FetchExercisesLambda-${props.stage}`, {
      entry: "src/handlers/fetch-exercises.ts",
      handler: "handler",
      role: lambdaExecutionRole,
      timeout: cdk.Duration.seconds(lambdaTimeout),
      memorySize: lambdaMemory,
      environment: {
        STAGE: props.stage,
        API_VERSION: props.apiVersion,
      }
    });

    const fetchExercisesResource = rapidApi.root.addResource("fetch-all-exercises");
    fetchExercisesResource.addMethod("GET", new LambdaIntegration(fetchExercisesLambda), {
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
    });

    const generateRoutineLambda = new NodejsFunction(this, `GenerateRoutine-${props.stage}`, {
      entry: 'src/handlers/generate-routine.ts',
      handler: 'handler',
      environment: {
        SQS_QUEUE_URL: queue.queueUrl,
        STAGE: props.stage,
        API_VERSION: props.apiVersion,
      },
      role: lambdaExecutionRole,
      timeout: cdk.Duration.seconds(lambdaTimeout),
      memorySize: lambdaMemory
    });

    const generateRoutineResource = geminiApi.root.addResource('generate-routine');
    const generateRoutineIntegration = new LambdaIntegration(generateRoutineLambda);
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
    });

    queue.grantSendMessages(generateRoutineLambda);

    const processRoutineLambda = new NodejsFunction(this, `ProcessRoutineLambda-${props.stage}`, {
      entry: "src/handlers/process-routine.ts",
      handler: "handler",
      role: lambdaExecutionRole,
      timeout: cdk.Duration.seconds(lambdaTimeout),
      memorySize: lambdaMemory,
      environment: {
        STAGE: props.stage,
        API_VERSION: props.apiVersion,
      }
    });

    processRoutineLambda.addEventSource(
      new lambdaEventSources.SqsEventSource(queue, { batchSize: 1 })
    );

    queue.grantConsumeMessages(processRoutineLambda);

    // Output the API endpoints
    new cdk.CfnOutput(this, `GeminiApiUrl-${props.stage}`, { 
      value: geminiApi.url,
      description: `Gemini API URL for ${props.stage}`
    });
    
    new cdk.CfnOutput(this, `RapidApiUrl-${props.stage}`, { 
      value: rapidApi.url,
      description: `Rapid API URL for ${props.stage}`
    });
  }
}
