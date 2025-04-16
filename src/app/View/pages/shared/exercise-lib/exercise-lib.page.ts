import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  IonContent,
  IonHeader,
  IonTitle,
  IonToolbar,
  IonSearchbar,
  IonList,
  IonItem,
  IonLabel,
  IonThumbnail,
  IonAvatar,
  IonSkeletonText,
  IonCard,
  IonCardContent,
  IonCardHeader,
  IonCardTitle,
  IonButton,
  IonIcon,
  IonBadge,
  IonInfiniteScroll,
  IonInfiniteScrollContent,
  IonChip,
  IonSpinner
} from '@ionic/angular/standalone';
import { WorkoutService } from 'src/app/services/workout.service';
import { AuthService } from 'src/app/services/auth.service';
import { Router } from '@angular/router';
import { addIcons } from 'ionicons';
import {
  search,
  filter,
  informationCircleOutline,
  barbellOutline,
  bodyOutline,
  eyeOutline,
  imageOutline, alertCircleOutline } from 'ionicons/icons';

interface Exercise {
  id: number;
  name: string;
  description?: string;
  category?: string;
  image_path?: string;
  muscles?: string;
}

@Component({
  selector: 'app-exercise-lib',
  templateUrl: './exercise-lib.page.html',
  styleUrls: ['./exercise-lib.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    IonContent,
    IonHeader,
    IonTitle,
    IonToolbar,
    IonSearchbar,
    IonList,
    IonItem,
    IonLabel,
    IonThumbnail,
    IonAvatar,
    IonSkeletonText,
    IonCard,
    IonCardContent,
    IonCardHeader,
    IonCardTitle,
    IonButton,
    IonIcon,
    IonBadge,
    IonInfiniteScroll,
    IonInfiniteScrollContent,
    IonChip,
    IonSpinner
  ]
})
export class ExerciseLibPage implements OnInit {
  allExercises: Exercise[] = [];
  exercises: Exercise[] = [];
  filteredExercises: Exercise[] = [];
  searchTerm: string = '';
  isLoading: boolean = true;
  error: string | null = null;
  categories: string[] = ['Todos', 'Peito', 'Costas', 'Pernas', 'Ombros', 'Braços', 'Abdômen'];
  selectedCategory: string = 'Todos';

  constructor(
    private workoutService: WorkoutService,
    private authService: AuthService,
    private router: Router
  ) {
    addIcons({barbellOutline,alertCircleOutline,search,filter,informationCircleOutline,bodyOutline,eyeOutline,imageOutline});
  }

  ngOnInit() {
    this.loadExercises();
  }

  loadExercises() {
    this.isLoading = true;
    this.workoutService.getAllExercises().subscribe({
      next: (response) => {
        if (response && response.data) {
          this.allExercises = response.data;

          // Ordenar por ID para pegar os 10 primeiros
          this.allExercises.sort((a, b) => a.id - b.id);

          // Inicialmente, exibir apenas os 10 primeiros exercícios
          this.exercises = this.allExercises.slice(0, 10);
          this.filteredExercises = [...this.exercises];

          console.log('Exercícios carregados:', this.exercises);
        } else {
          this.error = 'Resposta inválida do servidor';
        }
        this.isLoading = false;
      },
      error: (err) => {
        this.error = 'Erro ao carregar exercícios';
        console.error('Erro ao carregar exercícios:', err);
        this.isLoading = false;
      }
    });
  }

  filterExercises() {
    // Primeiro, filtrar por categoria (se não for 'Todos')
    let filtered = this.allExercises;

    if (this.selectedCategory !== 'Todos') {
      // Considerar categoria case-insensitive
      const categoryLower = this.selectedCategory.toLowerCase();
      filtered = filtered.filter(exercise =>
        exercise.category && exercise.category.toLowerCase().includes(categoryLower)
      );
    }

    // Depois, filtrar pelo texto de pesquisa (se houver e tiver pelo menos 3 caracteres)
    if (this.searchTerm && this.searchTerm.trim().length >= 3) {
      const searchTermLower = this.searchTerm.toLowerCase().trim();

      // Implementação de busca menos flexível
      filtered = filtered.filter(exercise => {
        // Verifica nome do exercício - principal critério
        if (exercise.name) {
          const name = exercise.name.toLowerCase();
          // Busca exata - principal método
          if (name.includes(searchTermLower)) return true;
          // Tolerância limitada a erros de digitação
          if (this.hasPartialMatch(name, searchTermLower, 0.85)) return true;
        }

        // Verifica descrição - busca exata apenas
        if (exercise.description) {
          const description = exercise.description.toLowerCase();
          if (description.includes(searchTermLower)) return true;
        }

        // Verifica músculos - busca exata apenas
        if (exercise.muscles) {
          const muscles = exercise.muscles.toLowerCase();
          if (muscles.includes(searchTermLower)) return true;
        }

        return false;
      });
    }

    // Limitar resultados para performance
    this.filteredExercises = filtered.slice(0, 50);
  }

  // Método auxiliar simplificado para verificar correspondências parciais
  hasPartialMatch(text: string, search: string, threshold: number): boolean {
    // Se o termo de busca for muito curto, não usar essa lógica
    if (search.length < 3) return false;

    // Divide em palavras
    const words = text.split(/\s+/);

    for (const word of words) {
      // Ignorar palavras muito curtas
      if (word.length < 3) continue;

      // Verificar se as primeiras letras coincidem (mais restritivo)
      if (word.startsWith(search.substring(0, 2))) {
        // Calculando similaridade básica das primeiras letras
        let matches = 0;
        for (let i = 0; i < Math.min(search.length, word.length); i++) {
          if (search[i] === word[i]) matches++;
        }

        const similarity = matches / search.length;

        // Threshold mais alto = menos flexível
        if (similarity >= threshold) return true;
      }
    }

    return false;
  }

  onSearchChange(event: any) {
    this.searchTerm = event.detail.value;

    // Só filtra se tiver pelo menos 3 caracteres ou se o campo estiver vazio
    if (this.searchTerm.trim().length >= 3 || this.searchTerm.trim() === '') {
      this.filterExercises();
    }

    // Se o campo estiver vazio, restaurar lista original filtrada apenas por categoria
    if (this.searchTerm.trim() === '') {
      this.filterExercises();
    }
  }

  selectCategory(category: string) {
    this.selectedCategory = category;
    this.filterExercises();
  }

  viewExerciseDetails(exerciseId: number) {
    console.log('Navegando para detalhes do exercício ID:', exerciseId);

    // Usando a rota correta conforme definido em app.routes.ts
    this.router.navigate(['/exercise-info', exerciseId]);
  }

  // Formatar nome da categoria para exibição
  formatCategoryName(category?: string): string {
    if (!category) return 'Geral';

    // Mapear categorias do inglês para português se necessário
    const categoryMap: { [key: string]: string } = {
      'chest': 'Peito',
      'back': 'Costas',
      'legs': 'Pernas',
      'shoulders': 'Ombros',
      'arms': 'Braços',
      'abs': 'Abdômen',
      'cardio': 'Cardio',
      'peito': 'Peito',
      'costas': 'Costas',
      'pernas': 'Pernas',
      'ombros': 'Ombros',
      'biceps': 'Bíceps',
      'triceps': 'Tríceps',
      'abdomen': 'Abdômen'
    };

    const lowerCategory = category.toLowerCase();
    return categoryMap[lowerCategory] || category;
  }

  // Obter caminho da imagem com fallback
  getImagePath(exercise: Exercise): string {
    if (exercise.image_path) {
      return exercise.image_path;
    }
    return 'assets/images/exercise-placeholder.png';
  }
}
