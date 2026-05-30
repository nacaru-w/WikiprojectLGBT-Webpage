import { Component, inject, signal } from '@angular/core';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { NgbCollapse } from '@ng-bootstrap/ng-bootstrap';
import { BarbaService } from '../../../services/barba.service';
import { LanguageSwitcherComponent } from '../language-switcher/language-switcher.component';
import { ThemeToggleComponent } from '../theme-toggle/theme-toggle.component';
import { TranslatePipe } from '@ngx-translate/core';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [NgbCollapse, RouterLink, RouterLinkActive, LanguageSwitcherComponent, ThemeToggleComponent, TranslatePipe],
  templateUrl: './header.component.html',
  styleUrl: './header.component.scss',
  providers: [Router]
})
export class HeaderComponent {
  private router = inject(Router);
  private barbaService = inject(BarbaService);

  barba: string;

  isMenuCollapsed = signal(true);

  constructor() {
    this.barba = this.barbaService.getCurrentBarba();
  }

}
