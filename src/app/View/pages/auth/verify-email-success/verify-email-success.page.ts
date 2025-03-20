import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { RouterModule } from '@angular/router';

import {
  checkmarkCircleOutline,
  logInOutline
} from 'ionicons/icons';
import { addIcons } from 'ionicons';

@Component({
  selector: 'app-verify-email-success',
  templateUrl: './verify-email-success.page.html',
  styleUrls: ['./verify-email-success.page.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, FormsModule, RouterModule]
})
export class VerifyEmailSuccessPage {
  constructor() {
    addIcons({
      checkmarkCircleOutline,
      logInOutline
    });
  }
}
