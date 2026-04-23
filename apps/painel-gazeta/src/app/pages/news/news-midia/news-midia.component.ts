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
  type: 'photo';
  file?: File;
  preview?: string | SafeUrl;
  author?: string;
  date?: string;
  emphasis?: boolean;
  id?: number;
  imgSize?: {
    original: string;
    small: string;
    medium: string;
    superSmall: string;
  };
  isNew?: boolean;
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
  newsMedia = input<NewsMedia[]>();
  newsVideo = input<NewsVideo[]>(); // Mantido para compatibilidade com o pai, ignorado na UI de midia.
  isEdit = signal<boolean>(false);
  private newsService = inject(NewsService);
  
  previewMidias = signal<MediaItem[]>([]);
  selectedMediaIndex = signal<number | null>(null);
  editingMedia = signal<Partial<MediaItem>>({});
  
  formValue = output<{ newsVideo: NewsVideo[]; newsMedia: NewsMedia[] }>();
  
  featuredImage = computed(() =>
    this.previewMidias().find((media) => media.emphasis),
  );

  selectedMedia = computed(() => {
    const index = this.selectedMediaIndex();
    return index !== null ? this.previewMidias()[index] : null;
  });

  hasMidias = computed(() => this.previewMidias().length > 0);
  isDragging = signal<boolean>(false);

  private inputsPopulated = false;

  constructor() {
    effect(() => {
      this.exportMidias();
      this.checkEditNewsMedia();
    });

    effect(() => {
      const media = this.newsMedia();
      if (!this.inputsPopulated && media?.length) {
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
    if (this.newsMedia()) {
      return this.isEdit.set(true);
    }
    return;
  }

  onDragOver(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging.set(true);
  }

  onDragLeave(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging.set(false);
  }

  onDrop(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging.set(false);

    if (event.dataTransfer?.files && event.dataTransfer.files.length > 0) {
      this.processFiles(event.dataTransfer.files);
    }
  }

  onPhotosSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.processFiles(input.files);
    }
    input.value = '';
  }

  private processFiles(files: FileList) {
    const filesArray = Array.from(files).filter(f => f.type.startsWith('image/'));
    if (filesArray.length === 0) {
       this.alertService.warning('Atenção', 'Apenas arquivos de imagem são permitidos.');
       return;
    }

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

  ngOnInit() {
    this.populateMediaFromInputs();
  }

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
    this.previewMidias.set(mediaItems);
  }

  removeMedia(index: number, event?: Event) {
    if (event) event.stopPropagation();
    
    const conf = confirm(`Tem certeza que deseja remover esta foto?`);
    if (!conf) return;

    const media = this.previewMidias()[index];
    if (media.id) {
      this.deleteMediaFromApi(media.id);
    }
    
    this.previewMidias.update((midias) => {
        const updated = midias.filter((_, i) => i !== index);
        // Se deletou o destaque e sobrou fotos, destaca a primeira
        if (media.emphasis && updated.length > 0) {
            updated[0].emphasis = true;
        }
        return updated;
    });

    const currentSelected = this.selectedMediaIndex();
    if (currentSelected === index) {
      this.selectedMediaIndex.set(null);
      this.editingMedia.set({});
    } else if (currentSelected !== null && currentSelected > index) {
      this.selectedMediaIndex.set(currentSelected - 1);
    }
  }

  selectMedia(index: number, event?: Event) {
    if (event) event.stopPropagation();
    const media = this.previewMidias()[index];
    this.selectedMediaIndex.set(index);
    this.editingMedia.set({ ...media });
  }

  toggleFeatured(index: number, event: Event) {
    event.stopPropagation();
    this.previewMidias.update((midias) =>
      midias.map((item, i) => ({
        ...item,
        emphasis: i === index, // Apenas um pode ter destaque
      })),
    );
  }

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
      this.alertService.success('Sucesso', 'Metadados salvos');
    }
  }

  patchMediaInfo(id: number, media: Partial<MediaItem>) {
    const payload: Partial<MediaItem> = {
      emphasis: media.emphasis,
      author: media.author,
      date: media.date,
    };
    firstValueFrom(this.newsService.updateMedia(id, payload))
      .catch((error) => {
        console.error(`Erro ao editar mídia`, error);
        this.alertService.error('Erro', 'Falha ao atualizar metadados');
      });
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

  exportMidias() {
    const newsMidias: NewsMedia[] = [];
    this.previewMidias().forEach((midia) => {
      newsMidias.push({
        id: midia.id,
        file: midia.file,
        author: midia.author,
        date: midia.date,
        emphasis: midia.emphasis as boolean,
        imgSize: midia.imgSize,
      });
    });
    
    const formValue = {
      newsVideo: this.newsVideo() || [], // Repassando os vídeos se vierem da api
      newsMedia: newsMidias,
    };
    this.formValue.emit(formValue);
  }

  deleteMediaFromApi(id: number) {
    firstValueFrom(this.newsService.deleteMedia(id))
      .catch((error) => {
        console.error(`Erro ao deletar mídia`, error);
      });
  }

  private shouldSetAsFirstFeatured(): boolean {
    const currentMidias = this.previewMidias();
    if (currentMidias.length === 0) return true;
    return !currentMidias.some((media) => media.emphasis);
  }

  resetMedia() {
    this.previewMidias.set([]);
    this.selectedMediaIndex.set(null);
    this.editingMedia.set({});
    if (this.photoInput?.nativeElement) {
      this.photoInput.nativeElement.value = '';
    }
    this.isEdit.set(false);
    this.inputsPopulated = false;
    this.formValue.emit({
      newsVideo: this.newsVideo() || [],
      newsMedia: [],
    });
  }
}
