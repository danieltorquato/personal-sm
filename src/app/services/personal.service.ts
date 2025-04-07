import { Observable } from 'rxjs';
import { Injectable } from '@angular/core';
import { User } from '../Models/user.model';
import { environment } from 'src/environments/environment';
import { HttpClient } from '@angular/common/http';


@Injectable({
  providedIn: 'root'
})
export class PersonalService {
  private apiUrl = environment.apiUrl; // Ajuste conforme necessário para sua API

  constructor(private http: HttpClient) { }

getPupils(): Observable<any[]> {
  const endpoint = `${this.apiUrl}/personal/pupils`;
  console.log('Tentando obter alunos na API:', endpoint);
  return this.http.get<any[]>(endpoint);
}
}
