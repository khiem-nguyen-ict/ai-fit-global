
export enum Language {
  EN = 'en',
  VI = 'vi',
  FI = 'fi'
}

export enum ExerciseType {
  SQUAT = 'SQUAT',
  PUSH_UP = 'PUSH_UP',
  LUNGE = 'LUNGE'
}

export interface WeatherInfo {
  temp: number;
  condition: string;
  location: string;
  city: string;
  country: string;
  isCold: boolean;
  humidity?: number;
  windSpeed?: number;
}

export interface WorkoutState {
  reps: number;
  status: 'UP' | 'DOWN' | 'INIT';
  lastFeedback: string;
  currentExercise: ExerciseType;
}

export interface Point {
  x: number;
  y: number;
  z?: number;
}
