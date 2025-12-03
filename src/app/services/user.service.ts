import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { environment } from 'src/environments/environment';

/**
 * DTOs for User Service API responses
 */
export interface UserProfile {
  cd: number;
  nmUsuario: string;
  nome?: string;
  email: string;
  telefone?: string;
  tipo?: { cd: number; nome: string };
}

export interface UpdateProfileRequest {
  nome?: string;
  email?: string;
  telefone?: string;
  novaSenha?: string;
}

export interface TagDto {
  cd: number;
  nome: string;
}

export interface ConnectedUserDto {
  cd: number;
  nmUsuario: string;
  email: string;
}

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

@Injectable({
  providedIn: 'root'
})
export class UserService {
  /**
   * API endpoints using centralized configuration
   * Supports environment variable override for containerized deployments
   * Note: Authorization headers are automatically injected by AuthInterceptor
   */
  private userEndpoint = `${environment.apiUrl}${environment.api.users}`;
  private tagEndpoint = `${environment.apiUrl}${environment.api.tags}`;

  constructor(private http: HttpClient) {}
  
  /**
   * Fetch current authenticated user's profile
   */
  getUserID(): Observable<ApiResponse<UserProfile>> {
    return this.http.get<ApiResponse<UserProfile>>(`${this.userEndpoint}/eu`)
      .pipe(
        catchError(error => {
          console.error('Error fetching user profile:', error);
          return throwError(() => new Error('Failed to fetch user profile'));
        })
      );
  }

  /**
   * Update a user's profile by user ID
   * PUT /api/Usuario/{codigo}
   */
  updateProfile(userId: number, data: UpdateProfileRequest): Observable<ApiResponse<UserProfile>> {
    return this.http.put<ApiResponse<UserProfile>>(`${this.userEndpoint}/${userId}`, data)
      .pipe(
        catchError(error => {
          console.error('Error updating user profile:', error);
          return throwError(() => new Error('Failed to update user profile'));
        })
      );
  }

  /**
   * Fetch all available tags
   */
  getTags(): Observable<ApiResponse<TagDto[]>> {
    return this.http.get<ApiResponse<TagDto[]>>(this.tagEndpoint)
      .pipe(
        catchError(error => {
          console.error('Error fetching tags:', error);
          return throwError(() => new Error('Failed to fetch tags'));
        })
      );
  }

  /**
   * Fetch a specific user by ID
   */
  getUserById(userId: number): Observable<ConnectedUserDto> {
    return this.http.get<ConnectedUserDto>(`${this.userEndpoint}/${userId}`)
      .pipe(
        catchError(error => {
          console.error(`Error fetching user ${userId}:`, error);
          return throwError(() => new Error(`Failed to fetch user ${userId}`));
        })
      );
  }





  /**
   * Fetch users managed by the current agent
   */
  getMeusUsuarios(): Observable<ApiResponse<ConnectedUserDto[]>> {
    return this.http.get<ApiResponse<ConnectedUserDto[]>>(`${this.userEndpoint}/meus-usuarios`)
      .pipe(
        catchError(error => {
          console.error('Error fetching managed users:', error);
          return throwError(() => new Error('Failed to fetch managed users'));
        })
      );
  }

  /**
   * Fetch agents responsible for the current user (Comum users only)
   */
  getMeusAgentes(): Observable<ApiResponse<ConnectedUserDto[]>> {
    return this.http.get<ApiResponse<ConnectedUserDto[]>>(`${this.userEndpoint}/meus-agentes`)
      .pipe(
        catchError(error => {
          console.error('Error fetching responsible agents:', error);
          return throwError(() => new Error('Failed to fetch responsible agents'));
        })
      );
  }

  /**
   * Fetch users who are responsible for the current user
   */
  getMeusResponsaveis(): Observable<ApiResponse<ConnectedUserDto[]>> {
    return this.http.get<ApiResponse<ConnectedUserDto[]>>(`${this.userEndpoint}/meus-responsaveis`)
      .pipe(
        catchError(error => {
          console.error('Error fetching responsible users:', error);
          return throwError(() => new Error('Failed to fetch responsible users'));
        })
      );
  }

  /**
   * Generate a connection code for this user
   */
  gerarCodigo(): Observable<any> {
    return this.http.post<any>(`${this.userEndpoint}/gerar-codigo`, null)
      .pipe(
        catchError(error => {
          console.error('Error generating connection code:', error);
          return throwError(() => new Error('Failed to generate connection code'));
        })
      );
  }

  /**
   * Connect to another user using a generated code
   */
  addMeuUsuario(codigoGerado: string): Observable<ApiResponse<ConnectedUserDto>> {
    return this.http.post<ApiResponse<ConnectedUserDto>>(`${this.userEndpoint}/conectar/${codigoGerado}`, null)
      .pipe(
        catchError(error => {
          console.error('Error connecting to user:', error);
          return throwError(() => new Error('Failed to connect to user'));
        })
      );
  }

  /**
   * Disconnect from a managed user
   */
  desconectarUsuario(cdAgente: number, cdUsuario: number): Observable<ApiResponse<null>> {
    return this.http.delete<ApiResponse<null>>(`${this.userEndpoint}/desconectar?cdAgente=${cdAgente}&cdUsuario=${cdUsuario}`)
      .pipe(
        catchError(error => {
          console.error('Error disconnecting user:', error);
          return throwError(() => new Error('Failed to disconnect user'));
        })
      );
  }
}
