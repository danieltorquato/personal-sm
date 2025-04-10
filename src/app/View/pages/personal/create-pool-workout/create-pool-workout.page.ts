import { Component, OnInit, NgZone, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule, AlertController, ToastController, ItemReorderEventDetail, ModalController, ToastOptions, LoadingController } from '@ionic/angular';
import { Router, ActivatedRoute } from '@angular/router';
import { HttpClient, HttpHeaders, HttpClientModule } from '@angular/common/http';
import { environment } from 'src/environments/environment';
import { Observable, forkJoin } from 'rxjs';
import { AuthService, User } from 'src/app/services/auth.service';
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
import { PoolWorkoutService } from 'src/app/services/pool-workout.service';
import { StudentService } from 'src/app/services/student.service';

interface Student {
  id: string;
  name: string;
  avatar: string;
  category: string;
  selected: boolean;
}

interface WorkoutSet {
  exercise: string;
  distance: number;
  repetitions: number;
  restTime: number;
  notes: string;
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
  type: string;
}

interface ExerciseInfo {
  value: string;
  name: string;
  image: string;
  description?: string;
  color?: string;
}

interface PoolWorkoutTemplate {
  id?: string;
  name: string;
  description: string;
  level: string;
  estimatedDuration: number;
  personalId: string;
  studentIds: string[];
  sets: WorkoutSet[];
}

