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
  selector: 'app-reset-password-success',
  templateUrl: './reset-password-success.page.html',
  styleUrls: ['./reset-password-success.page.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, FormsModule, RouterModule]
})
export class ResetPasswordSuccessPage {
  constructor() {
    addIcons({
      checkmarkCircleOutline,
      logInOutline
    });
  }
}
