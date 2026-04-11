import { ApiProperty } from '@nestjs/swagger';
import { NewsResponseDto } from './news-response.dto';

export class NewsPaginatedMeta {
  @ApiProperty({ description: 'Total de itens encontrados' })
  total: number;

  @ApiProperty({ description: 'Página atual' })
  page: number;

  @ApiProperty({ description: 'Limite de itens por página' })
  limit: number;

  @ApiProperty({ description: 'Última página disponível' })
  lastPage: number;
}

export class NewsPaginatedResponseDto {
  @ApiProperty({ type: [NewsResponseDto], description: 'Lista de notícias da página atual' })
  data: NewsResponseDto[];

  @ApiProperty({ type: NewsPaginatedMeta, description: 'Metadados da paginação' })
  meta: NewsPaginatedMeta;
}
