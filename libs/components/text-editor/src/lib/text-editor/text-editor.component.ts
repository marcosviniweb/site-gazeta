import {
  Component,
  forwardRef,
  OnInit,
  OnDestroy,
  Input,
  Output,
  EventEmitter,
  ViewChild,
  ElementRef,
  signal,
  ChangeDetectorRef,
  inject,
} from '@angular/core';

import { ControlValueAccessor, FormControl, NG_VALUE_ACCESSOR, ReactiveFormsModule } from '@angular/forms';
import * as CKBuilding from '../ckeditor/build/ckeditor';
import { CKEditorModule } from '@ckeditor/ckeditor5-angular';
import { UploadAdapter } from '../upload-adapter/upload-adapter';
import {
  escapeHtmlAttribute,
  uploadContentVideoFile,
} from '../upload-adapter/video-content-upload';

@Component({
  selector: 'lib-text-editor',
  imports: [CKEditorModule, ReactiveFormsModule],
  template: `
    @if (enableContentVideoUpload) {
      <div class="video-insert-hint card-hint">
        <span class="material-icons hint-icon" aria-hidden="true">info</span>
        <div class="hint-text">
          <strong>Como inserir vídeo:</strong> clique dentro do texto do editor na posição desejada (aparece o cursor piscando).
          Em seguida clique em <strong>Inserir vídeo</strong> e escolha o arquivo MP4. O player será inserido nesse ponto.
        </div>
      </div>
      @if (videoInsertBanner()) {
        <div class="video-insert-feedback card-hint success" role="status">
          <span class="material-icons hint-icon" aria-hidden="true">check_circle</span>
          <div class="hint-text">{{ videoInsertBanner() }}</div>
        </div>
      }
      <div class="text-editor-video-row">
        <button
          type="button"
          class="btn-insert-video"
          [disabled]="!editorInstance || videoUploading"
          (click)="triggerVideoFilePick()"
        >
          <span class="material-icons btn-insert-video__icon" aria-hidden="true">cloud_upload</span>
          <span class="btn-insert-video__text">{{
            videoUploading ? 'Enviando vídeo…' : 'Inserir vídeo (MP4)'
          }}</span>
        </button>
      </div>
    }
    <input
      #videoFileInput
      type="file"
      accept="video/mp4,video/quicktime,video/x-m4v,.mp4,.mov,.m4v"
      hidden
      (change)="onVideoFileSelected($event)"
    />
    <ckeditor
      tagName="textarea"
      [editor]="editor"
      [config]="editorConfig"
      [data]="value"
      [formControl]="formControl"
      (ready)="onReady($event)"
      (blur)="onTouched()"
    ></ckeditor>
  `,
  styles: [
    `
      textarea {
        min-height: 300px;
      }
      .text-editor-video-row {
        margin-bottom: 12px;
      }
      .card-hint {
        display: flex;
        gap: 10px;
        align-items: flex-start;
        padding: 12px 14px;
        margin-bottom: 10px;
        border-radius: 8px;
        border: 1px solid #cfe2ff;
        background: #f0f7ff;
        font-size: 13px;
        line-height: 1.45;
        color: #1a3a5c;
      }
      .card-hint.success {
        border-color: #c3e6cb;
        background: #edf7ef;
        color: #155724;
      }
      .hint-icon {
        font-size: 22px;
        flex-shrink: 0;
        opacity: 0.85;
      }
      .hint-text strong {
        font-weight: 600;
      }
      .btn-insert-video {
        display: inline-flex;
        align-items: center;
        gap: 0.5rem;
        padding: 0.65rem 1.2rem;
        font-size: 0.9375rem;
        font-weight: 600;
        font-family: inherit;
        line-height: 1.2;
        color: #fff;
        cursor: pointer;
        border: none;
        border-radius: 8px;
        background: linear-gradient(135deg, #b71c1c 0%, #0a80c4 100%);
        box-shadow: 0 2px 10px rgba(10, 128, 196, 0.35);
        transition:
          transform 0.15s ease,
          box-shadow 0.15s ease,
          filter 0.15s ease;
      }
      .btn-insert-video:hover:not(:disabled) {
        transform: translateY(-1px);
        box-shadow: 0 6px 18px rgba(10, 128, 196, 0.42);
        filter: brightness(1.04);
      }
      .btn-insert-video:active:not(:disabled) {
        transform: translateY(0);
        box-shadow: 0 2px 8px rgba(10, 128, 196, 0.3);
      }
      .btn-insert-video:focus-visible {
        outline: 2px solid #0a80c4;
        outline-offset: 2px;
      }
      .btn-insert-video__icon {
        font-size: 22px;
        line-height: 1;
        opacity: 0.95;
      }
      .btn-insert-video__text {
        white-space: nowrap;
      }
      .btn-insert-video:disabled {
        opacity: 0.62;
        cursor: not-allowed;
        transform: none;
        box-shadow: none;
        filter: none;
      }
      :host ::ng-deep .raw-html-embed__preview-content video.news-inline-video,
      :host ::ng-deep .raw-html-embed__preview-content video {
        display: block;
        width: 100%;
        max-height: min(420px, 70vh);
        border-radius: 8px;
        background: #0f0f0f;
        box-shadow: 0 2px 10px rgba(0, 0, 0, 0.15);
      }
      :host ::ng-deep .raw-html-embed__preview {
        border-radius: 8px;
        border: 1px solid #e2e6ea;
        overflow: hidden;
        margin-top: 4px;
      }
    `,
  ],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => TextEditorComponent),
      multi: true,
    },
  ],
})
export class TextEditorComponent implements ControlValueAccessor, OnInit, OnDestroy {
  private cdr = inject(ChangeDetectorRef);

