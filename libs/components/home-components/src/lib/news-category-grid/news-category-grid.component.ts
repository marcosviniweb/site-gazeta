import { Component, computed, inject } from '@angular/core';
import { CommonModule, NgOptimizedImage } from '@angular/common';
import { News, Category } from '@site-gazeta/models';
import { RouterModule } from '@angular/router';
import {
  HomeCategoryGridItem,
  HomeNewsOrchestratorService,
} from '@site-gazeta/api';
import { toSignal } from '@angular/core/rxjs-interop';

@Component({
  selector: 'lib-news-category-grid',
  imports: [CommonModule, RouterModule, NgOptimizedImage],
  templateUrl: './news-category-grid.component.html',
  styleUrl: './news-category-grid.component.scss',
})
export class NewsCategoryGridComponent {
  private homeOrchestrator = inject(HomeNewsOrchestratorService);

  $news = toSignal(this.homeOrchestrator.getCategoryGrid(), {
    initialValue: [] as HomeCategoryGridItem[],
  });

  newsInColumns = computed(() => {
    const categoriesData = this.$news();

    if (!categoriesData || categoriesData.length === 0) {
      return [];
    }

    const result: Array<{
      category: Category;
      featured: News;
      secondary: News[];
    }> = [];

    // Itera sobre cada categoria (uma coluna por categoria)
    for (const categoryData of categoriesData) {
      const { category, news } = categoryData;

      if (!news || news.length === 0) {
        continue;
      }

      // Pega apenas as primeiras 3 notícias de cada categoria
      const threeNews = news.slice(0, 3);

      if (threeNews.length > 0 && threeNews[0]) {
        result.push({
          category: category,
          featured: threeNews[0],
          secondary: threeNews
            .slice(1, 3)
            .filter((item): item is News => item !== undefined),
        });
      }
    }

    return result;
  });
}
