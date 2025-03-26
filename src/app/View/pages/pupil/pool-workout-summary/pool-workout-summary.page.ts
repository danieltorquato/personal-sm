import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule, ToastController } from '@ionic/angular';
import { Router, ActivatedRoute } from '@angular/router';
import { DatePipe } from '@angular/common';
import { HttpClient, HttpHeaders, HttpClientModule } from '@angular/common/http';

// Interface para o resumo de uma série
interface WorkoutSetSummary {
  exerciseName: string;
  distance: number;
  repetitions: number;
  restTime: number;
  totalTime: number;
  avgPace: string; // mm:ss por 100m
  laps: {
    repetition: number;
    time: number;
    pace: string;
    isPartial: boolean;
    partialDistance?: number;
  }[];
}

// Interface para o resumo do treino completo
interface WorkoutSummary {
  id: string;
  name: string;
  date: string;
  totalDistance: number;
  totalTime: number;
  avgPace: string; // mm:ss por 100m
  personalName: string;
  personalId: string;
  feedback?: string;
  sets: WorkoutSetSummary[];
}

// Serviço para API
class ApiService {
  private baseUrl = 'http://localhost/api'; // Substitua pela URL da sua API
  private token: string;

  constructor(private http: HttpClient) {
    // Buscar token do localStorage
    this.token = localStorage.getItem('auth_token') || '';
  }

