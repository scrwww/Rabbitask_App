import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { STORAGE_KEYS } from '../shared/constants/storage.constants';

/**
 * Manages the "overseeing" (connected user viewing) state for agents.
 * When an agent connects to another user's account to view/manage their tasks,
 * this service tracks which user is currently being viewed.
 * 
 * Persists selection in localStorage so it survives reloads and exposes
 * a BehaviorSubject so components can react to changes.
 */
@Injectable({ providedIn: 'root' })
export class OverseeService {
  private STORAGE_KEY = STORAGE_KEYS.OVERSEE_USER_ID;
  private _overseeingUserId = new BehaviorSubject<number | null>(this.readFromStorage());
  private _overseeingUserName = new BehaviorSubject<string | null>(null);

  /**
   * Observable for overseeing user ID changes
   */
  get overseeing$() {
    return this._overseeingUserId.asObservable();
  }

  /**
   * Observable for overseeing user name changes
   */
  get overseeingUserName$() {
    return this._overseeingUserName.asObservable();
  }

  /**
   * Get the currently overseeing user ID
   */
  get current(): number | null {
    return this._overseeingUserId.getValue();
  }

  /**
   * Get the currently overseeing user name
   */
  get currentUserName(): string | null {
    return this._overseeingUserName.getValue();
  }

  /**
   * Set a user to be overseeing, optionally with their name
   */
  setOverseeing(userId: number | string | null, userName?: string): void {
    if (userId === null || userId === undefined || userId === '') {
      this.clear();
      return;
    }

    const num = typeof userId === 'number' ? userId : parseInt(String(userId), 10);
    if (isNaN(num)) {
      this.clear();
      return;
    }

    localStorage.setItem(this.STORAGE_KEY, String(num));
    this._overseeingUserId.next(num);
    
    if (userName) {
      this._overseeingUserName.next(userName);
    }
  }

  /**
   * Clear the overseeing state and return to own user
   */
  clear(): void {
    localStorage.removeItem(this.STORAGE_KEY);
    this._overseeingUserId.next(null);
    this._overseeingUserName.next(null);
  }

  /**
   * Check if currently overseeing another user
   */
  isOverseeing(): boolean {
    return this._overseeingUserId.getValue() !== null;
  }

  private readFromStorage(): number | null {
    const v = localStorage.getItem(this.STORAGE_KEY);
    if (!v) return null;
    const n = parseInt(v, 10);
    return isNaN(n) ? null : n;
  }
}
