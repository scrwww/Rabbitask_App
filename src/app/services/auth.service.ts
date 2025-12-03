import { Injectable, Injector } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { tap, map, catchError } from 'rxjs/operators';
import { environment } from 'src/environments/environment';
import { TaskStateService } from './task-state.service';
import { UserManagementService } from './user-management.service';
import { OverseeService } from './oversee.service';
import { ModalStateService } from './modal-state.service';
import { STORAGE_KEYS } from '../shared/constants/storage.constants';
 
interface LoginRequest {
  email: string;
  senha: string;
}

interface LoginResponse {
  success?: boolean;
  message?: string;
  data?: {
    token: string;
    cdUsuario: number;
    nmUsuario: string;
    email: string;
  };
  token?: string;
}

interface UserTypeResponse {
  success: boolean;
  message: string;
  data: {
    cd: number;
    tipo: {
      cd: number;
      nome: string;
    };
  };
}

interface RegisterRequest {
  nmUsuario: string;
  nmEmail: string;
  nmSenha: string;
  cdTelefone: string;
  cdTipoUsuario: number;
}

interface RegisterResponse {
  success: boolean;
  message: string;
  data?: {
    cdUsuario: number;
    nmUsuario: string;
    email: string;
  };
}
 
@Injectable({
  providedIn: 'root'
})
export class AuthService {
  /**
   * API endpoint for authentication
   * Uses centralized configuration that supports environment variable override
   */
  private apiUrl = `${environment.apiUrl}${environment.api.auth}`;
  private usuarioUrl = `${environment.apiUrl}${environment.api.users}`;
  private tokenSubject = new BehaviorSubject<string | null>(null);
  private tokenKey = environment.jwt_token;
  private userTypeSubject = new BehaviorSubject<number | null>(null);
 
  constructor(
    private http: HttpClient,
    private injector: Injector
  ) {
    this.initializeTokenFromStorage();
  }

  private initializeTokenFromStorage(): void {
    const token = localStorage.getItem(this.tokenKey);
    if (token) {
      this.tokenSubject.next(token);
    }
  }
 
  login(credentials: LoginRequest): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(`${this.apiUrl}/login`, credentials)
      .pipe(
        tap(res => {
          // Handle both response structures: direct token or wrapped in data
          const token = res.data?.token || res.token;
          if (token) {
            this.tokenSubject.next(token);
            localStorage.setItem(this.tokenKey, token);
          }
        })
      );
  }

  register(data: RegisterRequest): Observable<RegisterResponse> {
    return this.http.post<RegisterResponse>(`${this.apiUrl}/cadastrar`, data)
      .pipe(
        tap(res => {
          if (res.data) {
            // Token might be returned in response or set via other means
          }
        })
      );
  }
 
  getToken(): string | null {
    return this.tokenSubject.value || localStorage.getItem(this.tokenKey);
  }

  /**
   * Get the current user type (Comum=1, Agente=2)
   */
  getUserType(): Observable<number | null> {
    if (this.userTypeSubject.value !== null) {
      return of(this.userTypeSubject.value);
    }
    return this.http.get<UserTypeResponse>(`${this.usuarioUrl}/eu`).pipe(
      tap(res => {
        if (res.success && res.data?.tipo?.cd) {
          this.userTypeSubject.next(res.data.tipo.cd);
        }
      }),
      map(res => res.data?.tipo?.cd || null),
      catchError(error => {
        console.error('Error fetching user type:', error);
        return of(null);
      })
    );
  }

  /**
   * Check if user is an Agente (type 2)
   */
  isAgente(): Observable<boolean> {
    return this.getUserType().pipe(
      map(typeId => typeId === 2),
      catchError(() => of(false))
    );
  }

  /**
   * Check if user is Comum (type 1)
   */
  isComum(): Observable<boolean> {
    return this.getUserType().pipe(
      map(typeId => typeId === 1),
      catchError(() => of(false))
    );
  }
 
  logout() {
    // Clear auth state
    this.tokenSubject.next(null);
    this.userTypeSubject.next(null);
    localStorage.removeItem(this.tokenKey);

    // Clear task cache
    const taskStateService = this.injector.get(TaskStateService);
    taskStateService.clearCache();

    // Clear user management state
    const userManagementService = this.injector.get(UserManagementService);
    userManagementService.reset();

    // Clear oversee state (removes localStorage item too)
    const overseeService = this.injector.get(OverseeService);
    overseeService.clear();

    // Close any open modals
    const modalStateService = this.injector.get(ModalStateService);
    modalStateService.closeAllModals();

    // Clear generated connection code (for Comum users)
    localStorage.removeItem(STORAGE_KEYS.GENERATED_CODE);
  }
}