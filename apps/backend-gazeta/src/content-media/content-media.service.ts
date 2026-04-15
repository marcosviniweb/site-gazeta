import {
  Injectable,
  Logger,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ContentMediaResponseDto } from './dto/content-media-response.dto';
import * as fs from 'fs';
import * as path from 'path';
import { promisify } from 'util';
import {
  writeFile,
  readdir,
  rm,
  stat,
  unlink as unlinkFile,
} from 'fs/promises';
import sharp from 'sharp';
import { sanitizeFileName } from '../utils/file-name-sanitizer';

const mkdir = promisify(fs.mkdir);
const unlink = promisify(fs.unlink);

@Injectable()
export class ContentMediaService {
  private readonly logger = new Logger(ContentMediaService.name);
  private readonly baseUploadDir = 'uploads';

  constructor(private prisma: PrismaService) {}

  /**
   * Faz upload de uma imagem de conteúdo (apenas tamanho original)
   */
  private cleanBaseUrl(baseUrl: string): string {
    let clean = baseUrl.replace(/\\/g, '/');
    clean = clean.replace(/^https,?\s+/i, 'https://');
    clean = clean.replace(/^http,?\s+/i, 'http://');
    clean = clean.replace(/,+$/, '');
    return clean;
  }

  async uploadContentMedia(
    file: any,
    baseUrl: string,
  ): Promise<ContentMediaResponseDto> {
    if (!file) {
      throw new BadRequestException('Arquivo não fornecido');
    }

    // Validar tipo de arquivo
    const allowedMimeTypes = [
      'image/jpeg',
      'image/jpg',
      'image/png',
      'image/webp',
    ];
    if (!allowedMimeTypes.includes(file.mimetype)) {
      throw new BadRequestException(
        'Tipo de arquivo não permitido. Use JPG, PNG ou WEBP',
      );
    }

    // Gerar nome único para o arquivo (formato: {timestamp}_{nome_sanitizado})
    const timestamp = Date.now();
    const randomId = Math.random().toString(36).substring(2, 15);
    const sanitizedOriginalName = sanitizeFileName(file.originalname);
    const filename = `${timestamp}_${randomId}_${sanitizedOriginalName}`;

    // Criar diretório baseado no timestamp
    const timestampDir = path.join(this.baseUploadDir, timestamp.toString());
    await this.ensureUploadDirectoryExists(timestampDir);

    // Converter para WebP e salvar
    const baseFilename = path.parse(sanitizedOriginalName).name;
    const webpFilename = `${baseFilename}.webp`;
    const filePath = path.join(timestampDir, webpFilename);
    await this.convertToWebP(file.buffer, filePath);

    // Gerar URL pública (com extensão .webp)
    const publicUrl = `${this.cleanBaseUrl(baseUrl)}/uploads/${timestamp}/${webpFilename}`;

    // Verificar se URL já existe (evitar duplicação)
    const existing = await this.prisma.contentMedia.findUnique({
      where: { url: publicUrl },
    });

    if (existing) {
      // Se já existe, deletar o arquivo que acabamos de criar e retornar o existente
      try {
        await unlink(filePath);
      } catch (error) {
        this.logger.warn(
          `Erro ao deletar arquivo duplicado: ${filePath}`,
          error,
        );
      }
      return { url: existing.url, mediaId: existing.id };
    }

    // Salvar no banco de dados
    const contentMedia = await this.prisma.contentMedia.create({
      data: {
        url: publicUrl,
        filePath: filePath,
      },
    });

    this.logger.log(`Content media criado: ${contentMedia.id} - ${publicUrl}`);

    return {
      url: contentMedia.url,
      mediaId: contentMedia.id,
      sizeBytes: file.buffer?.length ?? file.size,
    };
  }

  /**
   * Upload de vídeo embutido no HTML da notícia (MP4/MOV/M4V), sem conversão.
   */
  async uploadContentVideo(
    file: any,
    baseUrl: string,
  ): Promise<ContentMediaResponseDto> {
    if (!file) {
      throw new BadRequestException('Arquivo não fornecido');
    }

    if (!this.isValidContentVideoFormat(file)) {
      throw new BadRequestException(
        'Formato de vídeo não suportado. Use MP4, M4V ou MOV.',
      );
    }

    const timestamp = Date.now();
    const randomId = Math.random().toString(36).substring(2, 15);
    const sanitizedOriginalName = sanitizeFileName(file.originalname);
    const videoFilename = `${timestamp}_${randomId}_${this.ensureMp4Extension(sanitizedOriginalName)}`;

    const timestampDir = path.join(this.baseUploadDir, timestamp.toString());
    await this.ensureUploadDirectoryExists(timestampDir);

    const filePath = path.join(timestampDir, videoFilename);
    await writeFile(filePath, file.buffer);

    const publicUrl = `${this.cleanBaseUrl(baseUrl)}/uploads/${timestamp}/${videoFilename}`;

    const existing = await this.prisma.contentMedia.findUnique({
      where: { url: publicUrl },
    });

    if (existing) {
      try {
        await unlink(filePath);
      } catch (error) {
        this.logger.warn(
          `Erro ao deletar arquivo duplicado: ${filePath}`,
          error,
        );
      }
      return { url: existing.url, mediaId: existing.id };
    }

    const contentMedia = await this.prisma.contentMedia.create({
      data: {
        url: publicUrl,
        filePath: filePath,
      },
    });

    this.logger.log(
      `Content media (vídeo) criado: ${contentMedia.id} - ${publicUrl}`,
    );

    const sizeBytes = file.buffer?.length ?? file.size;
    return {
      url: contentMedia.url,
      mediaId: contentMedia.id,
      sizeBytes: typeof sizeBytes === 'number' ? sizeBytes : undefined,
    };
  }

