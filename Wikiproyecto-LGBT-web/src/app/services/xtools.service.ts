import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { XtoolsPageInfo, XtoolsTopEditors } from './models/xtools';

/**
 * Read-only XTools API client (https://xtools.wmcloud.org/api). Called directly
 * from the browser — XTools sends permissive CORS headers, so no proxy needed.
 * Scoped to es.wikipedia.org (the only project this site covers).
 */
@Injectable({ providedIn: 'root' })
export class XtoolsService {
  private http = inject(HttpClient);

  private readonly base = 'https://xtools.wmcloud.org/api/page';
  private readonly project = 'es.wikipedia.org';

  private pagePath(title: string): string {
    // XTools wants the wiki-style title (spaces as underscores), URL-encoded.
    return encodeURIComponent(title.replace(/ /g, '_'));
  }

  /** General page metadata: edit/editor counts, pageviews, creator, dates. */
  getPageInfo(title: string): Observable<XtoolsPageInfo> {
    return this.http.get<XtoolsPageInfo>(`${this.base}/pageinfo/${this.project}/${this.pagePath(title)}`);
  }

  /** Editors of the page ranked by edit count (high limit to capture them all). */
  getTopEditors(title: string, limit = 1000): Observable<XtoolsTopEditors> {
    return this.http.get<XtoolsTopEditors>(
      `${this.base}/top_editors/${this.project}/${this.pagePath(title)}`,
      { params: { limit } },
    );
  }
}
