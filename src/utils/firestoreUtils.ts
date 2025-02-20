import * as admin from "firebase-admin";
import { getSSMParameter } from "./parameterStore";

let db: FirebaseFirestore.Firestore | null = null;

export async function initializeFirebase(): Promise<void> {
  if (!admin.apps.length) {
    const firebaseParameterName = "firebase-service-account";
    const firebaseParameterValue = await getSSMParameter(firebaseParameterName);
    const parsedServiceAccount = JSON.parse(firebaseParameterValue);

    admin.initializeApp({
      credential: admin.credential.cert({
        projectId: parsedServiceAccount.project_id,
        clientEmail: parsedServiceAccount.client_email,
        privateKey: parsedServiceAccount.private_key.replace(/\\n/g, "\n"),
      }),
    });

    db = admin.firestore();
  }
}

export async function getFirestoreInstance(): Promise<FirebaseFirestore.Firestore> {
  if (!db) {
    await initializeFirebase();
  }
  return db!;
}


export async function verifyToken(token: string) {
  try {
    await admin.auth().verifyIdToken(token);
  } catch (error) {
    console.error('Error verifying token:', error);
    throw new Error('Unauthorized');
  }
}
