import { Component, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonContent, IonInput, IonLabel, IonModal } from '@ionic/angular/standalone';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../../services/auth.service';

@Component({
  selector: 'app-cadastrar',
  templateUrl: './cadastrar.page.html',
  styleUrls: ['./cadastrar.page.scss'],
  standalone: true,
  imports: [IonContent, IonModal, CommonModule, FormsModule, RouterModule]
})
export class CadastrarPage implements OnInit {
  @ViewChild('typeModal') typeModal!: IonModal;

  nome: string = '';
  confirmEmail: string = '';
  email: string = '';
  telefone: string = '';
  confirmTelefone: string = '';
  senha: string = '';
  confirmSenha: string = '';
  isLoading = false;
  errorMessage = '';
  successMessage = '';
  cdTipoUsuario: number | null = null;
  currentStep: number = 0; // 0 = initial, 1 = name/email, 2 = phone, 3 = password

  constructor(
    private auth: AuthService,
    private router: Router
  ) {}

  ngOnInit() {
    // Reset modal state when page is initialized or revisited
    this.cdTipoUsuario = null;
    this.currentStep = 0;
  }

  get isModalOpen(): boolean {
    return this.cdTipoUsuario === null;
  }

  selectUserType(tipo: number, tipoNome: string) {
    this.cdTipoUsuario = tipo;
    this.currentStep = 1; // Move to first step after type selection
    console.log(`Usuário selecionou tipo: ${tipoNome} (${tipo})`);
    if (this.typeModal) {
      this.typeModal.dismiss();
    }
  }

  onModalDismiss() {
    // Modal dismissed - keep cdTipoUsuario set to show form
  }

  goToNextStep() {
    if (this.validateCurrentStep()) {
      this.currentStep++;
      this.errorMessage = '';
    }
  }

  goToPreviousStep() {
    if (this.currentStep > 1) {
      this.currentStep--;
      this.errorMessage = '';
    }
  }

  private validateCurrentStep(): boolean {
    this.errorMessage = '';

    if (this.currentStep === 1) {
      // Validate name and email
      if (!this.nome) {
        this.errorMessage = 'Por favor, insira seu nome completo';
        return false;
      }

      if (this.nome.length < 3) {
        this.errorMessage = 'O nome deve ter pelo menos 3 caracteres';
        return false;
      }

      if (!this.email) {
        this.errorMessage = 'Por favor, insira seu email';
        return false;
      }

      if (!this.isValidEmail(this.email)) {
        this.errorMessage = 'Por favor, insira um email válido';
        return false;
      }

      if (!this.confirmEmail) {
        this.errorMessage = 'Por favor, confirme seu email';
        return false;
      }

      if (this.email !== this.confirmEmail) {
        this.errorMessage = 'Os emails não correspondem';
        return false;
      }
    } else if (this.currentStep === 2) {
      // Validate phone
      if (!this.telefone) {
        this.errorMessage = 'Por favor, insira seu telefone';
        return false;
      }

      if (this.telefone.replace(/\D/g, '').length < 10) {
        this.errorMessage = 'Por favor, insira um telefone válido';
        return false;
      }

      if (!this.confirmTelefone) {
        this.errorMessage = 'Por favor, confirme seu telefone';
        return false;
      }

      if (this.telefone !== this.confirmTelefone) {
        this.errorMessage = 'Os telefones não correspondem';
        return false;
      }
    } else if (this.currentStep === 3) {
      // Validate password
      if (!this.senha) {
        this.errorMessage = 'Por favor, insira uma senha';
        return false;
      }

      if (this.senha.length < 8) {
        this.errorMessage = 'A senha deve ter pelo menos 8 caracteres';
        return false;
      }

      if (!this.confirmSenha) {
        this.errorMessage = 'Por favor, confirme sua senha';
        return false;
      }

      if (this.senha !== this.confirmSenha) {
        this.errorMessage = 'As senhas não correspondem';
        return false;
      }
    }

    return true;
  }

  cadastrar() {
    if (!this.validateCurrentStep()) {
      return;
    }

    this.isLoading = true;

    const registroData = {
      nmUsuario: this.nome.trim(),
      nmEmail: this.email.trim(),
      cdTelefone: this.telefone.replace(/\D/g, ''),
      nmSenha: this.senha,
      cdTipoUsuario: this.cdTipoUsuario as number
    };

    this.auth.register(registroData).subscribe({
      next: (response) => {
        this.isLoading = false;
        this.successMessage = 'Cadastro realizado com sucesso! Redirecionando...';

        // Redirect to login or home after 2 seconds
        setTimeout(() => {
          this.router.navigate(['/home']);
        }, 2000);
      },
      error: (err) => {
        this.isLoading = false;
        let errorMsg = 'Erro ao cadastrar. Tente novamente.';
        let switchToStep: number | null = null;

        if (err.error?.message) {
          errorMsg = err.error.message;
          
          // Determine which step to switch to based on error message
          if (errorMsg.toLowerCase().includes('email')) {
            switchToStep = 1; // Switch to email/name step
          } else if (errorMsg.toLowerCase().includes('telefone')) {
            switchToStep = 2; // Switch to phone step
          } else if (errorMsg.toLowerCase().includes('senha') || errorMsg.toLowerCase().includes('password')) {
            switchToStep = 3; // Switch to password step
          }
        } else if (err.error?.errors && Array.isArray(err.error.errors)) {
          errorMsg = err.error.errors.join(', ');
          
          // Check error array for field-specific errors
          const errorStr = errorMsg.toLowerCase();
          if (errorStr.includes('email')) {
            switchToStep = 1;
          } else if (errorStr.includes('telefone')) {
            switchToStep = 2;
          } else if (errorStr.includes('senha') || errorStr.includes('password')) {
            switchToStep = 3;
          }
        } else if (err.status === 409) {
          errorMsg = 'Email ou telefone já estão em uso';
          // For 409 Conflict, check which field is the issue
          // Default to email step, but could be improved with more specific error details
          switchToStep = 1;
        } else if (err.status === 400) {
          errorMsg = 'Dados inválidos. Verifique todos os campos';
        }

        this.errorMessage = errorMsg;
        
        // Switch to the appropriate step if identified
        if (switchToStep !== null && switchToStep !== this.currentStep) {
          this.currentStep = switchToStep;
        }
        
        console.error('Cadastro failed', err);
      }
    });
  }

  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }
}


