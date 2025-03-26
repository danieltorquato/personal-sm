import { Component, OnInit, ViewChild, ElementRef, OnDestroy, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule, AlertController, ToastController, AlertButton } from '@ionic/angular';
import { Router } from '@angular/router';
import { HttpClient, HttpHeaders, HttpClientModule } from '@angular/common/http';
import { addIcons } from 'ionicons';
import {
  timerOutline,
  fitnessOutline,
  timeOutline,
  flameOutline,
  barbellOutline,
  repeatOutline,
  checkmarkCircle,
  ellipseOutline,
  informationCircleOutline,
  play,
  pauseCircleOutline,
  checkmarkCircleOutline,
  waterOutline,
  listOutline
} from 'ionicons/icons';
import { Observable } from 'rxjs';
import { AuthService } from 'src/app/services/auth.service';
import { WorkoutService } from 'src/app/services/workout.service';
import { ApiService } from 'src/app/services/api.service';

interface WorkoutSet {
  exerciseName: string;
  distance: number;
  repetitions: number;
  restTime: number;
  notes?: string;
  partialInterval?: number; // Intervalo para marcação de parciais (25m, 50m, etc.)
}

interface Workout {
  id: string;
  name: string;
  description: string;
  level: string;
  personalName: string;
  personalId: string;
  totalDistance: number;
  estimatedDuration: number;
  sets: WorkoutSet[];
}

interface Lap {
  exerciseName: string;
  setIndex: number;
  repetition: number;
  distance: number;
  time: number;
  pace?: string;
  isPartial?: boolean;
  partialDistance?: number;
}

