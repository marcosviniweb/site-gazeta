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
  Req
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiConsumes,
  ApiBody
} from '@nestjs/swagger';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import { MediaService } from './media.service';
import { CreateMediaDto } from './dto/create-media.dto';
import { UpdateMediaDto } from './dto/update-media.dto';
import { MediaResponseDto } from './dto/media-response.dto';
import { Request } from 'express';

@ApiTags('Mídia')
@Controller('media')
export class MediaController {
  constructor(private readonly mediaService: MediaService) {}

  private getBaseUrl(req: Request): string {
    const rawProto = req.headers['x-forwarded-proto'] as string;
    const forwardedProto = rawProto ? rawProto.split(',')[0].trim() : undefined;
    const forwardedHost = (req.headers['x-forwarded-host'] as string) || undefined;
    const host = forwardedHost || req.get('host') || '';
    const protocol = forwardedProto || (req.protocol || 'http');
    const envBase = process.env.BASE_URL;
    return envBase || (host ? `${protocol}://${host}` : '');
  }

  @Post()
  @ApiOperation({
    summary: 'Criar nova mídia',
    description: 'Endpoint para criar uma nova mídia'
  })
  @ApiResponse({
    status: 201,
    description: 'Mídia criada com sucesso',
    type: MediaResponseDto
  })
  @ApiResponse({
    status: 400,
    description: 'Dados inválidos - Validação de campos obrigatórios'
  })
  async create(@Body() createMediaDto: CreateMediaDto): Promise<MediaResponseDto> {
    try {
      return await this.mediaService.create(createMediaDto);
    } catch (error) {
      throw new HttpException({
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: 'Erro no servidor, tente novamente mais tarde',
        error: 'Internal Server Error'
      }, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Post('upload')
  @UseInterceptors(FileInterceptor('file'))
  @ApiConsumes('multipart/form-data')
  @ApiOperation({
    summary: 'Upload de imagem única para mídia',
    description: 'Endpoint para fazer upload de uma única imagem que será processada em diferentes tamanhos (original, medium, small, superSmall)'
  })
  @ApiBody({
    description: 'Dados do upload de imagem única',
    type: 'multipart/form-data',
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
          description: 'Arquivo de imagem (JPG, PNG, WEBP)',
          example: 'imagem.jpg'
        },
        postId: {
          type: 'string',
          description: 'ID da postagem/notícia',
          example: '123'
        },
        emphasis: {
          type: 'string',
          description: 'Se a imagem terá destaque',
          example: 'true',
          enum: ['true', 'false']
        },
        author: {
          type: 'string',
          description: 'Autor da imagem (opcional)',
          example: 'João Silva'
        },
        date: {
          type: 'string',
          description: 'Data da imagem (opcional)',
          example: '2024-01-15'
        }
      },
      required: ['file', 'postId']
    }
  })
  @ApiResponse({
    status: 201,
    description: 'Imagem processada e mídia criada com sucesso',
    type: MediaResponseDto,
    schema: {
      example: {
        id: 1,
        postId: 123,
        emphasis: true,
        imgSize: {
          original: "http://localhost:3000/uploads/media_1704067200000_imagem.jpg",
          medium: "http://localhost:3000/uploads/media_1704067200000_imagem_medium.jpg",
          small: "http://localhost:3000/uploads/media_1704067200000_imagem_small.jpg",
          superSmall: "http://localhost:3000/uploads/media_1704067200000_imagem_supersmall.jpg"
        },
        author: "João Silva",
        date: "2024-01-15",
        createdAt: "2024-01-01T12:00:00.000Z",
        updatedAt: "2024-01-01T12:00:00.000Z"
      }
    }
  })
  @ApiResponse({
    status: 400,
    description: 'Arquivo inválido ou dados incorretos',
    schema: {
      example: {
        statusCode: 400,
        message: "Arquivo não fornecido"
      }
    }
  })
  async uploadImage(
    @Req() req: Request,
    @UploadedFile() file: any,
    @Body('postId') postId: string,
    @Body('emphasis') emphasis = 'false',
    @Body('author') author?: string,
    @Body('date') date?: string
  ): Promise<MediaResponseDto> {
    try {
      if (!file) {
        throw new HttpException('Arquivo não fornecido', HttpStatus.BAD_REQUEST);
      }

      if (!postId) {
        throw new HttpException('ID da postagem é obrigatório', HttpStatus.BAD_REQUEST);
      }

      const baseUrl = this.getBaseUrl(req);
      return await this.mediaService.createWithUpload(file, {
        postId: parseInt(postId),
        emphasis: emphasis === 'true',
        author,
        date
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

  @Post('upload-multiple')
  @UseInterceptors(FilesInterceptor('files', 10)) // Máximo 10 arquivos
  @ApiConsumes('multipart/form-data')
  @ApiOperation({
    summary: 'Upload múltiplo de imagens para mídia',
    description: 'Endpoint para fazer upload de múltiplas imagens (máximo 10) que serão processadas em diferentes tamanhos. Apenas a primeira imagem terá emphasis=true.'
  })
  @ApiBody({
    description: 'Dados do upload múltiplo de imagens',
    type: 'multipart/form-data',
    schema: {
      type: 'object',
      properties: {
        files: {
          type: 'array',
          items: {
            type: 'string',
            format: 'binary'
          },
          description: 'Múltiplos arquivos de imagem (JPG, PNG, WEBP) - máximo 10',
          example: ['imagem1.jpg', 'imagem2.jpg', 'imagem3.jpg']
        },
        postId: {
          type: 'string',
          description: 'ID da postagem/notícia',
          example: '123'
        },
        emphasis: {
          type: 'string',
          description: 'Se a primeira imagem terá destaque (apenas a primeira)',
          example: 'true',
          enum: ['true', 'false']
        },
        author: {
          type: 'string',
          description: 'Autor das imagens (opcional)',
          example: 'João Silva'
        },
        date: {
          type: 'string',
          description: 'Data das imagens (opcional)',
          example: '2024-01-15'
        }
      },
      required: ['files', 'postId']
    }
  })
  @ApiResponse({
    status: 201,
    description: 'Imagens processadas e mídias criadas com sucesso',
    type: [MediaResponseDto],
    schema: {
      example: [
        {
          id: 1,
          postId: 123,
          emphasis: true, // Primeira imagem
          imgSize: {
            original: "http://localhost:3000/uploads/media_1704067200000_abc123_imagem1.jpg",
            medium: "http://localhost:3000/uploads/media_1704067200000_abc123_imagem1_medium.jpg",
            small: "http://localhost:3000/uploads/media_1704067200000_abc123_imagem1_small.jpg",
            superSmall: "http://localhost:3000/uploads/media_1704067200000_abc123_imagem1_supersmall.jpg"
          },
          author: "João Silva",
          date: "2024-01-15",
          createdAt: "2024-01-01T12:00:00.000Z",
          updatedAt: "2024-01-01T12:00:00.000Z"
        },
        {
          id: 2,
          postId: 123,
          emphasis: false, // Demais imagens
          imgSize: {
            original: "http://localhost:3000/uploads/media_1704067200001_def456_imagem2.jpg",
            medium: "http://localhost:3000/uploads/media_1704067200001_def456_imagem2_medium.jpg",
            small: "http://localhost:3000/uploads/media_1704067200001_def456_imagem2_small.jpg",
            superSmall: "http://localhost:3000/uploads/media_1704067200001_def456_imagem2_supersmall.jpg"
          },
          author: "João Silva",
          date: "2024-01-15",
          createdAt: "2024-01-01T12:00:00.000Z",
          updatedAt: "2024-01-01T12:00:00.000Z"
        }
      ]
    }
  })
  @ApiResponse({
    status: 400,
    description: 'Arquivos inválidos ou dados incorretos',
    schema: {
      examples: {
        noFiles: {
          summary: 'Nenhum arquivo enviado',
          value: {
            statusCode: 400,
            message: "Nenhum arquivo fornecido"
          }
        },
        tooManyFiles: {
          summary: 'Muitos arquivos',
          value: {
            statusCode: 400,
            message: "Máximo 10 arquivos por upload"
          }
        },
        missingPostId: {
          summary: 'PostId obrigatório',
          value: {
            statusCode: 400,
            message: "ID da postagem é obrigatório"
          }
        }
      }
    }
  })
  async uploadMultipleImages(
    @Req() req: Request,
    @UploadedFiles() files: any[],
    @Body('postId') postId: string,
    @Body('emphasis') emphasis = 'false',
    @Body('author') author?: string,
    @Body('date') date?: string
  ): Promise<MediaResponseDto[]> {
    try {
      if (!files || files.length === 0) {
        throw new HttpException('Nenhum arquivo fornecido', HttpStatus.BAD_REQUEST);
      }

      if (!postId) {
        throw new HttpException('ID da postagem é obrigatório', HttpStatus.BAD_REQUEST);
      }

      if (files.length > 10) {
        throw new HttpException('Máximo 10 arquivos por upload', HttpStatus.BAD_REQUEST);
      }

      const baseUrl = this.getBaseUrl(req);
      return await this.mediaService.createWithMultipleUpload(files, {
        postId: parseInt(postId),
        emphasis: emphasis === 'true',
        author,
        date
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

  @Post('cleanup/by-post/:postId')
  @ApiOperation({
    summary: 'Limpar mídias duplicadas por notícia',
    description: 'Remove mídias duplicadas de uma notícia, preservando a versão destacada quando existir'
  })
  @ApiParam({
    name: 'postId',
    description: 'ID da notícia',
    type: 'number',
    example: 1
  })
  @ApiResponse({
    status: 200,
    description: 'Limpeza executada com sucesso'
  })
  async cleanupDuplicatesByPost(@Param('postId', ParseIntPipe) postId: number): Promise<{
    message: string;
    postId: number;
    deletedCount: number;
    keptMediaIds: number[];
    removedMediaIds: number[];
  }> {
    try {
      return await this.mediaService.cleanupDuplicatesByPost(postId);
    } catch (error) {
      throw new HttpException({
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: 'Erro no servidor, tente novamente mais tarde',
        error: 'Internal Server Error'
      }, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Get()
  async findAll(): Promise<MediaResponseDto[]> {
    try {
      return await this.mediaService.findAll();
    } catch (error) {
      throw new HttpException({
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: 'Erro no servidor, tente novamente mais tarde',
        error: 'Internal Server Error'
      }, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Get('by-post/:postId')
  @ApiOperation({
    summary: 'Obter mídias por ID da postagem',
    description: 'Endpoint para obter todas as mídias relacionadas a uma postagem específica'
  })
  @ApiParam({
    name: 'postId',
    description: 'ID da postagem',
    type: 'number',
    example: 1
  })
  @ApiResponse({
    status: 200,
    description: 'Lista de mídias da postagem',
    type: [MediaResponseDto]
  })
  async findByPost(@Param('postId', ParseIntPipe) postId: number): Promise<MediaResponseDto[]> {
    try {
      return await this.mediaService.findByPost(postId);
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
    summary: 'Obter mídia por ID',
    description: 'Endpoint para obter uma mídia específica pelo ID'
  })
  @ApiParam({
    name: 'id',
    description: 'ID da mídia',
    type: 'number',
    example: 1
  })
  @ApiResponse({
    status: 200,
    description: 'Mídia encontrada',
    type: MediaResponseDto
  })
  @ApiResponse({
    status: 404,
    description: 'Mídia não encontrada'
  })
  async findOne(@Param('id', ParseIntPipe) id: number): Promise<MediaResponseDto> {
    try {
      return await this.mediaService.findOne(id);
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
    summary: 'Atualizar mídia',
    description: 'Endpoint para atualizar uma mídia existente'
  })
  @ApiParam({
    name: 'id',
    description: 'ID da mídia',
    type: 'number',
    example: 1
  })
  @ApiResponse({
    status: 200,
    description: 'Mídia atualizada com sucesso',
    type: MediaResponseDto
  })
  @ApiResponse({
    status: 400,
    description: 'Dados inválidos - Validação de campos'
  })
  @ApiResponse({
    status: 404,
    description: 'Mídia não encontrada'
  })
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateMediaDto: UpdateMediaDto
  ): Promise<MediaResponseDto> {
    try {
      return await this.mediaService.update(id, updateMediaDto);
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
    summary: 'Remover mídia',
    description: 'Endpoint para remover uma mídia'
  })
  @ApiParam({
    name: 'id',
    description: 'ID da mídia',
    type: 'number',
    example: 1
  })
  @ApiResponse({
    status: 200,
    description: 'Mídia removida com sucesso',
    schema: {
      type: 'object',
      properties: {
        message: {
          type: 'string',
          example: 'Mídia removida com sucesso'
        }
      }
    }
  })
  @ApiResponse({
    status: 404,
    description: 'Mídia não encontrada'
  })
  async remove(@Param('id', ParseIntPipe) id: number): Promise<{ message: string }> {
    try {
      return await this.mediaService.remove(id);
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
}
