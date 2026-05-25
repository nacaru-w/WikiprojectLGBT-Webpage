import { Component, OnInit, inject, signal } from '@angular/core';
import { CardPreview } from '../../models/card-preview';

import { MediawikiService } from '../../../services/mediawiki.service';
import { CommonModule } from '@angular/common';

import { ChangeDetectorRef } from '@angular/core';

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
    this.mediawikiService.getLGBTArticleList().subscribe(res => {
      this.buildDict(res.slice(-3));
      for (let article in this.cardDict) {
        this.assignExtracts(article);
        this.assignImages(article);
      }
      this.showSpinner.set(false);
    })
  }

  buildDict(array: string[]) {
    for (let title of array) {
      const escapedTitle = unescapeInvalidCharacters(title);
      this.cardDict[escapedTitle] = {
        extract: '',
        image: ''
      }
    }
  }

  assignExtracts(title: string): void {
    this.mediawikiService.getPageExtract(title).subscribe(res => {
      const croppedExtract = this.cropString(res, 35);
      this.cardDict[title].extract = this.removeRefnumbers(croppedExtract);
      // Mark as loaded even when the page has no extract (e.g. a missing page),
      // so an empty preview doesn't keep the cards from ever rendering.
      this.cardDict[title].extractLoaded = true;
    })
  }

  assignImages(title: string): void {
    this.mediawikiService.getWikidataEntity(title).subscribe(res => {
      this.cardDict[title].wikidataId = res;
      this.mediawikiService.getImageUrlFromWdEntity(res).subscribe(wdimage => {
        if (wdimage) {
          this.cardDict[title].image = `https://commons.wikimedia.org/w/index.php?title=Special:Redirect/file&wpvalue=${wdimage}`;
          this.cardDict[title].hasImage = true;
        } else {
          this.cardDict[title].image = `assets/imgs/Barbas/shrug/barba_shrug_${this.barba}.svg`;
          this.cardDict[title].hasImage = false;
        }
      })
    })
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

  isDictFull(dict: CardPreview): boolean {
    for (const item in dict) {
      // Check the extract's load flag, not its content: a page can legitimately
      // have an empty extract, which must not block the cards from rendering.
      if (!dict[item].extractLoaded || !dict[item].image) return false
    }
    return true
  }
}
