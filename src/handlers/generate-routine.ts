import * as AWS from 'aws-sdk';
import * as admin from 'firebase-admin';
import { APIGatewayEvent } from 'aws-lambda';
import { fetchWorkoutPlanFromOpenAI } from '../services/openaiUtils';

const secretsManager = new AWS.SecretsManager();

async function getSecretByName(secretName: string): Promise<string> {
  const secretsList: AWS.SecretsManager.ListSecretsResponse = await secretsManager.listSecrets().promise();
  const secret: AWS.SecretsManager.SecretListEntry | undefined = secretsList.SecretList?.find(
      (s) => s.Name === secretName
  );

  if (!secret || !secret.ARN) throw new Error(`Secret "${secretName}" not found`);

  const response: AWS.SecretsManager.GetSecretValueResponse = await secretsManager
      .getSecretValue({ SecretId: secret.ARN })
      .promise();

  if (!response.SecretString) throw new Error(`Secret "${secretName}" has no value`);

  return response.SecretString;
}

export const handler = async (event: APIGatewayEvent) => {
  console.log('lambda firing')
  try {
    // if (!event.headers?.Authorization) {
    //   return {
    //       statusCode: 400,
    //       headers: {
    //           "Content-Type": "application/json",
    //           "Access-Control-Allow-Origin": "http://localhost:3000", // Allow any origin
    //           "Access-Control-Allow-Methods": "POST, OPTIONS",
    //           "Access-Control-Allow-Headers": "Content-Type, Authorization",
    //           // "Access-Control-Allow-Credentials": "true",
    //       },
    //       body: JSON.stringify({ message: 'Authorization header missing' }),
    //     };
    // }

    // if (!event.body) {
    //   return {
    //     statusCode: 400,
    //     body: JSON.stringify({ message: "Request body is missing or empty" }),
    //   };
    // }
  
    // const { messages } = JSON.parse(event.body);

    // const secretName = 'firebase-service-account';
    // const secretString = await getSecretByName(secretName);
    // const secrets = JSON.parse(secretString);

    // const fireBaseServiceAccountString = secrets.FIREBASE_SERVICE_ACCOUNT_SECRET
    // const parsedFireBaseServiceAccountObject = JSON.parse(fireBaseServiceAccountString)
    //   admin.initializeApp({
    //     credential: admin.credential.cert({
    //       projectId: parsedFireBaseServiceAccountObject.project_id,
    //       clientEmail: parsedFireBaseServiceAccountObject.client_email,
    //       privateKey: parsedFireBaseServiceAccountObject.private_key.replace(/\\n/g, '\n'),
    //     }),
    //   });
    //   console.log('firebase admin initialized')
    //   const token = event.headers.Authorization?.split('Bearer ')[1];
  
    //   if (!token) {
    //     return {
    //       statusCode: 403,
    //       body: JSON.stringify({ message: 'Unauthorized' }),
    //     };
    //   }
  
      // try {
      //   await admin.auth().verifyIdToken(token);
      // } catch (error) {
      //   console.error('Error verifying token:', error);
      //   return {
      //     statusCode: 403,
      //     body: JSON.stringify({ message: 'Error verifying token' }),
      //   };
      // }

      // const openAISecretName = 'openai-api-key';
      // const openAISecretString = await getSecretByName(openAISecretName);
      // const openAISecrets = JSON.parse(openAISecretString);
      // const openAIAPIKey: string = openAISecrets.OPENAI_API_KEY;

      // console.log('open ai api key fetched and parsed')
      // const response = await fetchWorkoutPlanFromOpenAI(messages, openAIAPIKey);
      // console.log('post request complete')
      // return {
      //   statusCode: response.statusCode,
      //   headers: {
      //       "Content-Type": "application/json",
      //       "Access-Control-Allow-Origin": "http://localhost:3000",
      //       "Access-Control-Allow-Methods": "POST, OPTIONS",
      //       "Access-Control-Allow-Headers": "Content-Type, Authorization",
      //       "Access-Control-Allow-Credentials": "true",
      //   },
      //   data: response.data
      // }
      return {
        statusCode: 200,
        headers: {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "http://localhost:3000",
            "Access-Control-Allow-Methods": "POST, OPTIONS",
            "Access-Control-Allow-Headers": "Content-Type, Authorization",
            // "Access-Control-Allow-Credentials": "true",
        },
        body: JSON.stringify({ data: [1, 2, 3] }),
      }
    } catch (error) {
      console.error(error);
      return {
        statusCode: 500,
        body: JSON.stringify({ message: 'Lambda failed', error }),
    };
  }
}