import { AuthService } from 'src/app/services/auth.service';
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonContent, IonHeader, IonTitle, IonToolbar } from '@ionic/angular/standalone';
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-student-details',
  templateUrl: './student-details.page.html',
  styleUrls: ['./student-details.page.scss'],
  standalone: true,
  imports: [IonContent, IonHeader, IonTitle, IonToolbar, CommonModule, FormsModule]
})
export class StudentDetailsPage implements OnInit {
student: any[] = []; // Array para armazenar os detalhes do aluno
  constructor(private route: ActivatedRoute, private authService: AuthService) { }

  ngOnInit() {
this.getStudentDetails();

  }

  getStudentDetails() {
    const id = this.route.snapshot.paramMap.get('id');
    // Lógica para obter os detalhes do aluno com base no ID
    // Você pode usar um serviço para buscar os dados do aluno aqui
    const currentUser = this.authService.getCurrentUser();
    if (currentUser) {
      // Supondo que currentUser tenha os detalhes do aluno
      currentUser.subscribe(user => {
        if (user) {
          this.student = [user]; // Atualiza o array de detalhes do aluno
          console.log('Detalhes do aluno:', user);
        } else {
          console.error('Erro ao obter detalhes do aluno.');
        }
      });
      // Exemplo de como acessar os detalhes do aluno
      console.log('Detalhes do aluno:', currentUser);
    } else {
      console.error('Erro ao obter detalhes do aluno.');
    }
  }
}

