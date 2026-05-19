import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { ApiService } from '../../../services/api.service';
import { BlogPostInfoModel } from '../../models/blog-post-info-model';
import { DateFormatPipe } from '../../../pipes/date-format.pipe';
import { CommonModule } from '@angular/common';

import { DomSanitizer, SafeHtml } from '@angular/platform-browser';

import { popAnimation } from '../../../animations/animations';

@Component({
  selector: 'app-blog-post',
  standalone: true,
  imports: [DateFormatPipe, CommonModule],
  templateUrl: './blog-post.component.html',
  styleUrl: './blog-post.component.scss',
  animations: [popAnimation]
})
export class BlogPostComponent implements OnInit {
  postId: string | null = '';
  date: Date = new Date();
  author: string = '';
  title: string = '';
  content: string | SafeHtml = '';
  loaded: boolean = false;

  error: string = '';

  constructor(
    private apiService: ApiService,
    private activatedRoute: ActivatedRoute,
    private sanitizer: DomSanitizer
  ) {
    this.postId = this.activatedRoute.snapshot.paramMap.get('id')
  }

  ngOnInit(): void {
    if (!this.postId) {
      this.loaded = true;
      this.error = 'No se ha encontrado el post'
    } else {
      this.getPost(this.postId);
    }
  }

  getPost(id: string): void {
    this.apiService.getPostInfo(id).subscribe((res) => {
      if (typeof res == 'string' || !res) {
        this.error = res;
      } else {
        this.date = res.date
        this.author = res.author
        this.title = res.title
        this.content = this.sanitizer.bypassSecurityTrustHtml(
          this.normalizeWikimediaThumbWidths(res.content)
        );
        setTimeout(() => {
          this.loaded = true;
        }, 300);
      }
    })
  }

  // Wikimedia only serves hotlinked thumbnails at a fixed set of widths
  // (https://w.wiki/GHai). Any other size returns HTTP 400 + text/html,
  // which Firefox then blocks via OpaqueResponseBlocking.
  private static readonly ALLOWED_THUMB_WIDTHS = [20, 40, 60, 120, 250, 330, 500, 960, 1280, 1920, 3840];

  private normalizeWikimediaThumbWidths(html: string): string {
    const thumbRegex = /(upload\.wikimedia\.org\/wikipedia\/[^"'\s]+\/thumb\/[^"'\s]+\/)(\d+)(px-[^"'\s]+)/g;
    return html.replace(thumbRegex, (_match, prefix, widthStr, suffix) => {
      const width = parseInt(widthStr, 10);
      const allowed = BlogPostComponent.ALLOWED_THUMB_WIDTHS.find(w => w >= width)
        ?? BlogPostComponent.ALLOWED_THUMB_WIDTHS[BlogPostComponent.ALLOWED_THUMB_WIDTHS.length - 1];
      return `${prefix}${allowed}${suffix}`;
    });
  }

}
