import { APIGatewayEvent, APIGatewayProxyHandler } from "aws-lambda";
import axios from "axios";
import { getSSMParameter } from "../utils/parameterStore";
import { initializeFirebase, verifyToken } from "../utils/firestoreUtils";

export const handler: APIGatewayProxyHandler = async (event: APIGatewayEvent) => {
    const origin: string | undefined = event.headers?.origin;

    const allowedOrigins: string[] = ["http://localhost:3000", "https://gymguru-37ed9.web.app"];

    try {
        if (!event.headers?.Authorization) {
            return {
                statusCode: 400,
                headers: {
                    "Content-Type": "application/json",
                    "Access-Control-Allow-Origin": origin && allowedOrigins.includes(origin) ? origin : "https://gymguru-37ed9.web.app/",
                    "Access-Control-Allow-Methods": "POST, OPTIONS",
                    "Access-Control-Allow-Headers": "Content-Type, Authorization",
                    "Access-Control-Allow-Credentials": "true",
                },
                body: JSON.stringify({ message: 'Authorization header missing' }),
            };
        }
    
        await initializeFirebase()

        const token = event.headers.Authorization?.split('Bearer ')[1];

        if (!token) {
            return {
                statusCode: 403,
                body: JSON.stringify({ message: 'Unauthorized' }),
            };
        }

        await verifyToken(token);

        const rapidApiKeyString = "rapid-api-key";
        const rapidApiKey = await getSSMParameter(rapidApiKeyString);
        if (!rapidApiKey) throw new Error("Rapid API Key not found");

        const options = {
            params: { limit: "1323" },
            headers: {
                "X-RapidAPI-Key": rapidApiKey,
                "X-RapidAPI-Host": "exercisedb.p.rapidapi.com",
            },
        };

        const response = await axios.get("https://exercisedb.p.rapidapi.com/exercises", options);
        return {
            statusCode: 200,
            body: JSON.stringify(response.data),
            headers: {
                "Content-Type": "application/json",
                "Access-Control-Allow-Origin": origin && allowedOrigins.includes(origin) ? origin : "https://gymguru-37ed9.web.app/",
                "Access-Control-Allow-Methods": "POST, OPTIONS",
                "Access-Control-Allow-Headers": "Content-Type, Authorization",
                "Access-Control-Allow-Credentials": "true",
            },
        };
    } catch (error) {
        console.error("Error in fetchAllExercises:", error);
        return {
            statusCode: 500,
            body: JSON.stringify({ message: 'Error fetching all exercises', error }),
        };
    }
};