  @Input() apiUrl = 'https://gazetadopara.com/api';
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  @Input() resetFormControl: any;
  @Input() newsId?: number;
  /** Exibe botão para upload de vídeo embutido no texto (MP4/MOV). */
  @Input() enableContentVideoUpload = true;
  @Output() ready = new EventEmitter<unknown>();
  @ViewChild('videoFileInput') videoFileInput!: ElementRef<HTMLInputElement>;

  protected editor = CKBuilding.default || CKBuilding;
  protected value = '';
  protected disable = false;
  protected editorConfig: Record<string, unknown> = {};
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  protected editorInstance: any = null;
  protected videoUploading = false;
  /** Card de confirmação após inserir vídeo no HTML. */
  videoInsertBanner = signal<string | null>(null);
  private videoBannerClearTimer: ReturnType<typeof setTimeout> | null = null;
  private previousContentAssetUrls: string[] = [];
  /** Evita DELETE no servidor quando getData() do CKEditor oscila (embed HTML) e parece que o asset sumiu. */
  private contentAssetRemovalDebounce: ReturnType<typeof setTimeout> | null = null;
  private readonly contentAssetRemovalDebounceMs = 2500;

  // eslint-disable-next-line @typescript-eslint/no-empty-function, @typescript-eslint/no-unused-vars
  private onChange = (_v: string) => {};
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  protected onTouched = () => {};
  formControl = new FormControl('');

  ngOnInit(): void {
    // Com showPreviews: false (padrão do CKEditor), o Trecho HTML mostra só o textarea com código.
    // Com true + sanitizeHtml, o preview renderiza o <video> no painel (card visual).
    this.editorConfig = {
      htmlEmbed: {
        showPreviews: true,
        sanitizeHtml: (rawHtml: string) => this.sanitizeHtmlEmbedForPreview(rawHtml),
      },
    };
    this.formControl.valueChanges.subscribe((value) => {
      this.onChange(value as string);
    });
  }

