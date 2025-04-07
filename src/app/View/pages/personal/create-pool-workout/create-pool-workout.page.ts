import { Component, OnInit, NgZone, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule, AlertController, ToastController, ItemReorderEventDetail, ModalController, ToastOptions } from '@ionic/angular';
import { Router } from '@angular/router';
import { HttpClient, HttpHeaders, HttpClientModule } from '@angular/common/http';
import { environment } from 'src/environments/environment';
import { Observable, forkJoin } from 'rxjs';
import { AuthService } from 'src/app/services/auth.service';
import { WorkoutService } from 'src/app/services/workout.service';
import { ApiService } from 'src/app/services/api.service';
import { addIcons } from 'ionicons';
import {
  timerOutline,
  fitnessOutline,
  timeOutline,
  flameOutline,
  barbellOutline,
  repeatOutline,
  checkmarkCircle,
  ellipseOutline,
  informationCircleOutline,
  add,
  removeOutline,
  pencilOutline,
  trashOutline
} from 'ionicons/icons';

interface Student {
  id: string;
  name: string;
  avatar: string;
  category: string;
  selected?: boolean;
}

interface WorkoutSet {
  exercise: string;
  distance: number;
  repetitions: number;
  restTime: number;
  notes?: string;
  partialDistances?: number[]; // Distâncias parciais pré-definidas pelo professor
  partialInterval?: number; // Intervalo para marcação automática de parciais (25m, 50m, etc.)
  variation?: string; // Variação do exercício
  equipment?: string[]; // Equipamentos necessários (array de strings)
  intensity?: string; // Intensidade do exercício (A1, A2, A3)
}

interface WorkoutTemplate {
  id?: string;
  name: string;
  description: string;
  level: string;
  estimatedDuration: number;
  intensity?: string;
  students: string[];
  sets: WorkoutSet[];
}

interface ExerciseInfo {
  value: string;
  name: string;
  image: string;
  description?: string;
  color?: string;
}

