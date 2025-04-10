import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

interface WorkoutSet {
  exercise: string;
  distance: number;
  repetitions: number;
  restTime: number;
  notes: string;
  partialDistances?: number[];
  partialInterval?: number;
  intensity?: string;
  equipment?: string[];
}

interface PoolWorkoutTemplate {
  id?: string;
  name: string;
  description: string;
  level: string;
  estimatedDuration: number;
  personalId: string;
  studentIds: string[];
  sets: WorkoutSet[];
  createdAt?: string;
  updatedAt?: string;
}

@Injectable({
  providedIn: 'root'
})
export class PoolWorkoutService {
  private apiUrl = `${environment.apiUrl}/pool-workouts`;

  constructor(private http: HttpClient) { }

  createPoolWorkout(workout: PoolWorkoutTemplate): Observable<{ id: string }> {
    return this.http.post<{ id: string }>(this.apiUrl, workout);
  }

  getPoolWorkoutById(id: string): Observable<PoolWorkoutTemplate> {
    return this.http.get<PoolWorkoutTemplate>(`${this.apiUrl}/${id}`);
  }

  updatePoolWorkout(workout: PoolWorkoutTemplate): Observable<void> {
    if (!workout.id) {
      throw new Error('ID do treino não fornecido');
    }
    return this.http.put<void>(`${this.apiUrl}/${workout.id}`, workout);
  }

  getPoolWorkoutsByPersonalId(personalId: string): Observable<PoolWorkoutTemplate[]> {
    return this.http.get<PoolWorkoutTemplate[]>(`${this.apiUrl}/personal/${personalId}`);
  }

  getPoolWorkoutsByStudentId(studentId: string): Observable<PoolWorkoutTemplate[]> {
    return this.http.get<PoolWorkoutTemplate[]>(`${this.apiUrl}/student/${studentId}`);
  }

  deletePoolWorkout(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}
