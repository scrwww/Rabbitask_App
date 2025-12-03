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
import { IonicModule, AlertController } from '@ionic/angular';

import { Input } from '@angular/core';
import { TasksService } from 'src/app/services/tasks.service';
import { UserService } from 'src/app/services/user.service';
import { OverseeService } from 'src/app/services/oversee.service';
import { UserManagementService } from 'src/app/services/user-management.service';

import { AppComponent } from 'src/app/app.component';

@Component({
  selector: 'app-nova-tarefa',
  templateUrl: './nova-tarefa.component.html',
  styleUrls: ['./nova-tarefa.component.scss'],
  imports: [FormsModule, RouterModule, CommonModule, IonicModule]
})
export class NovaTarefaComponent  implements OnInit {
  constructor(
    private tasksService: TasksService,
    private user: UserService,
    private appComp: AppComponent,
    private oversee: OverseeService,
    private userManagementService: UserManagementService,
    private alertController: AlertController
  ) { }

  userOversee: any;

  newDateTime: string = "";
  maxDate: string = "";

  newNome: string = "";
  // newCdUsuario: any = "-1";
  newDescricao: string = "";
  newCdPrioridade: number = 1;
  agora = new Date();
  newDataPrazo = this.agora.toISOString();
  newTagNomes: string = "";
  newTagNomes2: string[] = [""];


  userData: any;

  

  ngOnInit() {
    // Set default datetime to tomorrow at midnight
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);
    this.newDateTime = tomorrow.toISOString();

    // Set max date to 10 years from now
    const maxDateObj = new Date();
    maxDateObj.setFullYear(maxDateObj.getFullYear() + 10);
    this.maxDate = maxDateObj.toISOString();
  }

  mostrarTag(){
    console.log(this.newTagNomes)
  }

  /**
   * Validate task inputs
   * Returns error message if validation fails, null if valid
   */
  private validateInputs(): string | null {
    // Check if name is empty
    if (!this.newNome || this.newNome.trim() === '') {
      return 'O nome da tarefa é obrigatório.';
    }

    // Check if name is too short
    if (this.newNome.trim().length < 3) {
      return 'O nome da tarefa deve ter pelo menos 3 caracteres.';
    }

    // Check if date is set
    if (!this.newDateTime) {
      return 'A data e hora de vencimento são obrigatórias.';
    }

    // Check if date is valid
    const selectedDate = new Date(this.newDateTime);
    if (isNaN(selectedDate.getTime())) {
      return 'A data de vencimento é inválida.';
    }

    // Check if date is in the future (allow same day)
    // Compare just the date part, ignoring time
    const today = new Date();
    const selectedDateOnly = new Date(this.newDateTime);
    
    // Get the date components in local timezone
    const todayYear = today.getFullYear();
    const todayMonth = today.getMonth();
    const todayDay = today.getDate();
    
    const selectedYear = selectedDateOnly.getFullYear();
    const selectedMonth = selectedDateOnly.getMonth();
    const selectedDay = selectedDateOnly.getDate();
    
    // Create comparable dates with only date components
    const todayComparable = new Date(todayYear, todayMonth, todayDay);
    const selectedComparable = new Date(selectedYear, selectedMonth, selectedDay);

    if (selectedComparable < todayComparable) {
      return 'A data de vencimento não pode ser no passado.';
    }

    // All validations passed
    return null;
  }

  /**
   * Show validation error alert
   */
  private async showValidationError(message: string): Promise<void> {
    const alert = await this.alertController.create({
      header: 'Tarefa Inválida',
      message: message,
      buttons: ['OK']
    });
    await alert.present();
  }

  onDateTimeChange(event: any) {
    console.log("DateTime changed:", this.newDateTime);
  }

  addTarefa(){
    console.log("Agora é: " + this.agora)
    console.log("newDateTime: " + this.newDateTime);

    // Validate inputs first
    const validationError = this.validateInputs();
    if (validationError) {
      this.showValidationError(validationError);
      return;
    }

    // Get userID from observable to ensure it's loaded
    // Priority: oversee user ID > current user ID from service
    const overseeing = this.oversee.current;
    if (overseeing) {
      this.proceedWithTaskCreation(overseeing);
    } else {
      // Get current user ID from the service's observable
      this.userManagementService.userContext$.subscribe({
        next: (userContext) => {
          const userIdToUse = userContext.userID;
          if (userIdToUse) {
            this.proceedWithTaskCreation(userIdToUse);
          } else {
            this.showValidationError('Erro: ID do usuário não disponível.');
          }
        },
        error: (err) => {
          console.error('Error getting user context:', err);
          this.showValidationError('Erro: ID do usuário não disponível.');
        }
      });
    }
  }

  /**
   * Proceed with task creation after userID is available
   */
  private proceedWithTaskCreation(userIdToUse: number): void {
    // Ensure userID is a number
    const cdUsuario = typeof userIdToUse === 'number' ? userIdToUse : parseInt(userIdToUse, 10);
    if (isNaN(cdUsuario)) {
      this.showValidationError('Erro: ID do usuário inválido.');
      return;
    }

    // Ensure priority is a number
    const cdPrioridade = typeof this.newCdPrioridade === 'number' ? this.newCdPrioridade : parseInt(this.newCdPrioridade as any, 10);
    if (isNaN(cdPrioridade)) {
      this.showValidationError('Erro: Prioridade inválida.');
      return;
    }

    let DeuCerto: Boolean;
    DeuCerto = false;

    // Convert ISO datetime string to Date object
    const dateObject = new Date(this.newDateTime);
    console.log("new dateObject: " + dateObject)
  
    if (this.newTagNomes.includes(',')) this.newTagNomes2 = this.newTagNomes.trim().split(',').map(item => item.trim());
    else this.newTagNomes2 = [this.newTagNomes.trim()];

    // Filter out empty tag names
    this.newTagNomes2 = this.newTagNomes2.filter(tag => tag.trim() !== '');

    const novaTarefa:any = {
      nome: this.newNome,
      cdUsuario: cdUsuario,
      descricao: this.newDescricao || '',
      cdPrioridade: cdPrioridade,
      dataPrazo: dateObject.toISOString(),
      tagNomes : this.newTagNomes2,
    };

    console.log('Sending tarefa:', novaTarefa);

    this.tasksService.createTarefa(novaTarefa).subscribe({
      next: (res) => {
        console.log('Tarefa criada com sucesso!', res);
        DeuCerto = true;
        this.appComp.reloadPage();
      },
      error: (err) => {
        console.error('Erro ao criar tarefa', err);
        DeuCerto = false;
        this.showValidationError('Erro ao criar tarefa: ' + (err.error?.message || 'Verifique os dados.'));
      }
    });
  }

















  onDescriptionInput(event: Event) {
    const textarea = event.target as HTMLTextAreaElement;
    textarea.style.height = 'auto';
    textarea.style.height = textarea.scrollHeight + 'px';
  }
}
