import { Routes } from '@angular/router';
import { AuthGuard } from './guards/auth.guard';
import { GuestGuard } from './guards/guest.guard';

export const routes: Routes = [
  {
    path: 'home',
    loadComponent: () => import('./home/home.page').then((m) => m.HomePage),
    canActivate: [GuestGuard]
  },
  {
    path: '',
    redirectTo: 'home',
    pathMatch: 'full',
  },
  {
    path: 'index-list',
    loadComponent: () => import('./pages/main/index-list/index-list.page').then( m => m.IndexListPage),
    canActivate: [AuthGuard]
  },
  {
    path: 'cadastrar',
    loadComponent: () => import('./pages/log/cadastrar/cadastrar.page').then( m => m.CadastrarPage),
    canActivate: [GuestGuard]
  },
];
