import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule, ToastController } from '@ionic/angular';
import { Router, ActivatedRoute } from '@angular/router';
import { DatePipe } from '@angular/common';

interface WorkoutSetSummary {
  exerciseName: string;
  distance: number;
  repetitions: number;
  totalTime: number;
  pace: string;
  completed: boolean;
}

interface WorkoutSummary {
  id: string;
  name: string;
  completedDate: Date;
  startTime: string;
  endTime: string;
  totalDistance: number;
  duration: number;
  completedSets: number;
  totalSets: number;
  averagePace: string;
  calories: number;
  averageHeartRate: number;
  sets: WorkoutSetSummary[];
  improvement: number;
  feedback?: string;
  personalName?: string;
  personalAvatar?: string;
  feedbackTime?: string;
}

@Component({
  selector: 'app-pool-workout-summary',
  templateUrl: './pool-workout-summary.page.html',
  styleUrls: ['./pool-workout-summary.page.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, FormsModule, DatePipe]
})
export class PoolWorkoutSummaryPage implements OnInit {
  // Em um caso real, estes dados viriam de um serviço que busca do backend
  workoutSummary: WorkoutSummary = {
    id: '123456',
    name: 'Treino de Resistência - Nível Intermediário',
    completedDate: new Date(),
    startTime: '10:30',
    endTime: '11:45',
    totalDistance: 2000,
    duration: 4500, // 1h 15min em segundos
    completedSets: 5,
    totalSets: 6,
    averagePace: '2:15',
    calories: 450,
    averageHeartRate: 145,
    improvement: 8,
    sets: [
      {
        exerciseName: 'Nado Livre',
        distance: 200,
        repetitions: 2,
        totalTime: 480, // 8 minutos em segundos
        pace: '2:00',
        completed: true
      },
      {
        exerciseName: 'Batida de Pernas',
        distance: 100,
        repetitions: 4,
        totalTime: 720, // 12 minutos em segundos
        pace: '3:00',
        completed: true
      },
      {
        exerciseName: 'Nado Costas',
        distance: 100,
        repetitions: 2,
        totalTime: 330, // 5.5 minutos em segundos
        pace: '2:45',
        completed: true
      },
      {
        exerciseName: 'Nado Peito',
        distance: 100,
        repetitions: 2,
        totalTime: 360, // 6 minutos em segundos
        pace: '3:00',
        completed: true
      },
      {
        exerciseName: 'Borboleta',
        distance: 50,
        repetitions: 2,
        totalTime: 210, // 3.5 minutos em segundos
        pace: '3:30',
        completed: true
      },
      {
        exerciseName: 'Medley',
        distance: 200,
        repetitions: 1,
        totalTime: 390, // 6.5 minutos em segundos
        pace: '3:15',
        completed: false
      }
    ],
    feedback: 'Excelente progresso, Ana! Você melhorou significativamente no nado costas. Continue trabalhando na técnica de respiração da borboleta para o próximo treino.',
    personalName: 'Carlos Mendes',
    personalAvatar: 'assets/avatars/personal1.jpg',
    feedbackTime: 'Hoje às 12:30'
  };

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private toastController: ToastController
  ) {}

  ngOnInit() {
    // No caso real, usaríamos o ID do treino para buscar os dados
    const workoutId = this.route.snapshot.paramMap.get('id');
    if (workoutId) {
      // this.loadWorkoutSummary(workoutId);
      console.log('Carregando resumo do treino ID:', workoutId);
    }
  }

  // Métodos para formatação de tempo
  formatDuration(seconds: number): string {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const remainingSeconds = seconds % 60;

    if (hours > 0) {
      return `${hours}h ${minutes}m ${remainingSeconds}s`;
    } else {
      return `${minutes}m ${remainingSeconds}s`;
    }
  }

  formatTime(seconds: number): string {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds < 10 ? '0' : ''}${remainingSeconds}`;
  }

  // Métodos de navegação
  backToDashboard() {
    this.router.navigate(['/pupil/dashboard']);
  }

  seeHistory() {
    this.router.navigate(['/pupil/workout-history']);
  }

  // Compartilhar treino
  async shareWorkout() {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Meu treino de natação',
          text: `Concluí o treino "${this.workoutSummary.name}" com ${this.workoutSummary.totalDistance}m em ${this.formatDuration(this.workoutSummary.duration)}!`,
          url: window.location.href
        });
      } catch (err) {
        console.error('Erro ao compartilhar:', err);
        this.presentToast('Não foi possível compartilhar o treino');
      }
    } else {
      // Fallback para dispositivos que não suportam Web Share API
      this.presentToast('Compartilhamento não suportado neste dispositivo');
    }
  }

  // Carregar dados de um treino real (simulado)
  loadWorkoutSummary(workoutId: string) {
    // Em um caso real, esta função faria uma chamada a um serviço
    console.log('Carregando dados do treino ID:', workoutId);
    // this.workoutService.getWorkoutSummary(workoutId).subscribe(data => {
    //   this.workoutSummary = data;
    // });
  }

  async presentToast(message: string) {
    const toast = await this.toastController.create({
      message,
      duration: 2000,
      position: 'bottom'
    });
    toast.present();
  }
}
