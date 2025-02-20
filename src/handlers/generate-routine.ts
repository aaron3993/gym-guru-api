import { APIGatewayEvent } from 'aws-lambda';
import { SQS } from "aws-sdk";
import { initializeFirebase, verifyToken } from '../utils/firestoreUtils';

const sqs = new SQS();

export const handler = async (event: APIGatewayEvent) => {
  const origin: string | undefined = event.headers?.origin;

  const allowedOrigins: string[] = ["http://localhost:3000", "https://gymguru-37ed9.web.app"];

  try {
    if (!event.headers?.Authorization) {
      return {
        statusCode: 400,
        headers: {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": origin && allowedOrigins.includes(origin) ? origin : "https://gymguru-37ed9.web.app/",
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
      console.log('generate routine lambda done')
    return {
      statusCode: 202,
      body: "Your workout routine is being generated...",
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": origin && allowedOrigins.includes(origin) ? origin : "https://gymguru-37ed9.web.app/",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization",
        "Access-Control-Allow-Credentials": "true",
      },
    }
    } catch (error) {
      console.error(error);
    return {
      statusCode: 500,
      body: JSON.stringify({ message: 'Routine generation failed', error }),
    };
  }
}