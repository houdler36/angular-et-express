import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class NumbersToWordsService {

  private units = ['', 'un', 'deux', 'trois', 'quatre', 'cinq', 'six', 'sept', 'huit', 'neuf'];
  private teens = ['', 'onze', 'douze', 'treize', 'quatorze', 'quinze', 'seize'];
  private tens = ['', 'dix', 'vingt', 'trente', 'quarante', 'cinquante', 'soixante', 'soixante-dix', 'quatre-vingt', 'quatre-vingt-dix'];

  public convertNumberToWords(num: number): string {
    if (num === 0) {
      return 'zéro';
    }
    if (num < 0) {
      return 'moins ' + this.convert(Math.abs(num));
    }
    return this.convert(num);
  }

  private convert(num: number): string {
    if (num < 10) {
      return this.units[num];
    }
    if (num >= 11 && num <= 16) {
      return this.teens[num - 10];
    }
    if (num < 20) {
      return this.tens[1] + (this.units[num % 10] === 'un' ? '' : '-') + this.units[num % 10];
    }
    if (num < 70) {
      return this.tens[Math.floor(num / 10)] + (num % 10 !== 0 ? '-' + this.units[num % 10] : '');
    }
    if (num < 80) {
      return 'soixante-' + this.convert(num - 60);
    }
    if (num < 90) {
      const unit = num % 10;
      return 'quatre-vingt' + (unit === 0 ? 's' : '-' + this.units[unit]);
    }
    if (num < 100) {
      return 'quatre-vingt-' + this.convert(num - 80);
    }
    if (num < 1000) {
      return this.convertHundreds(num);
    }
    if (num < 1000000) {
      return this.convertThousands(num);
    }
    // ✅ Logique pour les millions
    if (num < 1000000000) {
      const millions = Math.floor(num / 1000000);
      const remainder = num % 1000000;
      let result = this.convert(millions) + ' million' + (millions > 1 ? 's' : '');
      if (remainder > 0) {
        result += ' ' + this.convert(remainder);
      }
      return result;
    }
    // ✅ Logique pour les milliards et plus
    if (num < 1000000000000) {
      const billions = Math.floor(num / 1000000000);
      const remainder = num % 1000000000;
      let result = this.convert(billions) + ' milliard' + (billions > 1 ? 's' : '');
      if (remainder > 0) {
        result += ' ' + this.convert(remainder);
      }
      return result;
    }

    // Gère les nombres encore plus grands
    return 'nombre trop grand';
  }
  
  private convertHundreds(num: number): string {
    const hundred = Math.floor(num / 100);
    const remainder = num % 100;
    let result = (hundred > 1 ? this.units[hundred] + ' ' : '') + 'cent';
    if (remainder === 0 && hundred > 1) {
      result += 's';
    }
    if (remainder > 0) {
      result += ' ' + this.convert(remainder);
    }
    return result;
  }
  
  private convertThousands(num: number): string {
    const thousands = Math.floor(num / 1000);
    const remainder = num % 1000;
    let result = (thousands === 1 ? '' : this.convert(thousands) + ' ') + 'mille';
    if (remainder > 0) {
      result += ' ' + this.convert(remainder);
    }
    return result;
  }
}