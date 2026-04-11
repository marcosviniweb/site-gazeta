import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseInterceptors,
  UploadedFile,
  Query,
  UseGuards,
  Request,
  ParseIntPipe,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiResponse, ApiConsumes, ApiBody, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { AdvertisementService } from './advertisement.service';
import { CreateAdvertisementDto } from './dto/create-advertisement.dto';
import { UpdateAdvertisementDto } from './dto/update-advertisement.dto';
import { AdvertisementResponseDto } from './dto/advertisement-response.dto';
import { AdsQueryDto } from './dto/ads-query.dto';
import { AdsPaginatedResponse } from './dto/ads-paginated-response.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

interface UserRequest extends Request {
  user: {
    id: number;
    email: string;
    role: string;
  };
}

@ApiTags('Anúncios')
@Controller('advertisements')
export class AdvertisementController {
  constructor(private readonly advertisementService: AdvertisementService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(FileInterceptor('image'))
  @ApiOperation({ summary: 'Criar novo anúncio com imagem' })
  @ApiConsumes('multipart/form-data')
  @ApiBearerAuth()
  @ApiBody({
    description: 'Dados do anúncio e imagem',
    schema: {
      type: 'object',
      properties: {
        title: { type: 'string', example: 'Promoção Especial' },
        description: { type: 'string', example: 'Uma oferta imperdível!' },
        clickUrl: { type: 'string', example: 'https://exemplo.com/promocao' },
        position: { type: 'string', enum: ['top', 'bottom', 'sidebar', 'header', 'footer', 'content', 'lateral'] },
        placement: { type: 'string', enum: ['home', 'news'] },
        size: { type: 'string', enum: ['728x90', '300x250', '160x600', '200x200'], example: '728x90' },
        isActive: { type: 'boolean', default: true },
        priority: { type: 'number', minimum: 0, maximum: 10, default: 0 },
        startDate: { type: 'string', format: 'date-time' },
        endDate: { type: 'string', format: 'date-time' },
        image: { type: 'string', format: 'binary' },
      },
      required: ['title', 'position', 'placement', 'size', 'image'],
    },
  })
  @ApiResponse({ status: 201, description: 'Anúncio criado com sucesso', type: AdvertisementResponseDto })
  @ApiResponse({ status: 400, description: 'Dados inválidos' })
  @ApiResponse({ status: 401, description: 'Não autorizado' })
  async create(
    @Body() createAdvertisementDto: CreateAdvertisementDto,
    @UploadedFile() file: Express.Multer.File,
    @Request() req: UserRequest,
  ): Promise<AdvertisementResponseDto> {
    if (!file) {
      throw new BadRequestException('Imagem é obrigatória');
    }

    return this.advertisementService.create(createAdvertisementDto, file, req.user.id);
  }

  @Get()
  @ApiOperation({ summary: 'Listar todos os anúncios com filtros e paginação' })
  @ApiQuery({ name: 'placement', required: false, enum: ['home', 'news'] })
  @ApiQuery({ name: 'position', required: false, enum: ['top', 'bottom', 'sidebar', 'header', 'footer', 'content', 'lateral'] })
  @ApiQuery({ name: 'active', required: false, type: 'boolean' })
  @ApiQuery({ name: 'search', required: false, type: 'string' })
  @ApiResponse({ status: 200, description: 'Lista paginada de anúncios', type: AdsPaginatedResponse })
  async findAll(@Query() query: AdsQueryDto): Promise<AdsPaginatedResponse> {
    return this.advertisementService.findAll(query);
  }

  @Get('by-page/:placement')
  @ApiOperation({ summary: 'Buscar anúncios ativos por página' })
  @ApiResponse({ status: 200, description: 'Lista de anúncios ativos da página', type: [AdvertisementResponseDto] })
  async findByPlacement(
    @Param('placement') placement: string,
  ): Promise<AdvertisementResponseDto[]> {
    return this.advertisementService.findByPlacement(placement);
  }

  @Get('active/:placement/:position')
  @ApiOperation({ summary: 'Buscar anúncios ativos por local e posição' })
  @ApiResponse({ status: 200, description: 'Mapa de anúncios ativos por tamanho', type: AdvertisementResponseDto })
  async findActiveByPlacementAndPosition(
    @Param('placement') placement: string,
    @Param('position') position: string,
  ): Promise<Record<string, AdvertisementResponseDto>> {
    return this.advertisementService.findActiveByPlacementAndPosition(placement, position);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Buscar anúncio por ID' })
  @ApiResponse({ status: 200, description: 'Anúncio encontrado', type: AdvertisementResponseDto })
  @ApiResponse({ status: 404, description: 'Anúncio não encontrado' })
  async findOne(@Param('id', ParseIntPipe) id: number): Promise<AdvertisementResponseDto> {
    return this.advertisementService.findOne(id);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(FileInterceptor('image'))
  @ApiOperation({ summary: 'Atualizar anúncio' })
  @ApiConsumes('multipart/form-data')
  @ApiBearerAuth()
  @ApiBody({
    description: 'Dados do anúncio e nova imagem (opcional)',
    schema: {
      type: 'object',
      properties: {
        title: { type: 'string' },
        description: { type: 'string' },
        clickUrl: { type: 'string' },
        position: { type: 'string', enum: ['top', 'bottom', 'sidebar', 'header', 'footer', 'content', 'lateral'] },
        placement: { type: 'string', enum: ['home', 'news'] },
        size: { type: 'string', enum: ['728x90', '300x250', '160x600', '200x200'], example: '728x90' },
        isActive: { type: 'boolean' },
        priority: { type: 'number', minimum: 0, maximum: 10 },
        startDate: { type: 'string', format: 'date-time' },
        endDate: { type: 'string', format: 'date-time' },
        image: { type: 'string', format: 'binary' },
      },
    },
  })
  @ApiResponse({ status: 200, description: 'Anúncio atualizado com sucesso', type: AdvertisementResponseDto })
  @ApiResponse({ status: 404, description: 'Anúncio não encontrado' })
  @ApiResponse({ status: 401, description: 'Não autorizado' })
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateAdvertisementDto: UpdateAdvertisementDto,
    @UploadedFile() file: Express.Multer.File,
    @Request() req: UserRequest,
  ): Promise<AdvertisementResponseDto> {
    return this.advertisementService.update(id, updateAdvertisementDto, file, req.user.id);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Deletar anúncio' })
  @ApiBearerAuth()
  @ApiResponse({ status: 200, description: 'Anúncio deletado com sucesso' })
  @ApiResponse({ status: 404, description: 'Anúncio não encontrado' })
  @ApiResponse({ status: 401, description: 'Não autorizado' })
  async remove(@Param('id', ParseIntPipe) id: number, @Request() req: UserRequest): Promise<{ message: string }> {
    await this.advertisementService.remove(id, req.user.id);
    return { message: 'Anúncio deletado com sucesso' };
  }

  @Patch(':id/toggle-active')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Ativar/Desativar anúncio' })
  @ApiBearerAuth()
  @ApiResponse({ status: 200, description: 'Status do anúncio alterado', type: AdvertisementResponseDto })
  @ApiResponse({ status: 404, description: 'Anúncio não encontrado' })
  @ApiResponse({ status: 401, description: 'Não autorizado' })
  async toggleActive(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<AdvertisementResponseDto> {
    return this.advertisementService.toggleActive(id);
  }
}
