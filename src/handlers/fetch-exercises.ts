import { APIGatewayEvent, APIGatewayProxyHandler } from "aws-lambda";
import axios from "axios";
import { getSSMParameter } from "../utils/parameterStore";
import { initializeFirebase, verifyToken } from "../utils/firestoreUtils";

export const handler: APIGatewayProxyHandler = async (event: APIGatewayEvent) => {
    const origin: string | undefined = event.headers?.origin;

    const stage = process.env.STAGE;
    let allowedOrigins: string[];

    if (stage === 'production') {
        allowedOrigins = ["https://gymguru-37ed9.web.app"];
    } else if (stage === 'staging') {
        allowedOrigins = ["http://localhost:3000", "https://gym-guru-staging.web.app"];
    } else { // Default or development
        allowedOrigins = ["http://localhost:3000", "https://gym-guru-staging.web.app", "https://gymguru-37ed9.web.app"]; // Or a more restrictive default
    }

    try {
        if (!event.headers?.Authorization) {
            return {
                statusCode: 400,
                headers: {
                    "Content-Type": "application/json",
                    "Access-Control-Allow-Origin": origin && allowedOrigins.includes(origin) ? origin : allowedOrigins[0],
                    "Access-Control-Allow-Methods": "GET, OPTIONS",
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
                headers: {
                    "Content-Type": "application/json",
                    "Access-Control-Allow-Origin": origin && allowedOrigins.includes(origin) ? origin : allowedOrigins[0],
                    "Access-Control-Allow-Methods": "GET, OPTIONS",
                    "Access-Control-Allow-Headers": "Content-Type, Authorization",
                    "Access-Control-Allow-Credentials": "true",
                },
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
                "Access-Control-Allow-Origin": origin && allowedOrigins.includes(origin) ? origin : allowedOrigins[0],
                "Access-Control-Allow-Methods": "GET, OPTIONS",
                "Access-Control-Allow-Headers": "Content-Type, Authorization",
                "Access-Control-Allow-Credentials": "true",
            },
        };
    } catch (error) {
        console.error("Error in fetchAllExercises:", error);
        return {
            statusCode: 500,
            headers: {
                "Content-Type": "application/json",
                "Access-Control-Allow-Origin": origin && allowedOrigins.includes(origin) ? origin : allowedOrigins[0],
                "Access-Control-Allow-Methods": "GET, OPTIONS",
                "Access-Control-Allow-Headers": "Content-Type, Authorization",
                "Access-Control-Allow-Credentials": "true",
            },
            body: JSON.stringify({ message: 'Error fetching all exercises', error }),
        };
    }
};
