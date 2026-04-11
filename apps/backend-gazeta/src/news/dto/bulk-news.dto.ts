import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsEnum, IsBoolean, IsNumber } from 'class-validator';
import { NewsStatus } from './news-status.enum';

export class BulkUpdateStatusDto {
  @ApiProperty({
    description: 'Array de IDs das notícias para atualizar o status',
    example: [1, 2, 3],
    type: [Number]
  })
  @IsArray()
  @IsNumber({}, { each: true })
  ids: number[];

  @ApiProperty({
    description: 'Novo status para as notícias selecionadas',
    enum: NewsStatus,
    example: NewsStatus.ACTIVE
  })
  @IsEnum(NewsStatus)
  status: NewsStatus;
}

export class BulkToggleEmphasisDto {
  @ApiProperty({
    description: 'Array de IDs das notícias para alterar o destaque',
    example: [1, 2, 3],
    type: [Number]
  })
  @IsArray()
  @IsNumber({}, { each: true })
  ids: number[];

  @ApiProperty({
    description: 'Define se as notícias devem ser destaque ou não',
    example: true
  })
  @IsBoolean()
  isEmphasis: boolean;
}

export class BulkDeleteDto {
  @ApiProperty({
    description: 'Array de IDs das notícias para exclusão permanente',
    example: [1, 2, 3],
    type: [Number]
  })
  @IsArray()
  @IsNumber({}, { each: true })
  ids: number[];
}
