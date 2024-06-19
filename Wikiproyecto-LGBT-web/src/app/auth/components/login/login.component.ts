import { AfterViewInit, Component } from '@angular/core';
import { ApiService } from '../../../services/api.service';
import { popAnimation } from '../../../animations/animations';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss',
  animations: [popAnimation]
})
export class LoginComponent implements AfterViewInit {
  isLoggedIn: boolean | null = null;
  isAdmin: boolean = false;
  animate: boolean = false;

  constructor(private apiService: ApiService) { }

  ngAfterViewInit(): void {
    this.knowLoginStatus();
  }

  knowLoginStatus() {
    this.apiService.getLoginStatus().subscribe((res) => {
      this.isLoggedIn = res?.displayName ? true : false;
      this.isAdmin = res?.isAdmin ? true : false;
      setTimeout(() => {
        this.animate = true;
      }, 1000);
    })
  }

}
