import {
  Component, DestroyRef, ElementRef, OnInit, PLATFORM_ID, QueryList,
  ViewChild, ViewChildren, afterNextRender, computed, effect, inject, input, signal,
} from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router, RouterLink, RouterLinkActive } from '@angular/router';
import { filter } from 'rxjs';
import { TranslatePipe } from '@ngx-translate/core';

/** One selectable view in the switch. `link` is a route segment relative to the parent shell. */
export interface ViewSwitchOption {
  labelKey: string;
  link: string;
}

/**
 * Sliding pill toggle used to switch between the sub-routes of a stats section
 * (Articles, Participants). The thumb slides to whichever option matches the
 * current URL. Selection is real router navigation (routerLink), so each view is
 * its own sub-route; replaceUrl keeps the switches out of the back/forward history.
 *
 * The thumb is positioned by measuring the active option's box rather than
 * assuming equal-width tracks: option labels differ in width (and change with the
 * language), and the row may wrap on narrow screens — measuring keeps the thumb
 * aligned in all of those cases.
 */
@Component({
  selector: 'app-stats-view-switch',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, TranslatePipe],
  templateUrl: './stats-view-switch.component.html',
  styleUrl: './stats-view-switch.component.scss',
})
export class StatsViewSwitchComponent implements OnInit {
  private router = inject(Router);
  private destroyRef = inject(DestroyRef);
  private platformId = inject(PLATFORM_ID);

  /** The selectable views, in display order. */
  readonly options = input.required<ViewSwitchOption[]>();
  /** Already-translated accessible label for the tablist. */
  readonly ariaLabel = input<string>('');

  @ViewChild('track') private track?: ElementRef<HTMLElement>;
  @ViewChildren('opt') private optionEls?: QueryList<ElementRef<HTMLElement>>;

  /** Index of the option matching the current URL; drives the sliding thumb. */
  readonly activeIndex = signal(0);

  /** Measured thumb geometry (px), null until the first measurement after layout. */
  readonly thumb = signal<{ left: number; top: number; width: number; height: number } | null>(null);
  readonly thumbReady = computed(() => this.thumb() !== null);

  constructor() {
    // Keep the active index in sync as the user navigates between sub-routes.
    this.router.events
      .pipe(
        filter((e): e is NavigationEnd => e instanceof NavigationEnd),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe(e => this.syncActive(e.urlAfterRedirects));

    // The active option's geometry doesn't depend on the index, so re-measuring
    // when it changes is safe (layout is already settled) — just reposition.
    effect(() => {
      this.activeIndex();
      this.measure();
    });

    // Re-measure when the row reflows: language switch (labels change width →
    // fit-content container resizes), font load, viewport resize / wrapping.
    afterNextRender(() => {
      this.measure();
      const el = this.track?.nativeElement;
      if (el && typeof ResizeObserver !== 'undefined') {
        const ro = new ResizeObserver(() => this.measure());
        ro.observe(el);
        this.destroyRef.onDestroy(() => ro.disconnect());
      }
    });
  }

  ngOnInit(): void {
    // Seed from the current URL so a deep link positions the thumb correctly.
    this.syncActive(this.router.url);
  }

  /** Match the URL's leaf segment against the options to find the active index. */
  private syncActive(url: string): void {
    const segment = url.split(/[?#]/)[0].split('/').filter(Boolean).pop() ?? '';
    const index = this.options().findIndex(o => o.link === segment);
    if (index >= 0) {
      this.activeIndex.set(index);
    }
  }

  /** Measure the active option and move the thumb to cover it (browser only). */
  private measure(): void {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }
    const el = this.optionEls?.get(this.activeIndex())?.nativeElement;
    if (!el) {
      return;
    }
    this.thumb.set({ left: el.offsetLeft, top: el.offsetTop, width: el.offsetWidth, height: el.offsetHeight });
  }
}
