import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { UserContextFacade } from 'src/app/services/user-context.facade';
import { UserManagementService } from 'src/app/services/user-management.service';
import { Observable, Subject } from 'rxjs';
import { take, takeUntil } from 'rxjs/operators';

@Component({
  selector: 'app-user-switcher',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './user-switcher.component.html',
  styleUrls: ['./user-switcher.component.scss']
})
export class UserSwitcherComponent implements OnInit, OnDestroy {
  /**
   * Current logged-in user
   */
  usuarioAtual: any = null;

  /**
   * Currently overseen user (if any)
   */
  usuarioConectado: any = null;

  /**
   * Loading state
   */
  carregando: boolean = false;

  /**
   * Observable for overseen user name
   */
  overseeingUserName$: Observable<string | null>;

  /**
   * Observable for oversee status
   */
  isOverseeing$: Observable<boolean>;

  private destroy$ = new Subject<void>();

  constructor(
    private userContextFacade: UserContextFacade,
    private userManagementService: UserManagementService
  ) {
    this.overseeingUserName$ = this.userContextFacade.overseeingUserName$;
    this.isOverseeing$ = this.userContextFacade.isOverseeing$;
  }

  ngOnInit(): void {
    this.loadCurrentUser();
    this.watchForOverseeChanges();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Load the current authenticated user
   * Uses observable to get user context properly
   */
  private loadCurrentUser(): void {
    this.userContextFacade.userContext$.pipe(
      take(1)
    ).subscribe({
      next: (userContext) => {
        if (userContext.userID) {
          this.usuarioAtual = userContext.userData;
        }
      }
    });
  }

  /**
   * Watch for oversee state changes and load the overseen user
   */
  private watchForOverseeChanges(): void {
    this.userContextFacade.viewedUser$.pipe(
      takeUntil(this.destroy$)
    ).subscribe(viewed => {
      if (viewed.isOverseen && viewed.overseeingUserId) {
        this.loadOverseeingUser(viewed.overseeingUserId);
      } else {
        this.usuarioConectado = null;
      }
    });
  }

  /**
   * Load details for the overseen user
   */
  private loadOverseeingUser(userId: number): void {
    this.carregando = true;

    this.userManagementService.getUserById(userId).subscribe({
      next: (user) => {
        this.usuarioConectado = user;
        this.carregando = false;
      },
      error: (err) => {
        console.error('Error loading overseen user:', err);
        this.usuarioConectado = null;
        this.carregando = false;
      }
    });
  }

  /**
   * Return to viewing own tasks
   */
  voltarParaMeuUsuario(): void {
    this.userContextFacade.clearOverseeing();
    this.usuarioConectado = null;
  }
}
