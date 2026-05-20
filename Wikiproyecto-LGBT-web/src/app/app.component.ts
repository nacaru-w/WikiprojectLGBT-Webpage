
import { Component, InjectionToken, OnInit, inject, signal } from '@angular/core';
import { RouterOutlet, Router, NavigationStart, NavigationEnd } from '@angular/router';
import { FooterComponent } from './shared/components/footer/footer.component';
import { HeaderComponent } from './shared/components/header/header.component';
import { footerAnimations, slideInAnimation } from './animations/animations';

import { ChildrenOutletContexts } from '@angular/router';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    HeaderComponent,
    FooterComponent,
    RouterOutlet
],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
  animations: [
    slideInAnimation, footerAnimations
  ],
  providers: [FooterComponent]
})
export class AppComponent implements OnInit {
  private contexts = inject(ChildrenOutletContexts);
  private router = inject(Router);

  title: string = 'Wikiproyecto-LGBT-web';
  footerAnimationState = signal<string>('visible');

  ngOnInit() {
    this.router.events.subscribe(event => {
      if (event instanceof NavigationStart) {
        this.hideFooter();
      } else if (event instanceof NavigationEnd) {
        setTimeout(() => this.showFooter(), 500);  // Adjust the timeout if needed
      }
    });
  }

  hideFooter() {
    this.footerAnimationState.set('hidden');
  }

  showFooter() {
    this.footerAnimationState.set('visible');
  }

  getRouteAnimationData() {
    return this.contexts.getContext('primary')?.route?.snapshot?.data?.['animation'];
  }
}
