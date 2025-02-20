import { GoogleGenerativeAI, SchemaType } from "@google/generative-ai";
import { ExerciseNamesAndDetails, Routine, WorkoutCriteria } from "../interfaces/Routine";
import { formatExercisesForInput, formatGoalsAndFitnessLevelsText } from "../utils/routineUtils";

export const fetchWorkoutPlanFromGemini = async (criteria: WorkoutCriteria, exerciseDetails: ExerciseNamesAndDetails, googleAPIKey: string) => {
  try {
    const genAI = new GoogleGenerativeAI(googleAPIKey);

    const exerciseNamesString = formatExercisesForInput(exerciseDetails);
    
    const prompt = `
    Create a structured JSON format for a weekly workout plan for someone whose goal is ${
      criteria.goal
    } and fitness level is ${criteria.fitnessLevel}.
    Only output the JSON and no other text.
    Use the following exercises in your plan:
    
    ${exerciseNamesString}
    
    The format should include:
    - title: ${criteria.fitnessLevel} ${formatGoalsAndFitnessLevelsText(
    criteria.goal
  )} Routine (Capitalize first letters)
    - fitnessLevel
    - goal
    - days. Each day has the following attributes:
      - day: e.g., "Monday"
      - dayOfWeek: e.g., 1
      - name: Muscle group trained
      - exercises: An array of 4-7 exercises per weight training day. Each exercise should have the following attributes:
        - id: Empty string
        - name: The name of the exercise in lowercase
        - gifUrl: Empty string
        - sets: The number of sets (integer)
        - reps: A string to represent the range of reps (e.g., "8-12")
        - rest: The rest duration (e.g., "60 seconds")
      - Rest days should have an empty exercises array.
      - Include cardio where necessary.
    `;

    const outputSchema = {
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
        responseSchema: outputSchema,
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
