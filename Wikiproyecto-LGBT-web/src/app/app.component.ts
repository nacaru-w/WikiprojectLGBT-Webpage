import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { RouterOutlet, Router, NavigationStart, NavigationEnd } from '@angular/router';
import { FooterComponent } from './shared/components/footer/footer.component';
import { HeaderComponent } from './shared/components/header/header.component';
import { slideInAnimation } from './animations';

import { ChildrenOutletContexts } from '@angular/router';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [HeaderComponent, FooterComponent, RouterOutlet, CommonModule],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
  animations: [
    slideInAnimation
  ]
})
export class AppComponent {
  title: string = 'Wikiproyecto-LGBT-web';
  showFooter: boolean = true;

  constructor(private contexts: ChildrenOutletContexts, private router: Router) {
    router.events.subscribe(event => {
      if (event instanceof NavigationStart) {
        this.showFooter = false;
      } else if (event instanceof NavigationEnd) {
        this.showFooter = true;
      }
    })
  }

  getRouteAnimationData() {
    return this.contexts.getContext('primary')?.route?.snapshot?.data?.['animation'];
  }



}
