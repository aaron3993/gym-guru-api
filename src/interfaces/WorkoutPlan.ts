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