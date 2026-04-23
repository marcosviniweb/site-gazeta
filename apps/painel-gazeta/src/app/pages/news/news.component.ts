import {
  Component,
  inject,
  OnDestroy,
  OnInit,
  signal,
  ViewChild,
  computed,
} from '@angular/core';

import { TextEditorComponent } from '@site-gazeta/text-editor';
import {
  NonNullableFormBuilder,
  Validators,
  ReactiveFormsModule,
  FormsModule,
} from '@angular/forms';
import { MultiSelectComponent } from '@site-gazeta/multi-select';
import { NewsMidiaComponent } from './news-midia/news-midia.component';
import { NewsMedia, NewsVideo, Category, News } from '@site-gazeta/models';
import {
  FormValidatorComponent,
  FormValidatorService,
} from '@site-gazeta/form-validator';
import {
  concatMap,
  first,
  firstValueFrom,
  from,
  Subject,
  takeUntil,
  toArray,
  tap,
  mergeMap,
} from 'rxjs';
import { toSignal } from '@angular/core/rxjs-interop';
import { NewsService } from '../../core/services/news.service';
import { CategoryService } from '../../core/services/category.service';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { environment } from '@site-gazeta/env';
import { AlertService } from '@site-gazeta/alert';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-news',
  imports: [
    TextEditorComponent,
    ReactiveFormsModule,
    FormsModule,
    NewsMidiaComponent,
    FormValidatorComponent,
    RouterModule,
    MultiSelectComponent,
    MatIconModule,
  ],
  providers: [FormValidatorService],
  templateUrl: './news.component.html',
  styleUrl: './news.component.scss',
})
export class NewsComponent implements OnInit, OnDestroy {
  @ViewChild(NewsMidiaComponent) newsMidiaComponent!: NewsMidiaComponent;
  fb = inject(NonNullableFormBuilder);
  formValidator = inject(FormValidatorService);
  newsService = inject(NewsService);
  categoryService = inject(CategoryService);
  activeRouter = inject(ActivatedRoute);
  private alertService = inject(AlertService);
  apiUrl = environment.apiUrl;
  activeTab: 'info' | 'content' | 'media' = 'info';
  sidebarOpen = signal<boolean>(true);
  destroy$ = new Subject<void>();
  urlDisplay = signal<string>('');
  displayError = signal<{ [key: string]: string } | null>({});
  availableCategories = signal<Category[]>([]);
  isEdit = signal<boolean>(false);
  isLoadingEdit = signal<boolean>(false);
  editNewsTitle = signal<string>('');
  newsId: number | undefined = undefined;
  exportEditNewsMedia = signal<{
    newsMedia: NewsMedia[];
    newsVideos: NewsVideo[];
  } | null>(null);
  isSavingNews = signal<boolean>(false);
  isUploadingMedia = signal<boolean>(false);
  mediaUploadProgress = signal<{ current: number; total: number }>({
    current: 0,
    total: 0,
  });
  headerSubtitle = computed(() => {
    return this.isEdit()
      ? 'Atualize os dados da publicação'
      : 'Preencha os dados para publicar';
  });

  headerTitle = computed(() => {
    if (this.isEdit()) {
      const title = this.editNewsTitle();
      return title ? `Editando: ${title}` : 'Editando notícia...';
    }
    return 'Nova Notícia';
  });

  form = this.fb.group({
    categoryId: [[] as number[], [Validators.required]],
    title: ['', [Validators.required]],
    subtitle: ['', [Validators.required]],
    slug: ['', [Validators.required]],
    author: ['Gazeta do Pará', [Validators.required]],
    content: ['', [Validators.required]],
    newsMidia: [[] as NewsMedia[], [Validators.required]],
    newsVideo: [[] as NewsVideo[]],
    published: [this.getCurrentDateTime(), [Validators.required]],
    isEmphasis: [false],
    validity: [null as string | null],
    status: ['ACTIVE'],
  });

  // Signal que observa as mudanças do formulário para reatividade dos computed
  formValue = toSignal(this.form.valueChanges, {
    initialValue: this.form.value,
  });

  // Computed: contagem de campos preenchidos por aba
  infoFieldsStatus = computed(() => {
    const v = this.formValue();
    if (!v) return { filled: 0, total: 4 };
    let filled = 0;
    const total = 4;
    if (v.categoryId && (v.categoryId as number[]).length > 0) filled++;
    if (v.title) filled++;
    if (v.subtitle) filled++;
    if (v.author) filled++;
    return { filled, total };
  });

  contentFieldStatus = computed(() => {
    const v = this.formValue();
    if (!v) return { filled: 0, total: 1 };
    return { filled: v.content ? 1 : 0, total: 1 };
  });

