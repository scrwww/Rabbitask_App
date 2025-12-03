import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

/**
 * Guard that prevents authenticated users from accessing guest-only pages (login, register)
 * Redirects to main app if user is already logged in
 */
@Injectable({
  providedIn: 'root'
})
export class GuestGuard implements CanActivate {
  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  canActivate(): boolean {
    const token = this.authService.getToken();
    if (token) {
      // User is authenticated, redirect to main page
      this.router.navigate(['/index-list']);
      return false;
    }
    // No token, allow access to login/register pages
    return true;
  }
}
