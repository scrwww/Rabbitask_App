import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { STORAGE_KEYS } from '../shared/constants/storage.constants';

/**
 * View types supported by the application
 */
export type ViewType = 'list' | 'calendar' | 'timeline' | 'kanban';

/**
 * Service to manage the global view state (list, calendar, timeline, or kanban)
 * Persists user preference to localStorage for consistent experience across sessions
 */
@Injectable({
  providedIn: 'root'
})
export class ViewStateService {
  /**
   * Storage key for persisting user's view preference
   */
  private readonly STORAGE_KEY = STORAGE_KEYS.PREFERRED_VIEW;

  /**
   * Default view when no preference is stored
   */
  private readonly DEFAULT_VIEW: ViewType = 'list';

  /**
   * Valid view types for validation
   */
  private readonly VALID_VIEWS: ViewType[] = ['list', 'calendar', 'timeline', 'kanban'];

  /**
   * Internal state subject
   */
  private _currentView = new BehaviorSubject<ViewType>(this.getStoredView());

  /**
   * Observable for current view changes
   * Components subscribe to this to react to view changes
   */
  get currentView$(): Observable<ViewType> {
    return this._currentView.asObservable();
  }

  /**
   * Get the current view (synchronous)
   */
  get current(): ViewType {
    return this._currentView.getValue();
  }

  /**
   * Check if a value is a valid view type
   */
  private isValidView(value: string): value is ViewType {
    return this.VALID_VIEWS.includes(value as ViewType);
  }

  /**
   * Get stored view preference without updating state
   */
  private getStoredView(): ViewType {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (stored && this.isValidView(stored)) {
        return stored;
      }
    } catch (e) {
      console.warn('Failed to read localStorage:', e);
    }
    return this.DEFAULT_VIEW;
  }

  /**
   * Set the current view and persist to localStorage
   */
  setView(view: ViewType): void {
    localStorage.setItem(this.STORAGE_KEY, view);
    this._currentView.next(view);
  }

  /**
   * Load view preference from localStorage
   */
  loadFromStorage(): void {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (stored && this.isValidView(stored)) {
        this._currentView.next(stored);
        return;
      }
    } catch (e) {
      console.warn('Failed to read localStorage:', e);
    }
    this._currentView.next(this.DEFAULT_VIEW);
  }
}
