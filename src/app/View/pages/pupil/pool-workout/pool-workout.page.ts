import { Component, OnInit, ViewChild, ElementRef, OnDestroy, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule, AlertController, ToastController } from '@ionic/angular';
import { Router } from '@angular/router';
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

interface WorkoutSet {
  exerciseName: string;
  distance: number;
  repetitions: number;
  restTime: number;
  notes?: string;
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
}

@Component({
  selector: 'app-pool-workout',
  templateUrl: './pool-workout.page.html',
  styleUrls: ['./pool-workout.page.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, FormsModule]
})
export class PoolWorkoutPage implements OnInit, OnDestroy {
  @ViewChild('audioBeep') audioBeep!: ElementRef;

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
        restTime: 30
      },
      {
        exerciseName: 'Batida de Pernas',
        distance: 100,
        repetitions: 4,
        restTime: 20,
        notes: 'Usar prancha'
      },
      {
        exerciseName: 'Nado Costas',
        distance: 100,
        repetitions: 2,
        restTime: 30
      },
      {
        exerciseName: 'Nado Peito',
        distance: 100,
        repetitions: 2,
        restTime: 30
      },
      {
        exerciseName: 'Borboleta',
        distance: 50,
        repetitions: 2,
        restTime: 45,
        notes: 'Foco na respiração'
      },
      {
        exerciseName: 'Medley',
        distance: 200,
        repetitions: 1,
        restTime: 0
      }
    ]
  };

  // Temporizadores
  mainTimer: number = 0;
  lapTimer: number = 0;
  restTimer: number = 0;
  initialRestTime: number = 0;
  countdownTimer: number = 0;

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

  constructor(
    private router: Router,
    private alertController: AlertController,
    private toastController: ToastController
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
      this.recordLap();
    }
  }

  ngOnInit() {
    // Pré-carregar os sons
    this.beepSound.load();
    this.startSound.load();
    this.endSound.load();

    // Tentar recuperar o estado do treino do cache
    this.loadWorkoutState();
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
    this.startCountdown(3);
  }

  // Contagem regressiva antes de iniciar
  startCountdown(seconds: number) {
    this.countdownTimer = seconds;
    this.isCountdownActive = true;

    // Tocar som de início
    this.playSound('beep');

    this.countdownInterval = setInterval(() => {
      this.countdownTimer--;

      if (this.countdownTimer > 0) {
        this.playSound('beep');
      } else {
        clearInterval(this.countdownInterval);
        this.isCountdownActive = false;
        this.playSound('start');

        // Iniciar o timer e ativar o toque para volta
        this.startMainTimer();
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
    if (!this.isMainTimerRunning) {
      this.isMainTimerRunning = true;
      this.lapTimer = 0;
      this.mainTimerInterval = setInterval(() => {
        this.mainTimer++;
        this.lapTimer++;
      }, 1000);
    }
  }

  stopMainTimer() {
    if (this.isMainTimerRunning) {
      this.isMainTimerRunning = false;
      clearInterval(this.mainTimerInterval);
    }
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

      this.isRestTimerActive = true;
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
    }
  }

  skipRest() {
    if (this.isRestTimerActive) {
      clearInterval(this.restTimerInterval);
      this.isRestTimerActive = false;
      this.isRestPaused = false;

      // Mover para a próxima repetição antes da contagem regressiva
      this.moveToNextRepetition();

      // Iniciar contagem regressiva
      this.startCountdown(3);
    }
  }

  completeRest() {
    clearInterval(this.restTimerInterval);
    this.isRestTimerActive = false;

    // Tocar som de finalização do descanso
    this.playSound('start');

    this.moveToNextRepetition();

    // Reativar o temporizador e o toque para volta
    this.startMainTimer();
    this.activateTouchToLap();
  }

  // Métodos para gerenciar séries
  recordLap() {
    if (this.currentSetIndex >= this.workout.sets.length) {
      return;
    }

    // Parar o timer da volta
    this.stopMainTimer();

    const currentSet = this.workout.sets[this.currentSetIndex];

    // Calcular ritmo (pace)
    const pace = this.calculatePace(this.lapTimer, currentSet.distance);

    // Registrar o tempo da volta
    this.laps.push({
      exerciseName: currentSet.exerciseName,
      setIndex: this.currentSetIndex,
      repetition: this.currentRepetition,
      distance: currentSet.distance,
      time: this.lapTimer,
      pace: pace
    });

    // Atualizar a distância completada
    this.completedDistance += currentSet.distance;

    // Resetar o timer da volta
    this.lapTimer = 0;

    // Verificar se completou todas as repetições do exercício atual
    if (this.currentRepetition >= currentSet.repetitions) {
      // Completou todas as repetições, mover para o próximo exercício
      this.completedSets++;

      if (this.currentSetIndex < this.workout.sets.length - 1) {
        // Se não for o último exercício, iniciar descanso
        this.currentSetIndex++;
        this.currentRepetition = 1;

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
        },
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
        }
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
        },
        {
          text: 'Finalizar',
          handler: () => {
            this.finishWorkout();
          }
        }
      ]
    );
  }

  finishWorkout() {
    // Parar todos os timers
    this.clearTimers();

    // Aqui seria feito o salvamento do treino
    this.showToast('Treino finalizado com sucesso!');

    // Voltar para o dashboard
    setTimeout(() => {
      this.router.navigate(['/pupil/dashboard']);
    }, 1000);
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

  async presentAlert(header: string, message: string, buttons: any[]) {
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
        initialRestTime: this.initialRestTime
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

      if (state.isMainTimerRunning) {
        this.startMainTimer();
      }

      if (state.isRestTimerActive) {
        this.restTimer = state.restTimer;
        this.initialRestTime = state.initialRestTime;
        this.startRestTimer();
      }

      if (state.isCountdownActive) {
        this.startCountdown(this.countdownTimer);
      }
    }
  }

  // Método para pausar/retomar o descanso
  toggleRest() {
    if (this.isRestTimerActive) {
      if (this.isRestPaused) {
        this.restTimerInterval = setInterval(() => {
          this.restTimer--;
          if (this.restTimer <= 0) {
            this.completeRest();
          }
        }, 1000);
        this.isRestPaused = false;
      } else {
        clearInterval(this.restTimerInterval);
        this.isRestPaused = true;
      }
    }
  }
}
