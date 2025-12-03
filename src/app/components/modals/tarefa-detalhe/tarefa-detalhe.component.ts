import { Component, OnInit, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { RouterModule } from '@angular/router';
import { ModalStateService } from 'src/app/services/modal-state.service';
import { TarefaDto } from 'src/app/services/tasks.service';
import { TaskStateService } from 'src/app/services/task-state.service';

@Component({
  selector: 'app-tarefa-detalhe',
  templateUrl: './tarefa-detalhe.component.html',
  styleUrls: ['./tarefa-detalhe.component.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule, IonicModule, RouterModule]
})
export class TarefaDetalheComponent implements OnInit {
  tarefa: TarefaDto | null = null;
  @Output() editClick = new EventEmitter<number>();

  prioridadeNome: string = '';
  showDeleteConfirm: boolean = false;
  isDeleting: boolean = false;
  deleteError: string = '';
  prioridadeColors: { [key: number]: string } = {
    1: '#FF4444', // Super Alta - Vermelho
    2: '#FF8800', // Alta - Laranja
    3: '#FFBB00', // Média Alta - Amarelo
    4: '#FFDD00', // Média - Amarelo Claro
    5: '#88DD00', // Média Baixa - Verde Claro
    6: '#00DD00', // Baixa - Verde
    7: '#0099FF'  // Super Baixa - Azul
  };

  constructor(
    private modalStateService: ModalStateService,
    private taskStateService: TaskStateService
  ) { }

  ngOnInit(): void {
    // Get task data from modal state service
    this.tarefa = this.modalStateService.getModalData() as TarefaDto;
    
    if (this.tarefa && this.tarefa.prioridade) {
      this.prioridadeNome = this.tarefa.prioridade.nome;
    }
  }

  /**
   * Show delete confirmation dialog
   */
  onDeleteClick(): void {
    this.showDeleteConfirm = true;
    this.deleteError = '';
  }

  /**
   * Cancel delete and hide confirmation
   */
  cancelDelete(): void {
    this.showDeleteConfirm = false;
    this.deleteError = '';
  }

  /**
   * Confirm and execute task deletion
   */
  confirmDelete(): void {
    if (!this.tarefa) return;

    this.isDeleting = true;
    this.deleteError = '';

    this.taskStateService.deleteTask(this.tarefa.cd, this.tarefa.usuario.cd).subscribe({
      next: () => {
        this.isDeleting = false;
        this.showDeleteConfirm = false;
        // Close the modal after successful deletion
        this.modalStateService.closeAllModals();
      },
      error: (err) => {
        this.isDeleting = false;
        this.deleteError = 'Erro ao excluir tarefa. Tente novamente.';
        console.error('Error deleting task:', err);
      }
    });
  }

  getPrioridadeColor(): string {
    if (this.tarefa && this.tarefa.prioridade) {
      return this.prioridadeColors[this.tarefa.prioridade.cd] || '#999';
    }
    return '#999';
  }

  onEditClick(): void {
    if (this.tarefa) {
      this.editClick.emit(this.tarefa.cd);
      // Also open the edit modal through the service
      this.modalStateService.openModal('EditTarefa', this.tarefa);
    }
  }

  formatDate(dateString: string | null): string {
    if (!dateString) return 'Sem prazo';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('pt-BR', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return dateString;
    }
  }

  getStatusText(): string {
    if (!this.tarefa) return 'Sem dados';
    
    if (this.tarefa.dataConclusao) {
      return 'Concluída em ' + this.formatDate(this.tarefa.dataConclusao);
    }
    
    if (!this.tarefa.dataPrazo) return 'Pendente';
    
    const prazo = new Date(this.tarefa.dataPrazo);
    const agora = new Date();
    
    if (prazo < agora) {
      return 'Atrasada';
    }
    
    return 'Pendente';
  }

  getStatusColor(): string {
    if (!this.tarefa) return 'pending';
    
    if (this.tarefa.dataConclusao) {
      return 'completed';
    }
    
    if (!this.tarefa.dataPrazo) return 'pending';
    
    const prazo = new Date(this.tarefa.dataPrazo);
    const agora = new Date();
    
    if (prazo < agora) {
      return 'delayed';
    }
    
    return 'pending';
  }
}

