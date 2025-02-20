import { Day, Exercise, ExerciseNamesAndDetails, GoalMapping, Routine } from "../interfaces/Routine";

export const addExerciseDetailsToRoutine = (routineWithoutGifUrls: Routine, exerciseDetails: ExerciseNamesAndDetails) => {
    return {
      ...routineWithoutGifUrls,
      days: routineWithoutGifUrls.days.map((day: Day) => ({
        ...day,
        exercises:
          day.exercises.length > 0
            ? day.exercises.map((exercise: Exercise) => {
                const exerciseDetail = exerciseDetails[exercise.name] || {};
                return {
                  ...exercise,
                  id: exerciseDetail.id || "",
                  gifUrl: exerciseDetail.gifUrl || "",
                };
              })
            : [],
      })),
    };
};

export const formatGoalsAndFitnessLevelsText = (text: string) => {
    const goalMapping: GoalMapping = {
      weightLoss: "Weight Loss",
      muscleGain: "Muscle Gain",
      generalFitness: "General Fitness",
    };
  
    if (!text) return text;
    if (goalMapping[text]) return goalMapping[text];
    return text
      .toLowerCase()
      .replace(/(?:^|\s)\w/g, (match) => match.toUpperCase());
};
  
export const formatExercisesForInput = (exerciseDetails: ExerciseNamesAndDetails) => {
    return Object.keys(exerciseDetails).join(",");
};
  