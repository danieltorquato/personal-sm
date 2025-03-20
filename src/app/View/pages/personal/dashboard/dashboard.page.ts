import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { RouterModule, Router } from '@angular/router';

import {
  notificationsOutline,
  peopleOutline,
  clipboardOutline,
  calendarOutline,
  analyticsOutline,
  barbellOutline,
  timeOutline,
  arrowForwardOutline,
  add,
  personAddOutline,
  fitnessOutline,
  calendarClearOutline,
  waterOutline,
  createOutline
} from 'ionicons/icons';
import { addIcons } from 'ionicons';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.page.html',
  styleUrls: ['./dashboard.page.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, FormsModule, RouterModule]
})
export class DashboardPage implements OnInit {

  // Dashboard data (could be fetched from a service)
  dashboardData = {
    stats: {
      students: 15,
      activePlans: 8,
      sessions: 25
    },
    schedule: [
      {
        name: 'Carlos Silva',
        time: '09:00',
        activity: 'Treino de Força',
        avatar: ''
      },
      {
        name: 'Ana Sousa',
        time: '11:30',
        activity: 'Natação',
        avatar: ''
      },
      {
        name: 'João Ferreira',
        time: '15:15',
        activity: 'Mobilidade',
        avatar: ''
      }
    ]
  };

  constructor(private router: Router) {
    // Add Ionicons
    addIcons({
      notificationsOutline,
      peopleOutline,
      clipboardOutline,
      calendarOutline,
      analyticsOutline,
      barbellOutline,
      timeOutline,
      arrowForwardOutline,
      add,
      personAddOutline,
      fitnessOutline,
      calendarClearOutline,
      waterOutline,
      createOutline
    });
  }

  ngOnInit() {
    // Init code could fetch real data from API
  }

  createWorkout() {
    // Logic to create a new workout
    console.log('Criando novo treino');
  }

  manageClients() {
    // Logic to manage clients
    console.log('Gerenciando alunos');
  }

  viewAnalytics() {
    // Logic to view analytics
    console.log('Visualizando análises');
  }

  startDynamicPoolWorkout() {
    // Navegar para a página de treino dinâmico de natação
    this.router.navigate(['/personal/dynamic-pool-workout']);
    console.log('Iniciando treino de natação dinâmico');
  }

  createPoolWorkout() {
    // Navegar para a página de criação de treino de natação
    this.router.navigate(['/personal/create-pool-workout']);
    console.log('Criando treino de natação');
  }
}
