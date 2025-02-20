import { GoogleGenerativeAI, SchemaType } from "@google/generative-ai";
import { Routine } from "../interfaces/Routine";

export const fetchWorkoutPlanFromGemini = async (prompt: string, googleAPIKey: string) => {
  try {
    const genAI = new GoogleGenerativeAI(googleAPIKey);

    const schema = {
      description: "Weekly workout plan",
      type: SchemaType.OBJECT,
      properties: {
        title: {
          type: SchemaType.STRING,
          description: "Title of the workout plan",
          nullable: false,
        },
        fitnessLevel: {
          type: SchemaType.STRING,
          description: "The fitness level of the individual",
          nullable: false,
        },
        goal: {
          type: SchemaType.STRING,
          description: "The fitness goal of the individual",
          nullable: false,
        },
        days: {
          type: SchemaType.ARRAY,
          description: "Array of workout days in the week",
          items: {
            type: SchemaType.OBJECT,
            properties: {
              day: {
                type: SchemaType.STRING,
                description: "The day of the week",
                nullable: false,
              },
              dayOfWeek: {
                type: SchemaType.INTEGER,
                description: "The day of the week as a number",
                nullable: false,
              },
              name: {
                type: SchemaType.STRING,
                description: "Muscle group trained on this day",
                nullable: false,
              },
              exercises: {
                type: SchemaType.ARRAY,
                description: "Exercises performed on this day",
                items: {
                  type: SchemaType.OBJECT,
                  properties: {
                    id: {
                      type: SchemaType.STRING,
                      description: "Exercise ID",
                      nullable: false,
                    },
                    name: {
                      type: SchemaType.STRING,
                      description: "Name of the exercise in lowercase",
                      nullable: false,
                    },
                    gifUrl: {
                      type: SchemaType.STRING,
                      description: "URL to the exercise's GIF",
                      nullable: false,
                    },
                    sets: {
                      type: SchemaType.INTEGER,
                      description: "Number of sets",
                      nullable: false,
                    },
                    reps: {
                      type: SchemaType.STRING,
                      description: "Reps range",
                      nullable: false,
                    },
                    rest: {
                      type: SchemaType.STRING,
                      description: "Rest duration",
                      nullable: false,
                    },
                  },
                  required: ["id", "name", "gifUrl", "sets", "reps", "rest"],
                },
              },
            },
            required: ["day", "dayOfWeek", "name", "exercises"],
          },
        },
      },
      required: ["title", "fitnessLevel", "goal", "days"],
    };

    const model = genAI.getGenerativeModel({
      // model: "gemini-1.5-pro",
      model: "gemini-2.0-flash",
      generationConfig: {
        responseMimeType: "application/json",
        responseSchema: schema,
      },
    });

    const result = await model.generateContent({
      contents: [{
        role: "user",
        parts: [{ text: prompt }]
      }]
    });

    const routine: Routine = JSON.parse(result.response.text())
    
    if (!routine)
      throw new Error("No response received from Google Gemini");

    return {
      statusCode: 200,
      message: "Workout plan fetched successfully.",
      data: routine,
    };
  } catch (error: any) {
    console.error("Error fetching from Gemini:", error);
    return {
      statusCode: 500,
      message: `Error retrieving workout plan: ${error.message}`,
    };
  }
};
