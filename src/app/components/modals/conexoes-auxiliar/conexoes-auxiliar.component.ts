import { Component, OnInit, Output, EventEmitter, OnDestroy } from '@angular/core';
import { AuthService } from 'src/app/services/auth.service';
import { UserService, ConnectedUserDto } from 'src/app/services/user.service';
import { OverseeService } from 'src/app/services/oversee.service';
import { ModalStateService } from 'src/app/services/modal-state.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule, AlertController } from '@ionic/angular';
import { Router } from '@angular/router';
import { STORAGE_KEYS } from 'src/app/shared/constants/storage.constants';

// Enums for code generation state
enum GeneratedCodeState {
  HIDDEN = 'hidden',
  VISIBLE = 'visible',
  EXPIRED = 'expired'
}

// Interface for generated code with metadata
interface GeneratedCodeData {
  codigo: string;
  expiraEm: string;
  savedAt: number;
}

// Interface for message display
interface DisplayMessage {
  text: string;
  type: 'success' | 'error' | 'info';
}

@Component({
  selector: 'app-conexoes-auxiliar',
  templateUrl: './conexoes-auxiliar.component.html',
  styleUrls: ['./conexoes-auxiliar.component.scss'],
  imports: [IonicModule, FormsModule, CommonModule]
})
export class ConexoesAuxiliarComponent implements OnInit, OnDestroy {
  @Output() userSelected = new EventEmitter<{ cd: number; nome: string }>();

  // User type flags
  isAgente: boolean = false;
  isComum: boolean = false;

  // For Agente users - users they manage
  usuariosGerenciados: ConnectedUserDto[] = [];

  // For Comum users - agents responsible for them
  meusAgentes: ConnectedUserDto[] = [];

  // UI state for connection
  showConnectInput: boolean = false;
  codigoConexao: string = '';
  carregando: boolean = false;
  mensagem: DisplayMessage | null = null;

  // Generated code display
  codigoGerado: string = '';
  codeState: GeneratedCodeState = GeneratedCodeState.HIDDEN;
  tempoFormatado: string = ''; // Display format (MM:SS)
  private countdownInterval: any = null;
  private expirationTime: Date | null = null;

  currentUserId: number = 0;

  private readonly MESSAGE_DISPLAY_DURATION = 3000; // ms
  private readonly CODE_STORAGE_KEY = STORAGE_KEYS.GENERATED_CODE;

  constructor(
    private authService: AuthService,
    private userService: UserService,
    private overseeService: OverseeService,
    private modalStateService: ModalStateService,
    private router: Router,
    private alertController: AlertController
  ) {}

  ngOnInit(): void {
    this.loadUserTypeAndData();
    this.restoreGeneratedCode();
  }

  ngOnDestroy(): void {
    this.clearCountdownInterval();
  }

  /**
   * Load user type and fetch appropriate data based on user role
   * Consolidates the redundant type checking logic
   */
  private loadUserTypeAndData(): void {
    this.authService.getUserType().subscribe({
      next: (typeId) => {
        this.isAgente = typeId === 2;
        this.isComum = typeId === 1;

        if (this.isAgente) {
          this.loadManagedUsers();
        } else if (this.isComum) {
          this.loadMyAgents();
        }
      },
      error: (err) => {
        console.error('Error determining user type:', err);
        this.showMessage('Erro ao carregar tipo de usuário', 'error');
      }
    });

    // Get current user ID for disconnect operations
    this.userService.getUserID().subscribe({
      next: res => {
        if (res.success && res.data) {
          this.currentUserId = res.data.cd;
        }
      },
      error: (err) => console.error('Error fetching user ID:', err)
    });
  }

  /**
   * Extract username from user object, supporting multiple property names
   */
  private getUserName(usuario: any): string {
    return usuario?.nmUsuario || usuario?.nome || usuario?.name || 'usuário';
  }

  // =====================================================
  // AGENTE USER METHODS
  // =====================================================

