import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { RouterModule } from '@angular/router';

import {
  searchOutline,
  personAdd,
  ellipsisVertical
} from 'ionicons/icons';
import { addIcons } from 'ionicons';

@Component({
  selector: 'app-manage-students',
  templateUrl: './manage-students.page.html',
  styleUrls: ['./manage-students.page.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, FormsModule, RouterModule]
})
export class ManageStudentsPage {
  constructor() {
    addIcons({
      searchOutline,
      personAdd,
      ellipsisVertical
    });
  }
}
