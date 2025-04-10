import { PersonalService } from 'src/app/services/personal.service';
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule, ToastController } from '@ionic/angular';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import {
  saveOutline,
  addCircleOutline,
  createOutline,
  trashOutline,
  personOutline,
  barbellOutline,
  closeOutline,
  addCircle,
  searchOutline,
  arrowBack,
  waterOutline
} from 'ionicons/icons';
import { addIcons } from 'ionicons';

interface Student {
  id: number;
  name: string;
  photo?: string;
  email?: string;
  phone?: string;
  birth_date?: string;
  level_training_musc?: string;
  status: 'active' | 'inactive';
  created_at: string;
  address?: string;
  emergencyContact?: string;
  medicalNotes?: string;
  goals?: string;
  observations?: string;
  street: string;
  number: string;
  complement?: string;
  neighborhood: string;
  city: string;
  state: string;
  postal_code: string;
}

interface Exercise {
  id: string;
  name: string;
  category: string;
  description?: string;
  muscles?: string;
  instructions?: string;
  image?: string;
  video?: string;
  sets?: number;
  reps?: number;
  weight?: number;
  rest?: number;
  notes?: string;
}

interface WorkoutExercise extends Exercise {
  sets: number;
  reps: number;
  weight: number;
  rest: number;
  notes: string;
  method?: string; // Método avançado: normal, drop-set, super-set, etc.
}

interface ExerciseCategory {
  id: string;
  name: string;
  image: string;
  description?: string;
}

