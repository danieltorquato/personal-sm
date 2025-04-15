import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  IonContent,
  IonHeader,
  IonTitle,
  IonToolbar,
  IonBackButton,
  IonButtons,
  IonButton,
  IonIcon,
  IonItem,
  IonLabel,
  IonList,
  IonFooter,
  IonRow,
  IonCol,
  IonSpinner,
  IonRange
} from '@ionic/angular/standalone';
import { ActivatedRoute, Router } from '@angular/router';
import { addIcons } from 'ionicons';
import {
  closeOutline,
  fitnessOutline,
  playOutline,
  volumeMediumOutline,
  expandOutline,
  chevronBackOutline,
  alertCircleOutline,
  arrowBackOutline,
  notificationsOutline,
  barbellOutline,
  informationCircleOutline,
  bodyOutline,
  listOutline,
  repeatOutline,
  syncOutline
} from 'ionicons/icons';
import { WorkoutService } from 'src/app/services/workout.service';

// Importar o CSS das animações (animate.css)
import 'animate.css';

interface Exercise {
  id?: number;
  name: string;
  description?: string;
  instructions?: string;
  muscles?: string;
  category?: string;
  equipment?: string;
  video?: string;
  image?: string;
  sets?: number;
  reps?: number;
}

@Component({
  selector: 'app-exercise-info',
  templateUrl: './exercise-info.page.html',
  styleUrls: ['./exercise-info.page.scss'],
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
    IonButton,
    IonIcon,
    IonItem,
    IonLabel,
    IonList,
    IonFooter,
    IonRow,
    IonCol,
    IonSpinner,
    IonRange
  ]
})
export class ExerciseInfoPage implements OnInit {
  @ViewChild('videoPlayer') videoPlayer: ElementRef | undefined;
  exercise: Exercise | undefined;
  selectedExercise: Exercise | null = null;
  loading: boolean = true;
  error: string | null = null;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private workoutService: WorkoutService
  ) {
    addIcons({
      closeOutline,
      fitnessOutline,
      arrowBackOutline,
      alertCircleOutline,
      barbellOutline,
      informationCircleOutline,
      bodyOutline,
      listOutline,
      repeatOutline,
      syncOutline,
      chevronBackOutline
    });
  }

  ngOnInit() {
    this.route.paramMap.subscribe(params => {
      const id = params.get('id');
      if (id) {
        this.loading = true;
        this.loadExercise(Number(id));
      } else {
        this.error = 'ID do exercício não fornecido';
        this.loading = false;
      }
    });
  }

  loadExercise(id: number) {
    this.loading = true;

    // Esta é uma versão simplificada que usa getWorkout, mas idealmente
    // deveria haver um endpoint específico para buscar exercícios
    this.workoutService.getAllExercises().subscribe({
      next: (response) => {
        if (response && response.data && response.data.length > 0) {
          // Procurar o exercício pelo ID
          const exerciseData = response.data.find((ex: any) => ex.id === id);

          if (exerciseData) {
            this.selectedExercise = {
              id: exerciseData.id,
              name: exerciseData.name || 'Exercício',
              description: exerciseData.description,
              category: exerciseData.category_name || exerciseData.category,
              instructions: exerciseData.instructions,
              muscles: exerciseData.muscles_worked || exerciseData.muscles,
              sets: exerciseData.default_sets || 3,
              reps: exerciseData.default_reps || 12,
              video: exerciseData.video_path,
              image: exerciseData.image_path
            };
            console.log('Exercício carregado:', this.selectedExercise);
          } else {
            // Se não encontrar o exercício específico, usar dados de exemplo
            this.setupExampleExercise(id);
          }
        } else {
          // Se não tiver dados da API, usar dados de exemplo
          this.setupExampleExercise(id);
        }
      },
      error: (err) => {
        console.error('Erro ao carregar exercício:', err);
        this.error = 'Erro ao carregar dados do exercício';
        this.loading = false;
        this.selectedExercise = null;
      },
      complete: () => {
        this.loading = false;
      }
    });
  }

  // Configura um exercício de exemplo quando não temos dados da API
  setupExampleExercise(id: number) {
    this.selectedExercise = {
      id: id,
      name: 'Crossover',
      description: 'Exercício com cabos para peito, ideal para definição muscular.',
      muscles: 'Peitoral, ombros, tríceps',
      category: 'peito',
      instructions: 'Fique de frente ao aparelho, puxe os cabos cruzando-os na frente do corpo à altura do peito. Mantenha o tronco estável durante o movimento.',
      sets: 3,
      reps: 12
    };
  }

  getCategoryName(categoryId: string): string {
    const categories: {[key: string]: string} = {
      'peito': 'Peito',
      'costas': 'Costas',
      'pernas': 'Pernas',
      'ombros': 'Ombros',
      'biceps': 'Bíceps',
      'triceps': 'Tríceps',
      'abdomen': 'Abdômen',
      'cardio': 'Cardio'
    };

    return categories[categoryId] || categoryId;
  }

  voltar() {
    this.router.navigate(['/tabs/exercises']);
  }

  fechar() {
    // Pode ser o mesmo que voltar para navegação normal
    this.voltar();
  }
}
