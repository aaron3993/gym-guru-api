import { getSecretByName } from "../utils/secretsManager";
import { fetchWorkoutPlanFromOpenAI } from "../services/openaiUtils";

export async function handler(event: any) {
    const openAISecretName = 'openai-api-key';
    const openAISecretString = await getSecretByName(openAISecretName);
    const openAISecrets = JSON.parse(openAISecretString);
    const openAIAPIKey: string = openAISecrets.OPENAI_API_KEY;

    for (const record of event.Records) {
        const body = JSON.parse(record.body);
        const messages = body.prompt.messages
        try {
            await fetchWorkoutPlanFromOpenAI(messages, openAIAPIKey);
        } catch (error) {
            console.error("OpenAI Request Failed:", error);
        }
    }

    return { statusCode: 200 };
}
