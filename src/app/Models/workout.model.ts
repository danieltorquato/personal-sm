export interface ApiResponse<T = any> {
  success: ApiResponse<Workout>;
  status: 'success' | 'error';
  message?: string;
  data?: T;
  error?: any;
}

export interface Exercise {
  id?: number;
  name: string;
  description?: string;
  type: 'swim' | 'run' | 'bike' | 'other';
  distance?: number;
  measurement_unit?: 'meters' | 'kilometers' | 'minutes';
  created_at?: string;
  updated_at?: string;
}

export interface WorkoutSet {
  id?: number;
  workout_id?: number;
  exercise_id: number;
  exercise_name: string;
  exercise_type: 'swim' | 'run' | 'bike' | 'other';
  order: number;
  distance: number;
  repetitions: number;
  target_time?: number;
  rest_time: number;
  created_at?: string;
  updated_at?: string;
}

export interface Workout {
  id?: number;
  name: string;
  description?: string;
  trainer_id: number;
  trainer_name?: string;
  duration?: number;
  difficulty_level?: 'fácil' | 'médio' | 'difícil' | 'avançado';
  total_distance?: number;
  tags?: string;
  is_public?: boolean;
  created_at?: string;
  updated_at?: string;
  sets?: WorkoutSet[];
}

export interface AssignedWorkout {
  id?: number;
  workout_id: number;
  name?: string;
  description?: string;
  student_id: number;
  trainer_id: number;
  student_name?: string;
  trainer_name?: string;
  assigned_date: string;
  due_date?: string;
  status: 'pendente' | 'em_andamento' | 'concluido' | 'cancelado';
  feedback?: string;
  total_distance?: number;
  created_at?: string;
  updated_at?: string;
}

export interface WorkoutSession {
  id?: number;
  assigned_workout_id: number;
  start_time: string;
  end_time?: string;
  total_time?: number;
  total_distance?: number;
  notes?: string;
  status: 'em_andamento' | 'concluido' | 'cancelado';
  created_at?: string;
  updated_at?: string;
  sets_executions?: SetExecution[];
}

export interface SetExecution {
  id?: number;
  session_id: number;
  set_id: number;
  start_time: string;
  end_time?: string;
  total_time?: number;
  status: 'em_andamento' | 'concluido' | 'cancelado';
  created_at?: string;
  updated_at?: string;
  laps?: Lap[];
}

export interface Lap {
  id?: number;
  set_execution_id: number;
  repetition_number: number;
  lap_time: number;
  pace?: string;
  created_at?: string;
  updated_at?: string;
}

export interface WorkoutSummary {
  id: number;
  name: string;
  date: string;
  completedDate?: string;
  startTime?: string;
  endTime?: string;
  total_time: number;
  duration?: number;
  totalTime?: number;
  total_distance: number;
  totalDistance?: number;
  avg_pace: string;
  averagePace?: string;
  exercise_type: 'swim' | 'run' | 'bike' | 'other';
  averageHeartRate?: number;
  calories?: number;
  improvement?: number;
  feedback?: string;
  feedbackTime?: string;
  personalName?: string;
  personalAvatar?: string;
  completedSets?: number;
  totalSets?: number;
  sets?: any[];
}

export interface UserWorkoutStats {
  weekly_workouts: number;
  monthly_workouts: number;
  total_workouts: number;
  total_distance: number;
  total_time: number;
  recent_workouts: WorkoutSummary[];
}
