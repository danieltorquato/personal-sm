import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { RouterModule, Router } from '@angular/router';
import { UserService } from '../../../../services/user.service';
import { WorkoutService } from '../../../../services/workout.service';
import { DashboardService } from '../../../../services/dashboard.service';

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

// Interfaces para tipagem dos dados
interface DashboardStats {
  students: number;
  activePlans: number;
  sessions: number;
}

interface Appointment {
  name: string;
  time: string;
  activity: string;
  avatar: string;
}

interface DashboardData {
  stats: DashboardStats;
  schedule: Appointment[];
}

// Interfaces para respostas da API
interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

interface Student {
  id: number;
  name: string;
  email: string;
  avatar?: string;
  [key: string]: any; // Para propriedades adicionais
}

interface AssignedWorkout {
  id: number;
  workout_id: number;
  student_id: number;
  personal_id: number;
  student_name?: string;
  workout_name?: string;
  due_date?: string;
  start_time?: string;
  completed: boolean;
  student_avatar?: string;
  [key: string]: any; // Para propriedades adicionais
}

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.page.html',
  styleUrls: ['./dashboard.page.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, FormsModule, RouterModule]
})
export class DashboardPage implements OnInit {

  // Dashboard data com tipagem
  dashboardData: any = {
    stats: {
      students: 0,
      activePlans: 0,
      sessions: 0
    },
    schedule: []
  };

  loading = true;

  constructor(
    private router: Router,
    private userService: UserService,
    private workoutService: WorkoutService,
    private dashboardService: DashboardService
  ) {
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
    this.fetchDashboardData();
  }

  fetchDashboardData() {
    this.loading = true;

    this.dashboardService.getPersonalDashboard().subscribe(
      (response: any) => {
        if (response && response.success) {
          this.dashboardData = response.data;
        }
        this.loading = false;
      },
      (error) => {
        console.error('Erro ao carregar dashboard:', error);
        this.loading = false;
      }
    );
  }

  navigateTo(path: string) {
    this.router.navigate([path]);
  }

  // Métodos de navegação
  createWorkout() {
    this.router.navigate(['/personal/create-workout']);
  }

  manageClients() {
    this.router.navigate(['/personal/manage-students']);
  }

  viewAnalytics() {
    this.router.navigate(['/personal/analytics']);
  }

  startDynamicPoolWorkout() {
    this.router.navigate(['/personal/dynamic-pool-workout']);
  }

  createPoolWorkout() {
    this.router.navigate(['/personal/create-pool-workout']);
  }
}
