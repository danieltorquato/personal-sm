import { Component, OnInit, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { LoadingController, ToastController, AlertController, IonicModule } from '@ionic/angular';
import { WorkoutService } from '../../../../services/workout.service';
import { UserService } from '../../../../services/user.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from 'src/app/services/auth.service';
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
  waterOutline,
  flashOutline,
  arrowBackOutline,
  informationCircleOutline,
  reorderThreeOutline,
  checkmarkOutline,
  menuOutline,

} from 'ionicons/icons';
import { addIcons } from 'ionicons';
import { PersonalService } from 'src/app/services/personal.service';

// Definição de tipo local para o objeto workout usado nesta página
interface LocalWorkout {
  user_id: number;
  name: string;
  type: string;
  notes: string;
  workoutDivision: string;
  level: string;
  duration: number;
  durationUnit: string;
  exercises: {
    [key: string]: WorkoutExercise[];
  };
}

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
  id: number;
  name: string;
  category: string;
  type: string;
  description: string;
  muscles: string;
  instructions: string;
  image: string;
  video?: string;
}

interface WorkoutExercise extends Exercise {
  sets: number;
  reps: number;
  weight: number;
  rest: number;
  notes: string;
  method?: string; // Método avançado: normal, drop-set, super-set, etc.
  methodConfig?: MethodConfig; // Configuração detalhada do método
}

interface MethodConfig {
  pyramidSets?: PyramidSet[];
  dropSets?: DropSet[];
  superSetExercise?: string;
  giantSetExercises?: string[];
  restPauseSets?: RestPauseSet[];
}

interface PyramidSet {
  setNumber: number;
  weight: number;
  reps: number;
}

interface DropSet {
  setNumber: number;
  weight: number;
  reps: number;
}

interface RestPauseSet {
  setNumber: number;
  weight: number;
  reps: number;
  pauseTime: number;
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
  imports: [IonicModule, CommonModule, FormsModule],
  schemas: [CUSTOM_ELEMENTS_SCHEMA]
})
export class CreateWorkoutPage implements OnInit {
  studentId: number = 0;
  studentName: string = '';
  studentImage: string = '';
  workoutType: string = 'gym'; // gym ou pool
  loading = true;
  error = false;
  student: Student | null = null;
  currentSegment: string = '';
  active = 0; // Add the active property
  // Modais
  showExerciseModal = false;
  showCategoryExercisesModal = false;
  showExerciseInfoModal = false;
  showEditExerciseModal = false;

  // Para manter referência ao índice do exercício sendo editado
  selectedExerciseIndex: number | null = null;

  // Controle de reordenação de exercícios
  reorderMode: boolean = false;

  // Exercícios e categorias
  exerciseCategories: any[] = [];
  selectedCategory: string = '';
  selectedCategoryName: string = '';
  exercises: Exercise[] = [];
  filteredExercises: Exercise[] = [];
  exerciseSearchTerm: string = '';
  selectedExercise: Exercise | null = null;

  // Dados temporários para adicionar exercício
  exerciseToAdd: Partial<WorkoutExercise> = {
    sets: 3,
    reps: 12,
    weight: 0,
    rest: 60,
    notes: '',
    method: 'normal'
  };

  // Adicionar controle para modal de edição
  exerciseToEdit: WorkoutExercise | null = null;

  pyramidType: string = 'crescente'; // crescente, decrescente, completa

  // Array temporário para configuração de métodos
  tempMethodConfig: MethodConfig = {};

  // Dados do treino
  workout: LocalWorkout = {
    user_id: 0,
    name: '',
    type: 'gym',
    notes: '',
    workoutDivision: 'unico',
    level: 'intermediario',
    duration: 4,
    durationUnit: 'semanas',
    exercises: {
      A: [] as WorkoutExercise[],
      B: [] as WorkoutExercise[],
      C: [] as WorkoutExercise[],
      D: [] as WorkoutExercise[],
      E: [] as WorkoutExercise[]
    }
  };

  currentWorkoutPart: string = 'A';
  isEditMode: boolean = false;

