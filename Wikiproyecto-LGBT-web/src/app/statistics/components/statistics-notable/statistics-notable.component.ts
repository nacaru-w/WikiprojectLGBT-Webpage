import { Component, OnInit, TemplateRef, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Subject, catchError, debounceTime, filter, map, of, switchMap } from 'rxjs';


import { MediawikiService } from '../../../services/mediawiki.service';

import { chartsSlideInOutAnimation, fadeInAnimation } from '../../../animations/animations';

import { NotableArticles } from '../../models/notable-articles';
import { TranslatePipe } from '@ngx-translate/core';
import { NgbAccordionModule, NgbModal, NgbPopover } from '@ng-bootstrap/ng-bootstrap';
import { LoadingBarbaComponent } from '../../../shared/components/loading-barba/loading-barba.component';

@Component({
  selector: 'app-statistics-notable',
  standalone: true,
  imports: [TranslatePipe, NgbPopover, NgbAccordionModule, LoadingBarbaComponent],
  templateUrl: './statistics-notable.component.html',
  styleUrl: './statistics-notable.component.scss',
  animations: [chartsSlideInOutAnimation, fadeInAnimation]
})
export class StatisticsNotableComponent implements OnInit {
  private mediawikiService = inject(MediawikiService);
  private modalService = inject(NgbModal);

  isAPIDone = signal(false);

  notableArtDict: NotableArticles = { AB: [], AD: [] };

  /** Article whose popover is currently open (only one is hovered at a time). */
  readonly activeArticle = signal<string | null>(null);
  /** Short summaries fetched lazily on hover, keyed by article title. */
  readonly extracts = signal<Record<string, string>>({});
  /** Credited editor(s) per article title, parsed up-front from the WikiProject page. */
  articleAuthors: Record<string, string> = {};
  /** Approval year per article title, for the year filter. */
  private articleYear: Record<string, string> = {};
  /** Individual editor names per article title, for the author filter. */
  private articleEditorList: Record<string, string[]> = {};

  /** Filter options, populated from the parsed table. */
  allYears: string[] = [];
  allAuthors: string[] = [];
  /** Currently ticked filter values. Empty sets mean "no filter for this facet". */
  readonly selectedYears = signal<Set<string>>(new Set());
  readonly selectedAuthors = signal<Set<string>>(new Set());

  /** Search text per section; the option lists narrow to matches. */
  readonly yearSearch = signal('');
  readonly authorSearch = signal('');
  readonly filteredYears = computed(() => this.filterOptions(this.allYears, this.yearSearch()));
  readonly filteredAuthors = computed(() => this.filterOptions(this.allAuthors, this.authorSearch()));

  /** Initial collapse state per section, decided when the modal opens. */
  yearCollapsed = true;
  authorCollapsed = true;

  // Hovered articles are pushed here; the API call is debounced (search-box
  // style) so sweeping across badges doesn't fire one request per badge — only
  // the badge the cursor settles on is fetched. switchMap drops a previous
  // in-flight request when the user moves on. filter skips already-cached ones.
  private readonly hover$ = new Subject<string>();

  constructor() {
    this.hover$.pipe(
      debounceTime(750),
      filter(title => this.extracts()[title] === undefined),
      switchMap(title => this.mediawikiService.getPageExtract(title).pipe(
        map(extract => ({ title, text: this.cropExtract(extract) })),
        catchError(() => of({ title, text: '' })),
      )),
      takeUntilDestroyed(),
    ).subscribe(({ title, text }) => {
      this.extracts.update(current => ({ ...current, [title]: text }));
    });
  }

  ngOnInit(): void {
    this.getNotableArticlesinfo();
  }

  /**
   * Hover handler: show the popover + loading state immediately by setting the
   * active article now, but only queue the API call — it fires after the
   * debounce. Setting activeArticle here (on mouseenter, before the popover
   * renders) also stops the new popover briefly flashing the previous summary.
   */
  onHover(title: string): void {
    this.activeArticle.set(title);
    this.hover$.next(title);
  }

  private cropExtract(text: string): string {
    if (!text) {
      return '';
    }
    const clean = text.replace(/\[\d+\]/g, '').replace(/\s+/g, ' ').trim();
    const words = clean.split(' ');
    return words.length > 32 ? words.slice(0, 32).join(' ') + '…' : clean;
  }

  getNotableArticlesinfo(): void {
    this.mediawikiService.getPageContent('Wikiproyecto:LGBT/Artículos buenos y destacados').subscribe(res => {
      const splitString = "[[WP:SAB|Artículos y anexos buenos]]";
      const splitRes = res.split(splitString);
      const notableArticles = {
        AD: this.extractNotableElements(splitRes[0]),
        AB: this.extractNotableElements(splitRes[1])
      }
      this.notableArtDict = notableArticles;
      this.parseArticleDetails(res);
      this.isAPIDone.set(true);
    })
  }

