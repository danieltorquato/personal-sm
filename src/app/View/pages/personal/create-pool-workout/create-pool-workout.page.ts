import { Component, OnInit, NgZone, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule, AlertController, ToastController, ItemReorderEventDetail } from '@ionic/angular';
import { Router } from '@angular/router';

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
  imports: [IonicModule, CommonModule, FormsModule]
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

  constructor(
    private router: Router,
    private alertController: AlertController,
    private toastController: ToastController,
    private zone: NgZone,
    private changeDetector: ChangeDetectorRef
  ) {
    // Garantir que os modais comecem fechados
    this.showSetModal = false;
    this.showStudentSelector = false;
  }

  ngOnInit() {
    this.filteredStudents = [...this.allStudents];
    // Forçar detecção de mudanças para garantir estado inicial correto
    this.changeDetector.detectChanges();
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
      intensity: 'A1',
      equipment: []
    };

    // Garantir que o modal abra com a detecção de mudanças
    this.zone.run(() => {
      this.showSetModal = true;
      this.changeDetector.detectChanges();
      console.log('Modal de série aberto:', this.showSetModal);
    });
  }

  editSet(index: number) {
    // Configurar valores para edição
    this.editingSetIndex = index;
    this.currentSet = {...this.workoutTemplate.sets[index]};

    // Garantir que o modal abra com a detecção de mudanças
    this.zone.run(() => {
      this.showSetModal = true;
      this.changeDetector.detectChanges();
      console.log('Modal de edição de série aberto:', this.showSetModal);
    });
  }

  saveSet() {
    // Validar dados básicos
    if (!this.currentSet.exercise || this.currentSet.distance <= 0 || this.currentSet.repetitions <= 0) {
      this.presentAlert(
        'Dados Incompletos',
        'Por favor, selecione um exercício e defina valores válidos para distância e repetições.',
        [{ text: 'OK' }]
      );
      return;
    }

    // Se não foram definidas distâncias parciais e a distância for maior que 25m,
    // criar automaticamente parciais (metade da distância)
    if (!this.currentSet.partialDistances || this.currentSet.partialDistances.length === 0) {
      if (this.currentSet.distance > 25) {
        this.currentSet.partialDistances = [Math.floor(this.currentSet.distance / 2)];
      } else {
        this.currentSet.partialDistances = [];
      }
    }

    // Adicionar ou atualizar a série
    if (this.editingSetIndex === -1) {
      this.workoutTemplate.sets.push({ ...this.currentSet });
    } else {
      this.workoutTemplate.sets[this.editingSetIndex] = { ...this.currentSet };
    }

    // Fechar o modal usando NgZone e forçar detecção de mudanças
    this.zone.run(() => {
      this.showSetModal = false;
      this.changeDetector.detectChanges();

      // Dar feedback de confirmação
      const acao = this.editingSetIndex === -1 ? 'adicionada' : 'atualizada';
      this.presentToast(`Série ${acao} com sucesso!`);
    });
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
    this.filteredStudents = [...this.allStudents];

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
      this.presentToast(
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
    const query = event.detail.value.toLowerCase();

    // Se o campo de busca estiver vazio, mostrar todos os alunos
    if (!query.trim()) {
      this.filteredStudents = [...this.allStudents];
    } else {
      // Filtrar mantendo estado de seleção
      this.filteredStudents = this.allStudents.filter(student => {
        return student.name.toLowerCase().includes(query) ||
               student.category.toLowerCase().includes(query);
      });
    }

    // Garantir que o estado de seleção seja preservado
    this.filteredStudents.forEach(student => {
      student.selected = this.workoutTemplate.students.includes(student.id);
    });
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

  saveWorkoutTemplate() {
    if (!this.isWorkoutValid()) {
      this.presentAlert(
        'Informações Incompletas',
        'Por favor, preencha todos os campos obrigatórios.',
        [{ text: 'OK' }]
      );
      return;
    }

    // Em um caso real, aqui enviaria para um serviço de backend
    console.log('Treino salvo:', this.workoutTemplate);

    // Simular um ID gerado para o treino
    this.workoutTemplate.id = Date.now().toString();

    this.presentAlert(
      'Treino Salvo',
      'O treino foi criado com sucesso e atribuído aos alunos selecionados.',
      [
        {
          text: 'OK',
          handler: () => {
            this.router.navigate(['/personal/dashboard']);
          }
        }
      ]
    );
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

  async presentToast(message: string) {
    const toast = await this.toastController.create({
      message: message,
      duration: 2000,
      position: 'bottom',
      color: 'success',
      cssClass: 'toast-success'
    });
    await toast.present();
  }

  // Função para forçar reinício do modal em caso de problemas
  resetStudentSelectionModal() {
    this.zone.run(() => {
      // Fechar modal
      this.showStudentSelector = false;
      this.changeDetector.detectChanges();

      // Aguardar um pouco e reabrir se necessário
      setTimeout(() => {
        this.presentToast(
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
}
