import { Observable } from 'rxjs';
import { Injectable } from '@angular/core';
import { User } from '../Models/user.model';
import { environment } from 'src/environments/environment';
import { HttpClient } from '@angular/common/http';

interface Personal {
  id?: string;
  name: string;
  email: string;
  phone?: string;
  avatar?: string;
  createdAt?: string;
  updatedAt?: string;
}

@Injectable({
  providedIn: 'root'
})
export class PersonalService {
  private apiUrl = environment.apiUrl; // Ajuste conforme necessário para sua API

  constructor(private http: HttpClient) { }

  getPupils(): Observable<any[]> {
    const endpoint = `${this.apiUrl}/personal/pupils`;
    console.log('Tentando obter alunos na API:', endpoint);
    return this.http.get<any[]>(endpoint);
  }

  // Método para obter detalhes de um aluno específico
  getPupilDetails(id: number): Observable<any> {
    const endpoint = `${this.apiUrl}/personal/pupil-details?id=${id}`;
    console.log('Tentando obter detalhes do aluno na API:', endpoint);
    return this.http.get<any>(endpoint);
  }

  registerPersonal(email: string, password: string, personalData: Omit<Personal, 'id' | 'email'>): Observable<{ id: string }> {
    const endpoint = `${this.apiUrl}/auth/register`;
    const data = {
      email,
      password,
      ...personalData
    };
    return this.http.post<{ id: string }>(endpoint, data);
  }

  loginPersonal(email: string, password: string): Observable<{ token: string, userId: string }> {
    const endpoint = `${this.apiUrl}/auth/login`;
    return this.http.post<{ token: string, userId: string }>(endpoint, { email, password });
  }

  logoutPersonal(): Observable<void> {
    const endpoint = `${this.apiUrl}/auth/logout`;
    return this.http.post<void>(endpoint, {});
  }

  getPersonalById(personalId: string): Observable<Personal> {
    const endpoint = `${this.apiUrl}/personal/${personalId}`;
    return this.http.get<Personal>(endpoint);
  }

  updatePersonal(personal: Personal): Observable<void> {
    if (!personal.id) {
      throw new Error('ID do personal não fornecido');
    }

    const endpoint = `${this.apiUrl}/personal/${personal.id}`;
    return this.http.put<void>(endpoint, personal);
  }
}
