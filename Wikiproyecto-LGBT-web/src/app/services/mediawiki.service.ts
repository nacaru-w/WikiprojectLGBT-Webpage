import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, catchError, map, throwError } from 'rxjs';

import { MediawikiParams } from './models/mediawiki-params';
import { Participants } from './models/participants';
import { escapeInvalidCharacters } from '../utils/utils';

@Injectable({
  providedIn: 'root'
})
export class MediawikiService {
  private http = inject(HttpClient);

  url: string = "https://es.wikipedia.org/w/api.php";
  wikidataUrl: string = "https://www.wikidata.org/w/api.php"

  getPageContent(title: string): Observable<string> {
    const escapedTitle = escapeInvalidCharacters(title);
    let callUrl = this.url + "?origin=*";

    const params: MediawikiParams = {
      action: "query",
      prop: "revisions",
      titles: escapedTitle,
      rvprop: "content",
      rvslots: "main",
      formatversion: "2",
      // Follow redirects (e.g. "País del mes/…" pages that redirect to
      // "Evento del mes/…") so we get the target page's content.
      redirects: "1",
      format: "json"
    };

    for (let param in params) {
      callUrl += `&${param}=${params[param]}`;
    }

    return this.http.get(callUrl).pipe(
      map((response: any) => {
        return response?.query?.pages[0]?.revisions[0]?.slots?.main?.content;
      }),
      catchError((error: HttpErrorResponse) => {
        console.error('An error occurred:', error.message);
        return error.message
      })
    );
  }

  getPageExtract(title: string): Observable<string> {
    const escapedTitle = escapeInvalidCharacters(title);
    let callUrl = this.url + "?origin=*";

    const params: MediawikiParams = {
      action: "query",
      prop: "extracts",
      titles: escapedTitle,
      exsentences: "5",
      exlimit: "1",
      explaintext: "true",
      exsectionformat: "plain",
      format: "json"
    }

    for (let param in params) {
      callUrl += `&${param}=${params[param]}`;
    }

    const contentString = this.http.get(callUrl).pipe(
      map((response: any) => {
        const pages = response?.query?.pages;
        for (let page in pages) {
          return pages[page].extract;
        }
      })
    )

    return contentString

  }

  getLGBTArticleList(): Observable<string[]> {
    return this.getPageContent('Wikiproyecto:LGBT/Artículos_creados').pipe(
      map((res: string) => {
        const regex = /\[\[(.*?)\]\]/g;
        const matches: string[] = [];
        let match;

        while ((match = regex.exec(res)) !== null) {
          if (match[1] !== 'artículo' &&
            !match[1].toLocaleLowerCase().includes('wikiproyecto')) {
            matches.push(match[1]);
          }
        }

        return matches

      })
    )
  }

