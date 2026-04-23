import { Component, input, signal, computed, effect, viewChild, ElementRef, AfterViewInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { VideoProgressBarComponent } from './video-progress-bar/video-progress-bar.component';
import { VideoControlsBarComponent } from './video-controls-bar/video-controls-bar.component';

@Component({
  selector: 'lib-video-player',
  imports: [CommonModule, VideoProgressBarComponent, VideoControlsBarComponent],
  templateUrl: './video-player.component.html',
  styleUrls: ['./video-player.component.scss'],
  standalone: true,
})
export class VideoPlayerComponent implements AfterViewInit, OnDestroy {
  // Inputs
  src = input.required<string>();
  poster = input<string>('');
  autoplay = input<boolean>(false);
  muted = input<boolean>(false);
  loop = input<boolean>(false);
  controls = input<boolean>(true);
  thumbnail = input<string | null >(null);
  preload = input<string>('none');
  // ViewChild para o elemento de vídeo principal e background blur
  videoElement = viewChild<ElementRef<HTMLVideoElement>>('videoElement');
  videoBlurElement = viewChild<ElementRef<HTMLVideoElement>>('videoBlurElement');

  // Signals de estado
  isPlaying = signal<boolean>(false);
  currentTime = signal<number>(0);
  duration = signal<number>(0);
  volume = signal<number>(1);
  playbackRate = signal<number>(1);
  isFullscreen = signal<boolean>(false);
  isMuted = signal<boolean>(false);
  showControls = signal<boolean>(true);
  isBuffering = signal<boolean>(false);
  hasPlayedOnce = signal<boolean>(false);

  // Computed signals
  progress = computed(() => {
    const duration = this.duration();
    if (!duration) return 0;
    return (this.currentTime() / duration) * 100;
  });

  buffered = computed(() => {
    const video = this.videoElement()?.nativeElement;
    if (!video || !video.buffered.length) return 0;
    
    const duration = this.duration();
    if (!duration) return 0;
    
    // Encontra o ponto mais distante que foi baixado (comportamento similar ao YouTube)
    // Isso mostra todos os segmentos baixados de forma contínua, mesmo com gaps
    let furthestBuffered = 0;
    
    for (let i = 0; i < video.buffered.length; i++) {
      const rangeEnd = video.buffered.end(i);
      if (rangeEnd > furthestBuffered) {
        furthestBuffered = rangeEnd;
      }
    }
    
    // Retorna a porcentagem do ponto mais distante baixado
    return (furthestBuffered / duration) * 100;
  });

  formattedCurrentTime = computed(() => this.formatTime(this.currentTime()));
  formattedDuration = computed(() => this.formatTime(this.duration()));

  hasThumbnail = computed(() => {
    const thumbnail = this.thumbnail();
    if(thumbnail){
      return thumbnail;
    }
    return null;
  });

  // Intervalos e timeouts
  private controlsTimeout?: ReturnType<typeof setTimeout>;
  private updateInterval?: ReturnType<typeof setInterval>;

  ngAfterViewInit(): void {
    const video = this.videoElement()?.nativeElement;
    if (!video) return;

    // Inicializa valores
    this.duration.set(video.duration || 0);
    this.volume.set(video.volume);
    this.isMuted.set(video.muted);
    this.playbackRate.set(video.playbackRate);

    video.addEventListener('loadedmetadata', () => {
      this.duration.set(video.duration);
    });

    video.addEventListener('timeupdate', () => {
      if (!isNaN(video.currentTime)) {
        this.currentTime.set(video.currentTime);
      }
    });
    
    video.addEventListener('playing', () => {
      this.startUpdateInterval();
    });

    video.addEventListener('play', () => {
      this.isPlaying.set(true);
      this.hasPlayedOnce.set(true); // Marca que o vídeo já foi reproduzido
      this.showControls.set(true); // Mostra os controles após o primeiro play
      this.startUpdateInterval();
      // Adiciona classe para ocultar overlay
      const wrapper = video.parentElement;
      if (wrapper) {
        wrapper.classList.add('playing');
      }
    });

    video.addEventListener('playing', () => {
      this.isPlaying.set(true);
      this.startUpdateInterval();
    });

    video.addEventListener('pause', () => {
      this.isPlaying.set(false);
      this.stopUpdateInterval();
      // Remove classe para mostrar overlay novamente
      const wrapper = video.parentElement;
      if (wrapper) {
        wrapper.classList.remove('playing');
      }
    });

    video.addEventListener('waiting', () => {
      this.isBuffering.set(true);
    });

    video.addEventListener('canplay', () => {
      this.isBuffering.set(false);
    });

    video.addEventListener('canplaythrough', () => {
      this.isBuffering.set(false);
    });

    video.addEventListener('ended', () => {
      this.isPlaying.set(false);
      this.stopUpdateInterval();
    });

    video.addEventListener('volumechange', () => {
      this.volume.set(video.volume);
      this.isMuted.set(video.muted);
    });

    video.addEventListener('ratechange', () => {
      this.playbackRate.set(video.playbackRate);
    });

    video.addEventListener('progress', () => {
      // Força atualização do buffered
    });

    // Fullscreen change listener
    document.addEventListener('fullscreenchange', this.handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', this.handleFullscreenChange);
    document.addEventListener('mozfullscreenchange', this.handleFullscreenChange);
    document.addEventListener('MSFullscreenChange', this.handleFullscreenChange);

    // Mouse move para ocultar controles
    video.addEventListener('mousemove', () => {
      this.showControls.set(true);
      this.resetControlsTimeout();
    });

    video.addEventListener('mouseleave', () => {
      if (this.isPlaying()) {
        this.resetControlsTimeout();
      }
    });

    // Aplica inputs iniciais
    if (this.autoplay()) {
      video.play()
        .then(() => {
          this.hasPlayedOnce.set(true); // Marca que o vídeo já foi reproduzido
          this.showControls.set(true); // Mostra os controles após autoplay
        })
        .catch(() => {});
    }
    if (this.muted()) {
      video.muted = true;
      this.isMuted.set(true);
    }
    if (this.loop()) {
      video.loop = true;
    }
  }

  ngOnDestroy(): void {
    this.stopUpdateInterval();
    if (this.controlsTimeout) {
      clearTimeout(this.controlsTimeout);
    }
    document.removeEventListener('fullscreenchange', this.handleFullscreenChange);
    document.removeEventListener('webkitfullscreenchange', this.handleFullscreenChange);
    document.removeEventListener('mozfullscreenchange', this.handleFullscreenChange);
    document.removeEventListener('MSFullscreenChange', this.handleFullscreenChange);
  }

  // Métodos de controle
  togglePlay(): void {
    const video = this.videoElement()?.nativeElement;
    if (!video) return;

    if (video.paused) {
      video.play()
        .then(() => {
          this.isPlaying.set(true);
          this.hasPlayedOnce.set(true); // Marca que o vídeo já foi reproduzido
          this.showControls.set(true); // Mostra os controles após o primeiro play
          this.startUpdateInterval();
          
          // Sincroniza o play do vídeo de fundo
          this.videoBlurElement()?.nativeElement.play().catch(() => {});
        })
        .catch((error) => {
          console.error('Erro ao reproduzir vídeo:', error);
        });
    } else {
      video.pause();
      this.videoBlurElement()?.nativeElement.pause(); // Pausa o fundo também
      this.isPlaying.set(false);
      this.stopUpdateInterval();
    }
  }

  toggleMute(): void {
    const video = this.videoElement()?.nativeElement;
    if (!video) return;

    video.muted = !video.muted;
    this.isMuted.set(video.muted);
  }

  setVolume(value: number): void {
    const video = this.videoElement()?.nativeElement;
    if (!video) return;

    const newVolume = Math.max(0, Math.min(1, value));
    video.volume = newVolume;
    this.volume.set(newVolume);
    if (newVolume > 0 && video.muted) {
      video.muted = false;
      this.isMuted.set(false);
    }
  }

  setPlaybackRate(rate: number): void {
    const video = this.videoElement()?.nativeElement;
    if (!video) return;

    video.playbackRate = rate;
    
    const blurVideo = this.videoBlurElement()?.nativeElement;
    if (blurVideo) blurVideo.playbackRate = rate;

    this.playbackRate.set(rate);
  }

  seekTo(time: number): void {
    const video = this.videoElement()?.nativeElement;
    if (!video) return;

    const duration = this.duration();
    const newTime = Math.max(0, Math.min(duration, time));
    video.currentTime = newTime;
    
    const blurVideo = this.videoBlurElement()?.nativeElement;
    if (blurVideo) blurVideo.currentTime = newTime;

    this.currentTime.set(newTime);
  }

  seekByPercentage(percentage: number): void {
    const duration = this.duration();
    if (!duration) return;
    this.seekTo((percentage / 100) * duration);
  }

  toggleFullscreen(): void {
    const video = this.videoElement()?.nativeElement;
    if (!video) return;

    const container = video.parentElement;
    if (!container) return;

    if (!this.isFullscreen()) {
      if (container.requestFullscreen) {
        container.requestFullscreen();
      } else if ((container as any).webkitRequestFullscreen) {
        (container as any).webkitRequestFullscreen();
      } else if ((container as any).mozRequestFullScreen) {
        (container as any).mozRequestFullScreen();
      } else if ((container as any).msRequestFullscreen) {
        (container as any).msRequestFullscreen();
      }
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      } else if ((document as any).webkitExitFullscreen) {
        (document as any).webkitExitFullscreen();
      } else if ((document as any).mozCancelFullScreen) {
        (document as any).mozCancelFullScreen();
      } else if ((document as any).msExitFullscreen) {
        (document as any).msExitFullscreen();
      }
    }
  }

  // Handlers de eventos
  onVideoClick(event: MouseEvent): void {
    // Previne que o clique no vídeo dispare se o clique foi em algum elemento filho (como controles)
    const target = event.target as HTMLElement;
    if (target.closest('.controls-overlay') || target.closest('.center-play-overlay')) {
      return;
    }
    
    // Toggle play/pause ao clicar no vídeo
    this.togglePlay();
    event.stopPropagation();
  }

  private handleFullscreenChange = (): void => {
    const isFullscreen = !!(
      document.fullscreenElement ||
      (document as any).webkitFullscreenElement ||
      (document as any).mozFullScreenElement ||
      (document as any).msFullscreenElement
    );
    this.isFullscreen.set(isFullscreen);
  };


  // Utilitários
  formatTime(seconds: number): string {
    if (!seconds || isNaN(seconds)) return '0:00';

    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);

    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  }

  private startUpdateInterval(): void {
    this.stopUpdateInterval();
    const video = this.videoElement()?.nativeElement;
    if (!video || video.paused) return;
    
    this.updateInterval = setInterval(() => {
      const videoElement = this.videoElement()?.nativeElement;
      if (videoElement && !videoElement.paused && !isNaN(videoElement.currentTime)) {
        this.currentTime.set(videoElement.currentTime);
        
        // Atualiza o estado de reprodução caso tenha mudado
        if (!this.isPlaying()) {
          this.isPlaying.set(true);
        }
      } else {
        this.stopUpdateInterval();
        this.isPlaying.set(false);
      }
    }, 100);
  }

  private stopUpdateInterval(): void {
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
      this.updateInterval = undefined;
    }
  }

  private resetControlsTimeout(): void {
    if (this.controlsTimeout) {
      clearTimeout(this.controlsTimeout);
    }
    this.controlsTimeout = setTimeout(() => {
      if (this.isPlaying()) {
        this.showControls.set(false);
      }
    }, 3000);
  }
}
