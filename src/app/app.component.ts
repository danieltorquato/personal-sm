import { Component } from '@angular/core';
import { IonApp, IonRouterOutlet, IonMenu, IonHeader, IonToolbar, IonTitle, IonContent, IonList, IonItem, IonIcon, IonLabel, IonMenuToggle, IonButton, IonFooter, IonSplitPane } from '@ionic/angular/standalone';
import { RouterLink } from '@angular/router';
import { addIcons } from 'ionicons';
import {
  barbell,
  person,
  home,
  people,
  analytics,
  settings,
  speedometer,
  calendar,
  fitness,
  time,
  logOut,
  water,
  create
} from 'ionicons/icons';

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  styleUrls: ['app.component.scss'],
  standalone: true,
  imports: [
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
    IonSplitPane,
    RouterLink
  ],
})
export class AppComponent {
  personalPages = [
    { title: 'Painel', url: '/personal/dashboard', icon: 'speedometer' },
    { title: 'Gerenciar Alunos', url: '/personal/manage-students', icon: 'people' },
    { title: 'Criar Treino', url: '/personal/create-workout', icon: 'barbell' },
    { title: 'Treino de Natação', url: '/personal/dynamic-pool-workout', icon: 'water' },
    { title: 'Criar Treino de Natação', url: '/personal/create-pool-workout', icon: 'create' },
    { title: 'Análise de Desempenho', url: '/personal/performance', icon: 'analytics' },
    { title: 'Configurações', url: '/personal/settings', icon: 'settings' }
  ];

  pupilPages = [
    { title: 'Painel', url: '/pupil/dashboard', icon: 'speedometer' },
    { title: 'Meu Perfil', url: '/pupil/profile', icon: 'person' },
    { title: 'Treino Atual', url: '/pupil/current-workout', icon: 'barbell' },
    { title: 'Treino de Piscina', url: '/pupil/pool-workout', icon: 'water' },
    { title: 'Histórico de Treinos', url: '/pupil/workout-history', icon: 'time' },
    { title: 'Configurações', url: '/pupil/settings', icon: 'settings' }
  ];

  constructor() {
    addIcons({
      barbell,
      person,
      home,
      people,
      analytics,
      settings,
      speedometer,
      calendar,
      fitness,
      time,
      logOut,
      water,
      create
    });
  }

  isPersonal(): boolean {
    // Lógica para verificar se o usuário é personal trainer
    // Por enquanto, vamos assumir baseado na URL
    return window.location.href.includes('/personal/');
  }

  logout() {
    // Lógica para fazer logout e redirecionar para a página de login
    window.location.href = '/auth/login';
  }
}
