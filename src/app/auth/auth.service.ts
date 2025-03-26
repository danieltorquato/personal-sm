import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { catchError, map, tap } from 'rxjs/operators';
import { environment } from 'src/environments/environment';

export interface User {
  id: string;
  name: string;
  email: string;
  type: 'admin' | 'personal' | 'student';
  avatar?: string;
  token?: string;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private baseUrl = environment.apiUrl;
  private currentUserSubject = new BehaviorSubject<User | null>(null);
  public currentUser = this.currentUserSubject.asObservable();

  constructor(private http: HttpClient) {
    this.loadUserFromStorage();
  }

  // Carregar usuário do localStorage
  private loadUserFromStorage() {
    const storedUser = localStorage.getItem('current_user');
    const token = localStorage.getItem('auth_token');

    if (storedUser && token) {
      try {
        const user = JSON.parse(storedUser);
        user.token = token;
        this.currentUserSubject.next(user);
      } catch (error) {
        console.error('Erro ao carregar usuário do localStorage:', error);
        this.clearStorage();
      }
    }
  }

  // Obter usuário atual
  public getCurrentUser(): User | null {
    return this.currentUserSubject.value;
  }

  // Verificar se está autenticado
  public isAuthenticated(): boolean {
    const user = this.getCurrentUser();
    const token = localStorage.getItem('auth_token');
    return !!user && !!token && token.length > 10;
  }

  // Obter headers para requisições autenticadas
  public getAuthHeaders(): HttpHeaders {
    const token = localStorage.getItem('auth_token') || '';
    return new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    });
  }

  // Login
  login(email: string, password: string): Observable<User> {
    return this.http.post<any>(`${this.baseUrl}/users/login`, { email, password })
      .pipe(
        map(response => {
          if (response && response.success && response.user && response.token) {
            const user: User = {
              id: response.user.id,
              name: response.user.name,
              email: response.user.email,
              type: response.user.type_name,
              avatar: response.user.avatar
            };

            // Salvar no localStorage
            localStorage.setItem('current_user', JSON.stringify(user));
            localStorage.setItem('auth_token', response.token);

            // Atualizar BehaviorSubject
            user.token = response.token;
            this.currentUserSubject.next(user);

            return user;
          }
          throw new Error('Resposta do servidor inválida');
        }),
        catchError(error => {
          console.error('Erro ao fazer login:', error);
          throw error;
        })
      );
  }

  // Logout
  logout(): void {
    this.clearStorage();
    this.currentUserSubject.next(null);
  }

  // Limpar storage
  private clearStorage(): void {
    localStorage.removeItem('current_user');
    localStorage.removeItem('auth_token');
  }

  // Verificar se token é válido
  checkTokenValidity(): Observable<boolean> {
    if (!this.isAuthenticated()) {
      return of(false);
    }

    return this.http.get<any>(`${this.baseUrl}/users/profile`, {
      headers: this.getAuthHeaders()
    }).pipe(
      map(response => {
        return response && response.success;
      }),
      catchError(() => {
        this.logout();
        return of(false);
      })
    );
  }

  // Verificar se usuário tem um tipo específico
  hasRole(role: 'admin' | 'personal' | 'student'): boolean {
    const user = this.getCurrentUser();
    return !!user && user.type === role;
  }
}
