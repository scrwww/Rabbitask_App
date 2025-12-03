import { Component, Input, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TarefaDto } from 'src/app/services/tasks.service';
import { TarefasComponent } from 'src/app/components/shared/tarefas/tarefas.component';

/**
 * Interface for tasks grouped by day
 */
interface DayGroup {
  date: Date;
  dayLabel: string;
  monthLabel: string;
  tasks: TarefaDto[];
}

/**
 * TimelineViewComponent - Displays tasks in a vertical timeline grouped by day
 * 
 * This view shows tasks organized chronologically with:
 * - A vertical line connecting all days
 * - Day markers with date labels
 * - Tasks grouped under their respective days
 */
@Component({
  selector: 'app-timeline-view',
  templateUrl: './timeline-view.component.html',
  styleUrls: ['./timeline-view.component.scss'],
  standalone: true,
  imports: [CommonModule, TarefasComponent]
})
export class TimelineViewComponent implements OnChanges {
  @Input() tarefas: TarefaDto[] = [];

  /**
   * Tasks grouped by day for timeline display
   */
  dayGroups: DayGroup[] = [];

  /**
   * Month names in Portuguese
   */
  private monthNames = [
    'Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun',
    'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'
  ];

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['tarefas']) {
      this.groupTasksByDay();
    }
  }

  /**
   * Group tasks by their due date (dataPrazo)
   * Tasks without a date go into "Sem Prazo" group
   */
  private groupTasksByDay(): void {
    const groupMap = new Map<string, TarefaDto[]>();

    // Sort tasks by date first
    const sortedTasks = [...this.tarefas].sort((a, b) => {
      if (!a.dataPrazo) return 1;
      if (!b.dataPrazo) return -1;
      return new Date(a.dataPrazo).getTime() - new Date(b.dataPrazo).getTime();
    });

    // Group tasks by date
    sortedTasks.forEach(task => {
      const dateKey = task.dataPrazo 
        ? new Date(task.dataPrazo).toDateString() 
        : 'no-date';
      
      if (!groupMap.has(dateKey)) {
        groupMap.set(dateKey, []);
      }
      groupMap.get(dateKey)!.push(task);
    });

    // Convert map to DayGroup array
    this.dayGroups = [];
    groupMap.forEach((tasks, dateKey) => {
      if (dateKey === 'no-date') {
        // Handle tasks without a date - skip for now or add at end
        return;
      }

      const date = new Date(dateKey);
      this.dayGroups.push({
        date,
        dayLabel: date.getDate().toString(),
        monthLabel: this.monthNames[date.getMonth()],
        tasks
      });
    });

    // Sort groups by date
    this.dayGroups.sort((a, b) => a.date.getTime() - b.date.getTime());
  }

  /**
   * Determine the CSS class for a task based on its status
   */
  getTaskCSS(task: TarefaDto): string {
    if (task.dataConclusao) {
      return 'tarefaConcluida';
    }
    
    if (task.dataPrazo) {
      const now = new Date();
      const dueDate = new Date(task.dataPrazo);
      if (dueDate < now) {
        return 'tarefaAtrasada';
      }
    }
    
    return 'tarefaNaoConcluida';
  }

  /**
   * Check if a task is completed
   */
  isCompleted(task: TarefaDto): boolean {
    return task.dataConclusao !== null;
  }
}
