export interface ExerciseDetail {
  id: string;
  gifUrl: string;
}

export interface ExerciseNamesAndDetails {
  [exerciseName: string]: ExerciseDetail;
}

export interface WorkoutCriteria {
  goal: string;
  fitnessLevel: string;
}

export interface GoalMapping {
  [key: string]: string;
}

export interface Exercise {
  id: string;
  name: string;
  gifUrl: string;
  sets: number;
  reps: string;
  rest: string;
}

export interface Day {
  day: string;
  dayOfWeek: number;
  name: string;
  exercises: Exercise[];
}

export interface Routine {
  title: string;
  fitnessLevel: string;
  goal: string;
  days: Day[];
}