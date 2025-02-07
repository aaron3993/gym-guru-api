import * as AWS from 'aws-sdk';
import * as admin from 'firebase-admin';
import { APIGatewayEvent } from 'aws-lambda';

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
    const secrets = JSON.parse(secretString);

    try {
    const fireBaseServiceAccountString = secrets.FIREBASE_SERVICE_ACCOUNT_SECRET
    const parsedFireBaseServiceAccountObject = JSON.parse(fireBaseServiceAccountString)
        admin.initializeApp({
          credential: admin.credential.cert({
            projectId: parsedFireBaseServiceAccountObject.project_id,
            clientEmail: parsedFireBaseServiceAccountObject.client_email,
            privateKey: parsedFireBaseServiceAccountObject.private_key.replace(/\\n/g, '\n'),
          }),
        });
        const token = event.headers.Authorization?.split('Bearer ')[1];
    
        if (!token) {
          return {
            statusCode: 403,
            body: JSON.stringify({ message: 'Unauthorized' }),
          };
        }
    
        try {
          const decodedToken = await admin.auth().verifyIdToken(token);
    
          // Proceed with your logic (e.g., generate routine)
          return {
            statusCode: 200,
            headers: {
                "Content-Type": "application/json",
                "Access-Control-Allow-Origin": "http://localhost:3000",
                "Access-Control-Allow-Methods": "POST, OPTIONS",
                "Access-Control-Allow-Headers": "Content-Type, Authorization",
            },
            body: JSON.stringify({ message: 'Request successful'})
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