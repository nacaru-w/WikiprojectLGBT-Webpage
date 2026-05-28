import { Component, OnInit, inject, signal } from '@angular/core';
import { CardPreview } from '../../models/card-preview';

import { MediawikiService } from '../../../services/mediawiki.service';
import { CommonModule } from '@angular/common';

import { ChangeDetectorRef } from '@angular/core';
import { Observable, forkJoin, of } from 'rxjs';
import { catchError, map, switchMap } from 'rxjs/operators';

import { popAnimation } from '../../../animations/animations';
import { BarbaService } from '../../../services/barba.service';
import { unescapeInvalidCharacters } from '../../../utils/utils';
import { TranslatePipe } from '@ngx-translate/core';
import { NgbPopover } from '@ng-bootstrap/ng-bootstrap';

@Component({
  selector: 'app-statistics-last-articles',
  standalone: true,
  imports: [CommonModule, TranslatePipe, NgbPopover],
  templateUrl: './statistics-last-articles.component.html',
  styleUrl: './statistics-last-articles.component.scss',
  animations: [popAnimation]
})
export class StatisticsLastArticlesComponent implements OnInit {
  private mediawikiService = inject(MediawikiService);
  private barbaService = inject(BarbaService);
  private cdReF = inject(ChangeDetectorRef);

  cardDict: CardPreview = {};
  showSpinner = signal(true);

  /** "Load more" pulls BATCH older articles per click, fetching each one's data. */
  private readonly BATCH = 3;
  private allArticles: { title: string; date: string | null }[] = [];
  private nextEnd = 0; // exclusive index in allArticles for the next (older) batch
  readonly loadingMore = signal(false);

  /** keyvalue compareFn that preserves insertion order (newest → older). */
  readonly keepOrder = (): number => 0;

  barba: string = this.barbaService.getCurrentBarba();

  /** Wikidata id for the currently hovered image-less card, used by the shared popover. */
  readonly activeWikidataId = signal<string>('');
  // The "no image" popover is hover-triggered but contains a link, so it must stay
  // open while the cursor travels from the image onto the popover. We drive it
  // manually: a short close delay that the popover's own mouseenter cancels.
  private activePopover: NgbPopover | null = null;
  private closeTimer: ReturnType<typeof setTimeout> | null = null;

  ngOnInit(): void {
    this.getLastArticlesInfo();
  }

  /** Open the no-image popover, replacing any other one that's still showing. */
  openNoImagePopover(popover: NgbPopover, wikidataId: string | undefined): void {
    if (!wikidataId) {
      return; // No Wikidata item (e.g. an "Anexo") — nothing to link to, so no popover.
    }
    this.cancelClose();
    if (this.activePopover && this.activePopover !== popover) {
      this.activePopover.close();
    }
    this.activeWikidataId.set(wikidataId ?? '');
    this.activePopover = popover;
    popover.open();
  }

  /** Schedule a close, giving the cursor time to move from the image onto the popover. */
  scheduleClose(): void {
    this.cancelClose();
    this.closeTimer = setTimeout(() => {
      this.activePopover?.close();
      this.activePopover = null;
      this.closeTimer = null;
    }, 150);
  }

  cancelClose(): void {
    if (this.closeTimer) {
      clearTimeout(this.closeTimer);
      this.closeTimer = null;
    }
  }

  getLastArticlesInfo(): void {
    this.mediawikiService.getLgbtArticlesWithDates().pipe(
      catchError(() => of<{ title: string; date: string | null }[]>([])),
    ).subscribe(res => {
      this.allArticles = res;
      this.nextEnd = res.length;
      const batch = this.takeNextBatch();
      // Keep the loader up until the batch's extracts AND images have resolved,
      // so the cards are on screen the instant the loader leaves (no blank gap).
      if (batch.length === 0) {
        this.showSpinner.set(false);
        return;
      }
      this.loadBatch(batch).subscribe(() => this.showSpinner.set(false));
    });
  }

