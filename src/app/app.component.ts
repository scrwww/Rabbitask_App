import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { IonApp, IonRouterOutlet } from '@ionic/angular/standalone';

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  imports: [IonApp, IonRouterOutlet],
})
export class AppComponent {
  constructor(private routerTrue: Router) {}

  async reloadPage() {
    const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

    // Espera 200ms antes de recarregar
    await delay(100);
  
    // Recarrega completamente a página
    window.location.reload();
  }
}
