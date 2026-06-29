export interface User {
  id: string;
  email: string;
  name: string;
  createdAt: string;
}

export interface UserSettings {
  id: string;
  userId: string;
  units: 'KG' | 'LB';
  workoutDayPattern: 'MWF' | 'TThSa' | 'CUSTOM';
  customWorkoutDays: number[];
  darkMode: boolean;
  alternateExercise: 'POWER_CLEAN' | 'BARBELL_ROW' | 'CHINUPS';
  autoReduceDeadliftIncrement: boolean;
  restTimerSeconds: number;
  squatIncrement: number;
  benchIncrement: number;
  ohpIncrement: number;
  deadliftIncrement: number;
  powerCleanIncrement: number;
}
