import { Injectable } from '@angular/core';
import { ApiService } from './api.service';
import { Observable } from 'rxjs';
import { Workout, WorkoutSet, AssignedWorkout, WorkoutSession, ApiResponse, Lap } from '../Models/workout.model';

@Injectable({
  providedIn: 'root'
})
export class WorkoutService {
  constructor(private apiService: ApiService) { }

  /**
   * Cria um novo treino
   */
  createWorkout(workout: Workout): Observable<ApiResponse<{ id: number }>> {
    return this.apiService.post<ApiResponse<{ id: number }>>('workouts/create', workout);
  }

  /**
   * Atualiza um treino existente
   */
  updateWorkout(workout: Partial<Workout>): Observable<ApiResponse<null>> {
    return this.apiService.put<ApiResponse<null>>('workouts/update', workout);
  }

  /**
   * Obtém um treino por ID
   */
  getWorkout(id: number): Observable<ApiResponse<Workout>> {
    return this.apiService.get<ApiResponse<Workout>>('workouts/get', { id });
  }

  /**
   * Lista todos os treinos disponíveis
   */
  listWorkouts(): Observable<ApiResponse<Workout[]>> {
    return this.apiService.get<ApiResponse<Workout[]>>('workouts/list');
  }

  /**
   * Atribui um treino a um aluno
   */
  assignWorkout(workout_id: number, student_id: number, due_date?: string): Observable<ApiResponse<{ id: number }>> {
    return this.apiService.post<ApiResponse<{ id: number }>>('workouts/assign', {
      workout_id,
      student_id,
      due_date
    });
  }

  /**
   * Lista os treinos atribuídos a um aluno
   */
  listAssignedWorkouts(student_id?: number): Observable<ApiResponse<AssignedWorkout[]>> {
    const params: any = {};
    if (student_id) {
      params.student_id = student_id;
    }
    return this.apiService.get<ApiResponse<AssignedWorkout[]>>('workouts/assigned-list', params);
  }

  /**
   * Inicia uma sessão de treino
   */
  startWorkoutSession(assigned_workout_id: number): Observable<ApiResponse<{ session_id: number }>> {
    return this.apiService.post<ApiResponse<{ session_id: number }>>('workouts/start', {
      assigned_workout_id
    });
  }

  /**
   * Finaliza uma sessão de treino
   */
  finishWorkoutSession(session_id: number, total_time: number, total_distance: number, notes?: string): Observable<ApiResponse<null>> {
    return this.apiService.post<ApiResponse<null>>('workouts/finish', {
      session_id,
      total_time,
      total_distance,
      notes
    });
  }

  /**
   * Registra uma volta durante o treino
   */
  recordLap(set_execution_id: number, repetition_number: number, lap_time: number): Observable<ApiResponse<{ id: number }>> {
    return this.apiService.post<ApiResponse<{ id: number }>>('workouts/record-lap', {
      set_execution_id,
      repetition_number,
      lap_time
    });
  }

  /**
   * Formata o tempo para exibição (mm:ss)
   */
  formatTime(timeInSeconds: number): string {
    const minutes = Math.floor(timeInSeconds / 60);
    const seconds = timeInSeconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  }

  /**
   * Calcula o ritmo médio (tempo por 100m)
   */
  calculatePace(timeInSeconds: number, distanceInMeters: number): string {
    if (distanceInMeters === 0) return '00:00';
    const paceSeconds = (timeInSeconds / distanceInMeters) * 100;
    return this.formatTime(Math.round(paceSeconds));
  }

  /**
   * Obtém uma sessão de treino por ID
   */
  getWorkoutSession(session_id: number): Observable<ApiResponse<WorkoutSession>> {
    return this.apiService.get<ApiResponse<WorkoutSession>>('workouts/session', { session_id });
  }
}
