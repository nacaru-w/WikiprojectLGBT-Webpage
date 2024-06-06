import { Component, OnInit } from '@angular/core';
import { NgbCarouselConfig, NgbCarouselModule } from '@ng-bootstrap/ng-bootstrap';
import { MediawikiService } from '../../../services/mediawiki.service';

@Component({
  selector: 'app-main-page',
  standalone: true,
  imports: [NgbCarouselModule],
  templateUrl: './main-page.component.html',
  styleUrl: './main-page.component.scss',
  providers: [NgbCarouselConfig]
})
export class MainPageComponent implements OnInit {
  images: string[] = [
    './../assets/imgs/Wikipedia_20_pink_star.svg',
    './../assets/imgs/Wikipedia_tucan.svg',
    './../assets/imgs/WP20Symbols_2004_aktenzeichen_rectangle.svg',
  ];

  paisDelMes: string = '';
  paisDelMesImage: string = '';

  constructor(config: NgbCarouselConfig, private mediaWikiService: MediawikiService) {
    config.showNavigationArrows = false;
    config.showNavigationIndicators = false;
    config.pauseOnHover = false;
    config.pauseOnFocus = false;
  }

  ngOnInit(): void {
    this.getPaisDelMesInfo();
  }

  getPaisDelMesInfo(): void {
    this.mediaWikiService.getPageContent('Wikiproyecto:LGBT/País del mes').subscribe((res => {
      this.processPaisDelMesString(res);
    }))
  }

  processPaisDelMesString(str: string): void {
    const startSubstring = "Este mes en curso"
    const endSubstring = "|}"

    let startIndex = str.indexOf(startSubstring);
    if (startIndex === -1) {
      this.paisDelMes = '';
      this.paisDelMesImage = '';
    } else {
      startIndex += startSubstring.length;
      let firstCrop = str.substring(startIndex);
      let endIndex = firstCrop.indexOf(endSubstring);
      let secondCrop = firstCrop.substring(0, endIndex);

      this.paisDelMesImage = this.findImage(secondCrop) || '';
      this.paisDelMes = this.findCountry(secondCrop) || 'LGBT_Flag_map_of_the_World.png';
    }
  }

  findImage(str: string): string | null {
    let archivoRegex = /\[\[Archivo:(.*?)(\|)/;

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
