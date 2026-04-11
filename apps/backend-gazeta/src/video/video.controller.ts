import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  ParseIntPipe,
  HttpException,
  HttpStatus,
  NotFoundException,
  UseInterceptors,
  UploadedFile,
  UploadedFiles,
  Req,
  Query
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiConsumes,
  ApiBody,
  ApiQuery
} from '@nestjs/swagger';
import { FileInterceptor, FileFieldsInterceptor } from '@nestjs/platform-express';
import { VideoService } from './video.service';
import { CreateVideoDto } from './dto/create-video.dto';
import { UpdateVideoDto } from './dto/update-video.dto';
import { VideoResponseDto } from './dto/video-response.dto';
import { VideoQueryDto } from './dto/video-query.dto';
import { VideoPaginatedResponse } from './dto/video-paginated-response.dto';
import { BulkToggleFeaturedDto, BulkDeleteVideoDto } from './dto/bulk-video.dto';
import { Request } from 'express';

@ApiTags('Vídeos')
@Controller('videos')
export class VideoController {
  constructor(private readonly videoService: VideoService) {}

  private getBaseUrl(req: Request): string {
    const forwardedProto = (req.headers['x-forwarded-proto'] as string) || undefined;
    const forwardedHost = (req.headers['x-forwarded-host'] as string) || undefined;
    const host = forwardedHost || req.get('host') || '';
    const protocol = forwardedProto || (req.protocol || 'http');
    const envBase = process.env.BASE_URL;
    return envBase || (host ? `${protocol}://${host}` : '');
  }

