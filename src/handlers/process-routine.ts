import { completeJobInFirestore, saveCompleteWorkoutInfo } from "../utils/firestoreMethods";
import { getFirestoreInstance } from "../utils/firestoreUtils";
import { fetchWorkoutPlanFromGemini } from "../services/geminiUtils";
import { getSSMParameter } from "../utils/parameterStore";
const mockWorkoutPlan = require('../../mocks/mockWorkoutPlan.json');

export async function handler(event: any) {
    const db = await getFirestoreInstance();
    
    for (const record of event.Records) {
        const body = JSON.parse(record.body);
        const { criteria, messages, userId, jobId } = body
        try {
            // const routine = mockWorkoutPlan
            // const routine = await fetchWorkoutPlanFromOpenAI(messages, openAIAPIKey);
            const geminiApiKeyString = 'gemini-api-key'
            const geminiApiKey = await getSSMParameter(geminiApiKeyString)
            if (!geminiApiKey) throw new Error("Google API Key not found");

            const response = await fetchWorkoutPlanFromGemini(messages, geminiApiKey)
            const routine = response.data
            console.log("type of generated Workout Plan:", typeof routine);
            const routineId = await saveCompleteWorkoutInfo(db, userId, routine, criteria);
            await completeJobInFirestore(db, jobId, routineId);
        } catch (error) {
            console.error("OpenAI Request Failed:", error);
        }
    }

    return { statusCode: 200 };
}
