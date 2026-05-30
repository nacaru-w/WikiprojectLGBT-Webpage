import { AfterViewInit, Component, OnInit, computed, inject, signal } from '@angular/core';
import { NgbCarouselConfig, NgbCarouselModule } from '@ng-bootstrap/ng-bootstrap';
import { MediawikiService } from '../../../services/mediawiki.service';
import { LoadingService } from '../../../services/loading.service';
import { ThemeService } from '../../../services/theme/theme.service';
import { popAnimation } from '../../../animations/animations';
import { TranslatePipe } from '@ngx-translate/core';


@Component({
  selector: 'app-main-page',
  standalone: true,
  imports: [NgbCarouselModule, TranslatePipe],
  templateUrl: './main-page.component.html',
  styleUrl: './main-page.component.scss',
  providers: [NgbCarouselConfig],
  animations: [popAnimation]
})
export class MainPageComponent implements OnInit {
  private mediaWikiService = inject(MediawikiService);
  private loading = inject(LoadingService);
  private theme = inject(ThemeService);

  // True once the "Evento del mes" data has been fetched.
  isAllLoaded = signal(false);

  // The blocks only appear once their data is ready AND the Barba loader has
  // finished fading out, so the loader and the blocks' intro never overlap.
  blocksReady = computed(() => this.isAllLoaded() && this.loading.loaderGone());

  // The star (slide 1) is transparent — its background is the themed
  // .img-wrapper — so it needs no dark variant. The tucan and aktenzeichen SVGs
  // bake their own background colour in, so dark mode swaps in *-dark.svg copies
  // whose only change is a darkened background (see styles.scss --slide-*).
  private readonly lightImages: string[] = [
    './../assets/imgs/Wikipedia_20_pink_star.svg',
    './../assets/imgs/Wikipedia_tucan.svg',
    './../assets/imgs/WP20Symbols_2004_aktenzeichen_rectangle.svg',
  ];
  private readonly darkImages: string[] = [
    './../assets/imgs/Wikipedia_20_pink_star.svg',
    './../assets/imgs/Wikipedia_tucan-dark.svg',
    './../assets/imgs/WP20Symbols_2004_aktenzeichen_rectangle-dark.svg',
  ];

  // Carousel sources for the active theme; swaps reactively when it's toggled.
  images = computed(() =>
    this.theme.theme() === 'dark' ? this.darkImages : this.lightImages
  );

  eventoDelMes: string = '';
  eventoDelMesImage: string = '';

  constructor() {
    const config = inject(NgbCarouselConfig);
    config.showNavigationArrows = false;
    config.showNavigationIndicators = false;
    config.pauseOnHover = false;
    config.pauseOnFocus = false;
  }

  ngOnInit(): void {
    this.getEventoDelMesInfo();
  }

  getEventoDelMesInfo(): void {
    this.mediaWikiService.getPageContent('Wikiproyecto:LGBT/Evento del mes').subscribe({
      next: (res) => {
        this.processEventoDelMesString(res);
        this.reveal();
      },
      // Even on error, reveal the page so the loader doesn't hang forever.
      error: () => this.reveal(),
    });
  }

  // Marks the data as loaded and tells the loader it may fade out. AppComponent
  // then signals loaderGone(), which flips blocksReady() and triggers the
  // blocks' pop-in animation.
  private reveal(): void {
    this.isAllLoaded.set(true);
    this.loading.markReady();
  }

  processEventoDelMesString(str: string): void {
    const startSubstring = "Este mes en curso"
    const endSubstring = "|}"

    let startIndex = str.indexOf(startSubstring);
    if (startIndex === -1) {
      this.eventoDelMes = '';
      this.eventoDelMesImage = '';
    } else {
      startIndex += startSubstring.length;
      let firstCrop = str.substring(startIndex);
      let endIndex = firstCrop.indexOf(endSubstring);
      let secondCrop = firstCrop.substring(0, endIndex);

      this.eventoDelMesImage = this.findImage(secondCrop) || '';
      this.eventoDelMes = this.findCountry(secondCrop) || 'LGBT_Flag_map_of_the_World.png';
    }
  }

  findImage(str: string): string | null {
    let archivoRegex = /\[\[(?:[Aa]rchivo|[Ff]ile):(.*?)(\|)/;

    let archivoMatch = str.match(archivoRegex);
    if (archivoMatch) {
      // Width-capped thumbnail instead of the full-resolution original (the
      // evento del mes image shows in a small card) — far lighter for large
      // raster files like the world-map fallback.
      const url = `https://commons.wikimedia.org/wiki/Special:FilePath/${encodeURIComponent(archivoMatch[1])}?width=600`
      return url
    }
    return null;
  }

  findCountry(str: string): string | null {
    let exclamationRegex = /!\s*(.*)/;

    let countryMatch = str.match(exclamationRegex);
    return countryMatch ? countryMatch[1] : null;
  }

}
