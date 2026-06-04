import { Component, inject } from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';

import { BarbaService } from '../../../services/barba.service';

/**
 * Placeholder for the upcoming "Buscador" article-search view
 * (/stats/articles/search). The feature isn't defined yet; this stub keeps the
 * route + nav option in place and shows a "coming soon" message.
 */
@Component({
  selector: 'app-statistics-search',
  standalone: true,
  imports: [TranslatePipe],
  templateUrl: './statistics-search.component.html',
  styleUrl: './statistics-search.component.scss',
})
export class StatisticsSearchComponent {
  private barbaService = inject(BarbaService);

  /** Themed barba keyword for the placeholder illustration. */
  readonly barba: string = this.barbaService.getCurrentBarba();
}
