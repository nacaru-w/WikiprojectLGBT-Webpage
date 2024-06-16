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

  deletePost(id: number): string | void {
    const deleteButton = document.querySelector(`#delete${id}`)
    if (deleteButton?.textContent == 'Eliminar') {
      return deleteButton.textContent = '¿Seguro?';
    }
    let stringId = id.toString()
    this.apiService.deletePost(stringId).subscribe((res) => {
      console.log('Component response:', res);
      if (res?.success) {
        this.removeRow(stringId);
      } else if (deleteButton) {
        deleteButton.textContent = 'Error';
      }
    })
  }

  removeRow(postId: string) {
    const row = document.querySelector(`#post${postId}`);
    row?.remove();
  }

}
