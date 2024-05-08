import { Component } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { NgbCollapse } from '@ng-bootstrap/ng-bootstrap';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [NgbCollapse, RouterLink],
  templateUrl: './header.component.html',
  styleUrl: './header.component.scss',
  providers: [Router]
})
export class HeaderComponent {

  isMenuCollapsed = true;

  constructor(private router: Router) { }

}
