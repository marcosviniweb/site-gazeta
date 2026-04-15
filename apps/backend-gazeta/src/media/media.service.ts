import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateMediaDto } from './dto/create-media.dto';
import { UpdateMediaDto } from './dto/update-media.dto';
import { MediaResponseDto } from './dto/media-response.dto';
import { UploadMediaDto } from './dto/upload-media.dto';
import { ImageProcessingService, ImageSizes } from './services/image-processing.service';
import { sanitizeFileName } from '../utils/file-name-sanitizer';

@Injectable()
export class MediaService {
  private readonly logger = new Logger(MediaService.name);

  constructor(
    private prisma: PrismaService,
    private imageProcessingService: ImageProcessingService
  ) {}

  async create(createMediaDto: CreateMediaDto): Promise<MediaResponseDto> {
    const media = await this.prisma.newsMedia.create({
      data: {
        newsId: createMediaDto.postId,
        emphasis: createMediaDto.emphasis,
        imgSize: createMediaDto.imgSize ? JSON.stringify(createMediaDto.imgSize) : null,
        author: createMediaDto.author,
        date: createMediaDto.date,
      },
    });

    return this.formatResponse(media);
  }

  async createWithUpload(file: any, data: UploadMediaDto, baseUrlFromRequest?: string): Promise<MediaResponseDto> {
    // Sanitizar nome do arquivo antes de adicionar timestamp
    const sanitizedOriginalName = sanitizeFileName(file.originalname);
    // Gerar nome único para o arquivo (formato: {timestamp}_{nome_sanitizado})
    const timestamp = Date.now();
    const filename = `${timestamp}_${sanitizedOriginalName}`;

    // Processar imagem em diferentes tamanhos
    const imageSizes = await this.imageProcessingService.processImage(file, filename);

    // Gerar URLs públicas
    const resolvedBaseUrl = baseUrlFromRequest || process.env.BASE_URL || '';
    const publicUrls = this.imageProcessingService.generatePublicUrls(imageSizes, resolvedBaseUrl);

    // Salvar no banco de dados usando NewsMedia
    const media = await this.prisma.newsMedia.create({
      data: {
        newsId: data.postId,
        emphasis: data.emphasis,
        imgSize: JSON.stringify(publicUrls), // Converter para JSON string
        author: data.author,
        date: data.date,
      },
    });

    return this.formatResponse(media);
  }

  async createWithMultipleUpload(files: any[], data: UploadMediaDto, baseUrlFromRequest?: string): Promise<MediaResponseDto[]> {
    const results: MediaResponseDto[] = [];
    const resolvedBaseUrl = baseUrlFromRequest || process.env.BASE_URL || '';

    for (let i = 0; i < files.length; i++) {
      const file = files[i];

      try {
        // Sanitizar nome do arquivo antes de adicionar timestamp e randomId
        const sanitizedOriginalName = sanitizeFileName(file.originalname);
        // Gerar nome único para cada arquivo (formato: {timestamp}_{randomId}_{nome_sanitizado})
        const timestamp = Date.now();
        const randomId = Math.random().toString(36).substring(2, 15);
        const filename = `${timestamp}_${randomId}_${sanitizedOriginalName}`;

        // Processar imagem em diferentes tamanhos
        const imageSizes = await this.imageProcessingService.processImage(file, filename);

        // Gerar URLs públicas
        const publicUrls = this.imageProcessingService.generatePublicUrls(imageSizes, resolvedBaseUrl);

        // Salvar no banco de dados
        // Para múltiplas imagens, apenas a primeira pode ter emphasis = true
        const media = await this.prisma.newsMedia.create({
          data: {
            newsId: data.postId,
            emphasis: data.emphasis && i === 0, // Apenas a primeira imagem tem emphasis
            imgSize: JSON.stringify(publicUrls), // Converter para JSON string
            author: data.author,
            date: data.date,
          },
        });

        results.push(this.formatResponse(media));
      } catch (error) {
        this.logger.error(`Erro ao processar arquivo ${file.originalname}:`, error);
        // Continua processando os outros arquivos mesmo se um falhar
      }
    }

    if (results.length === 0) {
      throw new Error('Nenhum arquivo foi processado com sucesso');
    }

    return results;
  }

  async findAll(): Promise<MediaResponseDto[]> {
    const medias = await this.prisma.newsMedia.findMany({
      orderBy: {
        id: 'desc',
      },
    });

    return medias.map(media => this.formatResponse(media));
  }

  async findOne(id: number): Promise<MediaResponseDto> {
    const media = await this.prisma.newsMedia.findUnique({
      where: { id },
    });

    if (!media) {
      throw new NotFoundException(`Mídia com ID ${id} não encontrada`);
    }

    return this.formatResponse(media);
  }

  async findByPost(postId: number): Promise<MediaResponseDto[]> {
    const medias = await this.prisma.newsMedia.findMany({
      where: { newsId: postId },
      orderBy: {
        id: 'desc',
      },
    });

    return medias.map(media => this.formatResponse(media));
  }