  // Propriedade para controle de foco da searchbar
  isFocused: boolean = false;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private workoutService: WorkoutService,
    private personalService: PersonalService,
    private loadingCtrl: LoadingController,
    private toastCtrl: ToastController,
    private alertCtrl: AlertController
  ) {
    addIcons({
      saveOutline,
      addCircleOutline,
      flashOutline,
      trashOutline,
      barbellOutline,
      closeOutline,
      arrowBackOutline,
      informationCircleOutline,
      createOutline,
      personOutline,
      addCircle,
      searchOutline,
      arrowBack,
      waterOutline,
      reorderThreeOutline,
      checkmarkOutline,
      menuOutline,

    });
  }

  async ngOnInit() {
    // Obter ID do aluno da rota
    this.route.queryParams.subscribe(params => {
      if (params['studentId']) {
        this.studentId = +params['studentId'];
        this.loadStudentDetails();
        this.checkActiveWorkouts(); // Nova chamada para verificar treinos ativos
      }
    });

    // Inicializar categorias fixas
    this.initializeCategories();

    // Carregar exercícios
    await this.loadExercises();
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
  handleError(message: string) {
    this.error = true;
    this.loading = false;
    this.presentToast(message, 'danger');
  }

  async simulateLoading(time: number): Promise<void> {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve();
      }, time);
    });
  }

  async loadExercises() {
    console.log('Iniciando carregamento de exercícios');
    const loading = await this.loadingCtrl.create({
      message: 'Carregando exercícios...'
    });
    await loading.present();

    try {
      const response = await this.workoutService.getAllExercises(this.workoutType).toPromise();
      if (response && response.data) {
        this.exercises = response.data.map((exercise: any) => ({
          ...exercise,
          image: exercise.image_path,
          video: exercise.video_path
        }));
        this.filterExercisesByCategory(this.selectedCategory);
      }
    } catch (error) {
      console.error('Erro ao carregar exercícios:', error);
      this.presentToast('Erro ao carregar exercícios.', 'danger');
    } finally {
      loading.dismiss();
    }
  }

  initializeCategories() {
    // Categorias fixas para musculação
    this.exerciseCategories = [
      { id: 'Peito', name: 'Peito', image: 'assets/images/categories/chest.jpg' },
      { id: 'Costas', name: 'Costas', image: 'assets/images/categories/back.jpg' },
      { id: 'Pernas', name: 'Pernas', image: 'assets/images/categories/legs.jpg' },
      { id: 'Ombros', name: 'Ombros', image: 'assets/images/categories/shoulders.jpg' },
      { id: 'Braços', name: 'Braços', image: 'assets/images/categories/arms.jpg' },
      { id: 'Abdômen', name: 'Abdômen', image: 'assets/images/categories/abs.jpg' },
      { id: 'Cardio', name: 'Cardio', image: 'assets/images/categories/cardio.jpg' },
      { id: 'Funcional', name: 'Funcional', image: 'assets/images/categories/functional.jpg' }
    ];
  }

  // Abrir modal para selecionar exercícios
  openExerciseSelector() {
    this.showExerciseModal = true;
  }

  // Fechar modal de exercícios
  closeExerciseModal() {
    this.showExerciseModal = false;
  }

  // Abrir categoria de exercícios
  openCategoryExercises(categoryId: string) {
    this.selectedCategory = categoryId;
    this.selectedCategoryName = this.getCategoryName(categoryId);
    this.filterExercisesByCategory(categoryId);
    this.showCategoryExercisesModal = true;
    this.showExerciseModal = false;
  }

  // Filtrar exercícios por categoria
  filterExercisesByCategory(categoryId: string) {
    console.log('Filtrando exercícios por categoria:', categoryId);
    this.filteredExercises = this.exercises.filter(exercise =>
      exercise.category.toLowerCase() === categoryId.toLowerCase()
    );
    console.log('Exercícios filtrados:', this.filteredExercises);
  }

  // Filtrar exercícios por termo de busca
  filterExercises() {
    console.log('Termo de busca:', this.exerciseSearchTerm);
    if (this.exerciseSearchTerm.trim() === '') {
      this.filterExercisesByCategory(this.selectedCategory);
    } else {
      const searchTerm = this.exerciseSearchTerm.toLowerCase();
      this.filteredExercises = this.exercises.filter(exercise =>
        (exercise.category.toLowerCase() === this.selectedCategory.toLowerCase()) &&
        (exercise.name.toLowerCase().includes(searchTerm) ||
         exercise.muscles?.toLowerCase().includes(searchTerm) ||
         exercise.description?.toLowerCase().includes(searchTerm))
      );
      console.log('Resultados da busca:', this.filteredExercises);
    }
  }

  // Voltar à seleção de categorias
  backToCategorySelection() {
    this.showCategoryExercisesModal = false;
    this.showExerciseModal = true;
    this.selectedCategory = '';
    this.exerciseSearchTerm = '';
  }

  // Fechar o modal de categorias de exercícios
  closeCategoryExercisesModal() {
    this.showCategoryExercisesModal = false;
    this.selectedCategory = '';
    this.exerciseSearchTerm = '';
  }

  // Abrir informações do exercício
  openExerciseInfo(exercise: Exercise) {
    this.selectedExercise = exercise;
    this.showExerciseInfoModal = true;
    this.showCategoryExercisesModal = false;

    // Reiniciar valores de exercício a adicionar
    this.exerciseToAdd = {
      sets: 3,
      reps: 12,
      weight: 0,
      rest: 60,
      notes: '',
      method: 'normal'
    };
  }

  // Fechar modal de informações de exercício
  closeExerciseInfoModal() {
    this.showExerciseInfoModal = false;
    this.selectedExercise = null;
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

  // Adicionar exercício diretamente da lista
  addExerciseDirectly(exercise: Exercise, event: Event) {
    // Prevenir que o clique propague para o item e abra o modal de detalhes
    event.stopPropagation();

    const newExercise: WorkoutExercise = {
      ...exercise,
      sets: 3,
      reps: 12,
      weight: 0,
      rest: 60,
      notes: '',
      method: 'normal'
    };

    this.workout.exercises[this.currentWorkoutPart as keyof typeof this.workout.exercises].push(newExercise);
    this.closeExerciseModal();
    this.presentToast(`Exercício "${exercise.name}" adicionado ao treino ${this.currentWorkoutPart}`, 'success');
  }

  // Adicionar exercício ao treino
  addExerciseToWorkout() {
    console.log('Adicionando exercício ao treino:', this.selectedExercise);
    console.log('Configuração do exercício:', this.exerciseToAdd);
    console.log('Parte atual do treino:', this.currentWorkoutPart);

    if (this.selectedExercise) {
      const exerciseToAdd: WorkoutExercise = {
        ...this.selectedExercise,
        sets: this.exerciseToAdd.sets || 3,
        reps: this.exerciseToAdd.reps || 12,
        weight: this.exerciseToAdd.weight || 0,
        rest: this.exerciseToAdd.rest || 60,
        notes: this.exerciseToAdd.notes || '',
        method: this.exerciseToAdd.method || 'normal',
        methodConfig: this.exerciseToAdd.method !== 'normal' ? this.tempMethodConfig : undefined
      };

      // Adicionar à parte atual do treino
      this.workout.exercises[this.currentWorkoutPart as keyof typeof this.workout.exercises].push(exerciseToAdd);

      console.log('Exercício adicionado com sucesso');
      console.log('Estado atual do treino:', this.workout);

      // Fechar modal e resetar form
      this.showExerciseModal = false;
      this.resetExerciseForm();
      this.exerciseSearchTerm = '';
      this.presentToast(`Exercício "${this.selectedExercise.name}" adicionado ao treino ${this.currentWorkoutPart}`, 'success');
      this.selectedExercise = null;
    }
  }

  // Remover exercício do treino
  async removeExercise(index: number) {
    console.log('Removendo exercício no índice:', index);
    console.log('Parte atual do treino:', this.currentWorkoutPart);

    const exerciseToRemove = this.workout.exercises[this.currentWorkoutPart as keyof typeof this.workout.exercises][index];

    const alert = await this.alertCtrl.create({
      header: 'Confirmar remoção',
      message: `Deseja remover o exercício "${exerciseToRemove.name}" do treino?`,
      buttons: [
        {
          text: 'Cancelar',
          role: 'cancel'
        },
        {
          text: 'Remover',
          handler: () => {
            this.workout.exercises[this.currentWorkoutPart as keyof typeof this.workout.exercises].splice(index, 1);
            console.log('Exercício removido. Estado atual do treino:', this.workout);
            this.presentToast(`Exercício "${exerciseToRemove.name}" removido do treino`, 'success');
          }
        }
      ]
    });

    await alert.present();
  }

  // Método para abrir o modal de edição de exercício existente
  editExistingExercise(exercise: WorkoutExercise, index: number) {
    console.log('Editando exercício:', exercise);
    console.log('Índice do exercício:', index);
    console.log('Parte atual do treino:', this.currentWorkoutPart);

    // Criar uma cópia do exercício para edição
    this.exerciseToEdit = { ...exercise };
    this.selectedExerciseIndex = index;

    // Se o método não estiver definido, definir como 'normal'
    if (!this.exerciseToEdit.method) {
      this.exerciseToEdit.method = 'normal';
    }

    // Se não houver configuração de método, inicializar
    if (!this.exerciseToEdit.methodConfig) {
      this.exerciseToEdit.methodConfig = {};
    }

    // Copiar a configuração do método para o objeto temporário
    this.tempMethodConfig = JSON.parse(JSON.stringify(this.exerciseToEdit.methodConfig || {}));

    // Inicializar configurações para métodos específicos se necessário
    this.initializeMethodConfig(this.exerciseToEdit.method);

    // Configurar o exercício para edição
    this.exerciseToAdd = {
      sets: exercise.sets,
      reps: exercise.reps,
      weight: exercise.weight,
      rest: exercise.rest,
      notes: exercise.notes,
      method: exercise.method || 'normal'
    };

    console.log('Configurações para edição:', this.exerciseToAdd);

    // Mostrar o modal de edição
    this.showEditExerciseModal = true;
  }

  // Método para inicializar configurações específicas do método
  initializeMethodConfig(method: string | undefined) {
    if (!method || method === 'normal') return;

    if (method === 'pyramid' && (!this.tempMethodConfig.pyramidSets || this.tempMethodConfig.pyramidSets.length === 0)) {
      // Inicializar configuração de pirâmide com valores padrão baseados no número de séries
      const sets = this.exerciseToEdit?.sets || 4;
      this.tempMethodConfig.pyramidSets = [];

      if (this.pyramidType === 'crescente') {
        // Pirâmide crescente: peso aumenta, repetições diminuem
        for (let i = 0; i < sets; i++) {
          const weightPercent = 70 + (i * 10); // 70%, 80%, 90%, 100%
          const reps = Math.max(6, 12 - (i * 2)); // 12, 10, 8, 6

          this.tempMethodConfig.pyramidSets.push({
            setNumber: i + 1,
            weight: this.exerciseToEdit?.weight ? (this.exerciseToEdit.weight * weightPercent / 100) : 0,
            reps: reps
          });
        }
      } else if (this.pyramidType === 'decrescente') {
        // Pirâmide decrescente: peso diminui, repetições aumentam
        for (let i = 0; i < sets; i++) {
          const weightPercent = 100 - (i * 10); // 100%, 90%, 80%, 70%
          const reps = 6 + (i * 2); // 6, 8, 10, 12

          this.tempMethodConfig.pyramidSets.push({
            setNumber: i + 1,
            weight: this.exerciseToEdit?.weight ? (this.exerciseToEdit.weight * weightPercent / 100) : 0,
            reps: reps
          });
        }
      } else if (this.pyramidType === 'completa') {
        // Pirâmide completa: sobe e desce
        const halfSets = Math.ceil(sets / 2);
        for (let i = 0; i < sets; i++) {
          let weightPercent, reps;

          if (i < halfSets) {
            // Fase crescente
            weightPercent = 70 + (i * 10);
            reps = Math.max(6, 12 - (i * 2));
          } else {
            // Fase decrescente
            const reverseIndex = sets - i - 1;
            weightPercent = 70 + (reverseIndex * 10);
            reps = Math.max(6, 12 - (reverseIndex * 2));
          }

          this.tempMethodConfig.pyramidSets.push({
            setNumber: i + 1,
            weight: this.exerciseToEdit?.weight ? (this.exerciseToEdit.weight * weightPercent / 100) : 0,
            reps: reps
          });
        }
      }
    } else if (method === 'drop-set' && (!this.tempMethodConfig.dropSets || this.tempMethodConfig.dropSets.length === 0)) {
      // Inicializar configuração de drop set
      this.tempMethodConfig.dropSets = [];
      const drops = 3; // Padrão: 3 drops
      const baseWeight = this.exerciseToEdit?.weight || 0;

      for (let i = 0; i < drops; i++) {
        const weightPercent = 100 - (i * 20); // 100%, 80%, 60%

        this.tempMethodConfig.dropSets.push({
          setNumber: i + 1,
          weight: baseWeight * weightPercent / 100,
          reps: 8 // Mesmo número de repetições para todos os drops
        });
      }
    } else if (method === 'rest-pause' && (!this.tempMethodConfig.restPauseSets || this.tempMethodConfig.restPauseSets.length === 0)) {
      // Inicializar configuração de rest-pause
      this.tempMethodConfig.restPauseSets = [];
      const sets = 3; // Padrão: 3 séries com pausa

      for (let i = 0; i < sets; i++) {
        this.tempMethodConfig.restPauseSets.push({
          setNumber: i + 1,
          weight: this.exerciseToEdit?.weight || 0,
          reps: Math.max(4, 8 - (i * 2)), // 8, 6, 4 (diminui com a fadiga)
          pauseTime: 15 // 15 segundos de pausa entre séries
        });
      }
    }
  }

  // Adicionar método para salvar a configuração do método
  saveMethodConfig() {
    if (!this.exerciseToEdit) return;

    // Atualizar a configuração do método no exercício
    this.exerciseToEdit.methodConfig = JSON.parse(JSON.stringify(this.tempMethodConfig));
  }

  // Método para adicionar uma série à configuração de pirâmide
  addPyramidSet() {
    if (!this.tempMethodConfig.pyramidSets) {
      this.tempMethodConfig.pyramidSets = [];
    }

    const newSetNumber = this.tempMethodConfig.pyramidSets.length + 1;
    const lastSet = this.tempMethodConfig.pyramidSets[this.tempMethodConfig.pyramidSets.length - 1];

    this.tempMethodConfig.pyramidSets.push({
      setNumber: newSetNumber,
      weight: lastSet ? lastSet.weight : (this.exerciseToEdit?.weight || 0),
      reps: lastSet ? lastSet.reps : (this.exerciseToEdit?.reps || 10)
    });
  }

  // Método para remover uma série da configuração de pirâmide
  removePyramidSet(index: number) {
    if (this.tempMethodConfig.pyramidSets && this.tempMethodConfig.pyramidSets.length > 1) {
      this.tempMethodConfig.pyramidSets.splice(index, 1);

      // Atualizar números das séries
      this.tempMethodConfig.pyramidSets.forEach((set, idx) => {
        set.setNumber = idx + 1;
      });
    }
  }

  // Método para adicionar uma série à configuração de drop set
  addDropSet() {
    if (!this.tempMethodConfig.dropSets) {
      this.tempMethodConfig.dropSets = [];
    }

    const newSetNumber = this.tempMethodConfig.dropSets.length + 1;
    const lastSet = this.tempMethodConfig.dropSets[this.tempMethodConfig.dropSets.length - 1];

    const newWeight = lastSet ? lastSet.weight * 0.8 : (this.exerciseToEdit?.weight || 0);

    this.tempMethodConfig.dropSets.push({
      setNumber: newSetNumber,
      weight: newWeight,
      reps: lastSet ? lastSet.reps : (this.exerciseToEdit?.reps || 8)
    });
  }

  // Método para remover uma série da configuração de drop set
  removeDropSet(index: number) {
    if (this.tempMethodConfig.dropSets && this.tempMethodConfig.dropSets.length > 1) {
      this.tempMethodConfig.dropSets.splice(index, 1);

      // Atualizar números das séries
      this.tempMethodConfig.dropSets.forEach((set, idx) => {
        set.setNumber = idx + 1;
      });
    }
  }

  // Método para selecionar o tipo de pirâmide
  selectPyramidType(type: string) {
    this.pyramidType = type;

    // Reinicializar a configuração da pirâmide
    if (this.exerciseToEdit && this.exerciseToEdit.method === 'pyramid') {
      this.tempMethodConfig.pyramidSets = [];
      this.initializeMethodConfig('pyramid');
    }
  }

  // Método para fechar o modal de edição
  closeEditExerciseModal() {
    this.showEditExerciseModal = false;
    this.selectedExerciseIndex = null;
    this.exerciseToEdit = null;
    this.resetExerciseForm();
  }

  // Método para salvar a edição de um exercício
  saveExerciseEdit() {
    console.log('Salvando edição de exercício no índice:', this.selectedExerciseIndex);

    if (this.selectedExerciseIndex !== null && this.exerciseToEdit) {
      // Atualizar o exercício com os valores editados
      const updatedExercise: WorkoutExercise = {
        ...this.exerciseToEdit,
        sets: Number(this.exerciseToAdd.sets || 3),
        reps: Number(this.exerciseToAdd.reps || 12),
        weight: Number(this.exerciseToAdd.weight || 0),
        rest: Number(this.exerciseToAdd.rest || 60),
        notes: this.exerciseToAdd.notes || '',
        method: this.exerciseToAdd.method || 'normal',
        methodConfig: this.exerciseToAdd.method !== 'normal' ? this.tempMethodConfig : undefined
      };

      console.log('Exercício atualizado:', updatedExercise);

      // Atualizar o exercício na lista
      this.workout.exercises[this.currentWorkoutPart as keyof typeof this.workout.exercises][this.selectedExerciseIndex] = updatedExercise;

      // Fechar o modal e mostrar mensagem
      this.showEditExerciseModal = false;
      this.selectedExerciseIndex = null;
      this.exerciseToEdit = null;
      this.resetExerciseForm();
      this.presentToast('Exercício atualizado com sucesso', 'success');
    }
  }

  // Atualizar divisão de treino
  updateWorkoutDivision() {
    if (this.workout.workoutDivision === 'unico') {
      // Se mudar para único, mover todos os exercícios para A
      const allExercises: WorkoutExercise[] = [];

      for (const part in this.workout.exercises) {
        allExercises.push(...this.workout.exercises[part as keyof typeof this.workout.exercises]);
      }

      // Limpar todos os arrays
      for (const part in this.workout.exercises) {
        this.workout.exercises[part as keyof typeof this.workout.exercises] = [];
      }

      // Adicionar todos ao A
      // Adicionar todos ao A
      this.workout.exercises['A'] = allExercises;
      this.currentWorkoutPart = 'A';
    } else {
      // Manter selecionado o A ao mudar para divisão
      this.currentWorkoutPart = 'A';
    }
  }

  // Obter nome da categoria
  getCategoryName(categoryId: string): string {
    const category = this.exerciseCategories.find(cat => cat.id === categoryId);
    return category ? category.name : categoryId;
  }

  // Obter exercícios da parte atual do treino
  getExercisesForCurrentPart(): WorkoutExercise[] {
    return this.workout.exercises[this.currentWorkoutPart as keyof typeof this.workout.exercises] || [];
  }

  // Alterar a parte do treino selecionada
  segmentChanged(event: any) {
    this.currentWorkoutPart = event.detail.value;
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

  // Método para lidar com erros de carregamento de imagem
  handleImageError(event: any) {
    event.target.src = 'assets/images/photo/default-user.png';
  }

  // Novo método para verificar treinos ativos
  async checkActiveWorkouts() {
    try {
      const loading = await this.loadingCtrl.create({
        message: 'Verificando treinos ativos...'
      });
      await loading.present();

      const response = await this.workoutService.checkActiveWorkouts(this.studentId).toPromise();

      loading.dismiss();

      if (response && response.status === 'success') {
        if (response.data && response.data.hasActiveWorkout) {
          // Se o aluno tem um treino ativo, mostrar alerta para confirmação
          const activeWorkout = response.data.workout;
          const today = new Date();
          const validateToDate = new Date(activeWorkout.validate_to);

          // Verificar se a data validate_to é superior a hoje (está ativo)
          if (validateToDate > today) {
            this.showActiveWorkoutConfirmation(activeWorkout);
          }
        }
      } else {
        console.error('Resposta inválida ao verificar treinos ativos:', response);
        this.presentToast('Erro ao verificar treinos ativos', 'danger');
      }
    } catch (error) {
      console.error('Erro ao verificar treinos ativos:', error);
      this.presentToast('Erro ao verificar treinos ativos', 'danger');
    }
  }

  // Mostrar confirmação se já existe treino ativo
  async showActiveWorkoutConfirmation(activeWorkout: any) {
    const formatDate = (dateString: string) => {
      const date = new Date(dateString);
      return date.toLocaleDateString('pt-BR');
    };

    const alert = await this.alertCtrl.create({
      header: 'Treino Ativo Encontrado',
      message: `O aluno já possui um treino ativo: "${activeWorkout.name}" com validade até ${formatDate(activeWorkout.validate_to)}. Deseja criar um novo treino mesmo assim? O treino ativo atual será desativado.`,
      buttons: [
        {
          text: 'Cancelar',
          role: 'cancel',
          handler: () => {
            // Voltar para a página anterior
            this.router.navigate(['/personal/student-profile'], { queryParams: { id: this.studentId } });
          }
        },
        {
          text: 'Continuar',
          handler: () => {
            // Perguntar se deseja importar o treino anterior ou começar do zero
            this.showImportWorkoutOption(activeWorkout);
          }
        }
      ]
    });

    await alert.present();
  }

  // Perguntar se deseja importar treino anterior ou começar do zero
  async showImportWorkoutOption(activeWorkout: any) {
    const alert = await this.alertCtrl.create({
      header: 'Importar Treino Anterior?',
      message: `Deseja importar os exercícios do treino anterior "${activeWorkout.name}" ou iniciar um novo treino do zero?`,
      buttons: [
        {
          text: 'Iniciar do Zero',
          handler: () => {
            console.log('Iniciando novo treino do zero');
            // Continua com o fluxo normal, mantendo o treino vazio
          }
        },
        {
          text: 'Importar Treino',
          handler: () => {
            // Importar o treino anterior
            this.importWorkout(activeWorkout.id);
          }
        }
      ]
    });

    await alert.present();
  }

  // Método para importar treino anterior
  async importWorkout(workoutId: number) {
    const loading = await this.loadingCtrl.create({
      message: 'Importando treino anterior...'
    });
    await loading.present();

    try {
      // Obter detalhes do treino anterior
      const response = await this.workoutService.getWorkout(workoutId).toPromise();

      if (response && response.status === 'success' && response.data) {
        const workoutData = response.data;
        console.log('Treino anterior:', workoutData);
        // Copiar informações básicas do treino para nosso formato local
        this.workout.name = `${workoutData.name} (Cópia)`;
        // Garantir valores padrão para propriedades obrigatórias
        if (workoutData.type) {
          this.workout.type = workoutData.type;
        }
        if (workoutData.notes) {
          this.workout.notes = workoutData.notes;
        }
        // Se houver exercícios no treino anterior, importá-los
        if (workoutData.exercises && workoutData.exercises.length > 0) {
          // Limpar exercícios atuais de todas as partes
          Object.keys(this.workout.exercises).forEach(part => {
            this.workout.exercises[part as keyof typeof this.workout.exercises] = [];
          });

          // Adicionar exercícios do treino anterior
          const importedExercises = workoutData.exercises.map((ex: any) => {
            // Extrair parte e método das notas, se disponível
            let part = 'A';
            let method = 'normal';
            let weight = 0;
            let methodConfig = undefined;

            if (ex.notes) {
              const partMatch = ex.notes.match(/\| Parte: ([A-E]) \|/);
              if (partMatch && partMatch[1]) {
                part = partMatch[1];
              }

              const methodMatch = ex.notes.match(/\| Método: ([a-z-]+) \|/);
              if (methodMatch && methodMatch[1]) {
                method = methodMatch[1];
              }

              const weightMatch = ex.notes.match(/\| Peso: ([0-9.]+)kg/);
              if (weightMatch && weightMatch[1]) {
                weight = parseFloat(weightMatch[1]);
              }
            }

            // Criar objeto de exercício para importar
            return {
              id: ex.exercise_id,
              name: ex.exercise_name,
              category: ex.category || '',
              type: 'musculacao',
              description: ex.description || '',
              muscles: ex.muscles || '',
              instructions: ex.instructions || '',
              image: ex.image_path || '',
              video: ex.video_path || '',
              sets: ex.sets || 3,
              reps: ex.reps || 12,
              weight: weight,
              rest: ex.rest_seconds || 60,
              notes: ex.notes ? ex.notes.replace(/\| Parte: [A-E] \|.*$/, '') : '',
              method: method,
              methodConfig: methodConfig,
              part: part // Adicionamos a parte ao objeto para uso na distribuição
            };
          });

          // Distribuir exercícios de acordo com as partes identificadas
          importedExercises.forEach((exercise: any) => {
            const part = exercise.part;
            // Remover propriedade auxiliar antes de adicionar
            delete exercise.part;

            // Limpar as notas de informações de partes e métodos
            if (exercise.notes) {
              exercise.notes = exercise.notes.replace(/\| Parte: [A-E] \|.*$/, '').trim();
            }

            // Adicionar exercício à parte correspondente
            this.workout.exercises[part as keyof typeof this.workout.exercises].push(exercise);
          });

          // Determinar o tipo de divisão com base nos exercícios importados
          const partsWithExercises = Object.keys(this.workout.exercises)
            .filter(p => this.workout.exercises[p as keyof typeof this.workout.exercises].length > 0)
            .sort();

          if (partsWithExercises.length > 1) {
            this.workout.workoutDivision = partsWithExercises.join('-');
          } else {
            this.workout.workoutDivision = 'unico';
          }

          this.presentToast('Treino importado com sucesso!', 'success');
        } else {
          this.presentToast('O treino não contém exercícios para importar.', 'warning');
        }
      } else {
        console.error('Falha ao importar treino:', response);
        this.presentToast('Erro ao importar treino anterior.', 'danger');
      }
    } catch (error) {
      console.error('Erro ao importar treino:', error);
      this.presentToast('Erro ao importar treino anterior.', 'danger');
    } finally {
      loading.dismiss();
    }
  }

  // Método para salvar o treino
  async saveWorkout() {
    console.log('Iniciando salvamento do treino');
    console.log('Dados do treino a serem salvos:', this.workout);

    // Validação básica
    if (!this.workout.name) {
      console.error('Validação falhou: Nome do treino não definido');
      return this.presentToast('Por favor, defina um nome para o treino.', 'warning');
    }

    if (this.getExercisesForCurrentPart().length === 0 && this.workout.workoutDivision === 'unico') {
      console.error('Validação falhou: Treino não tem exercícios');
      return this.presentToast('Adicione pelo menos um exercício ao treino.', 'warning');
    }

    // Verificar se há exercícios em todas as divisões selecionadas
    if (this.workout.workoutDivision !== 'unico') {
      const parts = this.workout.workoutDivision.split('-');
      for (const part of parts) {
        if (this.workout.exercises[part as keyof typeof this.workout.exercises].length === 0) {
          console.error(`Validação falhou: Parte ${part} não tem exercícios`);
          return this.presentToast(`Adicione pelo menos um exercício ao Treino ${part}.`, 'warning');
        }
      }
    }

    const loading = await this.loadingCtrl.create({
      message: 'Salvando treino...'
    });
    await loading.present();

    try {
      // Primeiro, marcar treinos anteriores como concluídos para este aluno
      if (this.studentId) {
        try {
          const result = await this.workoutService.completePreviousWorkouts(this.studentId).toPromise();
          console.log('Resultado de marcar treinos anteriores como concluídos:', result);

          if (result && result.completedCount > 0) {
            this.presentToast(`${result.completedCount} treinos anteriores marcados como concluídos`, 'success');
          }
        } catch (error) {
          console.error('Erro ao marcar treinos anteriores como concluídos:', error);
          // Continuamos mesmo se houver erro na conclusão dos treinos anteriores
        }
      }

      // Preparar os dados para API
      const workoutData: any = {
        user_id: this.studentId || 0, // Usar o ID do aluno se estiver criando para um aluno específico
        name: this.workout.name,
        type: this.workout.type,
        notes: this.workout.notes,
        duration: this.workout.duration,
        durationUnit: this.workout.durationUnit,
        exercises: []
      };

      console.log('Dados preparados para API:', workoutData);

      // Adicionar todos os exercícios de todas as partes relevantes
      const parts = this.workout.workoutDivision === 'unico'
        ? ['A']
        : this.workout.workoutDivision.split('-');

      for (const part of parts) {
        const exercises = this.workout.exercises[part as keyof typeof this.workout.exercises];
        console.log(`Processando exercícios da parte ${part}:`, exercises.length);

        for (const exercise of exercises) {
          workoutData.exercises.push({
            exercise_id: exercise.id,
            sets: exercise.sets,
            reps: exercise.reps,
            rest_seconds: exercise.rest,
            duration_seconds: null,
            notes: `${exercise.notes || ''} | Parte: ${part} | Método: ${exercise.method || 'normal'} | Peso: ${exercise.weight}kg`,
            method_config: exercise.methodConfig ? JSON.stringify(exercise.methodConfig) : null
          });
        }
      }

      // Enviar para a API - O serviço agora lida com o problema de formatação JSON
      console.log('Enviando dados para a API:', workoutData);
      const response = await this.workoutService.createWorkout(workoutData).toPromise();

      console.log('Resposta processada:', response);

      if (response && response.status === 'success') {
        this.presentToast('Treino salvo com sucesso!', 'success');

        // Redirecionar para a lista de treinos ou página do aluno
        setTimeout(() => {
          if (this.studentId) {
            this.router.navigate(['/personal/student-profile'], { queryParams: { id: this.studentId } });
          } else {
            this.router.navigate(['/personal/manage-workouts']);
          }
        }, 1500);
      } else {
        console.error('Erro ao salvar treino: Resposta inválida do servidor');
        this.presentToast('Erro ao salvar o treino. Resposta inválida do servidor.', 'danger');
      }
    } catch (error) {
      console.error('Erro ao salvar treino:', error);
      this.presentToast('Erro ao salvar o treino. Verifique sua conexão e tente novamente.', 'danger');
    } finally {
      loading.dismiss();
    }
  }

  // Apresentar toast
  async presentToast(message: string, color: string = 'primary') {
    const toast = await this.toastCtrl.create({
      message,
      duration: 2000,
      color,
      position: 'top'
    });
    toast.present();
  }

  // Alternar modo de reordenação
  toggleReorderMode() {
    // Verificar se há exercícios antes de ativar o modo de reordenação
    const exercisesCount = this.getExercisesForCurrentPart().length;
    if (exercisesCount === 0 && !this.reorderMode) {
      this.presentToast('Adicione exercícios para reordená-los', 'warning');
      return;
    }

    this.reorderMode = !this.reorderMode;

    // Aplicar um pequeno timeout para permitir o DOM atualizar suavemente
    if (this.reorderMode) {
      setTimeout(() => {
        // Apenas para forçar uma re-renderização suave
        this.reorderMode = true;
      }, 10);
    }
  }

  // Manipular evento de reordenação
  handleReorder(event: any) {
    // Obter a parte atual do treino
    const currentPart = this.currentWorkoutPart as keyof typeof this.workout.exercises;

    // Obter os exercícios da parte atual
    const exercises = this.workout.exercises[currentPart];

    // Reordenar os exercícios
    const itemToMove = exercises.splice(event.detail.from, 1)[0];
    exercises.splice(event.detail.to, 0, itemToMove);

    // Completar o evento de reordenação
    event.detail.complete();

    // Exibir mensagem de confirmação
    this.presentToast('Ordem dos exercícios atualizada', 'success');
  }

  // Resetar formulário de exercício
  resetExerciseForm() {
    this.exerciseToAdd = {
      sets: 3,
      reps: 12,
      weight: 0,
      rest: 60,
      notes: '',
      method: 'normal'
    };
    this.tempMethodConfig = {};
    this.selectedExercise = null;
  }

  // Verificar se o treino tem exercícios
  hasExercises(): boolean {
    if (this.workout.workoutDivision === 'unico') {
      return this.workout.exercises['A'].length > 0;
    } else {
      const parts = this.workout.workoutDivision.split('-');
      for (const part of parts) {
        if (this.workout.exercises[part as keyof typeof this.workout.exercises].length === 0) {
          return false;
        }
      }
      return true;
    }
  }

  // Verificar se o treino de ciclo tem exercícios configurados
  hasCycleSets(): boolean {
    // Implementação simplificada - ajuste conforme necessário
    return true;
  }
}

