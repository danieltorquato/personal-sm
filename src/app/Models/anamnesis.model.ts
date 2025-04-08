export interface Anamnesis {
  id?: number;
  student_id: number;
  weight?: number;
  height?: number;
  age?: number;
  sex?: 'male' | 'female' | 'other';
  smoker?: boolean;
  alcoholic?: boolean;
  physical_activity?: boolean;
  sleep_hours?: number;
  main_complaint?: string;
  medical_history?: string;
  medications?: string;
  surgeries?: string;
  allergies?: string;
  family_history?: string;
  lifestyle?: string;
  created_at?: string;
}

// Interfaces para formulários separados por seção
export interface MedicalHistory {
  main_complaint: string;
  medical_history: string;
  medications: string;
  surgeries: string;
  allergies: string;
  family_history: string;
}

export interface Lifestyle {
  smoker: boolean;
  alcoholic: boolean;
  physical_activity: boolean;
  sleep_hours: number;
  lifestyle: string;
}

export interface PersonalInfo {
  weight: number;
  height: number;
  age: number;
  sex: 'male' | 'female' | 'other';
}
