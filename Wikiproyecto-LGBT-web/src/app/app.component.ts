
import { Component, InjectionToken, OnInit, PLATFORM_ID, effect, inject, signal } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { RouterOutlet, Router, NavigationStart, NavigationEnd } from '@angular/router';
import { FooterComponent } from './shared/components/footer/footer.component';
import { HeaderComponent } from './shared/components/header/header.component';
import { footerAnimations, slideInAnimation } from './animations/animations';
import { LoadingService } from './services/loading.service';
import { TranslateService } from '@ngx-translate/core';
import { SUPPORTED_LANGS } from './services/i18n/i18n.config';

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
  private loading = inject(LoadingService);
  private platformId = inject(PLATFORM_ID);
  private translate = inject(TranslateService);

  title: string = 'Wikiproyecto-LGBT-web';
  footerAnimationState = signal<string>('visible');

  private loaderDismissed = false;

  constructor() {
    // Register the supported languages and load the default one. Injecting
    // TranslateService here (the root component) triggers its initial load
    // during the SSR render phase, where the disk-path token is available and
    // the dictionary can be written to TransferState for the browser.
    this.translate.addLangs([...SUPPORTED_LANGS]);

    // Fade out the initial loading screen (declared in index.html) once the
    // active page reports it is ready, then remove it from the DOM. Runs only
    // in the browser, so `document` is safe to use inside dismissLoader().
    effect(() => {
      const ready = this.loading.ready();
      if (this.loaderDismissed || !isPlatformBrowser(this.platformId) || !ready) {
        return;
      }
      this.loaderDismissed = true;
      this.dismissLoader();
    });

    // Safety net: never let the loader hang if a page's data never arrives.
    if (isPlatformBrowser(this.platformId)) {
      setTimeout(() => this.loading.markReady(), 12000);
    }
  }

  ngOnInit() {
    this.router.events.subscribe(event => {
      if (event instanceof NavigationStart) {
        this.hideFooter();
      } else if (event instanceof NavigationEnd) {
        setTimeout(() => this.showFooter(), 500);  // Adjust the timeout if needed
        // Pages that don't defer the loader (everything but the home page) are
        // ready as soon as they render, so dismiss the loader straight away.
        if (!this.routeDefersLoader()) {
          this.loading.markReady();
        }
      }
    });
  }

  private routeDefersLoader(): boolean {
    return !!this.contexts.getContext('primary')?.route?.snapshot?.data?.['deferLoader'];
  }

  private dismissLoader(): void {
    const loader = document.getElementById('app-loading');
    if (!loader) {
      this.loading.markLoaderGone();
      return;
    }
    let finished = false;
    const done = () => {
      if (finished) {
        return;
      }
      finished = true;
      loader.remove();
      this.loading.markLoaderGone();
    };
    loader.classList.add('app-loading--hidden');
    loader.addEventListener('transitionend', done, { once: true });
    // Fallback in case the transition never fires (e.g. reduced motion).
    setTimeout(done, 800);
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
