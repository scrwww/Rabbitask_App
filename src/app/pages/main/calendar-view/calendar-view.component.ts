import { Component, Input, OnInit, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { TarefasComponent } from 'src/app/components/shared/tarefas/tarefas.component';
import { ModalStateService } from 'src/app/services/modal-state.service';

interface CalendarDay {
  date: Date;
  day: number;
  month: number;
  year: number;
  isCurrentMonth: boolean;
  tasks: any[];
  taskCount: number;
}

interface CalendarMonth {
  month: number;
  year: number;
  weeks: CalendarDay[][];
}

@Component({
  selector: 'app-calendar-view',
  templateUrl: './calendar-view.component.html',
  styleUrls: ['./calendar-view.component.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule, IonicModule, TarefasComponent]
})
export class CalendarViewComponent implements OnInit, OnChanges {
  @Input() tarefas: any[] = [];

  calendar: CalendarMonth = { month: 0, year: 0, weeks: [] };
  selectedDate: Date | null = null;
  selectedDateTasks: any[] = [];
  currentDate: Date = new Date();

  readonly monthNames = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
  ];
  readonly dayNames = ['DOM', 'SEG', 'TER', 'QUA', 'QUI', 'SEX', 'SAB'];
  readonly Atrasada = 'tarefaAtrasada';
  readonly Pendente = 'tarefaNaoConcluida';
  readonly Concluida = 'tarefaConcluida';

  constructor(private modalStateService: ModalStateService) {}

  ngOnInit(): void {
    this.generateCalendar(this.currentDate.getFullYear(), this.currentDate.getMonth());
    this.selectDate(this.createCalendarDay(new Date(), true));
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['tarefas']) {
      // Regenerate calendar with updated tasks
      this.generateCalendar(this.currentDate.getFullYear(), this.currentDate.getMonth());
      
      // If a date is selected, update its tasks
      if (this.selectedDate) {
        const dateStr = this.formatDateForComparison(this.selectedDate);
        this.selectedDateTasks = this.getTasksForDate(dateStr);
      }
    }
  }

  /**
   * Generate calendar for given month and year
   */
  generateCalendar(year: number, month: number): void {
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const prevLastDay = new Date(year, month, 0);

    const weeks: CalendarDay[][] = [];
    let week: CalendarDay[] = [];

    // Add previous month's days
    const firstDayOfWeek = firstDay.getDay();
    for (let i = firstDayOfWeek - 1; i >= 0; i--) {
      const day = prevLastDay.getDate() - i;
      const date = new Date(year, month - 1, day);
      week.push(this.createCalendarDay(date, false));
    }

    // Add current month's days
    for (let day = 1; day <= lastDay.getDate(); day++) {
      const date = new Date(year, month, day);
      week.push(this.createCalendarDay(date, true));

      if (week.length === 7) {
        weeks.push(week);
        week = [];
      }
    }

    // Add next month's days
    const remainingDays = 7 - week.length;
    for (let day = 1; day <= remainingDays; day++) {
      const date = new Date(year, month + 1, day);
      week.push(this.createCalendarDay(date, false));
    }

    if (week.length > 0) {
      weeks.push(week);
    }

    this.calendar = { month, year, weeks };
  }

  /**
   * Create a calendar day object with associated tasks
   */
  private createCalendarDay(date: Date, isCurrentMonth: boolean): CalendarDay {
    const dateStr = this.formatDateForComparison(date);
    const dayTasks = this.getTasksForDate(dateStr);

    return {
      date,
      day: date.getDate(),
      month: date.getMonth(),
      year: date.getFullYear(),
      isCurrentMonth,
      tasks: dayTasks,
      taskCount: Math.min(dayTasks.length, 4) // Max 4 dots
    };
  }

  /**
   * Get all tasks scheduled for a specific date
   */
  private getTasksForDate(dateStr: string): any[] {
    return this.tarefas.filter(task => {
      if (!task.dataPrazo) return false;
      const taskDate = this.formatDateForComparison(new Date(task.dataPrazo));
      return taskDate === dateStr;
    });
  }

  /**
   * Format date to YYYY-MM-DD for comparison
   */
  private formatDateForComparison(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  /**
   * Select a date and show its tasks
   */
  selectDate(calendarDay: CalendarDay): void {
    if (!calendarDay.isCurrentMonth) return;
    
    this.selectedDate = calendarDay.date;
    this.selectedDateTasks = calendarDay.tasks;
  }

  /**
   * Navigate to previous month
   */
  previousMonth(): void {
    if (this.currentDate.getMonth() === 0) {
      this.currentDate = new Date(this.currentDate.getFullYear() - 1, 11, 1);
    } else {
      this.currentDate = new Date(this.currentDate.getFullYear(), this.currentDate.getMonth() - 1, 1);
    }
    this.generateCalendar(this.currentDate.getFullYear(), this.currentDate.getMonth());
  }

  /**
   * Navigate to next month
   */
  nextMonth(): void {
    if (this.currentDate.getMonth() === 11) {
      this.currentDate = new Date(this.currentDate.getFullYear() + 1, 0, 1);
    } else {
      this.currentDate = new Date(this.currentDate.getFullYear(), this.currentDate.getMonth() + 1, 1);
    }
    this.generateCalendar(this.currentDate.getFullYear(), this.currentDate.getMonth());
  }

  /**
   * Check if a date is today
   */
  isToday(calendarDay: CalendarDay): boolean {
    const today = new Date();
    return (
      calendarDay.day === today.getDate() &&
      calendarDay.month === today.getMonth() &&
      calendarDay.year === today.getFullYear()
    );
  }

  /**
   * Check if a date is selected
   */
  isSelected(calendarDay: CalendarDay): boolean {
    if (!this.selectedDate) return false;
    return (
      calendarDay.day === this.selectedDate.getDate() &&
      calendarDay.month === this.selectedDate.getMonth() &&
      calendarDay.year === this.selectedDate.getFullYear()
    );
  }

  /**
   * Get task count for a specific date (capped at 4)
   */
  getTaskCountForDay(date: Date): number {
    const dateStr = this.formatDateForComparison(date);
    const tasksForDay = this.tarefas.filter(task => {
      if (!task.dataPrazo) return false;
      const taskDate = this.formatDateForComparison(new Date(task.dataPrazo));
      return taskDate === dateStr;
    });
    // Cap at 4 dots maximum
    return Math.min(tasksForDay.length, 4);
  }

  /**
   * Get array of task indicators (1-4 items)
   */
  getTaskDotsArray(date: Date): number[] {
    const count = this.getTaskCountForDay(date);
    return Array.from({ length: count }, (_, i) => i);
  }

  /**
   * Format selected date for display
   */
  getSelectedDateDisplay(): string {
    if (!this.selectedDate) return '';
    const dayOfWeek = this.dayNames[this.selectedDate.getDay()];
    const day = this.selectedDate.getDate();
    const month = this.monthNames[this.selectedDate.getMonth()];
    const year = this.selectedDate.getFullYear();
    return `${dayOfWeek}, ${day} de ${month} de ${year}`;
  }

  /**
   * Get delayed tasks for selected date
   */
  getTasksAtrasadas(): any[] {
    const horarioAtualISO = new Date().toISOString();
    return this.selectedDateTasks.filter(task => {
      // Only incomplete tasks that are past deadline
      return !task.dataConclusao && task.dataPrazo < horarioAtualISO;
    });
  }

  /**
   * Get pending tasks for selected date
   */
  getTasksPendentes(): any[] {
    const horarioAtualISO = new Date().toISOString();
    return this.selectedDateTasks.filter(task => {
      // Incomplete tasks that are not yet past deadline
      return !task.dataConclusao && task.dataPrazo >= horarioAtualISO;
    });
  }

  /**
   * Get completed tasks for selected date
   */
  getTasksConcluidas(): any[] {
    return this.selectedDateTasks.filter(task => {
      // Tasks with a completion date are completed
      return task.dataConclusao !== null && task.dataConclusao !== undefined;
    });
  }

  /**
   * Open nova tarefa modal
   */
  onNovaTarefaClick(): void {
    this.modalStateService.openModal('NovaTarefa');
  }

  /**
   * Open task detail modal
   */
  onTarefaDetalheClick(tarefa: any): void {
    this.modalStateService.openModal('TarefaDetalhe', tarefa);
  }

  /**
   * Note: Task categorization is now automatic through TaskStateService
   * No manual recategorization needed when tasks are updated
   */
}
