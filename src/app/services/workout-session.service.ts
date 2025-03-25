import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { WorkoutService } from './workout.service';
import { WorkoutSession, AssignedWorkout, WorkoutSet, Lap, ApiResponse } from '../Models/workout.model';

export interface ActiveWorkout {
  session_id?: number;
  assigned_workout_id: number;
  workout_id: number;
  name: string;
  description?: string;
  sets: WorkoutSet[];
  currentSetIndex: number;
  currentRepetition: number;
  totalDistance: number;
  startTime: Date;
  elapsedTime: number;
  isResting: boolean;
  restTimeRemaining?: number;
  statusText: string;
  laps: Lap[];
  status: 'em_andamento' | 'concluido' | 'cancelado';
}

@Injectable({
  providedIn: 'root'
})
export class WorkoutSessionService {
  private timer: any;
  private restTimer: any;
  private currentWorkoutSubject = new BehaviorSubject<ActiveWorkout | null>(null);
  public currentWorkout = this.currentWorkoutSubject.asObservable();

  private audioBeep: HTMLAudioElement;
  private audioStart: HTMLAudioElement;
  private audioFinish: HTMLAudioElement;

  constructor(private workoutService: WorkoutService) {
    // Criar elementos de áudio para notificações
    this.audioBeep = new Audio('assets/audio/beep.mp3');
    this.audioStart = new Audio('assets/audio/start.mp3');
    this.audioFinish = new Audio('assets/audio/finish.mp3');
  }

  /**
   * Inicia um novo treino
   */
  startWorkout(assignedWorkout: AssignedWorkout, sets: WorkoutSet[]): Observable<ApiResponse<{ session_id: number }>> {
    return new Observable(observer => {
      // Verificar se o ID do treino existe
      if (!assignedWorkout.id) {
        observer.error('ID do treino não definido');
        return;
      }

      // Iniciar contador regressivo de 3 segundos
      let countdown = 3;

      const startCountdown = () => {
        // Notificar usuário com áudio
        this.audioBeep.play();

        // Atualizar texto de status
        const workout: ActiveWorkout = {
          assigned_workout_id: assignedWorkout.id!,
          workout_id: assignedWorkout.workout_id,
          name: assignedWorkout.name || '',
          description: assignedWorkout.description,
          sets: sets,
          currentSetIndex: 0,
          currentRepetition: 1,
          totalDistance: 0,
          startTime: new Date(),
          elapsedTime: 0,
          isResting: false,
          statusText: `Iniciando em ${countdown}...`,
          laps: [],
          status: 'em_andamento'
        };

        this.currentWorkoutSubject.next(workout);

        if (countdown > 0) {
          setTimeout(() => {
            countdown--;
            startCountdown();
          }, 1000);
        } else {
          // Iniciar o treino no servidor após a contagem regressiva
          this.workoutService.startWorkoutSession(assignedWorkout.id!).subscribe({
            next: (response) => {
              // Iniciar o timer
              const session_id = response.data?.session_id;

              // Notificar com som de início
              this.audioStart.play();

              // Atualizar o treino ativo
              const activeWorkout = this.currentWorkoutSubject.value;
              if (activeWorkout) {
                activeWorkout.session_id = session_id;
                activeWorkout.statusText = 'Treino iniciado! Toque na tela para registrar uma volta';
                this.currentWorkoutSubject.next(activeWorkout);

                // Iniciar o timer
                this.startTimer();
              }

              observer.next(response);
              observer.complete();
            },
            error: (error) => {
              observer.error(error);
            }
          });
        }
      };

      startCountdown();
    });
  }

  /**
   * Registra uma volta no treino atual
   */
  recordLap(): Observable<ApiResponse<{ id: number }>> {
    const workout = this.currentWorkoutSubject.value;

    if (!workout || !workout.session_id) {
      return new Observable(observer => {
        observer.error('Nenhum treino em andamento');
      });
    }

    // Obter o tempo atual
    const now = new Date();
    const elapsedTime = Math.floor((now.getTime() - workout.startTime.getTime()) / 1000);

    // Obter o set atual e a repetição atual
    const currentSet = workout.sets[workout.currentSetIndex];

    return new Observable(observer => {
      // Atualizar o statusText
      workout.statusText = 'Registrando volta...';
      this.currentWorkoutSubject.next({ ...workout });

      // Criar uma execução de set (normalmente isso seria feito no servidor)
      const set_execution_id = 1; // Simulando um ID de execução

      // Calcular o tempo da volta (assumindo que a última volta foi registrada há {elapsedTime - lastLapTime} segundos)
      let lapTime = elapsedTime;
      if (workout.laps.length > 0) {
        const lastLapTotalTime = workout.laps[workout.laps.length - 1].lap_time;
        lapTime = elapsedTime - lastLapTotalTime;
      }

      // Registrar a volta no servidor
      this.workoutService.recordLap(set_execution_id, workout.currentRepetition, lapTime).subscribe({
        next: (response) => {
          // Adicionar a volta à lista de voltas
          const lap: Lap = {
            id: response.data?.id,
            set_execution_id: set_execution_id,
            repetition_number: workout.currentRepetition,
            lap_time: lapTime,
            pace: this.workoutService.calculatePace(lapTime, currentSet.distance)
          };

          workout.laps.push(lap);
          workout.totalDistance += currentSet.distance;

          // Verificar se completou todas as repetições do set atual
          if (workout.currentRepetition >= currentSet.repetitions) {
            // Passou para o próximo set
            workout.currentRepetition = 1;

            // Verificar se é o último set
            if (workout.currentSetIndex >= workout.sets.length - 1) {
              // Finalizou o treino
              this.finishWorkout();
            } else {
              // Iniciar período de descanso
              this.startRest(currentSet.rest_time);
            }
          } else {
            // Incrementar a repetição atual
            workout.currentRepetition++;
            workout.statusText = `Volta ${workout.currentRepetition} de ${currentSet.repetitions}`;
          }

          this.currentWorkoutSubject.next({ ...workout });
          observer.next(response);
          observer.complete();
        },
        error: (error) => {
          workout.statusText = 'Erro ao registrar volta';
          this.currentWorkoutSubject.next({ ...workout });
          observer.error(error);
        }
      });
    });
  }

