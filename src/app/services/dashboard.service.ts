import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';
import { ApiResponse } from '../Models/workout.model';

@Injectable({
  providedIn: 'root'
})
export class DashboardService {
  constructor(private apiService: ApiService) { }

  /**
   * Obtém os dados para o dashboard do personal
   */
  getPersonalDashboard(): Observable<ApiResponse<any>> {
    return this.apiService.get<ApiResponse<any>>('dashboard/personal');
  }

  /**
   * Obtém os dados para o dashboard do aluno
   */
  getPupilDashboard(): Observable<ApiResponse<any>> {
    return this.apiService.get<ApiResponse<any>>('dashboard/pupil');
  }

  /**
   * Obtém apenas as estatísticas do dashboard
   */
  getStats(): Observable<ApiResponse<any>> {
    return this.apiService.get<ApiResponse<any>>('dashboard/stats');
  }

  /**
   * Obtém os próximos treinos agendados
   */
  getUpcomingWorkouts(): Observable<ApiResponse<any>> {
    return this.apiService.get<ApiResponse<any>>('dashboard/upcoming-workouts');
  }

  /**
   * Obtém as sessões de treino recentes
   */
  getRecentSessions(): Observable<ApiResponse<any>> {
    return this.apiService.get<ApiResponse<any>>('dashboard/recent-sessions');
  }
}
