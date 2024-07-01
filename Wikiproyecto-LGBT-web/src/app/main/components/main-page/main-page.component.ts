import { AfterViewInit, Component, OnInit } from '@angular/core';
import { NgbCarouselConfig, NgbCarouselModule } from '@ng-bootstrap/ng-bootstrap';
import { MediawikiService } from '../../../services/mediawiki.service';
import { popAnimation } from '../../../animations/animations';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-main-page',
  standalone: true,
  imports: [NgbCarouselModule, CommonModule],
  templateUrl: './main-page.component.html',
  styleUrl: './main-page.component.scss',
  providers: [NgbCarouselConfig],
  animations: [popAnimation]
})
export class MainPageComponent implements OnInit {
  isAllLoaded: boolean = false;

  images: string[] = [
    './../assets/imgs/Wikipedia_20_pink_star.svg',
    './../assets/imgs/Wikipedia_tucan.svg',
    './../assets/imgs/WP20Symbols_2004_aktenzeichen_rectangle.svg',
  ];

  eventoDelMes: string = '';
  eventoDelMesImage: string = '';

  constructor(config: NgbCarouselConfig, private mediaWikiService: MediawikiService) {
    config.showNavigationArrows = false;
    config.showNavigationIndicators = false;
    config.pauseOnHover = false;
    config.pauseOnFocus = false;
  }

  ngOnInit(): void {
    this.getEventoDelMesInfo();
  }

  getEventoDelMesInfo(): void {
    this.mediaWikiService.getPageContent('Wikiproyecto:LGBT/Evento del mes').subscribe((res => {
      this.processEventoDelMesString(res);
      this.isAllLoaded = true;
    }))
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
      const url = `https://commons.wikimedia.org/w/index.php?title=Special:Redirect/file&wpvalue=${archivoMatch[1]}`
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
