import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, catchError, map } from 'rxjs';

import { MediawikiParams } from '../models/mediawiki-params';

@Injectable({
  providedIn: 'root'
})
export class MediawikiService {

  url: string = "https://es.wikipedia.org/w/api.php";

  constructor(private http: HttpClient) { }

  getPageContent(title: string): Observable<string> {
    let callUrl = this.url + "?origin=*";

    const params: MediawikiParams = {
      action: "query",
      prop: "revisions",
      titles: title,
      rvprop: "content",
      rvslots: "main",
      formatversion: "2",
      format: "json"
    };

    for (let param in params) {
      callUrl += `&${param}=${params[param]}`;
    }

    const contentString = this.http.get(callUrl).pipe(
      map((response: any) => {
        return response?.query?.pages[0]?.revisions[0]?.slots?.main?.content;
      }
      ))

    return contentString

  }

  getPageExtract(title: string): Observable<string> {
    let callUrl = this.url + "?origin=*";

    const params: MediawikiParams = {
      action: "query",
      prop: "extracts",
      titles: title,
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

}
