import {
  Controller,
  Get,
  Param,
  Query,
  ParseIntPipe,
  HttpException,
  HttpStatus,
  UseInterceptors
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiQuery,
  ApiParam
} from '@nestjs/swagger';
import { NewsQueryService } from './news-query.service';
import { NewsResponseDto } from '../dto/news-response.dto';
import { NewsQueryDto } from '../dto/news-query.dto';
import { NewsPaginatedResponseDto } from '../dto/news-paginated-response.dto';
import { NewsPaginatedResponse } from './news-query.service';
import { NewsErrorInterceptor } from '../interceptors/news-error.interceptor';

@ApiTags('Notícias - Consultas')
@Controller('news')
@UseInterceptors(NewsErrorInterceptor)
export class NewsQueryController {
  constructor(private readonly newsQueryService: NewsQueryService) {}

  @Get()
  @ApiOperation({
    summary: 'Listar todas as notícias com filtros de status',
    description: 'Endpoint para obter todas as notícias com filtros de status. Por padrão, retorna apenas notícias ativas (ACTIVE). Use endpoints específicos para filtrar por categoria ou destaque: /news/featured, /news/category/:id, etc.'
  })
  @ApiQuery({
    name: 'status',
    enum: ['ACTIVE', 'INACTIVE', 'TRASH'],
    required: false,
    description: 'Filtrar por status específico. Se não fornecido, retorna apenas ACTIVE por padrão.'
  })
  @ApiQuery({
    name: 'includeTrash',
    type: 'boolean',
    required: false,
    description: 'Incluir itens do lixo na consulta. Se true, retorna todas as notícias (ACTIVE, INACTIVE, TRASH). Ignorado se status for fornecido.'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Lista de notícias paginada', 
    type: NewsPaginatedResponseDto
  })
  async findAll(@Query() query: NewsQueryDto): Promise<NewsPaginatedResponse> {
    return await this.newsQueryService.findAll(query);
  }

  @Get('search')
  @ApiOperation({
    summary: 'Buscar notícias',
    description: 'Endpoint para buscar notícias por título, subtítulo ou nome da categoria'
  })
  @ApiQuery({ name: 'search', type: 'string', required: true, example: 'tecnologia' })
  @ApiQuery({ name: 'limit', type: 'number', required: false, example: 20 })
  @ApiResponse({ 
    status: 200, 
    description: 'Lista de notícias encontradas com paginação', 
    type: NewsPaginatedResponseDto
  })
  @ApiResponse({ status: 400, description: 'Termo de busca inválido' })
  async search(
    @Query('search') search: string,
    @Query() query: NewsQueryDto
  ): Promise<NewsPaginatedResponse> {
    if (!search || search.trim().length < 2) {
      throw new HttpException(
        {
          statusCode: HttpStatus.BAD_REQUEST,
          message: 'O termo de busca deve ter no mínimo 2 caracteres',
          error: 'Bad Request'
        },
        HttpStatus.BAD_REQUEST
      );
    }

    return await this.newsQueryService.search({ ...query, search });
  }

  @Get('featured')
  @ApiOperation({ summary: 'Listar notícias em destaque' })
  @ApiQuery({ name: 'exclude', type: 'string', required: false, description: 'IDs de notícias a excluir (separados por vírgula)', example: '1,2,3' })
  @ApiResponse({ status: 200, description: 'Lista de notícias em destaque', type: [NewsResponseDto] })
  async findFeatured(@Query('exclude') exclude?: string): Promise<NewsResponseDto[]> {
    return await this.newsQueryService.findFeatured(exclude);
  }

  @Get('latest-news')
  @ApiOperation({
    summary: 'Listar últimas notícias recentes',
    description: 'Retorna sempre as notícias mais recentes, sem filtro de exclusão. Este endpoint é uma exceção e pode retornar notícias já exibidas em outras seções.'
  })
  @ApiQuery({ name: 'limit', type: 'number', required: false, description: 'Quantidade de notícias a retornar', example: 5 })
  @ApiResponse({ status: 200, description: 'Lista das últimas notícias (sempre as mais recentes)', type: [NewsResponseDto] })
  async findLatestNews(
    @Query('limit') limit?: number
  ): Promise<NewsResponseDto[]> {
    const limitNumber = limit ? parseInt(limit.toString(), 10) : undefined;
    return await this.newsQueryService.findLatestNews(undefined, limitNumber);
  }

  @Get('most-viewed')
  @ApiOperation({
    summary: 'Listar notícias mais vistas',
    description: 'Retorna as notícias mais vistas dos últimos 7 dias. Se não houver, busca da semana anterior e assim sucessivamente.'
  })
  @ApiResponse({ status: 200, description: 'Lista das notícias mais vistas', type: [NewsResponseDto] })
  @ApiResponse({ status: 404, description: 'Não há notícias cadastradas' })
  async findMostViewed(): Promise<NewsResponseDto[]> {
    return await this.newsQueryService.findMostViewed();
  }

  @Get('related-news/:id')
  @ApiOperation({ summary: 'Listar notícias relacionadas' })
  @ApiParam({ name: 'id', description: 'ID da notícia', type: 'number' })
  @ApiResponse({ status: 200, description: 'Lista de notícias relacionadas', type: [NewsResponseDto] })
  @ApiResponse({ status: 404, description: 'Notícia não encontrada' })
  async findRelatedNews(@Param('id', ParseIntPipe) id: number): Promise<NewsResponseDto[]> {
    return await this.newsQueryService.findRelatedNews(id);
  }

  @Get('category/:categoryId')
  @ApiOperation({ summary: 'Listar notícias por categoria' })
  @ApiParam({ name: 'categoryId', description: 'ID da categoria', type: 'number' })
  @ApiQuery({ name: 'exclude', type: 'string', required: false, description: 'IDs de notícias a excluir (separados por vírgula)', example: '1,2,3' })
  @ApiResponse({ status: 200, description: 'Lista de notícias da categoria (apenas ativas)', type: [NewsResponseDto] })
  async findByCategory(
    @Param('categoryId', ParseIntPipe) categoryId: number,
    @Query('exclude') exclude?: string
  ): Promise<NewsResponseDto[]> {
    return await this.newsQueryService.findByCategory(categoryId, exclude);
  }
}

