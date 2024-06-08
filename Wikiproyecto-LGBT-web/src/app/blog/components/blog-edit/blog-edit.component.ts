import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormControl, FormGroup, Validators, FormBuilder } from '@angular/forms';

@Component({
  selector: 'app-blog-edit',
  standalone: true,
  imports: [ReactiveFormsModule, CommonModule],
  templateUrl: './blog-edit.component.html',
  styleUrl: './blog-edit.component.scss',
})
export class BlogEditComponent {
  blogForm: FormGroup;

  constructor(private formBuilder: FormBuilder) {
    this.blogForm = this.formBuilder.group({
      author: new FormControl('', [Validators.required, Validators.maxLength(10)]),
      date: new FormControl('', [Validators.required]),
      title: new FormControl('', [Validators.maxLength(100)]),
      content: new FormControl('', [Validators.maxLength(10000)]),
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
