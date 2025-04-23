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
  IonRange,
  IonSegment,
  IonSegmentButton
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
import { Subscription, forkJoin, throwError } from 'rxjs';
import { catchError, finalize } from 'rxjs/operators';
import { AuthService } from 'src/app/services/auth.service';
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
  part?: string; // Parcela do treino (A, B, C, etc)
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
  workout_division?: string;
  exercisesByPart?: {[key: string]: Exercise[]};
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
    IonRange,
    IonSegment,
    IonSegmentButton
  ]
})
export class StartingTrainingPage implements OnInit, OnDestroy {
  workoutId: any;
  workout: Workout | null = null;
  activeWorkout: any = null; // Para armazenar os dados do workout active
  isLoading = true;
  error: string | null = null;

  // Controle de estado do treino
  workoutStarted = false;
  currentExerciseIndex = 0;
  workoutFinished = false;

  // Controle de divisão de treino
  currentWorkoutPart: string = 'A';
  filteredExercises: Exercise[] = [];

  // ID da sessão atual do treino
  currentSessionId: any;

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
    private navController: NavController,
    private authService: AuthService
  ) {
    // Adiciona os ícones necessários
    addIcons({settingsOutline,alertCircleOutline,timeOutline,barbellOutline,pulseOutline,calendarOutline,fitnessOutline,play,videocamOutline,arrowBack,arrowForward,checkmarkCircleOutline,timerOutline,flameOutline,alarmOutline,playCircleOutline,closeCircle});
  }

  ngOnInit() {
    this.authService.getCurrentUser().subscribe(user => {
      this.authService.studentId = user?.id;
      console.log('ID do usuário:', this.authService.studentId);
    });
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
        // Obter os dados do treino
        this.loadWorkoutWithActive();
      } else {
        this.showError('ID do treino não encontrado');
      }
    });

    this.subscriptions.add(routeSub);
  }

  /**
   * Carrega os dados do treino ativo e os exercícios
   */
  loadWorkoutWithActive() {
    this.isLoading = true;
    this.error = null;



    // Primeiro chamamos a API para obter o workout ativo
    const activeWorkoutSub = this.workoutService.getActiveWorkout('gym', this.authService.studentId)
      .pipe(
        catchError(err => {
          console.error('Erro ao carregar workout ativo:', err);
          // Se falhar, continuamos com a carga dos exercícios
          this.loadSetsWorkout();
          throw err;
        })
      )
      .subscribe(response => {
        console.log('Resposta do workout ativo:', response);

        if (response && response.success && response.data) {
          // Armazenar informações do treino ativo
          this.activeWorkout = response.data;
          console.log('Workout ativo obtido:', this.activeWorkout);

          // Em seguida, carregamos os exercícios específicos
          this.loadSetsWorkout();
        } else {
          // Se não encontrar treino ativo, carregamos apenas os exercícios
          this.loadSetsWorkout();
        }
      });

    this.subscriptions.add(activeWorkoutSub);
  }

  /**
   * Carrega os exercícios específicos do treino
   */
  loadSetsWorkout() {
    const setsSub = this.workoutService.getSetsWorkout(this.workoutId)
      .pipe(
        catchError(err => {
          console.error('Erro ao carregar exercícios do treino:', err);
          this.showError('Não foi possível carregar os detalhes do treino. Verifique sua conexão e tente novamente.');
          throw err;
        }),
        finalize(() => {
          this.isLoading = false;
        })
      )
      .subscribe(response => {
        console.log('Resposta dos exercícios do treino:', response);

        if (response && response.success) {
          let workoutData;

          if (Array.isArray(response.data)) {
            // Criar objeto de treino combinando dados
            workoutData = {
              id: this.workoutId,
              name: this.activeWorkout?.name || 'Treino Personalizado',
              exercises: response.data,
              workout_division: this.activeWorkout?.workout_division || 'unico',
              level: this.activeWorkout?.level || 'Intermediário',
              intensity: this.activeWorkout?.intensity || 'Moderada',
              validate_to: this.activeWorkout?.validate_to || new Date().toISOString(),
              duration: this.activeWorkout?.duration || '45 min',
              notes: this.activeWorkout?.notes || ''
            };
          } else {
            // Resposta já contém objeto de treino
            workoutData = {
              id: response.data && typeof response.data === 'object' && 'id' in response.data ? (response.data as any).id : this.workoutId,
              name: response.data && typeof response.data === 'object' && 'name' in response.data ? (response.data as any).name : 'Treino Personalizado',
              exercises: response.data && typeof response.data === 'object' && 'exercises' in response.data ? (response.data as any).exercises : [],
              workout_division: this.activeWorkout?.workout_division ||
                (response.data && typeof response.data === 'object' && 'workout_division' in response.data ? (response.data as any).workout_division : 'unico'),
              level: response.data && typeof response.data === 'object' && 'level' in response.data ? (response.data as any).level : 'Intermediário',
              intensity: response.data && typeof response.data === 'object' && 'intensity' in response.data ? (response.data as any).intensity : 'Moderada',
              validate_to: response.data && typeof response.data === 'object' && 'validate_to' in response.data ? (response.data as any).validate_to : new Date().toISOString(),
              duration: response.data && typeof response.data === 'object' && 'duration' in response.data ? (response.data as any).duration : '45 min',
              notes: response.data && typeof response.data === 'object' && 'notes' in response.data ? (response.data as any).notes : '',
              created_at: response.data && typeof response.data === 'object' && 'created_at' in response.data ? (response.data as any).created_at : new Date().toISOString()
            };
          }

          // Processar os dados do treino
          this.processWorkoutData(workoutData);
        } else {
          this.showError(response?.message || 'Erro ao carregar treino');
        }
      });

    this.subscriptions.add(setsSub);
  }

  /**
   * Processa os dados do treino recebidos da API
   */
  private processWorkoutData(data: any) {
    try {
      if (!data) {
        throw new Error('Nenhum dado recebido');
      }

      console.log('Dados recebidos das APIs:', data);

      const workout: Workout = {
        id: data.id || '',
        name: data.name || data.title || 'Treino Personalizado',
        description: data.description,
        notes: data.notes || data.description,
        duration: this.formatDuration(data.duration),
        level: this.formatLevel(data.level),
        intensity: this.formatIntensity(data.intensity),
        validate_to: data.validate_to || new Date().toISOString(),
        exercises: this.formatExercises(data),
        created_at: data.created_at || new Date().toISOString(),
        updated_at: data.updated_at,
        workout_division: data.workout_division || 'unico'
      };

      this.workout = workout;
      console.log('Objeto workout processado:', this.workout);

      // Verificar se o treino tem exercícios em diferentes parcelas
      const parcelTypes = new Set<string>();

      // Coletar todas as parcelas únicas dos exercícios
      workout.exercises.forEach(exercise => {
        if (exercise.part) {
          parcelTypes.add(exercise.part);
        }
      });

      // Se houver parcelas nos exercícios, definir a divisão do treino com base nessas parcelas
      if (parcelTypes.size > 0) {
        workout.workout_division = Array.from(parcelTypes).join('');
        console.log(`Divisão do treino definida a partir das parcelas: ${workout.workout_division}`);
      }

      // Organizar exercícios por parcela
      if (workout.workout_division !== 'unico') {
        workout.exercisesByPart = {};

        // Inicializar arrays para cada parcela encontrada
        Array.from(parcelTypes).forEach(part => {
          workout.exercisesByPart![part] = [];
        });

        // Distribuir exercícios nas parcelas
        workout.exercises.forEach(exercise => {
          const part = exercise.part || 'A'; // Default para parte A se não especificado

          if (!workout.exercisesByPart![part]) {
            workout.exercisesByPart![part] = [];
          }

          workout.exercisesByPart![part].push(exercise);
        });

        console.log('Exercícios organizados por parcela:', workout.exercisesByPart);
      }

      // Definir a parcela atual com base na primeira parcela encontrada, se houver
      if (parcelTypes.size > 0) {
        this.currentWorkoutPart = Array.from(parcelTypes)[0];
        console.log(`Parcela atual definida para: ${this.currentWorkoutPart}`);
      }

      // Inicializar exercícios filtrados
      this.filterExercisesByPart();

      return workout;
    } catch (error) {
      console.error('Erro ao processar dados do treino:', error);
      this.showError('Erro ao processar os dados do treino');
      return null;
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
        completed: false,
        part: ex.part || 'A'
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
    this.loadWorkoutWithActive();
  }

  /**
   * Inicia a execução do treino
   */
  startWorkout() {
    if (!this.workout) return;

    // Verificar se temos exercícios filtrados para a parte atual
    if (this.filteredExercises && this.filteredExercises.length > 0) {

      // Atualizamos os exercícios do treino para mostrar apenas os da parte selecionada
      console.log(`Iniciando treino parte ${this.currentWorkoutPart} com ${this.filteredExercises.length} exercícios`);

      // Criar uma cópia do treino com apenas os exercícios filtrados
      const workoutCopy = { ...this.workout };
      workoutCopy.exercises = [...this.filteredExercises];
      this.workout = workoutCopy;

    } else {
      console.warn('Nenhum exercício encontrado para esta parte do treino');
      this.presentToast('Nenhum exercício encontrado para esta parte do treino', 'warning');
      return;
    }

    // Registrar o início da sessão de treino na API
    this.registerWorkoutStart();
    console.log('ID da sessão:', this.currentSessionId);

    this.workoutStarted = true;
    this.currentExerciseIndex = 0;

    // Reset do estado de finalização
    this.workoutFinished = false;

    console.log('Treino iniciado:', {
      currentPart: this.currentWorkoutPart,
      exerciseCount: this.workout.exercises.length,
      firstExercise: this.workout.exercises[0]?.name,

    });

    // Exibir o primeiro exercício
    setTimeout(() => {
      document.querySelector('swiper-container')?.swiper.slideTo(0);
    }, 300);
  }

  /**
   * Registra o início da sessão de treino no backend
   */
  private registerWorkoutStart() {


    const loadingRef = this.presentLoading('Registrando início do treino...');

    // Converter o ID do treino para número
    const workoutId = typeof this.workout.id === 'string' ? parseInt(this.workout.id, 10) : this.workout.id;

    const startSessionSub = this.workoutService.startGymSession(workoutId, this.currentWorkoutPart)
      .pipe(
        catchError(err => {
          console.error('Erro ao registrar início do treino:', err);
          this.presentToast('Não foi possível registrar o início do treino, mas você pode continuar', 'warning');
          loadingRef.then(loading => loading.dismiss());
          return throwError(() => err);
        }),
        finalize(() => {
          loadingRef.then(loading => loading.dismiss());
        })
      )
      .subscribe(response => {
        if (response && response.success) {
          // Se a resposta já tiver o ID da sessão, use-o
          if (response.data && response.data.session_id) {
            this.currentSessionId = response.data.session_id;
            console.log(`Sessão de treino iniciada com ID: ${this.currentSessionId}`);
          } else {
            // Caso contrário, busque o último ID de sessão criada
            this.fetchLastSessionId(workoutId);
            console.log('ID da sessão:', this.currentSessionId);
          }
        }
      });

    this.subscriptions.add(startSessionSub);
  }

  /**
   * Busca o ID da última sessão de treino criada
   */
  private fetchLastSessionId(workoutId: number) {
    const fetchSessionSub = this.workoutService.getLastGymSessionId(workoutId)
      .pipe(
        catchError(err => {
          console.error('Erro ao buscar ID da sessão de treino:', err);
          return throwError(() => err);
        })
      )
      .subscribe(response => {
        if (response && response.success && response.data) {
          this.currentSessionId = response.data.session_id;
          console.log(`ID da última sessão de treino obtido: ${this.currentSessionId}`);
        } else {
          console.warn('Não foi possível obter o ID da sessão de treino');
        }
      });

    this.subscriptions.add(fetchSessionSub);
  }

  /**
   * Finaliza o treino completo
   */
  finishWorkout() {

      this.registerWorkoutCompletion();
      this.workoutFinished = true;
    this.presentToast('Treino concluído com sucesso!', 'success');



  }

  /**
   * Registra a conclusão da sessão de treino no backend
   */
  private registerWorkoutCompletion() {
    // Verificar se o ID da sessão existe antes de enviar
    if (!this.currentSessionId) {
      console.log('ID da sessão não encontrado, tentando buscar...');

      // Verificar se o workout existe
      if (!this.workout) {
        this.presentToast('Não foi possível registrar a conclusão do treino: informações do treino indisponíveis', 'warning');
        return;
      }

      // Converter o ID do treino para número
      const workoutId = typeof this.workout.id === 'string' ? parseInt(this.workout.id, 10) : this.workout.id;

      // Buscar o último ID de sessão e então completar o treino
      this.workoutService.getLastGymSessionId(workoutId).subscribe({
        next: (response) => {
          if (response && response.success && response.data) {
            this.currentSessionId = response.data.session_id;
            console.log(`ID da sessão obtido: ${this.currentSessionId}, finalizando treino...`);
            this.completeGymSession();
          } else {
            this.presentToast('Não foi possível registrar a conclusão do treino: ID da sessão não encontrado', 'warning');
          }
        },
        error: (err) => {
          console.error('Erro ao buscar ID da sessão:', err);
          this.presentToast('Não foi possível registrar a conclusão do treino', 'warning');
        }
      });

      return;
    }

    this.completeGymSession();
  }

  /**
   * Completa a sessão de treino com o ID atual
   */
  private completeGymSession() {
    const loadingRef = this.presentLoading('Registrando conclusão do treino...');

    const completeSessionSub = this.workoutService.completeGymSession(this.currentSessionId)
      .pipe(
        catchError(err => {
          console.error('Erro ao registrar conclusão do treino:', err);
          this.presentToast('Não foi possível registrar a conclusão do treino', 'warning');
          loadingRef.then(loading => loading.dismiss());
          return throwError(() => err);
        }),
        finalize(() => {
          loadingRef.then(loading => loading.dismiss());
        })
      )
      .subscribe(response => {
        if (response && response.success) {
          console.log('Sessão de treino concluída com sucesso');
        }
      });

    this.subscriptions.add(completeSessionSub);
  }

  /**
   * Apresenta um loading
   */
  private async presentLoading(message: string): Promise<HTMLIonLoadingElement> {
    const loading = await this.loadingController.create({
      message: message,
      spinner: 'crescent'
    });
    await loading.present();
    return loading;
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

  /**
   * Método chamado quando o segmento de divisão de treino é alterado
   */
  segmentChanged(event: any) {
    this.currentWorkoutPart = event.detail.value;
    console.log('Segmento alterado para:', this.currentWorkoutPart);
    this.filterExercisesByPart();
  }

  /**
   * Filtra os exercícios de acordo com a parte do treino selecionada
   */
  filterExercisesByPart() {
    if (!this.workout) return;

    console.log('Filtrando exercícios para a parte:', this.currentWorkoutPart);
    console.log('Divisão do treino:', this.workout.workout_division);
    console.log('Exercícios disponíveis:', this.workout.exercises);

    // Filtrar exercícios com base na parcela (part)
    this.filteredExercises = this.workout.exercises.filter(exercise => {
      // Verificar se o exercício tem a propriedade part definida
      if (exercise.part) {
        console.log(`Exercício ${exercise.name} está na parte ${exercise.part}`);
        return exercise.part === this.currentWorkoutPart;
      } else {
        // Se não tiver part, verificar se há informações na parte exercisesByPart
        if (this.workout?.exercisesByPart && this.workout.exercisesByPart[this.currentWorkoutPart]) {
          const exerciseIds = this.workout.exercisesByPart[this.currentWorkoutPart].map(ex => ex.id);
          return exerciseIds.includes(exercise.id);
        }
        // Se não tiver nenhuma informação de parcela, mostrar na parte A por padrão
        return this.currentWorkoutPart === 'A';
      }
    });

    console.log('Exercícios filtrados:', this.filteredExercises);
  }

  /**
   * Formata um único exercício
   */
  private formatExercise(exercise: any): Exercise {
    return {
      id: exercise.id || '',
      name: exercise.name || exercise.exercise_name || 'Exercício',
      sets: exercise.sets || 3,
      reps: exercise.reps || 12,
      weight: exercise.weight,
      duration: exercise.duration,
      rest: exercise.rest,
      instructions: exercise.instructions || exercise.notes,
      imageUrl: exercise.image_url || exercise.image,
      videoUrl: exercise.video_url || exercise.video
    };
  }

  /**
   * Retorna as parcelas únicas disponíveis no treino atual
   */
  getUniqueParts(): string[] {
    if (!this.workout || !this.workout.exercises) {
      return ['A'];
    }

    // Obter partes únicas dos exercícios
    const partsSet = new Set<string>();

    this.workout.exercises.forEach(exercise => {
      if (exercise.part) {
        partsSet.add(exercise.part);
      }
    });

    // Se não houver partes definidas, retornar 'A' como padrão
    if (partsSet.size === 0) {
      return ['A'];
    }

    // Converter Set para Array e ordenar
    return Array.from(partsSet).sort();
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
}
