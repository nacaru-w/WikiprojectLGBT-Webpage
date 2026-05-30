import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, catchError, map, of } from 'rxjs';

import { CommonsImage } from '../statistics/models/commons-image';
import { stripHtml } from '../utils/utils';

const COMMONS_API = 'https://commons.wikimedia.org/w/api.php';
// Tracking category the UploadWizard campaign auto-adds to every upload.
const CAMPAIGN_CATEGORY = 'Category:Uploaded via Campaign:WikiproyectoLGBT+';
const FILE_PAGE_BASE = 'https://commons.wikimedia.org/wiki/';
const USER_PAGE_BASE = 'https://commons.wikimedia.org/wiki/User:';

/** One page of campaign images plus the continue token for the next (older) page. */
export interface CampaignImagesPage {
  images: CommonsImage[];
  cont: string | null;
}

/**
 * Reads the Wikiproyecto's permanent Commons campaign
 * (Campaign:WikiproyectoLGBT+). Calls go to commons.wikimedia.org with origin=*
 * for anonymous CORS in the browser; on SSR the wikimediaUserAgentInterceptor
 * stamps the policy User-Agent (it already matches *.wikimedia.org). Mirrors the
 * MediawikiService request/response style.
 */
@Injectable({ providedIn: 'root' })
export class CommonsService {
  private http = inject(HttpClient);

  /**
   * Latest files uploaded via the campaign, newest first. Pass the previous
   * page's `cont` token to fetch the next (older) batch ("Load more").
   */
  getCampaignImages(limit = 12, cont?: string | null): Observable<CampaignImagesPage> {
    const params: Record<string, string> = {
      action: 'query',
      format: 'json',
      formatversion: '2',
      origin: '*',
      generator: 'categorymembers',
      gcmtitle: CAMPAIGN_CATEGORY,
      gcmtype: 'file',
      gcmsort: 'timestamp',
      gcmdir: 'desc',
      gcmlimit: String(limit),
      prop: 'imageinfo',
      iiprop: 'url|extmetadata|user|timestamp|mime',
      iiurlwidth: '400',
      iiextmetadatafilter: 'LicenseShortName|ObjectName|DateTimeOriginal',
    };
    if (cont) {
      params['gcmcontinue'] = cont;
    }

    return this.http.get(this.buildUrl(params)).pipe(
      map((res: any) => this.mapImagesResponse(res)),
      catchError(() => of<CampaignImagesPage>({ images: [], cont: null })),
    );
  }

  /** Total number of files uploaded via the campaign (categoryinfo.files). */
  getCampaignUploadCount(): Observable<number> {
    const params: Record<string, string> = {
      action: 'query',
      format: 'json',
      formatversion: '2',
      origin: '*',
      prop: 'categoryinfo',
      titles: CAMPAIGN_CATEGORY,
    };

    return this.http.get(this.buildUrl(params)).pipe(
      map((res: any) => res?.query?.pages?.[0]?.categoryinfo?.files ?? 0),
      catchError(() => of(0)),
    );
  }

  private mapImagesResponse(res: any): CampaignImagesPage {
    const pages: any[] = res?.query?.pages ?? [];

    const images: CommonsImage[] = pages
      .map((page) => this.toImage(page))
      .filter((img): img is CommonsImage => img !== null)
      // The generator doesn't guarantee order, so sort newest-first ourselves.
      .sort((a, b) => (a.timestamp < b.timestamp ? 1 : -1));

    return { images, cont: res?.continue?.gcmcontinue ?? null };
  }

  private toImage(page: any): CommonsImage | null {
    const info = page?.imageinfo?.[0];
    // Skip non-image files (PDFs, videos…) and anything without a thumbnail.
    if (!info?.thumburl || !String(info.mime ?? '').startsWith('image/')) {
      return null;
    }
    const meta = info.extmetadata ?? {};
    const uploader: string = info.user ?? '';
    const objectName = meta.ObjectName?.value ? stripHtml(meta.ObjectName.value) : '';
    return {
      title: page.title,
      caption: objectName || this.cleanTitle(page.title),
      dateTaken: meta.DateTimeOriginal?.value ? stripHtml(meta.DateTimeOriginal.value) : null,
      thumbUrl: info.thumburl,
      descriptionUrl: info.descriptionurl ?? FILE_PAGE_BASE + encodeURIComponent(page.title),
      uploader,
      uploaderUrl: USER_PAGE_BASE + encodeURIComponent(uploader),
      license: meta.LicenseShortName?.value ?? null,
      artist: meta.Artist?.value ? stripHtml(meta.Artist.value) : null,
      timestamp: info.timestamp ?? '',
    };
  }

  /** "File:Some title.jpg" → "Some title" (fallback when ObjectName is absent). */
  private cleanTitle(title: string): string {
    return title.replace(/^File:/i, '').replace(/\.[^.]+$/, '').replace(/_/g, ' ').trim();
  }

  private buildUrl(params: Record<string, string>): string {
    const query = Object.entries(params)
      .map(([key, value]) => `${key}=${encodeURIComponent(value)}`)
      .join('&');
    return `${COMMONS_API}?${query}`;
  }
}
