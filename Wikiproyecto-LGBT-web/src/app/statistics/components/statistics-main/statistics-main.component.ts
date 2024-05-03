import { Component } from '@angular/core';
import { NgbAccordionModule, NgbCollapse, NgbScrollSpyModule } from '@ng-bootstrap/ng-bootstrap';
import { NgbAlertModule } from '@ng-bootstrap/ng-bootstrap';
import { NgbDropdownModule } from '@ng-bootstrap/ng-bootstrap';

@Component({
  selector: 'app-statistics-main',
  standalone: true,
  imports: [NgbAccordionModule, NgbAlertModule, NgbDropdownModule, NgbScrollSpyModule, NgbCollapse],
  templateUrl: './statistics-main.component.html',
  styleUrl: './statistics-main.component.scss'
})
export class StatisticsMainComponent {

}
