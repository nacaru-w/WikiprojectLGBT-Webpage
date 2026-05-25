import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormControl, FormGroup, Validators, FormBuilder } from '@angular/forms';

import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { ApiService } from '../../../services/api.service';

import { QuillEditorComponent, QuillModules } from 'ngx-quill';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'app-blog-edit',
  standalone: true,
  imports: [ReactiveFormsModule, CommonModule, RouterLink, QuillEditorComponent, TranslatePipe],
  templateUrl: './blog-edit.component.html',
  styleUrl: './blog-edit.component.scss',
})
export class BlogEditComponent implements OnInit {
  private formBuilder = inject(FormBuilder);
  private activatedRoute = inject(ActivatedRoute);
  private apiService = inject(ApiService);
  private router = inject(Router);
  private translate = inject(TranslateService);

  postId: string | null = this.activatedRoute.snapshot.paramMap.get('id');
  date: string | Date = new Date();
  author: string = '';
  title: string = '';
  content: string = '';
  loaded = signal(false);

  error: string = '';
  // Holds a translation key; the template renders it through the translate pipe.
  responseMessage: string = 'blog.edit.sending';
  showSubmitSpinner = signal(false);

  // The live Quill instance, captured once the editor is created in the browser.
  private quillEditor: any;

  // Basic formatting toolbar. The image button is overridden to insert by URL
  // only — there is no upload button, so users can embed images via links.
  quillModules: QuillModules = {
    toolbar: {
      container: [
        ['bold', 'italic', 'underline', 'strike'],
        [{ header: [2, 3, 4, false] }],
        [{ list: 'ordered' }, { list: 'bullet' }],
        ['blockquote'],
        ['link', 'image'],
        ['clean'],
      ],
      handlers: {
        image: () => this.insertImageByUrl(),
      },
    },
  };

  blogForm: FormGroup = this.formBuilder.group({
    author: new FormControl(this.postId ? this.author : '', [Validators.required, Validators.maxLength(75)]),
    date: new FormControl(this.postId ? this.date : '', [Validators.required]),
    title: new FormControl(this.postId ? this.title : '', [Validators.maxLength(255)]),
    content: new FormControl(this.postId ? this.content : '', [Validators.maxLength(10000)]),
  });

  ngOnInit(): void {
    if (this.postId) {
      this.getPost(this.postId);
    }
  }

  getPost(id: string): void {
    this.apiService.getPostInfo(id).subscribe((res) => {
      if (typeof res == 'string' || !res) {
        this.error = res;
      } else {
        const data = {
          date: this.timestampToDate(res.date),
          author: res.author,
          title: res.title,
          content: res.content
        }
        this.blogForm.patchValue(data);
      }
    })
  }

  isFieldInvalid(fieldName: string): boolean {
    const control = this.blogForm.get(fieldName);
    return !control!.valid && (control!.dirty)
  }

  getErrorMessage(fieldName: string): string | void {
    const control = this.blogForm.get(fieldName);
    if (control?.errors) {
      switch (Object.keys(control?.errors)[0]) {
        case 'maxlength':
          return this.translate.instant('validation.maxlength', { max: control.errors['maxlength'].requiredLength })
        case 'required':
          return this.translate.instant('validation.required')
      }
    }
  }

  hasError(fieldName: string, errorType: string): boolean {
    return !!this.blogForm.get(fieldName)?.errors?.[errorType];
  }

  timestampToDate(timestamp: string | Date): string {
    const date = new Date(timestamp);
    return date.toISOString().split('T')[0];
  }

  dateToTimestamp(dateString: string): number {
    const [year, month, day] = dateString.split('-').map(Number);
    const date = new Date(year, month - 1, day);

    return date.getTime();
  }

  getCurrentDate(): string {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  onSubmit(): void {
    this.showSubmitSpinner.set(true);
    const formValues = this.blogForm.value
    const formParams = [
      formValues.date || this.getCurrentDate(),
      formValues.author,
      formValues.title,
      formValues.content
    ] as const;
    if (!this.postId) {
      this.apiService.addPost(...formParams).subscribe((res) => {
        this.showSubmitSpinner.set(false);
        this.responseMessage = res?.success ? 'blog.edit.published' : 'blog.edit.publishError';
      })
    } else {
      this.apiService.editPost(this.postId, ...formParams).subscribe((res) => {
        this.showSubmitSpinner.set(false);
        this.responseMessage = res?.success ? 'blog.edit.edited' : 'blog.edit.editError';
      })
    }
  }

  onEditorCreated(quill: any): void {
    this.quillEditor = quill;
  }

  // Prompts for an image URL and embeds it at the cursor. Replaces Quill's
  // default image button (which would open a file picker / base64 upload).
  insertImageByUrl(): void {
    const quill = this.quillEditor;
    if (!quill) {
      return;
    }
    const url = window.prompt(this.translate.instant('blog.edit.imagePrompt'))?.trim();
    if (!url) {
      return;
    }
    if (!/^https?:\/\//i.test(url)) {
      window.alert(this.translate.instant('blog.edit.imageUrlInvalid'));
      return;
    }
    const range = quill.getSelection(true);
    quill.insertEmbed(range.index, 'image', url, 'user');
    quill.setSelection(range.index + 1, 0);
  }

  navigateToPanel() {
    setTimeout(() => {
      this.router.navigateByUrl("/blog-admin")
    }, 500);
  }


}
