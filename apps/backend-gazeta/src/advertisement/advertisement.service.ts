import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma } from '../../generated/prisma';
import { CreateAdvertisementDto } from './dto/create-advertisement.dto';
import { UpdateAdvertisementDto } from './dto/update-advertisement.dto';
import { AdvertisementResponseDto } from './dto/advertisement-response.dto';
import { AdsQueryDto } from './dto/ads-query.dto';
import { AdsPaginatedResponse } from './dto/ads-paginated-response.dto';
import { AdvertisementImageService } from './services/advertisement-image.service';

type AdvertisementWithCreator = Prisma.AdvertisementGetPayload<{
  include: {
    creator: {
      select: {
        id: true;
        name: true;
      };
    };
  };
}>;

@Injectable()
export class AdvertisementService {
  constructor(
    private prisma: PrismaService,
    private advertisementImageService: AdvertisementImageService
  ) {}

  async create(
    createAdvertisementDto: CreateAdvertisementDto,
    file: Express.Multer.File,
    userId: number
  ): Promise<AdvertisementResponseDto> {
    // Upload da imagem
    const imageUrl = await this.advertisementImageService.uploadAdvertisementImage(file);

    try {
      const advertisement = await this.prisma.advertisement.create({
        data: {
          title: createAdvertisementDto.title,
          description: createAdvertisementDto.description,
          imageUrl,
          clickUrl: createAdvertisementDto.clickUrl,
          position: createAdvertisementDto.position,
          placement: createAdvertisementDto.placement,
          size: createAdvertisementDto.size,
          isActive: createAdvertisementDto.isActive ?? true,
          priority: createAdvertisementDto.priority ?? 0,
          startDate: createAdvertisementDto.startDate ? new Date(createAdvertisementDto.startDate) : null,
          endDate: createAdvertisementDto.endDate ? new Date(createAdvertisementDto.endDate) : null,
          createdBy: userId,
        },
        include: {
          creator: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      });

      return this.formatResponse(advertisement);
    } catch (error) {
      // Se der erro ao salvar no banco, deletar a imagem que foi uploadada
      await this.advertisementImageService.deleteAdvertisementImage(imageUrl);
      throw new BadRequestException('Erro ao criar anúncio: ' + error.message);
    }
  }

  private buildWhereCondition(query?: AdsQueryDto): Prisma.AdvertisementWhereInput {
    const where: Prisma.AdvertisementWhereInput = {};

    if (query?.active !== undefined) {
      where.isActive = query.active;
    }

    if (query?.search) {
      where.OR = [
        { title: { contains: query.search } },
        { description: { contains: query.search } },
      ];
    }

    if (query?.date) {
      const dateStr = query.date;
      where.createdAt = {
        gte: new Date(`${dateStr}T00:00:00.000Z`),
        lte: new Date(`${dateStr}T23:59:59.999Z`)
      };
    }

    return where;
  }

  private buildOrderByCondition(query?: AdsQueryDto): Prisma.AdvertisementOrderByWithRelationInput[] {
    const orderBy: Prisma.AdvertisementOrderByWithRelationInput[] = [];
    
    if (query?.order) {
      orderBy.push({ createdAt: query.order as Prisma.SortOrder });
    } else {
      orderBy.push({ priority: 'desc' });
      orderBy.push({ createdAt: 'desc' });
    }

    return orderBy;
  }

  async findAll(query?: AdsQueryDto): Promise<AdsPaginatedResponse> {
    const where = this.buildWhereCondition(query);
    const orderBy = this.buildOrderByCondition(query);
    const page = query?.page || 1;
    const limit = query?.limit || 25;
    const skip = (page - 1) * limit;

    const [advertisements, total] = await Promise.all([
      this.prisma.advertisement.findMany({
        where,
        include: {
          creator: {
            select: {
              id: true,
              name: true,
            },
          },
        },
        orderBy,
        skip,
        take: limit,
      }),
      this.prisma.advertisement.count({ where })
    ]);

    return {
      data: advertisements.map(ad => this.formatResponse(ad)),
      meta: {
        total,
        page,
        limit,
        lastPage: Math.ceil(total / limit)
      }
    };
  }

  async findByPlacement(placement: string): Promise<AdvertisementResponseDto[]> {
    const advertisements = await this.prisma.advertisement.findMany({
      where: {
        placement,
        isActive: true,
      },
      include: {
        creator: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: [
        { priority: 'desc' },
        { createdAt: 'desc' }
      ],
    });

    return advertisements.map(ad => this.formatResponse(ad));
  }

  async findActiveByPlacementAndPosition(placement: string, position: string): Promise<Record<string, AdvertisementResponseDto>> {
    const now = new Date();

    const advertisements = await this.prisma.advertisement.findMany({
      where: {
        placement,
        position,
        isActive: true,
        AND: [
          {
            OR: [
              { startDate: null },
              { startDate: { lte: now } }
            ]
          },
          {
            OR: [
              { endDate: null },
              { endDate: { gte: now } }
            ]
          }
        ]
      },
      include: {
        creator: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    const adsBySize = advertisements.reduce<Record<string, AdvertisementWithCreator[]>>((acc, ad) => {
      if (!ad.size) return acc;
      acc[ad.size] = acc[ad.size] ?? [];
      acc[ad.size].push(ad as AdvertisementWithCreator);
      return acc;
    }, {});

    const selectedBySize: Record<string, AdvertisementResponseDto> = {};

    Object.entries(adsBySize).forEach(([size, ads]) => {
      const selected = this.selectAdByPriority(ads);
      if (selected) {
        selectedBySize[size] = this.formatResponse(selected);
      }
    });

    return selectedBySize;
  }

  async findOne(id: number): Promise<AdvertisementResponseDto> {
    const advertisement = await this.prisma.advertisement.findUnique({
      where: { id },
      include: {
        creator: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    if (!advertisement) {
      throw new NotFoundException('Anúncio não encontrado');
    }

    return this.formatResponse(advertisement);
  }

  async update(
    id: number,
    updateAdvertisementDto: UpdateAdvertisementDto,
    file?: Express.Multer.File,
    userId?: number
  ): Promise<AdvertisementResponseDto> {
    const existingAd = await this.prisma.advertisement.findUnique({
      where: { id },
    });

    if (!existingAd) {
      throw new NotFoundException('Anúncio não encontrado');
    }

    // Verificar se o usuário é o criador do anúncio (opcional, dependendo das regras de negócio)
    if (userId && existingAd.createdBy !== userId) {
      // Você pode implementar verificação de permissão aqui se necessário
      // throw new ForbiddenException('Você não tem permissão para editar este anúncio');
    }

    let imageUrl = existingAd.imageUrl;

    // Se nova imagem foi enviada, fazer upload e deletar a antiga
    if (file) {
      const newImageUrl = await this.advertisementImageService.uploadAdvertisementImage(file);

      // Deletar imagem antiga
      await this.advertisementImageService.deleteAdvertisementImage(existingAd.imageUrl);

      imageUrl = newImageUrl;
    }

    try {
      const updateData: Prisma.AdvertisementUpdateInput = {
        title: updateAdvertisementDto.title,
        description: updateAdvertisementDto.description,
        clickUrl: updateAdvertisementDto.clickUrl,
        position: updateAdvertisementDto.position,
        placement: updateAdvertisementDto.placement,
        size: updateAdvertisementDto.size,
        isActive: updateAdvertisementDto.isActive,
        priority: updateAdvertisementDto.priority,
        imageUrl,
      };

      // Converter datas se fornecidas
      if (updateAdvertisementDto.startDate) {
        updateData.startDate = new Date(updateAdvertisementDto.startDate);
      }
      if (updateAdvertisementDto.endDate) {
        updateData.endDate = new Date(updateAdvertisementDto.endDate);
      }

      const advertisement = await this.prisma.advertisement.update({
        where: { id },
        data: updateData,
        include: {
          creator: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      });

      return this.formatResponse(advertisement);
    } catch (error) {
      // Se deu erro e nova imagem foi enviada, deletar ela
      if (file && imageUrl !== existingAd.imageUrl) {
        await this.advertisementImageService.deleteAdvertisementImage(imageUrl);
      }
      throw new BadRequestException('Erro ao atualizar anúncio: ' + error.message);
    }
  }

  async remove(id: number, userId?: number): Promise<void> {
    const advertisement = await this.prisma.advertisement.findUnique({
      where: { id },
    });

    if (!advertisement) {
      throw new NotFoundException('Anúncio não encontrado');
    }

    // Verificar permissão se necessário
    if (userId && advertisement.createdBy !== userId) {
      // throw new ForbiddenException('Você não tem permissão para deletar este anúncio');
    }

    // Deletar a imagem
    await this.advertisementImageService.deleteAdvertisementImage(advertisement.imageUrl);

    // Deletar o registro do banco
    await this.prisma.advertisement.delete({
      where: { id },
    });
  }

  async toggleActive(id: number): Promise<AdvertisementResponseDto> {
    const advertisement = await this.prisma.advertisement.findUnique({
      where: { id },
    });

    if (!advertisement) {
      throw new NotFoundException('Anúncio não encontrado');
    }

    const updatedAd = await this.prisma.advertisement.update({
      where: { id },
      data: {
        isActive: !advertisement.isActive,
      },
      include: {
        creator: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    return this.formatResponse(updatedAd);
  }

  private formatResponse(advertisement: AdvertisementWithCreator): AdvertisementResponseDto {
    return {
      id: advertisement.id,
      title: advertisement.title,
      description: advertisement.description,
      imageUrl: advertisement.imageUrl,
      clickUrl: advertisement.clickUrl,
      position: advertisement.position,
      placement: advertisement.placement,
      size: advertisement.size,
      isActive: advertisement.isActive,
      priority: advertisement.priority,
      startDate: advertisement.startDate?.toISOString(),
      endDate: advertisement.endDate?.toISOString(),
      createdAt: advertisement.createdAt.toISOString(),
      updatedAt: advertisement.updatedAt.toISOString(),
      createdBy: advertisement.createdBy,
      creatorName: advertisement.creator?.name || 'Usuário não encontrado',
    };
  }

  private selectAdByPriority(ads: AdvertisementWithCreator[]): AdvertisementWithCreator | null {
    if (!ads || ads.length === 0) return null;
    if (ads.length === 1) return ads[0];

    const weights = ads.map((ad) => (ad.priority ?? 0) + 1);
    const totalWeight = weights.reduce((sum, weight) => sum + weight, 0);

    let random = Math.random() * totalWeight;

    return (
      ads.find((_, index) => {
        random -= weights[index];
        return random <= 0;
      }) ?? ads[ads.length - 1]
    );
  }
}
