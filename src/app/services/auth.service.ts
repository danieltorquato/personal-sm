import { Injectable } from '@angular/core';
import { ApiService } from './api.service';
import { BehaviorSubject, Observable, tap } from 'rxjs';
import { User, LoginData, RegisterData, LoginResponse } from '../Models/user.model';
import { ApiResponse } from '../Models/workout.model';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private currentUserSubject = new BehaviorSubject<User | null>(null);
  public currentUser = this.currentUserSubject.asObservable();
  private tokenExpirationTimer: any;

  constructor(private apiService: ApiService) {
    this.checkAuth();
  }

  /**
   * Realiza login na aplicação
   */
  login(loginData: LoginData): Observable<LoginResponse> {
    return this.apiService.post<LoginResponse>('users/login', loginData).pipe(
      tap(response => {
        if (response.status === 'success' && response.data) {
          this.setUserData(response.data);
        }
      })
    );
  }

  /**
   * Realiza o registro de um novo usuário
   */
  register(registerData: RegisterData): Observable<ApiResponse<{ id: number }>> {
    return this.apiService.post<ApiResponse<{ id: number }>>('users/register', registerData);
  }

  /**
   * Obtém o perfil do usuário logado
   */
  getProfile(): Observable<ApiResponse<User>> {
    return this.apiService.get<ApiResponse<User>>('users/profile').pipe(
      tap(response => {
        if (response.status === 'success' && response.data) {
          // Preserva o token atual
          const currentToken = this.getToken();
          const userData = {
            ...response.data,
            token: currentToken || undefined
          };
          this.setUserData(userData);
        }
      })
    );
  }

  /**
   * Atualiza o perfil do usuário
   */
  updateProfile(userData: Partial<User>): Observable<ApiResponse<null>> {
    return this.apiService.put<ApiResponse<null>>('users/update-profile', userData);
  }

  /**
   * Altera a senha do usuário
   */
  changePassword(currentPassword: string, newPassword: string): Observable<ApiResponse<null>> {
    return this.apiService.put<ApiResponse<null>>('users/change-password', {
      current_password: currentPassword,
      new_password: newPassword
    });
  }

  /**
   * Verifica se o usuário está autenticado
   */
  checkAuth() {
    const userData = localStorage.getItem('user_data');
    const token = localStorage.getItem('auth_token');

    if (userData && token) {
      const user = JSON.parse(userData);
      this.currentUserSubject.next(user);
      return true;
    }

    this.currentUserSubject.next(null);
    return false;
  }

  /**
   * Realiza logout na aplicação
   */
  logout() {
    localStorage.removeItem('user_data');
    localStorage.removeItem('auth_token');
    localStorage.removeItem('token_expiration');
    this.currentUserSubject.next(null);

    if (this.tokenExpirationTimer) {
      clearTimeout(this.tokenExpirationTimer);
    }
    this.tokenExpirationTimer = null;
  }

  /**
   * Armazena os dados do usuário e token
   */
  private setUserData(user: User) {
    localStorage.setItem('user_data', JSON.stringify(user));

    if (user.token) {
      localStorage.setItem('auth_token', user.token);

      // Configurar expiração do token (30 dias)
      const expirationDate = new Date(new Date().getTime() + 30 * 24 * 60 * 60 * 1000);
      localStorage.setItem('token_expiration', expirationDate.toISOString());

      this.autoLogout(30 * 24 * 60 * 60 * 1000);
    }

    this.currentUserSubject.next(user);
  }

  /**
   * Realiza logout automático após expiração do token
   */
  private autoLogout(expirationDuration: number) {
    if (this.tokenExpirationTimer) {
      clearTimeout(this.tokenExpirationTimer);
    }

    this.tokenExpirationTimer = setTimeout(() => {
      this.logout();
    }, expirationDuration);
  }

  /**
   * Obtém o token de autenticação
   */
  getToken(): string | null {
    return localStorage.getItem('auth_token');
  }

  /**
   * Verifica se o usuário é um personal
   */
  isTrainer(): boolean {
    const user = this.currentUserSubject.value;
    return !!user && user.type_name === 'trainer';
  }

  /**
   * Verifica se o usuário é um aluno
   */
  isStudent(): boolean {
    const user = this.currentUserSubject.value;
    return !!user && user.type_name === 'student';
  }

  /**
   * Verifica se o usuário é um administrador
   */
  isAdmin(): boolean {
    const user = this.currentUserSubject.value;
    return !!user && user.type_name === 'admin';
  }

  /**
   * Obtém o usuário atual
   */
  getCurrentUser(): User | null {
    return this.currentUserSubject.value;
  }
}