  private isValidContentVideoFormat(file: {
    mimetype: string;
    originalname: string;
  }): boolean {
    const validMimeTypes = ['video/mp4', 'video/x-m4v', 'video/quicktime'];
    const validExtensions = ['.mp4', '.m4v', '.mov'];
    const mimeOk = validMimeTypes.includes(file.mimetype?.toLowerCase() || '');
    const extOk = validExtensions.some((ext) =>
      file.originalname?.toLowerCase().endsWith(ext),
    );
    return mimeOk || extOk;
  }

  private ensureMp4Extension(filename: string): string {
    if (filename.toLowerCase().endsWith('.mp4')) {
      return filename;
    }
    const nameWithoutExt = filename.replace(/\.[^/.]+$/, '');
    return `${nameWithoutExt}.mp4`;
  }

  /** Normaliza URL extraída do HTML para bater com o registro no banco. */
  private normalizeContentAssetUrl(url: string): string {
    return url.trim().replace(/&amp;/g, '&');
  }

  private contentMediaUrlCandidates(url: string): string[] {
    const t = url.trim();
    return [...new Set([t, this.normalizeContentAssetUrl(t)])];
  }

  private async findContentMediaByUrl(url: string) {
    for (const candidate of this.contentMediaUrlCandidates(url)) {
      const row = await this.prisma.contentMedia.findUnique({
        where: { url: candidate },
        include: { newsContentMedia: true },
      });
      if (row) {
        return row;
      }
    }
    return null;
  }

  /**
   * URLs de assets embutidos no HTML (imagens + vídeo em &lt;video&gt; / &lt;source&gt;).
   * Regex multiline: Trecho HTML do CKEditor pode quebrar linhas entre atributos.
   */
  extractContentAssetUrls(htmlContent: string): string[] {
    if (!htmlContent) {
      return [];
    }

    const urls: string[] = [];
    const push = (raw: string) => {
      const n = this.normalizeContentAssetUrl(raw);
      if (n.includes('/uploads/')) {
        urls.push(n);
      }
    };

    const patterns = [
      /<img\b[\s\S]*?\bsrc\s*=\s*["']([^"']+)["']/gi,
      /<video\b[\s\S]*?\bsrc\s*=\s*["']([^"']+)["']/gi,
      /<source\b[\s\S]*?\bsrc\s*=\s*["']([^"']+)["']/gi,
    ];

    for (const re of patterns) {
      let m: RegExpExecArray | null;
      while ((m = re.exec(htmlContent)) !== null) {
        push(m[1]);
      }
    }

    return [...new Set(urls)];
  }

  /**
   * Cria ou atualiza referências de ContentMedia para uma notícia
   */
  async syncNewsContentMedia(
    newsId: number,
    htmlContent: string,
  ): Promise<void> {
    const assetUrls = this.extractContentAssetUrls(htmlContent);

    // Buscar todas as referências atuais desta notícia
    const currentReferences = await this.prisma.newsContentMedia.findMany({
      where: { newsId },
      include: { contentMedia: true },
    });

    const currentUrls = currentReferences.map((ref) =>
      this.normalizeContentAssetUrl(ref.contentMedia.url),
    );
    const urlsToAdd = assetUrls.filter((url) => !currentUrls.includes(url));
    const urlsToRemove = currentUrls.filter((url) => !assetUrls.includes(url));

    // Adicionar novas referências
    for (const url of urlsToAdd) {
      let contentMedia = await this.findContentMediaByUrl(url);

      // Se não existe, criar (pode acontecer se a URL foi inserida manualmente)
      if (!contentMedia) {
        this.logger.warn(
          `ContentMedia não encontrado para URL: ${url}. Criando registro...`,
        );
        // Extrair filePath da URL
        const urlPath = url.replace(/^https?:\/\/[^\/]+/, '');
        const filePath = urlPath.startsWith('/')
          ? urlPath.substring(1)
          : urlPath;

        await this.prisma.contentMedia.create({
          data: {
            url,
            filePath,
          },
        });
        contentMedia = await this.findContentMediaByUrl(url);
        if (!contentMedia) {
          throw new Error(
            `Falha ao localizar ContentMedia recém-criado: ${url}`,
          );
        }
      }

      // Criar referência
      await this.prisma.newsContentMedia.create({
        data: {
          newsId,
          contentMediaId: contentMedia.id,
        },
      });
    }

    // Remover referências antigas
    for (const url of urlsToRemove) {
      const contentMedia = await this.findContentMediaByUrl(url);

      if (contentMedia) {
        // Remover referência desta notícia
        await this.prisma.newsContentMedia.deleteMany({
          where: {
            newsId,
            contentMediaId: contentMedia.id,
          },
        });

        // Verificar se ContentMedia ainda está em uso
        const remainingReferences = await this.prisma.newsContentMedia.count({
          where: { contentMediaId: contentMedia.id },
        });

        // Se não há mais referências, deletar arquivo e registro
        if (remainingReferences === 0) {
          await this.deleteContentMediaFile(contentMedia);
        }
      }
    }
  }

