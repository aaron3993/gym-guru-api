import { SSMClient, GetParameterCommand } from "@aws-sdk/client-ssm";

const region = process.env.AWS_REGION || "us-east-1";
const ssmClient = new SSMClient({ region });

export const getSSMParameter = async (parameterName: string): Promise<string> => {
  try {
    // Get the current stage from environment variables
    // Default to staging for local development
    const stage = process.env.STAGE === "production" ? "production" : "staging";
    
    // Format the parameter name to include the stage
    const formattedParameterName = `/${stage}/${parameterName}`;
    
    const command = new GetParameterCommand({
      Name: formattedParameterName,
      WithDecryption: true,
    });
    
    const response = await ssmClient.send(command);
    if (response.Parameter?.Value) {
      return response.Parameter.Value;
    } else {
      throw new Error(`Parameter not found: ${formattedParameterName}`);
    }
  } catch (error) {
    console.error(`Error retrieving SSM parameter "${parameterName}":`, error);
    throw new Error("Failed to retrieve SSM parameter");
  }
}; 