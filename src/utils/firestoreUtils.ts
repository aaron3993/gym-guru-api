import * as admin from "firebase-admin";
import { getSecretByName } from "./secretsManager";

let db: FirebaseFirestore.Firestore | null = null;

async function initializeFirebase(): Promise<FirebaseFirestore.Firestore> {
  if (!db) {
    const firebaseSecretName = "firebase-service-account";
    const firebaseSecretString = await getSecretByName(firebaseSecretName);
    const firebaseSecrets = JSON.parse(firebaseSecretString);
    const fireBaseServiceAccountString = firebaseSecrets.FIREBASE_SERVICE_ACCOUNT_SECRET;
    const parsedFireBaseServiceAccountObject = JSON.parse(fireBaseServiceAccountString);

    if (!admin.apps.length) {
      admin.initializeApp({
        credential: admin.credential.cert({
          projectId: parsedFireBaseServiceAccountObject.project_id,
          clientEmail: parsedFireBaseServiceAccountObject.client_email,
          privateKey: parsedFireBaseServiceAccountObject.private_key.replace(/\\n/g, "\n"),
        }),
      });
    }

    db = admin.firestore();
  }

  return db;
}

export async function getFirestoreInstance(): Promise<FirebaseFirestore.Firestore> {
  return await initializeFirebase();
}