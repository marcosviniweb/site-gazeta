import { Injectable, NotFoundException, Logger, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateVideoDto } from './dto/create-video.dto';
import { UpdateVideoDto } from './dto/update-video.dto';
import { VideoResponseDto } from './dto/video-response.dto';
import { UploadVideoDto } from './dto/upload-video.dto';
import { VideoQueryDto } from './dto/video-query.dto';
import { VideoPaginatedResponse } from './dto/video-paginated-response.dto';
import { VideoProcessingService } from './services/video-processing.service';
import { VideoMetadataService } from './services/video-metadata.service';
import { VideoOptimizerService } from './services/video-optimizer.service';
import { sanitizeFileName } from '../utils/file-name-sanitizer';
import { Prisma } from '@prisma/client';
type UploadedFile = { originalname: string; buffer: Buffer; mimetype: string };

@Injectable()
export class VideoService {
  private readonly logger = new Logger(VideoService.name);

  constructor(
    private prisma: PrismaService,
    private videoProcessingService: VideoProcessingService,
    private videoMetadataService: VideoMetadataService,
    private videoOptimizerService: VideoOptimizerService
  ) {}

  async create(createVideoDto: CreateVideoDto): Promise<VideoResponseDto> {
    const video = await this.prisma.video.create({
      data: {
        title: createVideoDto.title,
        url: createVideoDto.url || '',
        thumbnail: createVideoDto.thumbnail,
        duration: createVideoDto.duration,
        description: createVideoDto.description,
        newsSlug: createVideoDto.newsSlug,
      },
    });

    return this.formatResponse(video);
  }

  /**
   * Gerencia a regra de apenas 3 vídeos em destaque
   * Se um novo vídeo for marcado como destaque e já houver 3, remove o destaque do mais antigo
   * @param excludeVideoId ID do vídeo a ser excluído da verificação (o que está sendo criado/atualizado)
   */
  private async manageFeaturedVideos(excludeVideoId?: number): Promise<void> {
    const MAX_FEATURED = 3;
    
    // Buscar todos os vídeos em destaque, ordenados por data de criação (mais antigo primeiro)
    const featuredVideos = await this.prisma.video.findMany({
      where: {
        featured: true,
        ...(excludeVideoId ? { id: { not: excludeVideoId } } : {}),
      },
      orderBy: {
        createdAt: 'asc', // Mais antigo primeiro
      },
    });

    // Se já houver MAX_FEATURED vídeos em destaque (excluindo o atual),
    // precisamos remover o destaque do mais antigo para que, ao adicionar o novo, fique MAX_FEATURED
    if (featuredVideos.length >= MAX_FEATURED) {
      // Calcula quantos vídeos precisam perder o destaque
      // Se há 3 e vou adicionar 1, preciso remover 1 (o mais antigo)
      const videosToRemove = featuredVideos.length - MAX_FEATURED + 1;
      const videosToRemoveFeatured = featuredVideos.slice(0, videosToRemove);
      
      if (videosToRemoveFeatured.length > 0) {
        const idsToUpdate = videosToRemoveFeatured.map(v => v.id);
        await this.prisma.video.updateMany({
          where: {
            id: { in: idsToUpdate },
          },
          data: {
            featured: false,
          },
        });
        
        this.logger.log(
          `Removido destaque de ${idsToUpdate.length} vídeo(s) antigo(s) (IDs: ${idsToUpdate.join(', ')}) para manter apenas ${MAX_FEATURED} em destaque`
        );
      }
    }
  }

