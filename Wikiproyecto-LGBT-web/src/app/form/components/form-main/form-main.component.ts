import { Component } from '@angular/core';
import { NgbDropdownModule } from '@ng-bootstrap/ng-bootstrap';

@Component({
  selector: 'app-form-main',
  standalone: true,
  imports: [NgbDropdownModule],
  templateUrl: './form-main.component.html',
  styleUrl: './form-main.component.scss'
})
export class FormMainComponent {

}
