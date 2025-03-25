import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet } from '@angular/router';
import { HttpClientModule } from '@angular/common/http';
import {
  IonApp, IonRouterOutlet, IonMenu, IonHeader, IonToolbar,
  IonTitle, IonContent, IonList, IonItem, IonIcon, IonLabel,
  IonMenuToggle, IonButton, IonFooter, IonSplitPane
} from '@ionic/angular/standalone';
import { RouterLink } from '@angular/router';
import { addIcons } from 'ionicons';
import {
  person,
  home,
  fitness,
  barbell,
  people,
  logOut,
  speedometer,
  settings,
  calendar,
  analytics,
  medal,
  add,
  create
} from 'ionicons/icons';

import { ApiService } from './services/api.service';
import { AuthService } from './services/auth.service';
import { WorkoutService } from './services/workout.service';
import { UserService } from './services/user.service';
import { WorkoutSessionService } from './services/workout-session.service';
import { StopwatchService } from './services/stopwatch.service';
import { UtilsService } from './services/utils.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    CommonModule,
    RouterOutlet,
    HttpClientModule,
    RouterLink,
    IonApp,
    IonRouterOutlet,
    IonMenu,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonList,
    IonItem,
    IonIcon,
    IonLabel,
    IonMenuToggle,
    IonButton,
    IonFooter,
    IonSplitPane
  ],
  providers: [
    ApiService,
    AuthService,
    WorkoutService,
    UserService,
    WorkoutSessionService,
    StopwatchService,
    UtilsService
  ],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit {
  personalPages = [
    { title: 'Painel', url: '/personal/dashboard', icon: 'speedometer' },
    { title: 'Alunos', url: '/personal/alunos', icon: 'people' },
    { title: 'Treinos', url: '/personal/treinos', icon: 'barbell' },
    { title: 'Agenda', url: '/personal/agenda', icon: 'calendar' },
    { title: 'Estatísticas', url: '/personal/estatisticas', icon: 'analytics' },
    { title: 'Configurações', url: '/personal/configuracoes', icon: 'settings' }
  ];

  studentPages = [
    { title: 'Painel', url: '/aluno/dashboard', icon: 'speedometer' },
    { title: 'Meus Treinos', url: '/aluno/treinos', icon: 'barbell' },
    { title: 'Histórico', url: '/aluno/historico', icon: 'analytics' },
    { title: 'Evolução', url: '/aluno/evolucao', icon: 'medal' },
    { title: 'Perfil', url: '/aluno/perfil', icon: 'person' }
  ];

  constructor(private authService: AuthService) {
    addIcons({
      barbell,
      person,
      home,
      fitness,
      people,
      logOut,
      speedometer,
      settings,
      calendar,
      analytics,
      medal,
      add,
      create
    });
  }

  ngOnInit() {
    // Verificar se o usuário está autenticado ao iniciar o aplicativo
    this.authService.checkAuth();
  }

  isPersonal(): boolean {
    return this.authService.isTrainer();
  }

  isStudent(): boolean {
    return this.authService.isStudent();
  }

  getNavItems() {
    if (this.isPersonal()) {
      return this.personalPages;
    } else if (this.isStudent()) {
      return this.studentPages;
    }
    return [];
  }

  logout() {
    this.authService.logout();
  }
}
