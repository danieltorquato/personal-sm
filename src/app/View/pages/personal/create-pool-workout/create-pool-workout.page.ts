import { Component, OnInit } from '@angular/core';
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
    partialDistances: [25] // Por padrão, metade da distância
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

  constructor(
    private router: Router,
    private alertController: AlertController
  ) {}

  ngOnInit() {
    this.filteredStudents = [...this.allStudents];
  }

  // --- Métodos para gerenciar séries ---
  addNewSet() {
    this.editingSetIndex = -1;
    this.currentSet = {
      exercise: 'nado-livre',
      distance: 50,
      repetitions: 2,
      restTime: 30,
      partialDistances: [25] // Por padrão, metade da distância
    };
    this.showSetModal = true;
  }

  editSet(index: number) {
    this.editingSetIndex = index;
    this.currentSet = {...this.workoutTemplate.sets[index]};
    this.showSetModal = true;
  }

  saveSet() {
    // Validar dados básicos
    if (this.currentSet.distance <= 0 || this.currentSet.repetitions <= 0) {
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

    // Fechar o modal
    this.showSetModal = false;
  }

  cancelSetEdit() {
    this.showSetModal = false;
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

  // --- Métodos para seleção de exercícios ---
  selectExercise(exerciseValue: string) {
    this.currentSet.exercise = exerciseValue;
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

  // --- Métodos para reordenação ---
  toggleReorder() {
    this.isReorderActive = !this.isReorderActive;
  }

  reorderSets(event: any) {
    const itemToMove = this.workoutTemplate.sets.splice(event.detail.from, 1)[0];
    this.workoutTemplate.sets.splice(event.detail.to, 0, itemToMove);
    event.detail.complete();
  }

  // --- Métodos para seleção de alunos ---
  openStudentSelection() {
    // Atualizar o estado de seleção baseado nos alunos já selecionados
    this.filteredStudents.forEach(student => {
      student.selected = this.workoutTemplate.students.includes(student.id);
    });
    this.showStudentSelector = true;
  }

  closeStudentSelection() {
    this.showStudentSelector = false;
  }

  confirmStudentSelection() {
    // Atualizar IDs dos alunos selecionados
    this.workoutTemplate.students = this.filteredStudents
      .filter(student => student.selected)
      .map(student => student.id);

    // Atualizar a lista de alunos selecionados
    this.selectedStudents = this.filteredStudents
      .filter(student => student.selected)
      .map(student => ({...student}));

    this.showStudentSelector = false;
  }

  filterStudents(event: any) {
    const query = event.detail.value.toLowerCase();
    this.filteredStudents = this.allStudents.filter(student => {
      return student.name.toLowerCase().includes(query) ||
             student.category.toLowerCase().includes(query);
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

  // Métodos para gerenciar distâncias parciais
  addCustomPartialDistance(distanceStr: string) {
    if (!distanceStr || isNaN(Number(distanceStr))) {
      return; // Validação simples
    }

    const distance = Number(distanceStr);
    if (distance <= 0 || distance >= this.currentSet.distance) {
      // Distância inválida (deve ser positiva e menor que a distância total)
      return;
    }

    // Inicializar o array se não existir
    if (!this.currentSet.partialDistances) {
      this.currentSet.partialDistances = [];
    }

    // Adicionar a distância se não estiver já adicionada
    if (!this.hasPartialDistance(distance)) {
      this.currentSet.partialDistances.push(distance);
      this.currentSet.partialDistances.sort((a, b) => a - b);
    }
  }

  // Verificar se uma distância está nas distâncias parciais
  hasPartialDistance(distance: number): boolean {
    if (!this.currentSet.partialDistances) {
      return false;
    }
    return this.currentSet.partialDistances.includes(distance);
  }

  // Alternar a inclusão de uma distância nas parciais
  togglePartialDistance(distance: number, event: any): void {
    if (!this.currentSet.partialDistances) {
      this.currentSet.partialDistances = [];
    }

    if (event.detail.checked) {
      if (!this.hasPartialDistance(distance)) {
        this.currentSet.partialDistances.push(distance);
        this.currentSet.partialDistances.sort((a, b) => a - b);
      }
    } else {
      const index = this.currentSet.partialDistances.indexOf(distance);
      if (index !== -1) {
        this.currentSet.partialDistances.splice(index, 1);
      }
    }
  }

  // Verificar se todas as distâncias múltiplas estão configuradas
  hasPartialDistancesMultiple(interval: number): boolean {
    if (!this.currentSet.partialDistances) {
      return false;
    }

    const expectedDistances = this.getMultipleDistances(interval);
    return expectedDistances.every(d => this.hasPartialDistance(d));
  }

  // Configurar múltiplas distâncias parciais
  setPartialDistancesMultiple(interval: number, event: any): void {
    if (!this.currentSet.partialDistances) {
      this.currentSet.partialDistances = [];
    }

    const distances = this.getMultipleDistances(interval);

    if (event.detail.checked) {
      // Adicionar todas as distâncias
      distances.forEach(d => {
        if (!this.hasPartialDistance(d)) {
          this.currentSet.partialDistances!.push(d);
        }
      });
    } else {
      // Remover todas as distâncias
      distances.forEach(d => {
        const index = this.currentSet.partialDistances!.indexOf(d);
        if (index !== -1) {
          this.currentSet.partialDistances!.splice(index, 1);
        }
      });
    }

    // Ordenar as distâncias
    if (this.currentSet.partialDistances.length > 0) {
      this.currentSet.partialDistances.sort((a, b) => a - b);
    }
  }

  // Obter distâncias em intervalos regulares
  getMultipleDistances(interval: number): number[] {
    const result: number[] = [];
    for (let i = interval; i < this.currentSet.distance; i += interval) {
      result.push(i);
    }
    return result;
  }

  // Obter as distâncias parciais configuradas
  getCurrentPartialDistances(): number[] {
    return this.currentSet.partialDistances || [];
  }

  // Remover uma distância parcial
  removePartialDistance(index: number): void {
    if (this.currentSet.partialDistances && this.currentSet.partialDistances.length > index) {
      this.currentSet.partialDistances.splice(index, 1);
    }
  }
}
