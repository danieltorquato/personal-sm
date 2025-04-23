import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule, LoadingController, ToastController } from '@ionic/angular';
import { RouterModule } from '@angular/router';
import { barbell, calendar, chevronForward, time } from 'ionicons/icons';
import { addIcons } from 'ionicons';
import { WorkoutService } from 'src/app/services/workout.service';
import { AuthService } from 'src/app/services/auth.service';

@Component({
  selector: 'app-current-workout',
  templateUrl: './current-workout.page.html',
  styleUrls: ['./current-workout.page.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, FormsModule, RouterModule]
})
export class CurrentWorkoutPage implements OnInit {
  // Dados do treino
  workout: any = {
    title: 'Carregando...',
    validate_to: null,
    level: '',
    duration: '',
    created_at: new Date(),
    notes: '',
    last_parcel: '',
  };

  // IDs importantes
  studentId: number = 0;
  workoutId: number = 0;

  // Estados da página
  isLoading: boolean = true;
  error: string | null = null;
  type: string = 'gym';

  constructor(
    private workoutService: WorkoutService,
    private authService: AuthService,
    private loadingCtrl: LoadingController,
    private toastCtrl: ToastController
  ) {
    // Adicionar ícones que serão utilizados
    addIcons({
      barbell,
      time,
      calendar,
      chevronForward
    });
  }

  async ngOnInit() {
    // Obter ID do aluno logado
    await this.getCurrentUserId();

    // Carregar treino ativo
    this.loadActiveWorkout();
  }

  // Obter ID do usuário atual
  async getCurrentUserId() {
    try {
      const userData = await this.authService.getCurrentUser().toPromise();
      if (userData && userData.id) {
        this.studentId = userData.id;
        console.log('ID do aluno:', this.studentId);
      } else {
        this.error = 'Não foi possível obter os dados do usuário';
      }
    } catch (error) {
      console.error('Erro ao obter usuário atual:', error);
      this.error = 'Erro ao obter dados do usuário';
    }
  }

  // Carregar treino ativo
  async loadActiveWorkout() {
    try {
      this.isLoading = true;
      this.error = null;

      const loading = await this.loadingCtrl.create({
        message: 'Carregando seu treino...',
        spinner: 'crescent'
      });
      await loading.present();

      // Buscar o treino ativo do aluno
      this.workoutService.getActiveWorkout(this.type, this.studentId).subscribe({
        next: async (response) => {
          await loading.dismiss();
          console.log('Resposta da API getActiveWorkout:', response);

          if (response.success && response.data) {
            const workoutData = response.data as any;

            // Atualizar informações do treino na interface
            this.workout = {
              title: workoutData.name || 'Sem treino definido',
              validate_to: workoutData.validate_to || '',
              level: workoutData.level || '',
              duration: workoutData.duration || '',
              created_at: workoutData.created_at || '',
              notes: workoutData.notes || '',
              last_parcel: workoutData.last_parcel,
            };

            this.workoutId = workoutData.id || 0;
            this.isLoading = false;
          } else {
            console.error('Falha ao carregar treino ativo:', response);
            this.error = 'Não foi possível carregar seu treino ativo.';
            this.isLoading = false;
          }
        },
        error: async (err) => {
          await loading.dismiss();
          console.error('Erro ao carregar treino ativo:', err);
          this.error = 'Falha ao carregar seu treino. Tente novamente.';
          this.isLoading = false;
          this.showToast('Erro ao carregar treino. Verifique sua conexão.');
        }
      });
    } catch (error) {
      this.isLoading = false;
      console.error('Erro ao carregar treino ativo:', error);
      this.error = 'Erro inesperado ao carregar treino.';
      this.showToast('Erro ao carregar treino. Tente novamente mais tarde.');
    }
  }

  // Exibir mensagem toast
  async showToast(message: string) {
    const toast = await this.toastCtrl.create({
      message: message,
      duration: 3000,
      position: 'bottom',
      color: 'danger'
    });
    toast.present();
  }
}
