import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { UserService, UpdateProfileRequest } from 'src/app/services/user.service';

import { NgIf } from '@angular/common';

import { timer } from 'rxjs';

@Component({
  selector: 'app-tab-conta',
  templateUrl: './tab-conta.component.html',
  styleUrls: ['./tab-conta.component.scss'],
  imports: [FormsModule, NgIf]
})
export class TabContaComponent implements OnInit {
  userData: any;
  userID: any;
  nome: string = '';
  email: string = '';
  tel: string = '';

  // Edit mode state
  isEditing: boolean = false;
  editNome: string = '';
  editEmail: string = '';
  editTel: string = '';
  isSaving: boolean = false;
  errorMessage: string = '';
  successMessage: string = '';

  Responsaveis: any[] = [];

  constructor(private userService: UserService) {}

  ngOnInit() {
    this.getUserID();
  }

  getUserID() {
    this.userService.getUserID().subscribe({
      next: res => {
        if (res.success) {
          this.userData = res.data;

          this.userID = this.userData.cd;
          this.nome = this.userData.nome || this.userData.nmUsuario || '';
          this.email = this.userData.email || '';

          const telefoneBruto = this.userData.telefone || '';
          this.tel = this.formatPhoneNumber(telefoneBruto);
        }
      },
      error: err => {
        console.error('Erro ao buscar usuário:', err);
      }
    });
  }

  /**
   * Enable edit mode and populate edit fields
   */
  enableEditMode(): void {
    this.isEditing = true;
    this.editNome = this.nome;
    this.editEmail = this.email;
    // Store raw phone for editing (strip formatting)
    this.editTel = this.userData?.telefone || '';
    this.errorMessage = '';
    this.successMessage = '';
  }

  /**
   * Cancel edit mode and reset fields
   */
  cancelEdit(): void {
    this.isEditing = false;
    this.editNome = '';
    this.editEmail = '';
    this.editTel = '';
    this.errorMessage = '';
  }

  /**
   * Save profile changes
   */
  saveProfile(): void {
    this.errorMessage = '';
    this.successMessage = '';

    // Validate fields
    if (!this.editNome.trim()) {
      this.errorMessage = 'Nome é obrigatório';
      return;
    }
    if (!this.editEmail.trim()) {
      this.errorMessage = 'Email é obrigatório';
      return;
    }

    const updateData: UpdateProfileRequest = {};

    // Only include changed fields
    if (this.editNome.trim() !== this.nome) {
      updateData.nome = this.editNome.trim();
    }
    if (this.editEmail.trim() !== this.email) {
      updateData.email = this.editEmail.trim();
    }
    if (this.editTel && this.editTel !== this.userData?.telefone) {
      updateData.telefone = this.editTel;
    }

    // Check if anything changed
    if (Object.keys(updateData).length === 0) {
      this.isEditing = false;
      return;
    }

    this.isSaving = true;

    this.userService.updateProfile(this.userID, updateData).subscribe({
      next: res => {
        this.isSaving = false;
        if (res.success) {
          // Update local data
          this.nome = this.editNome.trim();
          this.email = this.editEmail.trim();
          if (this.editTel) {
            this.tel = this.formatPhoneNumber(this.editTel);
            this.userData.telefone = this.editTel;
          }
          this.isEditing = false;
          this.successMessage = 'Perfil atualizado com sucesso!';
          
          // Clear success message after 3 seconds
          timer(3000).subscribe(() => {
            this.successMessage = '';
          });
        } else {
          this.errorMessage = res.message || 'Erro ao atualizar perfil';
        }
      },
      error: err => {
        this.isSaving = false;
        this.errorMessage = err.error?.message || 'Erro ao atualizar perfil. Tente novamente.';
        console.error('Erro ao atualizar perfil:', err);
      }
    });
  }

  formatPhoneNumber(phone: string): string {
    if (!phone) return '';

    const digits = phone.replace(/\D/g, '');

    const ddd = digits.slice(-11, -9); 
    const main = digits.slice(-9);

    if (digits.length >= 11) {
      return `+55 (${digits.slice(-11, -9)}) ${digits.slice(-9, -4)}-${digits.slice(-4)}`;
    } else if (digits.length === 10) {
      return `+55 (${digits.slice(-10, -8)}) ${digits.slice(-8, -4)}-${digits.slice(-4)}`;
    } else {
      return phone;
    }
  }


  getMyGuardian(){
    this.userService.getMeusUsuarios().subscribe({
      next: res => {
        if (res.success) {
          this.Responsaveis = res.data;
          console.log('Todas os meus Responsaveis: ', this.Responsaveis);
        }
      }
    })
  }

}
