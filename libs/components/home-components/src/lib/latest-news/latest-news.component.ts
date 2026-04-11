import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule, NgOptimizedImage } from '@angular/common';
import { News } from '@site-gazeta/models';
import { ApiConfigService } from '@site-gazeta/api';
import { RouterModule } from '@angular/router';
import { Observable } from 'rxjs';

@Component({
  selector: 'lib-latest-news',
  standalone: true,
  imports: [CommonModule, RouterModule, NgOptimizedImage],
  templateUrl: './latest-news.component.html',
  styleUrl: './latest-news.component.scss',
})
export class LatestNewsComponent {
  private apiService = inject(ApiConfigService);
  news = signal<Observable<News[]>>(this.apiService.getLatestNews());

  onImageError(event: Event): void {
    const img = event.target as HTMLImageElement;
    img.src = 'https://via.placeholder.com/300x180?text=Imagem+Indisponível';
  }
}
