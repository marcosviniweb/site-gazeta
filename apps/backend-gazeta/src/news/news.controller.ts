import { 
  Controller, 
  Get, 
  Post, 
  Body, 
  Patch, 
  Param, 
  Delete, 
  UseGuards, 
  Request,
  HttpException, 
  HttpStatus,
  ConflictException,
  NotFoundException,
  ParseIntPipe,
  Query
} from '@nestjs/common';
import { 
  ApiTags, 
  ApiOperation, 
  ApiResponse, 
  ApiBearerAuth,
  ApiParam,
  ApiQuery 
} from '@nestjs/swagger';
import { NewsService } from './news.service';
import { CreateNewsDto } from './dto/create-news.dto';
import { UpdateNewsDto } from './dto/update-news.dto';
import { NewsResponseDto } from './dto/news-response.dto';
import { UpdateNewsStatusDto } from './dto/update-news-status.dto';
import { NewsQueryDto } from './dto/news-query.dto';
import { NewsSearchDto } from './dto/news-search.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('Notícias')
@Controller('news')
export class NewsController {
  constructor(private readonly newsService: NewsService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ 
    summary: 'Criar nova notícia', 
    description: 'Endpoint para criar uma nova notícia com mídias e vídeos' 
  })
  @ApiResponse({ 
    status: 201, 
    description: 'Notícia criada com sucesso', 
    type: NewsResponseDto 
  })
  @ApiResponse({ 
    status: 400, 
    description: 'Dados inválidos - Validação de campos obrigatórios' 
  })
  @ApiResponse({ 
    status: 401, 
    description: 'Token inválido ou não fornecido' 
  })
  @ApiResponse({ 
    status: 409, 
    description: 'Slug já existe - Escolha outro slug único' 
  })
  async create(@Body() createNewsDto: CreateNewsDto, @Request() req): Promise<NewsResponseDto> {
    try {
      console.log('=== CONTROLLER NEWS - User ID:', req.user.id);
      return await this.newsService.create(createNewsDto, req.user.id);
    } catch (error) {
      console.error('=== CONTROLLER ERROR:', error.message);
      if (error instanceof ConflictException || error instanceof NotFoundException) {
        throw error;
      }
      throw new HttpException({
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: 'Erro no servidor, tente novamente mais tarde',
        error: 'Internal Server Error'
      }, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Get('search')
  @ApiOperation({ 
    summary: 'Buscar notícias', 
    description: 'Endpoint para buscar notícias por título, subtítulo ou nome da categoria. Retorna apenas notícias ativas ordenadas por relevância.' 
  })
  @ApiQuery({ 
    name: 'search', 
    type: 'string', 
    required: true, 
    description: 'Termo de busca (mínimo 2 caracteres)',
    example: 'tecnologia'
  })
  @ApiQuery({ 
    name: 'limit', 
    type: 'number', 
    required: false, 
    description: 'Número máximo de resultados (padrão: 50)',
    example: 20
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Lista de notícias encontradas',
    type: [NewsResponseDto]
  })
  @ApiResponse({ 
    status: 400, 
    description: 'Termo de busca inválido (menos de 2 caracteres)' 
  })
  async search(
    @Query('search') search: string,
    @Query('limit') limit?: number
  ): Promise<NewsResponseDto[]> {
    try {
      if (!search || search.trim().length < 2) {
        throw new HttpException({
          statusCode: HttpStatus.BAD_REQUEST,
          message: 'O termo de busca deve ter no mínimo 2 caracteres',
          error: 'Bad Request'
        }, HttpStatus.BAD_REQUEST);
      }

      const limitNumber = limit ? parseInt(limit.toString(), 10) : 50;
      return await this.newsService.search(search, limitNumber);
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
    summary: 'Listar todas as notícias com filtros', 
    description: 'Endpoint para obter todas as notícias com suas mídias e vídeos. Por padrão, retorna apenas notícias ativas. Permite filtrar por status, categoria(s), notícias em destaque e incluir itens do lixo.' 
  })
  @ApiQuery({ 
    name: 'status', 
    enum: ['ACTIVE', 'INACTIVE', 'TRASH'], 
    required: false, 
    description: 'Filtrar por status específico (ACTIVE, INACTIVE ou TRASH)' 
  })
  @ApiQuery({ 
    name: 'includeTrash', 
    type: 'boolean', 
    required: false, 
    description: 'Incluir itens do lixo na consulta (true ou false)' 
  })
  @ApiQuery({ 
    name: 'categoryId', 
    type: 'string', 
    required: false, 
    description: 'Filtrar por ID(s) de categoria. Aceita um único ID ou múltiplos IDs separados por vírgula. Exemplo: "1" ou "1,2,3"',
    example: '1,2,3'
  })
  @ApiQuery({ 
    name: 'isEmphasis', 
    type: 'boolean', 
    required: false, 
    description: 'Filtrar por notícias em destaque. Use true para listar apenas notícias em destaque, false para notícias não destacadas, ou omita para listar todas',
    example: true
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Lista de notícias com mídias e vídeos',
    type: [NewsResponseDto]
  })
  async findAll(@Query() query: NewsQueryDto): Promise<NewsResponseDto[]> {
    try {
      return await this.newsService.findAll(query);
    } catch (error) {
      throw new HttpException({
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: 'Erro no servidor, tente novamente mais tarde',
        error: 'Internal Server Error'
      }, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Get('trash')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ 
    summary: 'Listar notícias no lixo', 
    description: 'Endpoint para obter todas as notícias que estão no lixo' 
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Lista de notícias no lixo',
    type: [NewsResponseDto]
  })
  @ApiResponse({ 
    status: 401, 
    description: 'Token inválido ou não fornecido' 
  })
  async findTrash(): Promise<NewsResponseDto[]> {
    try {
      return await this.newsService.findTrash();
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
    summary: 'Listar notícias em destaque', 
    description: 'Endpoint para obter todas as notícias que estão marcadas como destaque (isEmphasis = true). Retorna apenas notícias ativas, ordenadas por data de criação (mais recente primeiro) e visualizações como critério de desempate.' 
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Lista de notícias em destaque',
    type: [NewsResponseDto]
  })
  async findFeatured(): Promise<NewsResponseDto[]> {
    try {
      return await this.newsService.findFeatured();
    } catch (error) {
      throw new HttpException({
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: 'Erro no servidor, tente novamente mais tarde',
        error: 'Internal Server Error'
      }, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Get('category/:categoryId')
  @ApiOperation({ 
    summary: 'Listar notícias por categoria', 
    description: 'Endpoint para obter todas as notícias de uma categoria específica. Retorna apenas notícias ativas.' 
  })
  @ApiParam({ 
    name: 'categoryId', 
    description: 'ID da categoria', 
    type: 'number',
    example: 1
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Lista de notícias da categoria',
    type: [NewsResponseDto]
  })
  async findByCategory(@Param('categoryId', ParseIntPipe) categoryId: number): Promise<NewsResponseDto[]> {
    try {
      return await this.newsService.findAll({ categoryId: [categoryId] });
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
    summary: 'Obter notícia por ID', 
    description: 'Endpoint para obter uma notícia específica pelo ID com suas mídias e vídeos' 
  })
  @ApiParam({ 
    name: 'id', 
    description: 'ID da notícia', 
    type: 'number',
    example: 1
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Notícia encontrada com mídias e vídeos',
    type: NewsResponseDto
  })
  @ApiResponse({ 
    status: 404, 
    description: 'Notícia não encontrada' 
  })
  async findOne(@Param('id', ParseIntPipe) id: number): Promise<NewsResponseDto> {
    try {
      return await this.newsService.findOne(id);
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

  @Get('slug/:slug')
  @ApiOperation({ 
    summary: 'Obter notícia por slug', 
    description: 'Endpoint para obter uma notícia específica pelo slug com suas mídias e vídeos' 
  })
  @ApiParam({ 
    name: 'slug', 
    description: 'Slug da notícia', 
    type: 'string',
    example: 'nova-tecnologia-revoluciona-mercado'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Notícia encontrada com mídias e vídeos',
    type: NewsResponseDto
  })
  @ApiResponse({ 
    status: 404, 
    description: 'Notícia não encontrada' 
  })
  async findBySlug(@Param('slug') slug: string): Promise<NewsResponseDto> {
    try {
      return await this.newsService.findBySlug(slug);
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
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ 
    summary: 'Atualizar notícia', 
    description: 'Endpoint para atualizar uma notícia existente com suas mídias e vídeos' 
  })
  @ApiParam({ 
    name: 'id', 
    description: 'ID da notícia', 
    type: 'number',
    example: 1
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Notícia atualizada com sucesso',
    type: NewsResponseDto
  })
  @ApiResponse({ 
    status: 400, 
    description: 'Dados inválidos - Validação de campos' 
  })
  @ApiResponse({ 
    status: 401, 
    description: 'Token inválido ou não fornecido' 
  })
  @ApiResponse({ 
    status: 404, 
    description: 'Notícia não encontrada' 
  })
  @ApiResponse({ 
    status: 409, 
    description: 'Slug já existe - Escolha outro slug único' 
  })
  async update(
    @Param('id', ParseIntPipe) id: number, 
    @Body() updateNewsDto: UpdateNewsDto
  ): Promise<NewsResponseDto> {
    try {
      return await this.newsService.update(id, updateNewsDto);
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof ConflictException) {
        throw error;
      }
      throw new HttpException({
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: 'Erro no servidor, tente novamente mais tarde',
        error: 'Internal Server Error'
      }, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Patch(':id/status')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ 
    summary: 'Atualizar status da notícia', 
    description: 'Endpoint para alterar o status de uma notícia (ACTIVE, INACTIVE, TRASH)' 
  })
  @ApiParam({ 
    name: 'id', 
    description: 'ID da notícia', 
    type: 'number',
    example: 1
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Status da notícia atualizado com sucesso',
    type: NewsResponseDto
  })
  @ApiResponse({ 
    status: 401, 
    description: 'Token inválido ou não fornecido' 
  })
  @ApiResponse({ 
    status: 404, 
    description: 'Notícia não encontrada' 
  })
  async updateStatus(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateStatusDto: UpdateNewsStatusDto
  ): Promise<NewsResponseDto> {
    try {
      return await this.newsService.updateStatus(id, updateStatusDto);
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

  @Patch(':id/activate')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ 
    summary: 'Ativar notícia', 
    description: 'Endpoint para ativar uma notícia (status = ACTIVE)' 
  })
  @ApiParam({ 
    name: 'id', 
    description: 'ID da notícia', 
    type: 'number',
    example: 1
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Notícia ativada com sucesso',
    type: NewsResponseDto
  })
  @ApiResponse({ 
    status: 401, 
    description: 'Token inválido ou não fornecido' 
  })
  @ApiResponse({ 
    status: 404, 
    description: 'Notícia não encontrada' 
  })
  async activate(@Param('id', ParseIntPipe) id: number): Promise<NewsResponseDto> {
    try {
      return await this.newsService.activate(id);
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

  @Patch(':id/deactivate')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ 
    summary: 'Desativar notícia', 
    description: 'Endpoint para desativar uma notícia (status = INACTIVE)' 
  })
  @ApiParam({ 
    name: 'id', 
    description: 'ID da notícia', 
    type: 'number',
    example: 1
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Notícia desativada com sucesso',
    type: NewsResponseDto
  })
  @ApiResponse({ 
    status: 401, 
    description: 'Token inválido ou não fornecido' 
  })
  @ApiResponse({ 
    status: 404, 
    description: 'Notícia não encontrada' 
  })
  async deactivate(@Param('id', ParseIntPipe) id: number): Promise<NewsResponseDto> {
    try {
      return await this.newsService.deactivate(id);
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

  @Patch(':id/trash')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ 
    summary: 'Mover notícia para o lixo', 
    description: 'Endpoint para mover uma notícia para o lixo (status = TRASH)' 
  })
  @ApiParam({ 
    name: 'id', 
    description: 'ID da notícia', 
    type: 'number',
    example: 1
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Notícia movida para o lixo com sucesso',
    type: NewsResponseDto
  })
  @ApiResponse({ 
    status: 401, 
    description: 'Token inválido ou não fornecido' 
  })
  @ApiResponse({ 
    status: 404, 
    description: 'Notícia não encontrada' 
  })
  async moveToTrash(@Param('id', ParseIntPipe) id: number): Promise<NewsResponseDto> {
    try {
      return await this.newsService.moveToTrash(id);
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

  @Patch(':id/restore')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ 
    summary: 'Restaurar notícia do lixo', 
    description: 'Endpoint para restaurar uma notícia do lixo (status = ACTIVE)' 
  })
  @ApiParam({ 
    name: 'id', 
    description: 'ID da notícia', 
    type: 'number',
    example: 1
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Notícia restaurada com sucesso',
    type: NewsResponseDto
  })
  @ApiResponse({ 
    status: 401, 
    description: 'Token inválido ou não fornecido' 
  })
  @ApiResponse({ 
    status: 404, 
    description: 'Notícia não encontrada no lixo' 
  })
  async restore(@Param('id', ParseIntPipe) id: number): Promise<NewsResponseDto> {
    try {
      return await this.newsService.restore(id);
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
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ 
    summary: 'Excluir notícia', 
    description: 'Endpoint para excluir uma notícia e todas suas mídias e vídeos relacionados' 
  })
  @ApiParam({ 
    name: 'id', 
    description: 'ID da notícia', 
    type: 'number',
    example: 1
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Notícia excluída com sucesso' 
  })
  @ApiResponse({ 
    status: 401, 
    description: 'Token inválido ou não fornecido' 
  })
  @ApiResponse({ 
    status: 404, 
    description: 'Notícia não encontrada' 
  })
  async remove(@Param('id', ParseIntPipe) id: number): Promise<{ message: string }> {
    try {
      await this.newsService.remove(id);
      return { message: 'Notícia excluída com sucesso' };
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

  @Delete(':id/permanent')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ 
    summary: 'Excluir permanentemente do lixo', 
    description: 'Endpoint para excluir permanentemente uma notícia que está no lixo' 
  })
  @ApiParam({ 
    name: 'id', 
    description: 'ID da notícia', 
    type: 'number',
    example: 1
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Notícia excluída permanentemente com sucesso' 
  })
  @ApiResponse({ 
    status: 401, 
    description: 'Token inválido ou não fornecido' 
  })
  @ApiResponse({ 
    status: 404, 
    description: 'Notícia não encontrada no lixo' 
  })
  async permanentDelete(@Param('id', ParseIntPipe) id: number): Promise<{ message: string }> {
    try {
      await this.newsService.permanentDelete(id);
      return { message: 'Notícia excluída permanentemente com sucesso' };
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

  @Post(':id/view')
  @ApiOperation({ 
    summary: 'Incrementar visualização', 
    description: 'Endpoint para incrementar o contador de visualizações da notícia (apenas para notícias publicadas)' 
  })
  @ApiParam({ 
    name: 'id', 
    description: 'ID da notícia', 
    type: 'number',
    example: 1
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Visualização incrementada com sucesso',
    schema: {
      type: 'object',
      properties: {
        views: {
          type: 'number',
          example: 1251,
          description: 'Número atualizado de visualizações'
        }
      }
    }
  })
  @ApiResponse({ 
    status: 404, 
    description: 'Notícia não encontrada ou não publicada' 
  })
  async incrementView(@Param('id', ParseIntPipe) id: number): Promise<{ views: number }> {
    try {
      const views = await this.newsService.incrementView(id);
      return { views };
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