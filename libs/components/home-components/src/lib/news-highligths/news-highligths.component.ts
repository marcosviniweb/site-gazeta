import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { HomeHighlightItem, HomeNewsOrchestratorService } from '@site-gazeta/api';
import { toSignal } from '@angular/core/rxjs-interop';

@Component({
  selector: 'lib-news-highligths',
  standalone: true,
  imports: [RouterModule, CommonModule],
  templateUrl: './news-highligths.component.html',
  styleUrl: './news-highligths.component.scss',
})
export class NewsHighligthsComponent {
  private homeOrchestrator = inject(HomeNewsOrchestratorService);

  $news = toSignal(this.homeOrchestrator.getHighlights(), {
    initialValue: [] as HomeHighlightItem[],
  });
}
