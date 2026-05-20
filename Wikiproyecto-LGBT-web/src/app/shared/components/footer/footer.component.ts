import { Component, OnInit, SimpleChanges, inject } from '@angular/core';
import { ApiService } from '../../../services/api.service';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-footer',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './footer.component.html',
  styleUrl: './footer.component.scss',
})

export class FooterComponent implements OnInit {
  private apiService = inject(ApiService);

  animationState = 'visible';
  isAuth = false;

  hideFooter() {
    this.animationState = 'hidden';
  }

  showFooter() {
    this.animationState = 'visible';
  }

  ngOnInit(): void {
    this.apiService.getLoginStatus().subscribe((res) => {
      this.isAuth = res?.displayName ? true : false;
    })
  }

}