  extractNotableElements(string: string): string[] {
    const regex = /'''\[\[(.*?)\]\]'''/g;
    let match;
    const elements = [];

    while ((match = regex.exec(string)) !== null) {
      elements.push(match[1]);
    }

    return elements
  }

  /**
   * Parses, per table row, each article's credited editor(s) (from the
   * "Editores" column) and approval year (from the "Fecha de aprobación"
   * column), and collects the distinct years/authors for the filter. No extra
   * API call — this is the same page that provides the article list.
   */
  private parseArticleDetails(content: string): void {
    const years = new Set<string>();
    const authors = new Set<string>();
    for (const row of content.split(/\n\|-/)) {
      const titleMatch = row.match(/'''\[\[(.*?)\]\]'''/);
      if (!titleMatch) {
        continue;
      }
      const title = titleMatch[1];
      const editors = this.parseEditors(row);
      if (editors.length) {
        this.articleEditorList[title] = editors;
        this.articleAuthors[title] = editors.join(', ');
        editors.forEach(editor => authors.add(editor));
      }
      // Approval date is "DD de <month> de YYYY"; pull the year from it.
      const yearMatch = row.match(/\d{1,2} de [a-záéíóúñ]+ de ((?:19|20)\d{2})/i);
      if (yearMatch) {
        this.articleYear[title] = yearMatch[1];
        years.add(yearMatch[1]);
      }
    }
    this.allYears = [...years].sort((a, b) => Number(b) - Number(a));
    this.allAuthors = [...authors].sort((a, b) => a.localeCompare(b));
  }

  /**
   * Extracts the distinct editors credited in a table row. An article can have
   * several authors, and they appear either as `[[Usuario:X|…]]` / `[[user:X]]`
   * wikilinks or as `{{u|X}}` / `{{u2|X}}` mention templates (both forms are
   * used on the source page), so we match both. We canonicalize to the username
   * — not the sometimes-inconsistent display label — so the same person isn't
   * split into duplicate filter entries (e.g. "Ecelan" vs "ecelan").
   */
  private parseEditors(row: string): string[] {
    const editors = new Set<string>();
    for (const m of row.matchAll(/\[\[(?:usuario|usuaria|user):([^\]|]+)/gi)) {
      editors.add(this.normalizeUsername(m[1]));
    }
    for (const m of row.matchAll(/\{\{(?:usuario|u2?)\s*\|\s*([^}|]+)/gi)) {
      editors.add(this.normalizeUsername(m[1]));
    }
    return [...editors];
  }

  /** MediaWiki normalizes a username's first letter and treats `_` as a space. */
  private normalizeUsername(raw: string): string {
    const name = raw.trim().replace(/_/g, ' ');
    return name.charAt(0).toUpperCase() + name.slice(1);
  }

  /** Articles in `list` that pass the active year + author filters (facets AND'd). */
  visibleArticles(list: string[]): string[] {
    const years = this.selectedYears();
    const authors = this.selectedAuthors();
    if (!years.size && !authors.size) {
      return list;
    }
    return list.filter(title => {
      const yearOk = !years.size || years.has(this.articleYear[title]);
      const editors = this.articleEditorList[title] ?? [];
      const authorOk = !authors.size || editors.some(editor => authors.has(editor));
      return yearOk && authorOk;
    });
  }

  totalVisible(): number {
    return this.visibleArticles(this.notableArtDict.AD).length + this.visibleArticles(this.notableArtDict.AB).length;
  }

  toggleYear(year: string): void {
    this.selectedYears.update(current => {
      const next = new Set(current);
      if (next.has(year)) { next.delete(year); } else { next.add(year); }
      return next;
    });
  }

  toggleAuthor(author: string): void {
    this.selectedAuthors.update(current => {
      const next = new Set(current);
      if (next.has(author)) { next.delete(author); } else { next.add(author); }
      return next;
    });
  }

  clearFilters(): void {
    this.selectedYears.set(new Set());
    this.selectedAuthors.set(new Set());
  }

  hasActiveFilters(): boolean {
    return this.selectedYears().size > 0 || this.selectedAuthors().size > 0;
  }

  activeFilterCount(): number {
    return this.selectedYears().size + this.selectedAuthors().size;
  }

  private filterOptions(options: string[], query: string): string[] {
    const q = query.trim().toLowerCase();
    return q ? options.filter(option => option.toLowerCase().includes(q)) : options;
  }

  openFilterModal(content: TemplateRef<unknown>): void {
    // Fresh search each time, and open up-front any section with an active filter.
    this.yearSearch.set('');
    this.authorSearch.set('');
    this.yearCollapsed = this.selectedYears().size === 0;
    this.authorCollapsed = this.selectedAuthors().size === 0;
    this.modalService.open(content, { centered: true, scrollable: true, windowClass: 'notable-filter-modal' });
  }

}
