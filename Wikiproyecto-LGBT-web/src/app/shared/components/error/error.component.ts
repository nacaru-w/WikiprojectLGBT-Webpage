import { Component, inject } from '@angular/core';
import { BarbaService } from '../../../services/barba.service';
import { TranslatePipe } from '@ngx-translate/core';

@Component({
  selector: 'app-error',
  standalone: true,
  imports: [TranslatePipe],
  templateUrl: './error.component.html',
  styleUrl: './error.component.scss'
})
export class ErrorComponent {
  private barbaService = inject(BarbaService);

  barba: string = this.barbaService.getCurrentBarba();
}
