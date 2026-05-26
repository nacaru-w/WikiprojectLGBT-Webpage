import { Component, OnInit, inject, signal } from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';
import { MediawikiService } from '../../../services/mediawiki.service';
import { parseEventoDelMes } from '../../utils/evento-parser';
import { EventoData } from '../../models/event-data';
import { EventMapComponent } from '../event-map/event-map.component';
import { EventListComponent } from '../event-list/event-list.component';
import { fadeInAnimation } from '../../../animations/animations';

type Section = 'map' | 'list';

@Component({
  selector: 'app-event-page',
  standalone: true,
  imports: [TranslatePipe, EventMapComponent, EventListComponent],
  templateUrl: './event-page.component.html',
  styleUrl: './event-page.component.scss',
  animations: [fadeInAnimation],
})
export class EventPageComponent implements OnInit {
  private mediawiki = inject(MediawikiService);

  readonly loaded = signal(false);
  readonly data = signal<EventoData>({ countries: [], events: [] });
  readonly section = signal<Section>('map');

  ngOnInit(): void {
    this.mediawiki.getPageContent('Wikiproyecto:LGBT/Evento del mes').subscribe({
      next: content => {
        this.data.set(parseEventoDelMes(content));
        this.loaded.set(true);
      },
      // Reveal the page even on error so it never hangs on the loader.
      error: () => this.loaded.set(true),
    });
  }

  show(event: Event, section: Section): void {
    event.preventDefault();
    this.section.set(section);
  }
}
