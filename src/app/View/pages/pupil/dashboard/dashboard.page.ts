import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { RouterModule, Router } from '@angular/router';
import { ApiService } from '../../../../services/api.service';
import { DashboardService } from '../../../../services/dashboard.service';
import { addIcons } from 'ionicons';
import {
  barbell,
  barbellOutline,
  waterOutline,
  timerOutline,
  calendarClearOutline,
  analyticsOutline,
  personOutline,
  heartOutline,
  trendingUpOutline,
  speedometerOutline
} from 'ionicons/icons';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.page.html',
  styleUrls: ['./dashboard.page.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, FormsModule, RouterModule]
})
export class DashboardPage implements OnInit {
  loading = true;
  dashboardData: any = {
    stats: {
      totalWorkouts: 0,
      completedWorkouts: 0,
      totalDistance: 0,
      averageHeartRate: 0,
      improvement: 0
    },
    upcomingWorkouts: [],
    recentSessions: [],
    trainer: {}
  };

  constructor(
    private router: Router,
    private apiService: ApiService,
    private dashboardService: DashboardService
  ) {
    // Adicionar ícones
    addIcons({
      barbell, barbellOutline, waterOutline, timerOutline,
      calendarClearOutline, analyticsOutline, personOutline,
      heartOutline, trendingUpOutline, speedometerOutline
    });
  }

  ngOnInit() {
    this.loadDashboardData();
  }

  loadDashboardData() {
    this.loading = true;
    this.dashboardService.getPupilDashboard().subscribe(
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
  seeAllWorkouts() {
    this.router.navigate(['/pupil/workouts']);
  }

  startWorkout(workoutId: number) {
    this.router.navigate([`/pupil/start-workout/${workoutId}`]);
  }

  viewSession(sessionId: number) {
    this.router.navigate([`/pupil/pool-workout-summary/${sessionId}`]);
  }

  viewTrainer() {
    if (this.dashboardData.trainer && this.dashboardData.trainer.id) {
      this.router.navigate([`/pupil/trainer-profile/${this.dashboardData.trainer.id}`]);
    }
  }

  formatDate(dateString: string): string {
    if (!dateString) return '';

    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR');
  }

  formatTime(timeString: string): string {
    if (!timeString) return '';

    const parts = timeString.split(':');
    if (parts.length >= 2) {
      return `${parts[0]}:${parts[1]}`;
    }
    return timeString;
  }

  formatPace(pace: string): string {
    return pace || '00:00';
  }

  formatDuration(seconds: number): string {
    if (!seconds) return '0min';

    const minutes = Math.floor(seconds / 60);
    return `${minutes}min`;
  }
}
