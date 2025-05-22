import { APIGatewayEvent, APIGatewayProxyHandler } from 'aws-lambda';
import { SQS } from "aws-sdk";
import { initializeFirebase, verifyToken } from '../utils/firestoreUtils';

const sqs = new SQS();

export const handler: APIGatewayProxyHandler = async (event: APIGatewayEvent) => {
  const origin: string | undefined = event.headers?.origin;

  const stage = process.env.STAGE;
  let allowedOrigins: string[];

  if (stage === 'production') {
    allowedOrigins = ["https://gymguru-37ed9.web.app"];
  } else if (stage === 'staging') {
    allowedOrigins = ["http://localhost:3000", "https://gym-guru-staging.web.app"];
  } else { // Default or development
    allowedOrigins = ["http://localhost:3000", "https://gym-guru-staging.web.app", "https://gymguru-37ed9.web.app"]; // Or a more restrictive default
  }

  try {
    if (!event.headers?.Authorization) {
      return {
        statusCode: 400,
        headers: {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": origin && allowedOrigins.includes(origin) ? origin : allowedOrigins[0],
            "Access-Control-Allow-Methods": "POST, OPTIONS",
            "Access-Control-Allow-Headers": "Content-Type, Authorization",
            "Access-Control-Allow-Credentials": "true",
        },
      body: JSON.stringify({ message: 'Authorization header missing' }),
      };
    }
    
    await initializeFirebase()

    const token = event.headers.Authorization?.split('Bearer ')[1];

    if (!token) {
      return {
        statusCode: 403,
        body: JSON.stringify({ message: 'Unauthorized' }),
      };
    }

    await verifyToken(token);

    if (!event.body) {
      return {
        statusCode: 400,
        headers: {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": origin && allowedOrigins.includes(origin) ? origin : allowedOrigins[0],
            "Access-Control-Allow-Methods": "POST, OPTIONS",
            "Access-Control-Allow-Headers": "Content-Type, Authorization",
            "Access-Control-Allow-Credentials": "true",
        },
        body: JSON.stringify({ message: "Request body is missing or empty" }),
      };
    }

    const { criteria, exerciseDetails, userId, jobId } = JSON.parse(event.body);

    const message = {
      criteria,
      exerciseDetails,
      userId,
      jobId
    };

    await sqs
      .sendMessage({
        QueueUrl: process.env.SQS_QUEUE_URL!,
        MessageBody: JSON.stringify(message),
      })
      .promise();

    return {
      statusCode: 202,
      body: "Your workout routine is being generated...",
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": origin && allowedOrigins.includes(origin) ? origin : allowedOrigins[0],
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization",
        "Access-Control-Allow-Credentials": "true",
      },
    }
    } catch (error) {
      console.error(error);
    return {
      statusCode: 500,
      headers: {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": origin && allowedOrigins.includes(origin) ? origin : allowedOrigins[0],
            "Access-Control-Allow-Methods": "POST, OPTIONS",
            "Access-Control-Allow-Headers": "Content-Type, Authorization",
            "Access-Control-Allow-Credentials": "true",
      },
      body: JSON.stringify({ message: 'Routine generation failed', error }),
    };
  }
}