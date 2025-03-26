import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule, ToastController } from '@ionic/angular';
import { Router, ActivatedRoute } from '@angular/router';
import { DatePipe } from '@angular/common';
import { HttpClient, HttpHeaders, HttpClientModule } from '@angular/common/http';
import { WorkoutService } from '../../../../services/workout.service';
import { Observable } from 'rxjs';
import { WorkoutSummary } from '../../../../Models/workout.model';

// Interface para o resumo de uma série
interface WorkoutSetSummary {
  exercise: string;
  distance: number;
  repetitions: number;
  completedRepetitions: number;
  bestTime: number;
  avgTime: number;
  bestPace: string;
  avgPace: string;
  laps: {
    repetition: number;
    time: number;
    pace: string;
  }[];
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

  getWorkoutSession(sessionId: number): Observable<any> {
    // Replace with the actual HTTP call or logic
    return this.http.get<any>(`/api/workouts/session/${sessionId}`);
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
    id: 0,
    name: '',
    date: '',
    completedDate: '',
    startTime: '',
    endTime: '',
    total_time: 0,
    totalTime: 0,
    duration: 0,
    total_distance: 0,
    totalDistance: 0,
    avg_pace: '',
    averagePace: '',
    exercise_type: 'swim',
    averageHeartRate: 0,
    calories: 0,
    improvement: 0,
    completedSets: 0,
    totalSets: 0,
    personalName: '',
    personalAvatar: '',
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
    private http: HttpClient,
    private workoutService: WorkoutService
  ) {
    // Criar instância do serviço API
    this.apiService = new ApiService(http);
  }

