import { Pipe, PipeTransform, inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';

/**
 * Tipo de bloco de conteúdo: HTML puro ou vídeo inline.
 */
export interface ContentBlock {
  type: 'html' | 'video';
  /** HTML sanitizado para blocos 'html'; URL do vídeo para blocos 'video'. */
  content: string;
  /** SafeHtml para uso direto em [innerHTML] — presente apenas em blocos 'html'. */
  safeHtml?: SafeHtml;
}

/**
 * Função pura que divide o HTML do conteúdo da notícia em blocos
 * de texto (html) e vídeos inline (video).
 *
 * Detecta `<video>` em vários formatos:
 * - `<video src="...">` direto
 * - `<video><source src="..."></video>`
 * - `<video>` dentro de `<p>`, `<figure>`, `<div>` (wrapper do CKEditor)
 */
export function parseContentBlocks(
  html: string | null | undefined,
  sanitizer: DomSanitizer,
  isBrowser: boolean
): ContentBlock[] {
  const raw = (html ?? '').trim();
  if (!raw) {
    return [createHtmlBlock('', sanitizer)];
  }

  // SSR: sem DOMParser, retorna bloco único com o HTML bruto
  if (!isBrowser) {
    return [createHtmlBlock(raw, sanitizer)];
  }

  return parseBlocksInternal(raw, sanitizer);
}

function parseBlocksInternal(html: string, sanitizer: DomSanitizer): ContentBlock[] {
  const doc = new DOMParser().parseFromString(
    `<div id="cb-root">${html}</div>`,
    'text/html'
  );
  const root = doc.getElementById('cb-root');
  if (!root) {
    return [createHtmlBlock(html, sanitizer)];
  }

  const blocks: ContentBlock[] = [];
  let htmlAccumulator = '';

  const flushHtml = () => {
    const trimmed = htmlAccumulator.trim();
    if (trimmed) {
      blocks.push(createHtmlBlock(trimmed, sanitizer));
    }
    htmlAccumulator = '';
  };

  for (const node of Array.from(root.childNodes)) {
    const videoSrc = extractVideoSrc(node);

    if (videoSrc) {
      flushHtml();
      blocks.push({ type: 'video', content: videoSrc });
    } else {
      // Serializa o nó de volta para HTML
      if (node.nodeType === Node.TEXT_NODE) {
        htmlAccumulator += node.textContent ?? '';
      } else if (node.nodeType === Node.ELEMENT_NODE) {
        htmlAccumulator += (node as Element).outerHTML;
      }
    }
  }

  flushHtml();

  // Se não encontrou nenhum bloco, retorna HTML original
  if (blocks.length === 0) {
    return [createHtmlBlock(html, sanitizer)];
  }

  return blocks;
}

/**
 * Tenta extrair a URL de um vídeo de um nó DOM.
 * Detecta:
 * - `<video src="...">` direto
 * - `<video><source src="..."></video>`
 * - Wrappers aninhados como `<div class="raw-html-embed"><p><video></p></div>` (formato do CKEditor htmlEmbed)
 */
function extractVideoSrc(node: Node): string | null {
  if (node.nodeType !== Node.ELEMENT_NODE) {
    return null;
  }

  const el = node as Element;

  // Caso 1: É um <video> direto
  if (el.tagName === 'VIDEO') {
    return getVideoUrl(el);
  }

  // Caso 2: É um wrapper contendo apenas um filho significativo
  // Percorre recursivamente wrappers aninhados (div > p > video, figure > video, etc.)
  const wrapperTags = new Set(['P', 'FIGURE', 'DIV', 'SECTION']);
  if (wrapperTags.has(el.tagName)) {
    const soleChild = findSoleSignificantChild(el);
    if (!soleChild) {
      return null;
    }
    // Filho é um <video> direto
    if (soleChild.tagName === 'VIDEO') {
      return getVideoUrl(soleChild);
    }
    // Filho é outro wrapper — busca recursivamente
    if (wrapperTags.has(soleChild.tagName)) {
      return extractVideoSrc(soleChild);
    }
  }

  return null;
}

/**
 * Retorna o único elemento filho significativo do container.
 * Ignora nós de texto vazios (whitespace).
 * Retorna null se houver 0 ou mais de 1 filho significativo.
 */
function findSoleSignificantChild(container: Element): Element | null {
  const significantChildren = Array.from(container.childNodes).filter(
    (n) => {
      if (n.nodeType === Node.TEXT_NODE) {
        return (n.textContent ?? '').trim().length > 0;
      }
      return n.nodeType === Node.ELEMENT_NODE;
    }
  );

  if (significantChildren.length !== 1) {
    return null;
  }

  const child = significantChildren[0];
  if (child.nodeType === Node.ELEMENT_NODE) {
    return child as Element;
  }

  return null;
}

/**
 * Extrai a URL do vídeo a partir de `src` ou `<source src>`.
 */
function getVideoUrl(videoEl: Element): string | null {
  // src direto no <video>
  const src = videoEl.getAttribute('src')?.trim();
  if (src) {
    return decodeHtmlEntities(src);
  }

  // <source src="..."> como filho
  const source = videoEl.querySelector('source[src]');
  if (source) {
    const sourceSrc = source.getAttribute('src')?.trim();
    if (sourceSrc) {
      return decodeHtmlEntities(sourceSrc);
    }
  }

  return null;
}

function decodeHtmlEntities(value: string): string {
  return value.replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#39;/g, "'");
}

function createHtmlBlock(html: string, sanitizer: DomSanitizer): ContentBlock {
  return {
    type: 'html',
    content: html,
    safeHtml: sanitizer.bypassSecurityTrustHtml(html),
  };
}

/**
 * Pipe Angular standalone que pode ser usado diretamente no template.
 * Para uso programático, use a função `parseContentBlocks` diretamente.
 */
@Pipe({
  name: 'contentBlocks',
  pure: true,
  standalone: true,
})
export class ContentBlocksPipe implements PipeTransform {
  private platformId = inject(PLATFORM_ID);
  private sanitizer = inject(DomSanitizer);

  transform(html: string | null | undefined): ContentBlock[] {
    return parseContentBlocks(html, this.sanitizer, isPlatformBrowser(this.platformId));
  }
}
