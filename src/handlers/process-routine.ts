import { completeJobInFirestore, saveCompleteWorkoutInfo } from "../utils/firestoreMethods";
import { getFirestoreInstance } from "../utils/firestoreUtils";
import { fetchWorkoutPlanFromGemini } from "../services/geminiUtils";
import { getSSMParameter } from "../utils/parameterStore";
import { Routine } from "../interfaces/Routine";
import { SQSEvent } from "aws-lambda";
import { addExerciseDetailsToRoutine } from "../utils/routineUtils";

export async function handler(event: SQSEvent) {
    const db = await getFirestoreInstance();
    
    for (const record of event.Records) {
        const body = JSON.parse(record.body);
        const { criteria, prompt, exerciseDetails, userId, jobId } = body

        try {
            const geminiApiKeyString = 'gemini-api-key'
            const geminiApiKey = await getSSMParameter(geminiApiKeyString)
            if (!geminiApiKey) throw new Error("Google API Key not found");

            const response = await fetchWorkoutPlanFromGemini(prompt, geminiApiKey)
            const routineWithoutDetails = response.data
            if (!routineWithoutDetails) throw new Error("No routine fetched from Gemini");

            const routine: Routine = addExerciseDetailsToRoutine(routineWithoutDetails, exerciseDetails);
            if (!routine) throw new Error("Failed to generate routine. Routine data is missing or invalid.");

            const routineId = await saveCompleteWorkoutInfo(db, userId, routine, criteria);
            
            await completeJobInFirestore(db, jobId, routineId);
        } catch (error) {
            console.error("Gemini Request Failed:", error);
        }
    }

    return { statusCode: 200 };
}