  async createWithUpload(
    videoFile: UploadedFile,
    thumbnailFile: UploadedFile | undefined,
    data: UploadVideoDto,
    baseUrlFromRequest?: string
  ): Promise<VideoResponseDto> {
    // Validar formato do vídeo
    if (!this.isValidVideoFormat(videoFile)) {
      throw new BadRequestException('Formato de vídeo não suportado. Apenas MP4 é aceito.');
    }

    const timestamp = Date.now();
    const randomId = Math.random().toString(36).substring(2, 15);
    const sanitizedVideoName = sanitizeFileName(this.ensureMp4Extension(videoFile.originalname));
    const videoFilename = `${timestamp}_${randomId}_${sanitizedVideoName}`;
    
    // Salvar vídeo
    const videoPath = await this.videoProcessingService.saveVideo(videoFile, videoFilename);
    
    // Otimizar vídeo para streaming progressivo (em background, não bloqueia resposta)
    this.optimizeVideoForStreaming(videoPath).catch((error) => {
      this.logger.warn(`Não foi possível otimizar vídeo para streaming: ${error.message}`);
    });
    
    // Gerar URL pública do vídeo
    const resolvedBaseUrl = baseUrlFromRequest || process.env.BASE_URL || '';
    const videoUrl = this.buildPublicUrl(videoPath, resolvedBaseUrl);
    
    // Processar thumbnail se fornecido
    let thumbnailUrl: string | undefined;
    if (thumbnailFile) {
      const thumbnailPath = await this.videoProcessingService.saveThumbnail(
        thumbnailFile,
        videoFilename
      );
      thumbnailUrl = this.buildPublicUrl(thumbnailPath, resolvedBaseUrl);
    }

    // Descobrir duração automaticamente se não enviada
    let effectiveDuration = data.duration;
    if (!effectiveDuration) {
      try {
        effectiveDuration = await this.videoMetadataService.getDurationString(videoPath);
      } catch (e) {
        this.logger.warn(`Não foi possível calcular a duração via ffprobe: ${e?.message || e}`);
      }
    }

    // Preparar tags como JSON string
    const tagsJson = data.tags && data.tags.length > 0 ? JSON.stringify(data.tags) : null;

    // Se o vídeo será marcado como destaque, gerenciar a regra de apenas 3 em destaque
    if (data.featured === true) {
      await this.manageFeaturedVideos();
    }

    // Salvar no banco de dados
    const video = await this.prisma.video.create({
      data: {
        title: data.title,
        url: videoUrl,
        thumbnail: thumbnailUrl,
        duration: effectiveDuration,
        featured: data.featured || false,
        tags: tagsJson,
        description: data.description,
        newsSlug: data.newsSlug,
        videoCategories: data.categoryId && data.categoryId.length > 0 ? {
          create: data.categoryId.map(categoryId => ({
            categoryId
          }))
        } : undefined,
      },
      include: {
        videoCategories: {
          include: {
            category: true
          }
        }
      }
    });

    return this.formatResponse(video);
  }

  /**
   * Otimiza vídeo para streaming progressivo
   */
  private async optimizeVideoForStreaming(videoPath: string): Promise<void> {
    try {
      // Verificar se já está otimizado
      const isOptimized = await this.videoOptimizerService.isOptimizedForStreaming(videoPath);
      if (isOptimized) {
        this.logger.log(`Vídeo já está otimizado: ${videoPath}`);
        return;
      }

      // Otimizar (move moov atom para o início)
      await this.videoOptimizerService.optimizeForProgressiveStreaming(videoPath);
      this.logger.log(`Vídeo otimizado para streaming progressivo: ${videoPath}`);
    } catch (error) {
      this.logger.error(`Erro ao otimizar vídeo: ${error.message}`);
      // Não lança erro para não interromper o upload
    }
  }

  /**
   * Valida se o arquivo é um formato de vídeo válido
   */
  private isValidVideoFormat(file: UploadedFile): boolean {
    const validMimeTypes = ['video/mp4', 'video/x-m4v', 'video/quicktime'];
    const validExtensions = ['.mp4', '.m4v', '.mov'];
    
    const hasValidMimeType = validMimeTypes.includes(file.mimetype.toLowerCase());
    const hasValidExtension = validExtensions.some(ext => 
      file.originalname.toLowerCase().endsWith(ext)
    );
    
    return hasValidMimeType || hasValidExtension;
  }

  /**
   * Garante que o arquivo tenha extensão .mp4
   */
  private ensureMp4Extension(filename: string): string {
    if (filename.toLowerCase().endsWith('.mp4')) {
      return filename;
    }
    // Remove extensão antiga e adiciona .mp4
    const nameWithoutExt = filename.replace(/\.[^/.]+$/, '');
    return `${nameWithoutExt}.mp4`;
  }

  /**
   * Constrói condições WHERE para queries de vídeos
   */
  private buildWhereCondition(query?: VideoQueryDto): any {
    const whereCondition: any = {};

    if (query?.search) {
      whereCondition.title = { contains: query.search };
    }

    if (query?.categoryId) {
      whereCondition.videoCategories = {
        some: {
          categoryId: query.categoryId
        }
      };
    }

    if (query?.featured !== undefined) {
      whereCondition.featured = query.featured;
    }

    if (query?.date) {
      const dateStr = query.date;
      whereCondition.createdAt = {
        gte: new Date(`${dateStr}T00:00:00.000Z`),
        lte: new Date(`${dateStr}T23:59:59.999Z`)
      };
    }

    return whereCondition;
  }

