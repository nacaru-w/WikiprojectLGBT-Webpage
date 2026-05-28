import { HttpClient, HttpErrorResponse, HttpHeaders } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, catchError, map, of, tap } from 'rxjs';
import { BlogPostInfoModel } from '../blog/models/blog-post-info-model';
import { MemberCreationsResponse } from './models/member-creations';
import { ArticleAuthorshipResponse } from './models/article-authorship';
import { REQUEST } from '../../express.tokens';

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  private http = inject(HttpClient);
  // The REQUEST token is declared as an Express Request, but the original code
  // treated it as a DOM Request (using `headers.get(...)`); we keep that typing
  // to preserve the existing behaviour after switching to inject().
  private request = inject(REQUEST, { optional: true }) as unknown as Request | null;

  endpoint: string = 'https://wmlgbt-es-web.toolforge.org/api/'
  postsCache: BlogPostInfoModel[] | null = null;
  postCache: { [id: string]: BlogPostInfoModel } = {};

  private getHeaders(): HttpHeaders {
    let headers = new HttpHeaders({ 'Content-Type': 'application/json' }); /*'Access-Control-Allow-Origin': 'https://wmlgbt-es-web.toolforge.org'*/
    let cookie = this.request?.headers?.get("Cookie");
    if (cookie) {
      headers = headers.set('Cookie', cookie);
    }
    return headers;
  }

  getPosts(): Observable<BlogPostInfoModel[] | string> {
    if (this.postsCache) {
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

  addPost(date: string, author: string, title: string, content: string): Observable<any> {
    const postData = { date, author, title, content };
    const options = { headers: this.getHeaders() }
    return this.http.post<any>(this.endpoint + 'blog', postData, options).pipe(
      map(response => {
        // invalidate cache for all posts
        this.postsCache = null;
        return {
          success: true,
          message: 'Post added succesfully with id: ' + response.insertId
        }
      }),
      catchError((error: HttpErrorResponse) => {
        console.error('An error occurred: ', error.message);
        return of(error)
      })
    )
  }

  editPost(id: string, date: string, author: string, title: string, content: string): Observable<any> {
    const putData = { id, date, author, title, content };
    const options = { headers: this.getHeaders() }
    return this.http.put<any>(this.endpoint + 'blog/' + id, putData, options).pipe(
      map(response => {
        // invalidate cache
        this.postsCache = null;
        delete this.postCache[id];
        return {
          success: true,
          message: `Post edited successfully with id: ` + response.id
        }
      }),
      catchError((error: HttpErrorResponse) => {
        console.error('An error occurred: ', error.message);
        return of(error)
      })
    )
  }

  deletePost(id: string): Observable<any> {
    const options = { headers: this.getHeaders() }
    return this.http.delete<any>(this.endpoint + 'blog/' + id, options).pipe(
      map(response => {
        this.postsCache = null;
        delete this.postCache[id]
        return {
          success: true,
          message: 'Post deleted successfully with id: ' + response.id
        }
      }),
      catchError((error: HttpErrorResponse) => {
        console.error('An error ocurred: ', error.message);
        return of(error)
      })
    )
  }

  getLoginStatus(): Observable<any> {
    const options = { headers: this.getHeaders() }
    return this.http.get<any>(this.endpoint + 'user', options).pipe(
      map(response => response),
      catchError((error: HttpErrorResponse) => {
        console.error('An error ocurred: ', error.message);
        return of(error);
      })
    )
  }

  isAdmin(): Observable<boolean> {
    return this.getLoginStatus().pipe(
      map(response => response?.isAdmin || false)
    )
  }

  /**
   * Look up the LGBT-tracked articles a given Wikipedia user created.
   * Errors are left to propagate so the caller can drive its own loading/error
   * UI state.
   */
  getMemberLgbtCreations(username: string): Observable<MemberCreationsResponse> {
    return this.http.get<MemberCreationsResponse>(
      this.endpoint + 'member-creations/' + encodeURIComponent(username)
    );
  }

  /**
   * Content-authorship breakdown for an article (who wrote how much of the
   * current text). Proxies XTools' authorship table server-side because that
   * route sends no CORS headers. Errors propagate to the caller.
   */
  getArticleAuthorship(title: string): Observable<ArticleAuthorshipResponse> {
    return this.http.get<ArticleAuthorshipResponse>(
      this.endpoint + 'article-authorship/' + encodeURIComponent(title)
    );
  }

}