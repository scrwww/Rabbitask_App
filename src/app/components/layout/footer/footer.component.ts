import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { UserService } from 'src/app/services/user.service';
import { AuthService } from 'src/app/services/auth.service';
import { OverseeService } from 'src/app/services/oversee.service';
import { ModalStateService } from 'src/app/services/modal-state.service';
import { SharedTabsModule } from 'src/app/shared/shared-tabs/shared-tabs-module';

@Component({
  selector: 'app-footer',
  templateUrl: './footer.component.html',
  styleUrls: ['./footer.component.scss'],
  imports: [SharedTabsModule, CommonModule]
})
export class FooterComponent implements OnInit {
  // User type flags
  isAgente: boolean = false;
  isComum: boolean = false;

  // Current viewing state
  isViewingConnectedUser: boolean = false;

  userData: any;
  userID: any;

  constructor(
    private authService: AuthService,
    private userService: UserService,
    private overseeService: OverseeService,
    public modalStateService: ModalStateService
  ) {}

  ngOnInit(): void {
    this.determineUserType();
    this.checkConnectedUserView();

    // Listen for changes in connected user view
    this.overseeService.overseeing$.subscribe(() => {
      this.checkConnectedUserView();
    });
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

    this.getUserID();
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
   * Check if currently viewing a connected user's tasks
   */
  checkConnectedUserView(): void {
    this.isViewingConnectedUser = this.overseeService.isOverseeing();
  }

  /**
   * Open modal by name
   * @param modalName The name of the modal to open
   */
  openModal(modalName: string): void {
    this.modalStateService.openModal(modalName as any);
  }
}
