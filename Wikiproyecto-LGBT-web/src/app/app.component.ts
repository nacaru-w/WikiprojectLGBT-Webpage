
import { Component, InjectionToken, NgZone, OnInit, PLATFORM_ID, effect, inject, signal } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { RouterOutlet, Router, NavigationStart, NavigationEnd, NavigationCancel, NavigationError } from '@angular/router';
import { FooterComponent } from './shared/components/footer/footer.component';
import { HeaderComponent } from './shared/components/header/header.component';
import { LoadingBarbaComponent } from './shared/components/loading-barba/loading-barba.component';
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
    RouterOutlet,
    LoadingBarbaComponent
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
  private ngZone = inject(NgZone);

  title: string = 'Wikiproyecto-LGBT-web';
  footerAnimationState = signal<string>('visible');

  // Drives the Barba navigation overlay (see app.component.html). Exposed from
  // the service so the template can read it.
  readonly navigating = this.loading.navigating;

  private loaderDismissed = false;

  // Set at NavigationStart when a navigation stays within the same top-level
  // section (e.g. switching stats sub-views), so the matching NavigationEnd can
  // also skip the overlay/footer work. Without it, intra-page sub-route switches
  // would flash the Barba overlay and blink the footer on every toggle.
  private suppressNavOverlay = false;

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
    // Scheduled outside Angular's zone so this long-lived pending timer can't
    // keep the app "unstable" and block SSR hydration from completing (NG0506).
    if (isPlatformBrowser(this.platformId)) {
      this.ngZone.runOutsideAngular(() => {
        setTimeout(() => this.ngZone.run(() => this.loading.markReady()), 12000);
      });
    }
  }

  ngOnInit() {
    this.router.events.subscribe(event => {
      if (event instanceof NavigationStart) {
        // Navigations that stay within the same top-level section (e.g. switching
        // between stats sub-views) are intra-page: don't hide the footer or flash
        // the overlay. router.url is still the previous URL at NavigationStart.
        this.suppressNavOverlay = this.sameSection(event.url, this.router.url);
        if (this.suppressNavOverlay) {
          return;
        }
        this.hideFooter();
        // Show the Barba overlay for the whole navigation — chiefly the gap
        // while a lazy route chunk (e.g. the heavy event-of-the-month page)
        // downloads, which otherwise leaves the app looking frozen.
        this.loading.startNavigation();
      } else if (event instanceof NavigationEnd) {
        if (this.suppressNavOverlay) {
          this.suppressNavOverlay = false;
        } else {
          this.loading.endNavigation();
          setTimeout(() => this.showFooter(), 500);  // Adjust the timeout if needed
        }
        // Pages that don't defer the loader (everything but the home page) are
        // ready as soon as they render, so dismiss the loader straight away.
        if (!this.routeDefersLoader()) {
          this.loading.markReady();
        }
      } else if (event instanceof NavigationCancel || event instanceof NavigationError) {
        // Aborted/failed navigation: clear the overlay so it can't get stuck on.
        this.suppressNavOverlay = false;
        this.loading.endNavigation();
        this.showFooter();
      }
    });
  }

  /** True when both URLs share the same first path segment (same top-level page). */
  private sameSection(a: string, b: string): boolean {
    const top = (url: string) => url.split(/[?#]/)[0].split('/').filter(Boolean)[0] ?? '';
    return top(a) === top(b) && top(a) !== '';
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
