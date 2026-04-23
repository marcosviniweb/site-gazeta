import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  ParseIntPipe,
  UseInterceptors
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam
} from '@nestjs/swagger';
import { NewsVideoService } from './news-video.service';
import { CreateNewsVideoDto } from './dto/create-news-video.dto';
import { UpdateNewsVideoDto } from './dto/update-news-video.dto';
import { NewsVideoResponseDto } from './dto/news-video-response.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { NewsErrorInterceptor } from '../news/interceptors/news-error.interceptor';

@ApiTags('Vídeos de Notícias')
@Controller('news-videos')
@UseInterceptors(NewsErrorInterceptor)
export class NewsVideoController {
  constructor(private readonly newsVideoService: NewsVideoService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Criar novo vídeo para notícia',
    description: 'Endpoint para adicionar um novo vídeo a uma notícia específica'
  })
  @ApiResponse({ status: 201, description: 'Vídeo criado com sucesso', type: NewsVideoResponseDto })
  @ApiResponse({ status: 400, description: 'Dados inválidos' })
  @ApiResponse({ status: 401, description: 'Não autorizado' })
  @ApiResponse({ status: 404, description: 'Notícia não encontrada' })
  async create(@Body() createNewsVideoDto: CreateNewsVideoDto): Promise<NewsVideoResponseDto> {
    return await this.newsVideoService.create(createNewsVideoDto);
  }

  @Get()
  @ApiOperation({ summary: 'Listar todos os vídeos' })
  @ApiResponse({ status: 200, description: 'Lista de vídeos de notícias', type: [NewsVideoResponseDto] })
  async findAll(): Promise<NewsVideoResponseDto[]> {
    return await this.newsVideoService.findAll();
  }

  @Get('news/:newsId')
  @ApiOperation({ summary: 'Listar vídeos por notícia' })
  @ApiParam({ name: 'newsId', description: 'ID da notícia', type: 'number' })
  @ApiResponse({ status: 200, description: 'Lista de vídeos da notícia', type: [NewsVideoResponseDto] })
  async findByNewsId(@Param('newsId', ParseIntPipe) newsId: number): Promise<NewsVideoResponseDto[]> {
    return await this.newsVideoService.findByNewsId(newsId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obter vídeo por ID' })
  @ApiParam({ name: 'id', description: 'ID do vídeo', type: 'number' })
  @ApiResponse({ status: 200, description: 'Vídeo encontrado', type: NewsVideoResponseDto })
  @ApiResponse({ status: 404, description: 'Vídeo não encontrado' })
  async findOne(@Param('id', ParseIntPipe) id: number): Promise<NewsVideoResponseDto> {
    return await this.newsVideoService.findOne(id);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Atualizar vídeo' })
  @ApiParam({ name: 'id', description: 'ID do vídeo', type: 'number' })
  @ApiResponse({ status: 200, description: 'Vídeo atualizado com sucesso', type: NewsVideoResponseDto })
  @ApiResponse({ status: 400, description: 'Dados inválidos' })
  @ApiResponse({ status: 401, description: 'Não autorizado' })
  @ApiResponse({ status: 404, description: 'Vídeo não encontrada' })
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateNewsVideoDto: UpdateNewsVideoDto
  ): Promise<NewsVideoResponseDto> {
    return await this.newsVideoService.update(id, updateNewsVideoDto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Deletar vídeo' })
  @ApiParam({ name: 'id', description: 'ID do vídeo', type: 'number' })
  @ApiResponse({ status: 200, description: 'Vídeo deletado com sucesso' })
  @ApiResponse({ status: 401, description: 'Não autorizado' })
  @ApiResponse({ status: 404, description: 'Vídeo não encontrado' })
  async remove(@Param('id', ParseIntPipe) id: number): Promise<{ message: string }> {
    return await this.newsVideoService.remove(id);
  }
}