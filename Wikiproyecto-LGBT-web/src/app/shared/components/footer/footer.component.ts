import { Component, OnInit, SimpleChanges } from '@angular/core';

@Component({
  selector: 'app-footer',
  standalone: true,
  imports: [],
  templateUrl: './footer.component.html',
  styleUrl: './footer.component.scss',
})

export class FooterComponent {
  animationState = 'visible';

  constructor() { }

  hideFooter() {
    this.animationState = 'hidden';
  }

  showFooter() {
    this.animationState = 'visible';
  }
}