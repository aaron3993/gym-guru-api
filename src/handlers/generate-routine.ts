import * as AWS from 'aws-sdk';
import * as admin from 'firebase-admin';
import { APIGatewayEvent } from 'aws-lambda';

const secretsManager = new AWS.SecretsManager();

async function getSecretByName(secretName: string): Promise<string> {
  // Fetch the list of secrets
  const secretsList: AWS.SecretsManager.ListSecretsResponse = await secretsManager.listSecrets().promise();

  // Find the specific secret by name
  const secret: AWS.SecretsManager.SecretListEntry | undefined = secretsList.SecretList?.find(
      (s) => s.Name === secretName
  );

  if (!secret || !secret.ARN) throw new Error(`Secret "${secretName}" not found`);

  // Fetch the secret value using the discovered ARN
  const response: AWS.SecretsManager.GetSecretValueResponse = await secretsManager
      .getSecretValue({ SecretId: secret.ARN })
      .promise();

  if (!response.SecretString) throw new Error(`Secret "${secretName}" has no value`);

  return response.SecretString;
}

export const handler = async (event: APIGatewayEvent) => {
    if (!event.headers?.Authorization) {
        return {
            statusCode: 400,
            headers: {
                "Content-Type": "application/json",
                "Access-Control-Allow-Origin": "http://localhost:3000", // Allow any origin
                "Access-Control-Allow-Methods": "POST, OPTIONS",
                "Access-Control-Allow-Headers": "Content-Type, Authorization",
            },
            body: JSON.stringify({ message: 'Authorization header missing' }),
          };
      }

    const secretName = 'firebase-service-account';
    const secretString = await getSecretByName(secretName);
        console.log("Secret Retrieved");
        // const secrets = JSON.parse(secretString);
    try {
        // const secrets = await getSecret(secretName);
        // console.log('Successfully retrieved secret:', {
        //   projectId: secrets.projectId, // Safe to log
        //   clientEmail: secrets.clientEmail, // Safe to log
        //   secretLength: secretString.length, // Just for debugging
        // });
        // Initialize Firebase Admin SDK with secrets from Secrets Manager
        // admin.initializeApp({
        //   credential: admin.credential.cert({
        //     projectId: secrets.projectId,
        //     clientEmail: secrets.clientEmail,
        //     privateKey: secrets.privateKey.replace(/\\n/g, '\n'),
        //   }),
        // });
    
        const token = event.headers.Authorization?.split('Bearer ')[1];
    
        if (!token) {
          return {
            statusCode: 403,
            body: JSON.stringify({ message: 'Unauthorized' }),
          };
        }
    
        try {
          // Firebase Admin SDK verifies the token
          // const decodedToken = await admin.auth().verifyIdToken(token);
          // console.log('Decoded token');
    
          // Proceed with your logic (e.g., generate routine)
          return {
            'statusCode': 200,
            headers: {
                "Content-Type": "application/json",
                "Access-Control-Allow-Origin": "http://localhost:3000", // Allow any origin
                "Access-Control-Allow-Methods": "POST, OPTIONS",
                "Access-Control-Allow-Headers": "Content-Type, Authorization",
            },
            'body': JSON.stringify({ message: 'Hello World!'})
          }
        } catch (error) {
          console.error('Error verifying token:', error);
          return {
            statusCode: 403,
            body: JSON.stringify({ message: 'Unauthorized' }),
          };
        }
      } catch (error) {
        console.error('Error initializing Firebase Admin SDK:', error);
        return {
          statusCode: 500,
          body: JSON.stringify({ message: 'Internal server error' }),
        };
    }
}