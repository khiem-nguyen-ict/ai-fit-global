
export enum Language {
  EN = 'en',
  VI = 'vi',
  FI = 'fi',
  ES = 'es',
  ZH = 'zh',
  JA = 'ja'
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
  isCold: boolean;
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
