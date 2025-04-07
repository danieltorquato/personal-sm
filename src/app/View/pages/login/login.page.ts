import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { Router } from '@angular/router';
import { AuthService } from 'src/app/auth/auth.service';

@Component({
  selector: 'app-login',
  templateUrl: './login.page.html',
  styleUrls: ['./login.page.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, FormsModule]
})
export class LoginPage implements OnInit {
  email: string = '';
  password: string = '';
  errorMessage: string = '';
  isLoading: boolean = false;

  constructor(
    private authService: AuthService,
    private router: Router
  ) { }

  ngOnInit() {
    // Verificar se usuário já está autenticado
    if (this.authService.isAuthenticated()) {
      this.redirectBasedOnUserType();
    }
  }

  login() {
    this.errorMessage = '';
    this.isLoading = true;

    if (!this.email || !this.password) {
      this.errorMessage = 'Por favor, preencha todos os campos.';
      this.isLoading = false;
      return;
    }

    this.authService.login(this.email, this.password).subscribe({
      next: (user) => {
        this.isLoading = false;
        console.log('Login bem-sucedido:', user);
        this.redirectBasedOnUserType();
      },
      error: (error) => {
        this.isLoading = false;
        console.error('Erro ao fazer login:', error);

        if (error?.error?.message) {
          this.errorMessage = error.error.message;
        } else {
          this.errorMessage = 'Ocorreu um erro ao fazer login. Verifique suas credenciais.';
        }
      }
    });
  }

  redirectBasedOnUserType() {
    const user = this.authService.getCurrentUser();
    console.log('Redirecionando usuário:', user);
    if (!user) {
      return;
    }

    switch (user.type) {
      case 'admin':
        this.router.navigate(['/admin/dashboard']);
        break;
      case 'personal':
        this.router.navigate(['/personal/dashboard']);
        break;
      case 'student':
        this.router.navigate(['/pupil/dashboard']);
        break;
      default:
        this.router.navigate(['/home']);
    }
  }
}
