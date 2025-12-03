import { Component, OnInit } from '@angular/core';
import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { BehaviorSubject, Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { FormsModule } from '@angular/forms';
import { NgModel } from '@angular/forms';

import { CommonModule } from '@angular/common';

import { RouterModule } from '@angular/router';
import { DatePipe, NgIf, NgFor } from '@angular/common';
import { IonicModule } from '@ionic/angular';

import { Input } from '@angular/core';
import { TasksService } from 'src/app/services/tasks.service';
import { UserService } from 'src/app/services/user.service';
import { OverseeService } from 'src/app/services/oversee.service';
import { UserManagementService } from 'src/app/services/user-management.service';
import { ModalStateService } from 'src/app/services/modal-state.service';

import { AppComponent } from 'src/app/app.component';

@Component({
  selector: 'app-edit-tarefa',
  templateUrl: './edit-tarefa.component.html',
  styleUrls: ['./edit-tarefa.component.scss'],
  imports: [FormsModule, RouterModule, CommonModule, IonicModule]
})
export class EditTarefaComponent  implements OnInit {
  editTarefa: any = {};

  editDateTime: string = "";
  maxDate: string = "";

  editNome: string = this.editTarefa.nome;
  // newCdUsuario: any = "-1";
  editDescricao: string = this.editTarefa.descricao;
  editCdPrioridade: number = this.editTarefa.cdPrioridade;
  agora = new Date();
  editDataPrazo = this.editTarefa.dataPrazo;
  editTagNomes: string = "";
  editTagNomes2: string[] = this.editTarefa.tags;


  getCodigo: any = this.editTarefa.cd;


  userData: any;


  editTarefaDataPrazo: any;

  

  
  constructor(
    private tasksService: TasksService,
    private user: UserService,
    private appComp: AppComponent,
    private oversee: OverseeService,
    private userManagementService: UserManagementService,
    private modalStateService: ModalStateService
  ) { }

  ngOnInit() {
    // Get task data from modal state service
    this.editTarefa = this.modalStateService.getModalData();

    if (!this.editTarefa) {
      console.error('No task data provided to edit modal');
      return;
    }

    this.editTarefaDataPrazo = new Date(this.editTarefa.dataPrazo);

    console.log(this.editTarefa);
    this.editDateTime = this.editTarefaDataPrazo.toISOString();
  
    this.editNome = this.editTarefa.nome;
    // newCdUsuario: any = "-1";
    this.editDescricao = this.editTarefa.descricao;
    this.editCdPrioridade = this.editTarefa.prioridade.cd;
    this.agora = new Date();
    this.editDataPrazo = this.editTarefa.dataPrazo;

    this.editTarefa.tags.forEach((tag: any) => {
      this.editTagNomes += tag.nome + ', ';
    });
    this.editTagNomes2 = this.editTarefa.tags;

    this.getCodigo = this.editTarefa.cd;
    console.log("Bwah tem id: " + this.getCodigo)

    // Set max date to 10 years from now
    const maxDateObj = new Date();
    maxDateObj.setFullYear(maxDateObj.getFullYear() + 10);
    this.maxDate = maxDateObj.toISOString();
  }

  editarTarefa(){
    let DeuCerto: Boolean = false;

    console.log("Agora é: " + this.agora)
    console.log("editDateTime: " + this.editDateTime);

    // Convert ISO datetime string to Date object
    const dateObject = new Date(this.editDateTime);
    console.log("new dateObject: " + dateObject)
    
    // if (this.editTagNomes != '')
    if (this.editTagNomes.includes(',')) this.editTagNomes2 = this.editTagNomes.trim().split(',').map(item => item.trim());
    else this.editTagNomes2 = [this.editTagNomes.trim()];

    const overseeing = this.oversee.current;
    
    // Get userID from observable to ensure it's loaded
    if (overseeing) {
      this.proceedWithTaskEdit(overseeing, dateObject);
    } else {
      // Get current user ID from the service's observable
      this.userManagementService.userContext$.subscribe({
        next: (userContext) => {
          const userIdToUse = userContext.userID;
          if (userIdToUse) {
            this.proceedWithTaskEdit(userIdToUse, dateObject);
          } else {
            console.error('User ID not available');
          }
        },
        error: (err) => {
          console.error('Error getting user context:', err);
        }
      });
    }
  }

  /**
   * Proceed with task edit after userID is available
   */
  private proceedWithTaskEdit(userIdToUse: number, dateObject: Date): void {
    const novaTarefa:any = {
      nome: this.editNome,
      descricao: this.editDescricao,
      cdPrioridade: this.editCdPrioridade,
      dataPrazo: dateObject.toISOString(),
      tagNomes : this.editTagNomes2,
    };

    this.tasksService.editarTarefa(this.getCodigo, userIdToUse, novaTarefa).subscribe({
      next: (res) => {
        console.log('Tarefa editada com sucesso!', res);
        this.appComp.reloadPage();
      },
      error: (err) => {
        console.error('Erro ao editar tarefa', err);
      }
    });
  }

  onDescriptionInput(event: Event) {
    const textarea = event.target as HTMLTextAreaElement;
    textarea.style.height = 'auto';
    textarea.style.height = textarea.scrollHeight + 'px';
  }

  onDateTimeChange(event: any) {
    console.log("DateTime changed:", this.editDateTime);
  }

}
