import { Component, ElementRef, NgZone, OnDestroy, PLATFORM_ID, ViewChild, inject, isDevMode, signal } from '@angular/core';
import { NgbDropdownModule } from '@ng-bootstrap/ng-bootstrap';
import { FormControl, FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { buttonState } from '../../../animations/animations';
import { BarbaService } from '../../../services/barba.service';
import { ApiService } from '../../../services/api.service';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';

// Cloudflare Turnstile site key. Real keys are locked to the
// wmlgbt-es-web.toolforge.org hostname, so they fail on localhost; in dev we
// use Cloudflare's documented "always passes" test key instead. Replace the
// production key with the real one from the Turnstile dashboard.
const TURNSTILE_TEST_SITE_KEY = '1x00000000000000000000AA';
const TURNSTILE_PROD_SITE_KEY = '0x4AAAAAADYC5X3hzf3YzlQP';
const TURNSTILE_SCRIPT_ID = 'cf-turnstile-script';
const TURNSTILE_SCRIPT_SRC = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';
// api.js is loaded async/defer, so it must be told which global to call once
// ready (turnstile.ready() is incompatible with async/defer).
const TURNSTILE_ONLOAD_CB = 'onloadTurnstileCallback';

type SendStatus = 'idle' | 'captcha' | 'sending' | 'success' | 'error';

@Component({
  selector: 'app-form-main',
  standalone: true,
  imports: [NgbDropdownModule, ReactiveFormsModule, CommonModule, TranslatePipe],
  templateUrl: './form-main.component.html',
  styleUrl: './form-main.component.scss',
  animations: [buttonState]
})
export class FormMainComponent implements OnDestroy {
  private formBuilder = inject(FormBuilder);
  private barbaService = inject(BarbaService);
  private translate = inject(TranslateService);
  private apiService = inject(ApiService);
  private zone = inject(NgZone);
  private platformId = inject(PLATFORM_ID);

  @ViewChild('turnstileContainer') private turnstileContainer?: ElementRef<HTMLDivElement>;
  private widgetId: string | undefined;

  private readonly turnstileSiteKey = isDevMode() ? TURNSTILE_TEST_SITE_KEY : TURNSTILE_PROD_SITE_KEY;

  webForm: FormGroup = this.formBuilder.group({
    pronouns: new FormControl('', [Validators.required]),
    otherPronouns: new FormControl('', [Validators.maxLength(100)]),
    name: new FormControl('', [Validators.required, Validators.maxLength(50)]),
    email: new FormControl('', [Validators.required, Validators.email]),
    reason: new FormControl('', [Validators.maxLength(1000)]),
    wikimediaAccount: new FormControl(''),
    wikimediaAccountName: new FormControl('', [Validators.pattern(/^(?!.*[@:>=#€]).*$/), Validators.maxLength(85)]),
    attendedEvent: new FormControl(''),
    attendedEventName: new FormControl('', [Validators.maxLength(255)]),
    readPrivacy: new FormControl('', [Validators.required]),
    readPolicy: new FormControl('', [Validators.required]),
    // Carries the Turnstile token to the backend. Not a gate on the submit
    // button: the captcha runs inside the confirmation modal (after the button
    // is clicked), so it must not block the button from being enabled.
    turnstileToken: new FormControl('')
  });

  sendStatus = signal<SendStatus>('idle');

  showOtherPronounsField = signal(false);

  barba: string = this.barbaService.getCurrentBarba();

  ngOnDestroy(): void {
    if (isPlatformBrowser(this.platformId) && this.widgetId !== undefined) {
      (window as any).turnstile?.remove(this.widgetId);
    }
  }

  // Clicking the (valid) submit button opens the confirmation modal via
  // data-bs-toggle; this runs alongside that to switch the modal to its captcha
  // step and render/reset the widget. The render is deferred so the modal is
  // on-screen and Angular has applied the 'captcha' state first — Turnstile must
  // measure a visible, non-zero element.
  onVerifyClick(): void {
    if (!this.isFormValid()) {
      return;
    }
    this.sendStatus.set('captcha');
    this.setToken('');
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }
    setTimeout(() => {
      if (this.widgetId === undefined) {
        this.renderTurnstile();
      } else {
        (window as any).turnstile?.reset(this.widgetId);
      }
    }, 250);
  }

  // Closing the modal returns to the neutral state so a reopen starts fresh.
  onModalClose(): void {
    this.sendStatus.set('idle');
    this.setToken('');
  }

  // Fired by the Turnstile callback once the visitor passes: send the form and
  // reuse the modal to report progress and the final result.
  private verifyAndSend(token: string): void {
    this.setToken(token);
    if (!this.isFormValid() || this.sendStatus() === 'sending') {
      return;
    }
    this.sendStatus.set('sending');
    this.apiService.sendContactForm(this.webForm.value).subscribe({
      next: () => this.sendStatus.set('success'),
      error: () => this.sendStatus.set('error')
    });
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

  /** Pronoun options for the dropdown (labels come from i18n: form.pronouns.<key>). */
  readonly pronounOptions = ['he', 'she', 'they', 'other'];

  /** Pick a pronoun from the ngb dropdown (replaces the old native <select>). */
  selectPronoun(value: string): void {
    const control = this.webForm.get('pronouns');
    control?.setValue(value);
    control?.markAsDirty();
    this.otherPronounsChosen();
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

  private renderTurnstile(): void {
    const w = window as any;
    const render = () => {
      const turnstile = w.turnstile;
      if (!turnstile || !this.turnstileContainer?.nativeElement || this.widgetId !== undefined) {
        return;
      }
      this.widgetId = turnstile.render(this.turnstileContainer.nativeElement, {
        sitekey: this.turnstileSiteKey,
        // Turnstile callbacks fire outside Angular's zone (third-party script),
        // so re-enter the zone. Passing the challenge submits the form.
        callback: (token: string) => this.zone.run(() => this.verifyAndSend(token)),
        'expired-callback': () => this.zone.run(() => this.setToken('')),
        'error-callback': () => this.zone.run(() => this.setToken('')),
      });
    };

    // Script already loaded (e.g. SPA re-navigation): render straight away.
    if (w.turnstile) {
      render();
      return;
    }
    // Otherwise let api.js call us back once it has loaded.
    w[TURNSTILE_ONLOAD_CB] = render;
    if (document.getElementById(TURNSTILE_SCRIPT_ID)) {
      return;
    }
    const script = document.createElement('script');
    script.id = TURNSTILE_SCRIPT_ID;
    script.src = `${TURNSTILE_SCRIPT_SRC}&onload=${TURNSTILE_ONLOAD_CB}`;
    script.async = true;
    script.defer = true;
    document.head.appendChild(script);
  }

  private setToken(token: string): void {
    this.webForm.get('turnstileToken')?.setValue(token);
  }

}
