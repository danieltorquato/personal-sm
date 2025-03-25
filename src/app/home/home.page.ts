import { Component, OnInit } from '@angular/core';
import { IonHeader, IonToolbar, IonTitle, IonContent, IonRouterOutlet, IonApp, IonLabel, IonTabButton, IonIcon, IonTabs, IonTabBar, IonButton, IonCardContent, IonAvatar, IonCardSubtitle, IonCardHeader, IonCard, IonChip, IonItem, IonList, IonCardTitle, IonButtons, IonCol, IonRow, IonGrid, IonFooter, IonBadge, IonBackButton, IonFabButton, IonFabList, IonFab, IonMenu, IonMenuButton, IonMenuToggle } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  notificationsOutline,
  arrowForwardOutline,
  people,
  barbell,
  library,
  chatbubbles,
  calendarOutline,
  timeOutline,
  fitnessOutline,
  waterOutline,
  eyeOutline,
  arrowForward,
  chatboxEllipsesOutline,
  add,
  personAddOutline,
  logOutOutline,
  settingsOutline,
  personOutline,
  helpCircleOutline,
  speedometerOutline
} from 'ionicons/icons';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { CommonModule } from '@angular/common';
import { AlertController } from '@ionic/angular';
import { RouterLink } from '@angular/router';
import { NavbarComponent } from '../components/navbar/navbar.component';

@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    IonFab,
    IonFabList,
    IonFabButton,
    IonBackButton,
    IonBadge,
    IonFooter,
    IonGrid,
    IonRow,
    IonCol,
    IonButtons,
    IonCardTitle,
    IonList,
    IonItem,
    IonCard,
    IonCardHeader,
    IonAvatar,
    IonCardContent,
    IonButton,
    IonIcon,
    IonLabel,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonMenu,
    IonMenuButton,
    IonMenuToggle,
    NavbarComponent
  ],
})
export class HomePage implements OnInit {
  userName: string = 'Personal';
  userType: string = '';

  constructor(
    private router: Router,
    private authService: AuthService,
    private alertController: AlertController
  ) {
    addIcons({
      notificationsOutline,
      arrowForwardOutline,
      people,
      barbell,
      library,
      chatbubbles,
      calendarOutline,
      timeOutline,
      fitnessOutline,
      waterOutline,
      eyeOutline,
      arrowForward,
      chatboxEllipsesOutline,
      add,
      personAddOutline,
      logOutOutline,
      settingsOutline,
      personOutline,
      helpCircleOutline,
      speedometerOutline
    });
  }

  ngOnInit() {
    // Recuperar informações do usuário logado
    const currentUser = this.authService.getCurrentUser();
    if (currentUser) {
      this.userName = currentUser.name;
      this.userType = currentUser.userType === 'personal' ? 'Personal Trainer' : 'Administrador';
    }
  }

  navigateTo(page: string) {
    try {
      console.log(`Navegando para: ${page}`);
      this.router.navigate([page]).then(() => {
        console.log('Navegação bem-sucedida');
      }).catch(error => {
        console.error('Erro na navegação:', error);
      });
    } catch (error) {
      console.error('Erro ao tentar navegar:', error);
    }
  }

  async logout() {
    console.log('Realizando logout...');
    const alert = await this.alertController.create({
      header: 'Confirmar Logout',
      message: 'Tem certeza que deseja sair?',
      buttons: [
        {
          text: 'Cancelar',
          role: 'cancel',
          handler: () => {
            console.log('Logout cancelado');
          }
        }, {
          text: 'Sair',
          handler: () => {
            console.log('Realizando logout...');
            this.authService.logout();
          }
        }
      ]
    });

    await alert.present();
  }
}
