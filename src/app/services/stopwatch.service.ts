import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

export interface StopwatchState {
  time: number;
  isRunning: boolean;
  laps: number[];
}

@Injectable({
  providedIn: 'root'
})
export class StopwatchService {
  private timer: any;
  private startTime: number = 0;
  private elapsedTime: number = 0;
  private stopwatchSubject = new BehaviorSubject<StopwatchState>({
    time: 0,
    isRunning: false,
    laps: []
  });

  public stopwatch = this.stopwatchSubject.asObservable();

  constructor() { }

  /**
   * Inicia o cronômetro
   */
  start(): void {
    if (!this.stopwatchSubject.value.isRunning) {
      this.startTime = Date.now() - this.elapsedTime;
      this.timer = setInterval(() => {
        this.elapsedTime = Date.now() - this.startTime;
        this.stopwatchSubject.next({
          time: this.elapsedTime,
          isRunning: true,
          laps: this.stopwatchSubject.value.laps
        });
      }, 10); // Atualiza a cada 10ms para precisão

      this.stopwatchSubject.next({
        ...this.stopwatchSubject.value,
        isRunning: true
      });
    }
  }

  /**
   * Pausa o cronômetro
   */
  pause(): void {
    if (this.stopwatchSubject.value.isRunning) {
      clearInterval(this.timer);
      this.stopwatchSubject.next({
        ...this.stopwatchSubject.value,
        isRunning: false
      });
    }
  }

  /**
   * Reinicia o cronômetro
   */
  reset(): void {
    clearInterval(this.timer);
    this.elapsedTime = 0;
    this.stopwatchSubject.next({
      time: 0,
      isRunning: false,
      laps: []
    });
  }

  /**
   * Registra uma nova volta
   */
  lap(): void {
    const currentState = this.stopwatchSubject.value;
    if (currentState.isRunning) {
      this.stopwatchSubject.next({
        ...currentState,
        laps: [...currentState.laps, currentState.time]
      });
    }
  }

  /**
   * Formata o tempo em milissegundos para o formato mm:ss.ms
   */
  formatTime(timeInMs: number): string {
    const minutes = Math.floor(timeInMs / 60000);
    const seconds = Math.floor((timeInMs % 60000) / 1000);
    const milliseconds = Math.floor((timeInMs % 1000) / 10);

    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}.${milliseconds.toString().padStart(2, '0')}`;
  }

  /**
   * Formata o tempo em milissegundos para o formato mm:ss
   */
  formatTimeMinSec(timeInMs: number): string {
    const minutes = Math.floor(timeInMs / 60000);
    const seconds = Math.floor((timeInMs % 60000) / 1000);

    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  }

  /**
   * Calcula a diferença entre duas voltas
   */
  getLapDiff(index: number): number {
    const laps = this.stopwatchSubject.value.laps;
    if (index === 0) {
      return laps[0];
    } else {
      return laps[index] - laps[index - 1];
    }
  }

  /**
   * Obtém o tempo atual do cronômetro
   */
  getCurrentTime(): number {
    return this.stopwatchSubject.value.time;
  }

  /**
   * Verifica se o cronômetro está em execução
   */
  isRunning(): boolean {
    return this.stopwatchSubject.value.isRunning;
  }

  /**
   * Obtém as voltas registradas
   */
  getLaps(): number[] {
    return this.stopwatchSubject.value.laps;
  }
}
