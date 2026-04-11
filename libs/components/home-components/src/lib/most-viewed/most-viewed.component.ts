import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { NgOptimizedImage } from '@angular/common';
import { News } from '@site-gazeta/models';
import { ApiConfigService } from '@site-gazeta/api';
import { toSignal } from '@angular/core/rxjs-interop';
@Component({
  selector: 'lib-most-viewed',
  standalone: true,
  imports: [CommonModule, RouterModule, NgOptimizedImage],
  templateUrl: './most-viewed.component.html',
  styleUrl: './most-viewed.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MostViewedComponent {
  private apiService = inject(ApiConfigService);
  mostViewedNews = toSignal(this.apiService.getMostViewedNews(), { initialValue: [] as News[] });

  columns = computed(() => {
    const news = this.mostViewedNews();
    if(news) {
      return [
        news.slice(0, 3),   // coluna 0
        news.slice(3, 6),   // coluna 1
        news.slice(6, 9)    // coluna 2
      ];
  }
  return [];
  });
  getColumnNews(newsResponse: News[], columnIndex: number): News[] {
    const news = newsResponse;
    const startIndex = columnIndex * 3;
    return news.slice(startIndex, startIndex + 3);
  }

  getImageUrl(news: News): string | null {
    if (news.mediaNews && news.mediaNews.length > 0 && news.mediaNews[0].imgSize) {
      return news.mediaNews[0].imgSize.superSmall || news.mediaNews[0].imgSize.original || null;
    }
    return null;
  }
}