@Component({
  selector: 'app-create-pool-workout',
  templateUrl: './create-pool-workout.page.html',
  styleUrls: ['./create-pool-workout.page.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, FormsModule, HttpClientModule]
})
export class CreatePoolWorkoutPage implements OnInit {
  // Estado do formulário
  workoutTemplate: WorkoutTemplate = {
    name: '',
    description: '',
    level: 'intermediario',
    estimatedDuration: 45,
    students: [],
    sets: []
  };

  // Biblioteca de exercícios de natação
  exerciseLibrary: ExerciseInfo[] = [
    {
      value: 'nado-livre',
      name: 'Nado Livre',
      image: 'assets/exercises/freestyle.jpg',
      description: 'Estilo mais rápido e eficiente, utilizado em longas distâncias',
      color: '#3880ff'
    },
    {
      value: 'nado-costas',
      name: 'Nado Costas',
      image: 'assets/exercises/backstroke.jpg',
      description: 'Excelente para fortalecimento da região lombar e ombros',
      color: '#5260ff'
    },
    {
      value: 'nado-peito',
      name: 'Nado Peito',
      image: 'assets/exercises/breaststroke.jpg',
      description: 'Fortalece principalmente peitoral e pernas',
      color: '#2dd36f'
    },
    {
      value: 'borboleta',
      name: 'Borboleta',
      image: 'assets/exercises/butterfly.jpg',
      description: 'Estilo mais desafiador que trabalha todo o corpo',
      color: '#eb445a'
    },
    {
      value: 'batida-pernas',
      name: 'Batida de Pernas',
      image: 'assets/exercises/kickboard.jpg',
      description: 'Exercício com prancha focado no fortalecimento das pernas',
      color: '#ffc409'
    },
    {
      value: 'pullbuoy',
      name: 'Braçada com Pullbuoy',
      image: 'assets/exercises/pullbuoy.jpg',
      description: 'Exercício com flutuador entre as pernas para focar na braçada',
      color: '#3dc2ff'
    },
    {
      value: 'medley',
      name: 'Medley',
      image: 'assets/exercises/medley.jpg',
      description: 'Combinação de todos os quatro estilos na mesma série',
      color: '#92949c'
    }
  ];

  // Modal de edição de série
  showSetModal: boolean = false;
  editingSetIndex: number = -1;
  currentSet: WorkoutSet = {
    exercise: 'nado-livre',
    distance: 50,
    repetitions: 2,
    restTime: 30,
    partialDistances: [25], // Por padrão, metade da distância
    partialInterval: 25, // Por padrão, 25m
    intensity: 'A1', // Intensidade padrão
    equipment: [] // Array vazio de equipamentos
  };

  // Modal de seleção de alunos
  showStudentSelector: boolean = false;
  allStudents: Student[] = [
    { id: '1', name: 'Ana Silva', avatar: 'assets/avatars/student1.jpg', category: 'Intermediário' },
    { id: '2', name: 'João Oliveira', avatar: 'assets/avatars/student2.jpg', category: 'Iniciante' },
    { id: '3', name: 'Carla Mendes', avatar: 'assets/avatars/student3.jpg', category: 'Avançado' },
    { id: '4', name: 'Rafael Santos', avatar: 'assets/avatars/student4.jpg', category: 'Intermediário' },
    { id: '5', name: 'Julia Costa', avatar: 'assets/avatars/student5.jpg', category: 'Avançado' }
  ];
  filteredStudents: Student[] = [];
  selectedStudents: Student[] = [];

  // Reordenação
  isReorderActive: boolean = false;

  // Opções de intensidade
  intensityOptions = [
    { value: 'A1', label: 'A1 - Baixa' },
    { value: 'A2', label: 'A2 - Média' },
    { value: 'A3', label: 'A3 - Alta' }
  ];

  // Equipamentos de natação
  equipmentOptions = [
    { value: 'prancha', label: 'Prancha' },
    { value: 'pullbuoy', label: 'Pullbuoy' },
    { value: 'nadadeiras', label: 'Nadadeiras' },
    { value: 'palmar', label: 'Palmar' },
    { value: 'snorkel', label: 'Snorkel' },
    { value: 'tubo', label: 'Tubo Flutuador' },
    { value: 'elastico', label: 'Elástico' },
    { value: 'caneleira', label: 'Caneleira' },
    { value: 'paraquedas', label: 'Paraquedas de Resistência' },
    { value: 'oculos', label: 'Óculos de Natação' }
  ];

  // Intervalos de marcação padrão
  partialIntervalOptions = [
    { value: 25, label: 'A cada 25m' },
    { value: 50, label: 'A cada 50m' },
    { value: 100, label: 'A cada 100m' }
  ];

  // Estado de carregamento
  isLoading: boolean = false;
  errorMessage: string = '';

  // Lista de alunos disponíveis
  students: Student[] = [];

  // Estado da UI
  currentView = 'sets'; // 'sets' ou 'students'
  isSaving = false;
  saveSuccess = false;
  saveError = false;
  isLoadingStudents = false;

  constructor(
    public router: Router,
    private alertController: AlertController,
    private toastController: ToastController,
    private zone: NgZone,
    private changeDetector: ChangeDetectorRef,
    private http: HttpClient,
    private authService: AuthService,
    private workoutService: WorkoutService,
    private apiService: ApiService,
    private modalController: ModalController
  ) {
    // Garantir que os modais comecem fechados
    this.showSetModal = false;
    this.showStudentSelector = false;

    // Adicionando ícones
    addIcons({
      timerOutline,
      fitnessOutline,
      timeOutline,
      flameOutline,
      barbellOutline,
      repeatOutline,
      checkmarkCircle,
      ellipseOutline,
      informationCircleOutline,
      add,
      removeOutline,
      pencilOutline,
      trashOutline
    });
  }

  ngOnInit() {
    this.filteredStudents = [...this.allStudents];
    // Carregar alunos do servidor se disponível
    this.loadStudents();
    // Forçar detecção de mudanças para garantir estado inicial correto
    this.changeDetector.detectChanges();
  }

  // Carregar lista de alunos do servidor
  loadStudents() {
    this.isLoadingStudents = true;
    this.isLoading = true;

    // Verificar autenticação antes de fazer a chamada
    if (!this.authService.isLoggedIn()) {
      this.showToast('Você precisa estar logado para ver seus alunos.', 'danger');
      this.isLoadingStudents = false;
      this.isLoading = false;
      return;
    }

    // Usar o ApiService diretamente até implementarmos o método correto no WorkoutService
    this.apiService.get<any>('users/students').subscribe({
      next: (response: any) => {
        if (response && response.success && response.data) {
          // Substituir dados de exemplo por dados reais
          this.students = response.data.map((student: any) => ({
            id: student.id.toString(),
            name: student.name,
            avatar: student.photo || 'assets/icon/avatar.svg',
            category: student.level || 'Intermediário',
            selected: false
          }));

          this.allStudents = [...this.students];
          this.filteredStudents = [...this.students];
        }
        this.isLoading = false;
        this.isLoadingStudents = false;
      },
      // error: (error: any) => {
      //   console.error('Erro ao carregar alunos:', error);

      //   // Verificar se é erro de autenticação
      //   if (error.status === 401 || error?.error?.message?.includes('Token')) {
      //     this.showToast('Sessão expirada. Por favor, faça login novamente.', 'danger');
      //     this.authService.logout();
      //     this.router.navigate(['/login']);
      //   } else {
      //     this.showToast('Erro ao carregar alunos. Tente novamente mais tarde.', 'danger');
      //   }

      //   this.isLoading = false;
      //   this.isLoadingStudents = false;
      // }
    });
  }

  // --- Métodos para gerenciar séries ---
  addNewSet() {
    // Configurar valores iniciais
    this.editingSetIndex = -1;
    this.currentSet = {
      exercise: '',
      distance: 50,
      repetitions: 2,
      restTime: 30,
      partialDistances: [25], // Por padrão, metade da distância
      partialInterval: 25, // Por padrão, 25m
      intensity: 'A1',
      equipment: []
    };

    // Garantir que o modal abra com a detecção de mudanças
    this.zone.run(() => {
      this.showSetModal = true;
      this.changeDetector.detectChanges();
    });
  }

  editSet(index: number) {
    if (index >= 0 && index < this.workoutTemplate.sets.length) {
      this.editingSetIndex = index;

      // Fazer cópia profunda do objeto
      this.currentSet = JSON.parse(JSON.stringify(this.workoutTemplate.sets[index]));

      // Garantir que partialInterval esteja definido
      if (!this.currentSet.partialInterval) {
        this.currentSet.partialInterval = 25; // Valor padrão
      }

      // Garantir que partialDistances esteja definido
      if (!this.currentSet.partialDistances) {
        this.currentSet.partialDistances = [];
      }

      // Abrir o modal
      this.zone.run(() => {
        this.showSetModal = true;
        this.changeDetector.detectChanges();
      });
    }
  }

  saveSet() {
    // Validações básicas
    if (!this.currentSet.exercise) {
      this.presentAlert('Erro', 'Selecione um exercício', [{ text: 'OK' }]);
      return;
    }

    if (this.currentSet.distance <= 0) {
      this.presentAlert('Erro', 'A distância deve ser maior que zero', [{ text: 'OK' }]);
      return;
    }

    if (this.currentSet.repetitions <= 0) {
      this.presentAlert('Erro', 'O número de repetições deve ser maior que zero', [{ text: 'OK' }]);
      return;
    }

    if (this.currentSet.restTime < 0) {
      this.presentAlert('Erro', 'O tempo de descanso não pode ser negativo', [{ text: 'OK' }]);
      return;
    }

    // Garantir que partialInterval esteja definido
    if (!this.currentSet.partialInterval || this.currentSet.partialInterval <= 0) {
      this.currentSet.partialInterval = 25; // Valor padrão
    }

    // Se estiver editando, atualiza a série existente
    if (this.editingSetIndex >= 0) {
      this.workoutTemplate.sets[this.editingSetIndex] = { ...this.currentSet };
    } else {
      // Senão, adiciona uma nova série
      this.workoutTemplate.sets.push({ ...this.currentSet });
    }

    // Fechar o modal
    this.showSetModal = false;

    // Força a detecção de mudanças
    this.changeDetector.detectChanges();

    // Dar feedback de confirmação
    const acao = this.editingSetIndex === -1 ? 'adicionada' : 'atualizada';
    this.showToast(`Série ${acao} com sucesso!`);
  }

  cancelSetEdit() {
    this.zone.run(() => {
      this.showSetModal = false;
      this.changeDetector.detectChanges();
    });
  }

  removeSet(index: number) {
    this.presentAlert(
      'Remover Série',
      'Tem certeza que deseja remover esta série?',
      [
        {
          text: 'Cancelar',
          role: 'cancel'
        },
        {
          text: 'Remover',
          handler: () => {
            this.workoutTemplate.sets.splice(index, 1);
          }
        }
      ]
    );
  }

  // --- Métodos para seleção de alunos ---
  openStudentSelection() {
    // Resetar filtro e garantir que todos os alunos estejam visíveis
    this.filteredStudents = [...this.students];

    // Atualizar o estado de seleção baseado nos alunos já selecionados
    this.filteredStudents.forEach(student => {
      student.selected = this.workoutTemplate.students.includes(student.id);
    });

    this.showStudentSelector = true;
    this.changeDetector.detectChanges();
  }

  closeStudentSelection() {
    this.showStudentSelector = false;
    this.changeDetector.detectChanges();
  }

  confirmStudentSelection() {
    console.log('confirmStudentSelection chamado, modal visível:', this.showStudentSelector);

    // Usar NgZone para garantir que as mudanças são detectadas pelo Angular
    this.zone.run(() => {
      // Atualizar IDs dos alunos selecionados
      this.workoutTemplate.students = this.filteredStudents
        .filter(student => student.selected)
        .map(student => student.id);

      // Atualizar a lista de alunos selecionados
      this.selectedStudents = this.filteredStudents
        .filter(student => student.selected)
        .map(student => ({...student}));

      console.log('Alunos selecionados:', this.selectedStudents.length);

      // Fechar o modal e forçar detecção de mudanças
      this.showStudentSelector = false;
      this.changeDetector.detectChanges();

      console.log('Modal fechado:', !this.showStudentSelector);

      // Adicionar feedback visual de sucesso usando toast
      const count = this.selectedStudents.length;
      this.showToast(
        `${count} ${count === 1 ? 'aluno selecionado' : 'alunos selecionados'} com sucesso.`
      );

      // Verificar se todos os alunos selecionados foram corretamente adicionados
      this.debugSelectedStudents();
    });
  }

  // Método para depuração
  debugSelectedStudents() {
    console.log('Estado atual:');
    console.log('- IDs de alunos no template:', this.workoutTemplate.students);
    console.log('- Alunos selecionados:', this.selectedStudents.map(s => s.name));
    console.log('- Modal visível:', this.showStudentSelector);
  }

  filterStudents(event: any) {
    const query = event.target.value.toLowerCase();

    // Se o campo de busca estiver vazio, mostrar todos os alunos
    if (!query.trim()) {
      this.filteredStudents = [...this.students];
    } else {
      // Filtrar mantendo estado de seleção
      this.filteredStudents = this.students.filter(student => {
        return student.name.toLowerCase().includes(query) ||
               (student.category && student.category.toLowerCase().includes(query));
      });
    }
  }

  getSelectedStudentsCount(): number {
    return this.filteredStudents.filter(student => student.selected).length;
  }

  removeStudent(id: string) {
    this.workoutTemplate.students = this.workoutTemplate.students.filter(studentId => studentId !== id);
    this.selectedStudents = this.selectedStudents.filter(student => student.id !== id);
  }

  // --- Validação e salvamento ---
  isWorkoutValid(): boolean {
    return (
      this.workoutTemplate.name.trim() !== '' &&
      this.workoutTemplate.students.length > 0 &&
      this.workoutTemplate.sets.length > 0
    );
  }

  async saveWorkoutTemplate() {
    // Verificar se o treino tem pelo menos um exercício
    if (this.workoutTemplate.sets.length === 0) {
      this.showToast('Adicione pelo menos um exercício ao treino.', 'warning');
      return;
    }

    // Verificar se o nome do treino foi preenchido
    if (!this.workoutTemplate.name.trim()) {
      this.showToast('Por favor, dê um nome ao seu treino.', 'warning');
      return;
    }

    // Verificar autenticação
    if (!this.authService.isLoggedIn()) {
      this.showToast('Você precisa estar logado para salvar treinos.', 'danger');
      this.router.navigate(['/login']);
      return;
    }

    // Indicar que está salvando
    this.isSaving = true;
    this.saveSuccess = false;
    this.saveError = false;

    // Obter o ID do trainer do usuário logado
    const userProfile = await this.authService.getCurrentUser().toPromise();
    const trainerId = userProfile?.id || undefined;

    // Preparar dados para envio
    const workoutData = {
      name: this.workoutTemplate.name,
      description: this.workoutTemplate.description,
      level: this.workoutTemplate.level,
      intensity: this.workoutTemplate.intensity,
      estimated_duration: this.calculateTotalTime(),
      total_distance: this.calculateTotalDistance(),
      trainer_id: trainerId,
      sets: this.workoutTemplate.sets.map((set, index) => ({
        exercise_name: set.exercise,
        distance: set.distance,
        repetitions: set.repetitions,
        rest_time: set.restTime,
        notes: set.notes || '',
        variation: set.variation || '',
        equipment: set.equipment || [],
        intensity: set.intensity || 'medium',
        partial_interval: set.partialInterval || 0,
        order: index + 1,
        exercise_id: 0,
        exercise_type: 'swim' as 'swim' | 'run' | 'bike' | 'other'
      }))
    };

    // Enviar para a API
    this.workoutService.createWorkout(workoutData).subscribe({
      next: (response: any) => {
        console.log('Treino salvo com sucesso:', response);

        if (response && response.success && response.data && response.data.id) {
          this.saveSuccess = true;

          // Se há alunos selecionados, atribuir o treino a eles
          const selectedStudents = this.allStudents.filter(s => s.selected);
          if (selectedStudents.length > 0) {
            this.assignWorkoutToStudents(response.data.id, selectedStudents);
          } else {
            this.showToast('Treino criado com sucesso!', 'success');
            this.isSaving = false;
            this.router.navigate(['/personal/workouts']);
          }
        } else {
          this.saveError = true;
          this.showToast('Erro ao salvar o treino. Tente novamente.', 'danger');
          this.isSaving = false;
        }
      },
      error: (error: any) => {
        console.error('Erro ao salvar treino:', error);
        this.saveError = true;

        // Verificar se é erro de autenticação
        if (error.status === 401 || error?.error?.message?.includes('Token')) {
          this.showToast('Sessão expirada. Por favor, faça login novamente.', 'danger');
          this.authService.logout();
          this.router.navigate(['/login']);
        } else {
          this.showToast('Erro ao salvar o treino. Verifique sua conexão e tente novamente.', 'danger');
        }

        this.isSaving = false;
      }
    });
  }

  // Atribuir treino aos alunos selecionados
  assignWorkoutToStudents(workoutId: number, students: Student[]) {
    const assignRequests: Observable<any>[] = [];

    // Criar um array de observables para cada estudante
    students.forEach(student => {
      assignRequests.push(this.workoutService.assignWorkout(workoutId, parseInt(student.id)));
    });

    // Executar todas as requisições em paralelo
    forkJoin(assignRequests).subscribe({
      next: () => {
        this.showToast(`Treino criado e atribuído a ${students.length} aluno(s)!`, 'success');
        this.isSaving = false;
        this.router.navigate(['/personal/workouts']);
      },
      error: (error: any) => {
        console.error('Erro ao atribuir treino:', error);
        this.showToast('Treino criado, mas não foi possível atribuí-lo a todos os alunos.', 'warning');
        this.isSaving = false;
        this.router.navigate(['/personal/workouts']);
      }
    });
  }

  // --- Utilitários ---
  formatTime(seconds: number): string {
    if (seconds < 60) return `${seconds}s`;
    return `${Math.floor(seconds / 60)}:${(seconds % 60).toString().padStart(2, '0')} min`;
  }

  async presentAlert(header: string, message: string, buttons: any[]) {
    const alert = await this.alertController.create({
      header,
      message,
      buttons
    });
    await alert.present();
  }

  // --- Métodos para gerenciar distâncias parciais ---
  hasPartialDistance(distance: number): boolean {
    if (!this.currentSet.partialDistances) {
      return false;
    }
    return this.currentSet.partialDistances.includes(distance);
  }

  togglePartialDistance(distance: number, event: any): void {
    if (!this.currentSet.partialDistances) {
      this.currentSet.partialDistances = [];
    }

    if (event.detail.checked) {
      // Adicionar distância se não existir
      if (!this.hasPartialDistance(distance)) {
        this.currentSet.partialDistances.push(distance);
        // Ordenar após adicionar
        this.currentSet.partialDistances.sort((a, b) => a - b);
      }
    } else {
      // Remover distância
      const index = this.currentSet.partialDistances.indexOf(distance);
      if (index !== -1) {
        this.currentSet.partialDistances.splice(index, 1);
      }
    }
  }

  hasPartialDistancesMultiple(interval: number): boolean {
    if (!this.currentSet.partialDistances || this.currentSet.partialDistances.length === 0) {
      return false;
    }

    const expectedDistances = this.getMultipleDistances(interval);
    return expectedDistances.every(dist =>
      this.currentSet.partialDistances!.includes(dist)
    );
  }

  setPartialDistancesMultiple(interval: number, event: any): void {
    if (!this.currentSet.partialDistances) {
      this.currentSet.partialDistances = [];
    }

    const distances = this.getMultipleDistances(interval);

    if (event.detail.checked) {
      // Adicionar todas as distâncias múltiplas
      distances.forEach(dist => {
        if (!this.hasPartialDistance(dist)) {
          this.currentSet.partialDistances!.push(dist);
        }
      });
    } else {
      // Remover todas as distâncias múltiplas
      this.currentSet.partialDistances = this.currentSet.partialDistances.filter(
        dist => !distances.includes(dist)
      );
    }

    // Ordenar após modificar
    if (this.currentSet.partialDistances) {
      this.currentSet.partialDistances.sort((a, b) => a - b);
    }
  }

  getMultipleDistances(interval: number): number[] {
    const distances: number[] = [];
    for (let i = interval; i < this.currentSet.distance; i += interval) {
      distances.push(i);
    }
    return distances;
  }

  getCurrentPartialDistances(): number[] {
    return this.currentSet.partialDistances ?
      [...this.currentSet.partialDistances].sort((a, b) => a - b) :
      [];
  }

  removePartialDistance(index: number): void {
    if (this.currentSet.partialDistances && index >= 0 && index < this.currentSet.partialDistances.length) {
      this.currentSet.partialDistances.splice(index, 1);
    }
  }

  addCustomPartialDistance(distanceStr: string): void {
    if (!distanceStr) return;

    const distance = parseInt(distanceStr, 10);
    if (isNaN(distance) || distance <= 0 || distance >= this.currentSet.distance) {
      // Mostrar erro
      this.presentAlert(
        'Distância Inválida',
        'A distância parcial deve ser maior que zero e menor que a distância total do exercício.',
        [{ text: 'OK' }]
      );
      return;
    }

    if (!this.currentSet.partialDistances) {
      this.currentSet.partialDistances = [];
    }

    if (!this.hasPartialDistance(distance)) {
      this.currentSet.partialDistances.push(distance);
      this.currentSet.partialDistances.sort((a, b) => a - b);
    }
  }

  // Função para forçar reinício do modal em caso de problemas
  resetStudentSelectionModal() {
    this.zone.run(() => {
      // Fechar modal
      this.showStudentSelector = false;
      this.changeDetector.detectChanges();

      // Aguardar um pouco e reabrir se necessário
      setTimeout(() => {
        this.showToast(
          "Modal de seleção reiniciado. Tente selecionar os alunos novamente."
        );
      }, 500);
    });
  }

  // Toggle a seleção do aluno quando clicar no item inteiro
  toggleStudentSelection(student: Student) {
    student.selected = !student.selected;
    this.changeDetector.detectChanges();
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

  getExerciseDisplayName(exerciseValue: string): string {
    const exercise = this.exerciseLibrary.find(e => e.value === exerciseValue);
    return exercise ? exercise.name : exerciseValue;
  }

  getExerciseImage(exerciseValue: string): string {
    const exercise = this.exerciseLibrary.find(e => e.value === exerciseValue);
    return exercise ? exercise.image : 'assets/exercises/default.jpg';
  }

  getExerciseStyleClass(exerciseValue: string): string {
    const exercise = this.exerciseLibrary.find(e => e.value === exerciseValue);
    return exercise ? exercise.value : '';
  }

  // --- Métodos para estatísticas do treino ---
  calculateTotalDistance(): number {
    return this.workoutTemplate.sets.reduce((total, set) => {
      return total + (set.distance * set.repetitions);
    }, 0);
  }

  calculateTotalSets(): number {
    return this.workoutTemplate.sets.reduce((total, set) => {
      return total + set.repetitions;
    }, 0);
  }

  getIntensityLabel(intensityValue: string): string {
    const intensity = this.intensityOptions.find(i => i.value === intensityValue);
    return intensity ? intensity.label : intensityValue;
  }

  // --- Métodos para reordenação ---
  toggleReorder() {
    this.isReorderActive = !this.isReorderActive;
  }

  reorderSets(event: any) {
    const itemToMove = this.workoutTemplate.sets.splice(event.detail.from, 1)[0];
    this.workoutTemplate.sets.splice(event.detail.to, 0, itemToMove);
    event.detail.complete();
  }

  // Método para atualizar automaticamente as distâncias parciais com base no intervalo
  updatePartialDistancesFromInterval(): void {
    if (!this.currentSet.partialInterval || this.currentSet.partialInterval <= 0) {
      return;
    }

    const interval = this.currentSet.partialInterval;
    const distances = this.getMultipleDistances(interval);

    if (!this.currentSet.partialDistances) {
      this.currentSet.partialDistances = [];
    }

    // Substituir as distâncias parciais pelas geradas pelo intervalo
    this.currentSet.partialDistances = [...distances];

    // Ordenar após adicionar
    this.currentSet.partialDistances.sort((a, b) => a - b);
  }

  // Método chamado quando a distância do exercício é alterada
  onDistanceChange(): void {
    // Atualizar as distâncias parciais com base no intervalo
    this.updatePartialDistancesFromInterval();
  }

  // Método para definir o intervalo de marcação
  setPartialInterval(interval: number): void {
    this.currentSet.partialInterval = interval;
    this.updatePartialDistancesFromInterval();
  }

  // Método para obter o rótulo do intervalo atual
  getPartialIntervalLabel(): string {
    if (!this.currentSet.partialInterval) {
      return 'Não definido';
    }

    const option = this.partialIntervalOptions.find(opt => opt.value === this.currentSet.partialInterval);
    return option ? option.label : `A cada ${this.currentSet.partialInterval}m`;
  }

  async showToast(message: string, color: string = 'primary') {
    const toast = await this.toastController.create({
      message: message,
      duration: 3000,
      position: 'bottom',
      color: color
    } as ToastOptions);
    await toast.present();
  }

  // Calcular a duração total do treino (em minutos)
  calculateTotalTime(): number {
    let totalSeconds = 0;

    // Somar o tempo de todos os exercícios (incluindo repetições e descanso)
    this.workoutTemplate.sets.forEach(set => {
      // Tempo estimado por repetição (assumindo velocidade média de 2m/s)
      const secondsPerRep = (set.distance / 2);

      // Tempo total do exercício = (tempo por repetição * número de repetições) + (tempo de descanso * (repetições - 1))
      const totalExerciseSeconds = (secondsPerRep * set.repetitions) + (set.restTime * (set.repetitions - 1));

      totalSeconds += totalExerciseSeconds;
    });

    // Converter para minutos e arredondar para cima
    return Math.ceil(totalSeconds / 60);
  }
}
