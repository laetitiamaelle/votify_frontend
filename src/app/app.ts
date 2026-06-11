import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet],
  // RouterOutlet affiche le composant correspondant à l'URL
  template: `<router-outlet />`
})
export class App{}