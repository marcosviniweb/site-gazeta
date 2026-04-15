import { Component, inject, OnInit, OnDestroy, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subject, takeUntil, first } from 'rxjs';
import { ConfigService } from '../../../core/services/config.service';
import { AlertService } from '@site-gazeta/alert';

@Component({
  selector: 'app-maintenance',
  imports: [CommonModule],
  templateUrl: './maintenance.component.html',
  styleUrl: './maintenance.component.scss',
})
export class MaintenanceComponent implements OnInit, OnDestroy {
  private configService = inject(ConfigService);
  private alertService = inject(AlertService);
  private destroy$ = new Subject<void>();

  isMaintenanceActive = signal<boolean>(false);
  isLoading = signal<boolean>(false);
  isSaving = signal<boolean>(false);
  showConfirmModal = signal<boolean>(false);
  pendingMaintenanceState = signal<boolean | null>(null);

  ngOnInit(): void {
    this.loadMaintenanceStatus();
  }

  loadMaintenanceStatus(): void {
    this.isLoading.set(true);
    this.configService.getMaintenance()
      .pipe(takeUntil(this.destroy$), first())
      .subscribe({
        next: (config) => {
          this.isLoading.set(false);
          if (config) {
            this.isMaintenanceActive.set(config.isActive);
          } else {
            this.isMaintenanceActive.set(false);
          }
        },
        error: (error) => {
          this.isLoading.set(false);
          console.error('Erro ao carregar status de manutenção:', error);
          this.isMaintenanceActive.set(false);
        }
      });
  }

  onToggleMaintenance(event: Event): void {
    const target = event.target as HTMLInputElement;
    const newValue = target.checked;

    if (newValue) {
      // Mostrar modal de confirmação antes de ativar
      this.pendingMaintenanceState.set(newValue);
      this.showConfirmModal.set(true);
      // Reverter o toggle até confirmar
      target.checked = false;
      return;
    }

    this.saveMaintenanceStatus(newValue);
  }

  confirmMaintenanceChange(): void {
    const newValue = this.pendingMaintenanceState();
    if (newValue !== null) {
      this.showConfirmModal.set(false);
      this.saveMaintenanceStatus(newValue);
      this.pendingMaintenanceState.set(null);
    }
  }

  cancelMaintenanceChange(): void {
    this.showConfirmModal.set(false);
    this.pendingMaintenanceState.set(null);
  }

  saveMaintenanceStatus(isActive: boolean): void {
    this.isSaving.set(true);
    
    // Tentar atualizar primeiro
    this.configService.updateMaintenance({ isActive })
      .pipe(takeUntil(this.destroy$), first())
      .subscribe({
        next: (config) => {
          this.isSaving.set(false);
          this.isMaintenanceActive.set(config.isActive);
          this.alertService.success(
            'Sucesso',
            `Manutenção ${config.isActive ? 'ativada' : 'desativada'} com sucesso!`
          );
        },
        error: (error) => {
          // Se não existe, criar
          if (error.status === 404) {
            this.configService.createMaintenance({ isActive })
              .pipe(takeUntil(this.destroy$), first())
              .subscribe({
                next: (config) => {
                  this.isSaving.set(false);
                  this.isMaintenanceActive.set(config.isActive);
                  this.alertService.success(
                    'Sucesso',
                    `Manutenção ${config.isActive ? 'ativada' : 'desativada'} com sucesso!`
                  );
                },
                error: (createError) => {
                  this.isSaving.set(false);
                  this.alertService.error('Erro', 'Erro ao salvar configuração de manutenção');
                  console.error('Erro ao criar manutenção:', createError);
                  // Reverter o toggle
                  this.isMaintenanceActive.set(!isActive);
                }
              });
          } else {
            this.isSaving.set(false);
            this.alertService.error('Erro', 'Erro ao salvar configuração de manutenção');
            console.error('Erro ao atualizar manutenção:', error);
            // Reverter o toggle
            this.isMaintenanceActive.set(!isActive);
          }
        }
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}

