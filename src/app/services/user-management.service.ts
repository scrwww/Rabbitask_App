import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, combineLatest, forkJoin } from 'rxjs';
import { shareReplay, tap, switchMap, catchError, map } from 'rxjs/operators';
import { AuthService } from './auth.service';
import { UserService, ConnectedUserDto } from './user.service';
import { of } from 'rxjs';

export interface UserContext {
  userID: number | null;
  userData: any;
  userType: 'agente' | 'comum' | null;
  isAgente: boolean;
  isComum: boolean;
  availableTags: any[];
}

@Injectable({
  providedIn: 'root'
})
export class UserManagementService {
  private userContextSubject = new BehaviorSubject<UserContext>({
    userID: null,
    userData: null,
    userType: null,
    isAgente: false,
    isComum: false,
    availableTags: []
  });

  public userContext$ = this.userContextSubject.asObservable();
  private initialized = false;

  constructor(
    private authService: AuthService,
    private userService: UserService
  ) {}

  /**
   * Initialize user context on app startup
   * Coordinates all async operations to avoid race conditions
   * 
   * Sequence:
   * 1. Load user info first
   * 2. Then load user type and tags in parallel
   */
  initializeUser(): void {
    if (this.initialized) return;
    this.initialized = true;

    // Step 1: Load user ID first
    this.userService.getUserID().pipe(
      tap(res => {
        if (res.success) {
          const currentContext = this.userContextSubject.value;
          this.userContextSubject.next({
            ...currentContext,
            userID: res.data.cd,
            userData: res.data
          });
        }
      }),
      // Step 2: After getting user info, load type and tags in parallel
      switchMap(() =>
        combineLatest([
          this.authService.isAgente().pipe(
            catchError(err => {
              console.error('Error checking if user is agente:', err);
              return of(false);
            })
          ),
          this.authService.isComum().pipe(
            catchError(err => {
              console.error('Error checking if user is comum:', err);
              return of(false);
            })
          ),
          this.userService.getTags().pipe(
            catchError(err => {
              console.error('Error fetching tags:', err);
              return of({ success: false, data: [] });
            })
          )
        ])
      ),
      tap(([isAgente, isComum, tagsRes]) => {
        const currentContext = this.userContextSubject.value;
        const userType = isAgente ? 'agente' : (isComum ? 'comum' : null);
        
        this.userContextSubject.next({
          ...currentContext,
          userType: userType as 'agente' | 'comum' | null,
          isAgente,
          isComum,
          availableTags: tagsRes.success ? tagsRes.data : []
        });
      }),
      catchError(err => {
        console.error('Error initializing user context:', err);
        return of(null);
      })
    ).subscribe();
  }

  /**
   * Get current user context
   */
  getUserContext(): UserContext {
    return this.userContextSubject.value;
  }

  /**
   * Get current user ID
   */
  getUserID(): number | null {
    return this.userContextSubject.value.userID;
  }

  /**
   * Get available tags
   */
  getTags(): any[] {
    return this.userContextSubject.value.availableTags;
  }

  /**
   * Check if user is an agent
   */
  isAgente(): boolean {
    return this.userContextSubject.value.isAgente;
  }

  /**
   * Check if user is common
   */
  isComum(): boolean {
    return this.userContextSubject.value.isComum;
  }

  /**
   * Reset user context to initial state
   * Called during logout to ensure clean state for next user
   */
  reset(): void {
    this.initialized = false;
    this.userContextSubject.next({
      userID: null,
      userData: null,
      userType: null,
      isAgente: false,
      isComum: false,
      availableTags: []
    });
  }

  /**
   * Fetch a specific user by ID
   * Results are cached per request to avoid duplicate API calls
   * @param userId The user ID to fetch
   */
  getUserById(userId: number): Observable<ConnectedUserDto> {
    // Use HTTP directly with cached result via shareReplay
    // This ensures multiple subscriptions don't trigger multiple requests
    return this.userService.getUserById(userId).pipe(
      shareReplay(1)
    );
  }
}
