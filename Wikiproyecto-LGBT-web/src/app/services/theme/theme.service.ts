import { isPlatformBrowser } from '@angular/common';
import { inject, Injectable, PLATFORM_ID, signal } from '@angular/core';
import { LocalStorageService } from '../storage/local-storage.service';

export type Theme = 'light' | 'dark';

/** Key (within the app's storage namespace) the chosen theme persists under. */
const THEME_STORAGE_KEY = 'preferred-theme';

/**
 * Centralizes light/dark theming. The theme is applied by toggling a `dark`
 * class and a `data-bs-theme` attribute on <html>: the class drives our CSS
 * custom properties (see :root / :root.dark in styles.scss) and the attribute
 * lets Bootstrap 5.3's own color mode follow along.
 *
 * SSR always renders the light default (no localStorage / matchMedia on the
 * server), so the real choice is resolved on the browser. To avoid a flash, a
 * tiny inline script in index.html sets the class before paint; this service
 * then mirrors that decision into a signal (so the toggle reflects it) and owns
 * subsequent switches. Mirrors LanguageService and reuses LocalStorageService.
 */
@Injectable({ providedIn: 'root' })
export class ThemeService {
  private platformId = inject(PLATFORM_ID);
  private storage = inject(LocalStorageService);

  /** The active theme; drives the toggle's icon/label. */
  readonly theme = signal<Theme>('light');

  constructor() {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }
    // Saved choice wins; otherwise follow the OS preference. Re-applying is
    // harmless and keeps the signal in sync with what the inline script set.
    this.apply(this.readStoredTheme() ?? this.systemPreference());
  }

  /** Flip between light and dark and remember the choice. */
  toggle(): void {
    this.setTheme(this.theme() === 'dark' ? 'light' : 'dark');
  }

  /** Set an explicit theme and persist it for next time. */
  setTheme(theme: Theme): void {
    this.apply(theme);
    this.storage.set(THEME_STORAGE_KEY, theme);
  }

  private apply(theme: Theme): void {
    this.theme.set(theme);
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }
    const root = document.documentElement;
    root.classList.toggle('dark', theme === 'dark');
    root.setAttribute('data-bs-theme', theme);
  }

  private readStoredTheme(): Theme | null {
    const saved = this.storage.get(THEME_STORAGE_KEY);
    return saved === 'light' || saved === 'dark' ? saved : null;
  }

  private systemPreference(): Theme {
    return window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }
}
