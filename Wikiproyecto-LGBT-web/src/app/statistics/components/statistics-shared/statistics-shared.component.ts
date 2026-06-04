import { ChangeDetectorRef, Component, afterNextRender, inject } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';

import { BarbaService } from '../../../services/barba.service';

/**
 * Stats page shell. Renders the intro, the top-level section nav (Articles /
 * Participants / Images) and a <router-outlet> for the active section. Each
 * section and its sub-views are real child routes (see app.routes.ts), so the
 * nav is plain router navigation and deep links work.
 */
@Component({
  selector: 'app-statistics-shared',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive, TranslatePipe],
  templateUrl: './statistics-shared.component.html',
  styleUrl: './statistics-shared.component.scss',
})
export class StatisticsSharedComponent {
  private cdr = inject(ChangeDetectorRef);
  private barbaService = inject(BarbaService);

  /**
   * Empty-state ("pick a section") visibility. It depends on browser-only state
   * (whether a child route is active), so it must NOT render during SSR/hydration
   * — a server render of it would mismatch and, in practice, leave a stuck barba
   * on deep links. afterNextRender flips `hydrated` only in the browser after
   * hydration; the outlet is likewise gated on it so charts never server-render.
   */
  private hydrated = false;

  /** True while a section's child component occupies the outlet (set by its events). */
  private outletActive = false;

  /** Themed barba keyword for the empty-state image shown before a section is picked. */
  readonly barba: string = this.barbaService.getCurrentBarba();

  constructor() {
    afterNextRender(() => {
      this.hydrated = true;
      this.cdr.detectChanges();
    });
  }

  /** Outlet appears only once hydrated (browser), mirroring the old chart gating. */
  get showOutlet(): boolean {
    return this.hydrated;
  }

  /** Landing/empty state: hydrated and no section selected (bare /stats). */
  get showEmptyState(): boolean {
    return this.hydrated && !this.outletActive;
  }

  onOutletActivate(): void {
    this.outletActive = true;
  }

  onOutletDeactivate(): void {
    this.outletActive = false;
  }
}
