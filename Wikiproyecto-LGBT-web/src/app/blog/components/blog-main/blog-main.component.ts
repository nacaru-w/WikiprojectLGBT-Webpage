import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { OnInit } from '@angular/core';
import { ApiService } from '../../../services/api.service';
import { BlogPostInfoModel } from '../../models/blog-post-info-model';
import { DateFormatPipe } from '../../../pipes/date-format.pipe';

import { RouterModule } from '@angular/router';

import { popAnimation } from '../../../animations/animations';

@Component({
  selector: 'app-blog-main',
  standalone: true,
  imports: [CommonModule, DateFormatPipe, RouterModule],
  templateUrl: './blog-main.component.html',
  styleUrl: './blog-main.component.scss',
  animations: [popAnimation]
})
export class BlogMainComponent implements OnInit {
  error: string = '';
  loaded: boolean = false;
  sortedPosts: BlogPostInfoModel[] = [];
  constructor(private apiService: ApiService) { }

  getPosts() {
    this.apiService.getPosts().subscribe((res) => {
      if (!res || res.length == 0 || typeof res == 'string') {
        this.error = 'Oops, se ha producido un error';
      } else {
        this.sortedPosts = res.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        setTimeout(() => {
          this.loaded = true;
        }, 500);
      }
    })
  }

  ngOnInit(): void {
    this.getPosts();
  }

}
