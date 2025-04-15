import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  IonContent,
  IonHeader,
  IonTitle,
  IonToolbar,
  IonBackButton,
  IonButtons,
  IonCard,
  IonCardContent,
  IonCardHeader,
  IonCardSubtitle,
  IonCardTitle,
  IonCol,
  IonGrid,
  IonIcon,
  IonItem,
  IonLabel,
  IonListHeader,
  IonRow,
  IonSpinner,
  IonButton
} from '@ionic/angular/standalone';
import { ActivatedRoute, Router } from '@angular/router';
import { WorkoutService } from 'src/app/services/workout.service';
import { DatePipe } from '@angular/common';
import { addIcons } from 'ionicons';
import {
  calendarOutline,
  refreshOutline,
  repeatOutline,
  fitnessOutline,
  timerOutline,
  hourglassOutline,
  informationCircleOutline,
  videocamOutline,
  alertCircleOutline,
  barbellOutline
} from 'ionicons/icons';

@Component({
  selector: 'app-view-training-student',
  templateUrl: './view-training-student.page.html',
  styleUrls: ['./view-training-student.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    IonContent,
    IonHeader,
    IonTitle,
    IonToolbar,
    IonBackButton,
    IonButtons,
    IonCard,
    IonCardContent,
    IonCardHeader,
    IonCardSubtitle,
    IonCardTitle,
    IonCol,
    IonGrid,
    IonIcon,
    IonItem,
    IonLabel,
    IonListHeader,
    IonRow,
    IonSpinner,
    IonButton,
    DatePipe
  ]
})
export class ViewTrainingStudentPage implements OnInit {
  workout: any;
  id: any;
  isLoading = true;

  constructor(private route: ActivatedRoute, private workoutService: WorkoutService, private router: Router) {
    addIcons({
      calendarOutline,
      refreshOutline,
      repeatOutline,
      fitnessOutline,
      timerOutline,
      hourglassOutline,
      informationCircleOutline,
      videocamOutline,
      alertCircleOutline,
      barbellOutline
    });
  }

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.getTrainingStudent(Number(id));
    } else {
      this.isLoading = false;
    }
  }

  getTrainingStudent(id: number) {
    this.isLoading = true;
    this.workoutService.getWorkout(id).subscribe({
      next: (response) => {
        this.workout = response;
        console.log('Treino carregado:', this.workout);

        // Logs adicionais para depuração
        if (this.workout.data) {
          console.log('Tipo de workout.data:', typeof this.workout.data);
          console.log('É um array?', Array.isArray(this.workout.data));
          console.log('Conteúdo de workout.data:', this.workout.data);

          if (this.workout.data.workout_sets) {
            console.log('Tipo de workout_sets:', typeof this.workout.data.workout_sets);
            console.log('workout_sets é um array?', Array.isArray(this.workout.data.workout_sets));
          }
        }
      },
      error: (error) => {
        console.error('Erro ao carregar treino:', error);
      },
      complete: () => {
        this.isLoading = false;
      }
    });
  }

  getWorkoutExercises(): any[] {
    if (!this.workout) return [];

    console.log('Estrutura do workout:', this.workout);
    console.log('Nome dos Exercícios:', this.workout.data.name);

    // Verifica se os exercícios estão em workout.data.workout_sets
    if (this.workout.data?.workout_sets && Array.isArray(this.workout.data.workout_sets)) {
      return this.workout.data.workout_sets;
    }

    // Verifica se os exercícios estão em workout.workout_sets
    if (this.workout.workout_sets && Array.isArray(this.workout.workout_sets)) {
      return this.workout.workout_sets;
    }

    // Verifica se data é um array
    if (Array.isArray(this.workout.data)) {
      return this.workout.data;
    }

    // Se o data contém exercícios diretamente
    if (this.workout.data?.exercises && Array.isArray(this.workout.data.exercises)) {
      return this.workout.data.exercises;
    }

    // Retorna array vazio se nenhum formato válido foi encontrado
    return [];
  }

  formatTime(timeInSeconds: number): string {
    if (!timeInSeconds) return '00:00';
    const minutes = Math.floor(timeInSeconds / 60);
    const seconds = timeInSeconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  }

  openVideo(url: string) {
    if (url) {
      window.open(url, '_blank');
    }
  }

  // Verifica se temos um array de exercícios disponível
  isWorkoutExercisesArray(): boolean {
    if (!this.workout) return false;

    // Verifica as várias possibilidades onde podemos ter um array
    if (Array.isArray(this.workout.data?.workout_sets)) return true;
    if (Array.isArray(this.workout.workout_sets)) return true;
    if (Array.isArray(this.workout.data)) return true;
    if (Array.isArray(this.workout.data?.exercises)) return true;

    return false;
  }

  // Verifica se não temos exercícios para mostrar
  isEmptyWorkout(): boolean {
    if (!this.workout || !this.workout.data) return true;

    // Se temos um array de exercícios, verifica se está vazio
    if (this.isWorkoutExercisesArray()) {
      return this.getWorkoutExercises().length === 0;
    }

    // Se temos um objeto e não um array, mas não tem propriedades relevantes
    if (typeof this.workout.data === 'object' &&
        !this.workout.data.name &&
        !this.workout.data.description &&
        !this.workout.data.instructions) {
      return true;
    }

    return false;
  }

  detailsExercise(exercise: any) {
    this.router.navigate(['/pages/personal/view-exercise', exercise.id]);
  }
}