@Component({
  selector: 'app-pool-workout',
  templateUrl: './pool-workout.page.html',
  styleUrls: ['./pool-workout.page.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, FormsModule, HttpClientModule]
})
export class PoolWorkoutPage implements OnInit, OnDestroy {
  @ViewChild('audioBeep') audioBeep!: ElementRef;

  // Dados da API
  workoutId: string = '';
  assignedWorkoutId: string = '';
  sessionId: string = '';
  setExecutionIds: string[] = [];

  // Estado do treino
  workout: Workout = {
    id: '12345',
    name: 'Treino de Resistência - Nível Intermediário',
    description: 'Treino focado em desenvolver resistência para nadadores intermediários',
    level: 'intermediario',
    personalName: 'Carlos Mendes',
    personalId: '67890',
    totalDistance: 2000,
    estimatedDuration: 45,
    sets: [
      {
        exerciseName: 'Nado Livre',
        distance: 200,
        repetitions: 2,
        restTime: 30,
        partialInterval: 25 // Marcar a cada 25m
      },
      {
        exerciseName: 'Batida de Pernas',
        distance: 100,
        repetitions: 4,
        restTime: 20,
        notes: 'Usar prancha',
        partialInterval: 25 // Marcar a cada 25m
      },
      {
        exerciseName: 'Nado Costas',
        distance: 100,
        repetitions: 2,
        restTime: 30,
        partialInterval: 50 // Marcar a cada 50m
      },
      {
        exerciseName: 'Nado Peito',
        distance: 100,
        repetitions: 2,
        restTime: 30,
        partialInterval: 50 // Marcar a cada 50m
      },
      {
        exerciseName: 'Borboleta',
        distance: 50,
        repetitions: 2,
        restTime: 45,
        notes: 'Foco na respiração',
        partialInterval: 25 // Marcar a cada 25m
      },
      {
        exerciseName: 'Medley',
        distance: 200,
        repetitions: 1,
        restTime: 0,
        partialInterval: 50 // Marcar a cada 50m
      }
    ]
  };

  // Temporizadores
  mainTimer: number = 0;
  lapTimer: number = 0;
  restTimer: number = 0;
  initialRestTime: number = 0;
  countdownTimer: number = 5;
  completedTime: number = 0;

  // Estados
  isMainTimerRunning: boolean = false;
  isRestTimerActive: boolean = false;
  isCountdownActive: boolean = false;
  isTouchToLapActive: boolean = false;
  isWorkoutStarted: boolean = false;

  // Intervalos para os timers
  mainTimerInterval: any;
  restTimerInterval: any;
  countdownInterval: any;

  // Estado das séries
  currentSetIndex: number = 0;
  currentRepetition: number = 1;
  completedSets: number = 0;
  completedDistance: number = 0;
  laps: Lap[] = [];

  // Sons
  beepSound: HTMLAudioElement = new Audio('assets/sounds/beep.mp3');
  startSound: HTMLAudioElement = new Audio('assets/sounds/start.mp3');
  endSound: HTMLAudioElement = new Audio('assets/sounds/end.mp3');

  // Estados adicionais
  isRestPaused: boolean = false;
  workoutState: any = null;
  private readonly WORKOUT_STATE_KEY = 'pool_workout_state';

  // Adicionar variáveis para controlar distâncias parciais
  partialDistances: number[] = [];
  currentLapDistance: number = 0;
  nextPartialDistance: number = 0;

  constructor(
    private router: Router,
    private alertController: AlertController,
    private toastController: ToastController,
    private http: HttpClient,
    private authService: AuthService,
    private workoutService: WorkoutService,
    private apiService: ApiService
  ) {
    // Adicionando ícones do Ionicons
    addIcons({
      timerOutline,
      fitnessOutline,
      timeOutline,
      flameOutline,
      barbellOutline,
      repeatOutline,
      checkmarkCircle,
      ellipseOutline,
      informationCircleOutline,
      play,
      pauseCircleOutline,
      checkmarkCircleOutline,
      waterOutline,
      listOutline
    });
  }

  // Listener para toque na tela quando o modo toque para volta estiver ativo
  @HostListener('click', ['$event'])
  onScreenTap(event: MouseEvent): void {
    if (this.isTouchToLapActive && this.isMainTimerRunning) {
      const currentSet = this.workout.sets[this.currentSetIndex];

      // Se tocar na tela e ainda não chegou na distância total
      if (this.nextPartialDistance < currentSet.distance) {
        // Registrar a parcial
        this.recordPartialLap(this.nextPartialDistance);

        // Avançar para a próxima marca parcial
        const partialInterval = currentSet.partialInterval || 25;
        this.nextPartialDistance += partialInterval;
      } else {
        // Completou a volta inteira
        this.recordLap();
      }
    }
  }

  ngOnInit() {
    // Verificar se há parâmetros na URL para workoutId
    const urlParams = new URLSearchParams(window.location.search);
    this.assignedWorkoutId = urlParams.get('assignedWorkoutId') || '';

    if (this.assignedWorkoutId) {
      // Carregar o treino da API
      this.loadWorkoutFromApi();
    } else {
      // Carregar treino de demonstração
      this.loadWorkout();
    }

    // Configurar distâncias parciais para o primeiro exercício
    this.setupPartialDistances();
  }

  ngOnDestroy() {
    // Salvar estado do treino antes de destruir o componente
    this.saveWorkoutState();
    this.clearTimers();
  }

  clearTimers() {
    if (this.mainTimerInterval) {
      clearInterval(this.mainTimerInterval);
    }
    if (this.restTimerInterval) {
      clearInterval(this.restTimerInterval);
    }
    if (this.countdownInterval) {
      clearInterval(this.countdownInterval);
    }
  }

  // Iniciar o exercício com contagem regressiva
  startWorkout() {
    if (this.isWorkoutStarted) return;

    this.isWorkoutStarted = true;
    this.startCountdown(true);
  }

  // Método para iniciar o treino com contagem regressiva
  startCountdown(isFirstStart: boolean = false) {
    this.isCountdownActive = true;
    this.countdownTimer = 5;

    this.countdownInterval = setInterval(() => {
      this.countdownTimer--;

      // Tocar beep nos últimos 3 segundos
      if (this.countdownTimer <= 3 && this.countdownTimer > 0) {
        this.playSound('beep');
      }

      if (this.countdownTimer === 0) {
        clearInterval(this.countdownInterval);
        this.isCountdownActive = false;

        // Iniciar o timer principal
        this.startMainTimer();

        // Tocar som de início
        this.playSound('start');

        // Ativar detecção de toque para marcação de voltas
        this.activateTouchToLap();
      }
    }, 1000);
  }

  // Ativar modo de toque na tela para marcar volta
  activateTouchToLap() {
    this.isTouchToLapActive = true;
  }

  // Desativar modo de toque na tela para marcar volta
  deactivateTouchToLap() {
    this.isTouchToLapActive = false;
  }

  // Métodos para o temporizador principal
  startMainTimer() {
    this.isMainTimerRunning = true;
    this.isRestTimerActive = false;

    // Limpar qualquer timer existente
    if (this.mainTimerInterval) {
      clearInterval(this.mainTimerInterval);
    }

    // Definir o início do timer para capturar o tempo exato
    const startTime = Date.now() - (this.lapTimer * 1000);

    this.mainTimerInterval = setInterval(() => {
      // Calcular o tempo decorrido desde o início
      const elapsedSeconds = Math.floor((Date.now() - startTime) / 1000);
      this.lapTimer = elapsedSeconds;

      // Incrementar o timer principal se não for a primeira repetição
      if (this.currentRepetition > 1 || this.currentSetIndex > 0) {
        this.mainTimer = this.completedTime + elapsedSeconds;
      } else {
        this.mainTimer = elapsedSeconds;
      }

      // Atualizar o estado do treino e salvar a cada 5 segundos
      if (this.mainTimer % 5 === 0) {
        this.saveWorkoutState();
      }
    }, 1000);
  }

  stopMainTimer() {
    this.isMainTimerRunning = false;
    if (this.mainTimerInterval) {
      clearInterval(this.mainTimerInterval);
      this.mainTimerInterval = null;
    }

    // Atualizar o tempo completado total
    this.completedTime += this.lapTimer;
  }

  resetMainTimer() {
    this.mainTimer = 0;
    this.lapTimer = 0;
  }

  toggleMainTimer() {
    if (!this.isWorkoutStarted) {
      this.startWorkout();
      return;
    }

    if (this.isMainTimerRunning) {
      this.stopMainTimer();
      this.deactivateTouchToLap();
    } else {
      this.startMainTimer();
      this.activateTouchToLap();
    }
  }

  // Métodos para o temporizador de descanso
  startRestTimer() {
    // Desativar toque para volta durante o descanso
    this.deactivateTouchToLap();

    const currentSet = this.workout.sets[this.currentSetIndex];
    this.restTimer = currentSet.restTime;
    this.initialRestTime = currentSet.restTime;

    if (this.restTimer > 0) {
      // Tocar som de início de descanso
      this.playSound('end');

      // Ativar a visualização do descanso
      this.isRestTimerActive = true;
      this.isRestPaused = false;

      // Iniciar a contagem regressiva
      this.restTimerInterval = setInterval(() => {
        this.restTimer--;

        // Tocar beep nos últimos 3 segundos
        if (this.restTimer <= 3 && this.restTimer > 0) {
          this.playSound('beep');
        }

        if (this.restTimer <= 0) {
          this.completeRest();
        }
      }, 1000);
    } else {
      // Se não houver tempo de descanso, avançar imediatamente
      this.moveToNextRepetition();
      // Iniciar contagem regressiva
      this.startCountdown(true);
    }
  }

  skipRest() {
    if (this.isRestTimerActive) {
      // Parar o temporizador de descanso
      clearInterval(this.restTimerInterval);

      // Esconder a visualização de descanso
      this.isRestTimerActive = false;
      this.isRestPaused = false;

      // Mover para a próxima repetição
      this.moveToNextRepetition();

      // Iniciar contagem regressiva
      this.startCountdown(true);

      // Play sound
      this.playSound('beep');
    }
  }

  completeRest() {
    // Parar o temporizador de descanso
    clearInterval(this.restTimerInterval);

    // Esconder a visualização de descanso
    this.isRestTimerActive = false;
    this.isRestPaused = false;

    // Mover para a próxima repetição
    this.moveToNextRepetition();

    // Iniciar contagem regressiva antes de começar o próximo exercício
    this.startCountdown(true);
  }

  // Método para pausar/retomar o descanso
  toggleRest() {
    if (this.isRestTimerActive) {
      if (this.isRestPaused) {
        // Retomar a contagem regressiva
        this.restTimerInterval = setInterval(() => {
          this.restTimer--;
          if (this.restTimer <= 3 && this.restTimer > 0) {
            this.playSound('beep');
          }
          if (this.restTimer <= 0) {
            this.completeRest();
          }
        }, 1000);
        this.isRestPaused = false;
      } else {
        // Pausar a contagem regressiva
        clearInterval(this.restTimerInterval);
        this.isRestPaused = true;
      }
    }
  }

  // Métodos para gerenciar séries
  recordLap() {
    if (this.currentSetIndex >= this.workout.sets.length) {
      return;
    }

    // Parar o timer da volta
    this.stopMainTimer();

    const currentSet = this.workout.sets[this.currentSetIndex];

    // Calcular ritmo (pace) - ajustado para considerar apenas a distância restante
    const remainingDistance = currentSet.distance - this.currentLapDistance;
    const pace = this.calculatePace(this.lapTimer, remainingDistance);

    // Registrar o tempo da volta completa
    const lapObj: Lap = {
      exerciseName: currentSet.exerciseName,
      setIndex: this.currentSetIndex,
      repetition: this.currentRepetition,
      distance: currentSet.distance,
      time: this.lapTimer,
      pace: pace,
      isPartial: false
    };
    this.laps.push(lapObj);

    // Enviar dados para a API se estiver em um ambiente de produção e setExecutionIds estiver configurado
    if (this.sessionId && this.setExecutionIds[this.currentSetIndex]) {
      this.workoutService.recordLap(
        parseInt(this.setExecutionIds[this.currentSetIndex]),
        this.currentRepetition,
        this.lapTimer
      ).subscribe({
        next: (response: any) => {
          console.log('Lap registrada com sucesso:', response);
        },
        error: (error) => {
          console.error('Erro ao registrar lap:', error);
        }
      });
    }

    // Atualizar a distância completada
    this.completedDistance += currentSet.distance;

    // Resetar o timer da volta e a distância parcial
    this.lapTimer = 0;
    this.currentLapDistance = 0;

    // Verificar se completou todas as repetições do exercício atual
    if (this.currentRepetition >= currentSet.repetitions) {
      // Completou todas as repetições, mover para o próximo exercício
      this.completedSets++;

      if (this.currentSetIndex < this.workout.sets.length - 1) {
        // Se não for o último exercício, iniciar descanso
        this.currentSetIndex++;
        this.currentRepetition = 1;

        // Configurar distâncias parciais para o novo exercício
        this.setupPartialDistances();

        if (this.workout.sets[this.currentSetIndex].restTime > 0) {
          this.startRestTimer();
        } else {
          // Se não tiver descanso, iniciar a próxima atividade diretamente
          this.startMainTimer();
          this.activateTouchToLap();
        }
      } else {
        // Completou o último exercício
        this.currentSetIndex++;
        this.showToast('Treino completo!');
      }
    } else {
      // Ainda tem repetições do exercício atual
      this.currentRepetition++;

      if (currentSet.restTime > 0) {
        // Iniciar descanso entre repetições
        this.startRestTimer();
      } else {
        // Sem descanso, continuar para a próxima repetição
        this.startMainTimer();
        this.activateTouchToLap();
      }
    }
  }

  moveToNextRepetition() {
    const currentSet = this.workout.sets[this.currentSetIndex];

    if (this.currentRepetition >= currentSet.repetitions) {
      // Terminou todas as repetições, ir para o próximo exercício
      this.currentSetIndex++;
      this.currentRepetition = 1;

      if (this.currentSetIndex < this.workout.sets.length) {
        this.showToast(`Próximo exercício: ${this.workout.sets[this.currentSetIndex].exerciseName}`);
      }
    } else {
      // Ir para a próxima repetição do exercício atual
      this.currentRepetition++;
      this.showToast(`Repetição ${this.currentRepetition} de ${currentSet.repetitions}`);
    }
  }

  skipCurrentSet() {
    if (this.currentSetIndex >= this.workout.sets.length) {
      return;
    }

    // Perguntar confirmação
    this.presentAlert(
      'Pular Exercício',
      'Tem certeza que deseja pular este exercício?',
      [
        {
          text: 'Cancelar',
          role: 'cancel'
        } as AlertButton,
        {
          text: 'Pular',
          handler: () => {
            // Incrementar o índice e resetar a repetição
            this.currentSetIndex++;
            this.currentRepetition = 1;
            this.stopMainTimer();

            if (this.currentSetIndex < this.workout.sets.length) {
              this.resetMainTimer();
              this.showToast(`Exercício pulado. Próximo: ${this.workout.sets[this.currentSetIndex].exerciseName}`);
            } else {
              this.showToast('Treino completo!');
            }
          }
        } as AlertButton
      ]
    );
  }

  // Calcular ritmo (pace)
  calculatePace(timeInSeconds: number, distanceInMeters: number): string {
    if (distanceInMeters === 0) return '-';

    // Calcular o ritmo por 100m
    const pacePerHundredMeters = (timeInSeconds * 100) / distanceInMeters;

    // Converter para minutos e segundos
    const minutes = Math.floor(pacePerHundredMeters / 60);
    const seconds = Math.floor(pacePerHundredMeters % 60);

    return `${minutes}:${seconds.toString().padStart(2, '0')}/100m`;
  }

  showFinishConfirm() {
    this.presentAlert(
      'Finalizar Treino',
      'Tem certeza que deseja finalizar o treino agora? Progresso não completado será perdido.',
      [
        {
          text: 'Cancelar',
          role: 'cancel'
        } as AlertButton,
        {
          text: 'Finalizar',
          handler: () => {
            this.finishWorkout();
          }
        } as AlertButton
      ]
    );
  }

  finishWorkout() {
    // Parar todos os timers
    this.clearTimers();

    // Atualizar o tempo total para incluir o último tempo não contabilizado
    if (this.isMainTimerRunning) {
      this.completedTime += this.lapTimer;
      this.mainTimer = this.completedTime;
    }

    // Verificar se existe uma sessão ativa e se está autenticado
    if (this.sessionId && this.authService.isLoggedIn()) {
      this.workoutService.finishWorkoutSession(
        parseInt(this.sessionId),
        this.mainTimer,
        this.completedDistance,
        "" // Notas opcionais
      ).subscribe({
        next: (response: any) => {
          console.log('Treino finalizado com sucesso na API:', response);
          // Navegar para a página de resumo do treino
          this.router.navigate(['/pupil/pool-workout-summary', this.sessionId]);
        },
        error: (error) => {
          console.error('Erro ao finalizar treino na API:', error);

          // Verificar se é erro de autenticação
          if (error.status === 401 || error?.error?.message?.includes('Token')) {
            this.showToast('Sessão expirada. Os dados não puderam ser salvos.');
          } else {
            this.showToast('Erro ao salvar dados do treino no servidor.');
          }

          // Mesmo com erro, navegar para a página de resumo
          this.router.navigate(['/pupil/dashboard']);
        }
      });
    } else {
      // Caso não exista sessão ativa ou não esteja autenticado
      let message = 'Treino finalizado com sucesso!';
      if (this.sessionId && !this.authService.isLoggedIn()) {
        message = 'Treino finalizado, mas não foi possível salvar (não autenticado).';
      }
      this.showToast(message);
      this.router.navigate(['/pupil/dashboard']);
    }

    // Limpar o estado salvo localmente
    localStorage.removeItem(this.WORKOUT_STATE_KEY);
  }

  getCompletionPercentage(): number {
    const totalSets = this.workout.sets.reduce((total, set) => total + set.repetitions, 0);
    const completedReps = this.laps.length;
    return Math.floor((completedReps / totalSets) * 100);
  }

  formatTime(seconds: number): string {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }

  // Tocar sons
  playSound(type: 'beep' | 'start' | 'end') {
    switch (type) {
      case 'beep':
        this.beepSound.currentTime = 0;
        this.beepSound.play();
        break;
      case 'start':
        this.startSound.currentTime = 0;
        this.startSound.play();
        break;
      case 'end':
        this.endSound.currentTime = 0;
        this.endSound.play();
        break;
    }
  }

  async showToast(message: string) {
    const toast = await this.toastController.create({
      message: message,
      duration: 2000,
      position: 'top',
      color: 'dark',
      cssClass: 'custom-toast'
    });
    toast.present();
  }

  async presentAlert(header: string, message: string, buttons: AlertButton[]) {
    const alert = await this.alertController.create({
      header,
      message,
      buttons,
      cssClass: 'custom-alert'
    });
    await alert.present();
  }

  // Métodos para gerenciar o estado do treino
  private saveWorkoutState() {
    if (this.isWorkoutStarted) {
      const state = {
        workout: this.workout,
        mainTimer: this.mainTimer,
        lapTimer: this.lapTimer,
        currentSetIndex: this.currentSetIndex,
        currentRepetition: this.currentRepetition,
        completedSets: this.completedSets,
        completedDistance: this.completedDistance,
        laps: this.laps,
        isMainTimerRunning: this.isMainTimerRunning,
        isRestTimerActive: this.isRestTimerActive,
        isRestPaused: this.isRestPaused,
        isCountdownActive: this.isCountdownActive,
        countdownTimer: this.countdownTimer,
        restTimer: this.restTimer,
        initialRestTime: this.initialRestTime,
        partialDistances: this.partialDistances,
        currentLapDistance: this.currentLapDistance,
        nextPartialDistance: this.nextPartialDistance,
        isTouchToLapActive: this.isTouchToLapActive
      };
      localStorage.setItem(this.WORKOUT_STATE_KEY, JSON.stringify(state));
    }
  }

  private loadWorkoutState() {
    const savedState = localStorage.getItem(this.WORKOUT_STATE_KEY);
    if (savedState) {
      const state = JSON.parse(savedState);
      this.workout = state.workout;
      this.mainTimer = state.mainTimer;
      this.lapTimer = state.lapTimer;
      this.currentSetIndex = state.currentSetIndex;
      this.currentRepetition = state.currentRepetition;
      this.completedSets = state.completedSets;
      this.completedDistance = state.completedDistance;
      this.laps = state.laps;
      this.isWorkoutStarted = true;
      this.isRestPaused = state.isRestPaused || false;
      this.isCountdownActive = state.isCountdownActive || false;
      this.countdownTimer = state.countdownTimer || 0;
      this.partialDistances = state.partialDistances || [];
      this.currentLapDistance = state.currentLapDistance || 0;
      this.nextPartialDistance = state.nextPartialDistance || 0;
      this.isTouchToLapActive = state.isTouchToLapActive || false;

      // Inicializar as distâncias parciais, caso não estejam definidas
      if (!this.partialDistances.length) {
        this.setupPartialDistances();
      }

      if (state.isMainTimerRunning) {
        this.startMainTimer();
        if (state.isTouchToLapActive) {
          this.activateTouchToLap();
        }
      }

      if (state.isRestTimerActive) {
        this.restTimer = state.restTimer;
        this.initialRestTime = state.initialRestTime;
        this.startRestTimer();
      }

      if (state.isCountdownActive) {
        this.startCountdown(true);
      }
    }
  }

  setupPartialDistances() {
    if (this.currentSetIndex < this.workout.sets.length) {
      const currentSet = this.workout.sets[this.currentSetIndex];
      const distance = currentSet.distance;
      const partialInterval = currentSet.partialInterval || 25; // Padrão: 25m

      this.partialDistances = [];

      // Criar as marcações parciais com base no intervalo definido
      for (let i = partialInterval; i < distance; i += partialInterval) {
        this.partialDistances.push(i);
      }

      // Resetar a distância atual do lap
      this.currentLapDistance = 0;

      // Definir a próxima marca parcial
      this.nextPartialDistance = partialInterval;
    }
  }

  // Método para registrar tempo parcial
  recordPartialLap(partialDistance: number) {
    if (this.currentSetIndex >= this.workout.sets.length || !this.isMainTimerRunning) {
      return;
    }

    const currentSet = this.workout.sets[this.currentSetIndex];

    // Calcular pace para a distância parcial (apenas para o trecho desde a última marcação)
    const lastLapTime = this.currentLapDistance > 0 && this.laps.length > 0 ?
      this.laps.filter(l => l.setIndex === this.currentSetIndex &&
                           l.repetition === this.currentRepetition)
               .slice(-1)[0].time : 0;

    const partialTime = this.lapTimer - lastLapTime;
    const partialDistanceSegment = partialDistance - this.currentLapDistance;
    const pace = this.calculatePace(partialTime, partialDistanceSegment);

    // Registrar o tempo parcial
    const lapObj: Lap = {
      exerciseName: currentSet.exerciseName,
      setIndex: this.currentSetIndex,
      repetition: this.currentRepetition,
      distance: partialDistance,
      time: this.lapTimer,
      pace: pace,
      isPartial: true,
      partialDistance: partialDistance
    };
    this.laps.push(lapObj);

    // Enviar dados para a API se estiver em um ambiente de produção
    if (this.sessionId && this.setExecutionIds[this.currentSetIndex]) {
      this.workoutService.recordLap(
        parseInt(this.setExecutionIds[this.currentSetIndex]),
        this.currentRepetition,
        this.lapTimer
      ).subscribe({
        next: (response: any) => {
          console.log('Lap parcial registrada com sucesso:', response);
        },
        error: (error) => {
          console.error('Erro ao registrar lap parcial:', error);
        }
      });
    }

    // Atualizar a distância parcial atual
    this.currentLapDistance = partialDistance;

    // Mostrar toast com o tempo parcial
    this.showToast(`Parcial ${partialDistance}m: ${this.formatTime(this.lapTimer)}`);

    // Tocar beep para confirmar
    this.playSound('beep');
  }

  // Método para mostrar confirmação de reiniciar treino
  showResetConfirm() {
    this.presentAlert(
      'Reiniciar Treino',
      'Tem certeza que deseja reiniciar o treino? Todo o progresso atual será perdido.',
      [
        {
          text: 'Cancelar',
          role: 'cancel'
        } as AlertButton,
        {
          text: 'Reiniciar',
          handler: () => {
            this.resetWorkout();
          }
        } as AlertButton
      ]
    );
  }

  // Método para reiniciar o treino do zero
  resetWorkout() {
    // Parar todos os timers
    this.clearTimers();

    // Resetar todas as variáveis de estado
    this.mainTimer = 0;
    this.lapTimer = 0;
    this.restTimer = 0;
    this.initialRestTime = 0;
    this.countdownTimer = 0;

    // Resetar estados
    this.isMainTimerRunning = false;
    this.isRestTimerActive = false;
    this.isCountdownActive = false;
    this.isTouchToLapActive = false;
    this.isWorkoutStarted = false;
    this.isRestPaused = false;

    // Resetar estado das séries
    this.currentSetIndex = 0;
    this.currentRepetition = 1;
    this.completedSets = 0;
    this.completedDistance = 0;
    this.laps = [];

    // Resetar distâncias parciais
    this.currentLapDistance = 0;
    this.nextPartialDistance = 0;
    this.setupPartialDistances();

    // Limpar estado salvo
    localStorage.removeItem(this.WORKOUT_STATE_KEY);

    this.showToast('Treino reiniciado com sucesso!');
  }

  // Método para obter os laps da repetição atual para mostrar durante o descanso
  getCurrentRepetitionLaps(): Lap[] {
    return this.laps.filter(lap =>
      lap.setIndex === this.currentSetIndex &&
      lap.repetition === this.currentRepetition
    ).sort((a, b) =>
      (a.isPartial ? a.partialDistance! : a.distance) -
      (b.isPartial ? b.partialDistance! : b.distance)
    );
  }

  // Obter o tempo total da repetição atual formatado
  getCurrentRepetitionTotalTime(): string {
    const currentLaps = this.getCurrentRepetitionLaps();
    if (currentLaps.length === 0) return '00:00';

    // O tempo total é o tempo do último lap (seja parcial ou completo)
    const lastLap = currentLaps[currentLaps.length - 1];
    return this.formatTime(lastLap.time);
  }

  // Calcular o ritmo médio da repetição atual
  getCurrentRepetitionAvgPace(): string {
    const currentLaps = this.getCurrentRepetitionLaps();
    if (currentLaps.length === 0) return '-';

    // O último lap contém o tempo total
    const lastLap = currentLaps[currentLaps.length - 1];
    const totalTime = lastLap.time;
    const totalDistance = this.workout.sets[this.currentSetIndex].distance;

    return this.calculatePace(totalTime, totalDistance);
  }

  // Obter a porcentagem para visualização do gráfico de ritmo
  getLapPacePercentage(lap: Lap): number {
    // Converte o ritmo para segundos por 100m para comparação
    if (!lap.pace || lap.pace === '-') return 0;

    const paceParts = lap.pace.split(':');
    const mins = parseInt(paceParts[0]);
    const secs = parseInt(paceParts[1]);
    const paceInSeconds = (mins * 60) + secs;

    // Inverte a lógica para que um ritmo mais rápido (menor número) tenha uma barra maior
    const maxPaceValue = 180; // 3 minutos por 100m como valor máximo
    const invertedPercentage = (1 - (paceInSeconds / maxPaceValue)) * 100;

    return Math.max(10, Math.min(100, invertedPercentage)); // Limita entre 10% e 100%
  }

  // Verificar se um lap é mais rápido que o anterior
  isLapFaster(lap: Lap, index: number): boolean {
    const currentLaps = this.getCurrentRepetitionLaps();
    if (index === 0) return true; // Primeiro lap é sempre considerado "rápido" para visualização

    // Compara o ritmo deste lap com o anterior
    const previousLap = currentLaps[index - 1];

    if (!lap.pace || !previousLap.pace || lap.pace === '-' || previousLap.pace === '-') return false;

    // Extrair valores de ritmo (minutos:segundos/100m)
    const currentPaceParts = lap.pace.split(':');
    const currentMins = parseInt(currentPaceParts[0]);
    const currentSecs = parseInt(currentPaceParts[1]);
    const currentPaceInSeconds = (currentMins * 60) + currentSecs;

    const previousPaceParts = previousLap.pace.split(':');
    const previousMins = parseInt(previousPaceParts[0]);
    const previousSecs = parseInt(previousPaceParts[1]);
    const previousPaceInSeconds = (previousMins * 60) + previousSecs;

    // Menor valor = ritmo mais rápido
    return currentPaceInSeconds <= previousPaceInSeconds;
  }

  // Método para mostrar diálogo perguntando se o usuário deseja continuar o treino anterior
  async showResumeWorkoutDialog() {
    const alert = await this.alertController.create({
      header: 'Treino em Andamento',
      message: 'Existe um treino em andamento. Deseja continuar de onde parou ou reiniciar?',
      cssClass: 'custom-alert',
      buttons: [
        {
          text: 'Reiniciar',
          handler: () => {
            // Limpar o estado salvo e começar do zero
            localStorage.removeItem(this.WORKOUT_STATE_KEY);
            this.setupPartialDistances();
          }
        },
        {
          text: 'Continuar',
          handler: () => {
            // Carregar o estado do treino salvo
            this.loadWorkoutState();
            this.showToast('Treino continuado de onde parou!');
          }
        }
      ]
    });
    await alert.present();
  }

  // Carregar treino da API
  loadWorkoutFromApi() {
    // Iniciar a sessão de treino
    this.workoutService.startWorkoutSession(parseInt(this.assignedWorkoutId)).subscribe({
      next: (response: any) => {
        console.log('Sessão de treino iniciada:', response);

        if (response && response.success) {
          // Guardar ID da sessão
          this.sessionId = response.data.session_id.toString();

          // Guardar IDs de execução dos sets
          if (response.data.set_execution_ids && response.data.set_execution_ids.length > 0) {
            this.setExecutionIds = response.data.set_execution_ids.map((id: number) => id.toString());
          }

          // Carregar dados do treino a partir da resposta
          if (response.data.workout) {
            const apiWorkout = response.data.workout;

            // Converter dados da API para o formato da aplicação
            this.workout = {
              id: apiWorkout.id?.toString() || '',
              name: apiWorkout.name || 'Treino sem nome',
              description: apiWorkout.description || '',
              level: apiWorkout.level || 'intermediário',
              personalName: apiWorkout.trainer_name || 'Personal',
              personalId: apiWorkout.trainer_id?.toString() || '',
              totalDistance: apiWorkout.total_distance || 0,
              estimatedDuration: apiWorkout.estimated_duration || 0,
              sets: []
            };

            // Converter sets
            if (apiWorkout.sets && apiWorkout.sets.length > 0) {
              this.workout.sets = apiWorkout.sets.map((set: any) => {
                return {
                  exerciseName: set.exercise_name || 'Exercício',
                  distance: set.distance || 0,
                  repetitions: set.repetitions || 1,
                  restTime: set.rest_time || 0,
                  notes: set.notes || '',
                  partialInterval: set.partial_interval || 25 // Valor padrão de 25m
                };
              });
            }

            // Iniciar timers
            this.startWorkoutAndTimers();
          }
        }
      },
      error: (error) => {
        console.error('Erro ao iniciar sessão de treino:', error);
        this.showToast('Erro ao iniciar o treino. Carregando modo offline.');

        // Carregar treino de demonstração em caso de falha
        this.loadWorkout();
        this.startWorkoutAndTimers();
      }
    });
  }

  // Iniciar treino e configurações iniciais
  startWorkoutAndTimers() {
    // Configurar as distâncias parciais
    this.setupPartialDistances();

    // Iniciar contagem regressiva para começar o treino
    this.startCountdown(true);

    // Salvar estado inicial do treino para recuperação
    this.saveWorkoutState();
  }

  // Carregar treino de demonstração
  loadWorkout() {
    // Aqui seria carregado o treino do servidor, mas por enquanto usamos dados de exemplo
    this.workout = {
      id: '12345',
      name: 'Treino de Resistência - Nível Intermediário',
      description: 'Treino focado em desenvolver resistência para nadadores intermediários',
      level: 'intermediario',
      personalName: 'Carlos Mendes',
      personalId: '67890',
      totalDistance: 2000,
      estimatedDuration: 45,
      sets: [
        {
          exerciseName: 'Nado Livre',
          distance: 200,
          repetitions: 2,
          restTime: 30,
          partialInterval: 25 // Marcar a cada 25m
        },
        {
          exerciseName: 'Batida de Pernas',
          distance: 100,
          repetitions: 4,
          restTime: 20,
          notes: 'Usar prancha',
          partialInterval: 25 // Marcar a cada 25m
        },
        {
          exerciseName: 'Nado Costas',
          distance: 100,
          repetitions: 2,
          restTime: 30,
          partialInterval: 50 // Marcar a cada 50m
        },
        {
          exerciseName: 'Nado Peito',
          distance: 100,
          repetitions: 2,
          restTime: 30,
          partialInterval: 50 // Marcar a cada 50m
        },
        {
          exerciseName: 'Borboleta',
          distance: 50,
          repetitions: 2,
          restTime: 45,
          notes: 'Foco na respiração',
          partialInterval: 25 // Marcar a cada 25m
        },
        {
          exerciseName: 'Medley',
          distance: 200,
          repetitions: 1,
          restTime: 0,
          partialInterval: 50 // Marcar a cada 50m
        }
      ]
    };

    // Após carregar, iniciar o treino
    this.startWorkoutAndTimers();
  }
}
