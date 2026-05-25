import { AfterViewInit, Component, inject, signal } from '@angular/core';
import { ApiService } from '../../../services/api.service';
import { popAnimation } from '../../../animations/animations';
import { TranslatePipe } from '@ngx-translate/core';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [TranslatePipe],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss',
  animations: [popAnimation]
})
export class LoginComponent implements AfterViewInit {
  private apiService = inject(ApiService);

  isLoggedIn = signal<boolean | null>(null);
  isAdmin = signal(false);
  animate = signal(false);

  ngAfterViewInit(): void {
    this.knowLoginStatus();
  }

  knowLoginStatus() {
    this.apiService.getLoginStatus().subscribe((res) => {
      this.isLoggedIn.set(res?.displayName ? true : false);
      this.isAdmin.set(res?.isAdmin ? true : false);
      setTimeout(() => {
        this.animate.set(true);
      }, 1000);
    })
  }

}
