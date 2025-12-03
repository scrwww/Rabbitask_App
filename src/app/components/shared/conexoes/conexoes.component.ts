import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { OverseeService } from 'src/app/services/oversee.service';
import { UserService } from 'src/app/services/user.service';

interface UsuarioResumo {
  cd: number;
  nome: string;
  email: string;
}

@Component({
  selector: 'app-conexoes',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './conexoes.component.html',
  styleUrls: ['./conexoes.component.scss']
})
export class ConexoesComponent implements OnInit {
  @Input() visible: boolean = false;
  @Output() usuarioSelecionado = new EventEmitter<UsuarioResumo>();
  @Output() fechar = new EventEmitter<void>();

  usuariosConectados: UsuarioResumo[] = [];
  carregando: boolean = false;
  erro: string | null = null;

  constructor(
    private http: HttpClient,
    private overseeService: OverseeService,
    private user: UserService
  ) {}

  ngOnInit() {
    this.carregarUsuariosConectados();
  }

  carregarUsuariosConectados() {
    this.carregando = true;
    this.erro = null;

    this.http.get<any>('/api/usuario/meus-usuarios')
      .subscribe({
        next: (response) => {
          if (response.success) {
            this.usuariosConectados = response.data;
          }
          this.carregando = false;
        },
        error: (err) => {
          console.error('Erro ao carregar usuários conectados:', err);
          this.erro = 'Erro ao carregar usuários';
          this.carregando = false;
        }
      });
  }

  selecionarUsuario(usuario: UsuarioResumo) {
    this.overseeService.setOverseeing(usuario.cd);
    this.usuarioSelecionado.emit(usuario);
    this.fechar.emit();
  }

  onFechar() {
    this.fechar.emit();
  }
}