  /**
   * Sanitização mínima para preview do HtmlEmbed (evita XSS; permite vídeo/parágrafo do painel).
   */
  private sanitizeHtmlEmbedForPreview(rawHtml: string): { html: string; hasChanged: boolean } {
    const trimmed = (rawHtml ?? '').trim();
    if (!trimmed) {
      return { html: '', hasChanged: false };
    }
    try {
      const doc = new DOMParser().parseFromString(`<div id="ck-sanitize-root">${trimmed}</div>`, 'text/html');
      const root = doc.getElementById('ck-sanitize-root');
      if (!root) {
        return { html: '', hasChanged: true };
      }
      const out = doc.createElement('div');
      const allowedBlock = new Set(['P', 'FIGURE', 'DIV']);
      const allowedInline = new Set(['SPAN', 'BR', 'SOURCE']);

      const isAllowedMediaUrl = (url: string): boolean => {
        const u = url.trim();
        if (!u) {
          return false;
        }
        if (u.startsWith('/')) {
          return !/[\s"'<>]/.test(u);
        }
        try {
          const parsed = new URL(u);
          return parsed.protocol === 'http:' || parsed.protocol === 'https:';
        } catch {
          return false;
        }
      };

      const copyVideo = (el: Element, target: HTMLElement): void => {
        const v = doc.createElement('video');
        for (const attr of ['class', 'playsinline', 'preload', 'width', 'height', 'poster']) {
          if (el.hasAttribute(attr)) {
            v.setAttribute(attr, el.getAttribute(attr) || '');
          }
        }
        if (el.hasAttribute('controls')) {
          v.setAttribute('controls', '');
        }
        const src = el.getAttribute('src');
        if (src && isAllowedMediaUrl(src)) {
          v.setAttribute('src', src.trim());
        }
        for (const child of Array.from(el.children)) {
          if (child.tagName === 'SOURCE') {
            const s = child.getAttribute('src');
            if (s && isAllowedMediaUrl(s)) {
              const srcEl = doc.createElement('source');
              srcEl.setAttribute('src', s.trim());
              const t = child.getAttribute('type');
              if (t) {
                srcEl.setAttribute('type', t);
              }
              v.appendChild(srcEl);
            }
          }
        }
        target.appendChild(v);
      };

      const walk = (node: Node, parent: HTMLElement): void => {
        if (node.nodeType === Node.TEXT_NODE) {
          const text = node.textContent ?? '';
          if (text) {
            parent.appendChild(doc.createTextNode(text));
          }
          return;
        }
        if (node.nodeType !== Node.ELEMENT_NODE) {
          return;
        }
        const el = node as Element;
        const tag = el.tagName;

        if (tag === 'VIDEO') {
          copyVideo(el, parent);
          return;
        }
        if (tag === 'SOURCE') {
          return;
        }
        if (allowedBlock.has(tag) || allowedInline.has(tag)) {
          const clone = doc.createElement(tag.toLowerCase());
          if (el.hasAttribute('class')) {
            clone.setAttribute('class', el.getAttribute('class') || '');
          }
          for (const child of Array.from(el.childNodes)) {
            walk(child, clone);
          }
          if (clone.childNodes.length > 0 || tag === 'BR') {
            parent.appendChild(clone);
          }
          return;
        }
        for (const child of Array.from(el.childNodes)) {
          walk(child, parent);
        }
      };

      for (const child of Array.from(root.childNodes)) {
        walk(child, out);
      }

      const html = out.innerHTML.trim();
      if (!html) {
        return { html: '', hasChanged: trimmed.length > 0 };
      }
      return { html, hasChanged: html !== trimmed };
    } catch {
      return { html: '', hasChanged: true };
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onReady(editor: any): void {
    this.editorInstance = editor;

    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      editor.plugins.get('FileRepository').createUploadAdapter = (loader: any) => {
        return new UploadAdapter(loader, this.apiUrl);
      };

      editor.model.document.on('change:data', () => {
        this.scheduleContentAssetRemovalCheck();
      });

      this.updateTrackedContentUrls();
    } catch {
      /* FileRepository / plugin indisponível neste contexto */
    }

    this.ready.emit(editor);
  }

  /**
   * Mesma ideia do backend: DOMParser encontra &lt;video&gt; dentro de Trecho HTML (raw-html-embed)
   * onde regex em linha única falha; regex multiline é fallback.
   */
  private extractContentAssetUrls(html: string): string[] {
    if (!html?.trim()) {
      return [];
    }
    const push = (raw: string | null | undefined, bucket: string[]) => {
      const u = raw?.trim().replace(/&amp;/g, '&');
      if (u?.includes('/uploads/')) {
        bucket.push(u);
      }
    };
    const fromDom: string[] = [];
    try {
      const doc = new DOMParser().parseFromString(`<div class="ck-asset-extract">${html}</div>`, 'text/html');
      const root = doc.querySelector('.ck-asset-extract');
      if (root) {
        root.querySelectorAll('img[src]').forEach((el) => push(el.getAttribute('src'), fromDom));
        root.querySelectorAll('video[src]').forEach((el) => push(el.getAttribute('src'), fromDom));
        root.querySelectorAll('source[src]').forEach((el) => push(el.getAttribute('src'), fromDom));
      }
    } catch {
      /* só regex */
    }
    return [...new Set([...fromDom, ...this.extractContentAssetUrlsRegex(html)])];
  }

  private extractContentAssetUrlsRegex(html: string): string[] {
    const urls: string[] = [];
    const push = (u: string) => {
      const t = u.trim().replace(/&amp;/g, '&');
      if (t.includes('/uploads/')) {
        urls.push(t);
      }
    };
    const patterns = [
      /<img\b[\s\S]*?\bsrc\s*=\s*["']([^"']+)["']/gi,
      /<video\b[\s\S]*?\bsrc\s*=\s*["']([^"']+)["']/gi,
      /<source\b[\s\S]*?\bsrc\s*=\s*["']([^"']+)["']/gi,
    ];
    for (const re of patterns) {
      let m: RegExpExecArray | null;
      while ((m = re.exec(html)) !== null) {
        push(m[1]);
      }
    }
    return urls;
  }

  private scheduleContentAssetRemovalCheck(): void {
    if (this.contentAssetRemovalDebounce) {
      clearTimeout(this.contentAssetRemovalDebounce);
    }
    this.contentAssetRemovalDebounce = setTimeout(() => {
      this.contentAssetRemovalDebounce = null;
      this.detectRemovedContentAssets();
    }, this.contentAssetRemovalDebounceMs);
  }

  private updateTrackedContentUrls(): void {
    if (this.editorInstance) {
      const html = this.editorInstance.getData();
      this.previousContentAssetUrls = this.extractContentAssetUrls(html);
    }
  }

  private detectRemovedContentAssets(): void {
    if (!this.editorInstance) {
      return;
    }

    const currentHtml = this.editorInstance.getData();
    const currentUrls = this.extractContentAssetUrls(currentHtml);
    const removedUrls = this.previousContentAssetUrls.filter((url) => !currentUrls.includes(url));

    removedUrls.forEach((url) => {
      this.deleteContentAssetFromServer(url).catch(() => undefined);
    });

    this.previousContentAssetUrls = currentUrls;
  }

  private async deleteContentAssetFromServer(url: string): Promise<void> {
    const response = await fetch(`${this.apiUrl}/content-media`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url }),
    });
    if (!response.ok && response.status !== 404) {
      await response.json().catch(() => ({}));
    }
  }

  triggerVideoFilePick(): void {
    this.videoFileInput?.nativeElement?.click();
  }

  async onVideoFileSelected(event: Event): Promise<void> {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    input.value = '';
    if (!file || !this.editorInstance) {
      return;
    }

    this.videoUploading = true;
    this.cdr.markForCheck();
    try {
      const uploadResult = await uploadContentVideoFile(file, this.apiUrl);
      const url = uploadResult.url;
      const inserted = this.insertVideoAtCursor(this.editorInstance, url);
      this.updateTrackedContentUrls();
      if (inserted) {
        this.showVideoInsertedBanner();
        this.scrollLastVideoIntoView(this.editorInstance);
      } else {
        if (this.videoBannerClearTimer) {
          clearTimeout(this.videoBannerClearTimer);
        }
        this.videoInsertBanner.set(
          'Não foi possível inserir o vídeo no editor. Abra Código-Fonte e cole o HTML do player com a URL do arquivo, se necessário.'
        );
        this.videoBannerClearTimer = setTimeout(() => {
          this.videoInsertBanner.set(null);
          this.videoBannerClearTimer = null;
          this.cdr.markForCheck();
        }, 12000);
        this.cdr.markForCheck();
      }
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Erro ao enviar vídeo.');
    } finally {
      this.videoUploading = false;
      this.cdr.markForCheck();
    }
  }

  private showVideoInsertedBanner(): void {
    if (this.videoBannerClearTimer) {
      clearTimeout(this.videoBannerClearTimer);
    }
    this.videoInsertBanner.set(
      'Vídeo inserido na posição do cursor. Role o texto abaixo para ver o player; você pode continuar digitando antes ou depois dele.'
    );
    this.videoBannerClearTimer = setTimeout(() => {
      this.videoInsertBanner.set(null);
      this.videoBannerClearTimer = null;
      this.cdr.markForCheck();
    }, 10000);
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private scrollLastVideoIntoView(editor: any): void {
    setTimeout(() => {
      try {
        const root = editor.ui?.view?.editable?.element as HTMLElement | undefined;
        if (!root) {
          return;
        }
        const videos = root.querySelectorAll(
          'video.news-inline-video, .news-inline-video video, video[src*="/uploads/"]'
        );
        let target = videos[videos.length - 1] as HTMLElement | undefined;
        if (!target) {
          const embed = root.querySelector(
            '.ck-widget.raw-html-embed:last-of-type .raw-html-embed__preview-content'
          ) as HTMLElement | null;
          target = embed ?? undefined;
        }
        target?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      } catch {
        /* scroll opcional */
      }
    }, 200);
  }

  /**
   * HtmlEmbedCommand do CKEditor 5: {@code editor.execute('htmlEmbed', stringHtml)} — o 2º argumento é a STRING.
   * Passar {@code { value: '...' }} grava [object Object] no atributo e aparece "Trecho HTML" quebrado.
   * Depois tentamos toModel (GHS) e, por último, htmlEmbed com outros fragmentos.
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private insertVideoAtCursor(editor: any, videoUrl: string): boolean {
    const safe = escapeHtmlAttribute(videoUrl);
    const videoTag = `<video class="news-inline-video" controls playsinline preload="metadata" src="${safe}"></video>`;

    if (this.tryHtmlEmbedStrategies(editor, videoTag, videoUrl)) {
      return true;
    }

    const candidates: string[] = [
      `<p>${videoTag}</p>`,
      `<figure class="news-inline-video">${videoTag}</figure>`,
      `<div class="news-inline-video">${videoTag}</div>`,
      `<p>${videoTag}</p><p>&nbsp;</p>`,
    ];

    for (let i = 0; i < candidates.length; i++) {
      const html = candidates[i];
      if (this.tryInsertVideoHtml(editor, html, videoUrl)) {
        return true;
      }
    }

    return false;
  }

  /** HtmlEmbed: segundo argumento deve ser string (CKEditor 5 HtmlEmbedCommand.execute(value?: string)). */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private tryHtmlEmbedStrategies(editor: any, videoTag: string, videoUrl: string): boolean {
    const cmd = editor.commands?.get?.('htmlEmbed');
    if (!cmd?.isEnabled) {
      return false;
    }

    const chunk = `<p>${videoTag}</p>`;
    try {
      editor.execute('htmlEmbed', chunk);
    } catch {
      return false;
    }

    const data = editor.getData();
    if (this.insertionContainsVideoUrl(data, videoUrl)) {
      return true;
    }

    const root = editor.ui?.view?.editable?.element as HTMLElement | undefined;
    if (root?.innerHTML && this.insertionContainsVideoUrl(root.innerHTML, videoUrl)) {
      return true;
    }

    if (root?.querySelector('video[src*="/uploads/"], video.news-inline-video')) {
      return true;
    }

    return false;
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private tryInsertVideoHtml(editor: any, html: string, videoUrl: string): boolean {
    try {
      const viewFragment = editor.data.processor.toView(html);
      const modelFragment = editor.data.toModel(viewFragment);
      if (!modelFragment || modelFragment.childCount === 0) {
        return false;
      }
      editor.model.change(() => {
        editor.model.insertContent(modelFragment);
      });
      return this.editorHtmlContainsVideo(editor.getData(), videoUrl);
    } catch {
      return false;
    }
  }

  /** Conteúdo salvo contém a URL do arquivo (válido para &lt;video src&gt; ou embed bruto). */
  private insertionContainsVideoUrl(data: string, videoUrl: string): boolean {
    if (!data) {
      return false;
    }
    if (data.includes(videoUrl)) {
      return true;
    }
    return data.includes(videoUrl.replace(/&/g, '&amp;'));
  }

  private editorHtmlContainsVideo(data: string, videoUrl: string): boolean {
    if (!this.insertionContainsVideoUrl(data, videoUrl)) {
      return false;
    }
    return /<video[\s>]/i.test(data);
  }

  writeValue(value: string): void {
    const newValue = value || '';
    this.value = newValue;
    
    // Sincroniza com o FormControl interno para que o CKEditor reflita a mudança
    if (this.formControl.value !== newValue) {
      this.formControl.setValue(newValue, { emitEvent: false });
    }

    if (this.editorInstance) {
      setTimeout(() => this.updateTrackedContentUrls(), 100);
    }
  }

  registerOnChange(fn: (value: string) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    if (isDisabled) {
      this.formControl.disable();
    } else {
      this.formControl.enable();
    }
  }

  ngOnDestroy(): void {
    if (this.videoBannerClearTimer) {
      clearTimeout(this.videoBannerClearTimer);
      this.videoBannerClearTimer = null;
    }
    if (this.contentAssetRemovalDebounce) {
      clearTimeout(this.contentAssetRemovalDebounce);
      this.contentAssetRemovalDebounce = null;
    }

    if (this.newsId) {
      return;
    }

    if (this.editorInstance) {
      try {
        const html = this.editorInstance.getData();
        const urls = this.extractContentAssetUrls(html);
        urls.forEach((url) => {
          this.deleteContentAssetFromServer(url).catch(() => undefined);
        });
      } catch {
        /* ignorar falha ao limpar ao destruir */
      }
    }
  }
}
