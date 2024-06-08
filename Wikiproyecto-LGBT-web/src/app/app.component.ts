import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { RouterOutlet, Router, NavigationStart, NavigationEnd } from '@angular/router';
import { FooterComponent } from './shared/components/footer/footer.component';
import { HeaderComponent } from './shared/components/header/header.component';
import { footerAnimations, slideInAnimation } from './animations';
import { CacheService } from './services/cache.service';

import { ChildrenOutletContexts } from '@angular/router';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    HeaderComponent,
    FooterComponent,
    RouterOutlet,
    CommonModule,
  ],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
  animations: [
    slideInAnimation, footerAnimations
  ],
  providers: [FooterComponent]
})
export class AppComponent implements OnInit {
  title: string = 'Wikiproyecto-LGBT-web';
  footerAnimationState: string = 'visible';

  constructor(
    private contexts: ChildrenOutletContexts,
    private router: Router,
    private cacheService: CacheService,
  ) { }

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
    this.footerAnimationState = 'hidden';
  }

  showFooter() {
    this.footerAnimationState = 'visible';
  }

  getRouteAnimationData() {
    return this.contexts.getContext('primary')?.route?.snapshot?.data?.['animation'];
  }
}
