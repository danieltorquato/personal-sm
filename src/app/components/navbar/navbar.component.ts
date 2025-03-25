import { AuthService } from './../../services/auth.service';
import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { IonLabel, IonItem, IonIcon, IonContent, IonList, IonTitle, IonToolbar, IonHeader, IonMenu } from "@ionic/angular/standalone";

@Component({
  selector: 'app-navbar',
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.scss'],
  standalone: true,
  imports: [IonHeader, IonToolbar, IonTitle,
    IonContent,
    IonList,
    IonItem,
    IonLabel,
    IonIcon,
    IonMenu
  ]
})
export class NavbarComponent  implements OnInit {
user: any;
userName : string = ''
userType : string = ''
  constructor(private auth: AuthService, private router: Router) { }

  ngOnInit() {
    const currentUser = this.auth.currentUser;
    if (currentUser !== null && currentUser !== undefined) {
      this.user = currentUser;
      this.userName = currentUser.name;
      this.userType = currentUser.userType;
    } else {
      console.error('Current user is null or undefined.');
    }
  }
logout(){
  this.auth.logout();
  this.user = null;
  this.router.navigate(['/login']);
}
}
