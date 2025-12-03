import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { OverseeService } from 'src/app/services/oversee.service';

@Component({
  selector: 'app-oversee-indicator',
  templateUrl: './oversee-indicator.component.html',
  styleUrls: ['./oversee-indicator.component.scss'],
  standalone: true,
  imports: [CommonModule]
})
export class OverseeIndicatorComponent implements OnInit {
  isOverseeing: boolean = false;
  overseeingUserName: string | null = null;

  constructor(private overseeService: OverseeService) {}

  ngOnInit(): void {
    // Subscribe to changes in overseeing state
    this.overseeService.overseeing$.subscribe(userId => {
      this.isOverseeing = userId !== null;
    });

    this.overseeService.overseeingUserName$.subscribe(userName => {
      this.overseeingUserName = userName;
    });

    // Initialize on load
    this.isOverseeing = this.overseeService.isOverseeing();
    this.overseeingUserName = this.overseeService.currentUserName;
  }

  /**
   * Clear the overseeing state and go back to viewing own tasks
   */
  goBackToOwnTasks(): void {
    this.overseeService.clear();
  }
}
