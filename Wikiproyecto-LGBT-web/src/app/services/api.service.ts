import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, catchError, throwError, map, of, tap } from 'rxjs';
import { BlogPostInfoModel } from '../blog/models/blog-post-info-model';

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  endpoint: string = 'https://wmlgbt-es-web.toolforge.org/api/'
  postsCache: BlogPostInfoModel[] | null = null;
  postCache: { [id: string]: BlogPostInfoModel } = {};

  constructor(private http: HttpClient) { }

  getPosts(): Observable<BlogPostInfoModel[] | string> {
    if (this.postsCache) {
      console.log('using postscache', this.postsCache)
      return of(this.postsCache)
    } else {
      return this.http.get<BlogPostInfoModel[]>(this.endpoint + 'blog_posts').pipe(
        tap((posts: BlogPostInfoModel[]) => this.postsCache = posts),
        catchError((error: HttpErrorResponse) => {
          console.error('An error ocurred: ', error.message);
          return error.message
        })
      )
    }
  }

  getPostInfo(id: string): Observable<BlogPostInfoModel | string> {
    if (this.postCache[id]) {
      // Return the cached post if it exists
      console.log('using postcache', this.postCache[id])
      return of(this.postCache[id]);
    } else {
      return this.http.get<BlogPostInfoModel[]>(this.endpoint + 'blog/' + id).pipe(
        map((res: BlogPostInfoModel[]) => {
          if (!res || res.length == 0) {
            return 'No se ha encontrado el post';
          }
          // Cache the fetched post
          this.postCache[id] = res[0];
          return res[0]
        }),
        catchError((error: HttpErrorResponse) => {
          console.error('An erorr ocurred: ', error.message);
          return error.message
        })
      )
    }
  }

}