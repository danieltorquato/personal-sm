import { Component, OnInit, ViewChild, ElementRef, OnDestroy } from '@angular/core';
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
}

@Component({
  selector: 'app-pool-workout',
  templateUrl: './pool-workout.page.html',
  styleUrls: ['./pool-workout.page.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, FormsModule]
})
export class PoolWorkoutPage implements OnInit, OnDestroy {
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
  restTimer: number = 0;
  initialRestTime: number = 0;
  isMainTimerRunning: boolean = false;
  isRestTimerActive: boolean = false;
  mainTimerInterval: any;
  restTimerInterval: any;

  // Estado das séries
  currentSetIndex: number = 0;
  currentRepetition: number = 1;
  completedSets: number = 0;
  completedDistance: number = 0;
  laps: Lap[] = [];

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

  ngOnInit() {
    // Iniciar o temporizador principal automaticamente
    this.startMainTimer();
  }

  ngOnDestroy() {
    // Limpar os intervalos ao sair da página
    this.clearTimers();
  }

  clearTimers() {
    if (this.mainTimerInterval) {
      clearInterval(this.mainTimerInterval);
    }
    if (this.restTimerInterval) {
      clearInterval(this.restTimerInterval);
    }
  }

  // Métodos para o temporizador principal
  startMainTimer() {
    if (!this.isMainTimerRunning) {
      this.isMainTimerRunning = true;
      this.mainTimerInterval = setInterval(() => {
        this.mainTimer++;
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
  }

  toggleMainTimer() {
    if (this.isMainTimerRunning) {
      this.stopMainTimer();
    } else {
      this.startMainTimer();
    }
  }

  // Métodos para o temporizador de descanso
  startRestTimer() {
    const currentSet = this.workout.sets[this.currentSetIndex];
    this.restTimer = currentSet.restTime;
    this.initialRestTime = currentSet.restTime;

    if (this.restTimer > 0) {
      this.isRestTimerActive = true;
      this.restTimerInterval = setInterval(() => {
        this.restTimer--;

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
    this.completeRest();
  }

  completeRest() {
    clearInterval(this.restTimerInterval);
    this.isRestTimerActive = false;
    this.moveToNextRepetition();
  }

  // Métodos para gerenciar séries
  recordLap() {
    if (this.currentSetIndex >= this.workout.sets.length) {
      return;
    }

    const currentSet = this.workout.sets[this.currentSetIndex];

    // Registrar o tempo da volta
    this.laps.push({
      exerciseName: currentSet.exerciseName,
      setIndex: this.currentSetIndex,
      repetition: this.currentRepetition,
      distance: currentSet.distance,
      time: this.mainTimer
    });

    // Atualizar a distância completada
    this.completedDistance += currentSet.distance;

    // Verificar se a repetição atual foi concluída
    if (this.currentRepetition >= currentSet.repetitions) {
      // Série concluída
      this.completedSets++;
      this.moveToNextSet();
    } else {
      // Iniciar tempo de descanso entre repetições
      this.currentRepetition++;
      this.startRestTimer();
    }
  }

  moveToNextRepetition() {
    // Preparar para a próxima repetição
    if (this.currentSetIndex < this.workout.sets.length) {
      this.showToast(`Prepare-se para a repetição ${this.currentRepetition}`);
    }
  }

  moveToNextSet() {
    this.currentSetIndex++;
    this.currentRepetition = 1;

    if (this.currentSetIndex < this.workout.sets.length) {
      // Ainda há mais séries
      this.showToast(`Próxima série: ${this.workout.sets[this.currentSetIndex].exerciseName}`);
    } else {
      // Treino concluído
      this.showToast('Todas as séries concluídas! Parabéns!');
    }
  }

  skipCurrentSet() {
    this.presentAlert(
      'Pular Série',
      'Tem certeza que deseja pular esta série?',
      [
        {
          text: 'Não',
          role: 'cancel'
        },
        {
          text: 'Sim',
          handler: () => {
            this.moveToNextSet();
          }
        }
      ]
    );
  }

  // Métodos de finalização
  showFinishConfirm() {
    this.presentAlert(
      'Finalizar Treino',
      'Tem certeza que deseja finalizar o treino agora?',
      [
        {
          text: 'Não',
          role: 'cancel'
        },
        {
          text: 'Sim',
          handler: () => {
            this.finishWorkout();
          }
        }
      ]
    );
  }

  finishWorkout() {
    // Parar todos os temporizadores
    this.clearTimers();

    // No caso real, aqui enviaria os dados do treino para o backend
    // e redirecaria para a página de resumo com o ID do treino

    // Simular um ID de treino finalizado
    const workoutId = Date.now().toString();

    this.router.navigate(['/pupil/pool-workout-summary', workoutId]);
  }

  // Métodos utilitários
  getCompletionPercentage(): number {
    if (this.workout.sets.length === 0) return 0;
    return Math.floor((this.completedSets / this.workout.sets.length) * 100);
  }

  formatTime(seconds: number): string {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  }

  async showToast(message: string) {
    const toast = await this.toastController.create({
      message,
      duration: 2000,
      position: 'middle'
    });
    toast.present();
  }

  async presentAlert(header: string, message: string, buttons: any[]) {
    const alert = await this.alertController.create({
      header,
      message,
      buttons
    });
    await alert.present();
  }
}
