import { Component, inject, signal, effect, input, output, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { VideoService } from '../../../core/services/video.service';
import { Video, Category } from '@site-gazeta/models';
import { CategoryService } from '../../../core/services/category.service';
import { VideoFilesComponent } from './video-files/video-files.component';
import { VideoRelatedNewsComponent } from './video-related-news/video-related-news.component';
import { AlertService } from '@site-gazeta/alert';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-video-upload',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, VideoFilesComponent, VideoRelatedNewsComponent, MatIconModule],
  templateUrl: './video-upload.component.html',
  styleUrl: './video-upload.component.scss',
})
export class VideoUploadComponent implements OnInit, OnDestroy {
  private fb = inject(FormBuilder);
  private videoService = inject(VideoService);
  private categoryService = inject(CategoryService);
  private alertService = inject(AlertService);

  // Inputs & Outputs
  videoToEdit = input<Video | null>(null);
  onSave = output<Video>();
  onCancel = output<void>();

  // Storage de Timeouts
  private progressInterval: any;

  // Signals
  uploadForm!: FormGroup;
  selectedVideoFile = signal<File | null>(null);
  selectedThumbnailFile = signal<File | null>(null);
  isUploading = signal(false);
  uploadProgress = signal(0);
  removeThumbnailFlag = signal<boolean>(false); // Flag para remover thumbnail
  selectedNewsSlug = signal<string | null>(null); // Slug da notícia selecionada

  // Categorias
  availableCategories = signal<Category[]>([]);
  selectedCategories = signal<Category[]>([]);
  categoryDropdownOpen = signal<boolean>(false);

  // Tags
  tags = signal<string[]>([]);
  tagInput = signal<string>('');
  tagInputVisible = signal<boolean>(false);


  constructor() {
    this.initForm();

    // Effect para carregar vídeo ao editar
    effect(() => {
      const video = this.videoToEdit();
      if (video) {
        this.loadVideoForEdit(video);
      }
    });
  }

  ngOnInit(): void {
    this.loadCategories();
  }

  private initForm(): void {
    this.uploadForm = this.fb.group({
      title: ['', [Validators.required, Validators.minLength(3)]],
      categoryId: [[] as number[]],
      featured: [false],
      tags: [[] as string[]],
      description: [''],
    });
  }

  loadCategories(): void {
    this.categoryService.getActive().subscribe({
      next: (categories) => {
        this.availableCategories.set(categories);
      },
      error: (err) => {
        console.error('Erro ao carregar categorias:', err);
      }
    });
  }

  private loadVideoForEdit(video: Video): void {
    this.uploadForm.patchValue({
      title: video.title,
      featured: video.featured || false,
      tags: video.tags || [],
      categoryId: video.categories?.map(cat => cat.id) || [],
      description: video.description || ''
    });

    // Carregar categorias selecionadas
    if (video.categories && video.categories.length > 0) {
      this.selectedCategories.set(video.categories);
    }

    // Carregar tags
    if (video.tags && video.tags.length > 0) {
      this.tags.set(video.tags);
    }

    // Resetar flag de remoção
    this.removeThumbnailFlag.set(false);

    // Carregar slug da notícia relacionada
    if (video.newsSlug) {
      this.selectedNewsSlug.set(video.newsSlug);
    }
  }

  // Métodos para Categorias
  toggleCategoryDropdown(): void {
    this.categoryDropdownOpen.update(open => !open);
  }

  selectCategory(category: Category): void {
    const current = this.selectedCategories();
    if (!current.find(c => c.id === category.id)) {
      this.selectedCategories.set([...current, category]);
      this.updateFormCategories([...current, category]);
    }
    this.categoryDropdownOpen.set(false);
  }

  removeCategory(categoryId: number): void {
    const newSelected = this.selectedCategories().filter(c => c.id !== categoryId);
    this.selectedCategories.set(newSelected);
    this.updateFormCategories(newSelected);
  }

  private updateFormCategories(categories: Category[]): void {
    const categoryIds = categories.map(cat => cat.id as number);
    this.uploadForm.patchValue({ categoryId: categoryIds });
  }

  getAvailableCategories(): Category[] {
    const selectedIds = this.selectedCategories().map(cat => cat.id);
    return this.availableCategories().filter(cat => !selectedIds.includes(cat.id));
  }

  // Métodos para Tags
  showTagInput(): void {
    this.tagInputVisible.set(true);
  }

  hideTagInput(): void {
    if (this.tagInput().trim()) {
      this.addTag(); // Se houver conteúdo sendo digitado e o usuário clicar fora, aceita a tag por padrão
    } else {
      this.tagInputVisible.set(false);
      this.tagInput.set('');
    }
  }

  addTag(): void {
    const tagValue = this.tagInput().trim();
    if (tagValue && !this.tags().includes(tagValue)) {
      const newTags = [...this.tags(), tagValue];
      this.tags.set(newTags);
      this.uploadForm.patchValue({ tags: newTags });
      this.tagInput.set('');
      this.hideTagInput();
    }
  }

  removeTag(tag: string): void {
    const newTags = this.tags().filter(t => t !== tag);
    this.tags.set(newTags);
    this.uploadForm.patchValue({ tags: newTags });
  }

