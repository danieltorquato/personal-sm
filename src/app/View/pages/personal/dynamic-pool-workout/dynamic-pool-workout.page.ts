import { Component, OnInit, ViewChild, ElementRef, CUSTOM_ELEMENTS_SCHEMA, AfterViewInit } from '@angular/core';
import { IonicSlides, AlertController, ToastController } from '@ionic/angular';
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
  laps?: Lap[];
}

interface Lap {
  time: number;
  pace?: string;
}

interface ExerciseInfo {
  value: string;
  name: string;
  image: string;
  description?: string;
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
export class DynamicPoolWorkoutPage implements OnInit, AfterViewInit {
  @ViewChild('slides') slides!: ElementRef;
  @ViewChild('audioPlayer') audioPlayer!: ElementRef;

  // Configurações do slide
  slideOpts = {
    initialSlide: 0,
    speed: 400,
    allowTouchMove: false
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
        completedRepetitions: 1
      },
      {
        exercise: 'nado-costas',
        distance: 50,
        repetitions: 2,
        restTime: 45,
        notes: 'Mantenha o corpo alinhado na superfície',
        completedRepetitions: 1
      },
      {
        exercise: 'batida-pernas',
        distance: 25,
        repetitions: 4,
        restTime: 20,
        notes: 'Use a prancha e mantenha as pernas estendidas',
        completedRepetitions: 1
      },
      {
        exercise: 'nado-peito',
        distance: 50,
        repetitions: 2,
        restTime: 40,
        completedRepetitions: 1
      },
      {
        exercise: 'pullbuoy',
        distance: 50,
        repetitions: 2,
        restTime: 30,
        notes: 'Foco na técnica de braçada e rotação de ombros',
        completedRepetitions: 1
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
    completedRepetitions: 1
  };
  totalWorkoutTime: number = 0;
  currentExercise: string = '';
  currentDistance: number = 0;

  // Timers
  isMainTimerRunning: boolean = false;
  isRestTimerActive: boolean = false;
  isRestTimerPaused: boolean = false;
  currentTimerValue: number = 0;
  restTimerValue: number = 0;

  // Timers de intervalo
  mainTimerInterval: any;
  restTimerInterval: any;

  constructor(
    private router: Router,
    private alertController: AlertController,
    private toastController: ToastController,
    private audioService: AudioService
  ) {}

  ngOnInit() {
    // Registrar o componente Swiper
    register();
    this.initWorkout();
    this.preloadSounds();
  }

  ngAfterViewInit() {
    // Configurar o Swiper após a view ser inicializada
    const swiperEl = this.slides.nativeElement;
    swiperEl.swiper.allowTouchMove = false;

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
  async nextSet() {
    if (this.currentSetIndex < this.workout.sets.length - 1) {
      this.pauseMainTimer();
      this.currentSetIndex++;
      this.currentSet = { ...this.workout.sets[this.currentSetIndex] };
      this.currentRepetition = this.currentSet.completedRepetitions || 1;

      const swiperEl = this.slides.nativeElement;
      swiperEl.swiper.slideTo(this.currentSetIndex, 400);
    }
  }

  async previousSet() {
    if (this.currentSetIndex > 0) {
      this.pauseMainTimer();
      this.currentSetIndex--;
      this.currentSet = { ...this.workout.sets[this.currentSetIndex] };
      this.currentRepetition = this.currentSet.completedRepetitions || 1;

      const swiperEl = this.slides.nativeElement;
      swiperEl.swiper.slideTo(this.currentSetIndex, 400);
    }
  }

  // --- TIMER PRINCIPAL ---
  toggleMainTimer() {
    if (this.isMainTimerRunning) {
      this.pauseMainTimer();
    } else {
      this.startMainTimer();
    }
  }

  startMainTimer() {
    this.isMainTimerRunning = true;
    clearInterval(this.mainTimerInterval);
    this.mainTimerInterval = setInterval(() => {
      this.currentTimerValue++;
      this.totalWorkoutTime++;
    }, 1000);
  }

  pauseMainTimer() {
    this.isMainTimerRunning = false;
    clearInterval(this.mainTimerInterval);
  }

  // --- CONTROLE DE REPETIÇÕES ---
  completeRepetition() {
    // Salvar o tempo desta repetição se necessário
    if (this.currentRepetition < this.currentSet.repetitions) {
      this.currentRepetition++;
      this.presentToast(`Repetição ${this.currentRepetition - 1} concluída!`);

      // Atualizar o progresso no objeto do treino
      if (this.workout.sets[this.currentSetIndex]) {
        this.workout.sets[this.currentSetIndex].completedRepetitions = this.currentRepetition;
      }

      // Resetar o timer para a próxima repetição
      this.currentTimerValue = 0;
    } else {
      // Completou todas as repetições desta série
      this.pauseMainTimer();
      this.presentToast('Série completa!');

      // Iniciar o descanso se houver tempo de descanso configurado
      if (this.currentSet.restTime > 0) {
        this.startRestTimer();
      } else if (this.currentSetIndex < this.workout.sets.length - 1) {
        // Se não tiver descanso e tiver próxima série, avançar
        this.nextSet();
      } else {
        // Se for a última série, ir para o resumo
        this.goToSummary();
      }
    }
  }

  // --- TIMER DE DESCANSO ---
  startRestTimer() {
    this.isRestTimerActive = true;
    this.isRestTimerPaused = false;
    this.restTimerValue = this.currentSet.restTime;

    // Tocar som de início de descanso
    this.playSound('rest-start');

    clearInterval(this.restTimerInterval);
    this.restTimerInterval = setInterval(() => {
      if (this.restTimerValue > 0) {
        this.restTimerValue--;

        // Tocar sons de alerta nos últimos 3 segundos
        if (this.restTimerValue <= 3 && this.restTimerValue > 0) {
          this.playSound('countdown');
        }
      } else {
        // Fim do descanso
        this.endRestTimer();
      }
    }, 1000);
  }

  toggleRestTimer() {
    if (this.isRestTimerPaused) {
      // Retomar o timer
      this.isRestTimerPaused = false;
      this.restTimerInterval = setInterval(() => {
        if (this.restTimerValue > 0) {
          this.restTimerValue--;
          if (this.restTimerValue <= 3 && this.restTimerValue > 0) {
            this.playSound('countdown');
          }
        } else {
          this.endRestTimer();
        }
      }, 1000);
    } else {
      // Pausar o timer
      this.isRestTimerPaused = true;
      clearInterval(this.restTimerInterval);
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

    if (this.currentSetIndex < this.workout.sets.length - 1) {
      // Ir para próxima série
      this.nextSet();
    } else {
      // Ir para o resumo
      this.goToSummary();
    }
  }

  // --- FINALIZAÇÃO DO TREINO ---
  async goToSummary() {
    const totalSlides = this.workout.sets.length + 1; // +1 para o slide de resumo
    const swiperEl = this.slides.nativeElement;
    swiperEl.swiper.slideTo(totalSlides - 1, 400);
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

  formatTime(seconds: number): string {
    if (seconds < 60) return `${seconds}s`;

    const min = Math.floor(seconds / 60);
    const sec = seconds % 60;
    return `${min}:${sec.toString().padStart(2, '0')}`;
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

  async presentToast(message: string) {
    const toast = await this.toastController.create({
      message,
      duration: 2000,
      position: 'top',
    });
    toast.present();
  }
}
