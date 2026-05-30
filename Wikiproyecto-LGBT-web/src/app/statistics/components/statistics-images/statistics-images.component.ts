import { Component, OnInit, inject, signal } from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';

import { CommonsService } from '../../../services/commons.service';
import { CommonsImage } from '../../models/commons-image';
import { BarbaService } from '../../../services/barba.service';
import { popAnimation } from '../../../animations/animations';

/**
 * Gallery of the latest images from the Wikiproyecto's permanent Commons
 * campaign (Campaign:WikiproyectoLGBT+), plus the total upload count. Headed by a
 * date-themed "barba with a camera". Mirrors statistics-last-articles' loader /
 * "load more" flow; data comes from CommonsService.
 */
@Component({
  selector: 'app-statistics-images',
  standalone: true,
  imports: [TranslatePipe],
  templateUrl: './statistics-images.component.html',
  styleUrl: './statistics-images.component.scss',
  animations: [popAnimation],
})
export class StatisticsImagesComponent implements OnInit {
  private commons = inject(CommonsService);
  private barbaService = inject(BarbaService);

  readonly images = signal<CommonsImage[]>([]);
  readonly totalCount = signal<number | null>(null);
  readonly loading = signal(true);
  readonly loadingMore = signal(false);
  readonly failed = signal(false);

  /** Continue token for the next (older) page; null when there's no more. */
  private cont: string | null = null;

  /** Today's themed barba keyword, drives the camera-barba (and shrug fallback). */
  readonly barba = this.barbaService.getCurrentBarba();

  ngOnInit(): void {
    this.commons.getCampaignUploadCount().subscribe((n) => this.totalCount.set(n));
    this.commons.getCampaignImages(12).subscribe((page) => {
      this.images.set(page.images);
      this.cont = page.cont;
      this.failed.set(page.images.length === 0);
      this.loading.set(false);
    });
  }

  get hasMore(): boolean {
    return this.cont !== null;
  }

  /** Append the next (older) batch of campaign images. */
  loadMore(): void {
    if (this.loadingMore() || !this.hasMore) {
      return;
    }
    this.loadingMore.set(true);
    this.commons.getCampaignImages(12, this.cont).subscribe((page) => {
      this.images.update((current) => [...current, ...page.images]);
      this.cont = page.cont;
      this.loadingMore.set(false);
    });
  }

  /**
   * The camera-barba SVG might be missing for some theme; fall back to the
   * regular themed barba so the header never shows a broken image.
   */
  onBarbaError(event: Event): void {
    const img = event.target as HTMLImageElement;
    const fallback = `assets/imgs/Barbas/barba_${this.barba}.svg`;
    if (!img.src.endsWith(fallback)) {
      img.src = fallback;
    }
  }
}
