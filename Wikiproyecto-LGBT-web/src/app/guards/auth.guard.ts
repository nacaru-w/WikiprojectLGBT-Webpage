import { ResolveFn } from '@angular/router';
import { inject } from '@angular/core';
import { map } from 'rxjs';

import { ApiService } from '../services/api.service';
import { Router } from '@angular/router';


export const authGuard: ResolveFn<boolean> = (route, state) => {
  const router = inject(Router);
  const apiService = inject(ApiService);

  return apiService.isAdmin().pipe(
    map((res) => {
      if (res) {
        return true; // Allow navigation
      } else {
        router.navigate(['/login']); // Redirect to login
        return false; // Deny navigation
      }
    })
  );

};
