import { APIGatewayEvent, APIGatewayProxyHandler } from "aws-lambda";
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
    } else {
        allowedOrigins = ["http://localhost:3000", "https://gym-guru-staging.web.app", "https://gymguru-37ed9.web.app"];
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

        const neonDbUrl = 'neon-db-url'
        await getSSMParameter(neonDbUrl)
        if (!neonDbUrl) throw new Error("Rapid API Key not found");

        // connect to db

        // insert to db
        
        return {
            statusCode: 200,
            body: "User successfully registered!",
        };
    } catch (error) {
        console.error("Error inserting user to database: ", error);
        return {
            statusCode: 500,
            body: JSON.stringify({ message: 'Error registering a new user', error }),
        };
    }
};
