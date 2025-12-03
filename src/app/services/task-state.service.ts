import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, combineLatest } from 'rxjs';
import { map, tap, shareReplay, filter, debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { TasksService, TarefaDto, GetTarefasParams, CreateTarefaRequest, UpdateTarefaRequest, ApiResponse } from './tasks.service';
import { UserContextFacade } from './user-context.facade';
import { TaskCategories } from '../shared/dtos/task.dtos';

/**
 * Unified task state service that manages both cache and categorization
 * 
 * This service consolidates task data management:
 * - Maintains a cache of tasks
 * - Automatically categorizes tasks by status/deadline
 * - Provides both raw cache and categorized streams
 * - Handles all task CRUD operations with automatic cache/category updates
 * 
 * Key design principle: When cache changes, categories update automatically
 * No manual recategorization needed in components.
 */
@Injectable({
  providedIn: 'root'
})
export class TaskStateService {
  // Task status constants
  readonly DELAYED = 'tarefaAtrasada';
  readonly PENDING = 'tarefaNaoConcluida';
  readonly COMPLETED = 'tarefaConcluida';

  /**
   * Internal cache of raw tasks
   */
  private taskCacheSubject = new BehaviorSubject<TarefaDto[]>([]);

  /**
   * Observable stream of raw cached tasks
   */
  tasks$: Observable<TarefaDto[]> = this.taskCacheSubject.asObservable();

  /**
   * Observable stream of categorized tasks
   * Automatically updates whenever task cache changes
   */
  categories$: Observable<TaskCategories> = this.tasks$.pipe(
    map(tasks => this.categorizeTasks(tasks)),
    shareReplay(1)
  );

  /**
   * Track whether tasks are currently loading
   */
  private loadingSubject = new BehaviorSubject<boolean>(false);
  loading$: Observable<boolean> = this.loadingSubject.asObservable();

  /**
   * Track any errors that occur during task operations
   */
  private errorSubject = new BehaviorSubject<Error | null>(null);
  error$: Observable<Error | null> = this.errorSubject.asObservable();

  /**
   * Search query for filtering tasks
   */
  private searchQuerySubject = new BehaviorSubject<string>('');
  searchQuery$: Observable<string> = this.searchQuerySubject.asObservable();

  /**
   * Observable stream of filtered and categorized tasks
   * Combines task cache with search query to produce filtered results
   */
  filteredCategories$: Observable<TaskCategories> = combineLatest([
    this.tasks$,
    this.searchQuery$.pipe(
      debounceTime(300),
      distinctUntilChanged()
    )
  ]).pipe(
    map(([tasks, query]) => {
      const filteredTasks = this.filterTasks(tasks, query);
      return this.categorizeTasks(filteredTasks);
    }),
    shareReplay(1)
  );

  constructor(
    private tasksService: TasksService,
    private userContextFacade: UserContextFacade
  ) {}

  /**
   * Initialize task loading
   * Automatically loads tasks when active user changes (handles oversee switching)
   */
  initialize(): void {
    this.userContextFacade.activeUserForTasks$
      .pipe(
        filter(userId => userId !== null)
      )
      .subscribe(userId => {
        if (userId) {
          this.loadTasksForUser(userId);
        }
      });
  }

  /**
   * Load and cache tasks for a specific user
   * Exposes errors through error$ observable for components to display to users
   * 
   * @param userId The user ID to load tasks for
   */
  loadTasksForUser(userId: number, params?: Partial<GetTarefasParams>): void {
    this.loadingSubject.next(true);
    this.errorSubject.next(null); // Clear previous errors

    const fullParams: GetTarefasParams = {
      cdUsuario: userId,
      pagina: 1,
      paginaTamanho: 100,
      ...params
    };

    this.tasksService.getTarefas(fullParams).subscribe({
      next: (response) => {
        if (response.success) {
          this.taskCacheSubject.next(response.data);
        }
        this.loadingSubject.next(false);
      },
      error: (err) => {
        console.error('Error loading tasks:', err);
        this.errorSubject.next(err); // Expose error to components
        this.loadingSubject.next(false);
      }
    });
  }

  /**
   * Complete a task
   * Updates the task status and automatically updates cache via updateTaskInCache()
   * Categories$ updates automatically through the map operator when cache changes
   * Errors are exposed through error$ observable
   * 
   * @param taskId The task ID to complete
   * @param userId The user ID (for API call)
   * @returns Observable with the response from the API
   */
  completeTask(taskId: number, userId: number): Observable<ApiResponse<TarefaDto>> {
    return this.tasksService.patchTarefaConcluir(taskId, userId).pipe(
      tap((response) => {
        if (response.success) {
          if (response.data) {
            // Use the returned task data
            this.updateTaskInCache(response.data);
          } else {
            // API didn't return data - manually update the task in cache
            this.markTaskAsCompleted(taskId);
          }
          this.errorSubject.next(null);
        }
      })
    );
  }

  /**
   * Reopen a task (undo completion)
   * Updates the task status and automatically updates cache via updateTaskInCache()
   * Categories$ updates automatically through the map operator when cache changes
   * Errors are exposed through error$ observable
   * 
   * @param taskId The task ID to reopen
   * @param userId The user ID (for API call)
   * @returns Observable with the response from the API
   */
  reopenTask(taskId: number, userId: number): Observable<ApiResponse<TarefaDto>> {
    return this.tasksService.patchTarefaReabrir(taskId, userId).pipe(
      tap((response) => {
        if (response.success) {
          if (response.data) {
            // Use the returned task data
            this.updateTaskInCache(response.data);
          } else {
            // API didn't return data - manually update the task in cache
            this.markTaskAsReopened(taskId);
          }
          this.errorSubject.next(null);
        }
      })
    );
  }

  /**
   * Create a new task
   * Adds the created task to cache, which triggers categories$ update
   * 
   * @param task The task creation request object
   * @returns Observable with the response from the API
   */
  createTask(task: CreateTarefaRequest): Observable<ApiResponse<TarefaDto>> {
    return this.tasksService.createTarefa(task).pipe(
      tap((response) => {
        if (response.success && response.data) {
          // Add newly created task to cache
          this.updateTaskInCache(response.data);
        }
      })
    );
  }

  /**
   * Edit an existing task
   * Updates the task in cache, which triggers categories$ update
   * 
   * @param taskId The task ID to edit
   * @param userId The user ID (for API call)
   * @param task The updated task data
   * @returns Observable with the response from the API
   */
  editTask(taskId: number, userId: number, task: UpdateTarefaRequest): Observable<ApiResponse<TarefaDto>> {
    return this.tasksService.editarTarefa(taskId, userId, task).pipe(
      tap((response) => {
        if (response.success && response.data) {
          // Update cache with the returned task - triggers categories$ map
          this.updateTaskInCache(response.data);
        }
      })
    );
  }

  /**
   * Delete a task
   * Removes the task from cache, which triggers categories$ update
   * 
   * @param taskId The task ID to delete
   * @param userId The user ID (for API call)
   * @returns Observable with the response from the API
   */
  deleteTask(taskId: number, userId: number): Observable<ApiResponse<void>> {
    return this.tasksService.deleteTarefa(taskId, userId).pipe(
      tap((response) => {
        if (response.success) {
          // Remove task from cache - triggers categories$ update
          this.removeTaskFromCache(taskId);
        }
      })
    );
  }

  /**
   * Remove a task from the local cache
   * Called after successful deletion
   */
  private removeTaskFromCache(taskId: number): void {
    const currentTasks = this.taskCacheSubject.value;
    const updatedTasks = currentTasks.filter(t => t.cd !== taskId);
    this.taskCacheSubject.next(updatedTasks);
  }

  /**
   * Manually update a single task in the cache
   * Used internally and can be called after manual task updates
   */
  updateTaskInCache(updatedTask: TarefaDto): void {
    const currentTasks = this.taskCacheSubject.value;
    const index = currentTasks.findIndex(t => t.cd === updatedTask.cd);

    if (index !== -1) {
      const updated = [...currentTasks];
      updated[index] = updatedTask;
      this.taskCacheSubject.next(updated);
    } else {
      this.taskCacheSubject.next([...currentTasks, updatedTask]);
    }
  }

  /**
   * Mark a task as completed in the local cache
   * Used when API doesn't return updated task data
   */
  private markTaskAsCompleted(taskId: number): void {
    const currentTasks = this.taskCacheSubject.value;
    const index = currentTasks.findIndex(t => t.cd === taskId);

    if (index !== -1) {
      const updated = [...currentTasks];
      updated[index] = {
        ...updated[index],
        dataConclusao: new Date().toISOString()
      };
      this.taskCacheSubject.next(updated);
    }
  }

  /**
   * Mark a task as reopened (not completed) in the local cache
   * Used when API doesn't return updated task data
   */
  private markTaskAsReopened(taskId: number): void {
    const currentTasks = this.taskCacheSubject.value;
    const index = currentTasks.findIndex(t => t.cd === taskId);

    if (index !== -1) {
      const updated = [...currentTasks];
      updated[index] = {
        ...updated[index],
        dataConclusao: null
      };
      this.taskCacheSubject.next(updated);
    }
  }

  /**
   * Clear all cached task data
   * Called during logout to ensure clean state for next user
   */
  clearCache(): void {
    this.taskCacheSubject.next([]);
    this.loadingSubject.next(false);
    this.errorSubject.next(null);
    this.searchQuerySubject.next('');
  }

  /**
   * Set the search query for filtering tasks
   * @param query The search string to filter by
   */
  setSearchQuery(query: string): void {
    this.searchQuerySubject.next(query);
  }

  /**
   * Clear the search query
   */
  clearSearch(): void {
    this.searchQuerySubject.next('');
  }

  /**
   * Get current cached tasks (synchronous)
   */
  getCachedTasks(): TarefaDto[] {
    return this.taskCacheSubject.value;
  }

  /**
   * Get current categorized tasks (synchronous)
   */
  getCategories(): TaskCategories {
    // This is a best-effort sync access; observables are async
    // For most use cases, subscribe to categories$ instead
    return this.categorizeTasks(this.taskCacheSubject.value);
  }

  /**
   * Categorize tasks by status and deadline
   * Private method that's automatically called whenever cache changes
   */
  private categorizeTasks(tasks: TarefaDto[]): TaskCategories {
    const currentTimeISO = new Date().toISOString();

    const categorized: TaskCategories = {
      all: tasks,
      delayed: [],
      pending: [],
      completed: []
    };

    tasks.forEach(task => {
      // Ensure timezone info
      if (task.dataPrazo && !task.dataPrazo.endsWith('Z')) {
        task.dataPrazo = task.dataPrazo + 'Z';
      }

      // Categorize based on completion status and deadline
      if (task.dataConclusao != null) {
        categorized.completed.push(task);
      } else if (task.dataPrazo && task.dataPrazo < currentTimeISO) {
        categorized.delayed.push(task);
      } else {
        categorized.pending.push(task);
      }
    });

    return categorized;
  }

  /**
   * Filter tasks based on search query
   * Searches by task name, tags, and deadline
   */
  private filterTasks(tasks: TarefaDto[], query: string): TarefaDto[] {
    if (!query || query.trim() === '') {
      return tasks;
    }

    const searchTerms = query.toLowerCase().trim().split(/\s+/);

    return tasks.filter(task => {
      // Build searchable text from task properties
      const taskName = task.nome?.toLowerCase() || '';
      const taskDesc = task.descricao?.toLowerCase() || '';
      const tagNames = task.tags?.map(t => t.nome.toLowerCase()).join(' ') || '';
      
      // Format deadline for search (e.g., "15/12/2025")
      let deadlineText = '';
      if (task.dataPrazo) {
        const date = new Date(task.dataPrazo);
        deadlineText = date.toLocaleDateString('pt-BR');
      }

      const searchableText = `${taskName} ${taskDesc} ${tagNames} ${deadlineText}`;

      // All search terms must match
      return searchTerms.every(term => searchableText.includes(term));
    });
  }
}
