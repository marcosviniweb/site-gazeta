import { Component, OnInit, signal, output, input, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ConfigService } from '../../../../core/services/config.service';
import { AlertService } from '@site-gazeta/alert';
import { first } from 'rxjs';
import { MatIconModule } from '@angular/material/icon';

export interface HomeSection {
  id: string;
  name: string;
  title: string;
  order: number;
  showTitle: boolean;
  icon: string;
}

@Component({
  selector: 'app-order-section',
  standalone: true,
  imports: [CommonModule, MatIconModule],
  templateUrl: './order-section.component.html',
  styleUrl: './order-section.component.scss',
})
export class OrderSectionComponent implements OnInit {
  // Services
  private configService = inject(ConfigService);
  private alertService = inject(AlertService);
  
  // Output para comunicar mudanças com o pai
  sectionsChange = output<HomeSection[]>();
  
  // Input para receber seções iniciais (para edição)
  initialSections = input<HomeSection[] | null>(null);
  
  // Loading state
  loading = signal<boolean>(false);
  
  sections = signal<HomeSection[]>([
    { id: 'carousel', name: 'Carrossel', title: 'Últimas Notícias', order: 1, showTitle: true, icon: 'view_carousel' },
    { id: 'videos', name: 'Vídeos', title: 'Vídeos em Alta', order: 2, showTitle: true, icon: 'play_circle' },
    { id: 'destaques', name: 'Destaques', title: 'Notícias em Destaque', order: 3, showTitle: true, icon: 'star' },
    { id: 'top-gazeta', name: 'Top Gazeta', title: 'Top Gazeta', order: 4, showTitle: true, icon: 'trending_up' },
    { id: 'cluster', name: 'Cluster de Notícias', title: 'Mais Lidas', order: 5, showTitle: true, icon: 'grid_view' },
  ]);

  ngOnInit() {
    const initial = this.initialSections();
    if (initial && initial.length > 0) {
      this.sections.set([...initial]);
    } else {
      this.loadSavedSections();
    }
  }

  /**
   * Carregar seções salvas da API
   */
  loadSavedSections() {
    this.configService.getSections().pipe(first()).subscribe({
      next: (sections) => {
        if (sections && sections.length > 0) {
          // Mapear para o formato correto
          const mappedSections: HomeSection[] = sections.map(s => ({
            id: s.sectionId,
            name: s.name,
            title: s.title,
            order: s.order,
            showTitle: s.showTitle,
            icon: s.icon || ''
          }));
          this.sections.set(mappedSections);
        }
      },
      error: (error) => console.error('Erro ao carregar seções:', error)
    });
  }

  getSortedSections(): HomeSection[] {
    return [...this.sections()].sort((a, b) => a.order - b.order);
  }

  moveSection(index: number, direction: 'up' | 'down') {
    const sortedSections = this.getSortedSections();
    const newIndex = direction === 'up' ? index - 1 : index + 1;

    if (newIndex < 0 || newIndex >= sortedSections.length) {
      return;
    }

    // Troca as ordens
    const tempOrder = sortedSections[index].order;
    sortedSections[index].order = sortedSections[newIndex].order;
    sortedSections[newIndex].order = tempOrder;

    this.sections.set([...sortedSections]);
    this.emitSectionsChange();
  }

  updateSectionTitle(sectionId: string, newTitle: string) {
    const updatedSections = this.sections().map(section =>
      section.id === sectionId ? { ...section, title: newTitle } : section
    );
    this.sections.set(updatedSections);
    this.emitSectionsChange();
  }

  toggleSectionTitle(sectionId: string) {
    const updatedSections = this.sections().map(section =>
      section.id === sectionId ? { ...section, showTitle: !section.showTitle } : section
    );
    this.sections.set(updatedSections);
    this.emitSectionsChange();
  }

  private emitSectionsChange() {
    this.sectionsChange.emit(this.sections());
  }

  /**
   * Salvar ordenação das seções
   */
  saveSections() {
    this.loading.set(true);
    
    const sectionsToSave = this.sections().map(s => ({
      sectionId: s.id,
      name: s.name,
      title: s.title,
      order: s.order,
      showTitle: s.showTitle,
      icon: s.icon
    }));

    this.configService.bulkUpdateSections(sectionsToSave).pipe(first()).subscribe({
      next: (savedSections) => {
        this.loading.set(false);
        this.alertService.success('Sucesso', 'Ordenação das seções salva com sucesso!');
        console.log('Seções salvas:', savedSections);
      },
      error: (error) => {
        this.loading.set(false);
        
        // Se seções não existem, criar uma a uma
        if (error.status === 404) {
          this.createAllSections();
        } else {
          this.alertService.error('Erro', 'Erro ao salvar ordenação das seções');
          console.error('Erro ao salvar seções:', error);
        }
      }
    });
  }

  /**
   * Criar todas as seções (primeira vez)
   */
  private createAllSections() {
    let createdCount = 0;
    const totalSections = this.sections().length;

    this.sections().forEach(section => {
      this.configService.createSection({
        sectionId: section.id,
        name: section.name,
        title: section.title,
        order: section.order,
        showTitle: section.showTitle,
        icon: section.icon
      }).pipe(first()).subscribe({
        next: () => {
          createdCount++;
          if (createdCount === totalSections) {
            this.loading.set(false);
            this.alertService.success('Sucesso', 'Seções criadas com sucesso!');
          }
        },
        error: (error) => {
          this.loading.set(false);
          this.alertService.error('Erro', 'Erro ao criar seções');
          console.error('Erro ao criar seção:', error);
        }
      });
    });
  }

  // Método público para reset
  reset() {
    this.sections.set([
      { id: 'carousel', name: 'Carrossel', title: 'Últimas Notícias', order: 1, showTitle: true, icon: 'view_carousel' },
      { id: 'destaques', name: 'Destaques', title: 'Notícias em Destaque', order: 3, showTitle: true, icon: 'star' },
      { id: 'videos', name: 'Vídeos', title: 'Vídeos em Alta', order: 2, showTitle: true, icon: 'play_circle' },
      { id: 'cluster', name: 'Cluster de Notícias', title: 'Mais Lidas', order: 5, showTitle: true, icon: 'grid_view' },
      { id: 'top-gazeta', name: 'Top Gazeta', title: 'Top Gazeta', order: 4, showTitle: true, icon: 'trending_up' },
    ]);
    this.emitSectionsChange();
  }
}
