import { Component, OnInit, ViewChild, ElementRef, CUSTOM_ELEMENTS_SCHEMA, AfterViewInit, OnDestroy } from '@angular/core';
import { IonicSlides, AlertController, ToastController, ActionSheetController } from '@ionic/angular';
import { Router } from '@angular/router';
import { AudioService } from '../../../components/audio-service/audio.service';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { register } from 'swiper/element';

interface WorkoutSet {
  exercise: string;
  distance: number;
  repetitions: number;
  restTime: number;
  notes?: string;
  completedRepetitions?: number;
  laps: Lap[];
  partialDistances?: number[]; // Distâncias parciais configuradas pelo professor
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
  exerciseLibrary: ExerciseInfo[] = [
    {
      value: 'nado-livre',
      name: 'Nado Livre',
      image: 'assets/exercises/freestyle.jpg',
      description: 'Estilo mais rápido e eficiente, utilizado em longas distâncias'
    },
    {
      value: 'nado-costas',
      name: 'Nado Costas',
      image: 'assets/exercises/backstroke.jpg',
      description: 'Excelente para fortalecimento da região lombar e ombros'
    },
    {
      value: 'nado-peito',
      name: 'Nado Peito',
      image: 'assets/exercises/breaststroke.jpg',
      description: 'Fortalece principalmente peitoral e pernas'
    },
    {
      value: 'borboleta',
      name: 'Borboleta',
      image: 'assets/exercises/butterfly.jpg',
      description: 'Estilo mais desafiador que trabalha todo o corpo'
    },
    {
      value: 'batida-pernas',
      name: 'Batida de Pernas',
      image: 'assets/exercises/kickboard.jpg',
      description: 'Exercício com prancha focado no fortalecimento das pernas'
    },
    {
      value: 'pullbuoy',
      name: 'Braçada com Pullbuoy',
      image: 'assets/exercises/pullbuoy.jpg',
      description: 'Exercício com flutuador entre as pernas para focar na braçada'
    },
    {
      value: 'medley',
      name: 'Medley',
      image: 'assets/exercises/medley.jpg',
      description: 'Combinação de todos os quatro estilos na mesma série'
    }
  ];