  /**
   * Recent Wikiproyecto LGBT articles with their creation date, parsed from the
   * same page as getLGBTArticleList ([[Wikiproyecto:LGBT/Artículos creados]]):
   * each entry is `# [[Title]] {{small|(24 de mayo)}}`. The date is the wiki's
   * own day-month string (the page has no year or creator). One request — the
   * date comes free, no extra per-article call.
   */
  getLgbtArticlesWithDates(): Observable<{ title: string; date: string | null }[]> {
    return this.getPageContent('Wikiproyecto:LGBT/Artículos_creados').pipe(
      map((res: string) => {
        const content = typeof res === 'string' ? res : '';
        const articles: { title: string; date: string | null }[] = [];
        const titleRe = /\[\[\s*([^\]|]+?)\s*(?:\|[^\]]*)?\]\]/;
        const dateRe = /\{\{\s*small\s*\|\s*\(?\s*([^)}]+?)\s*\)?\s*\}\}/i;
        for (const rawLine of content.split('\n')) {
          const line = rawLine.trim();
          if (!line.startsWith('#') || !line.includes('[[')) continue;
          const titleMatch = titleRe.exec(line);
          if (!titleMatch) continue;
          const title = titleMatch[1].trim();
          if (title === 'artículo' || title.toLowerCase().includes('wikiproyecto')) continue;
          const dateMatch = dateRe.exec(line);
          articles.push({ title, date: dateMatch ? dateMatch[1].trim() : null });
        }
        return articles;
      })
    );
  }

  getParticipantNumbers(): Observable<Participants> {
    return this.getPageContent('Wikiproyecto:LGBT/participantes').pipe(
      map((res: string) => {
        let obj: Participants = { totalCount: 0, thisYearCount: 0 }

        const totalRegex = /# /g;
        const totalCount = (res.match(totalRegex))!.length;

        obj.totalCount = totalCount;

        const thisYearRegex = /2026/g;
        const thisYearCount = (res.match(thisYearRegex))!.length;

        obj.thisYearCount = thisYearCount

        return obj

      })
    )
  }

  /**
   * Usernames of every Wikiproyecto LGBT member, for the contributions search.
   * Same source page as getParticipantNumbers(): the list mixes two entry
   * formats — "# {{u|Name}}" templates and signature links
   * "# [[Usuario:Name|label]] (… discusión …)". See extractUsername(). Deduped
   * case-insensitively and sorted for the autosuggest list.
   */
  getParticipantNames(): Observable<string[]> {
    return this.getPageContent('Wikiproyecto:LGBT/participantes').pipe(
      map((res: string) => {
        const content = typeof res === 'string' ? res : '';
        const names: string[] = [];
        const seen = new Set<string>();
        for (const rawLine of content.split('\n')) {
          const line = rawLine.trimStart();
          if (!line.startsWith('#')) continue;
          const name = this.extractUsername(line);
          if (!name) continue;
          const key = name.toLowerCase();
          if (!seen.has(key)) {
            seen.add(key);
            names.push(name);
          }
        }
        return names.sort((a, b) => a.localeCompare(b, 'es', { sensitivity: 'base' }));
      })
    );
  }

  /**
   * Pull the username out of one participant list item. Prefer a "{{u|Name}}"
   * template, then the first "[[Usuario:Name|…]]" user-page link, finally a
   * "[[Usuario discusión:Name|…]]" talk link (for the rare entry that links only
   * its discusión page). The user-page link is matched before the talk link so a
   * signature's leading user link wins over its trailing discusión link.
   */
  private extractUsername(line: string): string | null {
    const template = /\{\{\s*[uU](?:suario)?\s*\|\s*([^|}]+?)\s*[|}]/.exec(line);
    if (template) return template[1].trim();
    const userPage = /\[\[\s*(?:Usuario|User)\s*:\s*([^|\]]+?)\s*[|\]]/i.exec(line);
    if (userPage) return userPage[1].trim();
    const talkPage = /\[\[\s*(?:Usuario(?:\s+discusi[oó]n)?|User(?:\s+talk)?)\s*:\s*([^|\]]+?)\s*[|\]]/i.exec(line);
    if (talkPage) return talkPage[1].trim();
    return null;
  }

  getWikidataEntity(pageTitle: string): Observable<string> {
    let callUrl = this.url + "?origin=*";

    const params: MediawikiParams = {
      action: "query",
      prop: "pageprops",
      titles: pageTitle,
      ppprop: "wikibase_item",
      format: "json"
    }

    for (let param in params) {
      callUrl += `&${param}=${params[param]}`;
    }

    return this.http.get(callUrl).pipe(
      map((response: any) => {
        const pages = response.query?.pages
        let returnString;
        for (let page in pages) {
          console.log(pages[page]);
          returnString = pages[page].pageprops?.wikibase_item || '';
        }
        return returnString;
      }),
      catchError((error: HttpErrorResponse) => {
        console.error('An error ocurred', error.message);
        return error.message
      })
    )
  }

  getImageUrlFromWdEntity(Q: string): Observable<string | undefined> {
    let callUrl = this.wikidataUrl + "?origin=*";

    const params: MediawikiParams = {
      action: "wbgetclaims",
      property: "P18",
      entity: Q,
      format: 'json'
    }

    for (let param in params) {
      callUrl += `&${param}=${params[param]}`;
    }

    return this.http.get(callUrl).pipe(
      map((response: any) => {
        const returnedString = response.claims?.P18 ? response.claims?.P18[0].mainsnak?.datavalue?.value : undefined;
        return returnedString
      }),
      catchError((error: HttpErrorResponse) => {
        console.error('An error ocurred:', error.message);
        return error.message
      })
    )

  }

}
