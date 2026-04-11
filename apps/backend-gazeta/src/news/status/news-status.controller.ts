import {
  Controller,
  Get,
  Patch,
  Delete,
  Param,
  Body,
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
import { NewsStatusService } from './news-status.service';
import { NewsResponseDto } from '../dto/news-response.dto';
import { UpdateNewsStatusDto } from '../dto/update-news-status.dto';
import { BulkUpdateStatusDto } from '../dto/bulk-news.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { NewsErrorInterceptor } from '../interceptors/news-error.interceptor';

@ApiTags('Notícias - Status')
@Controller('news')
@UseInterceptors(NewsErrorInterceptor)
export class NewsStatusController {
  constructor(private readonly newsStatusService: NewsStatusService) {}

  @Get('trash')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Listar notícias no lixo' })
  @ApiResponse({ status: 200, description: 'Lista de notícias no lixo', type: [NewsResponseDto] })
  @ApiResponse({ status: 401, description: 'Não autorizado' })
  async findTrash(): Promise<NewsResponseDto[]> {
    return await this.newsStatusService.findTrash();
  }

  @Patch(':id/status')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Atualizar status da notícia' })
  @ApiParam({ name: 'id', description: 'ID da notícia', type: 'number' })
  @ApiResponse({ status: 200, description: 'Status atualizado', type: NewsResponseDto })
  @ApiResponse({ status: 401, description: 'Não autorizado' })
  @ApiResponse({ status: 404, description: 'Notícia não encontrada' })
  async updateStatus(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateStatusDto: UpdateNewsStatusDto
  ): Promise<NewsResponseDto> {
    return await this.newsStatusService.updateStatus(id, updateStatusDto);
  }

  @Patch(':id/activate')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Ativar notícia' })
  @ApiParam({ name: 'id', description: 'ID da notícia', type: 'number' })
  @ApiResponse({ status: 200, description: 'Notícia ativada', type: NewsResponseDto })
  @ApiResponse({ status: 401, description: 'Não autorizado' })
  @ApiResponse({ status: 404, description: 'Notícia não encontrada' })
  async activate(@Param('id', ParseIntPipe) id: number): Promise<NewsResponseDto> {
    return await this.newsStatusService.activate(id);
  }

  @Patch(':id/deactivate')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Desativar notícia' })
  @ApiParam({ name: 'id', description: 'ID da notícia', type: 'number' })
  @ApiResponse({ status: 200, description: 'Notícia desativada', type: NewsResponseDto })
  @ApiResponse({ status: 401, description: 'Não autorizado' })
  @ApiResponse({ status: 404, description: 'Notícia não encontrada' })
  async deactivate(@Param('id', ParseIntPipe) id: number): Promise<NewsResponseDto> {
    return await this.newsStatusService.deactivate(id);
  }

  @Patch(':id/trash')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Mover notícia para o lixo' })
  @ApiParam({ name: 'id', description: 'ID da notícia', type: 'number' })
  @ApiResponse({ status: 200, description: 'Notícia movida para o lixo', type: NewsResponseDto })
  @ApiResponse({ status: 401, description: 'Não autorizado' })
  @ApiResponse({ status: 404, description: 'Notícia não encontrada' })
  async moveToTrash(@Param('id', ParseIntPipe) id: number): Promise<NewsResponseDto> {
    return await this.newsStatusService.moveToTrash(id);
  }

  @Patch(':id/restore')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Restaurar notícia do lixo' })
  @ApiParam({ name: 'id', description: 'ID da notícia', type: 'number' })
  @ApiResponse({ status: 200, description: 'Notícia restaurada', type: NewsResponseDto })
  @ApiResponse({ status: 401, description: 'Não autorizado' })
  @ApiResponse({ status: 404, description: 'Notícia não encontrada no lixo' })
  async restore(@Param('id', ParseIntPipe) id: number): Promise<NewsResponseDto> {
    return await this.newsStatusService.restore(id);
  }

  @Delete(':id/permanent')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Excluir permanentemente do lixo' })
  @ApiParam({ name: 'id', description: 'ID da notícia', type: 'number' })
  @ApiResponse({ status: 200, description: 'Notícia excluída permanentemente' })
  @ApiResponse({ status: 401, description: 'Não autorizado' })
  @ApiResponse({ status: 404, description: 'Notícia não encontrada no lixo' })
  async permanentDelete(@Param('id', ParseIntPipe) id: number): Promise<{ message: string }> {
    await this.newsStatusService.permanentDelete(id);
    return { message: 'Notícia excluída permanentemente com sucesso' };
  }

  @Patch('bulk/status')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ 
    summary: 'Atualizar status em lote',
    description: 'Permite ativar, desativar ou mover para lixeira múltiplas notícias de uma só vez.'
  })
  @ApiResponse({ status: 200, description: 'Status das notícias atualizados com sucesso' })
  @ApiResponse({ status: 401, description: 'Não autorizado' })
  async bulkUpdateStatus(
    @Body() bulkDto: BulkUpdateStatusDto
  ): Promise<{ count: number }> {
    return await this.newsStatusService.bulkUpdateStatus(bulkDto.ids, bulkDto.status);
  }
}

