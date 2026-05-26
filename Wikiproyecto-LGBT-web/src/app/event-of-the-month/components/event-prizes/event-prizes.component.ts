import { Component, input } from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';
import { PRIZE_ARTICLES_ICON, PRIZE_LESBIAN_ICON } from '../../data/prizes';

/** Prize winners for one edition, shown as award icons (hover for meaning). */
@Component({
  selector: 'app-event-prizes',
  standalone: true,
  imports: [TranslatePipe],
  templateUrl: './event-prizes.component.html',
  styleUrl: './event-prizes.component.scss',
})
export class EventPrizesComponent {
  readonly articles = input<string[]>([]);
  readonly lesbian = input<string[]>([]);

  readonly articlesIcon = PRIZE_ARTICLES_ICON;
  readonly lesbianIcon = PRIZE_LESBIAN_ICON;
}
