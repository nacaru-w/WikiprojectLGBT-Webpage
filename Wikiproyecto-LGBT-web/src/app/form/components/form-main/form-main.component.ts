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
  formSendDataStatus: string = 'Enviando formulario...';
  showSubmitSpinner: boolean = true;

  showOtherPronounsField: boolean = false;

  constructor(private formBuilder: FormBuilder) {
    this.webForm = this.formBuilder.group({
      pronouns: new FormControl('', [Validators.required]),
      otherPronouns: new FormControl(''),
      name: new FormControl('', Validators.required),
      email: new FormControl('', [Validators.required, Validators.email]),
      reason: new FormControl('', [Validators.maxLength(1000)]),
      wikimediaAccount: new FormControl(''),
      wikimediaAccountName: new FormControl('', [Validators.pattern(/^(?!.*[@:>=#€]).*$/), Validators.maxLength(255)]),
      attendedEvent: new FormControl(''),
      attendedEventName: new FormControl('', [Validators.maxLength(255)])
    })
  }

  onSubmit() {
    console.log(this.webForm.errors)
  }

  isFieldInvalid(fieldName: string): boolean {
    const control = this.webForm.get(fieldName);
    return control!.invalid && (control!.dirty)
  }

  showValue(fieldName: string): string {
    const control = this.webForm.get(fieldName);
    return control?.value
  }

  otherPronounsChosen(): void {
    this.showOtherPronounsField = this.showValue('pronouns') == 'Sin determinar/otro'
  }

}
