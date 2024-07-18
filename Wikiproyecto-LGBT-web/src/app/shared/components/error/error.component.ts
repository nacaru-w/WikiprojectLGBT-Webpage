import { Component } from '@angular/core';
import { BarbaService } from '../../../services/barba.service';

@Component({
  selector: 'app-error',
  standalone: true,
  imports: [],
  templateUrl: './error.component.html',
  styleUrl: './error.component.scss'
})
export class ErrorComponent {

  barba: string;

  constructor(private barbaService: BarbaService) {
    this.barba = this.barbaService.getCurrentBarba();
  }
}
