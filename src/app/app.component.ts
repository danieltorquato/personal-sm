import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet } from '@angular/router';
import { IonRouterOutlet } from "@ionic/angular/standalone";

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [IonRouterOutlet,
    CommonModule,
    RouterOutlet,
  ],
  providers: [

  ],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit {

  constructor() {

  }

  ngOnInit() {

  }


}
