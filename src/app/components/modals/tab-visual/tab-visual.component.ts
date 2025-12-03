import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ViewStateService, ViewType } from 'src/app/services/view-state.service';

@Component({
  selector: 'app-tab-visual',
  templateUrl: './tab-visual.component.html',
  styleUrls: ['./tab-visual.component.scss'],
  standalone: true,
  imports: [CommonModule]
})
export class TabVisualComponent implements OnInit {
  currentView: ViewType = 'list';

  constructor(private viewStateService: ViewStateService) {}

  ngOnInit(): void {
    this.viewStateService.currentView$.subscribe(view => {
      this.currentView = view;
    });
  }

  /**
   * Switch to list view
   */
  switchToList(): void {
    this.viewStateService.setView('list');
  }

  /**
   * Switch to calendar view
   */
  switchToCalendar(): void {
    this.viewStateService.setView('calendar');
  }

  /**
   * Switch to timeline view
   */
  switchToTimeline(): void {
    this.viewStateService.setView('timeline');
  }

  /**
   * Switch to kanban view
   */
  switchToKanban(): void {
    this.viewStateService.setView('kanban');
  }
}

