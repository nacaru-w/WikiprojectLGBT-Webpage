import { Component } from '@angular/core';
import { NgbDropdownModule } from '@ng-bootstrap/ng-bootstrap';
import { FormControl, FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-form-main',
  standalone: true,
  imports: [NgbDropdownModule, ReactiveFormsModule, CommonModule],
  templateUrl: './form-main.component.html',
  styleUrl: './form-main.component.scss'
})
export class FormMainComponent {
  webForm: FormGroup;

  showOtherPronounsField: boolean = false;

  constructor(private formBuilder: FormBuilder) {
    this.webForm = this.formBuilder.group({
      name: new FormControl('', Validators.required),
      email: new FormControl('', [Validators.required, Validators.email]),
      pronouns: new FormControl('', [Validators.required]),
      otherPronouns: new FormControl('')
    })
  }

  onSubmit() {
    if (this.webForm.valid) {
      console.log("hola");
    } else {
      console.log(this.webForm.errors)
    }
  }

  isFieldInvalid(fieldName: string): boolean {
    const control = this.webForm.get(fieldName);
    return control!.invalid && (control!.dirty || control!.touched)
  }

  showValue(fieldName: string): string {
    const control = this.webForm.get(fieldName);
    return control?.value
  }

  otherPronounsChosen(): void {
    this.showOtherPronounsField = this.showValue('pronouns') == 'Sin determinar/otro'
  }

}
