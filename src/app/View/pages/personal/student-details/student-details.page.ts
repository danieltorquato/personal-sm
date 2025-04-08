import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule, LoadingController, ToastController, AlertController } from '@ionic/angular';
import { ActivatedRoute, Router } from '@angular/router';
import { PersonalService } from 'src/app/services/personal.service';
import { WorkoutService } from 'src/app/services/workout.service';
import { addIcons } from 'ionicons';
import {
  arrowBack,
  calendarOutline,
  callOutline,
  mailOutline,
  fitnessOutline,
  timeOutline,
  ribbonOutline,
  barChartOutline,
  personOutline,
  documentsOutline,
  createOutline,
  chatbubblesOutline,
  logoWhatsapp,
  addCircleOutline,
  eyeOutline,
  trendingUpOutline,
  statsChartOutline,
  closeCircleOutline,
  checkmarkCircleOutline,
  trashOutline,
  add
} from 'ionicons/icons';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { AuthService } from 'src/app/services/auth.service';
import { environment } from 'src/environments/environment';
import { UserService } from '../../../../services/user.service';
import { REMOVE_STYLES_ON_COMPONENT_DESTROY } from '@angular/platform-browser';

interface Student {
  id: number;
  name: string;
  photo?: string;
  email?: string;
  phone?: string;
  birth_date?: string;
  level_training_musc?: string;
  status: 'active' | 'inactive';
  created_at: string;
  address?: string;
  emergencyContact?: string;
  medicalNotes?: string;
  goals?: string;
  observations?: string;
  street: string;
  number: string;
  complement?: string;
  neighborhood: string;
  city: string;
  state: string;
  postal_code: string;
}

interface Workout {
  id: number;
  title: string;
  status: 'em_andamento' | 'concluido' | 'pendente' | 'cancelado';
  totalDistance: number;
  totalSeries: number;
  progress: number;
  date: string;
  description?: string;
}

interface WorkoutSession {
  id: number;
  workoutId: number;
  title: string;
  date: string;
  duration: number;
  distance: number;
  calories: number;
  avgPace: number;
  feedback?: string;
}

interface PerformanceMetric {
  name: string;
  current: string | number;
  previous: string | number;
  change: number;
  isPositive: boolean;
}

