import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { TaskStateService, TaskCategories } from './task-state.service';

/**
 * Backwards-compatible alias for TaskStateService
 * 
 * This service maintains the original interface for components still using TaskOrchestrationService,
 * but delegates all logic to the new unified TaskStateService.
 * 
 * DEPRECATION NOTE: New code should use TaskStateService directly.
 * This service exists for backwards compatibility during migration.
 */
@Injectable({
  providedIn: 'root'
})
export class TaskOrchestrationService {
  // Re-export task status constants for backwards compatibility
  readonly Atrasada = 'tarefaAtrasada';
  readonly Pendente = 'tarefaNaoConcluida';
  readonly Concluida = 'tarefaConcluida';

  /**
   * Proxy observable to TaskStateService.categories$
   */
  get taskCategories$(): Observable<TaskCategories> {
    return this.taskStateService.categories$;
  }

  constructor(private taskStateService: TaskStateService) {}

  /**
   * Initialize task orchestration
   * Now delegates to TaskStateService which automatically initializes with UserContextFacade
   */
  initialize(): void {
    this.taskStateService.initialize();
  }

  /**
   * Get current categorized tasks
   * DEPRECATED: Use taskCategories$ observable instead
   */
  getCategories(): TaskCategories {
    return this.taskStateService.getCategories();
  }

  /**
   * Recategorize cached tasks
   * DEPRECATED: Automatic through TaskStateService.categories$
   * This method is a no-op now since categories update automatically
   */
  recategorizeCachedTasks(): void {
    // No-op: categories automatically update through the Observable chain
    // Kept for backwards compatibility with components calling this method
  }
}
