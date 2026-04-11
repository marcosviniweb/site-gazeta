import { Component, ChangeDetectionStrategy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { News } from '@site-gazeta/models';
import { CarouselComponent } from '../carousel/carousel.component';
import { CarouselSwipeComponent } from '../carousel-swipe/carousel-swipe.component';
import { ApiConfigService, HomeNewsOrchestratorService } from '@site-gazeta/api';
import { combineLatest, map } from 'rxjs';

@Component({
  selector: 'lib-carousel-manager',
  standalone: true,
  imports: [CommonModule, CarouselComponent, CarouselSwipeComponent],
  templateUrl: './carousel-manager.component.html',
  styleUrl: './carousel-manager.component.scss',
  changeDetection:ChangeDetectionStrategy.OnPush
})
export class CarouselManagerComponent {
  private apiConfigService = inject(ApiConfigService);
  private homeOrchestrator = inject(HomeNewsOrchestratorService);

  // Busca do Store central para aplicar a regra Exclude Id global
  $news = this.homeOrchestrator.getCarouselNews();
  $carouselLimit = this.apiConfigService.getCarouselConfig();

  $limitedNews = combineLatest([this.$news, this.$carouselLimit]).pipe(
    map(([news, limit]: [News[], number]) => {
      return news.slice(0, limit);
    })
  );
}
