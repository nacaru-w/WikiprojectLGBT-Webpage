import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { NgbAccordionModule, NgbCarouselConfig, NgbCarouselModule } from '@ng-bootstrap/ng-bootstrap';
import { NgbAlertModule } from '@ng-bootstrap/ng-bootstrap';
import { NgbDropdownModule } from '@ng-bootstrap/ng-bootstrap';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, NgbAccordionModule, NgbAlertModule, NgbDropdownModule, NgbCarouselModule],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
  providers: [NgbCarouselConfig]
})
export class AppComponent {
  title = 'Wikiproyecto-LGBT-web';
  showNavigationArrows = false;
  showNavigationIndicators = false;
  images = [
    './../assets/imgs/Wikipedia_20_pink_star.svg',
    './../assets/imgs/Wikipedia_tucan.svg',
    './../assets/imgs/WP20Symbols_2004_aktenzeichen_rectangle.svg',
  ];

  constructor(config: NgbCarouselConfig) {
    config.showNavigationArrows = true;
    config.showNavigationIndicators = true;
  }

}
