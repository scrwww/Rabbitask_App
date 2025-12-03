import { Component, Input, OnInit, Output, EventEmitter } from '@angular/core';
import { UserService } from 'src/app/services/user.service';
import { TasksService } from 'src/app/services/tasks.service';
import { AuthService } from 'src/app/services/auth.service';
import { ModalStateService, ModalType } from 'src/app/services/modal-state.service';
import { Router } from '@angular/router';
import { SharedTabsModule } from 'src/app/shared/shared-tabs/shared-tabs-module';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-config',
  templateUrl: './config.component.html',
  styleUrls: ['./config.component.scss'],
  imports: [SharedTabsModule, CommonModule]
})
export class ConfigComponent implements OnInit {
  // User type flags
  isAgente: boolean = false;
  isComum: boolean = false;

  userData: any;
  userID: any;

  constructor(
    private tasksService: TasksService,
    private authService: AuthService,
    private userService: UserService,
    private modalStateService: ModalStateService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.determineUserType();
    this.getUserID();
  }

  /**
   * Determine user type (Comum or Agente)
   */
  determineUserType(): void {
    this.authService.isAgente().subscribe(isAgente => {
      this.isAgente = isAgente;
    });

    this.authService.isComum().subscribe(isComum => {
      this.isComum = isComum;
    });
  }

  /**
   * Get current user ID and info
   */
  getUserID(): void {
    this.userService.getUserID().subscribe({
      next: res => {
        if (res.success) {
          this.userData = res.data;
          this.userID = this.userData.cd;
        }
      },
      error: err => console.error('Error fetching user ID:', err)
    });
  }

  /**
   * Open a modal using ModalStateService
   * @param modalName The name of the modal to open
   */
  mostrarTab(modalName: ModalType): void {
    this.modalStateService.openModal(modalName);
  }

  /**
   * Return to main page
   */
  retornarIndex(): void {
    this.router.navigate(['/index-list']);
  }

  /**
   * Handle logout
   */
  logout(): void {
    this.authService.logout();
    this.router.navigate(['/home']);
  }
}
