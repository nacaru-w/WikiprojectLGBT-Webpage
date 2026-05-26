import { Component, computed, inject, input, signal } from '@angular/core';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import worldMap from '@svg-maps/world';
import { CountryEvent } from '../../models/event-data';
import { localizedCountryName } from '../../data/country-codes';
import { monthTranslateKey } from '../../data/months';
import { EventPrizesComponent } from '../event-prizes/event-prizes.component';
import { EventSeeMoreComponent } from '../event-see-more/event-see-more.component';

interface SvgLocation { id: string; name: string; path: string; }
const WORLD = worldMap as unknown as { viewBox: string; locations: SvgLocation[] };

// Crop the full-world viewBox to Spain + Spanish-speaking America (the bounding
// box of the featured countries, measured from the rendered paths, plus margin).
const FOCUS_VIEWBOX = '118 302 394 364';

// Choropleth ramp by a country's total articles, across the project's two key
// hues for strong contrast: light cyan-blue ($primary) for the fewest articles →
// a deep, darkened project pink for the most. Normalized over the actual min–max
// range; a legend explains the scale.
const FILL_LIGHT = [179, 239, 255]; // $primary, light cyan-blue (fewest)
const FILL_DARK = [158, 20, 78];    // deep rose-pink, a darkened $secondary (most)
const LEGEND_GRADIENT = `linear-gradient(to right, rgb(${FILL_LIGHT.join(', ')}), rgb(${FILL_DARK.join(', ')}))`;
const lerp = (a: number, b: number, t: number) => Math.round(a + (b - a) * t);

@Component({
  selector: 'app-event-map',
  standalone: true,
  imports: [TranslatePipe, EventPrizesComponent, EventSeeMoreComponent],
  templateUrl: './event-map.component.html',
  styleUrl: './event-map.component.scss',
})
export class EventMapComponent {
  private translate = inject(TranslateService);

  readonly countries = input<CountryEvent[]>([]);

  readonly viewBox = FOCUS_VIEWBOX;
  readonly locations = WORLD.locations;
  readonly legendGradient = LEGEND_GRADIENT;

  /** iso2 → its event data, for O(1) lookup while rendering 250+ paths. */
  private readonly byIso = computed(() => {
    const map = new Map<string, CountryEvent>();
    for (const c of this.countries()) map.set(c.iso2, c);
    return map;
  });

  /** The country whose panel is shown (hovered on desktop, tapped on mobile). */
  readonly selectedIso = signal<string | null>(null);
  readonly selected = computed(() => {
    const iso = this.selectedIso();
    return iso ? this.byIso().get(iso) ?? null : null;
  });

  /** When a country is clicked it "locks" the panel: hovering other countries no
   *  longer changes the selection, so the user can move to the panel and reach its
   *  "See more" button without a country on the way stealing it. Click to unlock. */
  readonly lockedIso = signal<string | null>(null);

  /** iso2 → total articles across all its editions, with min/max for scaling. */
  private readonly totals = computed(() => {
    const map = new Map<string, number>();
    let max = 0, min = Infinity, minIso = '', maxIso = '';
    for (const c of this.countries()) {
      const sum = c.editions.reduce((acc, ed) => acc + (ed.total ?? 0), 0);
      map.set(c.iso2, sum);
      if (sum > max) { max = sum; maxIso = c.iso2; }
      if (sum < min) { min = sum; minIso = c.iso2; }
    }
    return { map, max, min: min === Infinity ? 0 : min, minIso, maxIso };
  });

  /** Min/max country totals + their flags, shown at the ends of the legend scale. */
  readonly legendRange = computed(() => {
    const { min, max, minIso, maxIso } = this.totals();
    return { min, max, minIso, maxIso };
  });

  isActive(iso2: string): boolean {
    return this.byIso().has(iso2);
  }

  /** Total articles for a country, summed across all its editions/challenges. */
  countryTotal(iso2: string): number {
    return this.totals().map.get(iso2) ?? 0;
  }

  /** Fill for an active country: darker the more articles it produced overall. */
  fillFor(iso2: string): string {
    const { map, max, min } = this.totals();
    const value = map.get(iso2) ?? 0;
    // Stretch the actual min–max range across the whole ramp: the fewest-article
    // country is light cyan-blue, the most a deep pink. The black stroke still
    // marks even the lightest as "active".
    const t = max > min ? (value - min) / (max - min) : 0.5;
    return `rgb(${lerp(FILL_LIGHT[0], FILL_DARK[0], t)}, ${lerp(FILL_LIGHT[1], FILL_DARK[1], t)}, ${lerp(FILL_LIGHT[2], FILL_DARK[2], t)})`;
  }

  /** Flag image (loaded on demand for the selected country only). */
  flagUrl(iso2: string): string {
    return `https://flagcdn.com/${iso2}.svg`;
  }

  /** Hover/focus selection — ignored while a country is locked. */
  select(iso2: string): void {
    if (this.lockedIso() !== null) return;
    if (this.byIso().has(iso2)) {
      this.selectedIso.set(iso2);
    }
  }

  /** Click toggles the lock: pin the clicked country, or unpin if already locked. */
  toggleLock(iso2: string): void {
    if (!this.byIso().has(iso2)) return;
    if (this.lockedIso() === iso2) {
      this.lockedIso.set(null); // unlock; leave it shown so hovering can resume
    } else {
      this.selectedIso.set(iso2);
      this.lockedIso.set(iso2);
    }
  }

  countryName(iso2: string): string {
    return localizedCountryName(iso2, this.translate.currentLang || this.translate.defaultLang || 'es');
  }

  monthKey(monthIdx: number): string {
    return monthTranslateKey(monthIdx);
  }
}
