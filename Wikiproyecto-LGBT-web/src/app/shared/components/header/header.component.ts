import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { NgbCollapse } from '@ng-bootstrap/ng-bootstrap';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [NgbCollapse],
  templateUrl: './header.component.html',
  styleUrl: './header.component.scss',
  providers: [Router]
})
export class HeaderComponent {

  isMenuCollapsed = true;

  constructor(private router: Router) { }

  navigate(path: string): void {
    console.log('testing');
    this.router.navigateByUrl(path);
  }

}
