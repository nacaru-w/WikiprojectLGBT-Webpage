import { Component } from '@angular/core';
import { NgbCarouselConfig, NgbCarouselModule } from '@ng-bootstrap/ng-bootstrap';

@Component({
  selector: 'app-main-page',
  standalone: true,
  imports: [NgbCarouselModule],
  templateUrl: './main-page.component.html',
  styleUrl: './main-page.component.scss',
  providers: [NgbCarouselConfig]
})
export class MainPageComponent {

  images: string[] = [
    './../assets/imgs/Wikipedia_20_pink_star.svg',
    './../assets/imgs/Wikipedia_tucan.svg',
    './../assets/imgs/WP20Symbols_2004_aktenzeichen_rectangle.svg',
  ];

  constructor(config: NgbCarouselConfig) {
    config.showNavigationArrows = false;
  }

}