  /**
   * Inicia o período de descanso
   */
  private startRest(restTime: number) {
    const workout = this.currentWorkoutSubject.value;
    if (!workout) return;

    // Notificar com som
    this.audioBeep.play();

    // Iniciar o descanso
    workout.isResting = true;
    workout.restTimeRemaining = restTime;
    workout.statusText = `Descanso: ${this.workoutService.formatTime(restTime)}`;
    this.currentWorkoutSubject.next({ ...workout });

    // Iniciar o timer de descanso
    if (this.restTimer) {
      clearInterval(this.restTimer);
    }

    this.restTimer = setInterval(() => {
      const workout = this.currentWorkoutSubject.value;
      if (!workout || !workout.isResting || !workout.restTimeRemaining) {
        clearInterval(this.restTimer);
        return;
      }

      workout.restTimeRemaining--;
      workout.statusText = `Descanso: ${this.workoutService.formatTime(workout.restTimeRemaining)}`;

      if (workout.restTimeRemaining <= 0) {
        // Finalizar o descanso
        this.finishRest();
      } else {
        this.currentWorkoutSubject.next({ ...workout });
      }
    }, 1000);
  }

  /**
   * Finaliza o período de descanso
   */
  finishRest() {
    const workout = this.currentWorkoutSubject.value;
    if (!workout) return;

    // Limpar o timer de descanso
    if (this.restTimer) {
      clearInterval(this.restTimer);
    }

    // Avançar para o próximo set
    workout.currentSetIndex++;
    workout.currentRepetition = 1;
    workout.isResting = false;
    delete workout.restTimeRemaining;

    // Verificar se há mais sets
    if (workout.currentSetIndex < workout.sets.length) {
      const nextSet = workout.sets[workout.currentSetIndex];
      workout.statusText = `${nextSet.exercise_name}: Volta ${workout.currentRepetition} de ${nextSet.repetitions}`;

      // Notificar com som de início
      this.audioStart.play();

      // Iniciar contagem regressiva para o próximo set
      let countdown = 3;
      const startCountdown = () => {
        workout.statusText = `Próximo exercício em ${countdown}...`;
        this.currentWorkoutSubject.next({ ...workout });

        // Notificar usuário com áudio
        this.audioBeep.play();

        if (countdown > 0) {
          setTimeout(() => {
            countdown--;
            startCountdown();
          }, 1000);
        } else {
          // Iniciar o próximo set
          workout.statusText = `${nextSet.exercise_name}: Volta ${workout.currentRepetition} de ${nextSet.repetitions}`;
          this.currentWorkoutSubject.next({ ...workout });

          // Notificar com som de início
          this.audioStart.play();
        }
      };

      startCountdown();
    } else {
      // Não há mais sets, finalizar o treino
      this.finishWorkout();
    }
  }

  /**
   * Inicia o timer para contar o tempo do treino
   */
  private startTimer() {
    if (this.timer) {
      clearInterval(this.timer);
    }

    this.timer = setInterval(() => {
      const workout = this.currentWorkoutSubject.value;
      if (!workout) {
        clearInterval(this.timer);
        return;
      }

      const now = new Date();
      workout.elapsedTime = Math.floor((now.getTime() - workout.startTime.getTime()) / 1000);
      this.currentWorkoutSubject.next({ ...workout });
    }, 1000);
  }

  /**
   * Finaliza o treino atual
   */
  finishWorkout(): Observable<ApiResponse<null>> {
    const workout = this.currentWorkoutSubject.value;

    if (!workout || !workout.session_id) {
      return new Observable(observer => {
        observer.error('Nenhum treino em andamento');
      });
    }

    // Limpar os timers
    if (this.timer) {
      clearInterval(this.timer);
    }

    if (this.restTimer) {
      clearInterval(this.restTimer);
    }

    // Notificar com som de finalização
    this.audioFinish.play();

    // Atualizar o status do treino
    workout.status = 'concluido';
    workout.statusText = 'Finalizando treino...';
    this.currentWorkoutSubject.next({ ...workout });

    // Finalizar o treino no servidor
    return this.workoutService.finishWorkoutSession(
      workout.session_id,
      workout.elapsedTime,
      workout.totalDistance,
      'Treino concluído com sucesso'
    );
  }

  /**
   * Cancela o treino atual
   */
  cancelWorkout() {
    const workout = this.currentWorkoutSubject.value;

    if (!workout) {
      return;
    }

    // Limpar os timers
    if (this.timer) {
      clearInterval(this.timer);
    }

    if (this.restTimer) {
      clearInterval(this.restTimer);
    }

    // Atualizar o status do treino
    workout.status = 'cancelado';
    workout.statusText = 'Treino cancelado';
    this.currentWorkoutSubject.next({ ...workout });

    // Reset after a short delay
    setTimeout(() => {
      this.currentWorkoutSubject.next(null);
    }, 2000);
  }

  /**
   * Verifica se há um treino em andamento
   */
  isWorkoutActive(): boolean {
    return !!this.currentWorkoutSubject.value;
  }

  /**
   * Obtém os dados do treino atual
   */
  getCurrentWorkout(): ActiveWorkout | null {
    return this.currentWorkoutSubject.value;
  }
}