@Component({
  selector: 'app-student-details',
  templateUrl: './student-details.page.html',
  styleUrls: ['./student-details.page.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, FormsModule]
})
export class StudentDetailsPage implements OnInit {
  studentId: any;
  student: Student | null = null;
  students: any[] = []; // Array original de alunos
  loading = true;
  error = false;

  // Segmentos e seu conteúdo
  currentSegment = 'information';
  activeWorkouts: Workout[] = [];
  recentWorkouts: Workout[] = [];
  recentSessions: WorkoutSession[] = [];
  performanceMetrics: PerformanceMetric[] = [];

  // Dados dos gráficos
  paceTrendData = [
    { value: 2.1, label: 'Jan' },
    { value: 2.0, label: 'Fev' },
    { value: 1.9, label: 'Mar' },
    { value: 1.85, label: 'Abr' },
    { value: 1.8, label: 'Mai' },
    { value: 1.75, label: 'Jun' },
  ];

  distanceTrendData = [
    { value: 1500, label: 'Jan' },
    { value: 2000, label: 'Fev' },
    { value: 1800, label: 'Mar' },
    { value: 2500, label: 'Abr' },
    { value: 2200, label: 'Mai' },
    { value: 3000, label: 'Jun' },
  ];

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private personalService: PersonalService,
    private workoutService: WorkoutService,
    private loadingController: LoadingController,
    private toastController: ToastController,
    private alertController: AlertController,
    private http: HttpClient,
    private authService: AuthService,
    private userService: UserService
  ) {
    // Adicionar ícones
    addIcons({
      arrowBack,
      calendarOutline,
      callOutline,
      mailOutline,
      fitnessOutline,
      timeOutline,
      ribbonOutline,
      barChartOutline,
      personOutline,
      documentsOutline,
      createOutline,
      chatbubblesOutline,
      logoWhatsapp,
      addCircleOutline,
      eyeOutline,
      trendingUpOutline,
      statsChartOutline,
      closeCircleOutline,
      checkmarkCircleOutline,
      trashOutline,
      add
    });
  }
active = 0; // Variável para controlar o status do aluno
  ngOnInit() {
    this.route.paramMap.subscribe(params => {
      const idParam = params.get('id');

      if (idParam) {
        this.studentId = +idParam;
        this.loadStudentDetails();
      } else {
        this.handleError('ID do aluno não encontrado');
      }
    });
  }

  segmentChanged(event: any) {
    this.currentSegment = event.detail.value;
  }

  async loadStudentDetails() {
    this.loading = true;
    this.error = false;

    try {
      // Simulação de carregamento - substitua por chamada de API real
      await this.simulateLoading(1000);

    this.personalService.getPupilDetails(this.studentId).subscribe(
        (response: any) => {
          if (response && response.status) {
            this.student = response.data;
            this.active = response.data.active;
            console.log('Detalhes do aluno:', this.student);
          } else {
            this.handleError('Erro ao obter detalhes do aluno');
          }
        }
      );
      this.activeWorkouts = [
        {
          id: 1,
          title: 'Treino de resistência',
          status: 'em_andamento',
          totalDistance: 2000,
          totalSeries: 8,
          progress: 75,
          date: '2023-06-15',
          description: 'Foco em séries longas com respiração bilateral'
        },
        {
          id: 2,
          title: 'Técnica de crawl',
          status: 'pendente',
          totalDistance: 1500,
          totalSeries: 6,
          progress: 0,
          date: '2023-06-20',
          description: 'Aprimoramento da braçada e respiração'
        }
      ];

      this.recentWorkouts = [
        {
          id: 3,
          title: 'Treino intervalado',
          status: 'concluido',
          totalDistance: 1800,
          totalSeries: 10,
          progress: 100,
          date: '2023-06-10',
          description: 'Séries de alta intensidade com recuperação ativa'
        },
        {
          id: 4,
          title: 'Técnica de pernada',
          status: 'concluido',
          totalDistance: 1200,
          totalSeries: 5,
          progress: 100,
          date: '2023-06-05',
          description: 'Exercícios específicos para pernada e ondulação'
        }
      ];

      this.recentSessions = [
        {
          id: 101,
          workoutId: 3,
          title: 'Treino intervalado',
          date: '2023-06-10',
          duration: 45,
          distance: 1800,
          calories: 450,
          avgPace: 1.8,
          feedback: 'Bom desempenho nas séries, atenção à respiração'
        },
        {
          id: 102,
          workoutId: 4,
          title: 'Técnica de pernada',
          date: '2023-06-05',
          duration: 30,
          distance: 1200,
          calories: 300,
          avgPace: 1.95,
          feedback: 'Melhorou a posição do quadril, foco na flexibilidade dos tornozelos'
        }
      ];

      this.performanceMetrics = [
        {
          name: 'Ritmo médio (min/100m)',
          current: '1:45',
          previous: '1:52',
          change: -7,
          isPositive: true
        },
        {
          name: 'Distância semanal (m)',
          current: 3800,
          previous: 3000,
          change: 27,
          isPositive: true
        },
        {
          name: 'Frequência semanal',
          current: 3,
          previous: 2,
          change: 50,
          isPositive: true
        },
        {
          name: 'Tempo médio sessão (min)',
          current: 45,
          previous: 40,
          change: 12.5,
          isPositive: true
        }
      ];

    } catch (error) {
      this.handleError('Erro ao carregar dados do aluno');
      console.error(error);
    } finally {
      this.loading = false;
    }
  }

  async simulateLoading(time: number): Promise<void> {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve();
      }, time);
    });
  }

  handleError(message: string) {
    this.error = true;
    this.loading = false;
    this.presentToast(message, 'danger');
  }

  async presentToast(message: string, color: string = 'danger') {
    const toast = await this.toastController.create({
      message,
      duration: 3000,
      color
    });
    await toast.present();
  }

  async assignWorkout() {
    const alert = await this.alertController.create({
      header: 'Atribuir Treino',
      message: 'Deseja atribuir um novo treino para este aluno?',
      buttons: [
        {
          text: 'Cancelar',
          role: 'cancel'
        },
        {
          text: 'Atribuir',
          handler: () => {
            this.router.navigate(['/personal/create-pool-workout'], {
              queryParams: { studentId: this.studentId }
            });
          }
        }
      ]
    });

    await alert.present();
  }

  viewWorkoutDetails(workoutId: number) {
    this.router.navigate(['/personal/workout-details', workoutId]);
  }

  viewWorkoutHistory() {
    if (this.student) {
      this.router.navigate(['/personal/student-workouts', this.studentId]);
    }
  }

  getInitials(name: string): string {
    if (!name) return '';

    return name
      .split(' ')
      .map(n => n[0])
      .slice(0, 2)
      .join('')
      .toUpperCase();
  }

  calculateAge(birthdate: string): number {
    if (!birthdate) return 0;

    const today = new Date();
    const birthDate = new Date(birthdate);
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();

    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }

    return age;
  }

  formatDate(date: string): string {
    if (!date) return '';

    return new Date(date).toLocaleDateString('pt-BR');
  }

  formatDistance(distance: number): string {
    if (distance >= 1000) {
      return (distance / 1000).toFixed(1) + ' km';
    }
    return distance + ' m';
  }

  formatDuration(minutes: number): string {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;

    if (hours > 0) {
      return `${hours}h ${mins}min`;
    }
    return `${mins} min`;
  }

  formatPace(pace: number): string {
    const minutes = Math.floor(pace);
    const seconds = Math.round((pace - minutes) * 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}/100m`;
  }

  calculateBarHeight(value: number, max: number): string {
    const percentage = (value / max) * 100;
    return `${Math.max(percentage, 5)}%`;
  }

  getWhatsAppLink(phone: string | undefined): string {
    if (!phone) return '';
    // Remove caracteres não numéricos
    const cleanPhone = phone.replace(/\D/g, '');
    return `https://wa.me/55${cleanPhone}`;
  }

  getAbsoluteValue(value: number): number {
    return Math.abs(value);
  }

  async editStudent() {
    if (!this.student) return;

    this.router.navigate(['/personal/edit-student', this.studentId]);
  }

  async refreshData(event: any) {
    await this.loadStudentDetails();
    event.target.complete();
  }

  async toggleStudentStatus() {
    if (!this.student) return;

    const alert = await this.alertController.create({
      header: 'Confirmar ação',
      message: `Deseja ${this.active === 1 ? 'inativar' : 'ativar'} este aluno?`,
      buttons: [
        {
          text: 'Cancelar',
          role: 'cancel'
        },
        {
          text: 'Confirmar',
          handler: async () => {
            try {
              if (!this.student) return;

              const newStatus = this.active === 1 ? 0 : 1;
              const response = await this.userService.updateStudentStatus(this.student.id, newStatus).toPromise();

              if (response && response.success) {
                this.active = newStatus;
                this.presentToast(`Aluno ${newStatus === 1 ? 'ativado' : 'inativado'} com sucesso!`);
              } else {
                this.presentToast('Erro ao atualizar status do aluno', 'danger');
              }
            } catch (error) {
              console.error('Erro ao atualizar status:', error);
              this.presentToast('Erro ao atualizar status do aluno', 'danger');
            }
          }
        }
      ]
    });

    await alert.present();
  }

  async confirmDelete() {
    if (!this.student) return;

    const alert = await this.alertController.create({
      header: 'Confirmar exclusão',
      message: 'Tem certeza que deseja excluir este aluno? Esta ação não pode ser desfeita.',
      buttons: [
        {
          text: 'Cancelar',
          role: 'cancel'
        },
        {
          text: 'Excluir',
          cssClass: 'danger',
          handler: async () => {
            try {
              if (!this.student) return;

              const response = await this.userService.deleteStudent(this.student.id).toPromise();

              if (response && response.success) {
                this.presentToast('Aluno excluído com sucesso!');
                this.router.navigate(['/personal/students']);
              } else {
                this.presentToast('Erro ao excluir aluno', 'danger');
              }
            } catch (error) {
              console.error('Erro ao excluir aluno:', error);
              this.presentToast('Erro ao excluir aluno', 'danger');
            }
          }
        }
      ]
    });

    await alert.present();
  }
}

