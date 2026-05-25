import { isPlatformBrowser } from '@angular/common';
import { inject, Injectable, PLATFORM_ID } from '@angular/core';

/**
 * Namespace prepended to every key so this app's entries can't collide with
 * other tools sharing the same origin — Toolforge tools have historically been
 * served from a shared domain (tools.wmflabs.org/<tool>). Matches the Toolforge
 * tool name (wmlgbt-es-web) to stay unique to this application.
 */
export const STORAGE_PREFIX = 'wmlgbt-es-web';

/**
 * Thin, SSR-safe wrapper around window.localStorage. On the server there is no
 * localStorage, so reads return null and writes are no-ops. Every key is
 * namespaced with STORAGE_PREFIX. Access is wrapped in try/catch because
 * localStorage throws when it's disabled (private browsing) or out of quota —
 * in those cases a preference simply won't persist rather than crashing the app.
 */
@Injectable({ providedIn: 'root' })
export class LocalStorageService {
  private platformId = inject(PLATFORM_ID);

  get(key: string): string | null {
    if (!isPlatformBrowser(this.platformId)) {
      return null;
    }
    try {
      return localStorage.getItem(this.scopedKey(key));
    } catch {
      return null;
    }
  }

  set(key: string, value: string): void {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }
    try {
      localStorage.setItem(this.scopedKey(key), value);
    } catch {
      /* storage unavailable or full — the preference just won't persist */
    }
  }

  remove(key: string): void {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }
    try {
      localStorage.removeItem(this.scopedKey(key));
    } catch {
      /* nothing to clean up if storage is inaccessible */
    }
  }

  private scopedKey(key: string): string {
    return `${STORAGE_PREFIX}:${key}`;
  }
}
