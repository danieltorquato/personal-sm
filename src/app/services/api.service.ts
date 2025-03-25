import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  private baseUrl = environment.apiUrl;

  constructor(private http: HttpClient) { }

  // Método para obter os headers de autenticação
  private getAuthHeaders(): HttpHeaders {
    const token = localStorage.getItem('auth_token');
    return new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': token ? `Bearer ${token}` : ''
    });
  }

  // Métodos HTTP genéricos
  get<T>(endpoint: string, params: any = {}): Observable<T> {
    const headers = this.getAuthHeaders();

    // Converter parâmetros em string de consulta
    const queryParams = Object.keys(params)
      .map(key => `${key}=${params[key]}`)
      .join('&');

    const url = `${this.baseUrl}/${endpoint}${queryParams ? '?' + queryParams : ''}`;

    return this.http.get<T>(url, { headers });
  }

  post<T>(endpoint: string, data: any): Observable<T> {
    const headers = this.getAuthHeaders();
    const url = `${this.baseUrl}/${endpoint}`;

    return this.http.post<T>(url, data, { headers });
  }

  put<T>(endpoint: string, data: any): Observable<T> {
    const headers = this.getAuthHeaders();
    const url = `${this.baseUrl}/${endpoint}`;

    return this.http.put<T>(url, data, { headers });
  }

  delete<T>(endpoint: string): Observable<T> {
    const headers = this.getAuthHeaders();
    const url = `${this.baseUrl}/${endpoint}`;

    return this.http.delete<T>(url, { headers });
  }
}
