import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class UtilsService {

  constructor() { }

  /**
   * Gera um código aleatório de caracteres alfanuméricos
   */
  generateRandomCode(length: number = 6): string {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';

    for (let i = 0; i < length; i++) {
      result += characters.charAt(Math.floor(Math.random() * characters.length));
    }

    return result;
  }

  /**
   * Formata uma data para exibição em formato local
   */
  formatDate(date: string | Date, includeTime: boolean = false): string {
    if (!date) return '';

    const options: Intl.DateTimeFormatOptions = {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    };

    if (includeTime) {
      options.hour = '2-digit';
      options.minute = '2-digit';
    }

    return new Date(date).toLocaleDateString('pt-BR', options);
  }

  /**
   * Formata um número para exibição com 2 casas decimais
   */
  formatNumber(value: number, decimals: number = 2): string {
    return value?.toFixed(decimals) || '0.00';
  }

  /**
   * Converte texto para Title Case
   */
  toTitleCase(str: string): string {
    if (!str) return '';

    return str.toLowerCase().split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }

  /**
   * Retorna uma cor baseada em um valor de 0 a 100
   * @returns Código de cor em hexadecimal
   */
  getColorByValue(value: number): string {
    // Garantir que o valor está entre 0 e 100
    const normalizedValue = Math.min(100, Math.max(0, value));

    // Vermelho para valores baixos, amarelo para médios e verde para altos
    if (normalizedValue < 50) {
      // Vermelho para amarelo (linear)
      const r = 255;
      const g = Math.round((normalizedValue / 50) * 255);
      const b = 0;
      return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
    } else {
      // Amarelo para verde (linear)
      const r = Math.round(255 - ((normalizedValue - 50) / 50) * 255);
      const g = 255;
      const b = 0;
      return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
    }
  }

  /**
   * Formata um tempo em segundos para o formato mm:ss
   */
  formatTime(timeInSeconds: number): string {
    if (!timeInSeconds && timeInSeconds !== 0) return '00:00';

    const minutes = Math.floor(timeInSeconds / 60);
    const seconds = Math.floor(timeInSeconds % 60);

    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  }

  /**
   * Calcula o ritmo médio (tempo por 100m)
   */
  calculatePace(timeInSeconds: number, distanceInMeters: number): string {
    if (!distanceInMeters || distanceInMeters === 0) return '00:00';

    const paceSeconds = (timeInSeconds / distanceInMeters) * 100;
    return this.formatTime(Math.round(paceSeconds));
  }

  /**
   * Converte milissegundos para segundos
   */
  msToSeconds(timeInMs: number): number {
    return Math.round(timeInMs / 1000);
  }

  /**
   * Obtém a data de hoje formatada para uso em inputs do tipo date
   */
  getTodayFormatted(): string {
    const today = new Date();
    const year = today.getFullYear();
    const month = (today.getMonth() + 1).toString().padStart(2, '0');
    const day = today.getDate().toString().padStart(2, '0');

    return `${year}-${month}-${day}`;
  }

  /**
   * Remove acentos de uma string
   */
  removeAccents(str: string): string {
    return str.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  }

  /**
   * Obtém iniciais de um nome
   */
  getInitials(name: string): string {
    if (!name) return '';

    const nameParts = name.split(' ').filter(part => part.length > 0);

    if (nameParts.length === 1) {
      return nameParts[0].substring(0, 2).toUpperCase();
    }

    return `${nameParts[0][0]}${nameParts[nameParts.length - 1][0]}`.toUpperCase();
  }

  /**
   * Obtém nome abreviado (primeiro e último nome)
   */
  getShortName(name: string): string {
    if (!name) return '';

    const nameParts = name.split(' ').filter(part => part.length > 0);

    if (nameParts.length === 1) {
      return nameParts[0];
    }

    return `${nameParts[0]} ${nameParts[nameParts.length - 1]}`;
  }
}
