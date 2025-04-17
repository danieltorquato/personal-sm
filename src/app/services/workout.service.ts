import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { Workout, WorkoutSet, AssignedWorkout, WorkoutSession, ApiResponse, Lap } from '../Models/workout.model';
import { catchError, throwError } from 'rxjs';

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

    const url = `${this.apiUrl}/pupil/workout-active`;
    console.log('Chamando getWorkout URL:', url);

    return new Observable<ApiResponse<Workout>>(observer => {
      this.http.get(url).subscribe({
        next: (response: any) => {
          console.log('Resposta bruta getWorkout:', response);

          try {
            // Compatibilidade com diferentes formatos de resposta
            // Alguns endpoints usam 'success', outros usam 'status: success'
            const isSuccess = response.success === true || response.status === 'success';

            if (isSuccess && response.data) {
              // Converter para formato padrão da API
              const normalizedResponse = {
                success: true,
                message: response.message || 'Treino obtido com sucesso',
                data: response.data
              } as ApiResponse<Workout>;
              id = response.data.id
              // Garantir que exercises seja um array
              if (normalizedResponse.data && normalizedResponse.data.exercises === undefined) {
                normalizedResponse.data.exercises = [];
              }

              observer.next(normalizedResponse);
              observer.complete();
            } else {
              console.error('Dados inválidos na resposta:', response);

              // Criar resposta de erro com uma estrutura compatível com o modelo Workout
              const mockWorkout: Partial<Workout> = {

                name: 'Treino não disponível',
                type: 'Indisponível',
                notes: 'Houve um erro ao buscar este treino',
                exercises: []
              };

              const mockResponse = {
                success: false,
                message: 'Não foi possível obter os detalhes do treino',
                data: mockWorkout as Workout
              } as ApiResponse<Workout>;

              observer.next(mockResponse);
              observer.complete();
            }
          } catch (error) {
            console.error('Erro ao processar resposta:', error);
            observer.error(new Error('Erro ao processar resposta do servidor'));
          }
        },
        error: (err) => {
          console.error('Erro na requisição getWorkout:', err);
          observer.error(err);
        }
      });
    });
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

  /**
   * Obtém todos os treinos (ou treinos de um usuário específico)
   * Filtra apenas treinos ativos (situation='ativo')
   */
  getAllWorkouts(userId?: number): Observable<ApiResponse<Workout[]>> {
    let url: string;

    if (userId) {
      // Tentar o endpoint correto para listar treinos por usuário
      // Adicionando parâmetro para filtrar apenas treinos ativos
      url = `${this.apiUrl}/workouts/list?user_id=${userId}&situation=ativo`;
    } else {
      // Endpoint para listar todos os treinos ativos
      url = `${this.apiUrl}/workouts/list?situation=ativo`;
    }

    console.log('Chamando getAllWorkouts URL:', url);

    return new Observable<ApiResponse<Workout[]>>(observer => {
      this.http.get(url).pipe(
        catchError((error) => {
          // Se receber 404, tentar endpoint alternativo
          if (error.status === 404 && userId) {
            console.log('Endpoint não encontrado, tentando alternativa...');
            const alternativeUrl = `${this.apiUrl}/workouts/list-by-user?user_id=${userId}&situation=ativo`;
            console.log('Tentando endpoint alternativo:', alternativeUrl);
            return this.http.get(alternativeUrl);
          }
          return throwError(() => error);
        })
      ).subscribe({
        next: (response: any) => {
          console.log('Resposta bruta getAllWorkouts:', response);

          try {
            // Compatibilidade com diferentes formatos de resposta
            const isSuccess = response.success === true || response.status === 'success';

            if (isSuccess && response.data) {
              // Garantir que temos um array de treinos
              let workouts = Array.isArray(response.data) ? response.data : [response.data];

              // Filtrar apenas treinos ativos, caso o backend não tenha feito isso
              workouts = workouts.filter((workout: any) =>
                workout.situation === 'ativo' || workout.status === 'ativo');

              // Converter para formato padrão da API
              const normalizedResponse = {
                success: true,
                status: 'success',
                message: response.message || 'Treinos obtidos com sucesso',
                data: workouts
              } as ApiResponse<Workout[]>;

              observer.next(normalizedResponse);
              observer.complete();
            } else {
              console.error('Dados inválidos na resposta getAllWorkouts:', response);

              // Criar resposta vazia mas válida
              const emptyResponse: ApiResponse<Workout[]> = {
                success: false,
                status: 'error',
                message: 'Não foi possível obter a lista de treinos',
                data: []
              };

              observer.next(emptyResponse);
              observer.complete();
            }
          } catch (error) {
            console.error('Erro ao processar resposta:', error);
            observer.error(new Error('Erro ao processar resposta do servidor'));
          }
        },
        error: (err) => {
          console.error('Erro na requisição getAllWorkouts:', err);
          observer.error(err);
        }
      });
    });
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

  // Método para fazer upload de mídia para um exercício
  updateExerciseMedia(exerciseId: number, formData: FormData): Observable<any> {
    // Certificar que o exercise_id está no FormData com o nome correto
    if (!formData.has('exercise_id')) {
      formData.append('exercise_id', exerciseId.toString());
    }
    console.log('enviando mídia para o exercício', formData);
    console.log('exercise_id:', exerciseId);

    // Verifica se formData tem os dados necessários
    console.log('FormData contém exercise_id:', formData.has('exercise_id'));
    console.log('FormData contém image:', formData.has('image'));
    console.log('FormData contém video:', formData.has('video'));

    // Atualizar URL para apontar para o endpoint correto
    return this.http.post(`${this.apiUrl}/workouts/upload-exercise-media`, formData);
  }

  // Converte URL de dados Blob para Blob
  dataURLtoBlob(dataURL: string): Observable<Blob> {
    return new Observable<Blob>((observer) => {
      try {
        // Extrair o tipo e os dados da URL do blob
        if (dataURL.startsWith('blob:')) {
          // Se é uma URL blob real, precisamos buscar o blob
          fetch(dataURL)
            .then(response => response.blob())
            .then(blob => {
              observer.next(blob);
              observer.complete();
            })
            .catch(error => observer.error(error));
        } else if (dataURL.startsWith('data:')) {
          // Se é uma URL de dados, podemos convertê-la diretamente
          const arr = dataURL.split(',');
          const mimeMatch = arr[0].match(/:(.*?);/);
          if (!mimeMatch || !mimeMatch[1]) {
            observer.error(new Error('MIME type não encontrado na URL de dados'));
            return;
          }
          const mime = mimeMatch[1];
          const bstr = atob(arr[1]);
          let n = bstr.length;
          const u8arr = new Uint8Array(n);

          while(n--) {
            u8arr[n] = bstr.charCodeAt(n);
          }

          observer.next(new Blob([u8arr], {type: mime}));
          observer.complete();
        } else {
          observer.error(new Error('URL de dados inválida'));
        }
      } catch (error) {
        observer.error(error);
      }
    });
  }

  /**
   * Obtém o treino ativo de um usuário específico
   * @param userId ID do usuário/aluno
   * @returns Observable com o treino ativo
   */
  getActiveWorkout(type: string): Observable<ApiResponse<Workout>> {
    if (!type) {
      console.error('getActiveWorkout chamado sem ID de usuário válido');
      throw new Error('ID do usuário é obrigatório');
    }

    const url = `${this.apiUrl}/pupil/workout-active?type=${type}`;
    console.log('Chamando getActiveWorkout URL:', url);

    return new Observable<ApiResponse<Workout>>(observer => {
      this.http.get(url).subscribe({
        next: (response: any) => {
          console.log('Resposta bruta getActiveWorkout:', response);

          try {
            // Verificar se a resposta foi bem-sucedida
            const isSuccess = response.success === true || response.status === 'success';

            if (isSuccess && response.data) {
              // Converter para formato padrão da API
              const normalizedResponse = {
                success: true,
                status: 'success',
                message: response.message || 'Treino ativo obtido com sucesso',
                data: response.data
              } as ApiResponse<Workout>;

              // Garantir que exercises seja um array
              if (normalizedResponse.data && normalizedResponse.data.exercises === undefined) {
                normalizedResponse.data.exercises = [];
              }

              observer.next(normalizedResponse);
              observer.complete();
            } else {
              console.warn('Nenhum treino ativo encontrado:', response);

              // Criar resposta vazia mas válida
              const emptyResponse = {
                success: false,
                status: 'error',
                message: 'Nenhum treino ativo encontrado para este usuário',
                data: null
              } as unknown as ApiResponse<Workout>;

              observer.next(emptyResponse);
              observer.complete();
            }
          } catch (error) {
            console.error('Erro ao processar resposta:', error);
            observer.error(new Error('Erro ao processar resposta do servidor'));
          }
        },
        error: (err) => {
          console.error('Erro na requisição getActiveWorkout:', err);
          observer.error(err);
        }
      });
    });
  }
  getSetsWorkout(workoutId: number): Observable<ApiResponse<any[]>> {
    const url = `${this.apiUrl}/pupil/sets?workout_id=${workoutId}`;
    console.log('Chamando getSetsWorkout URL:', url);

    return new Observable<ApiResponse<any[]>>(observer => {
      this.http.get(url).subscribe({
        next: (response: any) => {
          console.log('Resposta bruta getSetsWorkout:', response);

          try {
            // Verificar se a resposta foi bem-sucedida
            const isSuccess = response.success === true || response.status === 'success';

            if (isSuccess && response.data) {
              // Converter para formato padrão da API
              const normalizedResponse = {
                success: true,
                status: 'success',
                message: response.message || 'Sets do treino obtidos com sucesso',
                data: response.data
              } as ApiResponse<any[]>;

              observer.next(normalizedResponse);
              observer.complete();
            } else if (Array.isArray(response)) {
              // Em alguns casos, a API pode retornar diretamente um array
              const normalizedResponse = {
                success: true,
                status: 'success',
                message: 'Sets do treino obtidos com sucesso',
                data: response
              } as ApiResponse<any[]>;

              observer.next(normalizedResponse);
              observer.complete();
            } else {
              console.warn('Resposta inesperada:', response);
              observer.error(new Error('Formato de resposta inesperado'));
            }
          } catch (error) {
            console.error('Erro ao processar resposta:', error);
            observer.error(new Error('Erro ao processar resposta do servidor'));
          }
        },
        error: (err) => {
          console.error('Erro na requisição getSetsWorkout:', err);
          observer.error(err);
        }
      });
    });
  }

  /**
   * Atualiza o status de um treino
   * @param workoutId ID do treino
   * @param status Novo status (concluido, ativo, inativo, etc.)
   */
  updateWorkoutStatus(workoutId: number, status: string): Observable<ApiResponse<null>> {
    const payload = {
      id: workoutId,
      situation: status
    };

    // Como não temos um endpoint específico para atualizar apenas o status,
    // usamos o endpoint de atualização geral de treino
    return this.http.put<ApiResponse<null>>(`${this.apiUrl}/workouts/update`, payload);
  }

  /**
   * Marca os treinos anteriores do aluno como concluídos
   * @param studentId ID do aluno
   */
  completePreviousWorkouts(studentId: number): Observable<any> {
    // Como não temos um endpoint específico para marcar como concluído,
    // primeiro buscamos os treinos ativos e depois atualizamos cada um individualmente
    return new Observable(observer => {
      this.getAllWorkouts(studentId).subscribe({
        next: (response) => {
          if (response && response.success && response.data && response.data.length > 0) {
            const activeWorkouts = response.data;
            const totalWorkouts = activeWorkouts.length;
            let completedCount = 0;
            let errorCount = 0;

            // Para cada treino ativo, marcar como concluído
            activeWorkouts.forEach((workout) => {
              const payload = {
                id: workout.id,
                situation: 'concluido'
              };

              this.http.put<ApiResponse<null>>(`${this.apiUrl}/workouts/update`, payload).subscribe({
                next: () => {
                  completedCount++;
                  if (completedCount + errorCount === totalWorkouts) {
                    observer.next({
                      success: true,
                      message: `${completedCount} treinos marcados como concluídos, ${errorCount} falhas`,
                      completedCount,
                      errorCount
                    });
                    observer.complete();
                  }
                },
                error: (err) => {
                  console.error(`Erro ao marcar treino ${workout.id} como concluído:`, err);
                  errorCount++;
                  if (completedCount + errorCount === totalWorkouts) {
                    if (errorCount === totalWorkouts) {
                      observer.error(new Error('Falha ao marcar treinos como concluídos'));
                    } else {
                      observer.next({
                        success: true,
                        message: `${completedCount} treinos marcados como concluídos, ${errorCount} falhas`,
                        completedCount,
                        errorCount
                      });
                      observer.complete();
                    }
                  }
                }
              });
            });
          } else {
            // Nenhum treino ativo para marcar como concluído
            observer.next({
              success: true,
              message: 'Nenhum treino ativo encontrado para marcar como concluído',
              completedCount: 0,
              errorCount: 0
            });
            observer.complete();
          }
        },
        error: (error) => {
          console.error('Erro ao buscar treinos ativos:', error);
          observer.error(error);
        }
      });
    });
  }
}
