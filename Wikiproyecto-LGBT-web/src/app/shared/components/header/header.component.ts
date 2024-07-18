import { Component } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { NgbCollapse } from '@ng-bootstrap/ng-bootstrap';
import { BarbaService } from '../../../services/barba.service';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [NgbCollapse, RouterLink],
  templateUrl: './header.component.html',
  styleUrl: './header.component.scss',
  providers: [Router]
})
export class HeaderComponent {

  barba: string;

  isMenuCollapsed = true;

  constructor(private router: Router, private barbaService: BarbaService) {
    console.log(this.barbaService.getCurrentBarba())
    this.barba = this.barbaService.getCurrentBarba();
  }

}
