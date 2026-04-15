import { Component, signal, input, output, effect, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DomSanitizer, SafeUrl } from '@angular/platform-browser';
import { AlertService } from '@site-gazeta/alert';
import { MatIconModule } from '@angular/material/icon';
import { Video } from '@site-gazeta/models';

@Component({
  selector: 'app-video-files',
  standalone: true,
  imports: [CommonModule, MatIconModule],
  templateUrl: './video-files.component.html',
  styleUrl: './video-files.component.scss',
})
export class VideoFilesComponent {
  private alertService = inject(AlertService);
  private sanitizer = inject(DomSanitizer);

  // Inputs
  videoToEdit = input<Video| null>(null);
  videoUrl = input<string | null>(null);
  thumbnailUrl = input<string | null>(null);

  // Outputs
  videoFileSelected = output<File | null>();
  thumbnailFileSelected = output<File | null>();
  thumbnailRemoved = output<boolean>();

  // Signals
  selectedVideoFile = signal<File | null>(null);
  selectedThumbnailFile = signal<File | null>(null);
  videoPreviewUrl = signal<SafeUrl | null>(null);
  thumbnailPreviewUrl = signal<SafeUrl | null>(null);
  isDraggingVideo = signal(false);
  isDraggingThumbnail = signal(false);
  isExtractingThumbnail = signal(false);

  private videoObjectUrl: string | null = null;

  // Formatos aceitos
  readonly acceptedVideoFormats = '.mp4,.avi,.mov,.webm,.mkv';
  readonly acceptedImageFormats = '.jpg,.jpeg,.png,.webp';
  readonly maxVideoSize = 500 * 1024 * 1024; // 500MB
  readonly maxImageSize = 5 * 1024 * 1024; // 5MB

  constructor() {
    // Effect para carregar URLs iniciais quando vídeo é passado para edição
    effect(() => {
      const videoUrl = this.videoUrl();
      const thumbnailUrl = this.thumbnailUrl();

      // Se não há arquivo selecionado, usar URL do vídeo existente
      if (!this.selectedVideoFile() && videoUrl) {
        this.videoPreviewUrl.set(this.sanitizer.bypassSecurityTrustUrl(videoUrl));
      }

      // Apenas definir thumbnail preview URL se:
      // 1. Não há arquivo de thumbnail selecionado E
      // 2. Há uma thumbnail URL do servidor E
      // 3. A preview atual está vazia ou é diferente da URL do servidor
      if (!this.selectedThumbnailFile() && thumbnailUrl) {
        this.thumbnailPreviewUrl.set(this.sanitizer.bypassSecurityTrustUrl(thumbnailUrl));
      }
    });
  }

  // Drag & Drop - Video
  onVideoDragOver(event: DragEvent): void {
    event.preventDefault();
    this.isDraggingVideo.set(true);
  }

  onVideoDragLeave(event: DragEvent): void {
    event.preventDefault();
    this.isDraggingVideo.set(false);
  }

  onVideoDrop(event: DragEvent): void {
    event.preventDefault();
    this.isDraggingVideo.set(false);

    const files = event.dataTransfer?.files;
    if (files && files.length > 0) {
      this.handleVideoFile(files[0]);
    }
  }

  onVideoFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.handleVideoFile(input.files[0]);
    }
  }

  private handleVideoFile(file: File): void {
    // Validar tipo
    if (!file.type.startsWith('video/')) {
      this.alertService.warning('Atenção', 'Por favor, selecione um arquivo de vídeo válido.');
      return;
    }

    // Validar tamanho
    if (file.size > this.maxVideoSize) {
      this.alertService.warning('Atenção', `O vídeo deve ter no máximo ${this.maxVideoSize / (1024 * 1024)}MB.`);
      return;
    }

    this.selectedVideoFile.set(file);

    // Revogar URL anterior se existir
    if (this.videoObjectUrl) {
      URL.revokeObjectURL(this.videoObjectUrl);
    }

    // Criar preview com URL segura
    this.videoObjectUrl = URL.createObjectURL(file);
    this.videoPreviewUrl.set(this.sanitizer.bypassSecurityTrustUrl(this.videoObjectUrl));

    // Extrair thumbnail automaticamente se não houver thumbnail selecionada
    if (!this.selectedThumbnailFile() && !this.thumbnailUrl()) {
      this.extractThumbnailFromVideo(file);
    }

    // Notificar componente pai
    this.videoFileSelected.emit(file);
  }

  removeVideo(): void {
    if (this.videoObjectUrl && !this.videoUrl()) {
      URL.revokeObjectURL(this.videoObjectUrl);
      this.videoObjectUrl = null;
    }
    this.selectedVideoFile.set(null);
    const existingUrl = this.videoUrl();
    this.videoPreviewUrl.set(existingUrl ? this.sanitizer.bypassSecurityTrustUrl(existingUrl) : null);
    
    // Remover thumbnail extraída automaticamente se não for uma thumbnail existente
    if (this.selectedThumbnailFile() && !this.thumbnailUrl()) {
      this.selectedThumbnailFile.set(null);
      this.thumbnailPreviewUrl.set(null);
      this.thumbnailFileSelected.emit(null);
    }
    
    this.videoFileSelected.emit(null);
  }

  // Drag & Drop - Thumbnail
  onThumbnailDragOver(event: DragEvent): void {
    event.preventDefault();
    this.isDraggingThumbnail.set(true);
  }

  onThumbnailDragLeave(event: DragEvent): void {
    event.preventDefault();
    this.isDraggingThumbnail.set(false);
  }

  onThumbnailDrop(event: DragEvent): void {
    event.preventDefault();
    this.isDraggingThumbnail.set(false);

    const files = event.dataTransfer?.files;
    if (files && files.length > 0) {
      this.handleThumbnailFile(files[0]);
    }
  }

  onThumbnailFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.handleThumbnailFile(input.files[0]);
    }
  }

  private handleThumbnailFile(file: File): void {
    // Validar tipo
    if (!file.type.startsWith('image/')) {
      this.alertService.warning('Atenção', 'Por favor, selecione uma imagem válida.');
      return;
    }

    // Validar tamanho
    if (file.size > this.maxImageSize) {
      this.alertService.warning('Atenção', `A imagem deve ter no máximo ${this.maxImageSize / (1024 * 1024)}MB.`);
      return;
    }

    this.selectedThumbnailFile.set(file);

    // Criar preview com URL segura
    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target?.result as string;
      this.thumbnailPreviewUrl.set(this.sanitizer.bypassSecurityTrustUrl(dataUrl));
    };
    reader.readAsDataURL(file);

    // Notificar componente pai
    this.thumbnailFileSelected.emit(file);
  }

  removeThumbnail(): void {
    // Limpar a thumbnail selecionada
    this.selectedThumbnailFile.set(null);
    this.thumbnailPreviewUrl.set(null);
    
    // Se estamos editando e havia uma thumbnail, notificar remoção
    if (this.videoToEdit() && this.thumbnailUrl()) {
      this.thumbnailRemoved.emit(true);
    }
    
    // Notificar componente pai que a thumbnail foi removida
    this.thumbnailFileSelected.emit(null);
  }

  /**
   * Extrai uma thumbnail automaticamente do vídeo
   * @param file Arquivo de vídeo
   */
  private async extractThumbnailFromVideo(file: File): Promise<void> {
    try {
      this.isExtractingThumbnail.set(true);

      const thumbnailBlob = await this.extractThumbnail(file);
      
      if (thumbnailBlob) {
        // Converter Blob para File para manter consistência
        const thumbnailFile = new File(
          [thumbnailBlob],
          `${file.name.replace(/\.[^/.]+$/, '')}_thumbnail.webp`,
          { type: 'image/webp' }
        );

        // Atualizar thumbnail
        this.selectedThumbnailFile.set(thumbnailFile);

        // Criar preview com URL segura
        const thumbnailObjectUrl = URL.createObjectURL(thumbnailBlob);
        this.thumbnailPreviewUrl.set(this.sanitizer.bypassSecurityTrustUrl(thumbnailObjectUrl));

        // Notificar componente pai
        this.thumbnailFileSelected.emit(thumbnailFile);
      }
    } catch (error) {
      console.error('Erro ao extrair thumbnail do vídeo:', error);
      // Não mostrar erro ao usuário, apenas logar - é uma funcionalidade opcional
    } finally {
      this.isExtractingThumbnail.set(false);
    }
  }

  /**
   * Extrai um frame do vídeo como thumbnail
   * @param file Arquivo de vídeo
   * @returns Promise com o Blob da thumbnail (formato WebP)
   */
  private extractThumbnail(file: File): Promise<Blob | null> {
    return new Promise((resolve, reject) => {
      const video = document.createElement('video');
      const videoUrl = URL.createObjectURL(file);
      
      video.preload = 'metadata';
      video.src = videoUrl;
      video.muted = true; // Necessário para alguns navegadores reproduzirem o vídeo

      // Limpar URL após uso
      const cleanup = () => {
        URL.revokeObjectURL(videoUrl);
        video.remove();
      };

      // Timeout para evitar espera infinita
      const timeout = setTimeout(() => {
        cleanup();
        resolve(null);
      }, 10000); // 10 segundos

      video.onloadedmetadata = () => {
        // Tentar ir para 1 segundo do vídeo (ou início se o vídeo for muito curto)
        video.currentTime = Math.min(1, video.duration / 4);
      };

      video.onseeked = () => {
        try {
          const canvas = document.createElement('canvas');
          
          // Limitar tamanho máximo da thumbnail para melhor performance
          const maxWidth = 1280;
          const maxHeight = 720;
          
          let width = video.videoWidth;
          let height = video.videoHeight;
          
          // Redimensionar se necessário mantendo aspect ratio
          if (width > maxWidth || height > maxHeight) {
            const aspectRatio = width / height;
            if (width > height) {
              width = maxWidth;
              height = width / aspectRatio;
            } else {
              height = maxHeight;
              width = height * aspectRatio;
            }
          }
          
          canvas.width = width;
          canvas.height = height;

          const ctx = canvas.getContext('2d');
          if (!ctx) {
            clearTimeout(timeout);
            cleanup();
            resolve(null);
            return;
          }

          // Desenhar frame no canvas
          ctx.drawImage(video, 0, 0, width, height);

          // Converter para Blob (WebP com qualidade 0.85)
          canvas.toBlob(
            (blob) => {
              clearTimeout(timeout);
              cleanup();
              resolve(blob);
            },
            'image/webp',
            0.85
          );
        } catch (error) {
          clearTimeout(timeout);
          cleanup();
          reject(error);
        }
      };

      video.onerror = (error) => {
        clearTimeout(timeout);
        cleanup();
        reject(error);
      };
    });
  }

  // Formatação de tamanho de arquivo
  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  }
}
