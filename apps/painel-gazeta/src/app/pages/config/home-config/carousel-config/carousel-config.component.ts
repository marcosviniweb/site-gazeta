import { Component, inject, OnInit, OnDestroy, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { Subject, takeUntil, first } from 'rxjs';
import { ConfigService } from '../../../../core/services/config.service';
import { AlertService } from '@site-gazeta/alert';

@Component({
  selector: 'app-carousel-config',
  standalone: true,
  imports: [CommonModule, FormsModule, MatIconModule],
  templateUrl: './carousel-config.component.html',
  styleUrl: './carousel-config.component.scss',
})
export class CarouselConfigComponent implements OnInit, OnDestroy {
  private configService = inject(ConfigService);
  private alertService = inject(AlertService);
  private destroy$ = new Subject<void>();

  featuredNewsLimit = signal<number>(5);
  isLoading = signal<boolean>(false);
  isSaving = signal<boolean>(false);

  readonly MIN_LIMIT = 3;
  readonly MAX_LIMIT = 10;

  ngOnInit(): void {
    this.loadCarouselConfig();
  }

  loadCarouselConfig(): void {
    this.isLoading.set(true);
    this.configService.getCarousel()
      .pipe(takeUntil(this.destroy$), first())
      .subscribe({
        next: (config) => {
          this.isLoading.set(false);
          if (config) {
            this.featuredNewsLimit.set(config.featuredNewsLimit);
          } else {
            this.featuredNewsLimit.set(5); // Valor padrão
          }
        },
        error: (error) => {
          this.isLoading.set(false);
          console.error('Erro ao carregar configuração do carrossel:', error);
          this.featuredNewsLimit.set(5); // Valor padrão em caso de erro
        }
      });
  }

  onLimitChange(event: Event): void {
    const target = event.target as HTMLInputElement;
    const value = parseInt(target.value, 10);
    
    if (isNaN(value)) {
      return;
    }

    // Garantir que está dentro dos limites
    const clampedValue = Math.max(this.MIN_LIMIT, Math.min(this.MAX_LIMIT, value));
    this.featuredNewsLimit.set(clampedValue);
    
    // Atualizar o valor do input se foi ajustado
    if (value !== clampedValue) {
      target.value = clampedValue.toString();
    }
  }

  saveCarouselConfig(): void {
    const limit = this.featuredNewsLimit();
    
    if (limit < this.MIN_LIMIT || limit > this.MAX_LIMIT) {
      this.alertService.warning('Atenção', `O limite deve estar entre ${this.MIN_LIMIT} e ${this.MAX_LIMIT} notícias.`);
      return;
    }

    this.isSaving.set(true);
    
    // Tentar atualizar primeiro
    this.configService.updateCarousel({ featuredNewsLimit: limit })
      .pipe(takeUntil(this.destroy$), first())
      .subscribe({
        next: (config) => {
          this.isSaving.set(false);
          this.featuredNewsLimit.set(config.featuredNewsLimit);
          this.alertService.success(
            'Sucesso',
            `Configuração do carrossel salva! Limite de notícias: ${config.featuredNewsLimit}`
          );
        },
        error: (error) => {
          // Se não existe, criar
          if (error.status === 404) {
            this.configService.createCarousel({ featuredNewsLimit: limit })
              .pipe(takeUntil(this.destroy$), first())
              .subscribe({
                next: (config) => {
                  this.isSaving.set(false);
                  this.featuredNewsLimit.set(config.featuredNewsLimit);
                  this.alertService.success(
                    'Sucesso',
                    `Configuração do carrossel criada! Limite de notícias: ${config.featuredNewsLimit}`
                  );
                },
                error: (createError) => {
                  this.isSaving.set(false);
                  this.alertService.error('Erro', 'Erro ao salvar configuração do carrossel');
                  console.error('Erro ao criar carrossel:', createError);
                }
              });
          } else {
            this.isSaving.set(false);
            this.alertService.error('Erro', 'Erro ao salvar configuração do carrossel');
            console.error('Erro ao atualizar carrossel:', error);
          }
        }
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}

