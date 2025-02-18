import * as admin from 'firebase-admin';
import { APIGatewayEvent } from 'aws-lambda';
import { SQS } from "aws-sdk";
import { initializeFirebase } from '../utils/firestoreUtils';

const sqs = new SQS();

async function verifyToken(token: string) {
  try {
    await admin.auth().verifyIdToken(token);
  } catch (error) {
    console.error('Error verifying token:', error);
    throw new Error('Unauthorized');
  }
}

export const handler = async (event: APIGatewayEvent) => {
  try {
    if (!event.headers?.Authorization) {
      return {
        statusCode: 400,
        headers: {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "http://localhost:3000", // Allow any origin
            "Access-Control-Allow-Methods": "POST, OPTIONS",
            "Access-Control-Allow-Headers": "Content-Type, Authorization",
            "Access-Control-Allow-Credentials": "true",
        },
      body: JSON.stringify({ message: 'Authorization header missing' }),
      };
    }

    if (!event.body) {
      return {
        statusCode: 400,
        body: JSON.stringify({ message: "Request body is missing or empty" }),
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

    const { criteria, prompt, userId, jobId } = JSON.parse(event.body);

    const message = {
      criteria,
      prompt,
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
        "Access-Control-Allow-Origin": "http://localhost:3000", // Allow any origin
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization",
        "Access-Control-Allow-Credentials": "true",
      },
    }
    } catch (error) {
      console.error(error);
    return {
      statusCode: 500,
      body: JSON.stringify({ message: 'Lambda failed', error }),
    };
  }
}