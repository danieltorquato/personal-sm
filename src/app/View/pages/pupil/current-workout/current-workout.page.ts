import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { RouterModule } from '@angular/router';

import {
  timerOutline,
  fitnessOutline,
  timeOutline,
  flameOutline,
  barbellOutline,
  repeatOutline,
  checkmarkCircle,
  ellipseOutline,
  informationCircleOutline,
  play,
  pauseCircleOutline,
  checkmarkCircleOutline
} from 'ionicons/icons';
import { addIcons } from 'ionicons';

@Component({
  selector: 'app-current-workout',
  templateUrl: './current-workout.page.html',
  styleUrls: ['./current-workout.page.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, FormsModule, RouterModule]
})
export class CurrentWorkoutPage implements OnInit {

  // Workout data (could be fetched from a service)
  workout = {
    title: 'Treino de Membros Superiores',
    subtitle: 'Foco em Força e Hipertrofia',
    level: 'Avançado',
    duration: '45 min',
    calories: '350 cal',
    progress: {
      completed: 3,
      total: 8,
      percent: 37
    },
    exercises: [
      {
        name: 'Supino Reto',
        sets: 4,
        reps: 12,
        weight: '70kg',
        status: 'completed'
      },
      {
        name: 'Supino Inclinado',
        sets: 3,
        reps: 10,
        weight: '22kg',
        status: 'completed'
      },
      {
        name: 'Crucifixo',
        sets: 3,
        reps: 15,
        weight: '15kg',
        status: 'completed'
      },
      {
        name: 'Puxada Frontal',
        sets: 4,
        reps: 12,
        weight: '65kg',
        status: 'current'
      },
      {
        name: 'Remada Sentada',
        sets: 3,
        reps: 12,
        weight: '60kg',
        status: 'upcoming'
      },
      {
        name: 'Rosca Direta',
        sets: 3,
        reps: 12,
        weight: '15kg',
        status: 'upcoming'
      },
      {
        name: 'Tríceps Corda',
        sets: 3,
        reps: 15,
        weight: '25kg',
        status: 'upcoming'
      },
      {
        name: 'Desenvolvimento',
        sets: 3,
        reps: 10,
        weight: '18kg',
        status: 'upcoming'
      }
    ],
    timer: {
      minutes: 45,
      seconds: 0
    }
  };

  // Workout timer
  timerInterval: any;
  remainingTime: string = '45:00';

  constructor() {
    // Add Ionicons
    addIcons({
      timerOutline,
      fitnessOutline,
      timeOutline,
      flameOutline,
      barbellOutline,
      repeatOutline,
      checkmarkCircle,
      ellipseOutline,
      informationCircleOutline,
      play,
      pauseCircleOutline,
      checkmarkCircleOutline
    });
  }

  ngOnInit() {
    // Start workout timer
    this.startTimer();
  }

  ngOnDestroy() {
    // Clean up timer when component is destroyed
    this.pauseTimer();
  }

  startTimer() {
    // Clear any existing timer
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
    }

    // Start a new timer that updates every second
    let minutes = this.workout.timer.minutes;
    let seconds = this.workout.timer.seconds;

    this.timerInterval = setInterval(() => {
      if (seconds === 0) {
        if (minutes === 0) {
          // Timer completed
          this.pauseTimer();
          return;
        }
        minutes--;
        seconds = 59;
      } else {
        seconds--;
      }

      // Update the display time
      this.remainingTime = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }, 1000);
  }

  pauseTimer() {
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
      this.timerInterval = null;
    }
  }

  resumeTimer() {
    this.startTimer();
  }

  startExercise(exercise: any) {
    // Logic to start the selected exercise
    console.log('Iniciando exercício:', exercise.name);
  }

  viewExerciseDetails(exercise: any) {
    // Logic to view exercise details
    console.log('Visualizando detalhes para:', exercise.name);
  }

  completeWorkout() {
    // Logic to complete the workout
    console.log('Treino completado!');
    // Navigate to workout summary or back to home
  }
}