  async update(id: number, updateMediaDto: UpdateMediaDto): Promise<MediaResponseDto> {
    const existingMedia = await this.findMediaById(id);

    const updatedMedia = await this.prisma.newsMedia.update({
      where: { id },
      data: {
        newsId: updateMediaDto.postId || existingMedia.newsId,
        emphasis: updateMediaDto.emphasis ?? existingMedia.emphasis,
        imgSize: updateMediaDto.imgSize ? JSON.stringify(updateMediaDto.imgSize) : existingMedia.imgSize,
        author: updateMediaDto.author ?? existingMedia.author,
        date: updateMediaDto.date ?? existingMedia.date,
      },
    });

    return this.formatResponse(updatedMedia);
  }

  async remove(id: number): Promise<{ message: string }> {
    const existingMedia = await this.findMediaById(id);

    // Se existem arquivos de imagem, deletá-los
    if (existingMedia.imgSize) {
      try {
        // Parse imgSize se for string JSON
        let imgSize: ImageSizes;
        if (typeof existingMedia.imgSize === 'string') {
          imgSize = JSON.parse(existingMedia.imgSize);
        } else {
          imgSize = existingMedia.imgSize as ImageSizes;
        }
        await this.imageProcessingService.deleteImageFiles(imgSize);
      } catch (error) {
        this.logger.error(`Erro ao deletar arquivos de imagem para mídia ${id}:`, error);
        // Não interrompe a exclusão do registro no banco
      }
    }

    await this.prisma.newsMedia.delete({
      where: { id },
    });

    return { message: 'Mídia removida com sucesso' };
  }

  async cleanupDuplicatesByPost(postId: number): Promise<{
    message: string;
    postId: number;
    deletedCount: number;
    keptMediaIds: number[];
    removedMediaIds: number[];
  }> {
    const medias = await this.findByPost(postId);

    if (medias.length <= 1) {
      return {
        message: 'Nenhuma mídia duplicada encontrada',
        postId,
        deletedCount: 0,
        keptMediaIds: medias.map((media) => media.id),
        removedMediaIds: []
      };
    }

    const groupedMedias = new Map<string, MediaResponseDto[]>();

    medias.forEach((media) => {
      const fingerprint = this.buildMediaFingerprint(media);
      const currentGroup = groupedMedias.get(fingerprint) || [];
      currentGroup.push(media);
      groupedMedias.set(fingerprint, currentGroup);
    });

    const keptMediaIds: number[] = [];
    const removedMediaIds: number[] = [];

    for (const group of groupedMedias.values()) {
      if (group.length === 1) {
        keptMediaIds.push(group[0].id);
        continue;
      }

      const preferredMedia = group.find((media) => media.emphasis) ?? [...group].sort((a, b) => b.id - a.id)[0];
      keptMediaIds.push(preferredMedia.id);

      const duplicates = group
        .filter((media) => media.id !== preferredMedia.id)
        .sort((a, b) => a.id - b.id);

      for (const duplicate of duplicates) {
        await this.remove(duplicate.id);
        removedMediaIds.push(duplicate.id);
      }
    }

    return {
      message: 'Limpeza de mídias duplicadas concluída',
      postId,
      deletedCount: removedMediaIds.length,
      keptMediaIds,
      removedMediaIds
    };
  }

  private async findMediaById(id: number) {
    const media = await this.prisma.newsMedia.findUnique({
      where: { id },
    });

    if (!media) {
      throw new NotFoundException(`Mídia com ID ${id} não encontrada`);
    }

    return media;
  }

  private normalizeUrl(url: string): string {
    if (!url) return url;
    const match = url.match(/^[^/]+,\s*(https?:\/\/.*)$/i);
    if (match) return match[1].trim();
    return url.replace(/\\/g, '/');
  }

  private formatResponse(media: any): MediaResponseDto {
    // Parse imgSize se for string JSON
    let imgSize = media.imgSize;
    if (typeof imgSize === 'string' && imgSize) {
      try {
        imgSize = JSON.parse(imgSize);
        if (imgSize && typeof imgSize === 'object') {
          Object.keys(imgSize).forEach(key => {
            if (typeof imgSize[key] === 'string') {
              imgSize[key] = this.normalizeUrl(imgSize[key]);
            }
          });
        }
      } catch (error) {
        this.logger.warn(`Erro ao fazer parse de imgSize para mídia ${media.id}:`, error);
        imgSize = null;
      }
    } else if (imgSize && typeof imgSize === 'object') {
      Object.keys(imgSize).forEach(key => {
        if (typeof imgSize[key] === 'string') {
          imgSize[key] = this.normalizeUrl(imgSize[key]);
        }
      });
    }

    return {
      id: media.id,
      postId: media.newsId,
      emphasis: media.emphasis,
      imgSize: imgSize,
      author: media.author,
      date: media.date,
      createdAt: media.createdAt?.toISOString() || new Date().toISOString(),
      updatedAt: media.updatedAt?.toISOString() || new Date().toISOString(),
    };
  }

  private buildMediaFingerprint(media: MediaResponseDto): string {
    const source = media.imgSize?.original || media.imgSize?.medium || media.imgSize?.small || '';
    const filename = source.split('?')[0].split('/').pop() || '';

    return filename
      .replace(/_(medium|small|superSmall)(?=\.[^.]+$)/i, '')
      .replace(/^media_\d+_/, '')
      .replace(/^\d+_/, '')
      .toLowerCase();
  }
}