  // Dados do treino
  workout = {
    id: new Date().getTime().toString(),
    name: 'Treino de Natação',
    date: new Date(),
    studentId: '1', // Seria obtido na navegação real
    sets: [
      {
        exercise: 'nado-livre',
        distance: 50,
        repetitions: 4,
        restTime: 30,
        notes: 'Concentre-se na respiração bilateral',
        completedRepetitions: 1,
        laps: [] as Lap[],
        partialDistances: [25] // Adicionando distância parcial
      },
      {
        exercise: 'nado-costas',
        distance: 50,
        repetitions: 2,
        restTime: 45,
        notes: 'Mantenha o corpo alinhado na superfície',
        completedRepetitions: 1,
        laps: [] as Lap[],
        partialDistances: [25] // Adicionando distância parcial
      },
      {
        exercise: 'batida-pernas',
        distance: 25,
        repetitions: 4,
        restTime: 20,
        notes: 'Use a prancha e mantenha as pernas estendidas',
        completedRepetitions: 1,
        laps: [] as Lap[],
        partialDistances: [] // Sem distâncias parciais
      },
      {
        exercise: 'nado-peito',
        distance: 50,
        repetitions: 2,
        restTime: 40,
        completedRepetitions: 1,
        laps: [] as Lap[],
        partialDistances: [25] // Adicionando distância parcial
      },
      {
        exercise: 'pullbuoy',
        distance: 50,
        repetitions: 2,
        restTime: 30,
        notes: 'Foco na técnica de braçada e rotação de ombros',
        completedRepetitions: 1,
        laps: [] as Lap[],
        partialDistances: [25] // Adicionando distância parcial
      }
    ]
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
    partialDistances: [] // Adicionando campo faltante
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
  timerDeciseconds: number = 0; // Para décimos de segundo (0.1s)
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

  constructor(
    private router: Router,
    private alertController: AlertController,
    private toastController: ToastController,
    private actionSheetController: ActionSheetController,
    private audioService: AudioService
  ) {}

  ngOnInit() {
    register();
    this.preloadSounds();

    // Criar um novo treino fictício ao invés de carregar o treino salvo
    this.createFictitiousWorkout();
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

  preloadSounds() {
    // Pré-carregar os arquivos de áudio
    this.audioService.preloadAudio('beep', 'assets/sounds/beep.mp3');
    this.audioService.preloadAudio('start', 'assets/sounds/start.mp3');
    this.audioService.preloadAudio('end', 'assets/sounds/end.mp3');
  }

  // Inicializa o treino
  initWorkout() {
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
        this.timerDeciseconds = 0;
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
      this.timerDeciseconds = 0;
      this.timerCentiseconds = 0;

      this.startCountdown(() => {
        this.startMainTimerAfterCountdown();
      });
    }
  }

  startMainTimerAfterCountdown() {
    this.isMainTimerRunning = true;
    clearInterval(this.mainTimerInterval);
    this.mainTimerInterval = setInterval(() => {
      this.timerCentiseconds += 1;
      if (this.timerCentiseconds >= 100) {
        this.timerCentiseconds = 0;
        this.timerDeciseconds += 1;
        if (this.timerDeciseconds >= 10) {
          this.timerDeciseconds = 0;
      this.currentTimerValue++;
      this.totalWorkoutTime++;
        }
      }
    }, 10); // Intervalo de 10ms para centésimos de segundo
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
    const lapTimeMs = this.currentTimerValue * 1000 + this.timerDeciseconds * 100 + this.timerCentiseconds * 10;
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

    // Resetar a distância acumulada para a próxima repetição
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

  // --- TIMER DE DESCANSO ---
  startRestTimer(resetTimer: boolean = true) {
    this.isRestTimerActive = true;

    // Pausar o timer principal durante o descanso
    this.pauseMainTimer();

    if (resetTimer) {
    this.restTimerValue = this.currentSet.restTime;
    }

    // Reproduzir som de início de descanso
    this.playSound('rest-start');

    this.restTimerInterval = setInterval(() => {
        this.restTimerValue--;

      // Tocar beep nos últimos 3 segundos
        if (this.restTimerValue <= 3 && this.restTimerValue > 0) {
          this.playSound('countdown');
        }

      if (this.restTimerValue <= 0) {
        this.endRestTimer();
      }
    }, 1000);
  }

  toggleRestTimer() {
    if (this.isRestTimerActive) {
    if (this.isRestTimerPaused) {
      // Retomar o timer
      this.isRestTimerPaused = false;
      this.restTimerInterval = setInterval(() => {
          this.restTimerValue--;

          // Tocar beep nos últimos 3 segundos
          if (this.restTimerValue <= 3 && this.restTimerValue > 0) {
            this.playSound('countdown');
          }

          if (this.restTimerValue <= 0) {
          this.endRestTimer();
        }
      }, 1000);
    } else {
      // Pausar o timer
      this.isRestTimerPaused = true;
      clearInterval(this.restTimerInterval);
      }
    }
  }

  skipRest() {
    this.endRestTimer();
  }

  endRestTimer() {
    clearInterval(this.restTimerInterval);
    this.isRestTimerActive = false;
    this.isRestTimerPaused = false;

    // Tocar som de fim de descanso
    this.playSound('rest-end');

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

  formatTime(seconds: number, withMilliseconds: boolean = false): string {
    if (!withMilliseconds) {
      // Versão simples em minutos e segundos
      const min = Math.floor(seconds / 60);
      const sec = seconds % 60;

      // Mostrar minutos apenas se necessário
      if (min > 0) {
        return `${min}:${sec.toString().padStart(2, '0')}`;
      } else {
        return sec.toString();
      }
    } else {
      // Versão com centésimos para o timer ativo
      const min = Math.floor(this.currentTimerValue / 60);
      const sec = this.currentTimerValue % 60;
      // Combinar décimos e centésimos em um valor de 2 dígitos (0-99)
      const centiseconds = this.timerDeciseconds * 10 + this.timerCentiseconds;

      // Formato M:SS:CC
      if (min > 0) {
        return `${min}:${sec.toString().padStart(2, '0')}:${centiseconds.toString().padStart(2, '0')}`;
      } else {
        // Sem minutos, mostrar apenas SS:CC
        return `${sec.toString().padStart(2, '0')}:${centiseconds.toString().padStart(2, '0')}`;
      }
    }
  }

  // Formatar tempos de volta no mesmo padrão do cronômetro
  formatLapTime(timeInSeconds: number): string {
    // Extrair minutos, segundos e centésimos
    const min = Math.floor(timeInSeconds / 60);
    const sec = Math.floor(timeInSeconds % 60);
    const centiseconds = Math.floor((timeInSeconds * 100) % 100);

    // Formato M:SS:CC ou SS:CC
    if (min > 0) {
      return `${min}:${sec.toString().padStart(2, '0')}:${centiseconds.toString().padStart(2, '0')}`;
    } else {
      return `${sec.toString().padStart(2, '0')}:${centiseconds.toString().padStart(2, '0')}`;
    }
  }

  createArray(size: number): any[] {
    return Array(size);
  }

  playSound(type: 'countdown' | 'rest-start' | 'rest-end') {
    // Usar o AudioService para reproduzir os sons
    if (type === 'countdown') {
      this.audioService.playCountdownBeep();
    } else if (type === 'rest-start') {
      this.audioService.playStartBeep();
    } else if (type === 'rest-end') {
      this.audioService.playEndBeep();
    }
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
      timerDeciseconds: this.timerDeciseconds,
      timerCentiseconds: this.timerCentiseconds,
      isMainTimerRunning: this.isMainTimerRunning,
      isRestTimerActive: this.isRestTimerActive,
      isRestTimerPaused: this.isRestTimerPaused,
      restTimerValue: this.restTimerValue,
      workoutSummary: this.workoutSummary,
      isCountdownActive: this.isCountdownActive,
      countdownTimer: this.countdownTimer,
      currentLapDistance: this.currentLapDistance
    };
    localStorage.setItem(this.WORKOUT_STATE_KEY, JSON.stringify(state));
  }

  private loadWorkoutState() {
    const savedState = localStorage.getItem(this.WORKOUT_STATE_KEY);
    if (savedState) {
      try {
        const state = JSON.parse(savedState);
        this.workout = state.workout;
        this.currentSetIndex = state.currentSetIndex;
        this.currentRepetition = state.currentRepetition;
        this.currentSet = state.currentSet;
        this.totalWorkoutTime = state.totalWorkoutTime;
        this.currentTimerValue = state.currentTimerValue;
        this.timerDeciseconds = state.timerDeciseconds || 0;
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
            this.startRestTimer(false); // Não resetar o timer
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
      } catch (error) {
        console.error('Erro ao carregar o estado salvo:', error);
        // Se houver erro, inicializar normalmente
        this.initWorkout();
      }
    }
  }

  // Método para contagem regressiva
  startCountdown(callback: () => void) {
    this.isCountdownActive = true;
    this.countdownTimer = 3;

    // Tocar som inicial
    this.audioService.playCountdownBeep();

    clearInterval(this.countdownInterval);
    this.countdownInterval = setInterval(() => {
      this.countdownTimer--;

      if (this.countdownTimer > 0) {
        // Tocar beep durante a contagem
        this.audioService.playCountdownBeep();
      } else {
        // Contagem finalizada
        clearInterval(this.countdownInterval);
        this.isCountdownActive = false;

        // Tocar som mais forte no final
        this.audioService.playStartBeep();

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
    const lapTimeMs = this.currentTimerValue * 1000 + this.timerDeciseconds * 100 + this.timerCentiseconds * 10;
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

  // Método para criar um novo treino fictício para demonstração
  createFictitiousWorkout() {
    // Limpar qualquer estado anterior
    localStorage.removeItem(this.WORKOUT_STATE_KEY);

    // Definir um novo treino de exemplo
    this.workout = {
      id: new Date().getTime().toString(),
      name: 'Treino Avançado de Velocidade',
      date: new Date(),
      studentId: 'Matheus Santos',
      sets: [
        {
          exercise: 'nado-livre',
          distance: 100,
          repetitions: 4,
          restTime: 40,
          notes: 'Foco na técnica de respiração bilateral e braçada longa',
          completedRepetitions: 1,
          laps: [] as Lap[],
          partialDistances: [25, 50, 75]
        },
        {
          exercise: 'batida-pernas',
          distance: 50,
          repetitions: 6,
          restTime: 30,
          notes: 'Manter pernas esticadas, usar prancha grande',
          completedRepetitions: 1,
          laps: [] as Lap[],
          partialDistances: [25]
        },
        {
          exercise: 'borboleta',
          distance: 50,
          repetitions: 2,
          restTime: 60,
          notes: 'Foco na ondulação do corpo e na sincronização dos braços',
          completedRepetitions: 1,
          laps: [] as Lap[],
          partialDistances: [25]
        },
        {
          exercise: 'pullbuoy',
          distance: 75,
          repetitions: 4,
          restTime: 45,
          notes: 'Concentre-se na pegada e puxada subaquática',
          completedRepetitions: 1,
          laps: [] as Lap[],
          partialDistances: [25, 50]
        },
        {
          exercise: 'medley',
          distance: 100,
          repetitions: 2,
          restTime: 60,
          notes: 'Sequência: borboleta, costas, peito, livre - 25m cada',
          completedRepetitions: 1,
          laps: [] as Lap[],
          partialDistances: [25, 50, 75]
        }
      ]
    };

    // Inicializar o treino com os novos dados
    this.initWorkout();
  }
}
