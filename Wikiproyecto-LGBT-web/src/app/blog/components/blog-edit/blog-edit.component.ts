import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormControl, FormGroup, Validators, FormBuilder } from '@angular/forms';

import { ActivatedRoute } from '@angular/router';
import { ApiService } from '../../../services/api.service';

@Component({
  selector: 'app-blog-edit',
  standalone: true,
  imports: [ReactiveFormsModule, CommonModule],
  templateUrl: './blog-edit.component.html',
  styleUrl: './blog-edit.component.scss',
})
export class BlogEditComponent {
  blogForm: FormGroup;

  postId: string | null = '';
  date: string | Date = new Date();
  author: string = '';
  title: string = '';
  content: string = '';
  loaded: boolean = false;

  error: string = '';
  responseMessage: string = 'Enviando...';
  showSubmitSpinner: boolean = false;

  constructor(
    private formBuilder: FormBuilder,
    private activatedRoute: ActivatedRoute,
    private apiService: ApiService
  ) {
    this.postId = this.activatedRoute.snapshot.paramMap.get('id');
    if (this.postId) {
      this.getPost(this.postId);
    }

    this.blogForm = this.formBuilder.group({
      author: new FormControl(this.postId ? this.author : '', [Validators.required, Validators.maxLength(75)]),
      date: new FormControl(this.postId ? this.date : '', [Validators.required]),
      title: new FormControl(this.postId ? this.title : '', [Validators.maxLength(255)]),
      content: new FormControl(this.postId ? this.content : '', [Validators.maxLength(10000)]),
    })
  }

  getPost(id: string): void {
    this.apiService.getPostInfo(id).subscribe((res) => {
      if (typeof res == 'string' || !res) {
        this.error = res;
      } else {
        this.date = this.timestampToDate(res.date);
        this.author = res.author
        this.title = res.title
        this.content = res.content
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
          return `El campo no puede ser mayor a ${control.errors['maxlength'].requiredLength} caracteres`
        case 'required':
          return 'Este campo es obligatorio'
      }
    }
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
    this.showSubmitSpinner = true;
    const formValues = this.blogForm.value
    const formParams = [
      formValues.date || this.getCurrentDate(),
      formValues.author,
      formValues.title,
      formValues.content
    ] as const;
    if (!this.postId) {
      this.apiService.addPost(...formParams).subscribe((res) => {
        this.showSubmitSpinner = false;
        this.responseMessage = res?.success ? '¡Tu post ha sido publicado!' : '¡Parece que ha habido un error al añadir el post, prueba de nuevo más tarde!';
      })
    } else {
      this.apiService.editPost(this.postId, ...formParams).subscribe((res) => {
        this.showSubmitSpinner = false;
        this.responseMessage = res?.success ? '¡Tu post ha sido editado!' : '¡Parece que ha habido un error al editar el post, prueba de nuevo más tarde!';
      })
    }
  }

}
