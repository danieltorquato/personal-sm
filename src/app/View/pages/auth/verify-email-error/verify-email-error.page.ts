import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { RouterModule } from '@angular/router';

import {
  alertCircleOutline,
  refreshOutline,
  arrowBackOutline
} from 'ionicons/icons';
import { addIcons } from 'ionicons';

@Component({
  selector: 'app-verify-email-error',
  templateUrl: './verify-email-error.page.html',
  styleUrls: ['./verify-email-error.page.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, FormsModule, RouterModule]
})
export class VerifyEmailErrorPage {
  constructor() {
    addIcons({
      alertCircleOutline,
      refreshOutline,
      arrowBackOutline
    });
  }
}
