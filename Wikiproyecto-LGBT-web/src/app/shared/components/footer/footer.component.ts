import { Component, OnInit, SimpleChanges } from '@angular/core';

import { footerAnimations } from './footerAnimations';

@Component({
  selector: 'app-footer',
  standalone: true,
  imports: [],
  templateUrl: './footer.component.html',
  styleUrl: './footer.component.scss',
  animations: [footerAnimations]
})
export class FooterComponent implements OnInit {

  menuState: 'open' | 'closed' = 'closed';

  constructor() { }

  ngOnInit(): void {
    this.menuState = 'open';
  }

  clickEvent(): void {
    if (this.menuState = 'open') {
      this.menuState = 'closed';
    } else {
      this.menuState = 'open';
    }
  }

}
