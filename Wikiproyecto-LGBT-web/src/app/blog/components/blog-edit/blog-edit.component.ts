import { Component, OnDestroy, OnInit } from '@angular/core';

import { ReactiveFormsModule, FormControl, FormGroup, Validators, FormBuilder } from '@angular/forms';

@Component({
  selector: 'app-blog-edit',
  standalone: true,
  imports: [ReactiveFormsModule],
  templateUrl: './blog-edit.component.html',
  styleUrl: './blog-edit.component.scss',
})
export class BlogEditComponent {
  blogForm: FormGroup;

  constructor(private formBuilder: FormBuilder) {
    this.blogForm = this.formBuilder.group({
      editorContent: new FormControl(
        { disabled: false }
      )
    })
  }

  ngOnInit(): void {

  }

  ngOnDestroy(): void {
  }

  onSubmit() {
    console.log(this.blogForm.value)
  }

}
