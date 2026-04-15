import {
  Component,
  ViewChild,
  ElementRef,
  signal,
  computed,
  output,
  effect,
  input,
  OnInit,
  inject,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DomSanitizer, SafeUrl } from '@angular/platform-browser';
import { NewsMedia, NewsVideo } from '@site-gazeta/models';
import { NewsService } from '../../../core/services/news.service';
import { firstValueFrom } from 'rxjs';
import { AlertService } from '@site-gazeta/alert';
import { MatIconModule } from '@angular/material/icon';

interface MediaItem {
  type: 'photo' | 'video';
  file?: File; // só para novas
  preview?: string | SafeUrl; // só para novas
  url?: string; // para vídeos
  thumbnail?: string; // para vídeos
  title?: string; // para vídeos
  author?: string;
  date?: string;
  emphasis?: boolean;
  id?: number; // para existentes
  imgSize?: {
    // para existentes
    original: string;
    small: string;
    medium: string;
    superSmall: string;
  };
  isNew?: boolean; // flag para diferenciar
}

@Component({
  selector: 'app-news-midia',
  imports: [CommonModule, FormsModule, MatIconModule],
  templateUrl: './news-midia.component.html',
  styleUrl: './news-midia.component.scss',
})
export class NewsMidiaComponent implements OnInit {
  private alertService = inject(AlertService);
  private sanitizer = inject(DomSanitizer);

  @ViewChild('photoInput') photoInput!: ElementRef<HTMLInputElement>;
  //medias da noticia para edição
  newsMedia = input<NewsMedia[]>();
  newsVideo = input<NewsVideo[]>();
  isEdit = signal<boolean>(false);
  private newsService = inject(NewsService);
  previewMidias = signal<MediaItem[]>([]);
  selectedMediaIndex = signal<number | null>(null);
  editingMedia = signal<Partial<MediaItem>>({});
  formValue = output<{ newsVideo: NewsVideo[]; newsMedia: NewsMedia[] }>();
  featuredImage = computed(() =>
    this.previewMidias().find(
      (media) => media.type === 'photo' && media.emphasis,
    ),
  );

  selectedMedia = computed(() => {
    const index = this.selectedMediaIndex();
    return index !== null ? this.previewMidias()[index] : null;
  });

  hasMidias = computed(() => this.previewMidias().length > 0);
  private inputsPopulated = false;
  constructor() {
    // Effect só para exportação - sempre roda quando há mudança
    effect(() => {
      this.exportMidias();
      this.checkEditNewsMedia();
    });

    // Effect separado - só para inputs iniciais
    effect(() => {
      // Só depende dos inputs!
      const media = this.newsMedia();
      const videos = this.newsVideo();
      if (!this.inputsPopulated && (media?.length || videos?.length)) {
        this.inputsPopulated = true;
        this.populateMediaFromInputs();
      }
    });
  }
  privewChange = computed(() => this.exportMidias());
  addPhoto() {
    this.photoInput.nativeElement.click();
  }

  checkEditNewsMedia() {
    if (this.newsMedia() || this.newsVideo()) {
      return this.isEdit.set(true);
    }
    return;
  }
  addVideo() {
    const videoUrl = prompt('Digite a URL do vídeo do YouTube:');
    if (videoUrl && this.isValidYouTubeUrl(videoUrl)) {
      const videoId = this.extractYouTubeId(videoUrl);
      const newVideo: MediaItem = {
        type: 'video',
        url: videoUrl,
        thumbnail: `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`,
        title: 'Vídeo do YouTube',
        emphasis: false,
      };

      this.previewMidias.update((midias) => [...midias, newVideo]);
    } else if (videoUrl) {
      this.alertService.warning(
        'Atenção',
        'Por favor, insira uma URL válida do YouTube.',
      );
    }
  }

  onPhotosSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    const files = input.files;

