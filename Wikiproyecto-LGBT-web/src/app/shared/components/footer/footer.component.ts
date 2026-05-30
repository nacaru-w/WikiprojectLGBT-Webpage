import { Component, OnInit, SimpleChanges, inject, signal } from '@angular/core';
import { ApiService } from '../../../services/api.service';
import { RouterLink } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { APP_VERSION } from '../../../../version';

@Component({
  selector: 'app-footer',
  standalone: true,
  imports: [RouterLink, TranslatePipe],
  templateUrl: './footer.component.html',
  styleUrl: './footer.component.scss',
})

export class FooterComponent implements OnInit {
  private apiService = inject(ApiService);

  animationState = signal('visible');
  isAuth = signal(false);
  readonly appVersion = APP_VERSION;

  hideFooter() {
    this.animationState.set('hidden');
  }

  showFooter() {
    this.animationState.set('visible');
  }

  ngOnInit(): void {
    this.apiService.getLoginStatus().subscribe((res) => {
      this.isAuth.set(res?.displayName ? true : false);
    })
  }

}