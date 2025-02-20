import { Timestamp } from "firebase-admin/firestore";
import { Day, Exercise, Routine, WorkoutCriteria } from "../interfaces/Routine";

export const saveCompleteWorkoutInfo = async (db: FirebaseFirestore.Firestore, userId: string, routine: Routine, workoutCriteria: WorkoutCriteria) => {
    const batch = db.batch();

    try {
        const userRef = db.collection("users").doc(userId);
        batch.set(userRef, workoutCriteria, { merge: true });

        const routineRef = db.collection("routines").doc();
        const routineData = {
        title: routine.title,
        fitnessLevel: routine.fitnessLevel,
        goal: routine.goal,
        userId: userId,
        createdAt: Timestamp.now(),
        };
        batch.set(routineRef, routineData);

        routine.days.forEach((day: Day) => {
        const workoutRef = db.collection("workouts").doc();
        const workoutData = {
            name: day.name,
            day: day.day,
            dayOfWeek: day.dayOfWeek,
            routineId: routineRef.id,
            userId,
            exercises:
            day.name.toLowerCase() === "rest"
                ? []
                : day.exercises.map((exercise: Exercise) => ({
                    id: exercise.id,
                    name: exercise.name,
                    gifUrl: exercise.gifUrl,
                    sets: exercise.sets,
                    reps: exercise.reps,
                    rest: exercise.rest,
                })),
            createdAt: Timestamp.now(),
        };
        batch.set(workoutRef, workoutData);
        });

        await batch.commit();
        return routineRef.id;
    } catch (error) {
        console.error("Error saving complete workout info:", error);
        throw new Error("Failed to save complete workout info.");
    }
};

export const completeJobInFirestore = async (db: FirebaseFirestore.Firestore, jobId: string, routineId: string) => {
    try {
      const jobRef = db.collection("jobs").doc(jobId);

      await jobRef.update({
        endTime: new Date().toISOString(),
        status: "completed",
        routineId,
      });
    } catch (error) {
      console.error("Error updating job in Firestore:", error);
      throw error;
    }
};
