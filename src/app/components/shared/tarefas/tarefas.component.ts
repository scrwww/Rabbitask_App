import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { RouterModule } from '@angular/router';
import { take } from 'rxjs/operators';

import { TaskStateService } from '../../../services/task-state.service';
import { UserContextFacade } from '../../../services/user-context.facade';
import { ModalStateService } from '../../../services/modal-state.service';
import { TarefaDto } from '../../../services/tasks.service';

/**
 * TarefasComponent - Displays a list of tasks with completion checkboxes
 * 
 * This component follows the established architecture pattern:
 * - Uses ModalStateService for modal interactions (no EventEmitters)
 * - Uses TaskStateService for task state management
 * - Uses UserContextFacade for user context access
 * 
 * The component receives tasks via @Input() and displays them with:
 * - Task name, deadline, and tags
 * - Completion checkbox that triggers status updates
 * - Click handler for opening task detail modal
 */
@Component({
  selector: 'app-tarefas',
  templateUrl: './tarefas.component.html',
  styleUrls: ['./tarefas.component.scss'],
  imports: [IonicModule, FormsModule, RouterModule, CommonModule]
})
export class TarefasComponent {
  /**
   * Tasks to display in this component
   * Typed array ensures compile-time type checking
   */
  @Input() tarefas: TarefaDto[] = [];

  /**
   * CSS class for styling (e.g., 'tarefaConcluida', 'tarefaAtrasada', 'tarefaNaoConcluida')
   */
  @Input() tarefaCSS: string = '';

  constructor(
    private taskStateService: TaskStateService,
    private userContextFacade: UserContextFacade,
    private modalStateService: ModalStateService
  ) {}

  /**
   * Determine if a task is completed based on its dataConclusao field
   * Used by template to set checkbox initial state
   */
  isTaskCompleted(tarefa: TarefaDto): boolean {
    return tarefa.dataConclusao !== null && tarefa.dataConclusao !== undefined;
  }

  /**
   * Handle showing the tab for new task or editing
   * Uses ModalStateService instead of emitting events
   */
  mostrarTab(event: Event): void {
    const id = (event.currentTarget as HTMLElement).id;
    const palavras = id.split(' ');
    const modalName = 'TabEditTarefa ' + palavras[1];
    this.modalStateService.openModal(modalName as any);
  }

  /**
   * Handle opening task detail view
   * Uses ModalStateService instead of emitting events
   */
  visualizarDetalhe(tarefa: TarefaDto): void {
    this.modalStateService.openModal('TarefaDetalhe', tarefa);
  }

  /**
   * Handle clicks on task rows - distinguish between checkbox clicks and detail view clicks
   */
  onTarefaClick(event: Event, tarefa: any): void {
    const target = event.target as HTMLElement;
    // Don't open detail view if clicking on checkbox area
    if (target.tagName === 'INPUT' || target.tagName === 'LABEL' || target.closest('.checkboxTarefa')) {
      return;
    }
    // Open detail view for other clicks
    this.visualizarDetalhe(tarefa);
  }

  /**
   * Handle task completion state change
   * Uses data attributes from template for task ID extraction
   * TaskStateService handles cache updates which automatically trigger category updates
   */
  atualizarTarefa(event: Event): void {
    event.stopPropagation();
    event.preventDefault();

    const target = event.currentTarget as HTMLInputElement;
    if (!target) {
      console.error('Event target is null');
      return;
    }

    // Extract task ID from data attribute (more reliable than parsing name)
    const tarefaIdAttr = target.getAttribute('data-task-id');
    if (!tarefaIdAttr) {
      console.error('No data-task-id attribute found on checkbox');
      target.checked = !target.checked;
      return;
    }

    const tarefaId = parseInt(tarefaIdAttr, 10);
    if (isNaN(tarefaId)) {
      console.error(`Invalid task ID: "${tarefaIdAttr}"`);
      target.checked = !target.checked;
      return;
    }

    const isChecked = target.checked;

    // Get current user ID from observable (take first value)
    this.userContextFacade.userContext$.pipe(
      take(1)
    ).subscribe({
      next: (userContext) => {
        const cdUsuario = userContext.userID;

        if (!cdUsuario) {
          console.error('User ID not available');
          target.checked = !isChecked;
          return;
        }

        // Perform the status update through TaskStateService
        // This automatically updates cache and categories
        const updateObservable = isChecked
          ? this.taskStateService.completeTask(tarefaId, cdUsuario)
          : this.taskStateService.reopenTask(tarefaId, cdUsuario);

        updateObservable.subscribe({
          next: () => {
            // Cache is automatically updated by TaskStateService
          },
          error: (err) => {
            console.error(`Error updating task status:`, err);
            // Revert checkbox on error
            target.checked = !isChecked;
          }
        });
      },
      error: (err) => {
        console.error('Error getting user context:', err);
        target.checked = !isChecked;
      }
    });
  }
}

