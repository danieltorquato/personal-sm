import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of, throwError } from 'rxjs';
import { catchError, map, tap, delay } from 'rxjs/operators';
import { Router } from '@angular/router';
import { environment } from 'src/environments/environment';

export interface User {
  id: any;
  email: string;
  name: string;
  userType: 'aluno' | 'personal' | 'admin';
  phone?: string;
  birth_date?: string;
  gender?: 'male' | 'female' | 'other';
  avatar?: string;
  active?: boolean;
  created_at?: string;
  updated_at?: string;
  personal_id?: any;
  token?: string;
  last_training?: string;
}

export interface LoginResponse {
  data: any;
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
  private apiUrl = environment.apiUrl; // Ajuste conforme necessário para sua API
  public currentUser: User | null = null;
  public studentId: string | null = null;

  constructor(
    private http: HttpClient,
    private router: Router
  ) {
    // Tenta recuperar o usuário do localStorage ao iniciar o serviço
    this.loadUserFromStorage();
  }

  // Login do usuário com email e senha
  login(email: string, password: string): Observable<User> {
    const endpoint = `${this.apiUrl}/users/login`;

    console.log('Tentando login na API:', endpoint);

    return this.http.post<LoginResponse>(endpoint, { email, password })
      .pipe(
        delay(500),
        map(response => {
          console.log('Resposta da API:', response);

          // Se a resposta contiver status success, considerar como login bem-sucedido
          if (response.success || (response as any).status === 'success') {
            const user: User = {
              id: response.data.id,
          email: response.data.email,
          name: response.data.name,
          userType: response.data.user_type,
          token: response.data.token,
            };
            console.log('Tipo de usuário:', user);
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
  getCurrentUser(): Observable<User | null> {
    const endpoint = `${this.apiUrl}/users/current`;

    console.log('Tentando obter o usuário atual na API:', endpoint);

    // Se já temos o usuário em memória, retornamos diretamente
    if (this.currentUser) {
      return of(this.currentUser);
    }

    return this.http.get<LoginResponse>(endpoint).pipe(
      map(response => {
        if (response.success) {
          const user = {
            id: response.user.id,
            email: response.user.email,
            name: response.user.name,
            userType: response.user.userType,
            token: response.user.token
          } as User;

          this.setCurrentUser(user);
          return user;
        }
        return null;
      }),
      catchError(() => of(null))
    );
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
  redirectBasedOnUserType(userType: any): void {
    if (!this.currentUser) {
      this.router.navigate(['/login']);
      return;
    }

    switch (userType) {
      case 'pupil':
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
