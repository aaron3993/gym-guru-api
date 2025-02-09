import axios from 'axios';
import { Message } from "../interfaces/messages";

// Function to fetch workout plan from OpenAI with refined error handling
export const fetchWorkoutPlanFromOpenAI = async (messages: Message[]) => {
  try {
    if (process.env.OPENAI_API_KEY) {
      console.log('api key exists')
    } else {
      console.log('no api key found')
    }
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
          Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
          "Content-Type": "application/json",
        },
      }
    );

    return {
      statusCode: 200,
      message: 'Workout plan fetched successfully.',
      data: response.data,
    };
  } catch (error) {
    return {
      statusCode: 500,
      message: `No response received from OpenAI API: ${error}`,
    }
  }
};
