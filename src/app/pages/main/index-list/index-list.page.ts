import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonContent, IonSpinner, IonIcon } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { alertCircleOutline } from 'ionicons/icons';
import { ViewStateService, ViewType } from 'src/app/services/view-state.service';
import { ModalStateService } from 'src/app/services/modal-state.service';
import { UserContextFacade } from 'src/app/services/user-context.facade';
import { TaskStateService } from 'src/app/services/task-state.service';
import { SharedModule } from 'src/app/shared/shared-module';
import { OverseeIndicatorComponent } from 'src/app/components/layout/oversee-indicator/oversee-indicator.component';
import { FooterComponent } from 'src/app/components/layout/footer/footer.component';
import { ListViewComponent } from '../list-view/list-view.component';
import { CalendarViewComponent } from '../calendar-view/calendar-view.component';
import { TimelineViewComponent } from '../timeline-view/timeline-view.component';
import { KanbanViewComponent } from '../kanban-view/kanban-view.component';
import { ModalContainerComponent } from 'src/app/components/layout/modal-container/modal-container.component';
import { Observable } from 'rxjs';
import { TaskCategories } from 'src/app/shared/dtos/task.dtos';

/**
 * IndexListPage - Main task list view
 * 
 * This is the primary page for displaying user tasks. It coordinates:
 * - User context and oversee state (via UserContextFacade)
 * - View mode switching between list and calendar (via ViewStateService)
 * - Task data and categorization (via TaskStateService)
 * - Modal display for task creation/editing (via ModalStateService)
 * 
 * The page follows a reactive pattern where all data is exposed via observables
 * and rendered using the async pipe in templates.
 */
@Component({
  selector: 'app-index-list',
  templateUrl: './index-list.page.html',
  styleUrls: ['./index-list.page.scss'],
  standalone: true,
  imports: [
    IonContent,
    IonSpinner,
    IonIcon,
    CommonModule,
    FormsModule,
    SharedModule,
    OverseeIndicatorComponent,
    FooterComponent,
    ListViewComponent,
    CalendarViewComponent,
    TimelineViewComponent,
    KanbanViewComponent,
    ModalContainerComponent
  ]
})
export class IndexListPage implements OnInit {
  /**
   * Expose service observables to template for reactive updates
   */
  currentView$!: Observable<ViewType>;
  taskCategories$!: Observable<TaskCategories>;
  loading$!: Observable<boolean>;
  error$!: Observable<Error | null>;

  /**
   * Search query bound to the search input
   */
  searchQuery: string = '';

  constructor(
    public userContextFacade: UserContextFacade,
    private viewStateService: ViewStateService,
    public modalStateService: ModalStateService,
    private taskStateService: TaskStateService
  ) {
    // Register icons used in the template
    addIcons({ alertCircleOutline });
  }

  ngOnInit(): void {
    /**
     * Initialize application state in order:
     * 1. Load view preference from localStorage (or use default)
     * 2. Initialize task loading (auto-reacts to user/oversee changes)
     * 3. Expose observables to template for reactive rendering
     */

    // Step 1: Load user's view preference from storage
    this.viewStateService.loadFromStorage();

    // Step 2: Initialize task state (must be called to set up subscriptions)
    this.taskStateService.initialize();

    // Step 3: Expose observables to template
    this.currentView$ = this.viewStateService.currentView$;
    this.taskCategories$ = this.taskStateService.filteredCategories$;
    this.loading$ = this.taskStateService.loading$;
    this.error$ = this.taskStateService.error$;
  }

  /**
   * Handle search input changes
   * Debouncing is handled in TaskStateService
   */
  onSearchChange(query: string): void {
    this.taskStateService.setSearchQuery(query);
  }

  /**
   * Clear the search input and results
   */
  clearSearch(): void {
    this.searchQuery = '';
    this.taskStateService.clearSearch();
  }

  /**
   * Clear the current error state
   * Called when user dismisses the error banner
   */
  clearError(): void {
    // Reload tasks for the current user to retry
    this.userContextFacade.activeUserForTasks$.subscribe(userId => {
      if (userId) {
        this.taskStateService.loadTasksForUser(userId);
      }
    }).unsubscribe();
  }
}

