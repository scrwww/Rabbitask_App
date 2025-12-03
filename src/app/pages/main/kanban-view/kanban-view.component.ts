import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TarefaDto } from 'src/app/services/tasks.service';
import { TarefasComponent } from 'src/app/components/shared/tarefas/tarefas.component';

/**
 * KanbanViewComponent - Displays tasks in a Kanban board layout
 * 
 * This view shows tasks organized in three columns:
 * - Atrasadas (Delayed) - Tasks past their due date
 * - Pendentes (Pending) - Tasks not yet completed
 * - Concluídas (Completed) - Tasks that have been completed
 * 
 * The view is horizontally scrollable for mobile-friendly navigation.
 */
@Component({
  selector: 'app-kanban-view',
  templateUrl: './kanban-view.component.html',
  styleUrls: ['./kanban-view.component.scss'],
  standalone: true,
  imports: [CommonModule, TarefasComponent]
})
export class KanbanViewComponent {
  @Input() tarefasAtrasadas: TarefaDto[] = [];
  @Input() tarefasPendentes: TarefaDto[] = [];
  @Input() tarefasConcluidas: TarefaDto[] = [];

  /**
   * CSS class for delayed tasks
   */
  readonly Atrasada = 'tarefaAtrasada';

  /**
   * CSS class for pending tasks
   */
  readonly Pendente = 'tarefaNaoConcluida';

  /**
   * CSS class for completed tasks
   */
  readonly Concluida = 'tarefaConcluida';
}
