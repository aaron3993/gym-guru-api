import { completeJobInFirestore, saveCompleteWorkoutInfo } from "../utils/firestoreMethods";
import { getFirestoreInstance } from "../utils/firestoreUtils";
import { fetchWorkoutPlanFromGemini } from "../services/geminiUtils";
import { getSSMParameter } from "../utils/parameterStore";
import { Routine } from "../interfaces/Routine";
import { SQSEvent } from "aws-lambda";

export async function handler(event: SQSEvent) {
    const db = await getFirestoreInstance();
    
    for (const record of event.Records) {
        const body = JSON.parse(record.body);
        const { criteria, prompt, userId, jobId } = body
        try {
            const geminiApiKeyString = 'gemini-api-key'
            const geminiApiKey = await getSSMParameter(geminiApiKeyString)
            if (!geminiApiKey) throw new Error("Google API Key not found");

            const response = await fetchWorkoutPlanFromGemini(prompt, geminiApiKey)
            const routine: Routine = response.data!
            const routineId = await saveCompleteWorkoutInfo(db, userId, routine, criteria);
            await completeJobInFirestore(db, jobId, routineId);
        } catch (error) {
            console.error("OpenAI Request Failed:", error);
        }
    }

    return { statusCode: 200 };
}
