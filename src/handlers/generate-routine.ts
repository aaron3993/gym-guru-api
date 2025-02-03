import * as AWS from 'aws-sdk';
import * as admin from 'firebase-admin';
import { APIGatewayEvent } from 'aws-lambda';

// const secretsManager = new AWS.SecretsManager();

// const getSecret = async (secretName: string) => {
//     try {
//       // Fetch the secret from Secrets Manager
//       const data = await secretsManager.getSecretValue({ SecretId: secretName }).promise();
  
//       if (data.SecretString) {
//         // If the secret is a string, return it directly
//         const secret = JSON.parse(data.SecretString);
//         return secret;
//       } else {
//         // Handle the case where the secret is not a string
//         throw new Error('Secret is not in string format');
//       }
//     } catch (err) {
//       // Log any errors that occur during fetching the secret
//       console.error('Error retrieving secret:', err);
//       throw new Error('Failed to retrieve secret');
//     }
//   };

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

    try {
        // const secrets = await getSecret(secretName);
        console.log('retrieved secrets')
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
        //   const decodedToken = await admin.auth().verifyIdToken(token);
        //   console.log('Decoded token');
    
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