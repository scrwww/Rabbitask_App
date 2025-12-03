import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { Router, RouterModule } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { AuthService } from '../services/auth.service';
import { TasksService } from '../services/tasks.service';
import { UserManagementService } from '../services/user-management.service';

@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss'],
  imports: [IonicModule, FormsModule, RouterModule, CommonModule],
})
export class HomePage implements OnInit {
  email = '';
  senha = '';
  isLoading = false;
  errorMessage = '';

  constructor(
    private http: HttpClient,
    private auth: AuthService,
    private tasksService: TasksService,
    private router: Router,
    private userManagementService: UserManagementService
  ) {}

  ngOnInit(): void {}

  login() {
    this.errorMessage = '';
    
    if (!this.email || !this.senha) {
      this.errorMessage = 'Por favor, preencha todos os campos';
      return;
    }

    this.isLoading = true;
    this.auth.login({ email: this.email, senha: this.senha }).subscribe({
      next: (res) => {
        const token = this.auth.getToken();
        console.log('HomePage.login: Login response received');
        console.log('HomePage.login: Token stored:', !!token);
        console.log('HomePage.login: Token value:', token);
        console.log('HomePage.login: localStorage contents:', localStorage.getItem('jwt_token'));
        
        // Re-initialize user context after login (important after logout/re-login)
        this.userManagementService.initializeUser();
        
        this.isLoading = false;
        this.router.navigate(['/index-list']);
      },
      error: (err) => {
        this.isLoading = false;
        this.errorMessage = err.error?.message || 'Erro ao fazer login. Verifique suas credenciais.';
        console.error('Login failed', err);
      }
    });
  }
}