import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule, ActionSheetController } from '@ionic/angular';
import { Router, RouterModule } from '@angular/router';

import {
  searchOutline,
  personAdd,
  personAddOutline,
  ellipsisVertical,
  eye,
  eyeOutline,
  add,
  addCircleOutline,
  pencil,
  createOutline,
  calendarOutline,
  peopleOutline,
  close
} from 'ionicons/icons';
import { addIcons } from 'ionicons';
import { PersonalService } from 'src/app/services/personal.service';

@Component({
  selector: 'app-manage-students',
  templateUrl: './manage-students.page.html',
  styleUrls: ['./manage-students.page.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, FormsModule, RouterModule]
})
export class ManageStudentsPage implements OnInit {
  // Dados dos alunos
  students: any[] = []; // Array original de alunos
  filteredStudents: any[] = []; // Array filtrado para exibição
  studentsLength: number = 0; // Total de alunos

  // Controles de interface
  selectedSegment: string = 'todos'; // Segmento selecionado (todos, ativos, inativos)
  searchTerm: string = ''; // Termo de busca
  isLoading: boolean = false; // Controle de loading


  constructor(
    private actionSheetController: ActionSheetController,
    private personalService: PersonalService,
    private router: Router
  ) {
    addIcons({
      searchOutline,
      personAdd,
      personAddOutline,
      ellipsisVertical,
      eye,
      eyeOutline,
      add,
      addCircleOutline,
      pencil,
      createOutline,
      calendarOutline,
      peopleOutline,
      close
    });
  }

  ngOnInit() {
    this.fetchStudents();
  }

  /**
   * Busca a lista de alunos do serviço
   */
  fetchStudents() {
    this.isLoading = true;
    this.personalService.getPupils().subscribe(
      (response: any) => {
        if (response && response.status) {
          // Adicionar propriedade isActive com base em algum critério (últimos 30 dias)
          this.students = response.data.map((student: any) => {
            // Determinar se o aluno está ativo (exemplo: treinou nos últimos 30 dias)
            const isActive = student.active;

            // student.last_training ?
            //   (new Date().getTime() - new Date(student.last_training).getTime()) / (1000 * 3600 * 24) < 30 :
            //   false;

            return {
              ...student,
              isActive: isActive,
              photo: student.photo || 'assets/avatar-placeholder.png' // Garantir foto padrão
            };
          });



          this.studentsLength = this.students.length;
          this.applyFilters(); // Aplicar filtros iniciais
          console.log('Alunos obtidos com sucesso:', this.students);
        } else {
          console.error('Erro ao obter alunos: resposta inválida');

          this.studentsLength = this.students.length;
          this.applyFilters();
        }
        this.isLoading = false;
      },
      (error) => {
        console.error('Erro ao obter alunos:', error);

        this.studentsLength = this.students.length;
        this.applyFilters();
        this.isLoading = false;
      }
    );
  }

  /**
   * Aplica os filtros de segmento e busca
   */
  applyFilters() {
    // Primeiro filtrar por segmento
    let result = [...this.students];

    if (this.selectedSegment === 'ativos') {
      result = result.filter(student => student.isActive);
    } else if (this.selectedSegment === 'inativos') {
      result = result.filter(student => !student.isActive);
    }

    // Depois filtrar por termo de busca
    if (this.searchTerm && this.searchTerm.trim() !== '') {
      const term = this.searchTerm.toLowerCase().trim();
      result = result.filter(student =>
        student.name.toLowerCase().includes(term)
      );
    }

    this.filteredStudents = result;
  }

  /**
   * Manipula a mudança de segmento
   */
  segmentChanged(event: any) {
    this.selectedSegment = event.detail.value;
    this.applyFilters();
  }

  /**
   * Filtra alunos baseado no termo de busca
   */
  filterStudents() {
    this.applyFilters();
  }

  /**
   * Retorna o número de alunos ativos
   */
  getActiveStudentsCount(): number {
    return this.students.filter(student => student.isActive).length;
  }

  /**
   * Retorna o número de treinos pendentes
   * (Isso é um exemplo - você pode adaptar conforme seus dados)
   */
  getPendingWorkoutsCount(): number {
    // Exemplo: contar alunos que não treinaram nos últimos 7 dias
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    return this.students.filter(student => {
      if (!student.last_training) return true;
      return new Date(student.last_training) < sevenDaysAgo;
    }).length;
  }

  /**
   * Navega para a página de detalhes do aluno
   */
  studentDetails(studentId: string) {
    this.router.navigate(['/personal/student-details', studentId]);
    console.log('Navegando para os detalhes do aluno:', studentId);
  }

  /**
   * Função para ver o treino do aluno
   */
  verTreino(studentId: number) {
    console.log('Ver treino do aluno', studentId);
    this.router.navigate(['/personal/view-workouts', studentId]);
  }

  /**
   * Função para adicionar treino para o aluno
   */
  adicionarTreino(studentId: number) {
    console.log('Adicionar treino para aluno', studentId);
    this.router.navigate(['/personal/create-pool-workout'], {
      queryParams: { studentId: studentId }
    });
  }

  /**
   * Função para editar treino do aluno
   */
  editarTreino(studentId: number) {
    console.log('Editar treino do aluno', studentId);
    this.router.navigate(['/personal/edit-workout', studentId]);
  }

  /**
   * Abre o menu de ações para o aluno (não usado no novo design)
   */
  async abrirMenu(studentId: number) {
    const actionSheet = await this.actionSheetController.create({
      header: 'Opções do aluno',
      buttons: [
        {
          text: 'Ver treino',
          icon: 'eye',
          handler: () => {
            this.verTreino(studentId);
          }
        },
        {
          text: 'Adicionar treino',
          icon: 'add',
          handler: () => {
            this.adicionarTreino(studentId);
          }
        },
        {
          text: 'Editar treino',
          icon: 'pencil',
          handler: () => {
            this.editarTreino(studentId);
          }
        },
        {
          text: 'Cancelar',
          icon: 'close',
          role: 'cancel'
        }
      ]
    });

    await actionSheet.present();
  }
}