  onTagInputKeydown(event: KeyboardEvent): void {
    if (event.key === 'Enter') {
      event.preventDefault();
      this.addTag();
    } else if (event.key === 'Escape') {
      this.hideTagInput();
    }
  }

  // Handlers para eventos do componente filho video-files
  onVideoFileSelected(file: File | null): void {
    this.selectedVideoFile.set(file);
  }

  onThumbnailFileSelected(file: File | null): void {
    this.selectedThumbnailFile.set(file);
    // Limpar flag de remoção se novo arquivo foi selecionado
    if (file) {
      this.removeThumbnailFlag.set(false);
    }
  }

  onThumbnailRemoved(): void {
    // Se estamos editando e havia uma thumbnail, marcar para remover
    if (this.videoToEdit() && this.videoToEdit()!.thumbnail) {
      this.removeThumbnailFlag.set(true);
    }
  }

  submitForm(): void {
    console.log('called', this.videoToEdit())
    // Validar formulário
    if (this.uploadForm.invalid) {
      this.uploadForm.markAllAsTouched();
      return;
    }

    const videoToEdit = this.videoToEdit();

    // Ao criar novo, vídeo é obrigatório
    if (!videoToEdit && !this.selectedVideoFile()) {
      return;
    }

    this.isUploading.set(true);
    this.uploadProgress.set(0);

    // Criar FormData
    const formData = new FormData();
    formData.append('title', this.uploadForm.get('title')?.value);
    
    // Adicionar categorias
    const categoryIds = this.uploadForm.get('categoryId')?.value || [];
    if (categoryIds.length > 0) {
      categoryIds.forEach((id: number) => {
        formData.append('categoryId', id.toString());
      });
    }

    // Adicionar featured
    const featured = this.uploadForm.get('featured')?.value || false;
    formData.append('featured', featured.toString());

    // Adicionar tags
    const tags = this.uploadForm.get('tags')?.value || [];
    if (tags.length > 0) {
      tags.forEach((tag: string) => {
        formData.append('tags', tag);
      });
    }

    // Adicionar description
    const description = this.uploadForm.get('description')?.value;
    if (description) {
      formData.append('description', description);
    }

    // Adicionar newsSlug
    const newsSlug = this.selectedNewsSlug();
    if (newsSlug) {
      formData.append('newsSlug', newsSlug);
    }

    if (this.selectedVideoFile()) {
      formData.append('video', this.selectedVideoFile()!);
    }

    if (this.selectedThumbnailFile()) {
      formData.append('thumbnail', this.selectedThumbnailFile()!);
    }

    // Se estamos editando e a thumbnail foi removida, adicionar flag
    if (videoToEdit && this.removeThumbnailFlag()) {
      formData.append('removeThumbnail', 'true');
    }

    // Simular progresso (você pode implementar progresso real com HttpClient)
    this.progressInterval = setInterval(() => {
      this.uploadProgress.update(p => Math.min(p + 10, 90));
    }, 200);

    const apiCall = videoToEdit
      ? this.videoService.update(videoToEdit.id, formData)
      : this.videoService.upload(formData);

    apiCall.subscribe({
      next: (video) => {
        if (this.progressInterval) {
          clearInterval(this.progressInterval);
        }
        this.uploadProgress.set(100);

        setTimeout(() => {
          this.isUploading.set(false);
          this.uploadProgress.set(0);
          this.onSave.emit(video);
          this.resetForm();
        }, 500);
      },
      error: (err) => {
        if (this.progressInterval) {
          clearInterval(this.progressInterval);
        }
        this.isUploading.set(false);
        this.uploadProgress.set(0);
        console.error('Erro ao fazer upload do vídeo:', err);
        this.alertService.error('Erro', 'Erro ao fazer upload do vídeo. Tente novamente.');
      }
    });
  }

  resetForm(): void {
    this.uploadForm.reset();
    this.selectedVideoFile.set(null);
    this.selectedThumbnailFile.set(null);
    this.selectedCategories.set([]);
    this.tags.set([]);
    this.tagInput.set('');
    this.tagInputVisible.set(false);
    this.categoryDropdownOpen.set(false);
    this.removeThumbnailFlag.set(false);
    this.selectedNewsSlug.set(null);
  }

  onNewsSlugSelected(slug: string | null): void {
    this.selectedNewsSlug.set(slug);
  }

  cancel(): void {
    this.resetForm();
    this.onCancel.emit();
  }

  // Getters para validação
  get titleControl() { return this.uploadForm.get('title'); }
  get featuredControl() { return this.uploadForm.get('featured'); }

  get isFormValid(): boolean {
    // Título deve estar válido
    if (this.uploadForm.invalid) {
      return false;
    }

    // Ao criar novo vídeo, arquivo é obrigatório
    if (!this.videoToEdit() && !this.selectedVideoFile()) {
      return false;
    }

    // Ao editar, vídeo não é obrigatório (já existe)
    return true;
  }

  ngOnDestroy(): void {
    if (this.progressInterval) {
      clearInterval(this.progressInterval);
    }
  }
}
