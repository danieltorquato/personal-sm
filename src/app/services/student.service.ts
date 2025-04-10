import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface Student {
  id: string;
  name: string;
  avatar: string;
  email: string;
  phone: string;
  personalId: string;
  category: string;
  birthDate?: string;
  height?: number;
  weight?: number;
  createdAt?: string;
  updatedAt?: string;
  selected?: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class StudentService {
  private apiUrl = `${environment.apiUrl}/students`;

  constructor(private http: HttpClient) { }

  getStudentsByPersonalId(personalId: string): Observable<Student[]> {
    return this.http.get<Student[]>(`${this.apiUrl}/personal/${personalId}`);
  }

  getStudentById(studentId: string): Observable<Student> {
    return this.http.get<Student>(`${this.apiUrl}/${studentId}`);
  }

  addStudent(student: Omit<Student, 'id'>): Observable<{ id: string }> {
    return this.http.post<{ id: string }>(this.apiUrl, student);
  }

  updateStudent(student: Student): Observable<void> {
    return this.http.put<void>(`${this.apiUrl}/${student.id}`, student);
  }

  deleteStudent(studentId: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${studentId}`);
  }
}