  mediaFieldStatus = computed(() => {
    const v = this.formValue();
    if (!v) return { count: 0 };
    const count = v.newsMidia ? (v.newsMidia as NewsMedia[]).length : 0;
    return { count };
  });

  errorMessage = {
    title: {
      required: 'Título é obrigatório',
    },
    subtitle: {
      required: 'Subtítulo é obrigatório',
    },
    slug: {
      required: 'Slug é obrigatório',
    },
    author: {
      required: 'Autor é obrigatório',
    },
    content: {
      required: 'Conteúdo é obrigatório',
    },
  };

  statusOptions = [
    { value: 'ACTIVE', label: 'Ativo' },
    { value: 'INACTIVE', label: 'Inativo' },
  ];

  async ngOnInit() {
    await this.checkEdit();
    this.getCategories();
    this.formValidator
      .InitValidation(this.form, this.errorMessage)
      .pipe(takeUntil(this.destroy$))
      .subscribe((errorMessages) => {
        this.displayError.set(errorMessages);
      });
    this.form
      .get('slug')
      ?.valueChanges.pipe(takeUntil(this.destroy$))
      .subscribe((value) => {
        if (value) {
          this.formatedSlug(value);
        }
      });
  }
  async checkEdit() {
    return firstValueFrom(this.activeRouter.params)
      .then((param) => {
        const newsId = param['id'];
        if (newsId) {
          this.isEdit.set(true);
          this.isLoadingEdit.set(true);
          this.newsId = Number(newsId);
          firstValueFrom(this.newsService.getById(newsId))
            .then((resp) => {
              console.log(resp);
              const news = resp as News;
              this.editNewsTitle.set(news.title || '');
              this.form.patchValue({
                ...resp,
                // Formata a data de validade para YYYY-MM-DD se existir
                validity: news.validity ? news.validity.split('T')[0] : null,
              });
              this.exportEditNewsMedia.set({
                newsMedia: news.mediaNews,
                newsVideos: news.videoNews,
              });
              this.isLoadingEdit.set(false);
            })
            .catch((err) => {
              this.isLoadingEdit.set(false);
              throw err;
            });
        }
      })
      .catch((error) => {
        throw error;
      });
  }
  getCategories() {
    this.categoryService
      .getActive()
      .pipe(first())
      .subscribe((categories) => {
        this.availableCategories.set(categories as Category[]);
      });
  }

  onSubmit() {
    if (this.isSavingNews()) {
      return;
    }

    this.isSavingNews.set(true);
    const formValue = this.form.value;
    const isEmphasisValue = formValue.isEmphasis as boolean;

    // Prepara os dados sem o isEmphasis para primeiro salvar a notícia
    const newsData = {
      title: formValue.title as string,
      subtitle: formValue.subtitle as string,
      slug: formValue.slug as string,
      author: formValue.author as string,
      content: formValue.content as string,
      categoryId: formValue.categoryId as number[],
      published: formValue.published as string,
      isEmphasis: formValue.isEmphasis as boolean,
      validity: formValue.validity as string | null,
      status: formValue.status as string,
      mediaNews: (formValue['newsMidia'] as NewsMedia[]).filter(m => m.imgSize),
      videoNews: formValue['newsVideo'] as NewsVideo[],
    };

    if (this.isEdit()) {
      this.newsService
        .update(this.newsId as number, newsData as News)
        .subscribe({
          next: (res) => {
            // Após salvar a notícia, atualiza o destaque usando a nova lógica
            this.handleEmphasisUpdate(res.id, isEmphasisValue, formValue);
          },
          error: (err) => {
            this.isSavingNews.set(false);
            this.alertService.error('Erro', 'Erro ao editar notícia!');
            throw err;
          },
        });
    } else {
      this.newsService.create(newsData as News).subscribe({
        next: (res) => {
          // Após criar a notícia, atualiza o destaque usando a nova lógica
          this.handleEmphasisUpdate(res.id, isEmphasisValue, formValue);
        },
        error: (err) => {
          this.isSavingNews.set(false);
          this.alertService.error('Erro', 'Erro ao criar notícia!');
          throw err;
        },
      });
    }
  }

