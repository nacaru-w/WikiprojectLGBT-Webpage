import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, catchError, map, throwError } from 'rxjs';

import { MediawikiParams } from './models/mediawiki-params';
import { Participants } from './models/participants';
import { escapeInvalidCharacters } from '../utils/utils';

@Injectable({
  providedIn: 'root'
})
export class MediawikiService {

  url: string = "https://es.wikipedia.org/w/api.php";
  wikidataUrl: string = "https://www.wikidata.org/w/api.php"

  constructor(private http: HttpClient) { }

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

  getParticipantNumbers(): Observable<Participants> {
    return this.getPageContent('Wikiproyecto:LGBT/participantes').pipe(
      map((res: string) => {
        let obj: Participants = { totalCount: 0, thisYearCount: 0 }

        const totalRegex = /# /g;
        const totalCount = (res.match(totalRegex))!.length;

        obj.totalCount = totalCount;

        const thisYearRegex = /2024/g;
        const thisYearCount = (res.match(thisYearRegex))!.length;

        obj.thisYearCount = thisYearCount

        return obj

      })
    )
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
