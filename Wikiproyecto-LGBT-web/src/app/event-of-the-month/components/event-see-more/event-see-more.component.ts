import { Component, TemplateRef, inject, input, signal } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { TranslatePipe } from '@ngx-translate/core';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { map, of, switchMap } from 'rxjs';
import { MediawikiService } from '../../../services/mediawiki.service';
import { applyArticleSizes, findWorkedArticlesSubpage, parseChallengeArticles } from '../../utils/challenge-parser';
import { ChallengeData } from '../../models/event-data';
import { PRIZE_LESBIAN_ICON } from '../../data/prizes';
import { LoadingBarbaComponent } from '../../../shared/components/loading-barba/loading-barba.component';

type Tab = 'participants' | 'articles';

/**
 * "See more" button for one edition: opens a modal that fetches that month's
 * challenge page and shows its participants and worked articles in two tabs.
 */
@Component({
  selector: 'app-event-see-more',
  standalone: true,
  imports: [TranslatePipe, DecimalPipe, LoadingBarbaComponent],
  templateUrl: './event-see-more.component.html',
  styleUrl: './event-see-more.component.scss',
})
export class EventSeeMoreComponent {
  private modalService = inject(NgbModal);
  private mediawiki = inject(MediawikiService);

  /** Challenge page title to fetch. */
  readonly page = input<string | null>(null);
  /** Heading parts: country/event name, the month's i18n key, and the year. */
  readonly title = input<string>('');
  readonly monthKey = input<string>('');
  readonly year = input<number>();
  /** Link to the challenge page itself, shown in the modal footer. */
  readonly challengeUrl = input<string | null>(null);
  /** Winner(s) of the "most lesbian biographies" award, flagged in the list. */
  readonly lesbianPrize = input<string[]>([]);

  readonly lesbianIcon = PRIZE_LESBIAN_ICON;

  readonly loading = signal(false);
  readonly data = signal<ChallengeData>({ articles: [], participants: [] });
  readonly tab = signal<Tab>('participants');
  /** Participant whose article list is currently expanded, if any. */
  readonly expandedUser = signal<string | null>(null);

  open(content: TemplateRef<unknown>): void {
    this.tab.set('participants');
    this.expandedUser.set(null);
    this.data.set({ articles: [], participants: [] });
    this.loading.set(true);
    this.modalService.open(content, { centered: true, scrollable: true, windowClass: 'event-details-modal' });

    const page = this.page();
    if (!page) { this.loading.set(false); return; }
    this.mediawiki.getPageContent(page).pipe(
      switchMap(content => {
        const data = parseChallengeArticles(content ?? '');
        if (data.articles.length) return of(data);
        // "Evento:" namespace editions keep the worked-articles table on a
        // "…/Artículos trabajados" subpage; the challenge page we just fetched is
        // only intro/rules. Follow that link and parse the subpage instead.
        const subpage = findWorkedArticlesSubpage(content ?? '');
        return subpage
          ? this.mediawiki.getPageContent(subpage).pipe(map(sub => parseChallengeArticles(sub ?? '')))
          : of(data);
      }),
      switchMap(data => {
        // The newer subpages list edit types (Creado/Traducido/Ampliado) in the
        // size column, so articles parse with size: null. Backfill each one's
        // current byte length in a single batched API call, then re-rank. When
        // the wikitext already carried sizes, there's nothing missing and no
        // extra request is made.
        const missing = data.articles.filter(a => a.size == null).map(a => a.title);
        if (!missing.length) return of(data);
        return this.mediawiki.getPageSizes(missing).pipe(
          map(sizes => applyArticleSizes(data, sizes)),
        );
      }),
    ).subscribe({
      next: data => { this.data.set(data); this.loading.set(false); },
      error: () => this.loading.set(false),
    });
  }

  show(tab: Tab): void {
    this.tab.set(tab);
  }

  toggleUser(user: string): void {
    this.expandedUser.update(current => (current === user ? null : user));
  }

  /** Whether this participant is a winner of the lesbian-biographies award. */
  wonLesbian(user: string): boolean {
    const norm = (s: string) => s.trim().toLowerCase().replace(/_/g, ' ');
    const u = norm(user);
    return this.lesbianPrize().some(winner => norm(winner) === u);
  }
}
