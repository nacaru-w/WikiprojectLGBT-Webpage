import { Component, inject } from '@angular/core';
import { NgbDropdownModule } from '@ng-bootstrap/ng-bootstrap';
import { SupportedLang } from '../../../services/i18n/i18n.config';
import { LANG_LABELS, LanguageService } from '../../../services/i18n/language.service';

@Component({
  selector: 'app-language-switcher',
  standalone: true,
  imports: [NgbDropdownModule],
  templateUrl: './language-switcher.component.html',
  styleUrl: './language-switcher.component.scss',
})
export class LanguageSwitcherComponent {
  private languageService = inject(LanguageService);

  readonly labels = LANG_LABELS;
  readonly langs = this.languageService.supportedLangs;
  readonly currentLang = this.languageService.currentLang;

  select(lang: SupportedLang): void {
    this.languageService.setLang(lang);
  }
}
