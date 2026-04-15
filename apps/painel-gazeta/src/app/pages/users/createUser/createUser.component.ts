import { Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { AlertService } from '@site-gazeta/alert';
import { User } from '@site-gazeta/models';
import { AbstractControl } from '@angular/forms';

@Component({
  selector: 'app-create-user',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, MatIconModule],
  templateUrl: './createUser.component.html',
  styleUrl: './createUser.component.scss',
})
export class CreateUserComponent {
  private fb = inject(FormBuilder).nonNullable;
  private alertService = inject(AlertService);

  editingUser: User | null = null;

  userForm = this.fb.group(
    {
      nome: ['', [Validators.required, Validators.minLength(2)]],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', [Validators.required]],
    },
    {
      validators: this.passwordMatchValidator,
    },
  );

  passwordMatchValidator(form: AbstractControl) {
    const password = form.get('password')?.value;
    const confirmPassword = form.get('confirmPassword')?.value;

    if (password !== confirmPassword) {
      form.get('confirmPassword')?.setErrors({ mismatch: true });
      return { mismatch: true };
    }

    form.get('confirmPassword')?.setErrors(null);
    return null;
  }

  onSubmit() {
    if (this.userForm.valid) {
      const formValue = this.userForm.value;

      // Reset do formulário após sucesso
      this.userForm.reset();

      // Aqui você poderia emitir um evento para atualizar a lista
      this.alertService.success('Sucesso', 'Usuário criado com sucesso!');
    }
  }

  resetForm() {
    this.userForm.reset();
    this.editingUser = null;
  }
}
