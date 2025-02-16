import { getSecretByName } from "../utils/secretsManager";
import { fetchWorkoutPlanFromOpenAI } from "../services/openaiUtils";
import * as admin from "firebase-admin";
import { completeJobInFirestore, saveCompleteWorkoutInfo } from "../utils/firestoreMethods";
import { getFirestoreInstance } from "../utils/firestoreUtils";
const mockWorkoutPlan = require('../../mocks/mockWorkoutPlan.json');

export async function handler(event: any) {
    // const firebaseSecretName = 'firebase-service-account';
    // const firebaseSecretString = await getSecretByName(firebaseSecretName);
    // const firebaseSecrets = JSON.parse(firebaseSecretString);
    // const fireBaseServiceAccountString = firebaseSecrets.FIREBASE_SERVICE_ACCOUNT_SECRET
    // const parsedFireBaseServiceAccountObject = JSON.parse(fireBaseServiceAccountString)

    // if (!admin.apps.length) {
    //     admin.initializeApp({
    //         credential: admin.credential.cert({
    //         projectId: parsedFireBaseServiceAccountObject.project_id,
    //         clientEmail: parsedFireBaseServiceAccountObject.client_email,
    //         privateKey: parsedFireBaseServiceAccountObject.private_key.replace(/\\n/g, "\n"),
    //         }),
    //     });
    // }

    const db = await getFirestoreInstance();

    // const openAISecretName = 'openai-api-key';
    // const openAISecretString = await getSecretByName(openAISecretName);
    // const openAISecrets = JSON.parse(openAISecretString);
    // const openAIAPIKey: string = openAISecrets.OPENAI_API_KEY;

    for (const record of event.Records) {
        const body = JSON.parse(record.body);
        const { criteria, messages, userId, jobId } = body
        try {
            const routine = mockWorkoutPlan
            // const routine = await fetchWorkoutPlanFromOpenAI(messages, openAIAPIKey);
            const routineId = await saveCompleteWorkoutInfo(db, userId, routine, criteria);
            await completeJobInFirestore(db, jobId, routineId);
        } catch (error) {
            console.error("OpenAI Request Failed:", error);
        }
    }

    return { statusCode: 200 };
}
