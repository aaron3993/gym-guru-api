import axios from 'axios';
import { Message } from "../interfaces/messages";

export const fetchWorkoutPlanFromOpenAI = async (messages: Message[], openAIAPIKey: string) => {
  try {
    const response = await axios.post(
      "https://api.openai.com/v1/chat/completions",
      {
        model: "gpt-4",
        messages,
        temperature: 0.7,
        max_tokens: 2000,
      },
      {
        headers: {
          Authorization: `Bearer ${openAIAPIKey}`,
          "Content-Type": "application/json",
        },
      }
    );
    const workoutPlan = response.data.choices[0].message.content.trim();
    console.log(workoutPlan)
    return {
      statusCode: 200,
      message: 'Workout plan fetched successfully.',
      data: workoutPlan,
      headers: {
        "Access-Control-Allow-Origin": "http://localhost:3000",
        "Access-Control-Allow-Credentials": "true",
      },
    };
  } catch (error) {
    return {
      statusCode: 500,
      message: `No response received from OpenAI API: ${error}`,
    }
  }
};
