import { Component, computed, input } from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';
import { NonCountryEvent, ThemedEventGroup } from '../../models/event-data';
import { monthTranslateKey } from '../../data/months';
import { EventPrizesComponent } from '../event-prizes/event-prizes.component';
import { EventSeeMoreComponent } from '../event-see-more/event-see-more.component';

@Component({
  selector: 'app-event-list',
  standalone: true,
  imports: [TranslatePipe, EventPrizesComponent, EventSeeMoreComponent],
  templateUrl: './event-list.component.html',
  styleUrl: './event-list.component.scss',
})
export class EventListComponent {
  readonly events = input<NonCountryEvent[]>([]);

  private readonly now = new Date();

  /** True if this edition is the one running in the current month. */
  isOngoing(ev: NonCountryEvent): boolean {
    return ev.upcoming && ev.year === this.now.getFullYear() && ev.monthIdx === this.now.getMonth();
  }

  /** True if a group's no-results state is the current month (vs a future one). */
  isGroupOngoing(group: ThemedEventGroup): boolean {
    return group.instances.some(ev => this.isOngoing(ev));
  }

  /**
   * Events that share a title (case-insensitive, so "Mes del Orgullo" and "Mes
   * del orgullo" merge) are grouped into one entry; their article totals are
   * summed. Groups are ranked by that sum (desc), instances kept chronological.
   */
  readonly groups = computed<ThemedEventGroup[]>(() => {
    const byTitle = new Map<string, ThemedEventGroup>();
    for (const ev of this.events()) {
      const key = ev.label.trim().toLowerCase();
      let group = byTitle.get(key);
      if (!group) { group = { label: ev.label, total: 0, instances: [] }; byTitle.set(key, group); }
      group.total += ev.total ?? 0;
      group.instances.push(ev);
    }
    return [...byTitle.values()].sort((a, b) =>
      b.total - a.total || (b.instances.at(-1)?.year ?? 0) - (a.instances.at(-1)?.year ?? 0)
    );
  });

  monthKey(monthIdx: number): string {
    return monthTranslateKey(monthIdx);
  }
}
