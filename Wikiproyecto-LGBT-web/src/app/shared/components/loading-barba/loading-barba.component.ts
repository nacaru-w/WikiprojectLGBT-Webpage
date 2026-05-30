import { Component, input } from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';

/**
 * Standard loading indicator: the Barba mascot bobbing above an optional
 * caption. Use it everywhere a page / section / modal / popover is waiting on
 * data, so every in-app loader is the same size and style. The ONLY loader that
 * isn't this component is the first-load splash in index.html, which is
 * intentionally larger and has no label.
 *
 *  - label:   i18n key for the caption; pass null/'' to hide it.
 *  - compact: smaller mascot for tight spots (e.g. the notable-articles popover).
 *  - fill:    center within ~60vh so the barba sits mid-content (page-level
 *             loaders). Set false inside modals/overlays that size themselves.
 */
@Component({
  selector: 'app-loading-barba',
  standalone: true,
  imports: [TranslatePipe],
  templateUrl: './loading-barba.component.html',
  styleUrl: './loading-barba.component.scss',
  host: {
    '[class.fill]': 'fill()',
    '[class.compact]': 'compact()',
  },
})
export class LoadingBarbaComponent {
  readonly label = input<string | null>('common.loading');
  readonly compact = input(false);
  readonly fill = input(true);
}
