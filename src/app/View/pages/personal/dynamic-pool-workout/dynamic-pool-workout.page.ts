import { Component, OnInit, ViewChild, ElementRef, CUSTOM_ELEMENTS_SCHEMA, AfterViewInit } from '@angular/core';
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
        completedRepetitions: 1,
        laps: [] as Lap[]
      },
      {
        exercise: 'nado-costas',
        distance: 50,
        repetitions: 2,
        restTime: 45,
        notes: 'Mantenha o corpo alinhado na superfície',
        completedRepetitions: 1,
        laps: [] as Lap[]
      },
      {
        exercise: 'batida-pernas',
        distance: 25,
        repetitions: 4,
        restTime: 20,
        notes: 'Use a prancha e mantenha as pernas estendidas',
        completedRepetitions: 1,
        laps: [] as Lap[]
      },
      {
        exercise: 'nado-peito',
        distance: 50,
        repetitions: 2,
        restTime: 40,
        completedRepetitions: 1,
        laps: [] as Lap[]
      },
      {
        exercise: 'pullbuoy',
        distance: 50,
        repetitions: 2,
        restTime: 30,
        notes: 'Foco na técnica de braçada e rotação de ombros',
        completedRepetitions: 1,
        laps: [] as Lap[]
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
    laps: [] as Lap[]
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

  // Timers de intervalo
  mainTimerInterval: any;
  restTimerInterval: any;

  constructor(
    private router: Router,
    private alertController: AlertController,
    private toastController: ToastController,
    private actionSheetController: ActionSheetController,
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
    // Salvar o tempo desta repetição
    const lapTime = this.currentTimerValue;
    const pace = this.calculatePace(lapTime, this.currentSet.distance);

    // Verificar se o array laps existe, se não, criar
    if (!this.workout.sets[this.currentSetIndex].laps) {
      this.workout.sets[this.currentSetIndex].laps = [];
    }

    // Adicionar a nova volta ao array de voltas
    this.workout.sets[this.currentSetIndex].laps.push({
      time: lapTime,
      pace: pace
    });

    // Atualizar o relatório do treino
    this.updateWorkoutSummary(this.currentSetIndex, this.currentRepetition, lapTime, pace);

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

  // Calcular o ritmo (pace) em minutos por 100m
  calculatePace(timeInSeconds: number, distanceInMeters: number): string {
    // Evitar divisão por zero
    if (distanceInMeters === 0) return '-';

    // Calcular o tempo por 100m
    const pacePerHundredMeters = (timeInSeconds * 100) / distanceInMeters;

    // Converter para minutos e segundos
    const minutes = Math.floor(pacePerHundredMeters / 60);
    const seconds = Math.floor(pacePerHundredMeters % 60);

    return `${minutes}:${seconds.toString().padStart(2, '0')}/100m`;
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
    // Finalizar o resumo do treino
    this.finalizeSummary();

    const totalSlides = this.workout.sets.length + 1; // +1 para o slide de resumo
    const swiperEl = this.slides.nativeElement;
    swiperEl.swiper.slideTo(totalSlides - 1, 400);
  }

  // Finalizar o resumo após o treino
  finalizeSummary() {
    // Garantir que a distância total e o tempo total estejam corretos
    this.workoutSummary.totalDistance = this.calculateTotalDistance();
    this.workoutSummary.totalTime = this.totalWorkoutTime;
    this.workoutSummary.date = new Date();
  }

  // Compartilhar o relatório do treino
  async shareWorkoutSummary() {
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
        this.copyToClipboard(shareText);
      }
    } catch (error) {
      console.error('Erro ao compartilhar:', error);
      this.presentToast('Não foi possível compartilhar o relatório.');
    }
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
  async copyToClipboard(text: string) {
    try {
      await navigator.clipboard.writeText(text);
      this.presentToast('Relatório copiado para a área de transferência!');
    } catch (error) {
      console.error('Erro ao copiar para área de transferência:', error);
      this.presentToast('Não foi possível copiar o relatório.');
    }
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
