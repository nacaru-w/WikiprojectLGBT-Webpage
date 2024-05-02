import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { NgbAccordionModule, NgbCarouselConfig, NgbCarouselModule, NgbCollapse, NgbScrollSpyModule } from '@ng-bootstrap/ng-bootstrap';
import { NgbAlertModule } from '@ng-bootstrap/ng-bootstrap';
import { NgbDropdownModule } from '@ng-bootstrap/ng-bootstrap';
import { FooterComponent } from './shared/components/footer/footer.component';
import { HeaderComponent } from './shared/components/header/header.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [HeaderComponent, FooterComponent, RouterOutlet, NgbAccordionModule, NgbAlertModule, NgbDropdownModule, NgbCarouselModule, NgbScrollSpyModule, CommonModule, NgbCollapse],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
  providers: [NgbCarouselConfig]
})
export class AppComponent {
  title = 'Wikiproyecto-LGBT-web';

}
