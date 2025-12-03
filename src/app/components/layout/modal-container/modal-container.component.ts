import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { ModalStateService } from 'src/app/services/modal-state.service';
import { TarefaDetalheComponent } from '../../modals/tarefa-detalhe/tarefa-detalhe.component';
import { TabVisualComponent } from '../../modals/tab-visual/tab-visual.component';
import { NovaTarefaComponent } from '../../modals/nova-tarefa/nova-tarefa.component';
import { TabContaComponent } from '../../modals/tab-conta/tab-conta.component';
import { ConfigComponent } from '../../modals/config/config.component';
import { ConexoesAuxiliarComponent } from '../../modals/conexoes-auxiliar/conexoes-auxiliar.component';
import { EditTarefaComponent } from '../../modals/edit-tarefa/edit-tarefa.component';

@Component({
  selector: 'app-modal-container',
  templateUrl: './modal-container.component.html',
  styleUrls: ['./modal-container.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    TarefaDetalheComponent,
    TabVisualComponent,
    NovaTarefaComponent,
    TabContaComponent,
    ConfigComponent,
    ConexoesAuxiliarComponent,
    EditTarefaComponent
  ]
})
export class ModalContainerComponent {
  constructor(public modalStateService: ModalStateService) {}
}
