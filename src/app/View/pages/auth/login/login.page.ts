import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { AlertController, IonicModule, LoadingController } from '@ionic/angular';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { AuthService } from '../../../../services/auth.service';
import {
  logInOutline,
  personAddOutline,
  eyeOutline,
  eyeOffOutline
} from 'ionicons/icons';
import { addIcons } from 'ionicons';

@Component({
  selector: 'app-login',
  templateUrl: './login.page.html',
  styleUrls: ['./login.page.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, ReactiveFormsModule, RouterModule]
})
export class LoginPage implements OnInit {
  loginForm: FormGroup;
  returnUrl: string = '';
  isLoading: boolean = false;
  showPassword: boolean = false;
  loginError: string = '';
  userType: string = '';
  constructor(
    private formBuilder: FormBuilder,
    private authService: AuthService,
    private router: Router,
    private route: ActivatedRoute,
    private loadingController: LoadingController,
    private alertController: AlertController
  ) {
    addIcons({
      logInOutline,
      personAddOutline,
      eyeOutline,
      eyeOffOutline
    });

    // Inicializar o formulário de login
    this.loginForm = this.formBuilder.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]]
    });
  }

  ngOnInit() {
    // Obter a URL de retorno dos parâmetros de consulta ou usar o padrão
    // this.returnUrl = 'personal'

    // Verificar se o usuário já está logado
    if (this.authService.isLoggedIn()) {
      this.userType = this.authService.currentUser?.userType || '';
      this.authService.redirectBasedOnUserType(this.userType);
    }
  }

  async onSubmit() {
    // Validar o formulário
    if (this.loginForm.invalid) {
      this.markFormGroupTouched(this.loginForm);
      return;
    }

    this.isLoading = true;
    this.loginError = '';

    // Mostrar indicador de carregamento
    const loading = await this.loadingController.create({
      message: 'Autenticando...',
      spinner: 'crescent'
    });
    await loading.present();

    try {
      // Obter valores do formulário
      const { email, password } = this.loginForm.value;

      // Usar o serviço de autenticação real
      this.authService.login(email, password).subscribe({
        next: (response) => {
          console.log('Login bem-sucedido:', response);
          loading.dismiss();
          this.isLoading = false;
          this.userType = response.userType;
          this.authService.redirectBasedOnUserType(this.userType);
        },
        error: (error) => {
          console.error('Erro no login:', error);
          loading.dismiss();
          this.isLoading = false;
          this.loginError = error.message || 'Não foi possível fazer login. Verifique suas credenciais.';
          this.showErrorAlert(this.loginError);
        }
      });
    } catch (error) {
      console.error('Erro durante login:', error);
      loading.dismiss();
      this.isLoading = false;
      this.loginError = 'Ocorreu um erro durante a autenticação. Por favor, tente novamente.';
      this.showErrorAlert(this.loginError);
    }
  }

  // Utilitário para marcar todos os campos como tocados
  markFormGroupTouched(formGroup: FormGroup) {
    Object.values(formGroup.controls).forEach(control => {
      control.markAsTouched();
      if (control instanceof FormGroup) {
        this.markFormGroupTouched(control);
      }
    });
  }

  // Alternar visibilidade da senha
  togglePasswordVisibility() {
    this.showPassword = !this.showPassword;
  }

  // Mostrar alerta de erro
  async showErrorAlert(message: string) {
    const alert = await this.alertController.create({
      header: 'Erro no Login',
      message: message,
      buttons: ['OK']
    });

    await alert.present();
  }

  // Método para navegação
  navigateTo(path: string) {
    this.router.navigate([path]);
  }
}
