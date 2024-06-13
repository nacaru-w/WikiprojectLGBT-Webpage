import { Component } from '@angular/core';
import { NgbDropdownModule } from '@ng-bootstrap/ng-bootstrap';
import { FormControl, FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { buttonState } from '../../../animations';

@Component({
  selector: 'app-form-main',
  standalone: true,
  imports: [NgbDropdownModule, ReactiveFormsModule, CommonModule],
  templateUrl: './form-main.component.html',
  styleUrl: './form-main.component.scss',
  animations: [buttonState]
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
      name: new FormControl('', [Validators.required, Validators.maxLength(50)]),
      email: new FormControl('', [Validators.required, Validators.email]),
      reason: new FormControl('', [Validators.maxLength(1000)]),
      wikimediaAccount: new FormControl(''),
      wikimediaAccountName: new FormControl('', [Validators.pattern(/^(?!.*[@:>=#€]).*$/), Validators.maxLength(85)]),
      attendedEvent: new FormControl(''),
      attendedEventName: new FormControl('', [Validators.maxLength(255)]),
      readPrivacy: new FormControl('', [Validators.required]),
      readPolicy: new FormControl('', [Validators.required])
    })
  }

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
          return `El campo no puede ser mayor a ${control.errors['maxlength'].requiredLength} caracteres`
        case 'pattern':
          return 'Nombre de usuario no válido'
        case 'required':
          return 'Este campo es obligatorio'
        case 'email':
          return 'No es un tipo de email correcto'
      }
    }

  }

  showValue(fieldName: string): string {
    const control = this.webForm.get(fieldName);
    return control?.value
  }

  otherPronounsChosen(): void {
    this.showOtherPronounsField = this.showValue('pronouns') == 'Sin determinar/otro'
  }

  concordWikimediaAccountNamePlaceholder() {
    switch (this.showValue('pronouns')) {
      case 'Él':
        return 'Nombre de usuario';
      case 'Ella':
        return 'Nombre de usuaria';
      case 'Elle':
        return 'Nombre de usuarie';
      default:
        return 'Nombre de usuario';
    }
  }

}
