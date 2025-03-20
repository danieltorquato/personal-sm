import { Component, OnInit } from '@angular/core';
import { IonHeader, IonToolbar, IonTitle, IonContent, IonRouterOutlet, IonApp, IonLabel, IonTabButton, IonIcon, IonTabs, IonTabBar, IonButton, IonCardContent, IonAvatar, IonCardSubtitle, IonCardHeader, IonCard, IonChip, IonItem, IonList, IonCardTitle, IonButtons, IonCol, IonRow, IonGrid, IonFooter, IonBadge, IonBackButton, IonFabButton, IonFabList, IonFab, IonMenu, IonMenuButton } from '@ionic/angular/standalone';
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
  personAddOutline
} from 'ionicons/icons';
import { Router } from '@angular/router';
@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss'],
  standalone: true,
  imports: [IonFab, IonFabList, IonFabButton, IonBackButton, IonBadge, IonFooter, IonGrid, IonRow, IonCol, IonButtons, IonCardTitle, IonList, IonItem, IonCard, IonCardHeader, IonAvatar, IonCardContent, IonButton, IonIcon, IonLabel, IonHeader, IonToolbar, IonTitle, IonContent, IonMenu, IonMenuButton, IonIcon],
})
export class HomePage implements OnInit {

  constructor(private router: Router) {
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
      personAddOutline
    });
  }

  ngOnInit() {

  }
  navigateTo(page: string) {
    this.router.navigate([`/${page}`]);
  }
}