@Component({
  selector: 'app-create-pool-workout',
  templateUrl: './create-pool-workout.page.html',
  styleUrls: ['./create-pool-workout.page.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, FormsModule, HttpClientModule]
})
export class CreatePoolWorkoutPage implements OnInit {
  workoutTemplate: PoolWorkoutTemplate = {
    name: '',
    description: '',
    level: 'intermediario',
    estimatedDuration: 45,
    personalId: '',
    studentIds: [],
    sets: []
  };

  studentId: string | null = null;
  workoutType: string = 'natacao';

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

  showSetModal: boolean = false;
  editingSetIndex: number = -1;
  currentSet: WorkoutSet = {
    exercise: 'nado-livre',
    distance: 50,
    repetitions: 2,
    restTime: 30,
    notes: '',
    partialDistances: [25], // Por padrão, metade da distância
    partialInterval: 25, // Por padrão, 25m
    intensity: 'A1', // Intensidade padrão
    equipment: [] // Array vazio de equipamentos
  };

  showStudentSelector: boolean = false;
  allStudents: Student[] = [
    { id: '1', name: 'Ana Silva', avatar: 'assets/avatars/student1.jpg', category: 'Intermediário', selected: false },
    { id: '2', name: 'João Oliveira', avatar: 'assets/avatars/student2.jpg', category: 'Iniciante', selected: false },
    { id: '3', name: 'Carla Mendes', avatar: 'assets/avatars/student3.jpg', category: 'Avançado', selected: false },
    { id: '4', name: 'Rafael Santos', avatar: 'assets/avatars/student4.jpg', category: 'Intermediário', selected: false },
    { id: '5', name: 'Julia Costa', avatar: 'assets/avatars/student5.jpg', category: 'Avançado', selected: false }
  ];
  filteredStudents: Student[] = [];
  selectedStudents: Student[] = [];

  isReorderActive: boolean = false;

  intensityOptions = [
    { value: 'A1', label: 'A1 - Baixa' },
    { value: 'A2', label: 'A2 - Média' },
    { value: 'A3', label: 'A3 - Alta' }
  ];

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

  partialIntervalOptions = [
    { value: 25, label: 'A cada 25m' },
    { value: 50, label: 'A cada 50m' },
    { value: 100, label: 'A cada 100m' }
  ];

  isLoading: boolean = false;
  errorMessage: string = '';

  students: Student[] = [];

  currentView = 'sets'; // 'sets' ou 'students'
  isSaving = false;
  saveSuccess = false;
  saveError = false;
  isLoadingStudents = false;

  constructor(
    public router: Router,
    private route: ActivatedRoute,
    private alertController: AlertController,
    private toastController: ToastController,
    private zone: NgZone,
    private changeDetector: ChangeDetectorRef,
    private http: HttpClient,
    private authService: AuthService,
    private workoutService: WorkoutService,
    private apiService: ApiService,
    private modalController: ModalController,
    private loadingController: LoadingController,
    private poolWorkoutService: PoolWorkoutService,
    private studentService: StudentService
  ) {
    this.showSetModal = false;
    this.showStudentSelector = false;

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
    const workoutId = this.route.snapshot.paramMap.get('id');
    this.studentId = this.route.snapshot.paramMap.get('studentId');

    this.authService.getCurrentUser().subscribe(user => {
      if (user) {
        this.workoutTemplate.personalId = user.id;

        if (workoutId) {
          this.loadWorkout(workoutId);
        }

        if (this.studentId) {
          this.loadStudentById(this.studentId);
        } else {
          this.loadStudents();
        }
      }
    });
  }

  loadWorkout(workoutId: string) {
    this.isLoading = true;
    this.errorMessage = '';

    this.poolWorkoutService.getPoolWorkoutById(workoutId).subscribe({
      next: (workout) => {
        this.workoutTemplate = workout;

        if (workout.studentIds && workout.studentIds.length > 0) {
          this.loadSelectedStudents(workout.studentIds);
        }

        this.isLoading = false;
      },
      error: (error) => {
        console.error('Erro ao carregar treino:', error);
        this.errorMessage = 'Erro ao carregar treino. Tente novamente.';
        this.isLoading = false;
      }
    });
  }

  loadStudents() {
    this.isLoadingStudents = true;

    this.studentService.getStudentsByPersonalId(this.workoutTemplate.personalId).subscribe({
      next: (students) => {
        this.students = students.map(student => ({
          id: student.id,
          name: student.name,
          avatar: student.avatar || 'assets/avatars/default.jpg',
          category: student.category || 'Sem categoria',
          selected: false
        }));

        this.filteredStudents = [...this.students];
        this.isLoadingStudents = false;
      },
      error: (error) => {
        console.error('Erro ao carregar alunos:', error);
        this.isLoadingStudents = false;
      }
    });
  }

  loadStudentById(studentId: string) {
    this.isLoadingStudents = true;

    this.studentService.getStudentById(studentId).subscribe({
      next: (student) => {
        if (student) {
          const formattedStudent = {
            id: student.id,
            name: student.name,
            avatar: student.avatar || 'assets/avatars/default.jpg',
            category: student.category || 'Sem categoria',
            selected: true
          };

          this.students = [formattedStudent];
          this.selectedStudents = [formattedStudent];
          this.workoutTemplate.studentIds = [student.id];
        }

        this.isLoadingStudents = false;
      },
      error: (error) => {
        console.error('Erro ao carregar aluno:', error);
        this.isLoadingStudents = false;
      }
    });
  }

  loadSelectedStudents(studentIds: string[]) {
    const requests = studentIds.map(id => this.studentService.getStudentById(id));

    forkJoin(requests).subscribe({
      next: (students) => {
        this.selectedStudents = students.filter(student => student !== null).map((student) => {
          return {
            id: student!.id,
            name: student!.name,
            avatar: student!.avatar || 'assets/avatars/default.jpg',
            category: student!.category || 'Sem categoria',
            selected: true
          };
        });

        // Marca os alunos como selecionados na lista completa de alunos
        this.students.forEach(student => {
          student.selected = studentIds.includes(student.id);
        });
      },
      error: (error) => {
        console.error('Erro ao carregar alunos selecionados:', error);
      }
    });
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

  updateSelectedStudents() {
    this.selectedStudents = this.students.filter(student => student.selected);
    this.workoutTemplate.studentIds = this.selectedStudents.map(student => student.id);
  }

  addExercise() {
    this.workoutTemplate.sets.push({
      exercise: '',
      distance: 50,
      repetitions: 2,
      restTime: 30,
      notes: ''
    });
  }

  removeExercise(index: number) {
    this.workoutTemplate.sets.splice(index, 1);
  }

  handleReorder(event: any) {
    const itemMove = this.workoutTemplate.sets.splice(event.detail.from, 1)[0];
    this.workoutTemplate.sets.splice(event.detail.to, 0, itemMove);
    event.detail.complete();
  }

  calculateTotalTime(): number {
    // Cálculo aproximado do tempo total baseado na distância, repetições e descanso
    let totalTimeInSeconds = 0;

    for (const exercise of this.workoutTemplate.sets) {
      // Tempo estimado para nadar (considerando velocidade média de 2m/s)
      const swimTimePerRep = exercise.distance / 2;

      // Tempo total = (tempo de nado + tempo de descanso) * repetições
      totalTimeInSeconds += (swimTimePerRep + exercise.restTime) * exercise.repetitions;
    }

    // Converter para minutos e arredondar
    return Math.ceil(totalTimeInSeconds / 60);
  }

  saveWorkout() {
    this.isSaving = true;
    this.saveSuccess = false;
    this.saveError = false;

    // Garantir que os IDs dos alunos selecionados estejam no template
    this.workoutTemplate.studentIds = this.selectedStudents.map(s => s.id);

    // Verificar se é uma atualização ou nova criação
    if (this.workoutTemplate.id) {
      this.poolWorkoutService.updatePoolWorkout(this.workoutTemplate).subscribe({
        next: () => {
          this.isSaving = false;
          this.saveSuccess = true;
          this.showToast('Treino atualizado com sucesso!');
          setTimeout(() => {
            this.router.navigate(['/lista-treinos']);
          }, 1500);
        },
        error: (error) => {
          console.error('Erro ao atualizar treino:', error);
          this.isSaving = false;
          this.saveError = true;
          this.showToast('Erro ao atualizar treino. Tente novamente.');
        }
      });
    } else {
      this.poolWorkoutService.createPoolWorkout(this.workoutTemplate).subscribe({
        next: (response) => {
          this.workoutTemplate.id = response.id;
          this.isSaving = false;
          this.saveSuccess = true;
          this.showToast('Treino criado com sucesso!');
          setTimeout(() => {
            this.router.navigate(['/lista-treinos']);
          }, 1500);
        },
        error: (error) => {
          console.error('Erro ao criar treino:', error);
          this.isSaving = false;
          this.saveError = true;
          this.showToast('Erro ao criar treino. Tente novamente.');
        }
      });
    }
  }

  validateWorkout(): boolean {
    if (!this.workoutTemplate.name) {
      this.showToast('Por favor, informe o nome do treino');
      return false;
    }

    if (this.workoutTemplate.studentIds.length === 0) {
      this.showToast('Por favor, selecione pelo menos um aluno');
      return false;
    }

    if (this.workoutTemplate.sets.length === 0) {
      this.showToast('Por favor, adicione pelo menos um exercício');
      return false;
    }

    // Verificar se todos os exercícios têm um tipo selecionado
    const invalidExerciseIndex = this.workoutTemplate.sets.findIndex(ex => !ex.exercise);
    if (invalidExerciseIndex >= 0) {
      this.showToast(`Por favor, selecione o tipo do exercício ${invalidExerciseIndex + 1}`);
      return false;
    }

    return true;
  }

  async showToast(message: string) {
    const toast = await this.toastController.create({
      message,
      duration: 2000,
      position: 'bottom'
    });
    await toast.present();
  }

  // --- Métodos para gerenciar séries ---
  addNewSet() {
    this.currentSet = {
      exercise: 'nado-livre',
      distance: 50,
      repetitions: 2,
      restTime: 30,
      notes: '',
      partialDistances: [25],
      partialInterval: 25,
      intensity: 'A1',
      equipment: []
    };
    this.showSetModal = true;
    this.editingSetIndex = -1;
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
      student.selected = this.workoutTemplate.studentIds.includes(student.id);
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
      this.workoutTemplate.studentIds = this.filteredStudents
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
    console.log('- IDs de alunos no template:', this.workoutTemplate.studentIds);
    console.log('- Alunos selecionados:', this.selectedStudents.map(s => s.name));
    console.log('- Modal visível:', this.showStudentSelector);
  }

  getSelectedStudentsCount(): number {
    return this.filteredStudents.filter(student => student.selected).length;
  }

  removeStudent(id: string) {
    this.workoutTemplate.studentIds = this.workoutTemplate.studentIds.filter(studentId => studentId !== id);
    this.selectedStudents = this.selectedStudents.filter(student => student.id !== id);
  }

  // --- Validação e salvamento ---
  isWorkoutValid(): boolean {
    return (
      this.workoutTemplate.name.trim() !== '' &&
      this.workoutTemplate.studentIds.length > 0 &&
      this.workoutTemplate.sets.length > 0
    );
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
}
