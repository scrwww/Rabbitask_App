import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { TarefasComponent } from '../components/shared/tarefas/tarefas.component';
import { ConfigComponent } from '../components/modals/config/config.component';

import { SharedTabsModule } from './shared-tabs/shared-tabs-module';


@NgModule({
  declarations: [],
  imports: [
    CommonModule,
    TarefasComponent, ConfigComponent,
    SharedTabsModule
  ],
  exports: [
    TarefasComponent, ConfigComponent,
    SharedTabsModule
  ]
})
export class SharedModule { }
