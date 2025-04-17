import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import {
  IonBackButton,
  IonButtons,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonButton,
  IonSkeletonText,
  IonSpinner,
  IonIcon,
  IonText,
  IonCard,
  IonCardContent,
  IonCardHeader,
  IonCardTitle,
  IonLabel,
  ToastController,
  LoadingController,
  NavController,
  IonItem,
  IonList,
  IonInput,
  IonRange
} from '@ionic/angular/standalone';
import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { register } from 'swiper/element/bundle';
import { ActivatedRoute } from '@angular/router';
import { WorkoutService } from 'src/app/services/workout.service';
import { addIcons } from 'ionicons';
import {
  timerOutline,
  barbellOutline,
  flameOutline,
  alarmOutline,
  playCircleOutline,
  alertCircleOutline,
  settingsOutline,
  timeOutline,
  pulseOutline,
  calendarOutline,
  fitnessOutline,
  play,
  checkmarkCircleOutline,
  arrowBack,
  arrowForward,
  closeCircle, videocamOutline } from 'ionicons/icons';
import { Subscription } from 'rxjs';
import { catchError, finalize } from 'rxjs/operators';

// Registrar Swiper elementos customizados
register();

// Interface para tipagem
interface Exercise {
  id: string;
  name: string;
  sets: number;
  reps: number;
  weight?: number;
  duration?: string;
  rest?: number;
  instructions?: string;
  imageUrl?: string;
  videoUrl?: string;
  completed?: boolean;
}

interface Workout {
  id: string;
  name: string;
  description?: string;
  notes?: string;
  duration: string;
  level: string;
  intensity: string;
  validate_to: string;
  exercises: Exercise[];
  created_at: string;
  updated_at?: string;
}

@Component({
  selector: 'app-starting-training',
  templateUrl: './starting-training.page.html',
  styleUrls: ['./starting-training.page.scss'],
  standalone: true,
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  imports: [
    IonList,
    IonItem,
    CommonModule,
    FormsModule,
    IonBackButton,
    IonButtons,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonButton,
    IonSkeletonText,
    IonSpinner,
    IonIcon,
    IonText,
    IonCard,
    IonCardContent,
    IonCardHeader,
    IonCardTitle,
    IonLabel,
    IonInput,
    IonRange
  ]
})
export class StartingTrainingPage implements OnInit, OnDestroy {
  workoutId: any;
  workout: Workout | null = null;
  isLoading = true;
  error: string | null = null;

  // Controle de estado do treino
  workoutStarted = false;
  currentExerciseIndex = 0;
  workoutFinished = false;

  // Opções do slide
  swiperOptions = {
    initialSlide: 0,
    speed: 400,
    allowTouchMove: false
  };

