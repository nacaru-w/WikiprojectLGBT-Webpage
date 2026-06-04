import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';

import { StatsViewSwitchComponent, ViewSwitchOption } from '../stats-view-switch/stats-view-switch.component';

/**
 * "Artículos" section shell: a sliding view-switch over the article sub-routes
 * (yearly / monthly / notable / latest / search) above the routed sub-view. Each
 * sub-view is its own route under /stats/articles, so the switch is real
 * navigation and deep links work.
 */
@Component({
  selector: 'app-statistics-articles-shell',
  standalone: true,
  imports: [RouterOutlet, StatsViewSwitchComponent, TranslatePipe],
  templateUrl: './statistics-articles-shell.component.html',
  styleUrl: './statistics-articles-shell.component.scss',
})
export class StatisticsArticlesShellComponent {
  readonly options: ViewSwitchOption[] = [
    { labelKey: 'stats.nav.yearlyArticles', link: 'yearly' },
    { labelKey: 'stats.nav.monthlyArticles', link: 'monthly' },
    { labelKey: 'stats.nav.notable', link: 'notable' },
    { labelKey: 'stats.nav.lastArticles', link: 'latest' },
    { labelKey: 'stats.articlesNav.search', link: 'search' },
  ];
}
