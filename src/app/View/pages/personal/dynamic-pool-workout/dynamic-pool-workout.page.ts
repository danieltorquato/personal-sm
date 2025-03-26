import { Component, OnInit, ViewChild, ElementRef, CUSTOM_ELEMENTS_SCHEMA, AfterViewInit, OnDestroy, inject } from '@angular/core';
import { IonicSlides, AlertController, ToastController, ActionSheetController } from '@ionic/angular';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { register } from 'swiper/element';
import { WorkoutService } from '../../../../services/workout.service';
import { ApiService } from '../../../../services/api.service';

interface WorkoutSet {
  exercise: string;
  distance: number;
  repetitions: number;
  restTime: number;
  notes?: string;
  completedRepetitions?: number;
  laps: Lap[];
  partialDistances?: number[]; // Distâncias parciais configuradas pelo professor
  equipment?: string[]; // Equipamentos necessários para o exercício
}

interface Lap {
  time: number;
  pace?: string;
  distance?: number;  // Distância percorrida para esta volta (pode ser parcial)
  isPartial?: boolean; // Indica se é uma marcação parcial
}

interface ExerciseInfo {
  value: string;
  name: string;
  image: string;
  description?: string;
}

interface WorkoutSummary {
  date: Date;
  totalDistance: number;
  totalTime: number;
  totalSets: number;
  exercises: {
    name: string;
    sets: {
      repetition: number;
      time: number;
      pace?: string;
    }[];
  }[];
}

