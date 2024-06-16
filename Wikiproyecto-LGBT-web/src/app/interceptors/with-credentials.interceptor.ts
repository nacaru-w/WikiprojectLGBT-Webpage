import { HttpInterceptorFn } from '@angular/common/http';

export const withCredentialsInterceptor: HttpInterceptorFn = (req, next) => {
  if (req.method === 'PUT' || req.method === 'POST' || req.method === ' DELETE') {
    const clonedRequest = req.clone({
      withCredentials: true
    });
    return next(clonedRequest)
  }

  return next(req)

};