    if (files && files.length > 0) {
      const filesArray = Array.from(files);

      filesArray.forEach((file) => {
        const reader = new FileReader();
        reader.onload = (e) => {
          const dataUrl = e.target?.result as string;
          const newMedia: MediaItem = {
            type: 'photo',
            file: file,
            preview: this.sanitizer.bypassSecurityTrustUrl(dataUrl),
            author: '',
            date: '',
            emphasis: this.shouldSetAsFirstFeatured(),
          };

          this.previewMidias.update((midias) => [...midias, newMedia]);
        };
        reader.readAsDataURL(file);
      });
    }
    input.value = '';
  }

  ngOnInit() {
    this.populateMediaFromInputs();
  }

  // Popula o array interno ao receber dados da API
  populateMediaFromInputs() {
    const existingNew = this.previewMidias().filter((m) => m.file || m.isNew);
    const mediaItems: MediaItem[] = [...existingNew];

    if (this.newsMedia()) {
      for (const media of this.newsMedia() ?? []) {
        const imgSize = Array.isArray(media.imgSize)
          ? media.imgSize[0]
          : media.imgSize;
        mediaItems.push({
          ...media,
          type: 'photo',
          imgSize: imgSize,
          preview: imgSize?.medium,
          isNew: false,
        });
      }
    }
    if (this.newsVideo()) {
      for (const video of this.newsVideo() ?? []) {
        mediaItems.push({
          ...video,
          type: 'video',
          isNew: false,
        });
      }
    }
    this.previewMidias.set(mediaItems);
  }

  // Remover mídia (diferencia nova de existente)
  removeMedia(index: number, event?: Event) {
    const conf = confirm(`Tem certeza que deseja remover a mídia?`);
    if (!conf) return;

    if (event) event.stopPropagation();
    const media = this.previewMidias()[index];
    if (media.id) {
      this.deleteMediaFromApi(media.id);
    }
    this.previewMidias.update((midias) => midias.filter((_, i) => i !== index));

    const currentSelected = this.selectedMediaIndex();
    if (currentSelected === index) {
      this.selectedMediaIndex.set(null);
      this.editingMedia.set({});
    } else if (currentSelected !== null && currentSelected > index) {
      this.selectedMediaIndex.set(currentSelected - 1);
    }
  }

  selectMedia(index: number) {
    const media = this.previewMidias()[index];
    if (media.type === 'photo') {
      this.selectedMediaIndex.set(index);
      this.editingMedia.set({ ...media });
    }
  }

  toggleFeatured(index: number, event: Event) {
    event.stopPropagation();

    const media = this.previewMidias()[index];
    if (media.type === 'photo') {
      this.previewMidias.update((midias) =>
        midias.map((item, i) => ({
          ...item,
          emphasis:
            i === index
              ? !item.emphasis
              : item.type === 'photo'
                ? false
                : item.emphasis,
        })),
      );
    }
  }

  // Salvar edição (diferencia nova de existente)
  saveMediaInfo() {
    const index = this.selectedMediaIndex();
    if (index !== null) {
      const media = this.editingMedia();
      if (media.id) {
        this.patchMediaInfo(media.id, media);
      }
      this.previewMidias.update((midias) =>
        midias.map((item, i) =>
          i === index
            ? ({ ...item, ...this.editingMedia() } as MediaItem)
            : item,
        ),
      );
      this.cancelMediaEdit();
    }
  }

  // Função para PATCH (API)
  patchMediaInfo(id: number, media: Partial<MediaItem>) {
    const payload: Partial<MediaItem> = {
      emphasis: media.emphasis,
      author: media.author,
      date: media.date,
    };
    if (media.type === 'photo') {
      firstValueFrom(this.newsService.updateMedia(id, payload))
        .catch((error) => {
          console.error(`Erro ao editar mídia`, error);
        });
    } else {
      firstValueFrom(this.newsService.updateVideo(id, payload))
        .catch((error) => {
          console.error(`Erro ao editar vídeo`, error);
        });
    }
  }

  cancelMediaEdit() {
    this.selectedMediaIndex.set(null);
    this.editingMedia.set({});
  }

  updateEditingAuthor(author: string) {
    this.editingMedia.update((media) => ({ ...media, author }));
  }

  updateEditingDate(date: string) {
    this.editingMedia.update((media) => ({ ...media, date }));
  }

  private isValidYouTubeUrl(url: string): boolean {
    return /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be)\/.+/.test(url);
  }

  private extractYouTubeId(url: string): string {
    const match = url.match(
      /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/,
    );
    return match && match[2].length === 11 ? match[2] : '';
  }

  exportMidias() {
    const newsMidias: NewsMedia[] = [];
    const videoMidias: NewsVideo[] = [];
    this.previewMidias().forEach((midia) => {
      if (midia.type === 'photo') {
        newsMidias.push({
          id: midia.id,
          file: midia.file,
          author: midia.author,
          date: midia.date,
          emphasis: midia.emphasis as boolean,
          imgSize: midia.imgSize ? [midia.imgSize] : undefined,
        });
      }
      if (midia.type === 'video') {
        videoMidias.push({
          id: midia.id,
          url: midia.url as string,
          thumbnail: midia.thumbnail as string,
          title: midia.title as string,
          duration: '00:00',
        });
      }
    });
    const formValue = {
      newsVideo: videoMidias,
      newsMedia: newsMidias,
    };
    this.formValue.emit(formValue);
  }

  // Função para DELETE (API)
  deleteMediaFromApi(id: number) {
    firstValueFrom(this.newsService.deleteMedia(id))
      .catch((error) => {
        console.error(`Erro ao deletar mídia`, error);
      });
  }

  private shouldSetAsFirstFeatured(): boolean {
    const currentMidias = this.previewMidias();
    if (currentMidias.length === 0) {
      return true;
    }

    const hasFeaturedImage = currentMidias.some(
      (media) => media.type === 'photo' && media.emphasis,
    );

    return !hasFeaturedImage;
  }

  // Método para resetar completamente o componente
  resetMedia() {
    // Limpa todas as mídias
    this.previewMidias.set([]);
    // Reseta o índice selecionado
    this.selectedMediaIndex.set(null);
    // Limpa o formulário de edição
    this.editingMedia.set({});
    // Reseta o input de foto
    if (this.photoInput?.nativeElement) {
      this.photoInput.nativeElement.value = '';
    }
    // Reseta o estado de edição
    this.isEdit.set(false);
    // Reseta o flag de population
    this.inputsPopulated = false;
    // Emite evento vazio para atualizar o formulário principal
    this.formValue.emit({
      newsVideo: [],
      newsMedia: [],
    });
  }
}
