import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';

import { StatsViewSwitchComponent, ViewSwitchOption } from '../stats-view-switch/stats-view-switch.component';

/**
 * "Participantes" section shell: a sliding view-switch over the two participant
 * sub-routes (contributors lookup / by-year stats) inside one card, above the
 * routed sub-view. Each sub-view is its own route under /stats/participants.
 */
@Component({
  selector: 'app-statistics-participants-shell',
  standalone: true,
  imports: [RouterOutlet, StatsViewSwitchComponent, TranslatePipe],
  templateUrl: './statistics-participants-shell.component.html',
  styleUrl: './statistics-participants-shell.component.scss',
})
export class StatisticsParticipantsShellComponent {
  readonly options: ViewSwitchOption[] = [
    { labelKey: 'stats.participantsNav.lookup', link: 'contributors' },
    { labelKey: 'stats.participantsNav.stats', link: 'by-year' },
  ];
}
