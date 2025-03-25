export interface User {
  id?: number;
  name: string;
  email: string;
  type_id: number;
  type_name: 'admin' | 'trainer' | 'student';
  phone?: string;
  profile_image?: string;
  birth_date?: string;
  gender?: 'masculino' | 'feminino' | 'outro';
  height?: number;
  weight?: number;
  experience_level?: 'iniciante' | 'intermediario' | 'avancado';
  trainer_id?: number;
  trainer_name?: string;
  created_at?: string;
  updated_at?: string;
  token?: string;
}

export interface UserSettings {
  user_id: number;
  theme: string;
  notification_enabled: boolean;
  sound_enabled: boolean;
  language: string;
  pool_length: number;
}

export interface LoginResponse {
  status: 'success' | 'error';
  message?: string;
  data?: User;
  token?: string;
}

export interface RegisterData {
  name: string;
  email: string;
  password: string;
  password_confirmation: string;
  type_id?: number;
  phone?: string;
  birth_date?: string;
  gender?: 'masculino' | 'feminino' | 'outro';
  trainer_code?: string; // Código de convite para vincular ao personal
}

export interface LoginData {
  email: string;
  password: string;
  remember_me?: boolean;
}

export interface UserMetrics {
  id: number;
  user_id: number;
  weight: number;
  height: number;
  body_fat?: number;
  muscle_mass?: number;
  resting_heart_rate?: number;
  date: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}
