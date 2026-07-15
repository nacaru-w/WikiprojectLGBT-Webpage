import { Component, DestroyRef, OnInit, computed, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { TranslatePipe } from '@ngx-translate/core';

import { ApiService } from '../../../services/api.service';
import { MediawikiService } from '../../../services/mediawiki.service';
import { ArticleSearchResult } from '../../../services/models/article-search';
import { MemberArticleInfoModalComponent } from '../member-article-info-modal/member-article-info-modal.component';

/**
 * "Buscador" article-search view (/stats/articles/search). Looks up any
 * LGBT-tracked article by title against the cached `lgbt_tracked_articles`
 * table and lists the matches in a table. The full list is ~11k rows, so the
 * search is server-side and paged — a "load more" button appends the next page
 * (matching the latest-articles view) rather than shipping everything at once.
 */
@Component({
  selector: 'app-statistics-search',
  standalone: true,
  imports: [FormsModule, TranslatePipe, DatePipe],
  templateUrl: './statistics-search.component.html',
  styleUrl: './statistics-search.component.scss',
})
export class StatisticsSearchComponent implements OnInit {
  private api = inject(ApiService);
  private mediawikiService = inject(MediawikiService);
  private destroyRef = inject(DestroyRef);
  private modal = inject(NgbModal);

  /** Wikiproyecto member usernames — fed to the info modal so its authorship
   *  pie can highlight which members contributed to the article. */
  private members: string[] = [];

  /** Two-way bound search text. */
  query = '';

  /** The term that produced the current results (drives the summary + paging). */
  readonly searchedTerm = signal<string | null>(null);

  /** Accumulated matches across "load more"; null = no search yet, [] = none found. */
  readonly results = signal<ArticleSearchResult[] | null>(null);
  /** Total matches on the server (>= results().length while more remain). */
  readonly total = signal(0);

  readonly loading = signal(false);     // first page of a new search
  readonly loadingMore = signal(false); // subsequent "load more" pages

  readonly pageSize = 20;

  /** Whether more matches remain to load. */
  readonly hasMore = computed<boolean>(() => {
    const list = this.results();
    return !!list && list.length < this.total();
  });

  ngOnInit(): void {
    // Load the member list once so the per-article info modal can frame its
    // authorship pie around Wikiproyecto members.
    this.mediawikiService.getParticipantNames()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(names => (this.members = names));
  }

  /** Open the per-article info modal (XTools facts + member authorship pie). */
  openInfo(article: ArticleSearchResult): void {
    const ref = this.modal.open(MemberArticleInfoModalComponent, {
      size: 'lg',
      centered: true,
      scrollable: true,
      windowClass: 'article-info-modal',
    });
    ref.componentInstance.article = article;
    // No looked-up member here (this is a generic article search), so the pie
    // has no "selected member" slice — just member contributions vs. others.
    ref.componentInstance.member = '';
    ref.componentInstance.members = this.members;
  }

  /** Search button / Enter: look up whatever is currently typed (fresh search). */
  submit(): void {
    const term = this.query.trim();
    if (!term || this.loading()) return;
    this.searchedTerm.set(term);
    this.results.set(null);
    this.total.set(0);
    this.runSearch(term, 0, false);
  }

  /** Append the next page of matches for the current search. */
  loadMore(): void {
    const term = this.searchedTerm();
    const list = this.results();
    if (!term || !list || this.loadingMore() || !this.hasMore()) return;
    this.runSearch(term, list.length, true);
  }

  private runSearch(term: string, offset: number, more: boolean): void {
    (more ? this.loadingMore : this.loading).set(true);
    this.api.searchLgbtArticles(term, offset, this.pageSize)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: res => {
          this.total.set(res.total);
          this.results.update(cur => (more && cur ? [...cur, ...res.articles] : res.articles));
          this.loading.set(false);
          this.loadingMore.set(false);
        },
        error: () => {
          // Surface a failed lookup as "no results" rather than a stuck spinner;
          // keep the already-loaded page intact when only "load more" failed.
          if (!more) this.results.set([]);
          this.loading.set(false);
          this.loadingMore.set(false);
        },
      });
  }
}