  /**
   * Load users managed by this agent (Agente only)
   * Displays list under "Meus Usuários Conectados"
   */
  loadManagedUsers(): void {
    this.loadUsersList(
      this.userService.getMeusUsuarios(),
      (data) => { this.usuariosGerenciados = data; },
      'Erro ao carregar usuários gerenciados'
    );
  }

  /**
   * Load agents responsible for this user (Comum users only)
   * Displays list under "Meus Agentes"
   */
  loadMyAgents(): void {
    this.loadUsersList(
      this.userService.getMeusAgentes(),
      (data) => { this.meusAgentes = data; },
      'Erro ao carregar seus agentes'
    );
  }

  /**
   * Generic method to load user lists with consistent error handling
   */
  private loadUsersList(
    source: any,
    onSuccess: (data: ConnectedUserDto[]) => void,
    errorMsg: string
  ): void {
    this.carregando = true;
    source.subscribe({
      next: (res: any) => {
        if (res.success) {
          onSuccess(res.data);
        }
        this.carregando = false;
      },
      error: (err: any) => {
        console.error('Error loading users list:', err);
        this.showMessage(errorMsg, 'error');
        this.carregando = false;
      }
    });
  }

  /**
   * Agente selects a managed user to view/manage their tasks
   * Updates OverseeService to show selected user's tasks
   */
  selectUserToOversee(usuario: ConnectedUserDto): void {
    const userName = this.getUserName(usuario);
    this.overseeService.setOverseeing(usuario.cd, userName);
    this.userSelected.emit({ cd: usuario.cd, nome: userName });
    this.showMessage(`Visualizando tarefas de ${userName}`, 'success');
    // Close the modal after selection
    this.modalStateService.closeAllModals();
  }

  /**
   * Show form to connect to new user via code (Agente only)
   * Used for "Conectar Usuário" section
   */
  showConnectForm(): void {
    this.showConnectInput = true;
    this.codigoConexao = '';
  }

  /**
   * Cancel connection attempt
   */
  cancelConnect(): void {
    this.showConnectInput = false;
    this.codigoConexao = '';
    this.mensagem = null;
  }

  /**
   * Agent connects to a new user using their connection code
   * Calls /api/Usuario/conectar/{codigo}
   */
  connectWithCode(): void {
    if (!this.codigoConexao.trim()) {
      this.showMessage('Digite um código válido', 'error');
      return;
    }

    this.carregando = true;
    this.userService.addMeuUsuario(this.codigoConexao).subscribe({
      next: res => {
        console.log('Connect response:', res);
        
        // Handle both wrapped and direct response structures
        const userData = (res as any)?.data || res;
        const userName = this.getUserName(userData);
        
        this.showMessage(`Conectado a ${userName}!`, 'success');
        this.cancelConnect();
        
        // Reload the managed users list to show the newly connected user
        setTimeout(() => {
          this.loadManagedUsers();
        }, 500);
        
        this.carregando = false;
      },
      error: err => {
        console.error('Connection error:', err);
        this.showMessage('Código inválido ou expirado', 'error');
        this.carregando = false;
      }
    });
  }

  /**
   * Disconnect from a managed user (Agente only)
   */
  async disconnectUser(usuario: ConnectedUserDto): Promise<void> {
    const userName = this.getUserName(usuario);
    
    const alert = await this.alertController.create({
      header: 'Desconectar Usuário',
      message: `Tem certeza que deseja desconectar de ${userName}?`,
      buttons: [
        {
          text: 'Cancelar',
          role: 'cancel'
        },
        {
          text: 'Desconectar',
          role: 'destructive',
          handler: () => {
            this.userService.desconectarUsuario(this.currentUserId, usuario.cd).subscribe({
              next: res => {
                if (res.success) {
                  this.showMessage('Desconectado com sucesso', 'success');
                  this.loadManagedUsers();
                }
              },
              error: err => {
                this.showMessage('Erro ao desconectar', 'error');
              }
            });
          }
        }
      ]
    });

    await alert.present();
  }

  // =====================================================
  // COMUM USER METHODS
  // =====================================================