  /**
   * Deleta arquivo físico e registro de ContentMedia
   */
  async deleteContentMediaFile(contentMedia: any): Promise<void> {
    try {
      const filePath = contentMedia.filePath;
      const fileDir = path.dirname(filePath);

      if (fs.existsSync(filePath)) {
        const st = await stat(filePath);
        if (st.isFile() || st.isSymbolicLink()) {
          await unlinkFile(filePath);
          this.logger.log(`Arquivo deletado: ${filePath}`);
        } else if (st.isDirectory()) {
          await rm(filePath, { recursive: true, force: true });
          this.logger.warn(
            `filePath apontava para diretório; removido: ${filePath}`,
          );
        }
      }

      await this.deleteEmptyDirectory(fileDir);

      await this.prisma.contentMedia.delete({
        where: { id: contentMedia.id },
      });

      this.logger.log(`ContentMedia deletado: ${contentMedia.id}`);
    } catch (error) {
      this.logger.error(
        `Erro ao deletar ContentMedia ${contentMedia.id}:`,
        error,
      );
      // Não lançar exceção para não quebrar o fluxo
    }
  }

  /**
   * Deleta diretório se estiver vazio
   */
  private async deleteEmptyDirectory(dirPath: string): Promise<void> {
    try {
      if (
        dirPath === this.baseUploadDir ||
        !dirPath.startsWith(this.baseUploadDir)
      ) {
        return;
      }

      if (!fs.existsSync(dirPath)) {
        return;
      }

      const st = await stat(dirPath);
      if (!st.isDirectory()) {
        return;
      }

      const files = await readdir(dirPath);

      if (files.length === 0) {
        try {
          await rm(dirPath, { recursive: false });
          this.logger.log(`Pasta vazia deletada: ${dirPath}`);

          const parentDir = path.dirname(dirPath);
          if (
            parentDir !== dirPath &&
            parentDir.startsWith(this.baseUploadDir)
          ) {
            await this.deleteEmptyDirectory(parentDir);
          }
        } catch (rmError: any) {
          if (rmError.code !== 'ENOTEMPTY' && rmError.code !== 'ENOENT') {
            this.logger.warn(
              `Erro ao deletar pasta ${dirPath}: ${rmError.message}`,
            );
          }
        }
      }
    } catch (error) {
      this.logger.debug(`Não foi possível deletar pasta ${dirPath}:`, error);
    }
  }

  /**
   * Deleta ContentMedia por URL
   */
  async deleteByUrl(url: string): Promise<void> {
    const contentMedia = await this.findContentMediaByUrl(url);

    if (!contentMedia) {
      throw new NotFoundException('Mídia de conteúdo não encontrada');
    }

    // Verificar se está sendo usada por alguma notícia
    if (contentMedia.newsContentMedia.length > 0) {
      // Se está em uso, apenas remover referências (não deletar arquivo ainda)
      // Isso pode acontecer se a imagem foi removida do editor mas a notícia ainda não foi salva
      this.logger.warn(
        `Mídia ${contentMedia.url} está em uso por ${contentMedia.newsContentMedia.length} notícia(s). Removendo referências...`,
      );

      // Remover todas as referências
      await this.prisma.newsContentMedia.deleteMany({
        where: { contentMediaId: contentMedia.id },
      });
    }

    // Deletar arquivo e registro
    await this.deleteContentMediaFile(contentMedia);
  }

  /**
   * Limpa ContentMedia órfãos (sem referências)
   */
  async cleanupOrphanedContentMedia(): Promise<number> {
    const orphanedMedia = await this.prisma.contentMedia.findMany({
      where: {
        newsContentMedia: {
          none: {},
        },
      },
    });

    let deletedCount = 0;
    for (const media of orphanedMedia) {
      await this.deleteContentMediaFile(media);
      deletedCount++;
    }

    this.logger.log(
      `Limpeza concluída: ${deletedCount} arquivos órfãos deletados`,
    );
    return deletedCount;
  }

  /**
   * Converte imagem para WebP
   */
  private async convertToWebP(
    buffer: Buffer,
    outputPath: string,
  ): Promise<void> {
    await sharp(buffer)
      .webp({
        quality: 85,
        effort: 4, // Balance entre qualidade e velocidade (0-6)
      })
      .toFile(outputPath);
  }

  private async ensureUploadDirectoryExists(dir?: string): Promise<void> {
    const targetDir = dir || this.baseUploadDir;
    try {
      await mkdir(targetDir, { recursive: true });
    } catch (error: any) {
      if (error.code !== 'EEXIST') {
        throw error;
      }
    }
  }
}
