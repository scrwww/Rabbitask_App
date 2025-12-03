/**
 * Task Data Transfer Objects (DTOs)
 * Defines all request and response types for task operations
 */

/**
 * Represents a task entity as returned from the API
 */
export interface TarefaDto {
  cd: number;
  nome: string;
  descricao: string;
  dataPrazo: string | null;
  dataConclusao: string | null;
  dataCriacao: string;
  prioridade: { cd: number; nome: string } | null;
  usuario: { cd: number; nome: string };
  usuarioProprietario?: { cd: number; nome: string } | null;
  tags: { cd: number; nome: string }[];
}

/**
 * Request DTO for creating a new task
 */
export interface CreateTarefaRequest {
  nome: string;
  cdUsuario: number;
  descricao: string;
  cdPrioridade: number;
  dataPrazo: string;
  tagNomes: string[];
}

/**
 * Request DTO for updating an existing task
 */
export interface UpdateTarefaRequest {
  nome: string;
  descricao: string;
  cdPrioridade: number;
  dataPrazo: string;
  tagNomes: string[];
}

/**
 * Query parameters for fetching tasks
 */
export interface GetTarefasParams {
  cdUsuario?: number;
  incluirConectados?: boolean;
  cdPrioridade?: number;
  pagina?: number;
  paginaTamanho?: number;
  ordenacao?: string;
  direcao?: 'ASC' | 'DESC';
}

/**
 * Generic API response wrapper for all API endpoints
 */
export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

/**
 * API response for list endpoints
 */
export interface ApiListResponse<T> extends ApiResponse<T[]> {
  totalRecords?: number;
  totalPages?: number;
  currentPage?: number;
}

/**
 * Task categories for grouping by status
 * Produced automatically by TaskStateService
 */
export interface TaskCategories {
  all: TarefaDto[];
  delayed: TarefaDto[];
  pending: TarefaDto[];
  completed: TarefaDto[];
}