  /**
   * Constrói array dinâmico de ordenação para vídeos
   */
  private buildOrderByCondition(query?: VideoQueryDto, defaultFeaturedFirst = false): any[] {
    const orderBy: any[] = [];

    if (query?.views) {
      orderBy.push({ views: query.views });
    }
    
    if (query?.order) {
      orderBy.push({ createdAt: query.order });
    }

    if (orderBy.length === 0) {
      if (defaultFeaturedFirst) {
        orderBy.push({ featured: 'desc' });
      }
      orderBy.push({ createdAt: 'desc' });
    }

    return orderBy;
  }

  async findAll(query?: VideoQueryDto): Promise<VideoPaginatedResponse> {
    const whereCondition = this.buildWhereCondition(query);
    const orderBy = this.buildOrderByCondition(query, false);
    const page = query?.page || 1;
    const limit = query?.limit || 25;
    const skip = (page - 1) * limit;

    const [videos, total] = await Promise.all([
      this.prisma.video.findMany({
        where: whereCondition,
        include: {
          videoCategories: {
            include: {
              category: true
            }
          }
        },
        orderBy,
        skip,
        take: limit
      }),
      this.prisma.video.count({ where: whereCondition })
    ]);

    return {
      data: videos.map(video => this.formatResponse(video)),
      meta: {
        total,
        page,
        limit,
        lastPage: Math.ceil(total / limit)
      }
    };
  }

