import axios from "axios";
import { GeminiMessage } from "../interfaces/Messages"

export const fetchWorkoutPlanFromGemini = async (messages: GeminiMessage[], googleAPIKey: string) => {
  try {
    const response = await axios.post(
      `https://generativelanguage.googleapis.com/v1/models/gemini-pro:generateContent?key=${googleAPIKey}`,
      {
        contents: messages.map((msg) => ({
          role: msg.role === "system" ? "model" : msg.role,
          parts: msg.parts,
        })),
      },
      {
        headers: {
          "Content-Type": "application/json",
        },
      }
    );

    const workoutPlan =
      JSON.parse(response.data.candidates?.[0]?.content?.parts?.[0]?.text?.trim())

    if (!workoutPlan)
      throw new Error("No response received from Google Gemini");

    return {
      statusCode: 200,
      message: "Workout plan fetched successfully.",
      data: workoutPlan,
    };
  } catch (error: any) {
    console.error("Error fetching from Gemini:", error);
    return {
      statusCode: 500,
      message: `Error retrieving workout plan: ${error.message}`,
    };
  }
};
