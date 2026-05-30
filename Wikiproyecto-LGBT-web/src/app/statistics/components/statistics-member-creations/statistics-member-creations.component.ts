import { Component, DestroyRef, OnInit, computed, inject, signal } from '@angular/core';
import { DatePipe, DecimalPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Observable, OperatorFunction } from 'rxjs';
import { debounceTime, distinctUntilChanged, map } from 'rxjs/operators';
import { NgbModal, NgbPagination, NgbTypeahead, NgbTypeaheadSelectItemEvent } from '@ng-bootstrap/ng-bootstrap';
import { TranslatePipe } from '@ngx-translate/core';

import { ApiService } from '../../../services/api.service';
import { MediawikiService } from '../../../services/mediawiki.service';
import { MemberCreatedArticle } from '../../../services/models/member-creations';
import { MemberArticleInfoModalComponent } from '../member-article-info-modal/member-article-info-modal.component';

type SortColumn = 'title' | 'size' | 'created';
type SortDirection = 'asc' | 'desc';

/**
 * "LGBT articles a user created" lookup — the default sub-subpage of the
 * participants section (/stats#participants). Autosuggests Wikiproyecto LGBT
 * members, then lists the LGBT articles they created (newest first by default;
 * sortable by name and size). Prolific members can have hundreds of articles, so
 * the list is filterable by title and paginated — only the current page renders.
 */
@Component({
  selector: 'app-statistics-member-creations',
  standalone: true,
  imports: [FormsModule, NgbTypeahead, NgbPagination, TranslatePipe, DecimalPipe, DatePipe],
  templateUrl: './statistics-member-creations.component.html',
  styleUrl: './statistics-member-creations.component.scss',
})
export class StatisticsMemberCreationsComponent implements OnInit {
  private api = inject(ApiService);
  private mediawikiService = inject(MediawikiService);
  private destroyRef = inject(DestroyRef);
  private modal = inject(NgbModal);

  /** Member usernames, fetched once; the autosuggest filters this list. */
  private members: string[] = [];

  /** Two-way bound search text. */
  query = '';

  /** Member currently looked up (drives the results heading). */
  readonly selectedMember = signal<string | null>(null);

  /** Lookup results: null = no search yet, [] = searched but none found. */
  readonly results = signal<MemberCreatedArticle[] | null>(null);
  readonly loading = signal(false);

  readonly sortColumn = signal<SortColumn>('created');
  readonly sortDirection = signal<SortDirection>('desc');

  /** Free-text filter over article titles (for members with many creations). */
  readonly filterQuery = signal('');
  /** Current page (1-based) and how many rows render per page. */
  readonly page = signal(1);
  readonly pageSize = 15;

  /** Results after the title filter + active sort. */
  readonly filteredSortedResults = computed<MemberCreatedArticle[]>(() => {
    const list = this.results();
    if (!list) return [];
    const query = this.filterQuery().trim().toLowerCase();
    const filtered = query ? list.filter(a => a.title.toLowerCase().includes(query)) : list;
    const column = this.sortColumn();
    const factor = this.sortDirection() === 'asc' ? 1 : -1;
    return [...filtered].sort((a, b) => {
      let cmp: number;
      switch (column) {
        case 'title':
          cmp = a.title.localeCompare(b.title, 'es', { sensitivity: 'base' });
          break;
        case 'size':
          cmp = (a.sizeBytes ?? 0) - (b.sizeBytes ?? 0);
          break;
        default: // 'created'
          cmp = (a.creationDate ?? '').localeCompare(b.creationDate ?? '');
      }
      return cmp * factor;
    });
  });

  /** Only the current page's rows render, so big lists aren't all in the DOM. */
  readonly pagedResults = computed<MemberCreatedArticle[]>(() => {
    const start = (this.page() - 1) * this.pageSize;
    return this.filteredSortedResults().slice(start, start + this.pageSize);
  });

  /** Cap the suggestion dropdown so it stays usable with ~300 members. */
  private static readonly MAX_SUGGESTIONS = 10;

  ngOnInit(): void {
    this.mediawikiService.getParticipantNames()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(names => (this.members = names));
  }

  /** NgbTypeahead source: members whose name contains the typed text. */
  readonly search: OperatorFunction<string, readonly string[]> = (text$: Observable<string>) =>
    text$.pipe(
      debounceTime(150),
      distinctUntilChanged(),
      map(term => {
        const q = term.trim().toLowerCase();
        if (!q) return [];
        return this.members
          .filter(name => name.toLowerCase().includes(q))
          .slice(0, StatisticsMemberCreationsComponent.MAX_SUGGESTIONS);
      }),
    );

  onSelect(event: NgbTypeaheadSelectItemEvent<string>): void {
    this.query = event.item;
    this.lookUp(event.item);
  }

  /** Search button / Enter: look up whatever is currently typed. */
  submit(): void {
    this.lookUp(this.query);
  }

  /** Title-filter input changed: apply it and jump back to the first page. */
  onFilter(value: string): void {
    this.filterQuery.set(value);
    this.page.set(1);
  }

  /** Open the per-article info modal (calls XTools for the authorship + facts). */
  openInfo(article: MemberCreatedArticle): void {
    const ref = this.modal.open(MemberArticleInfoModalComponent, {
      size: 'lg',
      centered: true,
      scrollable: true,
      windowClass: 'article-info-modal',
    });
    ref.componentInstance.article = article;
    ref.componentInstance.member = this.selectedMember() ?? '';
    ref.componentInstance.members = this.members;
  }

  /** Sort by a column; clicking the active column flips its direction. */
  sortBy(column: SortColumn): void {
    if (this.sortColumn() === column) {
      this.sortDirection.update(dir => (dir === 'asc' ? 'desc' : 'asc'));
    } else {
      this.sortColumn.set(column);
      // Sensible first-click direction: A→Z for names, largest/newest first otherwise.
      this.sortDirection.set(column === 'title' ? 'asc' : 'desc');
    }
    this.page.set(1);
  }

  /** Sort state for a header — drives the sort-icon highlight ('none' = inactive). */
  sortState(column: SortColumn): 'none' | SortDirection {
    return this.sortColumn() === column ? this.sortDirection() : 'none';
  }

  ariaSort(column: SortColumn): 'ascending' | 'descending' | 'none' {
    if (this.sortColumn() !== column) return 'none';
    return this.sortDirection() === 'asc' ? 'ascending' : 'descending';
  }

  private lookUp(rawName: string): void {
    const username = rawName.trim();
    if (!username || this.loading()) return;

    this.selectedMember.set(username);
    this.loading.set(true);
    this.results.set(null);
    // Each new search starts clean: default order, no filter, first page.
    this.sortColumn.set('created');
    this.sortDirection.set('desc');
    this.filterQuery.set('');
    this.page.set(1);

    this.api.getMemberLgbtCreations(username)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: res => {
          this.results.set(res.articles);
          this.loading.set(false);
        },
        error: () => {
          // Surface the lookup as "no results" rather than a spinner that never
          // resolves; the XTools-backed endpoint can occasionally fail/time out.
          this.results.set([]);
          this.loading.set(false);
        },
      });
  }
}
