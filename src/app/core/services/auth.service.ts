import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of, throwError } from 'rxjs';
import { catchError, map, tap, delay } from 'rxjs/operators';
import { Router } from '@angular/router';

export interface User {
  id: number;
  email: string;
  name: string;
  userType: 'aluno' | 'personal' | 'admin';
  token?: string;
}

export interface LoginResponse {
  success: boolean;
  user: User;
  token: string;
  message?: string;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  // URL da API real
  private apiUrl = 'http://localhost:8000/api'; // Ajuste conforme necessário para sua API
  private currentUser: User | null = null;

  constructor(
    private http: HttpClient,
    private router: Router
  ) {
    // Tenta recuperar o usuário do localStorage ao iniciar o serviço
    this.loadUserFromStorage();
  }

  // Login do usuário com email e senha
  login(email: string, password: string): Observable<User> {
    // Caminho da API para login
    const endpoint = `${this.apiUrl}/users/login`;

    console.log('Tentando login na API:', endpoint);

    return this.http.post<LoginResponse>(endpoint, { email, password })
      .pipe(
        delay(500), // Pequeno delay para melhor experiência do usuário
        map(response => {
          console.log('Resposta da API:', response);

          if (response.success && response.user && response.token) {
            // Configurar usuário e salvar no armazenamento local
            const user: User = {
              ...response.user,
              token: response.token
            };

            this.setCurrentUser(user);
            return user;
          } else {
            throw new Error(response.message || 'Falha no login, tente novamente');
          }
        }),
        catchError(error => {
          console.error('Erro no login:', error);

          if (error.status === 401) {
            return throwError(() => new Error('E-mail ou senha incorretos'));
          } else if (error.status === 404) {
            return throwError(() => new Error('Servidor não encontrado. Verifique sua conexão'));
          }

          return throwError(() => new Error(
            error.error?.message ||
            error.message ||
            'Falha na autenticação, verifique suas credenciais'
          ));
        })
      );
  }

  // Para testes sem API - remove antes de produção
  mockLogin(email: string, password: string): Observable<User> {
    console.warn('Usando mockLogin - substitua por login real em produção');

    // Simulação de resposta do servidor para desenvolvimento
    let userType: 'aluno' | 'personal' | 'admin';

    if (email.includes('aluno')) {
      userType = 'aluno';
    } else if (email.includes('admin')) {
      userType = 'admin';
    } else {
      userType = 'personal';
    }

    const mockUser: User = {
      id: 1,
      email: email,
      name: 'Usuário Teste',
      userType: userType,
      token: 'mock-jwt-token'
    };

    // Simulação de atraso de rede (500ms)
    return of(mockUser).pipe(
      delay(800),
      tap(user => this.setCurrentUser(user)),
      catchError(error => throwError(() => new Error('Falha na autenticação')))
    );
  }

  // Logout do usuário
  logout(): void {
    localStorage.removeItem('currentUser');
    this.currentUser = null;
    this.router.navigate(['/login']);
  }

  // Verificar se o usuário está logado
  isLoggedIn(): boolean {
    return !!this.currentUser;
  }

  // Obter o usuário atual
  getCurrentUser(): User | null {
    return this.currentUser;
  }

  // Verificar se o usuário é de um tipo específico
  isUserType(type: 'aluno' | 'personal' | 'admin'): boolean {
    return this.currentUser?.userType === type;
  }

  // Verificar se o token ainda é válido
  validateToken(): Observable<boolean> {
    if (!this.currentUser || !this.currentUser.token) {
      return of(false);
    }

    return this.http.get<{valid: boolean}>(`${this.apiUrl}/auth/validate-token`)
      .pipe(
        map(response => response.valid),
        catchError(() => of(false))
      );
  }

  // Redirecionar para a página inicial apropriada com base no tipo de usuário
  redirectBasedOnUserType(): void {
    if (!this.currentUser) {
      this.router.navigate(['/login']);
      return;
    }

    switch (this.currentUser.userType) {
      case 'aluno':
        this.router.navigate(['/home-pupil']);
        break;
      case 'personal':
      case 'admin':
        this.router.navigate(['/home']);
        break;
      default:
        this.router.navigate(['/login']);
    }
  }

  // Métodos privados auxiliares
  private setCurrentUser(user: User): void {
    this.currentUser = user;
    localStorage.setItem('currentUser', JSON.stringify(user));
  }

  private loadUserFromStorage(): void {
    const userStr = localStorage.getItem('currentUser');
    if (userStr) {
      try {
        this.currentUser = JSON.parse(userStr);
      } catch (e) {
        localStorage.removeItem('currentUser');
      }
    }
  }
}
