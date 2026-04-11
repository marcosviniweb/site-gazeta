import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { VideoListComponent } from '../video-list/video-list.component';
import { VideoPlayerComponent } from '../video-player/video-player.component';
import { ApiConfigService } from '@site-gazeta/api';
import { Video } from '@site-gazeta/models';

@Component({
  selector: 'lib-video-manager',
  standalone: true,
  imports: [CommonModule, VideoListComponent, VideoPlayerComponent],
  templateUrl: './video-manager.component.html',
  styleUrl: './video-manager.component.scss',
})
export class VideoManagerComponent implements OnInit {
  private apiConfigService = inject(ApiConfigService);
  currentVideo = signal<Video | null>(null);
  videos = signal<Video[]>([]);

  ngOnInit(): void {
    this.apiConfigService.getVideos().subscribe({
      next: (response) => {
        const videosData = response.data;
        this.videos.set(videosData);
        // Auto-seleciona o primeiro vídeo se houver
        if (videosData.length > 0 && !this.currentVideo()) {
          this.currentVideo.set(videosData[0]);
        }
      },
      error: (error) => {
        console.error('Erro ao carregar vídeos:', error);
      }
    });
  }

  onVideoSelect(video: Video): void {
    this.currentVideo.set(video);
  }
}