  /**
   * Comum user generates a connection code for agents to use
   * Calls /api/Usuario/gerar-codigo
   */
  generateConnectionCode(): void {
    this.carregando = true;
    this.userService.gerarCodigo().subscribe({
      next: res => {
        console.log('Code generation response:', res);
        
        if (res.codigo) {
          this.codigoGerado = res.codigo;
          this.expirationTime = new Date(res.expiraEm);
          this.codeState = GeneratedCodeState.VISIBLE;
          this.saveGeneratedCode(res.codigo, res.expiraEm);
          this.startCountdown(res.expiraEm);
          this.showMessage('Código gerado com sucesso!', 'success');
        } else {
          console.error('Code not found in response:', res);
          this.showMessage('Erro: Código não encontrado na resposta', 'error');
        }
        this.carregando = false;
      },
      error: err => {
        console.error('Error generating code:', err);
        this.showMessage('Erro ao gerar código', 'error');
        this.carregando = false;
      }
    });
  }

  /**
   * Copy generated code to clipboard
   */
  copyCode(): void {
    navigator.clipboard.writeText(this.codigoGerado).then(() => {
      this.showMessage('Código copiado para a área de transferência!', 'success');
    });
  }

  /**
   * Hide generated code display
   */
  hideGeneratedCode(): void {
    this.codeState = GeneratedCodeState.HIDDEN;
    this.codigoGerado = '';
    this.tempoFormatado = '';
    this.clearCountdownInterval();
    localStorage.removeItem(this.CODE_STORAGE_KEY);
  }

  /**
   * Save generated code to local storage
   */
  private saveGeneratedCode(codigo: string, expiraEm: string): void {
    const codeData: GeneratedCodeData = {
      codigo,
      expiraEm,
      savedAt: new Date().getTime()
    };
    localStorage.setItem(this.CODE_STORAGE_KEY, JSON.stringify(codeData));
  }

  /**
   * Restore generated code from local storage if it hasn't expired
   */
  private restoreGeneratedCode(): void {
    const saved = localStorage.getItem(this.CODE_STORAGE_KEY);
    if (!saved) return;

    try {
      const codeData = JSON.parse(saved) as GeneratedCodeData;
      const expirationDate = new Date(codeData.expiraEm).getTime();
      const now = new Date().getTime();
      
      if (expirationDate > now) {
        this.codigoGerado = codeData.codigo;
        this.expirationTime = new Date(codeData.expiraEm);
        this.codeState = GeneratedCodeState.VISIBLE;
        this.startCountdown(codeData.expiraEm);
      } else {
        localStorage.removeItem(this.CODE_STORAGE_KEY);
      }
    } catch (e) {
      console.error('Error restoring generated code:', e);
      localStorage.removeItem(this.CODE_STORAGE_KEY);
    }
  }

  /**
   * Start countdown timer for code expiration
   */
  private startCountdown(expirationTime: string): void {
    this.clearCountdownInterval();
    
    const updateTimer = () => {
      if (!this.expirationTime) return;

      const now = new Date().getTime();
      const expirationDate = this.expirationTime.getTime();
      const remainingMs = expirationDate - now;

      if (remainingMs <= 0) {
        this.tempoFormatado = 'Expirado';
        this.codeState = GeneratedCodeState.EXPIRED;
        this.clearCountdownInterval();
        this.showMessage('Código expirado', 'error');
        return;
      }

      // Format as MM:SS
      const totalSeconds = Math.floor(remainingMs / 1000);
      const minutes = Math.floor(totalSeconds / 60);
      const seconds = totalSeconds % 60;
      this.tempoFormatado = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    };

    updateTimer();
    this.countdownInterval = setInterval(updateTimer, 1000);
  }

  /**
   * Clear the countdown interval
   */
  private clearCountdownInterval(): void {
    if (this.countdownInterval) {
      clearInterval(this.countdownInterval);
      this.countdownInterval = null;
    }
  }

  // =====================================================
  // UTILITY METHODS
  // =====================================================

  /**
   * Show temporary message to user
   */
  private showMessage(text: string, type: 'success' | 'error' | 'info'): void {
    this.mensagem = { text, type };
    setTimeout(() => {
      this.mensagem = null;
    }, this.MESSAGE_DISPLAY_DURATION);
  }
}
