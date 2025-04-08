import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';
import { ApiResponse } from '../Models/workout.model';
import { Anamnesis } from '../Models/anamnesis.model';

@Injectable({
  providedIn: 'root'
})
export class AnamnesisService {
  constructor(private apiService: ApiService) { }

  /**
   * Obtém a anamnese de um aluno
   */
  getAnamnesis(studentId: number): Observable<ApiResponse<Anamnesis>> {
    return this.apiService.get<ApiResponse<Anamnesis>>(`anamnesis/${studentId}`);
  }

  /**
   * Cria uma nova anamnese
   */
  createAnamnesis(studentId: number, data: Anamnesis): Observable<ApiResponse<Anamnesis>> {
    // Ajustar o objeto para enviar o user_id em vez de student_id (compatibilidade com a API)
    const { student_id, ...dataWithoutId } = data;
    return this.apiService.post<ApiResponse<Anamnesis>>('anamnesis', {
      ...dataWithoutId,
      user_id: studentId
    });
  }

  /**
   * Atualiza uma anamnese existente
   */
  updateAnamnesis(studentId: number, data: Anamnesis): Observable<ApiResponse<Anamnesis>> {
    // Ajustar o objeto para enviar o user_id em vez de student_id (compatibilidade com a API)
    const { student_id, ...dataWithoutId } = data;
    return this.apiService.put<ApiResponse<Anamnesis>>(`anamnesis/${data.id}`, {
      ...dataWithoutId,
      user_id: studentId
    });
  }

  /**
   * Retorna o histórico de medidas de um aluno
   * Esta função será útil para acompanhar a evolução do aluno
   */
  getMeasurementHistory(studentId: number): Observable<ApiResponse<any>> {
    return this.apiService.get<ApiResponse<any>>(`anamnesis/${studentId}/measurements/history`);
  }
}
