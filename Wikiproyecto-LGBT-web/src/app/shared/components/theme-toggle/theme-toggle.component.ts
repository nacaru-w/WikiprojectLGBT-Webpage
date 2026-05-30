import { Component, computed, inject } from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';
import { ThemeService } from '../../../services/theme/theme.service';

@Component({
  selector: 'app-theme-toggle',
  standalone: true,
  imports: [TranslatePipe],
  templateUrl: './theme-toggle.component.html',
  styleUrl: './theme-toggle.component.scss',
})
export class ThemeToggleComponent {
  private themeService = inject(ThemeService);

  /** True while dark mode is active — drives which glyph (sun/moon) shows. */
  readonly isDark = computed(() => this.themeService.theme() === 'dark');

  toggle(): void {
    this.themeService.toggle();
  }
}
