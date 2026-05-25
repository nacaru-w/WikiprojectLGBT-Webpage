import { Component, inject, signal } from '@angular/core';
import { NgbDropdownModule } from '@ng-bootstrap/ng-bootstrap';
import { FormControl, FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { buttonState } from '../../../animations/animations';
import { BarbaService } from '../../../services/barba.service';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'app-form-main',
  standalone: true,
  imports: [NgbDropdownModule, ReactiveFormsModule, CommonModule, TranslatePipe],
  templateUrl: './form-main.component.html',
  styleUrl: './form-main.component.scss',
  animations: [buttonState]
})
export class FormMainComponent {
  private formBuilder = inject(FormBuilder);
  private barbaService = inject(BarbaService);
  private translate = inject(TranslateService);

  webForm: FormGroup = this.formBuilder.group({
    pronouns: new FormControl('', [Validators.required]),
    otherPronouns: new FormControl(''),
    name: new FormControl('', [Validators.required, Validators.maxLength(50)]),
    email: new FormControl('', [Validators.required, Validators.email]),
    reason: new FormControl('', [Validators.maxLength(1000)]),
    wikimediaAccount: new FormControl(''),
    wikimediaAccountName: new FormControl('', [Validators.pattern(/^(?!.*[@:>=#€]).*$/), Validators.maxLength(85)]),
    attendedEvent: new FormControl(''),
    attendedEventName: new FormControl('', [Validators.maxLength(255)]),
    readPrivacy: new FormControl('', [Validators.required]),
    readPolicy: new FormControl('', [Validators.required])
  });

  // Holds a translation key; the template renders it through the translate pipe.
  formSendDataStatus: string = 'form.sending';
  showSubmitSpinner = signal(true);

  showOtherPronounsField = signal(false);

  barba: string = this.barbaService.getCurrentBarba();

  onSubmit() {
    console.log("Form:", this.webForm.value)
  }

  isFieldInvalid(fieldName: string): boolean {
    const control = this.webForm.get(fieldName);
    return control!.invalid && (control!.dirty)
  }

  isFormValid(): boolean {
    if (this.webForm.invalid || !this.showValue('readPrivacy') || !this.showValue('readPolicy')) {
      return false
    }
    return true
  }

  getErrorMessage(fieldName: string): string | void {
    const control = this.webForm.get(fieldName);
    if (control?.errors) {
      switch (Object.keys(control?.errors)[0]) {
        case 'maxlength':
          return this.translate.instant('validation.maxlength', { max: control.errors['maxlength'].requiredLength })
        case 'pattern':
          return this.translate.instant('validation.pattern')
        case 'required':
          return this.translate.instant('validation.required')
        case 'email':
          return this.translate.instant('validation.email')
      }
    }

  }

  showValue(fieldName: string): string {
    const control = this.webForm.get(fieldName);
    return control?.value
  }

  otherPronounsChosen(): void {
    this.showOtherPronounsField.set(this.showValue('pronouns') == 'other')
  }

  concordWikimediaAccountNamePlaceholder() {
    switch (this.showValue('pronouns')) {
      case 'he':
        return this.translate.instant('form.username.he');
      case 'she':
        return this.translate.instant('form.username.she');
      case 'they':
        return this.translate.instant('form.username.they');
      default:
        return this.translate.instant('form.username.he');
    }
  }

}
