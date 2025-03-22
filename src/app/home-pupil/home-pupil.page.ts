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
} from "@ionic/angular/standalone";
import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { Router } from '@angular/router';
import { RouterLink } from '@angular/router';
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
  add
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
    CommonModule,
    FormsModule
  ]
})
export class HomePupilPage implements OnInit {

  constructor(private router: Router) {
    addIcons({notificationsOutline,barbell,trendingUp,chatbubbles,book,fitnessOutline,repeatOutline,checkmarkCircleOutline,arrowForward,chatboxEllipsesOutline,add,chatbubblesOutline,cameraOutline,calendarOutline,trendingUpOutline,bookOutline,addOutline,playOutline,arrowForwardOutline,barbellOutline});
  }

  ngOnInit() {
  }

  navigateTo(page: string) {
    this.router.navigate([`/${page}`]);
  }
}
