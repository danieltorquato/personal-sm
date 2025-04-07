import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule, ActionSheetController } from '@ionic/angular';
import { Router, RouterModule } from '@angular/router';

import {
  searchOutline,
  personAdd,
  ellipsisVertical,
  eye,
  add,
  pencil
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
  students: any[] = []; // Array para armazenar os alunos
  studentsLength: number = 0; // Variável para armazenar o comprimento do array de alunos

  constructor( private actionSheetController: ActionSheetController,private personalService: PersonalService, private router: Router) {
    addIcons({
      searchOutline,
      personAdd,
      ellipsisVertical,
      eye,
      add,
      pencil
    });
  }

  ngOnInit() {
    this.fetchStudents();
  }
  fetchStudents() {
    this.personalService.getPupils().subscribe(
      (response: any) => {
        if (response && response.status) {
          this.students = response.data;
          console.log('Alunos obtidos com sucesso:', this.students);
          this.studentsLength = response.data.length; // Atualiza o comprimento do array de alunos
        } else {
          console.error('Erro ao obter alunos: resposta inválida');
        }
      },
      (error) => {
        console.error('Erro ao obter alunos:', error);
      }
    );
  }
 studentDetails(studentId: string) {
    // Navegar para a página de detalhes do aluno com o ID do aluno
    this.router.navigate(['/personal/student-details', studentId]);
    console.log('Navegando para os detalhes do aluno:', studentId);
    // Aqui você pode usar o roteador para navegar para a página de detalhes do aluno
    // Exemplo: this.router.navigate(['/student-details', studentId]);
}
verTreino(id: number) {
  console.log('Ver treino do aluno', id);
  // this.router.navigate(['/treino', id]);
}

adicionarTreino(id: number) {
  console.log('Adicionar treino para aluno', id);
}

editarTreino(id: number) {
  console.log('Editar treino do aluno', id);
}
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
