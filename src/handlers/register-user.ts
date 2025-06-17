import { APIGatewayEvent, APIGatewayProxyHandler } from "aws-lambda";
import { initializeFirebase, verifyToken } from "../utils/firestoreUtils";
import { getDbPool } from "../database/neonClient";

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
        
        if (!event.body) {
            return {
              statusCode: 400,
              headers: {
                  "Content-Type": "application/json",
                  "Access-Control-Allow-Origin": origin && allowedOrigins.includes(origin) ? origin : allowedOrigins[0],
                  "Access-Control-Allow-Methods": "POST, OPTIONS",
                  "Access-Control-Allow-Headers": "Content-Type, Authorization",
                  "Access-Control-Allow-Credentials": "true",
              },
              body: JSON.stringify({ message: "Request body is missing or empty" }),
            };
          }
      
        const { userId, email } = JSON.parse(event.body);

        const pool = await getDbPool();
        
        const result = await pool.query(
            'INSERT INTO users (id, email) VALUES ($1, $2) RETURNING *',
            [userId, email]
        );
        
        return {
            statusCode: 200,
            headers: {
                "Content-Type": "application/json",
                "Access-Control-Allow-Origin": origin && allowedOrigins.includes(origin) ? origin : allowedOrigins[0],
                "Access-Control-Allow-Methods": "GET, OPTIONS",
                "Access-Control-Allow-Headers": "Content-Type, Authorization",
                "Access-Control-Allow-Credentials": "true",
            },
            body: JSON.stringify({ 
                message: 'User successfully registered!',
                user: result.rows[0]
            }),
        };
    } catch (error) {
        console.error("Error inserting user to database: ", error);
        return {
            statusCode: 500,
            headers: {
                "Content-Type": "application/json",
                "Access-Control-Allow-Origin": origin && allowedOrigins.includes(origin) ? origin : allowedOrigins[0],
                "Access-Control-Allow-Methods": "GET, OPTIONS",
                "Access-Control-Allow-Headers": "Content-Type, Authorization",
                "Access-Control-Allow-Credentials": "true",
            },
            body: JSON.stringify({ message: 'Error registering a new user', error }),
        };
    }
};
