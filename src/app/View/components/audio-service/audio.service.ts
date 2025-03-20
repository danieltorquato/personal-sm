import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class AudioService {
  private audioContext: AudioContext | null = null;
  private audioElements: Map<string, HTMLAudioElement> = new Map();
  private audioLoaded: Map<string, boolean> = new Map();

  constructor() {
    try {
      // Tentar criar um AudioContext se possível
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    } catch (e) {
      console.log('Web Audio API não é suportada neste navegador.');
    }
  }

  /**
   * Pré-carrega um arquivo de áudio para uso posterior
   * @param key Identificador único para o áudio
   * @param src Caminho para o arquivo de áudio
   */
  preloadAudio(key: string, src: string): Promise<void> {
    return new Promise((resolve) => {
      const audio = new Audio();
      audio.src = src;
      audio.preload = 'auto';

      audio.oncanplaythrough = () => {
        this.audioElements.set(key, audio);
        this.audioLoaded.set(key, true);
        resolve();
      };

      audio.onerror = () => {
        console.warn(`Erro ao carregar áudio ${key}. Usando fallback.`);
        this.audioLoaded.set(key, false);
        resolve(); // Resolver mesmo com erro, para não bloquear o fluxo
      };

      // Inicia o carregamento
      audio.load();

      // Timeout para garantir que a promessa será resolvida mesmo se o evento oncanplaythrough não for disparado
      setTimeout(() => {
        if (!this.audioLoaded.has(key)) {
          console.warn(`Timeout ao carregar áudio ${key}. Usando fallback.`);
          this.audioLoaded.set(key, false);
          resolve();
        }
      }, 3000);
    });
  }

  /**
   * Reproduz um áudio previamente carregado
   * @param key Identificador do áudio
   * @param volume Volume de 0.0 a 1.0
   * @param fallbackFrequency Frequência para o beep de fallback se o áudio não foi carregado
   * @param fallbackDuration Duração em ms para o beep de fallback
   */
  play(key: string, volume: number = 1.0, fallbackFrequency: number = 800, fallbackDuration: number = 200): void {
    // Verificar se o áudio foi carregado com sucesso
    const isLoaded = this.audioLoaded.get(key);
    const audio = this.audioElements.get(key);

    if (isLoaded && audio) {
      // Cria uma cópia do elemento para permitir reproduções sobrepostas
      const clone = audio.cloneNode(true) as HTMLAudioElement;
      clone.volume = Math.max(0, Math.min(1, volume));

      clone.play().catch(error => {
        console.error(`Erro ao reproduzir áudio ${key}:`, error);
        // Fallback para Web Audio API
        this.generateBeep(fallbackFrequency, fallbackDuration, volume);
      });
    } else {
      // Use Web Audio API como fallback
      this.generateBeep(fallbackFrequency, fallbackDuration, volume);
    }
  }

  /**
   * Gera um beep via Web Audio API
   * @param frequency Frequência em Hz
   * @param duration Duração em milissegundos
   * @param volume Volume de 0.0 a 1.0
   * @param type Tipo de onda
   */
  generateBeep(frequency: number = 800, duration: number = 200, volume: number = 0.5, type: OscillatorType = 'sine'): void {
    if (!this.audioContext) {
      try {
        // Tenta criar novamente caso não tenha sido criado no construtor
        this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      } catch (e) {
        console.error('Web Audio API não é suportada neste navegador.');
        return;
      }
    }

    try {
      const oscillator = this.audioContext.createOscillator();
      const gainNode = this.audioContext.createGain();

      oscillator.type = type;
      oscillator.frequency.value = frequency;
      oscillator.connect(gainNode);

      gainNode.gain.value = volume;
      gainNode.connect(this.audioContext.destination);

      oscillator.start();
      oscillator.stop(this.audioContext.currentTime + duration / 1000);
    } catch (e) {
      console.error('Erro ao gerar beep:', e);
    }
  }

  /**
   * Toca um beep curto para contagem regressiva
   */
  playCountdownBeep(): void {
    this.play('beep-short', 0.7, 800, 100);
  }

  /**
   * Toca um beep longo para indicar final de contagem
   */
  playFinalBeep(): void {
    this.play('beep-long', 1.0, 1000, 500);
  }

  /**
   * Toca um beep para início de descanso
   */
  playStartBeep(): void {
    this.play('start', 0.8, 600, 300);
  }

  /**
   * Toca um beep para fim de descanso
   */
  playEndBeep(): void {
    this.play('end', 1.0, 1000, 400);
  }
}
