import { Injectable } from '@angular/core';
import { ApiService } from './api.service';
import { Observable } from 'rxjs';
import { User } from '../Models/user.model';
import { ApiResponse } from '../Models/workout.model';

@Injectable({
  providedIn: 'root'
})
export class UserService {
  constructor(private apiService: ApiService) { }

  /**
   * Lista todos os personais disponíveis
   */
  listTrainers(): Observable<ApiResponse<User[]>> {
    return this.apiService.get<ApiResponse<User[]>>('users/trainers');
  }

  /**
   * Lista todos os alunos (para personais e admin)
   */
  listStudents(): Observable<ApiResponse<User[]>> {
    return this.apiService.get<ApiResponse<User[]>>('users/students');
  }

  /**
   * Obtém o personal do aluno logado
   */
  getMyTrainer(): Observable<ApiResponse<User>> {
    return this.apiService.get<ApiResponse<User>>('users/my-trainer');
  }

  /**
   * Atribui um aluno a um personal
   */
  assignStudentToTrainer(student_id: number, trainer_id: number): Observable<ApiResponse<null>> {
    return this.apiService.post<ApiResponse<null>>('users/assign-trainer', {
      student_id,
      trainer_id
    });
  }

  /**
   * Obtém o nome de exibição formatado do usuário
   */
  getUserDisplayName(user: User): string {
    if (!user) return '';

    const nameParts = user.name.split(' ');
    if (nameParts.length > 1) {
      return `${nameParts[0]} ${nameParts[nameParts.length - 1]}`;
    }

    return user.name;
  }

  /**
   * Obtém as iniciais do usuário para exibição
   */
  getUserInitials(user: User): string {
    if (!user) return '';

    const nameParts = user.name.split(' ');
    if (nameParts.length > 1) {
      return `${nameParts[0][0]}${nameParts[nameParts.length - 1][0]}`.toUpperCase();
    }

    return user.name.substring(0, 2).toUpperCase();
  }

  /**
   * Atualiza o status de um aluno (ativo/inativo)
   */
  updateStudentStatus(studentId: number, active: number): Observable<ApiResponse<any>> {
    return this.apiService.put<ApiResponse<any>>(`students/${studentId}/status`, { status });
  }

  /**
   * Exclui um aluno
   */
  deleteStudent(studentId: number): Observable<ApiResponse<any>> {
    return this.apiService.delete<ApiResponse<any>>(`students/${studentId}`);
  }
}
