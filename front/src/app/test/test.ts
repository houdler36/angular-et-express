import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  standalone: true,
  imports: [CommonModule],
  template: `<h1 style="color: red; margin: 20px;">TEST COMPOSANT FONCTIONNEL</h1>`,
})
export class Test {}