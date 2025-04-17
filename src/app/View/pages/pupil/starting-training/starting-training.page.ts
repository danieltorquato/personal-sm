import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonContent, IonHeader, IonTitle, IonToolbar } from '@ionic/angular/standalone';
import { ActivatedRoute } from '@angular/router';
import { WorkoutService } from 'src/app/services/workout.service';

@Component({
  selector: 'app-starting-training',
  templateUrl: './starting-training.page.html',
  styleUrls: ['./starting-training.page.scss'],
  standalone: true,
  imports: [IonContent, IonHeader, IonTitle, IonToolbar, CommonModule, FormsModule]
})
export class StartingTrainingPage implements OnInit {
  workoutId: any;
  workout: any;
  constructor(private route: ActivatedRoute, private workoutService: WorkoutService) { }

  ngOnInit() {
    this.route.params.subscribe(params => {
      this.workoutId = params['id'];
    });
    this.loadWorkout();

  }
  loadWorkout() {
    this.workoutService.getSetsWorkout(this.workoutId).subscribe(workout => {
      this.workout = workout;
      console.log('estou aqui', this.workout);
    });
  }
}
