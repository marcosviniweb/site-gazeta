import {
  Controller,
  Post,
  Delete,
  Body,
  UseInterceptors,
  UploadedFile,
  Req,
  HttpException,
  HttpStatus
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiConsumes,
  ApiBody
} from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import { ContentMediaService } from './content-media.service';
import { ContentMediaResponseDto } from './dto/content-media-response.dto';
import { DeleteContentMediaDto } from './dto/delete-content-media.dto';
import { Request } from 'express';

@ApiTags('Content Media')
@Controller('content-media')
export class ContentMediaController {
  constructor(private readonly contentMediaService: ContentMediaService) {}

  private getBaseUrl(req: Request): string {
    const rawProto = req.headers['x-forwarded-proto'] as string;
    const forwardedProto = rawProto ? rawProto.split(',')[0].trim() : undefined;
    const forwardedHost = (req.headers['x-forwarded-host'] as string) || undefined;
    const host = forwardedHost || req.get('host') || '';
    const protocol = forwardedProto || (req.protocol || 'http');
    const envBase = process.env.BASE_URL;
    return envBase || (host ? `${protocol}://${host}` : '');
  }

  @Post('upload')
  @UseInterceptors(FileInterceptor('file'))
  @ApiConsumes('multipart/form-data')
  @ApiOperation({
    summary: 'Upload de imagem de conteúdo',
    description: 'Endpoint para fazer upload de imagem que será usada no conteúdo da notícia. Apenas salva o tamanho original, sem criar registro de mídia destacada.'
  })
  @ApiBody({
    description: 'Dados do upload de imagem de conteúdo',
    type: 'multipart/form-data',
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
          description: 'Arquivo de imagem (JPG, PNG, WEBP)',
          example: 'imagem.jpg'
        }
      },
      required: ['file']
    }
  })
  @ApiResponse({
    status: 201,
    description: 'Imagem de conteúdo enviada com sucesso',
    type: ContentMediaResponseDto,
    schema: {
      example: {
        url: 'http://localhost:3000/uploads/1704067200000/imagem.jpg'
      }
    }
  })
  @ApiResponse({
    status: 400,
    description: 'Arquivo inválido ou dados incorretos',
    schema: {
      examples: {
        noFile: {
          summary: 'Nenhum arquivo enviado',
          value: {
            statusCode: 400,
            message: 'Arquivo não fornecido'
          }
        },
        invalidType: {
          summary: 'Tipo de arquivo inválido',
          value: {
            statusCode: 400,
            message: 'Tipo de arquivo não permitido. Use JPG, PNG ou WEBP'
          }
        }
      }
    }
  })
  async uploadContentMedia(
    @Req() req: Request,
    @UploadedFile() file: any
  ): Promise<ContentMediaResponseDto> {
    try {
      const baseUrl = this.getBaseUrl(req);
      return await this.contentMediaService.uploadContentMedia(file, baseUrl);
    } catch (error) {
      throw new HttpException(
        {
          statusCode: error.status || HttpStatus.INTERNAL_SERVER_ERROR,
          message: error.message || 'Erro ao fazer upload da imagem de conteúdo',
          error: 'Internal Server Error'
        },
        error.status || HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Post('upload-video')
  @UseInterceptors(FileInterceptor('file'))
  @ApiConsumes('multipart/form-data')
  @ApiOperation({
    summary: 'Upload de vídeo de conteúdo',
    description:
      'Upload de arquivo de vídeo (MP4/MOV/M4V) para embutir no HTML da notícia. Retorna URL pública; o vínculo com a notícia ocorre no sync ao salvar.'
  })
  @ApiBody({
    description: 'Arquivo de vídeo',
    type: 'multipart/form-data',
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
          description: 'Vídeo (MP4, M4V, MOV)',
          example: 'clip.mp4'
        }
      },
      required: ['file']
    }
  })
  @ApiResponse({
    status: 201,
    description: 'Vídeo enviado com sucesso',
    type: ContentMediaResponseDto
  })
  async uploadContentVideo(
    @Req() req: Request,
    @UploadedFile() file: any
  ): Promise<ContentMediaResponseDto> {
    try {
      const baseUrl = this.getBaseUrl(req);
      return await this.contentMediaService.uploadContentVideo(file, baseUrl);
    } catch (error) {
      throw new HttpException(
        {
          statusCode: error.status || HttpStatus.INTERNAL_SERVER_ERROR,
          message: error.message || 'Erro ao fazer upload do vídeo de conteúdo',
          error: 'Internal Server Error'
        },
        error.status || HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Delete()
  @ApiOperation({
    summary: 'Deletar imagem de conteúdo',
    description: 'Endpoint para deletar uma imagem de conteúdo pelo URL. Remove o arquivo físico e o registro do banco de dados.'
  })
  @ApiResponse({
    status: 200,
    description: 'Imagem deletada com sucesso',
    schema: {
      example: {
        message: 'Imagem deletada com sucesso'
      }
    }
  })
  @ApiResponse({
    status: 404,
    description: 'Imagem não encontrada',
    schema: {
      example: {
        statusCode: 404,
        message: 'Imagem não encontrada'
      }
    }
  })
  async deleteContentMedia(
    @Body() deleteDto: DeleteContentMediaDto
  ): Promise<{ message: string }> {
    try {
      await this.contentMediaService.deleteByUrl(deleteDto.url);
      return { message: 'Imagem deletada com sucesso' };
    } catch (error) {
      throw new HttpException(
        {
          statusCode: error.status || HttpStatus.INTERNAL_SERVER_ERROR,
          message: error.message || 'Erro ao deletar imagem de conteúdo',
          error: 'Internal Server Error'
        },
        error.status || HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }
}

