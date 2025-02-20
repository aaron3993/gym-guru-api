import { Day, Exercise, ExerciseNamesAndDetails, Routine } from "../interfaces/Routine";

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