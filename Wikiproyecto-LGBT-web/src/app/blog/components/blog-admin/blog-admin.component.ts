import { Component, OnInit, inject } from '@angular/core';
import { ApiService } from '../../../services/api.service';
import { BlogPostInfoModel } from '../../models/blog-post-info-model';
import { RouterLink } from '@angular/router';
import { DateFormatPipe } from '../../../pipes/date-format.pipe';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'app-blog-admin',
  standalone: true,
  imports: [DateFormatPipe, RouterLink, TranslatePipe],
  templateUrl: './blog-admin.component.html',
  styleUrl: './blog-admin.component.scss'
})
export class BlogAdminComponent implements OnInit {
  private apiService = inject(ApiService);
  private translate = inject(TranslateService);

  infoArray: BlogPostInfoModel[] = []
  adminUsernameText: string = '';

  ngOnInit(): void {
    this.getBlogPosts();
    this.getAdminName();
  }

  getBlogPosts(): void {
    this.apiService.getPosts().subscribe((res) => {
      if (typeof res != 'string') {
        this.infoArray = res;
      }
    })
  }

  deletePost(id: number): string | void {
    const deleteButton = document.querySelector(`#delete${id}`)
    if (!deleteButton) {
      return;
    }
    // The button toggles its own label, so compare/set against the translated
    // strings to keep the two-step "delete → confirm" flow working in any language.
    if (deleteButton.textContent?.trim() == this.translate.instant('blog.admin.delete')) {
      return deleteButton.textContent = this.translate.instant('blog.admin.confirmDelete');
    }
    const stringId = id.toString()
    this.apiService.deletePost(stringId).subscribe((res) => {
      if (res?.success) {
        this.removeRow(stringId);
      } else {
        deleteButton.textContent = this.translate.instant('blog.admin.error');
      }
    })
  }

  removeRow(postId: string) {
    const row = document.querySelector(`#post${postId}`);
    row?.remove();
  }

  getAdminName() {
    this.apiService.getLoginStatus().subscribe((res) => {
      this.adminUsernameText = res?.displayName
        ? this.translate.instant('blog.admin.greeting', { name: res.displayName })
        : '';
    })
  }

}
