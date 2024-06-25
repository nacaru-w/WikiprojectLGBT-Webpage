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
        console.log('Allowing access to admin panel: ', res)
        return true; // Allow navigation
      } else {
        console.log('Forbidden access to admin panel', res)
        router.navigate(['/login']); // Redirect to login
        return false; // Deny navigation
      }
    })
  );

};
