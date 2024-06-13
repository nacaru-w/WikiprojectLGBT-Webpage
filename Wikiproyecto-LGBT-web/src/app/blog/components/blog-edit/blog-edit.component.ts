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
  date: Date = new Date();
  author: string = '';
  title: string = '';
  content: string = '';
  loaded: boolean = false;

  error: string = '';

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
        this.date = res.date
        this.author = res.author
        this.title = res.title
        this.content = res.content
      }
    })
  }

  ngOnInit(): void {

  }

  ngOnDestroy(): void {
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

  onSubmit() {
    console.log(this.blogForm.value)
  }

}