  @Post()
  @ApiOperation({
    summary: 'Criar novo vídeo',
    description: 'Endpoint para criar um novo registro de vídeo (sem upload)'
  })
  @ApiResponse({
    status: 201,
    description: 'Vídeo criado com sucesso',
    type: VideoResponseDto
  })
  @ApiResponse({
    status: 400,
    description: 'Dados inválidos'
  })
  async create(@Body() createVideoDto: CreateVideoDto): Promise<VideoResponseDto> {
    try {
      return await this.videoService.create(createVideoDto);
    } catch (error) {
      throw new HttpException({
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: 'Erro no servidor, tente novamente mais tarde',
        error: 'Internal Server Error'
      }, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Post('upload')
  @UseInterceptors(FileFieldsInterceptor([
    { name: 'video', maxCount: 1 },
    { name: 'thumbnail', maxCount: 1 }
  ]))
  @ApiConsumes('multipart/form-data')
  @ApiOperation({
    summary: 'Upload de vídeo (thumbnail opcional; duração auto-calculada)',
    description: 'Endpoint para upload de vídeo com thumbnail opcional. A duração é opcional: se não enviada, o servidor calcula automaticamente via ffprobe.'
  })
  @ApiBody({
    description: 'Dados do upload de vídeo',
    type: 'multipart/form-data',
    schema: {
      type: 'object',
      properties: {
        video: {
          type: 'string',
          format: 'binary',
          description: 'Arquivo de vídeo (MP4, AVI, MOV, etc)',
          example: 'video.mp4'
        },
        thumbnail: {
          type: 'string',
          format: 'binary',
          description: 'Arquivo de thumbnail (JPG, PNG, WEBP) - OPCIONAL',
          example: 'thumbnail.jpg'
        },
        title: {
          type: 'string',
          description: 'Título do vídeo',
          example: 'Usina de Tucuruí 01'
        },
        duration: {
          type: 'string',
          description: 'OPCIONAL. Duração (MM:SS ou HH:MM:SS). Se omitida, será calculada automaticamente.',
          example: '01:51'
        },
        categoryId: {
          type: 'array',
          items: { type: 'number' },
          description: 'IDs das categorias vinculadas ao vídeo',
          example: [1, 2]
        },
        featured: {
          type: 'boolean',
          description: 'Define se o vídeo deve aparecer em destaque',
          example: true
        },
        tags: {
          type: 'array',
          items: { type: 'string' },
          description: 'Tags relacionadas ao vídeo',
          example: ['tucurui', 'energia']
        },
        description: {
          type: 'string',
          description: 'Descrição detalhada do vídeo',
          example: 'Reportagem sobre a Usina de Tucuruí'
        },
        newsSlug: {
          type: 'string',
          description: 'Slug de uma notícia vinculada a este vídeo',
          example: 'usina-de-tucurui-atinge-recorde'
        }
      },
      required: ['video', 'title']
    }
  })
  @ApiResponse({
    status: 201,
    description: 'Vídeo processado e criado com sucesso',
    type: VideoResponseDto,
    schema: {
      example: {
        id: 1,
        title: 'Usina de Tucuruí 01',
        url: 'http://localhost:3000/uploads/videos/video_1704067200000_abc123_video1.mp4',
        thumbnail: 'http://localhost:3000/uploads/videos/video_1704067200000_abc123_video1_thumb.jpg',
        duration: '01:51',
        createdAt: '2024-01-15T10:30:00.000Z',
        updatedAt: '2024-01-15T10:30:00.000Z'
      }
    }
  })
  @ApiResponse({
    status: 400,
    description: 'Arquivo inválido ou dados incorretos',
    schema: {
      example: {
        statusCode: 400,
        message: 'Arquivo de vídeo não fornecido'
      }
    }
  })
  async uploadVideo(
    @Req() req: Request,
    @UploadedFiles() files: { video?: any[]; thumbnail?: any[] },
    @Body('title') title: string,
    @Body('duration') duration?: string,
    @Body('categoryId') categoryId?: string | string[],
    @Body('featured') featured?: string,
    @Body('tags') tags?: string | string[],
    @Body('description') description?: string,
    @Body('newsSlug') newsSlug?: string
  ): Promise<VideoResponseDto> {
    try {
      if (!files.video || files.video.length === 0) {
        throw new HttpException('Arquivo de vídeo não fornecido', HttpStatus.BAD_REQUEST);
      }

      if (!title) {
        throw new HttpException('Título do vídeo é obrigatório', HttpStatus.BAD_REQUEST);
      }

      const videoFile = files.video[0];
      const thumbnailFile = files.thumbnail && files.thumbnail.length > 0 ? files.thumbnail[0] : undefined;

      // Processar categoryId (pode vir como array ou string)
      let categoryIds: number[] | undefined;
      if (categoryId) {
        if (Array.isArray(categoryId)) {
          categoryIds = categoryId.map(id => parseInt(id, 10));
        } else {
          categoryIds = [parseInt(categoryId, 10)];
        }
      }

      // Processar featured (string 'true'/'false' para boolean)
      const featuredBool = featured === 'true';

      // Processar tags (pode vir como array ou string)
      let tagsArray: string[] | undefined;
      if (tags) {
        if (Array.isArray(tags)) {
          tagsArray = tags;
        } else {
          tagsArray = [tags];
        }
      }

      const baseUrl = this.getBaseUrl(req);
      return await this.videoService.createWithUpload(videoFile, thumbnailFile, {
        title,
        duration,
        categoryId: categoryIds,
        featured: featuredBool,
        tags: tagsArray,
        description,
        newsSlug
      }, baseUrl);
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException({
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: 'Erro no servidor, tente novamente mais tarde',
        error: 'Internal Server Error'
      }, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Get()
  @ApiOperation({
    summary: 'Listar todos os vídeos paginados e filtrados',
    description: 'Endpoint para obter todos os vídeos com suporte a paginação e filtros complexos'
  })
  @ApiResponse({
    status: 200,
    description: 'Lista paginada de vídeos',
    type: VideoPaginatedResponse
  })
  async findAll(@Query() query: VideoQueryDto): Promise<VideoPaginatedResponse> {
    try {
      return await this.videoService.findAll(query);
    } catch (error) {
      throw new HttpException({
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: 'Erro no servidor, tente novamente mais tarde',
        error: 'Internal Server Error'
      }, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Get('featured')
  @ApiOperation({
    summary: 'Listar vídeos em destaque',
    description: 'Endpoint para obter apenas vídeos em destaque (featured: true)'
  })
  @ApiResponse({
    status: 200,
    description: 'Lista de vídeos em destaque',
    type: [VideoResponseDto]
  })
  async findFeatured(): Promise<VideoResponseDto[]> {
    try {
      return await this.videoService.findFeatured();
    } catch (error) {
      throw new HttpException({
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: 'Erro no servidor, tente novamente mais tarde',
        error: 'Internal Server Error'
      }, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Get('latest')
  @ApiOperation({
    summary: 'Listar últimos vídeos postados',
    description: 'Endpoint para obter os últimos 6 vídeos postados (excluindo vídeos em destaque), ordenados do mais recente para o mais antigo'
  })
  @ApiResponse({
    status: 200,
    description: 'Lista dos últimos 6 vídeos postados',
    type: [VideoResponseDto]
  })
  async findLatest(): Promise<VideoResponseDto[]> {
    try {
      return await this.videoService.findLatest();
    } catch (error) {
      throw new HttpException({
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: 'Erro no servidor, tente novamente mais tarde',
        error: 'Internal Server Error'
      }, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Get('by-category')
  @ApiOperation({
    summary: 'Listar vídeos agrupados por categoria',
    description: 'Endpoint para obter vídeos agrupados por categoria, excluindo vídeos em destaque e opcionalmente IDs específicos. Útil para evitar duplicação com vídeos já exibidos em outras seções.'
  })
  @ApiQuery({
    name: 'excludeIds',
    required: false,
    description: 'IDs dos vídeos a serem excluídos (separados por vírgula). Exemplo: "1,2,3"',
    example: '1,2,3'
  })
  @ApiResponse({
    status: 200,
    description: 'Lista de vídeos (já formatados para agrupamento por categoria)',
    type: [VideoResponseDto]
  })
  async findVideosByCategory(
    @Req() req: Request,
    @Query('excludeIds') excludeIds?: string
  ): Promise<VideoResponseDto[]> {
    try {
      // Parse excludeIds se fornecido (formato: "1,2,3" ou "1, 2, 3")
      let excludeIdsArray: number[] | undefined;
      if (excludeIds) {
        excludeIdsArray = excludeIds
          .split(',')
          .map(id => parseInt(id.trim(), 10))
          .filter(id => !isNaN(id));
      }

      return await this.videoService.findVideosByCategory(excludeIdsArray);
    } catch (error) {
      throw new HttpException({
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: 'Erro no servidor, tente novamente mais tarde',
        error: 'Internal Server Error'
      }, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Obter vídeo por ID',
    description: 'Endpoint para obter um vídeo específico pelo ID'
  })
  @ApiParam({
    name: 'id',
    description: 'ID do vídeo',
    type: 'number',
    example: 1
  })
  @ApiResponse({
    status: 200,
    description: 'Vídeo encontrado',
    type: VideoResponseDto
  })
  @ApiResponse({
    status: 404,
    description: 'Vídeo não encontrado'
  })
  async findOne(@Param('id', ParseIntPipe) id: number): Promise<VideoResponseDto> {
    try {
      return await this.videoService.findOne(id);
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new HttpException({
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: 'Erro no servidor, tente novamente mais tarde',
        error: 'Internal Server Error'
      }, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Patch(':id')
  @ApiOperation({
    summary: 'Atualizar vídeo',
    description: 'Endpoint para atualizar um vídeo existente via JSON. Para atualizar enviando arquivos (vídeo/thumbnail), use o endpoint PATCH /videos/:id/upload com multipart/form-data.'
  })
  @ApiParam({
    name: 'id',
    description: 'ID do vídeo',
    type: 'number',
    example: 1
  })
  @ApiResponse({
    status: 200,
    description: 'Vídeo atualizado com sucesso',
    type: VideoResponseDto
  })
  @ApiResponse({
    status: 404,
    description: 'Vídeo não encontrado'
  })
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateVideoDto: UpdateVideoDto
  ): Promise<VideoResponseDto> {
    try {
      return await this.videoService.update(id, updateVideoDto);
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new HttpException({
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: 'Erro no servidor, tente novamente mais tarde',
        error: 'Internal Server Error'
      }, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Patch(':id/upload')
  @UseInterceptors(FileFieldsInterceptor([
    { name: 'video', maxCount: 1 },
    { name: 'thumbnail', maxCount: 1 }
  ]))
  @ApiConsumes('multipart/form-data')
  @ApiOperation({
    summary: 'Atualizar vídeo via upload (form-data)',
    description: 'Endpoint para atualizar um vídeo enviando arquivos via multipart/form-data. O vídeo e o thumbnail são opcionais; se não enviados, permanecem os atuais. A duração é opcional e, se o vídeo for trocado e a duração não for enviada, o servidor tenta recalcular automaticamente.'
  })
  @ApiParam({
    name: 'id',
    description: 'ID do vídeo',
    type: 'number',
    example: 1
  })
  @ApiBody({
    description: 'Dados para atualização via upload',
    type: 'multipart/form-data',
    schema: {
      type: 'object',
      properties: {
        video: {
          type: 'string',
          format: 'binary',
          description: 'Arquivo de vídeo (OPCIONAL)'
        },
        thumbnail: {
          type: 'string',
          format: 'binary',
          description: 'Arquivo de thumbnail (OPCIONAL)'
        },
        title: {
          type: 'string',
          description: 'Novo título (OPCIONAL)'
        },
        duration: {
          type: 'string',
          description: 'Duração (OPCIONAL). Se o vídeo for trocado e este campo omitido, será recalculada.'
        },
        categoryId: {
          type: 'array',
          items: { type: 'number' },
          description: 'Novas categorias (OPCIONAL)'
        },
        featured: {
          type: 'boolean',
          description: 'Alterar status de destaque (OPCIONAL)'
        },
        tags: {
          type: 'array',
          items: { type: 'string' },
          description: 'Novas tags (OPCIONAL)'
        },
        description: {
          type: 'string',
          description: 'Nova descrição (OPCIONAL)'
        },
        newsSlug: {
          type: 'string',
          description: 'Novo slug de notícia vinculada (OPCIONAL)'
        },
        removeThumbnail: {
          type: 'boolean',
          description: 'Se true, remove o thumbnail atual sem enviar um novo (OPCIONAL)'
        }
      }
    }
  })
  @ApiResponse({
    status: 200,
    description: 'Vídeo atualizado com sucesso',
    type: VideoResponseDto
  })
  @ApiResponse({
    status: 404,
    description: 'Vídeo não encontrado'
  })
  async updateWithUpload(
    @Param('id', ParseIntPipe) id: number,
    @Req() req: Request,
    @UploadedFiles() files: { video?: any[]; thumbnail?: any[] },
    @Body('title') title?: string,
    @Body('duration') duration?: string,
    @Body('categoryId') categoryId?: string | string[],
    @Body('featured') featured?: string,
    @Body('tags') tags?: string | string[],
    @Body('description') description?: string,
    @Body('newsSlug') newsSlug?: string,
    @Body('removeThumbnail') removeThumbnail?: string
  ): Promise<VideoResponseDto> {
    try {
      const videoFile = files.video && files.video.length > 0 ? files.video[0] : undefined;
      const thumbnailFile = files.thumbnail && files.thumbnail.length > 0 ? files.thumbnail[0] : undefined;
      
      // Processar categoryId (pode vir como array ou string)
      let categoryIds: number[] | undefined;
      if (categoryId) {
        if (Array.isArray(categoryId)) {
          categoryIds = categoryId.map(id => parseInt(id, 10));
        } else {
          categoryIds = [parseInt(categoryId, 10)];
        }
      }

      // Processar featured (string 'true'/'false' para boolean)
      const featuredBool = featured === 'true';

      // Processar tags (pode vir como array ou string)
      let tagsArray: string[] | undefined;
      if (tags) {
        if (Array.isArray(tags)) {
          tagsArray = tags;
        } else {
          tagsArray = [tags];
        }
      }

      // Processar removeThumbnail (string 'true'/'false' para boolean)
      const removeThumbnailBool = removeThumbnail === 'true';

      const baseUrl = this.getBaseUrl(req);
      return await this.videoService.updateWithUpload(id, videoFile, thumbnailFile, {
        title,
        duration,
        categoryId: categoryIds,
        featured: featuredBool,
        tags: tagsArray,
        description,
        newsSlug,
        removeThumbnail: removeThumbnailBool
      }, baseUrl);
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new HttpException({
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: 'Erro no servidor, tente novamente mais tarde',
        error: 'Internal Server Error'
      }, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Delete(':id')
  @ApiOperation({
    summary: 'Remover vídeo',
    description: 'Endpoint para remover um vídeo'
  })
  @ApiParam({
    name: 'id',
    description: 'ID do vídeo',
    type: 'number',
    example: 1
  })
  @ApiResponse({
    status: 200,
    description: 'Vídeo removido com sucesso',
    schema: {
      type: 'object',
      properties: {
        message: {
          type: 'string',
          example: 'Vídeo removido com sucesso'
        }
      }
    }
  })
  @ApiResponse({
    status: 404,
    description: 'Vídeo não encontrado'
  })
  async remove(@Param('id', ParseIntPipe) id: number): Promise<{ message: string }> {
    try {
      return await this.videoService.remove(id);
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new HttpException({
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: 'Erro no servidor, tente novamente mais tarde',
        error: 'Internal Server Error'
      }, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Patch('bulk/featured')
  @ApiOperation({ 
    summary: 'Atualizar destaque em lote',
    description: 'Permite definir como destaque ou remover o destaque de múltiplos vídeos de uma só vez. Respeita o limite de 3 vídeos em destaque (remove os mais antigos se necessário).'
  })
  @ApiResponse({ status: 200, description: 'Destaque dos vídeos atualizado com sucesso' })
  @ApiResponse({ status: 400, description: 'Dados inválidos' })
  async bulkToggleFeatured(
    @Body() bulkDto: BulkToggleFeaturedDto
  ): Promise<{ count: number }> {
    return await this.videoService.bulkToggleFeatured(bulkDto.ids, bulkDto.featured);
  }

  @Delete('bulk/delete')
  @ApiOperation({ 
    summary: 'Exclusão em lote',
    description: 'Remove permanentemente múltiplos vídeos e seus arquivos físicos.'
  })
  @ApiResponse({ status: 200, description: 'Vídeos excluídos com sucesso' })
  @ApiResponse({ status: 400, description: 'Dados inválidos' })
  async bulkRemove(
    @Body() bulkDto: BulkDeleteVideoDto
  ): Promise<{ count: number }> {
    return await this.videoService.bulkRemove(bulkDto.ids);
  }
}