  /** Load the next BATCH of older articles on demand (the "load more" button). */
  loadMore(): void {
    if (this.loadingMore() || !this.hasMore) {
      return;
    }
    const batch = this.takeNextBatch();
    if (batch.length === 0) {
      return;
    }
    this.loadingMore.set(true);
    this.loadBatch(batch).subscribe(() => this.loadingMore.set(false));
  }

  /** Whether older articles remain to load. */
  get hasMore(): boolean {
    return this.nextEnd > 0;
  }

  /** Cards whose extract AND image have resolved — drives rendering + the pop animation. */
  readyCount(): number {
    return Object.values(this.cardDict).filter(card => card.extractLoaded && !!card.image).length;
  }

  /** Take the next (older) batch of up to BATCH articles, newest-first. */
  private takeNextBatch(): { title: string; date: string | null }[] {
    const end = this.nextEnd;
    const start = Math.max(0, end - this.BATCH);
    this.nextEnd = start;
    return this.allArticles.slice(start, end).reverse();
  }

  /** Add a batch to the dict and load each new card's extract + image. */
  private loadBatch(batch: { title: string; date: string | null }[]): Observable<unknown> {
    const keys = this.buildDict(batch);
    const tasks = keys.flatMap(key => [this.loadExtract(key), this.loadImage(key)]);
    return tasks.length ? forkJoin(tasks) : of(null);
  }

  /** Add cards for the given articles to the dict; returns the keys it added. */
  buildDict(batch: { title: string; date: string | null }[]): string[] {
    const keys: string[] = [];
    for (const { title, date } of batch) {
      const escapedTitle = unescapeInvalidCharacters(title);
      this.cardDict[escapedTitle] = {
        extract: '',
        image: '',
        creationDate: date ?? undefined,
      };
      keys.push(escapedTitle);
    }
    return keys;
  }

  /**
   * Load + crop one card's extract. Resolves (with an empty extract) even on
   * error, so a failed request can't keep the loader spinning forever. Marks
   * extractLoaded even when there's no extract, so empty previews still render.
   */
  private loadExtract(title: string): Observable<void> {
    return this.mediawikiService.getPageExtract(title).pipe(
      catchError(() => of('')),
      map(res => {
        const croppedExtract = this.cropString(res, 35);
        this.cardDict[title].extract = this.removeRefnumbers(croppedExtract);
        this.cardDict[title].extractLoaded = true;
      }),
    );
  }

  /**
   * Resolve one card's Wikidata id then its image (or a shrug fallback).
   * Completes even on error so it never blocks the loader.
   */
  private loadImage(title: string): Observable<void> {
    return this.mediawikiService.getWikidataEntity(title).pipe(
      catchError(() => of('')),
      switchMap(wikidataId => {
        this.cardDict[title].wikidataId = wikidataId;
        return this.mediawikiService.getImageUrlFromWdEntity(wikidataId).pipe(
          catchError(() => of(undefined)),
          map(wdimage => {
            if (wdimage) {
              // Request a width-capped thumbnail (Special:FilePath redirects to a
              // scaled image) instead of the full-resolution original — the cards
              // are ~18rem wide, so a ~500px thumb is plenty and far lighter
              // (e.g. ~70 KB vs several MB).
              this.cardDict[title].image = `https://commons.wikimedia.org/wiki/Special:FilePath/${encodeURIComponent(wdimage)}?width=500`;
              this.cardDict[title].hasImage = true;
            } else {
              this.cardDict[title].image = `assets/imgs/Barbas/shrug/barba_shrug_${this.barba}.svg`;
              this.cardDict[title].hasImage = false;
            }
          }),
        );
      }),
    );
  }

  cropString(input: string, maxLength: number): string {
    // The extracts API returns no `extract` for missing or extract-less pages.
    if (!input) {
      return '';
    }
    const words = input.split(' ');
    const croppedWords = words.slice(0, maxLength);
    let croppedString = croppedWords.join(' ');
    if (words.length > maxLength) {
      croppedString += '...';
    }
    return croppedString
  }

  removeRefnumbers(text: string): string {
    const pattern = /\[\d+\]/g;
    let cleanedText = text.replace(pattern, '');
    cleanedText = cleanedText.replace(/\s+/g, ' ').trim();
    return cleanedText
  }

}
