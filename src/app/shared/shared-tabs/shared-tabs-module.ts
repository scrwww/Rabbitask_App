import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { NovaTarefaComponent } from 'src/app/components/modals/nova-tarefa/nova-tarefa.component';
import { EditTarefaComponent } from 'src/app/components/modals/edit-tarefa/edit-tarefa.component'; 
import { TabContaComponent } from 'src/app/components/modals/tab-conta/tab-conta.component';
import { ConexoesAuxiliarComponent } from 'src/app/components/modals/conexoes-auxiliar/conexoes-auxiliar.component';

@NgModule({
  declarations: [],
  imports: [
    CommonModule,
    NovaTarefaComponent, EditTarefaComponent, TabContaComponent, ConexoesAuxiliarComponent
  ],
  exports: [
    NovaTarefaComponent, EditTarefaComponent, TabContaComponent, ConexoesAuxiliarComponent
  ]
})
export class SharedTabsModule { }
