import { Injectable, signal } from '@angular/core';

/**
 * Coordinates the initial "Barba" loading screen (declared in index.html) with
 * the page that is loading underneath it.
 *
 * Flow on first load:
 *  1. The loader is visible while a page fetches its data.
 *  2. The page calls `markReady()` once its data has arrived.
 *  3. AppComponent fades the loader out and, when the fade finishes, calls
 *     `markLoaderGone()`.
 *  4. The page waits for `loaderGone()` before playing its intro animation, so
 *     the loader and the appearing content never overlap.
 *
 * Separately, `navigating` tracks in-app route changes *after* that first load:
 * it's true between NavigationStart and the navigation settling. AppComponent
 * uses it to show a Barba overlay while a lazy route chunk downloads (e.g. the
 * heavy event-of-the-month page), so a slow navigation never looks frozen.
 */
@Injectable({
  providedIn: 'root'
})
export class LoadingService {
  // Set once the active page's data is ready and the loader may fade out.
  readonly ready = signal(false);

  // Set once the loader has fully faded out and been removed from the DOM.
  readonly loaderGone = signal(false);

  // True while a route navigation is in flight (chunk download + activation).
  readonly navigating = signal(false);

  markReady(): void {
    this.ready.set(true);
  }

  markLoaderGone(): void {
    this.loaderGone.set(true);
  }

  startNavigation(): void {
    this.navigating.set(true);
  }

  endNavigation(): void {
    this.navigating.set(false);
  }
}
