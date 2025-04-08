import { NavbarComponent } from './../components/navbar/navbar.component';
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  IonHeader,
  IonCol,
  IonCard,
  IonCardContent,
  IonCardHeader,
  IonCardTitle,
  IonButton,
  IonRow,
  IonContent,
  IonGrid,
  IonTitle,
  IonToolbar,
  IonIcon,
  IonButtons,
  IonBadge,
  IonFab,
  IonFabButton,
  IonFabList,
  IonFooter,
  IonList,
  IonItem,
  IonLabel,
  IonAvatar,
  IonMenu,
  IonMenuButton,
  IonMenuToggle,
} from "@ionic/angular/standalone";
import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { Router } from '@angular/router';
import { RouterLink } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { AlertController } from '@ionic/angular';
import {
  notificationsOutline,
  playOutline,
  arrowForwardOutline,
  barbellOutline,
  barbell,
  trendingUpOutline,
  chatbubblesOutline,
  bookOutline,
  fitnessOutline,
  repeatOutline,
  checkmarkCircleOutline,
  chatboxEllipsesOutline,
  addOutline,
  cameraOutline,
  calendarOutline,
  arrowForward,
  trendingUp,
  chatbubbles,
  book,
  add,
  logOutOutline,
  settingsOutline,
  personOutline,
  helpCircleOutline,
  speedometerOutline,

} from 'ionicons/icons';
import { addIcons } from 'ionicons';

@Component({
  selector: 'app-home-pupil',
  templateUrl: './home-pupil.page.html',
  styleUrls: ['./home-pupil.page.scss'],
  standalone: true,
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  imports: [
    IonIcon,
    IonToolbar,
    IonTitle,
    IonGrid,
    IonContent,
    IonRow,
    IonButton,
    IonCardContent,
    IonCardHeader,
    IonCardTitle,
    IonCard,
    IonCol,
    IonHeader,
    IonButtons,
    IonBadge,
    IonFab,
    IonFabButton,
    IonFabList,
    IonFooter,
    IonList,
    IonItem,
    IonLabel,
    IonAvatar,
    RouterLink,
    IonMenu,
    IonMenuButton,
    IonMenuToggle,
    CommonModule,
    FormsModule,
    NavbarComponent
  ]
})
export class HomePupilPage implements OnInit {
  userName: string = 'Aluno';

  constructor(
    private router: Router,
    private authService: AuthService,
    private alertController: AlertController
  ) {
    addIcons({
      notificationsOutline,
      barbell,
      trendingUp,
      chatbubbles,
      book,
      fitnessOutline,
      repeatOutline,
      checkmarkCircleOutline,
      arrowForward,
      chatboxEllipsesOutline,
      add,
      chatbubblesOutline,
      cameraOutline,
      calendarOutline,
      trendingUpOutline,
      bookOutline,
      addOutline,
      playOutline,
      arrowForwardOutline,
      barbellOutline,
      logOutOutline,
      settingsOutline,
      personOutline,
      helpCircleOutline,
      speedometerOutline
    });
  }

  ngOnInit() {
    // Recuperar informações do usuário logado
    this.authService.getCurrentUser().subscribe(currentUser => {
      if (currentUser) {
        this.userName = currentUser.name;
      }
    });
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
