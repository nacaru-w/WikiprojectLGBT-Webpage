import { ChangeDetectorRef, Component, DestroyRef, OnInit, afterNextRender, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router } from '@angular/router';
import { StatisticsMonthlyArticlesComponent } from '../statistics-monthly-articles/statistics-monthly-articles.component';
import { StatisticsNotableComponent } from '../statistics-notable/statistics-notable.component';
import { StatisticsYearlyArticlesComponent } from '../statistics-yearly-articles/statistics-yearly-articles.component';
import { StatisticsParticipantsComponent } from '../statistics-participants/statistics-participants.component';
import { StatisticsLastArticlesComponent } from '../statistics-last-articles/statistics-last-articles.component';
import { StatisticsMemberCreationsComponent } from '../statistics-member-creations/statistics-member-creations.component';

import { chartsSlideInOutAnimation, fadeInAnimation, fadeInOutAnimation } from '../../../animations/animations';
import { TranslatePipe } from '@ngx-translate/core';
import { BarbaService } from '../../../services/barba.service';

// URL fragments that map to each section, e.g. /stats#monthly-articles.
// `participants` and `participants-stats` are two sub-subpages of the same
// "Participants" nav item (the member-creations lookup and the stats charts).
const SECTIONS = ['yearly-articles', 'monthly-articles', 'notable', 'participants', 'participants-stats', 'last-articles'] as const;
type Section = (typeof SECTIONS)[number];

@Component({
  selector: 'app-statistics-shared',
  standalone: true,
  imports: [
    StatisticsMonthlyArticlesComponent,
    StatisticsNotableComponent,
    StatisticsYearlyArticlesComponent,
    StatisticsParticipantsComponent,
    StatisticsLastArticlesComponent,
    StatisticsMemberCreationsComponent,
    TranslatePipe,
  ],
  templateUrl: './statistics-shared.component.html',
  styleUrl: './statistics-shared.component.scss',
  animations: [
    chartsSlideInOutAnimation,
    fadeInAnimation,
    fadeInOutAnimation
  ]
})
export class StatisticsSharedComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private destroyRef = inject(DestroyRef);
  private barbaService = inject(BarbaService);
  private cdr = inject(ChangeDetectorRef);

  /** Section named by the URL fragment; drives the chart shown + active nav item. */
  activeSection: Section | null = null;

  /**
   * Empty-state ("pick a section") visibility. It depends on the URL fragment,
   * which is browser-only, so it must NOT render during SSR/hydration — a server
   * render of it would mismatch and, in practice, leave a stuck barba on deep
   * links. afterNextRender flips `hydrated` only in the browser after hydration,
   * mirroring how the charts appear; before that this stays false everywhere.
   */
  showEmptyState: boolean = false;
  private hydrated = false;

  /** Themed barba keyword for the empty-state image shown before a section is picked. */
  readonly barba: string = this.barbaService.getCurrentBarba();

  showMonthlyArticles: boolean = false;
  showYearlyArticles: boolean = false;
  showParticipants: boolean = false;
  showNotable: boolean = false;
  showLastArticles: boolean = false;

  /** Which participants sub-subpage to show: the user lookup (default) or the stats charts. */
  participantsView: 'lookup' | 'stats' = 'lookup';

  /**
   * Enables the lookup/stats fade only for in-section toggles, NOT when the
   * section first opens — so opening participants slides in exactly like the
   * other sections (slide only) instead of slide + fade.
   */
  viewFadeEnabled = false;

  constructor() {
    afterNextRender(() => {
      this.hydrated = true;
      this.refreshEmptyState();
      this.cdr.detectChanges();
    });
  }

  ngOnInit(): void {
    // The URL fragment is the source of truth: nav links set it and this reacts
    // to it, so deep links and back/forward work. Hashes never reach the server,
    // so SSR renders just the intro + nav; the chart (or empty state) appears in
    // the browser after hydration.
    this.route.fragment
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(fragment => this.showChart(fragment));
  }

  /**
   * Nav-link handler: point the URL fragment at the section and let the fragment
   * subscription render it. preventDefault stops the anchor's native hash jump.
   * replaceUrl keeps section switching out of the back/forward history (tab-style
   * navigation) — deep links still work, the URL stays copyable, and the back
   * button leaves /stats rather than cycling through every section visited.
   */
  selectSection(event: MouseEvent, section: string): void {
    event.preventDefault();
    this.router.navigate([], { relativeTo: this.route, fragment: section, replaceUrl: true });
  }

  showChart(chart: string | null) {
    const section = this.isSection(chart) ? chart : null;

    // Toggling between the two participants sub-subpages keeps the section
    // mounted and just swaps the inner view (which fades via [@fadeIn] in the
    // template), so the sub-nav doesn't re-mount — same feel as the Evento del
    // mes subsections, rather than the full slide the top-level sections use.
    const inParticipants = section === 'participants' || section === 'participants-stats';
    const wasInParticipants =
      this.activeSection === 'participants' || this.activeSection === 'participants-stats';
    this.activeSection = section;
    this.refreshEmptyState();
    if (inParticipants && wasInParticipants) {
      this.viewFadeEnabled = true; // a toggle within the open section: fade the swap
      this.participantsView = section === 'participants-stats' ? 'stats' : 'lookup';
      return;
    }

    this.hideAllCharts();
    if (!section) {
      return;
    }
    // Delay matches the slide-out so the outgoing chart leaves before the next enters.
    setTimeout(() => {
      switch (section) {
        case "yearly-articles":
          this.showYearlyArticles = true;
          break;
        case "monthly-articles":
          this.showMonthlyArticles = true;
          break;
        case "participants":
          this.participantsView = 'lookup';
          this.showParticipants = true;
          break;
        case "participants-stats":
          this.participantsView = 'stats';
          this.showParticipants = true;
          break;
        case "notable":
          this.showNotable = true;
          break;
        case "last-articles":
          this.showLastArticles = true;
      }
    }, 300);
  }

  /** Show the empty state only once hydrated (browser) and no section is active. */
  private refreshEmptyState(): void {
    this.showEmptyState = this.hydrated && !this.activeSection;
  }

  hideAllCharts() {
    this.showMonthlyArticles = false;
    this.showYearlyArticles = false;
    this.showParticipants = false;
    this.showNotable = false;
    this.showLastArticles = false;
    // Next participants open should slide only (fade re-enables on a toggle).
    this.viewFadeEnabled = false;
  }

  private isSection(value: string | null): value is Section {
    return !!value && (SECTIONS as readonly string[]).includes(value);
  }

}