  ngOnInit() {
    // Garantir que todas as propriedades necessárias estejam inicializadas
    this.workoutSummary.averageHeartRate = 0;
    this.workoutSummary.calories = 0;
    this.workoutSummary.improvement = 0;

    // Verificar se há um ID na URL
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.loadWorkoutSummary(id);
    } else {
      this.loadDemoSummary();
    }
  }

  // Carregar dados da sessão de treino da API
  loadWorkoutSession() {
    this.isLoading = true;

    this.apiService.getWorkoutSession(Number(this.sessionId)).subscribe({
      next: (response: any) => {
        if (response && response.success) {
          // Mapear dados da API para o formato do componente
          const sessionData = response.session;
          const workout = response.workout;

          this.workoutSummary = {
            id: sessionData.id || 0,
            name: workout.name || 'Treino sem nome',
            date: this.formatDate(sessionData.start_time) || '',
            completedDate: this.formatDate(sessionData.end_time) || '',
            startTime: this.formatDate(sessionData.start_time) || '',
            endTime: this.formatDate(sessionData.end_time) || '',
            total_time: sessionData.total_time || 0,
            totalTime: sessionData.total_time || 0,
            duration: sessionData.duration || 0,
            total_distance: sessionData.total_distance || 0,
            totalDistance: sessionData.total_distance || 0,
            avg_pace: this.calculatePace(sessionData.total_time, sessionData.total_distance) || '',
            averagePace: this.calculatePace(sessionData.total_time, sessionData.total_distance) || '',
            exercise_type: workout.exercise_type || 'swim',
            averageHeartRate: workout.average_heart_rate || 0,
            calories: workout.calories || 0,
            improvement: workout.improvement || 0,
            completedSets: sessionData.completed_sets || 0,
            totalSets: sessionData.total_sets || 0,
            personalName: workout.trainer_name || 'Personal',
            personalAvatar: workout.trainer_avatar || '',
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
                exercise: set.exercise_name || 'Exercício',
                distance: set.distance || 0,
                repetitions: set.repetitions || 0,
                completedRepetitions: set.completed_repetitions || 0,
                bestTime: set.best_time || 0,
                avgTime: set.avg_time || 0,
                bestPace: set.best_pace || '00:00',
                avgPace: this.calculatePace(totalSetTime, totalDistance) || '00:00',
                laps: set.laps ? set.laps.map((lap: any) => {
                  return {
                    repetition: lap.repetition_number || 1,
                    time: lap.lap_time || 0,
                    pace: lap.pace || '00:00'
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

  // Método para carregar dados de demonstração
  loadDemoSummary() {
    this.workoutSummary = {
      id: 12345,
      name: 'Treino de Resistência - Nível Intermediário',
      date: new Date().toISOString().split('T')[0],
      completedDate: new Date().toISOString().split('T')[0],
      startTime: '08:00',
      endTime: '08:40',
      total_time: 2400,
      totalTime: 2400,
      duration: 40,
      total_distance: 2000,
      totalDistance: 2000,
      avg_pace: '02:00',
      averagePace: '02:00',
      exercise_type: 'swim',
      averageHeartRate: 128,
      calories: 320,
      improvement: 5,
      completedSets: 3,
      totalSets: 3,
      personalName: 'Carlos Mendes',
      personalAvatar: 'assets/avatars/personal.jpg',
      feedback: 'Ótimo desempenho! Manteve uma boa consistência no ritmo durante todo o treino.',
      feedbackTime: new Date().toISOString().split('T')[0],
      sets: [
        {
          exercise: 'Nado Livre',
          distance: 200,
          repetitions: 2,
          completedRepetitions: 2,
          bestTime: 240,
          avgTime: 240,
          bestPace: '02:00',
          avgPace: '02:00',
          laps: [
            { repetition: 1, time: 240, pace: '02:00' },
            { repetition: 2, time: 235, pace: '01:57.5' }
          ]
        },
        {
          exercise: 'Batida de Pernas',
          distance: 100,
          repetitions: 4,
          completedRepetitions: 4,
          bestTime: 150,
          avgTime: 150,
          bestPace: '02:30',
          avgPace: '02:30',
          laps: [
            { repetition: 1, time: 150, pace: '02:30' },
            { repetition: 2, time: 150, pace: '02:30' },
            { repetition: 3, time: 150, pace: '02:30' },
            { repetition: 4, time: 150, pace: '02:30' }
          ]
        },
        {
          exercise: 'Nado Costas',
          distance: 100,
          repetitions: 2,
          completedRepetitions: 2,
          bestTime: 150,
          avgTime: 150,
          bestPace: '02:30',
          avgPace: '02:30',
          laps: [
            { repetition: 1, time: 150, pace: '02:30' },
            { repetition: 2, time: 150, pace: '02:30' }
          ]
        }
      ]
    };
    this.isLoading = false;
  }

  // Calcular ritmo (pace) baseado no tempo e distância
  calculatePace(time: number, distance: number): string {
    if (!time || !distance || distance === 0) {
      return '00:00';
    }

    // Calcular o tempo por 100m
    const paceSeconds = (time / distance) * 100;
    return this.formatTimer(paceSeconds);
  }

  // Formatar tempo em segundos para mm:ss
  formatTimer(seconds: number): string {
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
    const message = `Completei ${this.workoutSummary.name} com distância total de ${this.workoutSummary.totalDistance}m em ${this.formatTime(new Date(this.workoutSummary.totalTime || 0))}!`;

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

  loadWorkoutSummary(id: string) {
    this.isLoading = true;

    // Usar o WorkoutService para buscar os dados
    this.workoutService.getWorkoutSession(parseInt(id)).subscribe(
      (response) => {
        if (response && response.success && response.data) {
          // Extrair dados da resposta
          const sessionData = response.data;

          // Criar um objeto com valores padrão e sobrescrever com dados do servidor
          const defaultData = {
            id: 0,
            workout_name: 'Treino sem nome',
            start_time: '',
            end_time: '',
            total_time: 0,
            total_distance: 0,
            average_heart_rate: 0,
            improvement: 0,
            completed_sets: 0,
            total_sets: 0,
            trainer_name: 'Personal',
            trainer_avatar: '',
            feedback: '',
            feedback_time: '',
            sets: []
          };

          // Mesclar dados da resposta com valores padrão
          const data = { ...defaultData, ...sessionData };

          // Inicializar todas as propriedades usando valores mesclados
          this.workoutSummary = {
            id: data.id,
            name: data.workout_name,
            date: this.formatDate(data.start_time),
            completedDate: this.formatDate(data.end_time),
            startTime: data.start_time ? this.formatTime(new Date(data.start_time)) : '',
            endTime: data.end_time ? this.formatTime(new Date(data.end_time)) : '',
            total_time: data.total_time,
            totalTime: data.total_time,
            duration: Math.floor(data.total_time / 60),
            total_distance: data.total_distance,
            totalDistance: data.total_distance,
            avg_pace: this.calculatePace(data.total_time, data.total_distance),
            averagePace: this.calculatePace(data.total_time, data.total_distance),
            exercise_type: 'swim',
            averageHeartRate: data.average_heart_rate,
            calories: this.calculateCalories(data.total_time, data.total_distance),
            improvement: data.improvement,
            completedSets: data.completed_sets,
            totalSets: data.total_sets,
            personalName: data.trainer_name,
            personalAvatar: data.trainer_avatar,
            feedback: data.feedback,
            feedbackTime: this.formatDate(data.feedback_time),
            sets: this.formatSets(data.sets)
          };
        } else {
          this.showToast('Erro ao carregar o resumo do treino');
          this.loadDemoSummary();
        }
        this.isLoading = false;
      },
      (err) => {
        console.error('Erro ao carregar sessão:', err);
        this.showToast('Erro ao carregar o resumo do treino');
        this.loadDemoSummary();
        this.isLoading = false;
      }
    );
  }

  // Método auxiliar para calcular calorias estimadas
  calculateCalories(totalTime: number, distance: number): number {
    // Estimativa simples: 4 calorias por minuto de natação média
    const minutes = totalTime / 60;
    return Math.round(minutes * 4 * 1.1); // 10% a mais como estimativa
  }

  // Método para formatar conjuntos de exercícios
  formatSets(sets: any[]): WorkoutSetSummary[] {
    return sets.map(set => {
      const totalSetTime = set.total_time || 0;
      const totalDistance = set.distance * (set.completed_repetitions || 0);

      return {
        exercise: set.exercise_name || 'Exercício',
        distance: set.distance || 0,
        repetitions: set.repetitions || 0,
        completedRepetitions: set.completed_repetitions || 0,
        bestTime: set.best_time || 0,
        avgTime: set.avg_time || 0,
        bestPace: this.calculatePace(set.best_time, set.distance) || '00:00',
        avgPace: this.calculatePace(totalSetTime, totalDistance) || '00:00',
        laps: this.formatLaps(set.laps || [])
      };
    });
  }

  // Método para formatar voltas
  formatLaps(laps: any[]): { repetition: number; time: number; pace: string; }[] {
    return laps.map(lap => ({
      repetition: lap.repetition_number || 1,
      time: lap.lap_time || 0,
      pace: lap.pace || this.calculatePace(lap.lap_time, lap.distance) || '00:00'
    }));
  }

  // Método para formatar o horário no formato HH:MM
  formatTime(date: Date | string): string {
    if (!date) return '';

    const d = new Date(date);
    const hours = d.getHours().toString().padStart(2, '0');
    const minutes = d.getMinutes().toString().padStart(2, '0');

    return `${hours}:${minutes}`;
  }
  seeHistory() {
    this.router.navigate(['/pupil/workout-history']);
  }
  backToDashboard() {
    this.router.navigate(['/pupil/dashboard']);
  }
  formatDuration(duration: number): string {
    const minutes = Math.floor(duration / 60);
    const seconds = duration % 60;
    return `${minutes}m ${seconds}s`;
  }

  // Método para exibir mensagens
  async showToast(message: string): Promise<void> {
    const toast = await this.toastController.create({
      message,
      duration: 2000,
      position: 'top',
    });
    await toast.present();
  }
}
