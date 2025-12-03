import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonCard, IonCardContent, IonCardHeader, IonCardTitle } from '@ionic/angular/standalone';
import { TarefasComponent } from 'src/app/components/shared/tarefas/tarefas.component';
import { TarefaDto } from 'src/app/services/tasks.service';

@Component({
  selector: 'app-list-view',
  templateUrl: './list-view.component.html',
  styleUrls: ['./list-view.component.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule, IonCard, IonCardContent, IonCardHeader, IonCardTitle, TarefasComponent]
})
export class ListViewComponent {
  /**
   * All tasks
   */
  @Input() tarefas: TarefaDto[] = [];

  /**
   * Delayed/overdue tasks
   */
  @Input() tarefasAtrasadas: TarefaDto[] = [];

  /**
   * Pending tasks
   */
  @Input() tarefasPendentes: TarefaDto[] = [];

  /**
   * Completed tasks
   */
  @Input() tarefasConcluidas: TarefaDto[] = [];

  // CSS class constants for task categorization
  readonly Atrasada = 'tarefaAtrasada';
  readonly Pendente = 'tarefaNaoConcluida';
  readonly Concluida = 'tarefaConcluida';

  /**
   * Note: Task modals are now handled directly by TarefasComponent
   * which injects ModalStateService. No event handlers needed in parent.
   * 
   * Task categorization is automatic through TaskStateService
   * No manual recategorization needed when tasks are updated
   * The parent component (IndexListPage) receives updates via taskCategories$ observable
   */
}
