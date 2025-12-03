import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, throwError, BehaviorSubject } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import { environment } from 'src/environments/environment';
 
/**
 * DTO for task data
 */
export interface TarefaDto {
  cd: number;
  nome: string;
  descricao: string;
  dataPrazo: string | null;
  dataConclusao: string | null;
  dataCriacao: string;
  prioridade: { cd: number; nome: string } | null;
  usuario: { cd: number; nome: string };
  usuarioProprietario?: { cd: number; nome: string } | null;
  tags: { cd: number; nome: string }[];
}

/**
 * Generic API response wrapper
 */
export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

/**
 * Request DTO for creating a task
 */
export interface CreateTarefaRequest {
  nome: string;
  cdUsuario: number;
  descricao: string;
  cdPrioridade: number;
  dataPrazo: string;
  tagNomes: string[];
}

/**
 * Request DTO for updating a task
 */
export interface UpdateTarefaRequest {
  nome: string;
  descricao: string;
  cdPrioridade: number;
  dataPrazo: string;
  tagNomes: string[];
}

/**
 * Query parameters for fetching tasks
 */
export interface GetTarefasParams {
  cdUsuario?: number;
  incluirConectados?: boolean;
  cdPrioridade?: number;
  concluidas?: boolean;
  pagina?: number;
  paginaTamanho?: number;
}
 
@Injectable({
  providedIn: 'root'
})
export class TasksService {
  /**
   * API base URL with endpoint path
   * Constructed from environment configuration
   * Supports environment variable override for containerized deployments
   * Note: Authorization headers are automatically injected by AuthInterceptor
   */
  private apiUrl = `${environment.apiUrl}${environment.api.tasks}`;
  
  /**
   * Cache of tasks to avoid unnecessary API calls
   * Updated when tasks are fetched, created, edited, or status changed
   */
  private tarefasCache = new BehaviorSubject<TarefaDto[]>([]);
  
  /**
   * Observable stream of cached tasks
   * Subscribers receive updates when tasks change
   */
  public tarefas$ = this.tarefasCache.asObservable();
 
  constructor(private http: HttpClient) {}
 
  /**
   * Fetch tasks with optional filtering
   * Results are cached in tarefasCache
   */
  getTarefas(params?: GetTarefasParams): Observable<ApiResponse<TarefaDto[]>> {
    let httpParams = new HttpParams();
    if (params) {
      Object.keys(params).forEach(key => {
        const value = (params as any)[key];
        if (value !== undefined && value !== null) {
          httpParams = httpParams.set(key, value.toString());
        }
      });
    }
 
    return this.http.get<ApiResponse<TarefaDto[]>>(this.apiUrl, {
      params: httpParams
    }).pipe(
      tap(response => {
        if (response.success) {
          this.tarefasCache.next(response.data);
        }
      }),
      catchError(error => {
        console.error('Error fetching tasks:', error);
        return throwError(() => new Error('Failed to fetch tasks'));
      })
    );
  }

  /**
   * Create a new task
   */
  createTarefa(tarefa: CreateTarefaRequest): Observable<ApiResponse<TarefaDto>> {
    return this.http.post<ApiResponse<TarefaDto>>(this.apiUrl, tarefa)
      .pipe(
        tap(response => {
          // Update cache with new task
          if (response.success && response.data) {
            const currentCache = this.tarefasCache.value;
            this.tarefasCache.next([...currentCache, response.data]);
          }
        }),
        catchError(error => {
          console.error('Error creating task:', error);
          return throwError(() => error);
        })
      );
  }

  /**
   * Update an existing task
   */
  editarTarefa(
    cdTarefa: number,
    cdUsuario: number,
    tarefa: UpdateTarefaRequest
  ): Observable<ApiResponse<TarefaDto>> {
    const url = `${this.apiUrl}/${cdTarefa}?cdUsuario=${cdUsuario}`;
    return this.http.put<ApiResponse<TarefaDto>>(url, tarefa)
      .pipe(
        catchError(error => {
          console.error('Error updating task:', error);
          return throwError(() => new Error('Failed to update task'));
        })
      );
  }