@Component({
  selector: 'app-create-workout',
  templateUrl: './create-workout.page.html',
  styleUrls: ['./create-workout.page.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, FormsModule, RouterModule]
})
export class CreateWorkoutPage implements OnInit {

  studentId: number = 0;
  workoutType: string = 'musculacao';
  studentName: string = '';
  students: any[] = []; // Array original de alunos
  loading = true;
  error = false;
  student: Student | null = null;
  currentSegment: string = '';
  active = 0; // Add the active property
  studentImage: string = '';
  // Adicionar modelo de dados para o treino
  workout = {
    name: '',
    description: '',
    level: 'intermediario',
    workoutDivision: 'unico', // Único, A-B, A-B-C, A-B-C-D, A-B-C-D-E
    exercises: {
      unico: [] as WorkoutExercise[],
      A: [] as WorkoutExercise[],
      B: [] as WorkoutExercise[],
      C: [] as WorkoutExercise[],
      D: [] as WorkoutExercise[],
      E: [] as WorkoutExercise[]
    }
  };

  // Controle de modais e seleção
  showExerciseModal = false;
  showExerciseInfoModal = false;
  showCategoryExercisesModal = false;
  currentWorkoutPart = 'unico';
  selectedExercise: Exercise | null = null;
  selectedCategoryId = '';
  selectedCategoryName = '';
  exerciseSearchTerm = '';

  // Categorias de exercícios
  exerciseCategories: ExerciseCategory[] = [
    {
      id: 'chest',
      name: 'Peito',
      image: 'assets/images/categories/chest.jpg',
      description: 'Exercícios para peitoral'
    },
    {
      id: 'back',
      name: 'Costas',
      image: 'assets/images/categories/back.jpg',
      description: 'Exercícios para costas'
    },
    {
      id: 'legs',
      name: 'Pernas',
      image: 'assets/images/categories/legs.jpg',
      description: 'Exercícios para pernas'
    },
    {
      id: 'arms',
      name: 'Braços',
      image: 'assets/images/categories/arms.jpg',
      description: 'Exercícios para braços'
    },
    {
      id: 'shoulders',
      name: 'Ombros',
      image: 'assets/images/categories/shoulders.jpg',
      description: 'Exercícios para ombros'
    },
    {
      id: 'abs',
      name: 'Abdômen',
      image: 'assets/images/categories/abs.jpg',
      description: 'Exercícios para abdômen'
    }
  ];

  // Dados temporários para adicionar exercício
  exerciseToAdd: Partial<WorkoutExercise> = {
    sets: 3,
    reps: 12,
    weight: 0,
    rest: 60,
    notes: ''
  };

  // Biblioteca de exercícios (simulada - em produção viria da API)
  allExercises: Exercise[] = [
    {
      id: '1',
      name: 'Supino Reto',
      category: 'chest',
      description: 'Exercício para peitoral com barra',
      muscles: 'Peitoral, Tríceps, Deltóide Anterior',
      instructions: 'Deite-se em um banco reto, segure a barra com as mãos um pouco mais afastadas que a largura dos ombros. Desça a barra controladamente até o peito e empurre para cima.',
      image: 'assets/exercises/bench-press.jpg',
      video: 'assets/exercises/bench-press.mp4'
    },
    {
      id: '2',
      name: 'Agachamento',
      category: 'legs',
      description: 'Exercício completo para pernas',
      muscles: 'Quadríceps, Glúteos, Posteriores da Coxa',
      instructions: 'Posicione a barra nos ombros, pés na largura dos ombros. Desça como se fosse sentar em uma cadeira, mantendo o peito erguido e joelhos alinhados com os pés.',
      image: 'assets/exercises/squat.jpg',
      video: 'assets/exercises/squat.mp4'
    },
    {
      id: '3',
      name: 'Puxada Alta',
      category: 'back',
      description: 'Exercício para costas na polia alta',
      muscles: 'Latíssimo do Dorso, Bíceps, Rombóides',
      instructions: 'Segure a barra com as mãos mais afastadas que os ombros. Puxe a barra até a parte superior do peito, aproximando as escápulas.',
      image: 'assets/exercises/lat-pulldown.jpg',
      video: 'assets/exercises/lat-pulldown.mp4'
    },
    {
      id: '4',
      name: 'Rosca Direta',
      category: 'arms',
      description: 'Exercício de isolamento para bíceps',
      muscles: 'Bíceps Braquial, Braquiorradial',
      instructions: 'Em pé, segure a barra com as palmas para cima. Flexione os cotovelos mantendo-os junto ao corpo, levando a barra até os ombros.',
      image: 'assets/exercises/bicep-curl.jpg',
      video: 'assets/exercises/bicep-curl.mp4'
    },
    {
      id: '5',
      name: 'Desenvolvimento',
      category: 'shoulders',
      description: 'Exercício básico para ombros',
      muscles: 'Deltóide, Trapézio, Tríceps',
      instructions: 'Sentado ou em pé, segure a barra na frente dos ombros com as mãos um pouco mais afastadas que a largura dos ombros. Empurre a barra para cima até os braços estarem estendidos.',
      image: 'assets/exercises/shoulder-press.jpg',
      video: 'assets/exercises/shoulder-press.mp4'
    },
    {
      id: '6',
      name: 'Abdominal Crunch',
      category: 'abs',
      description: 'Exercício básico para abdômen',
      muscles: 'Reto Abdominal, Oblíquos',
      instructions: 'Deite-se de costas com joelhos dobrados e pés apoiados no chão. Coloque as mãos atrás da cabeça ou cruzadas no peito. Contraia o abdômen e eleve o tronco em direção aos joelhos.',
      image: 'assets/exercises/abdominal-crunch.jpg',
      video: 'assets/exercises/abdominal-crunch.mp4'
    }
  ];

  filteredExercises: Exercise[] = [];

  // Adicionar controle para modal de edição
  showEditExerciseModal = false;
  exerciseToEdit: WorkoutExercise | null = null;
  exerciseIndexToEdit: number = -1;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private personalService: PersonalService,
    private toastController: ToastController,
  ) {
    addIcons({
      saveOutline,
      addCircleOutline,
      createOutline,
      trashOutline,
      personOutline,
      barbellOutline,
      closeOutline,
      addCircle,
      searchOutline,
      arrowBack,
      waterOutline
    });

    // Inicializar exercícios filtrados
    this.filteredExercises = [...this.allExercises];
  }

  ngOnInit() {
    this.route.paramMap.subscribe(params => {
      const idParam = params.get('id');

      if (idParam) {
        this.studentId = +idParam;
        this.loadStudentDetails();
      } else {
        this.handleError('ID do aluno não encontrado');
      }
    });
  }

  segmentChanged(event: any) {
    this.currentWorkoutPart = event.detail.value;
  }

  async loadStudentDetails() {
    this.loading = true;
    this.error = false;

    try {
      // Simulação de carregamento - substitua por chamada de API real
      await this.simulateLoading(1000);

      this.personalService.getPupilDetails(this.studentId).subscribe(
        (response: any) => {
          if (response && response.status) {
            this.student = response.data;
            this.studentName = response.data.name;
            this.active = response.data.active;
            this.studentImage = response.data.photo;
            console.log('Detalhes do aluno:', this.student);
          } else {
            this.handleError('Erro ao obter detalhes do aluno');
          }
        }
      );
    }
    catch (error) {
      this.handleError('Erro ao carregar detalhes do aluno');
    }
  }

  async simulateLoading(time: number): Promise<void> {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve();
      }, time);
    });
  }

  handleError(message: string) {
    this.error = true;
    this.loading = false;
    this.presentToast(message, 'danger');
  }

  async presentToast(message: string, color: string = 'danger') {
    const toast = await this.toastController.create({
      message,
      duration: 3000,
      color
    });
    await toast.present();
  }

  // Funções para gerenciar as divisões do treino
  updateWorkoutDivision() {
    if (this.workout.workoutDivision === 'unico') {
      this.currentWorkoutPart = 'unico';
    } else {
      // Se mudar de único para divisão ou entre divisões, setar para a primeira parcela
      this.currentWorkoutPart = 'A';
    }
  }

  // Função para obter os exercícios da parcela atual
  getExercisesForCurrentPart(): WorkoutExercise[] {
    return this.workout.exercises[this.currentWorkoutPart as keyof typeof this.workout.exercises];
  }

  // Funções para gestão de exercícios
  openExerciseSelector() {
    this.showExerciseModal = true;
  }

  closeExerciseModal() {
    this.showExerciseModal = false;
  }

  openExerciseInfo(exercise: Exercise) {
    this.selectedExercise = exercise;

    // Resetar os valores para os padrões
    this.exerciseToAdd = {
      sets: 3,
      reps: 12,
      weight: 0,
      rest: 60,
      notes: ''
    };

    this.showExerciseInfoModal = true;
    this.showExerciseModal = false;
  }

  closeExerciseInfoModal() {
    this.showExerciseInfoModal = false;
    this.showExerciseModal = true;
  }

  addExerciseDirectly(exercise: Exercise, event: Event) {
    // Prevenir que o clique propague para o item e abra o modal de detalhes
    event.stopPropagation();

    const newExercise: WorkoutExercise = {
      ...exercise,
      sets: 3,
      reps: 12,
      weight: 0,
      rest: 60,
      notes: ''
    };

    this.workout.exercises[this.currentWorkoutPart as keyof typeof this.workout.exercises].push(newExercise);
    this.closeExerciseModal();
    this.presentToast(`Exercício "${exercise.name}" adicionado ao treino ${this.currentWorkoutPart}`, 'success');
  }

  addExerciseToWorkout() {
    if (!this.selectedExercise) return;

    const newExercise: WorkoutExercise = {
      ...this.selectedExercise,
      sets: this.exerciseToAdd.sets || 3,
      reps: this.exerciseToAdd.reps || 12,
      weight: this.exerciseToAdd.weight || 0,
      rest: this.exerciseToAdd.rest || 60,
      notes: this.exerciseToAdd.notes || ''
    };

    this.workout.exercises[this.currentWorkoutPart as keyof typeof this.workout.exercises].push(newExercise);
    this.showExerciseInfoModal = false;
    this.showExerciseModal = false;
    this.presentToast(`Exercício "${newExercise.name}" adicionado ao treino ${this.currentWorkoutPart}`, 'success');
  }

  removeExercise(index: number, event: Event) {
    // Prevenir que o clique propague para o item
    event.stopPropagation();

    const exercises = this.workout.exercises[this.currentWorkoutPart as keyof typeof this.workout.exercises];
    const exerciseName = exercises[index].name;

    exercises.splice(index, 1);
    this.presentToast(`Exercício "${exerciseName}" removido do treino ${this.currentWorkoutPart}`, 'success');
  }

  showExerciseDetails(exercise: WorkoutExercise) {
    // Encontrar o exercício original na biblioteca para obter detalhes completos
    const originalExercise = this.allExercises.find(e => e.id === exercise.id) || exercise;

    this.selectedExercise = originalExercise;
    this.exerciseToAdd = {
      sets: exercise.sets,
      reps: exercise.reps,
      weight: exercise.weight,
      rest: exercise.rest,
      notes: exercise.notes
    };

    this.showExerciseInfoModal = true;
  }

  // Funções para gestão de categorias e exercícios
  openCategoryExercises(categoryId: string) {
    this.selectedCategoryId = categoryId;
    const category = this.exerciseCategories.find(c => c.id === categoryId);
    this.selectedCategoryName = category ? category.name : '';

    // Filtrar exercícios pela categoria selecionada
    this.filteredExercises = this.allExercises.filter(exercise => exercise.category === categoryId);
    this.exerciseSearchTerm = '';

    this.showExerciseModal = false;
    this.showCategoryExercisesModal = true;
  }

  backToCategorySelection() {
    this.showCategoryExercisesModal = false;
    this.showExerciseModal = true;
  }

  closeCategoryExercisesModal() {
    this.showCategoryExercisesModal = false;
  }

  filterExercises() {
    if (!this.selectedCategoryId) {
      return;
    }

    // Filtrar exercícios pela categoria selecionada e termo de busca
    let filtered = this.allExercises.filter(exercise => exercise.category === this.selectedCategoryId);

    // Aplicar filtro de busca se houver termo
    if (this.exerciseSearchTerm.trim() !== '') {
      const searchTerm = this.exerciseSearchTerm.toLowerCase();
      filtered = filtered.filter(exercise =>
        exercise.name.toLowerCase().includes(searchTerm) ||
        (exercise.description && exercise.description.toLowerCase().includes(searchTerm)) ||
        (exercise.muscles && exercise.muscles.toLowerCase().includes(searchTerm))
      );
    }

    this.filteredExercises = filtered;
  }

  getCategoryName(category: string): string {
    const categories: {[key: string]: string} = {
      'chest': 'Peito',
      'back': 'Costas',
      'legs': 'Pernas',
      'arms': 'Braços',
      'shoulders': 'Ombros',
      'abs': 'Abdômen'
    };

    return categories[category] || category;
  }

  // Adicionar função saveWorkout
  saveWorkout() {
    if (!this.validateWorkout()) {
      return;
    }

    // Verificar se há exercícios em cada parcela do treino
    if (this.workout.workoutDivision !== 'unico') {
      const divisoes = this.workout.workoutDivision.split('-');
      for (const divisao of divisoes) {
        if (this.workout.exercises[divisao as keyof typeof this.workout.exercises].length === 0) {
          this.presentToast(`Adicione pelo menos um exercício ao Treino ${divisao}`, 'warning');
          this.currentWorkoutPart = divisao;
          return;
        }
      }
    }

    // Aqui seria implementada a lógica para salvar o treino no banco de dados
    this.presentToast('Treino salvo com sucesso!', 'success');

    // Navegar de volta para a página de detalhes do aluno ou lista de treinos
    if (this.studentId) {
      this.router.navigate(['/personal/student-details', this.studentId]);
    } else {
      this.router.navigate(['/personal/manage-students']);
    }
  }

  // Função para validar o treino antes de salvar
  validateWorkout(): boolean {
    if (!this.workout.name) {
      this.presentToast('Por favor, informe o nome do treino', 'warning');
      return false;
    }

    const hasExercises =
      this.workout.workoutDivision === 'unico' ?
      this.workout.exercises.unico.length > 0 :
      Object.entries(this.workout.exercises)
        .some(([key, exercises]) =>
          this.workout.workoutDivision.includes(key) && exercises.length > 0
        );

    if (!hasExercises) {
      this.presentToast('Por favor, adicione pelo menos um exercício', 'warning');
      return false;
    }

    return true;
  }

  // Método para tratar erros de carregamento de imagem
  handleImageError(event: any) {
    event.target.src = 'assets/images/photo/default-user.png';
  }

  // Método para voltar à lista de exercícios
  backToExerciseList() {
    this.showExerciseInfoModal = false;
    this.showCategoryExercisesModal = true;
  }

  // Método para fechar todos os modais
  closeAllModals() {
    this.showExerciseInfoModal = false;
    this.showCategoryExercisesModal = false;
    this.showExerciseModal = false;
  }

  // Método para abrir o modal de edição de exercício existente
  editExistingExercise(exercise: WorkoutExercise, index: number) {
    // Criar uma cópia do exercício para edição
    this.exerciseToEdit = { ...exercise };

    // Se o método não estiver definido, definir como 'normal'
    if (!this.exerciseToEdit.method) {
      this.exerciseToEdit.method = 'normal';
    }

    this.exerciseIndexToEdit = index;
    this.showEditExerciseModal = true;
  }

  // Método para fechar o modal de edição
  closeEditExerciseModal() {
    this.showEditExerciseModal = false;
    this.exerciseToEdit = null;
    this.exerciseIndexToEdit = -1;
  }

  // Método para salvar as alterações do exercício
  saveExerciseEdit() {
    if (!this.exerciseToEdit || this.exerciseIndexToEdit < 0) {
      return;
    }

    // Atualizar o exercício na lista
    this.workout.exercises[this.currentWorkoutPart as keyof typeof this.workout.exercises][this.exerciseIndexToEdit] = { ...this.exerciseToEdit };

    this.closeEditExerciseModal();
    this.presentToast('Exercício atualizado com sucesso', 'success');
  }

  // Método para retornar o nome do método avançado formatado
  getMethodName(method: string | undefined): string {
    if (!method || method === 'normal') return 'Normal';

    const methodNames: {[key: string]: string} = {
      'drop-set': 'Drop Set',
      'super-set': 'Super Set',
      'rest-pause': 'Rest Pause',
      'pyramid': 'Pirâmide',
      'giant-set': 'Série Gigante'
    };

    return methodNames[method] || method;
  }

  // Método para retornar a descrição do método avançado
  getMethodDescription(method: string | undefined): string {
    if (!method) return '';

    const methodDescriptions: {[key: string]: string} = {
      'drop-set': 'Realize o exercício até a falha, reduza o peso e continue sem descanso. Excelente para hipertrofia.',
      'super-set': 'Combine com outro exercício sem descanso entre eles. Ótimo para economia de tempo e intensidade.',
      'rest-pause': 'Após falha, descanse 10-15 segundos e continue por mais repetições. Aumenta a intensidade da série.',
      'pyramid': 'Aumente o peso e diminua as repetições a cada série (ou vice-versa). Trabalha diferentes tipos de fibras.',
      'giant-set': 'Combine 3-4 exercícios para o mesmo grupo muscular, sem descanso entre eles.'
    };

    return methodDescriptions[method] || '';
  }
}