  private handleEmphasisUpdate(
    newsId: number,
    isEmphasisValue: boolean,
    formValue: Record<string, unknown>
  ) {
    // Atualizar newsId imediatamente para evitar deletar imagens no OnDestroy
    this.newsId = newsId;

    // Agora gerencia o destaque com a nova lógica
    this.newsService.updateEmphasis(newsId, isEmphasisValue).subscribe({
      next: (emphasisResult) => {
        // Se removeu o destaque de outra notícia, mostra uma notificação
        if (emphasisResult.removedEmphasis) {
          this.alertService.info(
            'Limite de destaques atingido',
            `A notícia "${emphasisResult.removedEmphasis.title}" foi removida dos destaques para adicionar a nova.`
          );
        }

        // Agora processa o upload de mídias
        this.processMediaUpload(formValue, newsId);
      },
      error: (err) => {
        // Se falhar a atualização do destaque, ainda processa as mídias
        console.error('Erro ao atualizar destaque:', err);
        this.processMediaUpload(formValue, newsId);
      },
    });
  }

  private processMediaUpload(
    formValue: Record<string, unknown>,
    newsId: number
  ) {
    const newsMedia = formValue['newsMidia'] as NewsMedia[];
    const midias: FormData[] = [];
    const seenFiles = new Set<string>();

    newsMedia.forEach((media) => {
      if (media.file) {
        const fileKey = `${media.file.name}_${media.file.size}_${media.file.lastModified}_${media.file.type}`;
        if (seenFiles.has(fileKey)) {
          return;
        }

        seenFiles.add(fileKey);

        const formMidia = new FormData();
        formMidia.append('postId', newsId.toString());
        formMidia.append('emphasis', media.emphasis.toString());
        formMidia.append('author', media.author as string);
        formMidia.append('date', media.date as string);
        formMidia.append('file', media.file as File);
        midias.push(formMidia);
      }
    });

    if (midias.length > 0) {
      this.isUploadingMedia.set(true);
      this.mediaUploadProgress.set({ current: 0, total: midias.length });

      from(midias)
        .pipe(
          mergeMap((midia) => {
            return this.newsService.uploadMedia(midia).pipe(
              tap(() => {
                this.mediaUploadProgress.update((p) => ({
                  ...p,
                  current: p.current + 1,
                }));
              }),
            );
          }, 3), // Upload de até 3 imagens simultaneamente para performance
          toArray(),
        )
        .subscribe({
          next: () => {
            this.isUploadingMedia.set(false);
            this.isSavingNews.set(false);
            this.alertService.success('Sucesso', 'Notícia salva com sucesso!');
            this.onReset();
            this.newsMidiaComponent?.resetMedia();
            this.checkEdit();
          },
          error: (err) => {
            this.isUploadingMedia.set(false);
            this.isSavingNews.set(false);
            this.alertService.error('Erro', 'Erro ao salvar mídia de notícia!');
            throw err;
          },
        });
    } else {
      this.isSavingNews.set(false);
      this.alertService.success('Sucesso', 'Notícia salva com sucesso!');
      this.onReset();
      this.newsMidiaComponent?.resetMedia();
      this.checkEdit();
    }
  }

  setActiveTab(tab: 'info' | 'content' | 'media') {
    this.activeTab = tab;
  }

  toggleSidebar() {
    this.sidebarOpen.set(!this.sidebarOpen());
  }

  urlDisplaySet(urlValue: string) {
    this.urlDisplay.set(urlValue);
  }
  setSlug() {
    const title = this.form.get('title')?.value as string;
    this.formatedSlug(title);
  }

  formatedSlug(value?: string) {
    if (!value) {
      return;
    }
    const slug = value
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim();

    const current = this.form.get('slug')?.value ?? '';
    // Evita loop: valueChanges do slug disparava patchValue e reentrava sem fim (Maximum call stack).
    if (slug === current) {
      this.urlDisplaySet(slug);
      return;
    }
    this.form.patchValue({ slug }, { emitEvent: false });
    this.urlDisplaySet(slug);
  }

  onFormValue(formValue: { newsVideo: NewsVideo[]; newsMedia: NewsMedia[] }) {
    this.form.patchValue({
      newsVideo: formValue.newsVideo,
      newsMidia: formValue.newsMedia,
    });
  }

  onReset() {
    this.form.reset({
      author: 'Gazeta do Pará',
      status: 'ACTIVE',
      published: this.getCurrentDateTime(),
      isEmphasis: false,
      newsMidia: [],
      newsVideo: [],
      categoryId: [],
    });
    this.isSavingNews.set(false);
    this.isUploadingMedia.set(false);
    this.activeTab = 'info';
  }

  // Método melhorado para obter data e hora atual
  private getCurrentDateTime(): string {
    const now = new Date();
    // Ajustar para timezone local
    const offset = now.getTimezoneOffset();
    const localTime = new Date(now.getTime() - offset * 60 * 1000);
    return localTime.toISOString().slice(0, 16);
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
