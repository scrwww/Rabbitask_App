import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { environment } from 'src/environments/environment';

export const AuthInterceptor: HttpInterceptorFn = (req, next) => {
  // Get token directly from localStorage
  const token = localStorage.getItem(environment.jwt_token);
  
  console.log('AuthInterceptor: Token from localStorage:', token ? 'EXISTS' : 'NOT FOUND');
  console.log('AuthInterceptor: Key being used:', environment.jwt_token);
  console.log('AuthInterceptor: Request URL:', req.url);
  
  if (!token) {
    console.log('AuthInterceptor: No token, skipping header');
    return next(req);
  }

  console.log('AuthInterceptor: Adding Authorization header to request:', req.url);
  
  // Clone the request and add the Authorization header
  const authReq = req.clone({
    setHeaders: {
      Authorization: `Bearer ${token}`
    }
  });

  return next(authReq);
};