@Component({
  selector: 'app-dynamic-pool-workout',
  templateUrl: './dynamic-pool-workout.page.html',
  styleUrls: ['./dynamic-pool-workout.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    IonicModule
  ],
  schemas: [CUSTOM_ELEMENTS_SCHEMA]
})
export class DynamicPoolWorkoutPage implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('slides') slides!: ElementRef;
  @ViewChild('audioPlayer') audioPlayer!: ElementRef;

  // Configurações do slide
  slideOpts = {
    initialSlide: 0,
    speed: 400,
    allowTouchMove: false,
    preventInteractionOnTransition: true,
    autoHeight: true
  };

  // Biblioteca de exercícios
  exerciseLibrary: ExerciseInfo[] = [];

  // Dados do treino
  workout: {
    id: string;
    name: string;
    date: Date;
    studentId: string;
    sets: WorkoutSet[];
  } = {
    id: '',
    name: '',
    date: new Date(),
    studentId: '',
    sets: []
  };

  // Estado atual do treino
  currentSetIndex: number = 0;
  currentRepetition: number = 1;
  currentSet: WorkoutSet = {
    exercise: '',
    distance: 0,
    repetitions: 0,
    restTime: 0,
    completedRepetitions: 1,
    laps: [] as Lap[],
    partialDistances: [], // Adicionando campo faltante
    equipment: [] // Adicionando equipamento faltante
  };
  totalWorkoutTime: number = 0;
  currentExercise: string = '';
  currentDistance: number = 0;

  // Relatório do treino
  workoutSummary: WorkoutSummary = {
    date: new Date(),
    totalDistance: 0,
    totalTime: 0,
    totalSets: 0,
    exercises: []
  };

  // Timers
  isMainTimerRunning: boolean = false;
  isRestTimerActive: boolean = false;
  isRestTimerPaused: boolean = false;
  currentTimerValue: number = 0;
  restTimerValue: number = 0;
  timerCentiseconds: number = 0; // Para centésimos de segundo (0.01s)

  // Timers de intervalo
  mainTimerInterval: any;
  restTimerInterval: any;

  // Estado adicional para armazenamento
  private readonly WORKOUT_STATE_KEY = 'dynamic_pool_workout_state';

  // Adicionando propriedades para contagem regressiva
  isCountdownActive: boolean = false;
  countdownTimer: number = 0;
  countdownInterval: any;

  // Adiciona variável para controlar o registro de voltas parciais
  currentLapDistance: number = 0; // Distância acumulada das voltas parciais

  // Equipamentos de natação
  equipmentOptions: {value: string, label: string}[] = [];

  // Adicionar propriedades privadas
  private workoutService: WorkoutService;
  private apiService: ApiService;

  constructor(
    private router: Router,
    private alertController: AlertController,
    private toastController: ToastController,
    private actionSheetController: ActionSheetController,

  ) {
    this.workoutService = inject(WorkoutService);
    this.apiService = inject(ApiService);
  }

  ngOnInit() {
    register();


    // Carregar exercícios do banco de dados
    this.loadExercises();

    // Carregar equipamentos do banco de dados
    this.loadEquipment();

    // Verificar se existe um treino em andamento
    this.loadSavedWorkout();
  }

  // Carregar exercícios do banco de dados
  loadExercises() {
    this.apiService.get<any>('exercises/list').subscribe({
      next: (response: any) => {
        if (response && response.success) {
          this.exerciseLibrary = response.data.map((exercise: any) => ({
            value: exercise.id,
            name: exercise.name,
            image: exercise.image_url || 'assets/exercises/default.jpg',
            description: exercise.description || ''
          }));
        } else {
          console.error('Erro ao buscar exercícios:', response.message);
        }
      },
      error: (err: any) => {
        console.error('Erro ao buscar exercícios:', err);
      }
    });
  }

  // Carregar equipamentos do banco de dados
  loadEquipment() {
    this.apiService.get<any>('equipment/list').subscribe({
      next: (response: any) => {
        if (response && response.success) {
          this.equipmentOptions = response.data.map((equipment: any) => ({
            value: equipment.id,
            label: equipment.name
          }));
        } else {
          console.error('Erro ao buscar equipamentos:', response.message);
        }
      },
      error: (err: any) => {
        console.error('Erro ao buscar equipamentos:', err);
      }
    });
  }

  // Carregar treino salvo ou carregar da API se ID estiver na URL
  loadSavedWorkout() {
    // Verificar se há um ID de treino na URL
    const urlParams = new URLSearchParams(window.location.search);
    const workoutId = urlParams.get('id');

    if (workoutId) {
      // Buscar treino do banco de dados
      this.workoutService.getWorkout(Number(workoutId)).subscribe({
        next: (response) => {
          if (response && response.success) {
            const workoutData = response.data;

            this.workout = {
              id: workoutData?.id?.toString() ?? '',
              name: workoutData?.name ?? '',
              date: new Date(workoutData?.created_at ?? Date.now()),
              studentId: workoutData?.id?.toString() ?? '',
              sets: (workoutData?.sets || []).map((set: any) => ({
                exercise: set.exercise_id,
                distance: set.distance,
                repetitions: set.repetitions,
                restTime: set.rest_time,
                notes: set.notes || '',
                completedRepetitions: 1,
                laps: [],
                partialDistances: set.partial_distances ? JSON.parse(set.partial_distances) : [],
                equipment: set.equipment ? JSON.parse(set.equipment) : []
              }))
            };

            // Inicializar o treino
            this.initializeWorkout();
          } else {
            // Se falhar ao carregar o treino, crie um treino em branco
            this.createEmptyWorkout();
          }
        },
        error: (err) => {
          console.error('Erro ao buscar treino:', err);
          this.createEmptyWorkout();
        }
      });
    } else {
      // Recuperar treino salvo localmente ou criar um novo
      const savedState = localStorage.getItem(this.WORKOUT_STATE_KEY);
      if (savedState) {
        this.loadWorkoutState(JSON.parse(savedState));
      } else {
        this.createEmptyWorkout();
      }
    }
  }

  // Criar um treino em branco
  createEmptyWorkout() {
    this.workout = {
      id: new Date().getTime().toString(),
      name: 'Novo Treino',
      date: new Date(),
      studentId: '',
      sets: []
    };
  }

  // Método modificado para criar treino fictício
  createFictitiousWorkout() {
    // Mostrar alerta informando que está buscando dados do banco
    this.showLoadingDataAlert();

    // Buscar um treino de exemplo do banco de dados
    this.apiService.get('workouts/sample').subscribe({
      next: (response: any) => {
        if (response && response.success && response.data) {
          // Usar o treino de exemplo retornado pela API
          const sampleWorkout = response.data;
          this.workout = {
            id: new Date().getTime().toString(),
            name: sampleWorkout.name,
            date: new Date(),
            studentId: sampleWorkout.student_id || '',
            sets: sampleWorkout.sets.map((set: any) => ({
              exercise: set.exercise_id,
              distance: set.distance,
              repetitions: set.repetitions,
              restTime: set.rest_time,
              notes: set.notes || '',
              completedRepetitions: 1,
              laps: [],
              partialDistances: set.partial_distances ? JSON.parse(set.partial_distances) : [],
              equipment: set.equipment ? JSON.parse(set.equipment) : []
            }))
          };
        } else {
          // Fallback para um treino básico caso a API não retorne dados
          this.createBasicSampleWorkout();
        }

        // Limpar estado anterior e inicializar novo treino
        localStorage.removeItem(this.WORKOUT_STATE_KEY);
        this.initializeWorkout();
      },
      error: (err) => {
        console.error('Erro ao buscar treino de exemplo:', err);
        this.createBasicSampleWorkout();
        this.initializeWorkout();
      }
    });
  }

  // Criar um treino básico de exemplo como fallback
  createBasicSampleWorkout() {
    const defaultExercise = this.exerciseLibrary.length > 0 ?
                           this.exerciseLibrary[0].value :
                           'nado-livre';

    this.workout = {
      id: new Date().getTime().toString(),
      name: 'Treino Básico',
      date: new Date(),
      studentId: '',
      sets: [
        {
          exercise: defaultExercise,
          distance: 50,
          repetitions: 4,
          restTime: 30,
          notes: '',
          completedRepetitions: 1,
          laps: [],
          partialDistances: [25],
          equipment: []
        }
      ]
    };
  }

  // Mostrar alerta de carregamento de dados
  async showLoadingDataAlert() {
    const alert = await this.alertController.create({
      header: 'Carregando Dados',
      message: 'Buscando informações do banco de dados...',
      buttons: ['OK']
    });

    await alert.present();
  }

  ngAfterViewInit() {
    // Configurar o Swiper após a view ser inicializada
    const swiperEl = this.slides.nativeElement;
    swiperEl.swiper.allowTouchMove = false;

    // Habilitar rolagem vertical dentro dos slides
    swiperEl.swiper.params.touchMoveStopPropagation = false;
    swiperEl.swiper.params.simulateTouch = false;
    swiperEl.swiper.updateSize();

    // Adicionar eventos de listener do Swiper
    swiperEl.addEventListener('slidechange', () => {
      this.onSlideChange();
    });
  }


  // Inicializa o treino
  initializeWorkout() {
    this.currentSetIndex = 0;
    this.currentRepetition = 1;
    this.currentSet = { ...this.workout.sets[0] };
    this.totalWorkoutTime = 0;
    this.isMainTimerRunning = false;
    this.isRestTimerActive = false;
    this.currentTimerValue = 0;

    // Inicializar o relatório do treino
    this.workoutSummary = {
      date: new Date(),
      totalDistance: 0,
      totalTime: 0,
      totalSets: this.workout.sets.length,
      exercises: []
    };
  }

  // --- CONTROLE DE SLIDES ---
  onSlideChange() {
    const swiperEl = this.slides.nativeElement;
    const activeIndex = swiperEl.swiper.activeIndex;

    if (activeIndex < this.workout.sets.length) {
      this.currentSetIndex = activeIndex;
      this.currentSet = { ...this.workout.sets[activeIndex] };
      this.currentRepetition = this.currentSet.completedRepetitions || 1;
    }
  }

  onSlideTouch() {
    // Pode adicionar lógica adicional quando o usuário tocar no slide
  }

  // Navegação entre exercícios
  async nextSet(): Promise<void> {
    if (this.currentSetIndex < this.workout.sets.length - 1) {
      this.pauseMainTimer();
      this.currentSetIndex++;
      this.currentSet = { ...this.workout.sets[this.currentSetIndex] };
      this.currentRepetition = this.currentSet.completedRepetitions || 1;
      this.currentLapDistance = 0; // Resetar as distâncias parciais

      // Zerar o timer ao mudar de exercício
      this.currentTimerValue = 0;

      const swiperEl = this.slides.nativeElement;
      swiperEl.swiper.slideTo(this.currentSetIndex, 400);
    }
    return;
  }

  async previousSet(): Promise<void> {
    if (this.currentSetIndex > 0) {
      this.pauseMainTimer();
      this.currentSetIndex--;
      this.currentSet = { ...this.workout.sets[this.currentSetIndex] };
      this.currentRepetition = this.currentSet.completedRepetitions || 1;
      this.currentLapDistance = 0; // Resetar as distâncias parciais

      // Zerar o timer ao mudar de exercício
      this.currentTimerValue = 0;

      const swiperEl = this.slides.nativeElement;
      swiperEl.swiper.slideTo(this.currentSetIndex, 400);
    }
    return;
  }

  // --- TIMER PRINCIPAL ---
  toggleMainTimer() {
    if (this.isMainTimerRunning) {
      // Ao pausar, apenas pausa - removendo a exibição das opções
      this.pauseMainTimer();
    } else {
      if (!this.isCountdownActive) {
        // Sempre iniciar do zero
        this.currentTimerValue = 0;
        this.timerCentiseconds = 0;

        // Iniciar contagem regressiva
        this.startCountdown(() => {
          // Começar o timer após a contagem
          this.startMainTimerAfterCountdown();
        });
      }
    }
  }

  startMainTimer() {
    if (!this.isCountdownActive) {
      // Sempre iniciar do zero
      this.currentTimerValue = 0;
      this.timerCentiseconds = 0;

      this.startCountdown(() => {
        this.startMainTimerAfterCountdown();
      });
    }
  }

  startMainTimerAfterCountdown() {
    // Iniciar o cronômetro principal após o countdown
    if (this.isCountdownActive) return; // Se estiver em contagem regressiva, não iniciar

    // Zerar cronômetro antes de iniciar
    this.currentTimerValue = 0;
    this.timerCentiseconds = 0;

    this.isMainTimerRunning = true;
    this.mainTimerInterval = setInterval(() => {
      // Incrementar os centésimos
      this.timerCentiseconds++;

      // A cada 100 centésimos, incrementar 1 segundo
      if (this.timerCentiseconds >= 100) {
        this.currentTimerValue++;
        this.timerCentiseconds = 0;
        this.totalWorkoutTime++; // Incrementar o tempo total do treino
      }
    }, 10); // Intervalo de 10ms para incrementar centésimos
  }

  pauseMainTimer() {
    this.isMainTimerRunning = false;
    clearInterval(this.mainTimerInterval);
    // Não precisamos mais do método showTimerOptions já que agora zeramos o cronômetro
  }

  // --- CONTROLE DE REPETIÇÕES ---
  completeRepetition() {
    // Calcula a distância restante (se houver parciais)
    const remainingDistance = this.currentSet.distance - this.currentLapDistance;

    // Salvar o tempo desta repetição com precisão de centésimos
    const lapTimeMs = this.currentTimerValue * 1000 + this.timerCentiseconds * 10;
    const lapTime = lapTimeMs / 1000; // Converter para segundos com casas decimais
    const pace = this.calculatePace(lapTime, this.currentSet.distance);

    // Verificar se o array laps existe, se não, criar
    if (!this.workout.sets[this.currentSetIndex].laps) {
      this.workout.sets[this.currentSetIndex].laps = [];
    }

    // Se houver distância restante e parciais registradas, registramos essa última parte
    if (remainingDistance > 0 && this.currentLapDistance > 0) {
      this.workout.sets[this.currentSetIndex].laps.push({
        time: lapTime,
        pace: this.calculatePace(lapTime, remainingDistance),
        distance: remainingDistance,
        isPartial: true
      });
    }

    // Calcular a soma dos tempos se houver parciais
    let totalTime = lapTime;
    let lapsToConsider = [];

    if (this.currentLapDistance > 0) {
      // Filtra todas as parciais desta repetição
      lapsToConsider = this.workout.sets[this.currentSetIndex].laps.filter(lap => lap.isPartial);
      // Soma os tempos de todas as parciais
      totalTime = lapsToConsider.reduce((sum, lap) => sum + lap.time, 0);
    }

    // Adicionar a volta completa (com o tempo total)
    this.workout.sets[this.currentSetIndex].laps.push({
      time: totalTime,
      pace: this.calculatePace(totalTime, this.currentSet.distance),
      distance: this.currentSet.distance,
      isPartial: false
    });

    // Atualizar o relatório do treino
    this.updateWorkoutSummary(this.currentSetIndex, this.currentRepetition, totalTime, this.calculatePace(totalTime, this.currentSet.distance));

    // Parar o cronômetro
    this.pauseMainTimer();

    // Zerar completamente o cronômetro
    this.currentTimerValue = 0;
    this.timerCentiseconds = 0;

    // Resetar a distância acumulada para a próxima repetição
    this.currentLapDistance = 0;

    if (this.currentRepetition < this.currentSet.repetitions) {
      this.currentRepetition++;
      this.presentToast(`Repetição ${this.currentRepetition - 1} concluída!`);

      // Atualizar o progresso no objeto do treino
      if (this.workout.sets[this.currentSetIndex]) {
        this.workout.sets[this.currentSetIndex].completedRepetitions = this.currentRepetition;
      }

      // Iniciar descanso entre repetições se houver tempo de descanso configurado
      if (this.currentSet.restTime > 0) {
        this.startRestTimer();
      }
    } else {
      // Completou todas as repetições desta série
      this.presentToast('Série completa!');

      // Iniciar o descanso se houver tempo de descanso configurado
      if (this.currentSet.restTime > 0) {
        this.startRestTimer();
      } else if (this.currentSetIndex < this.workout.sets.length - 1) {
        // Se não tiver descanso e tiver próxima série, avançar
        this.nextSet();
      }
    }
  }

  // Calcular o ritmo (pace) em minutos por 100m com precisão de centésimos
  calculatePace(timeInSeconds: number, distanceInMeters: number): string {
    // Evitar divisão por zero
    if (distanceInMeters === 0) return '-';

    // Calcular o tempo por 100m
    const pacePerHundredMeters = (timeInSeconds * 100) / distanceInMeters;

    // Converter para minutos e segundos
    const minutes = Math.floor(pacePerHundredMeters / 60);
    const seconds = Math.floor(pacePerHundredMeters % 60);
    const deciseconds = Math.floor((pacePerHundredMeters * 10) % 10);

    return `${minutes}:${seconds.toString().padStart(2, '0')}.${deciseconds}/100m`;
  }

  // Atualizar o resumo do treino
  updateWorkoutSummary(setIndex: number, repetition: number, time: number, pace: string) {
    const exerciseName = this.getExerciseDisplayName(this.workout.sets[setIndex].exercise);

    // Verificar se o exercício já existe no relatório
    let exerciseIndex = this.workoutSummary.exercises.findIndex(ex => ex.name === exerciseName);

    if (exerciseIndex === -1) {
      // Adicionar novo exercício ao relatório
      this.workoutSummary.exercises.push({
        name: exerciseName,
        sets: []
      });
      exerciseIndex = this.workoutSummary.exercises.length - 1;
    }

    // Adicionar tempo da repetição
    this.workoutSummary.exercises[exerciseIndex].sets.push({
      repetition: repetition,
      time: time,
      pace: pace
    });

    // Atualizar distância total
    this.workoutSummary.totalDistance += this.workout.sets[setIndex].distance;

    // Tempo total é atualizado continuamente pelo timer
    this.workoutSummary.totalTime = this.totalWorkoutTime;
  }

  // --- CONTROLE DO TIMER DE DESCANSO ---
  startRestTimer() {
    // Carregar a próxima série para mostrar como próximo exercício
    let nextSetInfo = null;
    if (this.currentSetIndex < this.workout.sets.length - 1) {
      nextSetInfo = { ...this.workout.sets[this.currentSetIndex + 1] };
    }

    // Configurar o timer de descanso
    this.isRestTimerActive = true;
    this.isRestTimerPaused = false;
    this.restTimerValue = this.currentSet.restTime;

    console.log('Iniciando timer de descanso:', this.restTimerValue, 'segundos');


    // Limpar qualquer intervalo anterior
    if (this.restTimerInterval) {
      clearInterval(this.restTimerInterval);
    }

    // Iniciar a contagem regressiva
    this.restTimerInterval = setInterval(() => {
      this.restTimerValue--;



      if (this.restTimerValue <= 0) {
        this.endRestTimer();
      }
    }, 1000);
  }

  pauseRestTimer() {
    if (this.isRestTimerActive && !this.isRestTimerPaused) {
      // Pausar o timer
      this.isRestTimerPaused = true;
      clearInterval(this.restTimerInterval);
    }
  }

  resumeRestTimer() {
    if (this.isRestTimerActive && this.isRestTimerPaused) {
      // Retomar o timer
      this.isRestTimerPaused = false;
      this.restTimerInterval = setInterval(() => {
        this.restTimerValue--;



        if (this.restTimerValue <= 0) {
          this.endRestTimer();
        }
      }, 1000);
    }
  }

  skipRestTimer() {
    this.endRestTimer();
  }

  endRestTimer() {
    clearInterval(this.restTimerInterval);
    this.isRestTimerActive = false;
    this.isRestTimerPaused = false;



    // Zerar o timer atual
    this.currentTimerValue = 0;

    if (this.currentSetIndex < this.workout.sets.length - 1) {
      // Ir para próxima série
      this.nextSet();
    } else {
      // Ir para o resumo
      this.goToSummary();
    }
  }

  // --- FINALIZAÇÃO DO TREINO ---
  async goToSummary(): Promise<void> {
    // Finalizar o resumo do treino
    this.finalizeSummary();

    const totalSlides = this.workout.sets.length + 1; // +1 para o slide de resumo
    const swiperEl = this.slides.nativeElement;
    swiperEl.swiper.slideTo(totalSlides - 1, 400);
    return;
  }

  // Finalizar o resumo após o treino
  finalizeSummary() {
    // Garantir que a distância total e o tempo total estejam corretos
    this.workoutSummary.totalDistance = this.calculateTotalDistance();
    this.workoutSummary.totalTime = this.totalWorkoutTime;
    this.workoutSummary.date = new Date();
  }

  // Compartilhar o relatório do treino
  async shareWorkoutSummary(): Promise<void> {
    // Criar texto para compartilhamento
    const shareText = this.generateShareText();

    try {
      if (navigator.share) {
        await navigator.share({
          title: 'Relatório de Treino de Natação',
          text: shareText
        });
      } else {
        // Fallback para copiar para a área de transferência
        await this.copyToClipboard(shareText);
      }
    } catch (error) {
      console.error('Erro ao compartilhar:', error);
      this.presentToast('Não foi possível compartilhar o relatório.');
    }
    return;
  }

  // Gerar texto para compartilhamento
  generateShareText(): string {
    const date = this.workoutSummary.date.toLocaleDateString('pt-BR');

    let text = `🏊‍♂️ RELATÓRIO DE TREINO DE NATAÇÃO 🏊‍♀️\n`;
    text += `📅 Data: ${date}\n`;
    text += `🏊‍♂️ Distância total: ${this.workoutSummary.totalDistance}m\n`;
    text += `⏱️ Tempo total: ${this.formatTime(this.workoutSummary.totalTime)}\n\n`;

    this.workoutSummary.exercises.forEach(exercise => {
      text += `🔹 ${exercise.name}:\n`;

      exercise.sets.forEach(set => {
        text += `   Repetição ${set.repetition}: ${this.formatTime(set.time)}`;
        if (set.pace) {
          text += ` (Ritmo: ${set.pace})`;
        }
        text += `\n`;
      });

      text += `\n`;
    });

    text += `💪 Treino realizado com o App Personal SM`;

    return text;
  }

  // Copiar para a área de transferência (fallback para navegadores sem API de compartilhamento)
  async copyToClipboard(text: string): Promise<void> {
    try {
      await navigator.clipboard.writeText(text);
      this.presentToast('Relatório copiado para a área de transferência!');
    } catch (error) {
      console.error('Erro ao copiar para área de transferência:', error);
      this.presentToast('Não foi possível copiar o relatório.');
    }
    return;
  }

  finishWorkout() {
    // Aqui salvaria o treino no backend
    this.presentToast('Treino finalizado com sucesso!');
    this.router.navigate(['/personal/dashboard']);
  }

  // --- UTILIDADES ---
  getExerciseDisplayName(exerciseValue: string): string {
    const exercise = this.exerciseLibrary.find(e => e.value === exerciseValue);
    return exercise ? exercise.name : exerciseValue;
  }

  getExerciseImage(exerciseValue: string): string {
    const exercise = this.exerciseLibrary.find(e => e.value === exerciseValue);
    return exercise ? exercise.image : 'assets/exercises/default.jpg';
  }

  calculateTotalDistance(): number {
    return this.workout.sets.reduce((total, set) => {
      return total + (set.distance * set.repetitions);
    }, 0);
  }

  formatTime(timeInSeconds: number): string {
    // Para o timer ativo, vamos separar minutos, segundos e centésimos
    if (Number.isInteger(timeInSeconds)) {
      // É o timer principal ativo
      const min = Math.floor(this.currentTimerValue / 60);
      const sec = this.currentTimerValue % 60;

      // Formatar com os centésimos em movimento
      return `${min}:${sec.toString().padStart(2, '0')}.${this.timerCentiseconds.toString().padStart(2, '0')}`;
    } else {
      // É um tempo salvo ou o tempo total (com precisão de décimos)
      const timeMs = timeInSeconds * 1000;

      const minutes = Math.floor(timeMs / 60000);
      const seconds = Math.floor((timeMs % 60000) / 1000);
      const centiseconds = Math.floor((timeMs % 1000) / 10);

      return `${minutes}:${seconds.toString().padStart(2, '0')}.${centiseconds.toString().padStart(2, '0')}`;
    }
  }

  formatLapTime(timeInSeconds: number): string {
    // Similar ao formatTime, mas específico para voltas
    const timeMs = timeInSeconds * 1000;

    const minutes = Math.floor(timeMs / 60000);
    const seconds = Math.floor((timeMs % 60000) / 1000);
    const centiseconds = Math.floor((timeMs % 1000) / 10);

    return `${minutes}:${seconds.toString().padStart(2, '0')}.${centiseconds.toString().padStart(2, '0')}`;
  }

  createArray(size: number): any[] {
    return Array(size);
  }



  async presentToast(message: string): Promise<void> {
    const toast = await this.toastController.create({
      message,
      duration: 2000,
      position: 'top',
    });
    await toast.present();
    return;
  }

  ngOnDestroy() {
    // Salvar o estado do treino antes de destruir o componente
    this.saveWorkoutState();
    // Limpar os timers
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

  // Métodos para gerenciar cache do estado do treino
  private saveWorkoutState() {
    const state = {
      workout: this.workout,
      currentSetIndex: this.currentSetIndex,
      currentRepetition: this.currentRepetition,
      currentSet: this.currentSet,
      totalWorkoutTime: this.totalWorkoutTime,
      currentTimerValue: this.currentTimerValue,
      timerCentiseconds: this.timerCentiseconds,
      workoutSummary: this.workoutSummary,
      isCountdownActive: this.isCountdownActive,
      countdownTimer: this.countdownTimer,
      currentLapDistance: this.currentLapDistance
    };
    localStorage.setItem(this.WORKOUT_STATE_KEY, JSON.stringify(state));
  }

  private loadWorkoutState(state: any) {
    this.workout = state.workout;
    this.currentSetIndex = state.currentSetIndex;
    this.currentRepetition = state.currentRepetition;
    this.currentSet = state.currentSet;
    this.totalWorkoutTime = state.totalWorkoutTime;
    this.currentTimerValue = state.currentTimerValue;
    this.timerCentiseconds = state.timerCentiseconds || 0;
    this.workoutSummary = state.workoutSummary;
    this.isCountdownActive = state.isCountdownActive || false;
    this.countdownTimer = state.countdownTimer || 0;
    this.currentLapDistance = state.currentLapDistance || 0;

    // Restaurar os timers
    if (state.isMainTimerRunning) {
      this.startMainTimerAfterCountdown();
    }

    if (state.isRestTimerActive) {
      this.isRestTimerActive = true;
      this.isRestTimerPaused = state.isRestTimerPaused;
      this.restTimerValue = state.restTimerValue;

      if (!this.isRestTimerPaused) {
        this.startRestTimer();
      }
    }

    // Restaurar a contagem regressiva, se estiver ativa
    if (state.isCountdownActive && state.countdownTimer > 0) {
      this.startCountdown(() => {
        this.startMainTimerAfterCountdown();
      });
    }

    // Notificar o usuário
    this.presentToast('Treino recuperado da última sessão');
  }

  // Método para contagem regressiva
  startCountdown(callback: () => void) {
    this.isCountdownActive = true;
    this.countdownTimer = 3;


    clearInterval(this.countdownInterval);
    this.countdownInterval = setInterval(() => {
      this.countdownTimer--;

      if (this.countdownTimer > 0) {

      } else {
        // Contagem finalizada
        clearInterval(this.countdownInterval);
        this.isCountdownActive = false;


        // Executar o callback após a contagem
        callback();
      }
    }, 1000);
  }

  // Marca uma volta parcial com distâncias pré-definidas pelo professor
  markPartialLap(partialDistance: number = 0) {
    if (!this.isMainTimerRunning) return;

    // Verificar se a distância parcial é válida
    if (partialDistance <= 0 || this.currentLapDistance + partialDistance > this.currentSet.distance) {
      this.presentToast('Distância parcial inválida');
      return;
    }

    // Registra o tempo parcial com precisão de centésimos
    const lapTimeMs = this.currentTimerValue * 1000 + this.timerCentiseconds * 10;
    const lapTime = lapTimeMs / 1000; // Converter para segundos com casas decimais
    const pace = this.calculatePace(lapTime, partialDistance);

    // Verificar se o array laps existe, se não, criar
    if (!this.workout.sets[this.currentSetIndex].laps) {
      this.workout.sets[this.currentSetIndex].laps = [];
    }

    // Adiciona a volta parcial
    this.workout.sets[this.currentSetIndex].laps.push({
      time: lapTime,
      pace: pace,
      distance: partialDistance,
      isPartial: true
    });

    // Atualiza a distância acumulada
    this.currentLapDistance += partialDistance;

    // Notifica o usuário
    this.presentToast(`Tempo parcial (${partialDistance}m) registrado!`);

    // Verificar se completou a distância total com esta marcação parcial
    if (this.currentLapDistance === this.currentSet.distance) {
      // Se completou, registrar também a volta completa com o tempo total

      // Calcular a soma dos tempos de todas as parciais desta repetição
      const partialLaps = this.workout.sets[this.currentSetIndex].laps.filter(lap => lap.isPartial);
      const totalTime = partialLaps.reduce((sum, lap) => sum + lap.time, 0);
      const totalPace = this.calculatePace(totalTime, this.currentSet.distance);

      // Registrar a volta completa (soma de todas as parciais)
      this.workout.sets[this.currentSetIndex].laps.push({
        time: totalTime,
        pace: totalPace,
        distance: this.currentSet.distance,
        isPartial: false
      });

      // Atualizar o relatório do treino
      this.updateWorkoutSummary(this.currentSetIndex, this.currentRepetition, totalTime, totalPace);

      // Parar o cronômetro após completar
      this.pauseMainTimer();

      // Zerar completamente o cronômetro
      this.currentTimerValue = 0;
      this.timerCentiseconds = 0;

      // Resetar para a próxima repetição
      this.currentLapDistance = 0;

      if (this.currentRepetition < this.currentSet.repetitions) {
        this.currentRepetition++;
        this.presentToast(`Repetição ${this.currentRepetition - 1} concluída!`);

        // Atualizar o progresso no objeto do treino
        if (this.workout.sets[this.currentSetIndex]) {
          this.workout.sets[this.currentSetIndex].completedRepetitions = this.currentRepetition;
        }
      } else {
        // Completou todas as repetições desta série
        this.presentToast('Série completa!');

        // Iniciar o descanso se houver tempo de descanso configurado
        if (this.currentSet.restTime > 0) {
          this.startRestTimer();
        } else if (this.currentSetIndex < this.workout.sets.length - 1) {
          // Se não tiver descanso e tiver próxima série, avançar
          this.nextSet();
        }
      }
    }
  }

  // Adicionar método para mostrar opções de distâncias parciais
  async showPartialDistanceOptions(): Promise<void> {
    if (!this.isMainTimerRunning) {
      this.presentToast('Inicie o timer primeiro');
      return;
    }

    // Calcula a distância restante
    const remainingDistance = this.currentSet.distance - this.currentLapDistance;
    if (remainingDistance <= 0) {
      this.presentToast('Distância completa já registrada');
      return;
    }

    // Prepara as opções de distâncias parciais (25m, 50m, personalizado...)
    const buttons = [];

    // Opções padrão de distâncias parciais
    const standardDistances = [25, 50];
    for (const distance of standardDistances) {
      if (distance < remainingDistance) {
        buttons.push({
          text: `${distance}m`,
          handler: () => {
            this.markPartialLap(distance);
            return true;
          }
        });
      }
    }

    // Metade da distância restante (arredondada para múltiplo de 25)
    const halfDistance = Math.floor((remainingDistance / 2) / 25) * 25;
    if (halfDistance > 0 && !standardDistances.includes(halfDistance)) {
      buttons.push({
        text: `${halfDistance}m (metade)`,
        handler: () => {
          this.markPartialLap(halfDistance);
          return true;
        }
      });
    }

    // Opção personalizada
    buttons.push({
      text: 'Personalizado...',
      handler: () => {
        this.showCustomDistancePrompt(remainingDistance);
        return true;
      }
    });

    // Botão de cancelar
    buttons.push({
      text: 'Cancelar',
      role: 'cancel'
    });

    const actionSheet = await this.actionSheetController.create({
      header: 'Registrar Distância Parcial',
      subHeader: `Distância total: ${this.currentSet.distance}m | Restante: ${remainingDistance}m`,
      buttons: buttons
    });

    await actionSheet.present();
    return;
  }

  // Método para inserir distância personalizada
  async showCustomDistancePrompt(maxDistance: number): Promise<void> {
    const alert = await this.alertController.create({
      header: 'Distância Personalizada',
      message: `Informe a distância parcial (máx: ${maxDistance}m)`,
      inputs: [
        {
          name: 'distance',
          type: 'number',
          placeholder: 'Distância em metros',
          min: 1,
          max: maxDistance
        }
      ],
      buttons: [
        {
          text: 'Cancelar',
          role: 'cancel'
        },
        {
          text: 'Registrar',
          handler: (data) => {
            const distance = parseInt(data.distance);
            if (distance > 0 && distance <= maxDistance) {
              this.markPartialLap(distance);
              return true;
            } else {
              this.presentToast('Distância inválida');
              return false;
            }
          }
        }
      ]
    });

    await alert.present();
    return;
  }

  // Função para obter os rótulos dos equipamentos a partir dos valores
  getEquipmentLabels(equipmentValues: string[]): string {
    if (!equipmentValues || equipmentValues.length === 0) {
      return 'Nenhum';
    }

    return equipmentValues.map(value => {
      const equipment = this.equipmentOptions.find(e => e.value === value);
      return equipment ? equipment.label : value;
    }).join(', ');
  }

  // Função para obter um único equipamento (para mensagem durante descanso)
  getEquipmentLabel(equipmentValue: string): string {
    const equipment = this.equipmentOptions.find(e => e.value === equipmentValue);
    return equipment ? equipment.label : equipmentValue;
  }
}
