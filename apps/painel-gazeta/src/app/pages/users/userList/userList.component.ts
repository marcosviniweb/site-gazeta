import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AlertService } from '@site-gazeta/alert';
import { MatIconModule } from '@angular/material/icon';

interface User {
  id: number;
  nome: string;
  email: string;
}

@Component({
  selector: 'app-user-list',
  standalone: true,
  imports: [CommonModule, MatIconModule],
  templateUrl: './userList.component.html',
  styleUrl: './userList.component.scss',
})
export class UserListComponent {
  private alertService = inject(AlertService);

  // Mock de usuários
  users: User[] = [
    { id: 1, nome: 'João Silva', email: 'joao@example.com' },
    { id: 2, nome: 'Maria Santos', email: 'maria@example.com' },
    { id: 3, nome: 'Pedro Oliveira', email: 'pedro@example.com' },
    { id: 4, nome: 'Ana Costa', email: 'ana@example.com' },
    { id: 5, nome: 'Carlos Mendes', email: 'carlos@example.com' },
    { id: 6, nome: 'Lucia Ferreira', email: 'lucia@example.com' },
  ];

  editUser(user: User) {
    this.alertService.info('Informação', `Editar usuário: ${user.nome}`);
  }

  deleteUser(userId: number) {
    if (confirm('Tem certeza que deseja excluir este usuário?')) {
      this.users = this.users.filter((u) => u.id !== userId);
      this.alertService.success('Sucesso', 'Usuário excluído com sucesso!');
    }
  }
}
