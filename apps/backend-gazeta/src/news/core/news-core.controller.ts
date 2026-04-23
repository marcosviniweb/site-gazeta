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
import { NewsCoreService } from './news-core.service';
import { CreateNewsDto } from '../dto/create-news.dto';
import { UpdateNewsDto } from '../dto/update-news.dto';
import { NewsResponseDto } from '../dto/news-response.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { ToggleEmphasisDto } from '../dto/toggle-emphasis.dto';
import { BulkToggleEmphasisDto, BulkDeleteDto } from '../dto/bulk-news.dto';
import { NewsErrorInterceptor } from '../interceptors/news-error.interceptor';

@ApiTags('Notícias - CRUD')
@Controller('news')
@UseInterceptors(NewsErrorInterceptor)
export class NewsCoreController {
  constructor(private readonly newsCoreService: NewsCoreService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Criar nova notícia',
    description: 'Endpoint para criar uma nova notícia com mídias e vídeos'
  })
  @ApiResponse({ status: 201, description: 'Notícia criada com sucesso', type: NewsResponseDto })
  @ApiResponse({ status: 400, description: 'Dados inválidos' })
  @ApiResponse({ status: 401, description: 'Não autorizado' })
  @ApiResponse({ status: 409, description: 'Slug já existe' })
  async create(@Body() createNewsDto: CreateNewsDto, @Request() req): Promise<NewsResponseDto> {
    console.log('=== CONTROLLER NEWS - User ID:', req.user.id);
    return await this.newsCoreService.create(createNewsDto, req.user.id);
  }

  @Get('slug/:slug')
  @ApiOperation({ summary: 'Obter notícia por slug' })
  @ApiParam({ name: 'slug', description: 'Slug da notícia', type: 'string' })
  @ApiResponse({ status: 200, description: 'Notícia encontrada', type: NewsResponseDto })
  @ApiResponse({ status: 404, description: 'Notícia não encontrada' })
  async findBySlug(@Param('slug') slug: string): Promise<NewsResponseDto> {
    return await this.newsCoreService.findBySlug(slug);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obter notícia por ID' })
  @ApiParam({ name: 'id', description: 'ID da notícia', type: 'number' })
  @ApiResponse({ status: 200, description: 'Notícia encontrada', type: NewsResponseDto })
  @ApiResponse({ status: 404, description: 'Notícia não encontrada' })
  async findOne(@Param('id', ParseIntPipe) id: number): Promise<NewsResponseDto> {
    return await this.newsCoreService.findOne(id);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Atualizar notícia' })
  @ApiParam({ name: 'id', description: 'ID da notícia', type: 'number' })
  @ApiResponse({ status: 200, description: 'Notícia atualizada', type: NewsResponseDto })
  @ApiResponse({ status: 400, description: 'Dados inválidos' })
  @ApiResponse({ status: 404, description: 'Notícia não encontrada' })
  @ApiResponse({ status: 409, description: 'Slug já existe' })
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateNewsDto: UpdateNewsDto
  ): Promise<NewsResponseDto> {
    return await this.newsCoreService.update(id, updateNewsDto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Excluir notícia' })
  @ApiParam({ name: 'id', description: 'ID da notícia', type: 'number' })
  @ApiResponse({ status: 200, description: 'Notícia excluída com sucesso' })
  @ApiResponse({ status: 401, description: 'Não autorizado' })
  @ApiResponse({ status: 404, description: 'Notícia não encontrada' })
  async remove(@Param('id', ParseIntPipe) id: number): Promise<{ message: string }> {
    await this.newsCoreService.remove(id);
    return { message: 'Notícia excluída com sucesso' };
  }

  @Patch(':id/emphasis')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Atualizar destaque da notícia' })
  @ApiParam({ name: 'id', description: 'ID da notícia', type: 'number' })
  @ApiResponse({ status: 200, description: 'Destaque atualizado com sucesso' })
  @ApiResponse({ status: 404, description: 'Notícia não encontrada' })
  async updateEmphasis(
    @Param('id', ParseIntPipe) id: number,
    @Body() toggleDto: ToggleEmphasisDto
  ): Promise<any> {
    return await this.newsCoreService.updateEmphasis(id, toggleDto.isEmphasis);
  }

  @Patch('bulk/emphasis')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ 
    summary: 'Atualizar destaque em lote',
    description: 'Permite definir como destaque ou remover o destaque de múltiplas notícias de uma só vez.'
  })
  @ApiResponse({ status: 200, description: 'Destaque das notícias atualizado com sucesso' })
  @ApiResponse({ status: 401, description: 'Não autorizado' })
  async bulkUpdateEmphasis(
    @Body() bulkDto: BulkToggleEmphasisDto
  ): Promise<{ count: number }> {
    return await this.newsCoreService.bulkUpdateEmphasis(bulkDto.ids, bulkDto.isEmphasis);
  }

  @Delete('bulk/delete')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ 
    summary: 'Exclusão permanente em lote',
    description: 'Remove permanentemente múltiplas notícias e seus arquivos físicos.'
  })
  @ApiResponse({ status: 200, description: 'Notícias excluídas com sucesso' })
  @ApiResponse({ status: 401, description: 'Não autorizado' })
  async bulkRemove(
    @Body() bulkDto: BulkDeleteDto
  ): Promise<{ count: number }> {
    return await this.newsCoreService.bulkRemove(bulkDto.ids);
  }
}