  /**
   * Mark a task as completed
   * Updates local cache immediately for responsive UI
   */
  patchTarefaConcluir(cdTarefa: number, cdUsuario: number): Observable<ApiResponse<TarefaDto>> {
    const url = `${this.apiUrl}/${cdTarefa}/concluir?cdUsuario=${cdUsuario}`;
    return this.http.patch<ApiResponse<TarefaDto>>(url, {})
      .pipe(
        tap(response => {
          if (response.success) {
            // Update cache with returned task or manually mark as complete
            if (response.data) {
              this.updateTaskInCache(response.data);
            } else {
              // If no data returned, manually update the task status in cache
              this.markTaskCompleted(cdTarefa);
            }
          }
        }),
        catchError(error => {
          console.error('Error completing task:', error);
          return throwError(() => new Error('Failed to complete task'));
        })
      );
  }

  /**
   * Reopen a completed task
   * Updates local cache immediately for responsive UI
   */
  patchTarefaReabrir(cdTarefa: number, cdUsuario: number): Observable<ApiResponse<TarefaDto>> {
    const url = `${this.apiUrl}/${cdTarefa}/reabrir?cdUsuario=${cdUsuario}`;
    return this.http.patch<ApiResponse<TarefaDto>>(url, {})
      .pipe(
        tap(response => {
          if (response.success) {
            // Update cache with returned task or manually mark as incomplete
            if (response.data) {
              this.updateTaskInCache(response.data);
            } else {
              // If no data returned, manually update the task status in cache
              this.markTaskIncomplete(cdTarefa);
            }
          }
        }),
        catchError(error => {
          console.error('Error reopening task:', error);
          return throwError(() => new Error('Failed to reopen task'));
        })
      );
  }

  /**
   * Update a specific task in the cache
   * Called after task status changes to keep UI in sync without page reload
   * @param updatedTask The updated task object from API response
   */
  private updateTaskInCache(updatedTask: TarefaDto | undefined): void {
    // If no task data returned, just skip cache update
    if (!updatedTask) {
      console.warn('No task data in response, skipping cache update');
      return;
    }

    const currentTarefas = this.tarefasCache.value;
    const index = currentTarefas.findIndex(t => t.cd === updatedTask.cd);
    
    if (index !== -1) {
      // Task exists in cache, update it
      const updatedTarefas = [...currentTarefas];
      updatedTarefas[index] = updatedTask;
      this.tarefasCache.next(updatedTarefas);
    } else {
      // Task not in cache, add it
      this.tarefasCache.next([...currentTarefas, updatedTask]);
    }
  }

  /**
   * Mark a task as completed in the cache (for when API doesn't return full task data)
   * Sets dataConclusao to current time
   */
  private markTaskCompleted(cdTarefa: number): void {
    const currentTarefas = this.tarefasCache.value;
    const index = currentTarefas.findIndex(t => t.cd === cdTarefa);
    
    if (index !== -1) {
      const updatedTarefas = [...currentTarefas];
      updatedTarefas[index] = {
        ...updatedTarefas[index],
        dataConclusao: new Date().toISOString()
      };
      this.tarefasCache.next(updatedTarefas);
    }
  }

  /**
   * Mark a task as incomplete in the cache (for when API doesn't return full task data)
   * Clears dataConclusao
   */
  private markTaskIncomplete(cdTarefa: number): void {
    const currentTarefas = this.tarefasCache.value;
    const index = currentTarefas.findIndex(t => t.cd === cdTarefa);
    
    if (index !== -1) {
      const updatedTarefas = [...currentTarefas];
      updatedTarefas[index] = {
        ...updatedTarefas[index],
        dataConclusao: null
      };
      this.tarefasCache.next(updatedTarefas);
    }
  }

  /**
   * Get current cached tasks without making API call
   * Useful for immediate access to cached data
   */
  getCachedTarefas(): TarefaDto[] {
    return this.tarefasCache.value;
  }

  /**
   * Delete a task
   * Removes task from cache immediately for responsive UI
   */
  deleteTarefa(cdTarefa: number, cdUsuario: number): Observable<ApiResponse<void>> {
    const url = `${this.apiUrl}/${cdTarefa}?cdUsuario=${cdUsuario}`;
    return this.http.delete<ApiResponse<void>>(url)
      .pipe(
        tap(response => {
          if (response.success) {
            // Remove task from cache
            this.removeTaskFromCache(cdTarefa);
          }
        }),
        catchError(error => {
          console.error('Error deleting task:', error);
          return throwError(() => new Error('Failed to delete task'));
        })
      );
  }

  /**
   * Remove a task from the cache
   * Called after successful deletion
   */
  private removeTaskFromCache(cdTarefa: number): void {
    const currentTarefas = this.tarefasCache.value;
    const updatedTarefas = currentTarefas.filter(t => t.cd !== cdTarefa);
    this.tarefasCache.next(updatedTarefas);
  }
}