  private subscriptions = new Subscription();

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private workoutService: WorkoutService,
    private loadingController: LoadingController,
    private toastController: ToastController,
    private navController: NavController
  ) {
    // Adiciona os ícones necessários
    addIcons({settingsOutline,alertCircleOutline,timeOutline,barbellOutline,pulseOutline,calendarOutline,fitnessOutline,play,videocamOutline,arrowBack,arrowForward,checkmarkCircleOutline,timerOutline,flameOutline,alarmOutline,playCircleOutline,closeCircle});
  }

  ngOnInit() {
    this.getWorkoutIdFromRoute();
  }

  ngOnDestroy() {
    this.subscriptions.unsubscribe();
  }

  /**
   * Obtém o ID do treino a partir dos parâmetros da rota
   */
  private getWorkoutIdFromRoute() {
    const routeSub = this.route.paramMap.subscribe(params => {
      const id = params.get('id');
      this.workoutId = id || '';
      if (this.workoutId) {
        this.loadWorkout();
      } else {
        this.showError('ID do treino não encontrado');
      }
    });

    this.subscriptions.add(routeSub);
  }

  /**
   * Carrega os dados do treino do serviço
   */
  loadWorkout() {
    this.isLoading = true;
    this.error = null;

    console.log('Carregando treino com ID:', this.workoutId);

    const workoutSub = this.workoutService.getSetsWorkout(this.workoutId)
      .pipe(
        catchError(err => {
          console.error('Erro ao carregar treino:', err);
          this.showError('Não foi possível carregar os detalhes do treino. Verifique sua conexão e tente novamente.');
          throw err;
        }),
        finalize(() => {
          this.isLoading = false;
        })
      )
      .subscribe(response => {
        console.log('Resposta da API:', response);

        if (response && response.success) {
          if (Array.isArray(response.data)) {
            // Resposta é um array de exercícios
            this.processWorkoutData(response.data);
          } else if (response.data) {
            // Resposta é um objeto com dados do treino
            this.processWorkoutData(response.data);
          } else {
            this.showError('Formato de dados inesperado');
          }
        } else if (response && Array.isArray(response)) {
          // Resposta é diretamente um array
          this.processWorkoutData(response);
        } else {
          this.showError('Dados do treino não encontrados');
        }
      });

    this.subscriptions.add(workoutSub);
  }

  /**
   * Processa os dados do treino recebidos da API
   */
  private processWorkoutData(data: any) {
    try {
      console.log('Dados recebidos da API:', data);

      // Mapeia os dados da API para o formato esperado pelo componente
      this.workout = {
        id: data.id || this.workoutId,
        name: data.name || 'Treino Personalizado',
        description: data.description,
        notes: data.notes,
        duration: this.formatDuration(data.duration),
        level: this.formatLevel(data.level),
        intensity: this.formatIntensity(data.intensity),
        validate_to: data.validate_to || new Date().toISOString(),
        exercises: this.formatExercises(data),
        created_at: data.created_at || new Date().toISOString(),
        updated_at: data.updated_at
      };

      console.log('Objeto workout processado:', this.workout);
    } catch (error) {
      console.error('Erro ao processar dados do treino:', error);
      this.showError('Erro ao processar os dados do treino');
    }
  }

  /**
   * Formata a duração do treino
   */
  private formatDuration(duration: any): string {
    if (!duration) return '45 min';

    if (typeof duration === 'number') {
      return `${duration} min`;
    }

    return duration;
  }

  /**
   * Formata o nível do treino
   */
  private formatLevel(level: any): string {
    if (!level) return 'Intermediário';

    const levels: Record<string, string> = {
      'beginner': 'Iniciante',
      'intermediate': 'Intermediário',
      'advanced': 'Avançado',
    };

    return levels[level.toLowerCase()] || level;
  }

  /**
   * Formata a intensidade do treino
   */
  private formatIntensity(intensity: any): string {
    if (!intensity) return 'Moderada';

    const intensities: Record<string, string> = {
      'low': 'Baixa',
      'medium': 'Moderada',
      'high': 'Alta',
    };

    return intensities[intensity.toLowerCase()] || intensity;
  }

  /**
   * Formata os exercícios do treino
   */
  private formatExercises(data: any): Exercise[] {
    console.log('Formatando exercícios:', data);

    // Se data for um array, assume que são os conjuntos de exercícios
    if (Array.isArray(data)) {
      console.log('data é um array de exercícios');
      return data.map(ex => ({
        id: ex.id || `ex-${Math.random().toString(36).substr(2, 9)}`,
        name: ex.exercise_name || 'Exercício',
        sets: ex.sets || 3,
        reps: ex.reps || 12,
        weight: ex.weight || 0,
        duration: ex.duration_seconds ? this.formatSeconds(ex.duration_seconds) : undefined,
        rest: ex.rest_seconds || 60,
        instructions: ex.instructions,
        imageUrl: ex.imageUrl,
        videoUrl: ex.videoUrl,
        completed: false
      }));
    }

    // Se data.exercises existe e é um array, usa ele
    if (data.exercises && Array.isArray(data.exercises)) {
      console.log('Usando data.exercises array');
      return this.formatExercises(data.exercises);
    }

    // Se chegou aqui e não temos nenhum dado de exercício, verificamos se temos um conjunto de exercícios
    // na resposta direta
    console.log('Verificando se temos exercícios na resposta direta');
    const exercises = [];

    for (const key in data) {
      if (typeof data[key] === 'object' && data[key] !== null && data[key].exercise_name) {
        exercises.push(data[key]);
      }
    }

    if (exercises.length > 0) {
      console.log('Encontrados exercícios na resposta direta:', exercises);
      return this.formatExercises(exercises);
    }

    console.warn('Nenhum exercício encontrado nos dados');
    return [];
  }

  /**
   * Formata segundos para o formato MM:SS
   */
  private formatSeconds(seconds: number): string {
    if (!seconds) return '';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }

  /**
   * Exibe uma mensagem de erro e atualiza o estado
   */
  private showError(message: string) {
    this.error = message;
    this.presentToast(message, 'danger');
  }

  /**
   * Apresenta um toast com uma mensagem
   */
  private async presentToast(message: string, color: 'danger' | 'success' | 'warning' | 'primary' = 'danger') {
    const toast = await this.toastController.create({
      message: message,
      duration: 3000,
      position: 'bottom',
      color: color,
      buttons: [
        {
          text: 'Fechar',
          role: 'cancel'
        }
      ]
    });

    await toast.present();
  }

  /**
   * Tenta carregar o treino novamente
   */
  retryLoading() {
    this.loadWorkout();
  }

  /**
   * Inicia o treino com slides para cada exercício
   */
  startWorkout() {
    if (!this.workout) {
      this.showError('Treino não disponível');
      return;
    }

    this.presentToast('Iniciando seu treino...', 'success');
    this.workoutStarted = true;
    this.currentExerciseIndex = 0;
  }

  /**
   * Avança para o próximo exercício
   */
  nextExercise() {
    if (!this.workout) return;

    // Marca o exercício atual como concluído
    this.workout.exercises[this.currentExerciseIndex].completed = true;

    // Verifica se é o último exercício
    if (this.currentExerciseIndex < this.workout.exercises.length - 1) {
      this.currentExerciseIndex++;
    } else {
      this.finishWorkout();
    }
  }

  /**
   * Volta para o exercício anterior
   */
  previousExercise() {
    if (this.currentExerciseIndex > 0) {
      this.currentExerciseIndex--;
    }
  }

  /**
   * Finaliza o treino completo
   */
  finishWorkout() {
    this.workoutFinished = true;
    this.presentToast('Treino concluído com sucesso!', 'success');

    // Lógica para salvar os dados do treino concluído
    // Normalmente você enviaria os dados para o servidor aqui
  }

  /**
   * Volta para a visualização do treino
   */
  backToWorkoutOverview() {
    this.workoutStarted = false;
    this.workoutFinished = false;
  }

  /**
   * Reinicia o treino atual
   */
  restartWorkout() {
    if (!this.workout) return;

    // Resetar o estado de conclusão dos exercícios
    this.workout.exercises.forEach(ex => ex.completed = false);

    this.currentExerciseIndex = 0;
    this.workoutFinished = false;
    this.presentToast('Treino reiniciado', 'primary');
  }

  /**
   * Obtém o exercício atual
   */
  getCurrentExercise(): Exercise | null {
    if (!this.workout || !this.workout.exercises.length) return null;
    return this.workout.exercises[this.currentExerciseIndex];
  }

  /**
   * Calcula o progresso do treino (0-100%)
   */
  getWorkoutProgress(): number {
    if (!this.workout || !this.workout.exercises.length) return 0;
    const totalExercises = this.workout.exercises.length;
    const completedExercises = this.workout.exercises.filter(ex => ex.completed).length;
    return Math.round((completedExercises / totalExercises) * 100);
  }

  /**
   * Abre o vídeo do exercício em uma nova janela
   */
  openVideo(url: string) {
    if (url) {
      window.open(url, '_blank');
    } else {
      this.presentToast('Não há vídeo disponível para este exercício', 'warning');
    }
  }
}
