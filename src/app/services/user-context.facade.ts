import { Injectable } from '@angular/core';
import { Observable, combineLatest, of } from 'rxjs';
import { map, switchMap, shareReplay, startWith } from 'rxjs/operators';
import { UserManagementService, UserContext } from './user-management.service';
import { OverseeService } from './oversee.service';
import { HttpClient } from '@angular/common/http';

/**
 * Represents the current user being viewed (either self or overseen user)
 */
export interface ViewedUser {
  userContext: UserContext;
  isOverseen: boolean;
  overseeingUserId: number | null;
}

/**
 * Facade that coordinates user context and overseeing state
 * 
 * Provides a single source of truth for "which user am I currently viewing?"
 * Automatically syncs between UserManagementService and OverseeService
 */
@Injectable({
  providedIn: 'root'
})
export class UserContextFacade {
  /**
   * The user context (ID, tags, type, etc.) for the currently logged-in user
   */
  get userContext$(): Observable<UserContext> {
    return this.userManagementService.userContext$;
  }

  /**
   * Combined view of the currently viewed user (self or overseen)
   * Automatically switches between users based on oversee state
   */
  viewedUser$: Observable<ViewedUser> = combineLatest([
    this.userManagementService.userContext$,
    this.overseeService.overseeing$
  ]).pipe(
    map(([userContext, overseeingUserId]) => ({
      userContext,
      isOverseen: overseeingUserId !== null,
      overseeingUserId
    })),
    shareReplay(1)
  );

  /**
   * The ID of the user whose tasks should be loaded
   * (either current user ID or overseen user ID)
   */
  activeUserForTasks$: Observable<number | null> = this.viewedUser$.pipe(
    map(viewed => viewed.overseeingUserId || viewed.userContext.userID),
    shareReplay(1)
  );

  /**
   * Helper observable: is there an active oversee session?
   */
  isOverseeing$: Observable<boolean> = this.overseeService.overseeing$.pipe(
    map(id => id !== null),
    shareReplay(1)
  );

  /**
   * Helper observable: the name of the currently overseen user
   */
  overseeingUserName$: Observable<string | null> = this.overseeService.overseeingUserName$;

  constructor(
    private userManagementService: UserManagementService,
    private overseeService: OverseeService
  ) {
    // Ensure user management is initialized
    this.userManagementService.initializeUser();
  }

  /**
   * Set a user to be overseen
   * @param userId The user ID to oversee
   * @param userName Optional user name for display
   */
  setOverseeing(userId: number, userName?: string): void {
    this.overseeService.setOverseeing(userId, userName);
  }

  /**
   * Return to viewing own tasks
   */
  clearOverseeing(): void {
    this.overseeService.clear();
  }
}
