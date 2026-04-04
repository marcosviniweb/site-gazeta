import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateMediaDto } from './dto/create-media.dto';
import { UpdateMediaDto } from './dto/update-media.dto';
import { MediaResponseDto } from './dto/media-response.dto';
import { UploadMediaDto } from './dto/upload-media.dto';
import { ImageProcessingService, ImageSizes } from './services/image-processing.service';

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
        imgSize: createMediaDto.imgSize ? createMediaDto.imgSize as any : null,
        author: createMediaDto.author,
        date: createMediaDto.date,
      },
    });

    return this.formatResponse(media);
  }

  async createWithUpload(file: any, data: UploadMediaDto, baseUrlFromRequest?: string): Promise<MediaResponseDto> {
    // Gerar nome único para o arquivo
    const timestamp = Date.now();
    const filename = `media_${timestamp}_${file.originalname}`;
    
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
        imgSize: publicUrls as any,
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
        // Gerar nome único para cada arquivo
        const timestamp = Date.now();
        const randomId = Math.random().toString(36).substring(2, 15);
        const filename = `media_${timestamp}_${randomId}_${file.originalname}`;
        
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
            imgSize: publicUrls as any,
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
        imgSize: updateMediaDto.imgSize ? updateMediaDto.imgSize as any : (existingMedia.imgSize as any),
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
        await this.imageProcessingService.deleteImageFiles(existingMedia.imgSize as unknown as ImageSizes);
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

  private async findMediaById(id: number) {
    const media = await this.prisma.newsMedia.findUnique({
      where: { id },
    });

    if (!media) {
      throw new NotFoundException(`Mídia com ID ${id} não encontrada`);
    }

    return media;
  }

  private formatResponse(media: any): MediaResponseDto {
    return {
      id: media.id,
      postId: media.newsId,
      emphasis: media.emphasis,
      imgSize: media.imgSize,
      author: media.author,
      date: media.date,
      createdAt: media.createdAt?.toISOString() || new Date().toISOString(),
      updatedAt: media.updatedAt?.toISOString() || new Date().toISOString(),
    };
  }
} 