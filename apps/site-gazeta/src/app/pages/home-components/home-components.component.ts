import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { map } from 'rxjs/operators';
import { NewsCategoryGridComponent } from '@site-gazeta/home-components';
import { NewsHighligthsComponent } from '@site-gazeta/home-components';
import { VideoManagerComponent } from '@site-gazeta/video-player';
import { MoreNewsComponent } from '@site-gazeta/more-news';
import { ApiService } from '../../core/service/api.service';
import { Ads, Category,  Menu, News, Video } from '@site-gazeta/models';
import { AdsComponent } from '@site-gazeta/ads';
import { CarouselManagerComponent } from '@site-gazeta/carousel';
import { LatestNewsComponent, MostViewedComponent } from '@site-gazeta/home-components';
import { toSignal } from '@angular/core/rxjs-interop';
import { ScrollRevealDirective } from '../../core/directives/scroll-reveal.directive';
import { MetaTagsService } from '../../core/service/meta-tags.service';
import { HomeNewsOrchestratorService } from '@site-gazeta/api';

@Component({
  selector: 'app-home-components',
  imports: [
    CommonModule,
    CarouselManagerComponent,
    NewsCategoryGridComponent,
    NewsHighligthsComponent,
    VideoManagerComponent,
    MoreNewsComponent,
    AdsComponent,
    LatestNewsComponent,
    MostViewedComponent,
    ScrollRevealDirective,
  ],
  templateUrl: './home-components.component.html',
  styleUrl: './home-components.component.scss',
})
export class HomeComponentsComponent implements OnInit {
  private apiService = inject(ApiService);
  private metaService = inject(MetaTagsService);
  private homeOrchestrator = inject(HomeNewsOrchestratorService);

  topAd = toSignal(this.apiService.getAdsByPlacementAndPosition('home', 'top'), {
    initialValue: {} as Record<string, Ads>,
  });
  centerAd = toSignal(this.apiService.getAdsByPlacementAndPosition('home', 'center'), {
    initialValue: {} as Record<string, Ads>,
  });
  bottomAd = toSignal(this.apiService.getAdsByPlacementAndPosition('home', 'bottom'), {
    initialValue: {} as Record<string, Ads>,
  });

  ngOnInit(): void {
    this.homeOrchestrator.resetStore();
    this.setTags();
  }

  setTags() {
    this.metaService.setTags();
  }
}

