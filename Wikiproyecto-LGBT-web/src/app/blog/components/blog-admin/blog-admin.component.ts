import { Component, OnInit } from '@angular/core';
import { ApiService } from '../../../services/api.service';
import { BlogPostInfoModel } from '../../models/blog-post-info-model';

import { DateFormatPipe } from '../../../pipes/date-format.pipe';

@Component({
  selector: 'app-blog-admin',
  standalone: true,
  imports: [DateFormatPipe],
  templateUrl: './blog-admin.component.html',
  styleUrl: './blog-admin.component.scss'
})
export class BlogAdminComponent implements OnInit {
  infoArray: BlogPostInfoModel[] = []

  constructor(private apiService: ApiService) { }

  ngOnInit(): void {
    this.getBlogPosts();
  }

  getBlogPosts(): void {
    this.apiService.getPosts().subscribe((res) => {
      if (typeof res == 'string') {
        console.log('Error: ', res);
      } else {
        this.infoArray = res;
      }
    })
  }

  deletePost(id: string | number): void {
    id = id.toString()
    this.apiService.deletePost(id).subscribe((res) => {
      console.log('Component response:', res);
    })
  }

}