  async findFeatured(): Promise<VideoResponseDto[]> {
    const videos = await this.prisma.video.findMany({
      where: {
        featured: true,
      },
      include: {
        videoCategories: {
          include: {
            category: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return videos.map(video => this.formatResponse(video));
  }

  async findLatest(): Promise<VideoResponseDto[]> {
    const videos = await this.prisma.video.findMany({
      where: {
        featured: false,
      },
      include: {
        videoCategories: {
          include: {
            category: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: 6,
    });

    return videos.map(video => this.formatResponse(video));
  }

  async findVideosByCategory(excludeIds?: number[]): Promise<VideoResponseDto[]> {
    const where: any = {
      featured: false, // Exclui vídeos em destaque
    };

    // Se houver IDs para excluir, adiciona à condição
    if (excludeIds && excludeIds.length > 0) {
      where.id = {
        notIn: excludeIds,
      };
    }

    const videos = await this.prisma.video.findMany({
      where,
      include: {
        videoCategories: {
          include: {
            category: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return videos.map(video => this.formatResponse(video));
  }

  async findOne(id: number): Promise<VideoResponseDto> {
    const video = await this.prisma.video.findUnique({
      where: { id },
      include: {
        videoCategories: {
          include: {
            category: true
          }
        }
      }
    });

    if (!video) {
      throw new NotFoundException(`Vídeo com ID ${id} não encontrado`);
    }

    return this.formatResponse(video);
  }

  async update(id: number, updateVideoDto: UpdateVideoDto): Promise<VideoResponseDto> {
    const existingVideo = await this.findVideoById(id);

    const updatedVideo = await this.prisma.video.update({
      where: { id },
      data: {
        title: updateVideoDto.title ?? existingVideo.title,
        url: updateVideoDto.url ?? existingVideo.url,
        thumbnail: updateVideoDto.thumbnail !== undefined ? updateVideoDto.thumbnail : existingVideo.thumbnail,
        duration: updateVideoDto.duration ?? existingVideo.duration,
        description: updateVideoDto.description !== undefined ? updateVideoDto.description : existingVideo.description,
        newsSlug: updateVideoDto.newsSlug !== undefined ? updateVideoDto.newsSlug : existingVideo.newsSlug,
      },
    });

    return this.formatResponse(updatedVideo);
  }

  async updateWithUpload(
    id: number,
    videoFile?: UploadedFile,
    thumbnailFile?: UploadedFile,
    data?: UploadVideoDto,
    baseUrlFromRequest?: string
  ): Promise<VideoResponseDto> {
    const existingVideo = await this.findVideoById(id);

    const resolvedBaseUrl = baseUrlFromRequest || process.env.BASE_URL || '';
    let newVideoUrl = existingVideo.url;
    let newThumbnailUrl = existingVideo.thumbnail;
    let effectiveDuration = data?.duration ?? existingVideo.duration;

    let oldVideoPathToDelete: string | undefined;
    let oldThumbPathToDelete: string | undefined;
    let newVideoRelPath: string | undefined;
    let newThumbRelPath: string | undefined;

    // Atualizar vídeo se enviado
    let newVideoFilename: string | undefined;
    if (videoFile) {
      // Validar formato do vídeo
      if (!this.isValidVideoFormat(videoFile)) {
        throw new BadRequestException('Formato de vídeo não suportado. Apenas MP4 é aceito.');
      }

      const timestamp = Date.now();
      const randomId = Math.random().toString(36).substring(2, 15);
      const sanitizedVideoName = sanitizeFileName(this.ensureMp4Extension(videoFile.originalname));
      newVideoFilename = `video_${timestamp}_${randomId}_${sanitizedVideoName}`;

      const newVideoPath = await this.videoProcessingService.saveVideo(videoFile, newVideoFilename);
      newVideoRelPath = newVideoPath.replace(/\\/g, '/');
      newVideoUrl = this.buildPublicUrl(newVideoPath, resolvedBaseUrl);

      // Otimizar vídeo para streaming progressivo (em background)
      this.optimizeVideoForStreaming(newVideoPath).catch((error) => {
        this.logger.warn(`Não foi possível otimizar vídeo para streaming: ${error.message}`);
      });

      // Recalcular duração se não enviada
      if (!data?.duration) {
        try {
          effectiveDuration = await this.videoMetadataService.getDurationString(newVideoPath);
        } catch (e) {
          this.logger.warn(`Não foi possível calcular a duração via ffprobe: ${e?.message || e}`);
        }
      }

      // Marcar vídeo antigo para deleção
      if (existingVideo.url) {
        const oldRel = this.urlToRelativePath(existingVideo.url);
        // Só deletar se o caminho antigo for diferente do novo
        oldVideoPathToDelete = newVideoRelPath && oldRel === newVideoRelPath ? undefined : oldRel;
      }
    }

    // Atualizar thumbnail se enviado
    if (thumbnailFile) {
      // Se não trocou o vídeo, derivar o nome base a partir do URL existente
      const filenameForThumbnail = newVideoFilename || this.extractFilenameFromUrl(existingVideo.url) || `video_${Date.now()}.mp4`;
      const thumbnailPath = await this.videoProcessingService.saveThumbnail(thumbnailFile, filenameForThumbnail);
      newThumbRelPath = thumbnailPath.replace(/\\/g, '/');
      newThumbnailUrl = this.buildPublicUrl(thumbnailPath, resolvedBaseUrl);

      // Marcar thumbnail antiga para deleção
      if (existingVideo.thumbnail) {
        const oldRel = this.urlToRelativePath(existingVideo.thumbnail);
        // Se o caminho novo for igual ao antigo, não deletar (foi overwrite no mesmo arquivo)
        oldThumbPathToDelete = newThumbRelPath && oldRel === newThumbRelPath ? undefined : oldRel;
      }
    }

    // Verificar se deve remover thumbnail
    let finalThumbnailUrl: string | null = newThumbnailUrl;
    if (data?.removeThumbnail === true && !thumbnailFile) {
      finalThumbnailUrl = null;
      // Marcar thumbnail antiga para deleção se existir
      if (existingVideo.thumbnail) {
        const oldRel = this.urlToRelativePath(existingVideo.thumbnail);
        oldThumbPathToDelete = oldRel;
      }
    }

    // Preparar dados de atualização
    const updateData: any = {
      title: data?.title ?? existingVideo.title,
      url: newVideoUrl,
      thumbnail: finalThumbnailUrl,
      duration: effectiveDuration,
      description: data?.description !== undefined ? data.description : existingVideo.description,
      newsSlug: data?.newsSlug !== undefined ? data.newsSlug : existingVideo.newsSlug,
    };

    // Atualizar featured se fornecido
    if (data && 'featured' in data) {
      const newFeaturedValue = data.featured;
      const wasFeatured = existingVideo.featured;
      
      // Se está marcando como destaque e não estava antes, gerenciar a regra
      if (newFeaturedValue === true && !wasFeatured) {
        await this.manageFeaturedVideos(id);
      }
      
      updateData.featured = newFeaturedValue;
    }

    // Atualizar tags se fornecido
    if (data && data.tags !== undefined) {
      updateData.tags = data.tags && data.tags.length > 0 ? data.tags : null;
    }

    // Atualizar categorias se fornecido
    if (data && data.categoryId !== undefined) {
      // Deletar categorias existentes
      await this.prisma.videoCategory.deleteMany({
        where: { videoId: id }
      });

      // Criar novas categorias se houver
      if (data.categoryId && data.categoryId.length > 0) {
        updateData.videoCategories = {
          create: data.categoryId.map(categoryId => ({
            categoryId
          }))
        };
      }
    }

    const updatedVideo = await this.prisma.video.update({
      where: { id },
      data: updateData,
      include: {
        videoCategories: {
          include: {
            category: true
          }
        }
      }
    });

    // Deletar arquivos antigos substituídos
    try {
      if (oldVideoPathToDelete || oldThumbPathToDelete) {
        await this.videoProcessingService.deleteVideoFiles(oldVideoPathToDelete, oldThumbPathToDelete);
      }
    } catch (error) {
      this.logger.error(`Erro ao deletar arquivos substituídos do vídeo ${id}:`, error);
    }

    return this.formatResponse(updatedVideo);
  }

  private extractFilenameFromUrl(url: string): string | undefined {
    try {
      const path = this.urlToPathname(url);
      const parts = path.split('/');
      return parts[parts.length - 1] || undefined;
    } catch {
      return undefined;
    }
  }

  async remove(id: number): Promise<{ message: string }> {
    const existingVideo = await this.findVideoById(id);

    // Deletar arquivos físicos
    try {
      const videoPath = this.urlToRelativePath(existingVideo.url);
      const thumbnailPath = existingVideo.thumbnail 
        ? this.urlToRelativePath(existingVideo.thumbnail)
        : undefined;
      
      await this.videoProcessingService.deleteVideoFiles(videoPath, thumbnailPath);
    } catch (error) {
      this.logger.error(`Erro ao deletar arquivos de vídeo ${id}:`, error);
      // Não interrompe a exclusão do registro no banco
    }

    await this.prisma.video.delete({
      where: { id },
    });

    return { message: 'Vídeo removido com sucesso' };
  }

  private buildPublicUrl(filePath: string, baseUrl: string): string {
    const relativePath = filePath.replace(/\\/g, '/');
    if (baseUrl) {
      return this.videoProcessingService.generatePublicUrl(relativePath, baseUrl);
    }
    return `/${relativePath}`;
  }

  private urlToPathname(url: string): string {
    try {
      const parsed = new URL(url);
      return parsed.pathname;
    } catch {
      // Já é relativo
      return url.startsWith('/') ? url : `/${url}`;
    }
  }

  private urlToRelativePath(url: string): string {
    const pathname = this.urlToPathname(url);
    return pathname.replace(/^\//, '');
  }

  private async findVideoById(id: number) {
    const video = await this.prisma.video.findUnique({
      where: { id },
    });

    if (!video) {
      throw new NotFoundException(`Vídeo com ID ${id} não encontrado`);
    }

    return video;
  }

  /**
   * Atualiza o destaque de múltiplos vídeos (Bulk)
   */
  async bulkToggleFeatured(ids: number[], featured: boolean): Promise<{ count: number }> {
    // Se está ativando destaque, precisamos gerenciar o limite de 3
    if (featured) {
      // Como é bulk, simplificamos: removemos destaque de TODOS os antigos que não estão na lista nova
      // Mas a regra de negócio diz: no máximo 3.
      // Vou apenas aplicar o updateMany e depois rodar o manageFeaturedVideos para limpar excessos.
      const result = await this.prisma.video.updateMany({
        where: { id: { in: ids } },
        data: { featured }
      });
      
      await this.manageFeaturedVideos();
      return { count: result.count };
    }

    // Se está desativando, apenas faz o updateMany
    const result = await this.prisma.video.updateMany({
      where: { id: { in: ids } },
      data: { featured }
    });

    return { count: result.count };
  }

  /**
   * Remove múltiplos vídeos permanentemente (Bulk)
   */
  async bulkRemove(ids: number[]): Promise<{ count: number }> {
    let count = 0;
    for (const id of ids) {
      try {
        await this.remove(id);
        count++;
      } catch (error) {
        this.logger.error(`Erro ao remover vídeo ${id} em lote:`, error);
      }
    }
    return { count };
  }

  private formatResponse(video: any): VideoResponseDto {
    // Converter tags de JSON para array de strings
    let tags: string[] | undefined;
    if (video.tags) {
      try {
        tags = typeof video.tags === 'string' ? JSON.parse(video.tags) : video.tags;
      } catch {
        tags = Array.isArray(video.tags) ? video.tags : [];
      }
    }

    // Extrair categorias se existirem
    const categories = video.videoCategories?.map((vc: any) => vc.category) || [];

    return {
      id: video.id,
      title: video.title,
      url: video.url,
      thumbnail: video.thumbnail,
      duration: video.duration,
      views: video.views || 0,
      featured: video.featured || false,
      tags,
      categories,
      description: video.description,
      newsSlug: video.newsSlug,
      createdAt: video.createdAt?.toISOString() || new Date().toISOString(),
      updatedAt: video.updatedAt?.toISOString() || new Date().toISOString(),
    };
  }
}

