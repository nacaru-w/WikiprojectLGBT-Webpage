import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { ApiService } from '../../../services/api.service';
import { BlogPostInfoModel } from '../../models/blog-post-info-model';
import { DateFormatPipe } from '../../../pipes/date-format.pipe';
import { CommonModule } from '@angular/common';

import { popAnimation } from '../../../animations';

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
  content: string = '';
  loaded: boolean = false;

  error: string = '';

  constructor(
    private apiService: ApiService,
    private activatedRoute: ActivatedRoute
  ) {
    this.postId = this.activatedRoute.snapshot.paramMap.get('id')
    console.log(this.postId)
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
        this.content = res.content
        setTimeout(() => {
          this.loaded = true;
        }, 500);
      }
    })
  }

}
