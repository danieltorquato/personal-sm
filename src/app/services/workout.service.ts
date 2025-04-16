import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { Workout, WorkoutSet, AssignedWorkout, WorkoutSession, ApiResponse, Lap } from '../Models/workout.model';

@Injectable({
  providedIn: 'root'
})
export class WorkoutService {
  private apiUrl = environment.apiUrl;

  constructor(
    private http: HttpClient
  ) { }

  /**
   * Cria um novo treino
   */
  createWorkout(workout: Workout): Observable<ApiResponse<{ id: number }>> {
    console.log('Enviando dados para API:', JSON.stringify(workout));

    // Criar um observable personalizado para tratar a resposta com formato incorreto
    return new Observable<ApiResponse<{ id: number }>>(observer => {
      this.http.post(`${this.apiUrl}/workouts/create`, workout, {
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        responseType: 'text' // Importante: obter resposta como texto para processamento manual
      }).subscribe({
        next: (rawResponse: string) => {
          try {
            // Verificar se a resposta contém dois objetos JSON concatenados
            if (rawResponse.includes('}{')) {
              console.log('Resposta com problema de formatação detectada, corrigindo...');
              // Encontrar a posição da concatenação
              const splitIndex = rawResponse.indexOf('}{');
              // Obter o segundo objeto JSON (a resposta real da API)
              const fixedJson = rawResponse.substring(splitIndex + 1);

              // Converter para objeto
              const parsedResponse = JSON.parse(fixedJson) as ApiResponse<{ id: number }>;
              observer.next(parsedResponse);
              observer.complete();
            } else {
              // Resposta normal, apenas fazer o parse
              const parsedResponse = JSON.parse(rawResponse) as ApiResponse<{ id: number }>;
              observer.next(parsedResponse);
              observer.complete();
            }
          } catch (error) {
            console.error('Erro ao processar resposta da API:', error);
            console.log('Resposta bruta:', rawResponse);
            observer.error(error);
          }
        },
        error: (err) => {
          console.error('Erro na requisição:', err);
          observer.error(err);
        }
      });
    });
  }

  /**
   * Atualiza um treino existente
   */
  updateWorkout(workout: Partial<Workout>): Observable<ApiResponse<null>> {
    return this.http.put<ApiResponse<null>>(`${this.apiUrl}/workouts/update`, workout);
  }

  /**
   * Obtém um treino por ID
   */
  getWorkout(id: number): Observable<ApiResponse<Workout>> {
    return this.http.get<ApiResponse<Workout>>(`${this.apiUrl}/workouts/get?id=${id}`);
  }

  /**
   * Lista todos os treinos disponíveis
   */
  listWorkouts(): Observable<ApiResponse<Workout[]>> {
    return this.http.get<ApiResponse<Workout[]>>(`${this.apiUrl}/workouts/list`);
  }

  /**
   * Atribui um treino a um aluno
   */
  assignWorkout(workout_id: number, student_id: number, due_date?: string): Observable<ApiResponse<{ id: number }>> {
    return this.http.post<ApiResponse<{ id: number }>>(`${this.apiUrl}/workouts/assign`, {
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
    return this.http.get<ApiResponse<AssignedWorkout[]>>(`${this.apiUrl}/workouts/assigned-list`, { params });
  }

  /**
   * Inicia uma sessão de treino
   */
  startWorkoutSession(assigned_workout_id: number): Observable<ApiResponse<{ session_id: number }>> {
    return this.http.post<ApiResponse<{ session_id: number }>>(`${this.apiUrl}/workouts/start`, {
      assigned_workout_id
    });
  }

  /**
   * Finaliza uma sessão de treino
   */
  finishWorkoutSession(session_id: number, total_time: number, total_distance: number, notes?: string): Observable<ApiResponse<null>> {
    return this.http.post<ApiResponse<null>>(`${this.apiUrl}/workouts/finish`, {
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
    return this.http.post<ApiResponse<{ id: number }>>(`${this.apiUrl}/workouts/record-lap`, {
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
    return this.http.get<ApiResponse<WorkoutSession>>(`${this.apiUrl}/workouts/session?session_id=${session_id}`);
  }

  // Obter todos os exercícios (com filtro opcional de tipo)
  getAllExercises(type?: string): Observable<any> {
    const url = type
      ? `${this.apiUrl}/exercises/list?type=${type}`
      : `${this.apiUrl}/exercises/list`;

    return this.http.get(url);
  }

  // Obter todos os treinos (com filtro opcional de usuário)
  getAllWorkouts(userId?: number): Observable<any> {
    const url = userId
      ? `${this.apiUrl}/workouts/list?user_id=${userId}`
      : `${this.apiUrl}/workouts/list`;

    return this.http.get(url);
  }

  // Verificar se um aluno tem treinos ativos
  checkActiveWorkouts(studentId: number): Observable<any> {
    return this.http.get(`${this.apiUrl}/workouts/check-active?student_id=${studentId}`);
  }

  // Desativar treinos anteriores do aluno
  deactivatePreviousWorkouts(studentId: number): Observable<any> {
    return this.http.post(`${this.apiUrl}/workouts/deactivate-previous`, { student_id: studentId });
  }

  // Excluir um treino
  deleteWorkout(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/workouts/delete?id=${id}`);
  }

  // Adicionar um exercício ao treino
  addExerciseToWorkout(workoutId: number, exerciseId: number, data: any): Observable<any> {
    const payload = {
      workout_id: workoutId,
      exercise_id: exerciseId,
      sets: data.sets || 1,
      reps: data.reps || 10,
      rest_seconds: data.rest_seconds || 60,
      duration_seconds: data.duration_seconds || null,
      order_index: data.order_index || 1
    };

    return this.http.post(`${this.apiUrl}/workouts/add-exercise`, payload);
  }

  // Atualizar exercício de um treino
  updateExerciseInWorkout(workoutSetId: number, data: any): Observable<any> {
    const payload = {
      workout_set_id: workoutSetId,
      sets: data.sets || 1,
      reps: data.reps || 10,
      rest_seconds: data.rest_seconds || 60,
      duration_seconds: data.duration_seconds || null,
      order_index: data.order_index || 1
    };

    return this.http.put(`${this.apiUrl}/workouts/update-exercise`, payload);
  }

  // Remover exercício de um treino
  removeExerciseFromWorkout(workoutSetId: number): Observable<any> {
    const payload = {
      workout_set_id: workoutSetId
    };

    return this.http.post(`${this.apiUrl}/workouts/remove-exercise`, payload);
  }
}
