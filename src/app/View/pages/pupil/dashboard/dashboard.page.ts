import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { RouterModule } from '@angular/router';

import {
  notificationsOutline,
  playOutline,
  calendarOutline,
  chatbubbleOutline,
  water
} from 'ionicons/icons';
import { addIcons } from 'ionicons';

@Component({
  selector: 'app-pupil-dashboard',
  templateUrl: './dashboard.page.html',
  styleUrls: ['./dashboard.page.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, FormsModule, RouterModule]
})
export class PupilDashboardPage {
  constructor() {
    addIcons({
      notificationsOutline,
      playOutline,
      calendarOutline,
      chatbubbleOutline,
      water
    });
  }
}
