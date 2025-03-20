import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { RouterModule } from '@angular/router';

import {
  filterOutline,
  timeOutline,
  barbellOutline,
  chevronForward
} from 'ionicons/icons';
import { addIcons } from 'ionicons';

@Component({
  selector: 'app-workout-history',
  templateUrl: './workout-history.page.html',
  styleUrls: ['./workout-history.page.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, FormsModule, RouterModule]
})
export class WorkoutHistoryPage {
  constructor() {
    addIcons({
      filterOutline,
      timeOutline,
      barbellOutline,
      chevronForward
    });
  }
}