  private getHeaders() {
    return {
      headers: new HttpHeaders({
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.token}`
      })
    };
  }

  // Buscar detalhes da sessão de treino
  getWorkoutSession(sessionId: string) {
    return this.http.get(`${this.baseUrl}/workouts/session/${sessionId}`, this.getHeaders());
  }
}

@Component({
  selector: 'app-pool-workout-summary',
  templateUrl: './pool-workout-summary.page.html',
  styleUrls: ['./pool-workout-summary.page.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, FormsModule, DatePipe, HttpClientModule]
})
export class PoolWorkoutSummaryPage implements OnInit {
  // Dados do resumo do treino
  workoutSummary: WorkoutSummary = {
    id: '',
    name: '',
    date: new Date().toISOString().split('T')[0],
    totalDistance: 0,
    totalTime: 0,
    avgPace: '00:00',
    personalName: '',
    personalId: '',
    sets: []
  };

  sessionId: string = '';
  isLoading: boolean = true;
  errorLoading: boolean = false;

  // Serviço API
  private apiService: ApiService;

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private toastController: ToastController,
    private http: HttpClient
  ) {
    // Criar instância do serviço API
    this.apiService = new ApiService(http);
  }

  ngOnInit() {
    // Obter ID da sessão da URL
    this.route.params.subscribe(params => {
      if (params['sessionId']) {
        this.sessionId = params['sessionId'];
        this.loadWorkoutSession();
      } else {
        // Sem ID da sessão, carregar dados de demonstração
        this.loadDemoSummary();
        this.isLoading = false;
      }
    });
  }

  // Carregar dados da sessão de treino da API
  loadWorkoutSession() {
    this.isLoading = true;

    this.apiService.getWorkoutSession(this.sessionId).subscribe({
      next: (response: any) => {
        if (response && response.success) {
          // Mapear dados da API para o formato do componente
          const sessionData = response.session;
          const workout = response.workout;

          this.workoutSummary = {
            id: sessionData.id || '',
            name: workout.name || 'Treino sem nome',
            date: this.formatDate(sessionData.start_time) || new Date().toISOString().split('T')[0],
            totalDistance: sessionData.total_distance || 0,
            totalTime: sessionData.total_time || 0,
            avgPace: this.calculatePace(sessionData.total_time, sessionData.total_distance),
            personalName: workout.trainer_name || 'Personal',
            personalId: workout.trainer_id || '',
            feedback: sessionData.feedback || '',
            sets: []
          };

          // Mapear séries e voltas
          if (response.sets && response.sets.length > 0) {
            this.workoutSummary.sets = response.sets.map((set: any) => {
              // Calcular tempo total e pace médio para a série
              const totalSetTime = set.total_time || 0;
              const totalDistance = set.distance * set.repetitions;

              return {
                exerciseName: set.exercise_name || 'Exercício',
                distance: set.distance || 0,
                repetitions: set.repetitions || 0,
                restTime: set.rest_time || 0,
                totalTime: totalSetTime,
                avgPace: this.calculatePace(totalSetTime, totalDistance),
                laps: set.laps ? set.laps.map((lap: any) => {
                  return {
                    repetition: lap.repetition_number || 1,
                    time: lap.lap_time || 0,
                    pace: lap.pace || '00:00',
                    isPartial: lap.is_partial || false,
                    partialDistance: lap.partial_distance || undefined
                  };
                }) : []
              };
            });
          }

          this.isLoading = false;
        } else {
          // Erro na resposta, carregar dados de demonstração
          this.errorLoading = true;
          this.loadDemoSummary();
          this.isLoading = false;
        }
      },
      error: (error) => {
        console.error('Erro ao carregar sessão de treino:', error);
        this.errorLoading = true;
        this.loadDemoSummary();
        this.isLoading = false;
      }
    });
  }

  // Formatar data para exibição
  formatDate(dateString: string): string {
    if (!dateString) return '';

    try {
      const date = new Date(dateString);
      return date.toISOString().split('T')[0];
    } catch (e) {
      return '';
    }
  }

  // Carregar dados de demonstração
  loadDemoSummary() {
    this.workoutSummary = {
      id: '12345',
      name: 'Treino de Resistência - Nível Intermediário',
      date: new Date().toISOString().split('T')[0],
      totalDistance: 2000,
      totalTime: 2400, // 40min
      avgPace: '02:00', // 2min por 100m
      personalName: 'Carlos Mendes',
      personalId: '67890',
      feedback: 'Ótimo desempenho! Manteve uma boa consistência no ritmo durante todo o treino.',
      sets: [
        {
          exerciseName: 'Nado Livre',
          distance: 200,
          repetitions: 2,
          restTime: 30,
          totalTime: 480, // 8min
          avgPace: '02:00', // 2min por 100m
          laps: [
            { repetition: 1, time: 240, pace: '02:00', isPartial: false },
            { repetition: 2, time: 235, pace: '01:57.5', isPartial: false }
          ]
        },
        {
          exerciseName: 'Batida de Pernas',
          distance: 100,
          repetitions: 4,
          restTime: 20,
          totalTime: 600, // 10min
          avgPace: '02:30', // 2min30s por 100m
          laps: [
            { repetition: 1, time: 150, pace: '02:30', isPartial: false },
            { repetition: 2, time: 150, pace: '02:30', isPartial: false },
            { repetition: 3, time: 150, pace: '02:30', isPartial: false },
            { repetition: 4, time: 150, pace: '02:30', isPartial: false }
          ]
        },
        {
          exerciseName: 'Nado Costas',
          distance: 100,
          repetitions: 2,
          restTime: 30,
          totalTime: 300, // 5min
          avgPace: '02:30', // 2min30s por 100m
          laps: [
            { repetition: 1, time: 150, pace: '02:30', isPartial: false },
            { repetition: 2, time: 150, pace: '02:30', isPartial: false }
          ]
        }
      ]
    };
  }

  // Calcular ritmo (pace) baseado no tempo e distância
  calculatePace(time: number, distance: number): string {
    if (!time || !distance || distance === 0) {
      return '00:00';
    }

    // Calcular o tempo por 100m
    const paceSeconds = (time / distance) * 100;
    return this.formatTime(paceSeconds);
  }

  // Formatar tempo em segundos para mm:ss
  formatTime(seconds: number): string {
    if (!seconds || isNaN(seconds)) {
      return '00:00';
    }

    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);

    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }

  // Compartilhar resultados
  shareWorkout() {
    // Implementação de compartilhamento
    const message = `Completei ${this.workoutSummary.name} com distância total de ${this.workoutSummary.totalDistance}m em ${this.formatTime(this.workoutSummary.totalTime)}!`;

    if (navigator.share) {
      navigator.share({
        title: 'Meu treino de natação',
        text: message,
        url: window.location.href
      })
      .catch(error => console.error('Erro ao compartilhar', error));
    } else {
      // Fallback para dispositivos que não suportam a API de compartilhamento
      console.log('Compartilhar não suportado neste dispositivo');
      // Aqui poderia ser implementado um compartilhamento alternativo
    }
  }

  // Navegar de volta para a dashboard
  goToDashboard() {
    this.router.navigate(['/pupil/dashboard']);
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
