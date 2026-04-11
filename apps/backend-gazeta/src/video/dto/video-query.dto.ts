import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsEnum, IsBoolean, IsString, IsNumber } from 'class-validator';
import { Transform } from 'class-transformer';

export class VideoQueryDto {
  @ApiProperty({
    description: 'Página atual para paginação.',
    example: 1,
    required: false,
    default: 1,
    type: Number
  })
  @IsOptional()
  @Transform(({ value }) => parseInt(value, 10))
  page?: number = 1;

  @ApiProperty({
    description: 'Quantidade de itens por página.',
    example: 25,
    required: false,
    default: 25,
    type: Number
  })
  @IsOptional()
  @Transform(({ value }) => parseInt(value, 10))
  limit?: number = 25;

  @ApiProperty({
    description: 'Termo de busca.',
    required: false,
    type: String
  })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiProperty({
    description: 'Filtrar por ID de categoria.',
    example: 1,
    required: false,
    type: Number
  })
  @IsOptional()
  @Transform(({ value }) => parseInt(value, 10))
  @IsNumber()
  categoryId?: number;

  @ApiProperty({
    description: 'Data de criação específica no formato YYYY-MM-DD.',
    example: '2023-12-01',
    required: false,
    type: String
  })
  @IsOptional()
  @IsString()
  date?: string;

  @ApiProperty({
    description: 'Ordenação pela data de criação. Use "asc" ou "desc".',
    enum: ['asc', 'desc'],
    required: false
  })
  @IsOptional()
  @IsEnum(['asc', 'desc'])
  order?: 'asc' | 'desc';

  @ApiProperty({
    description: 'Ordenação pelas visualizações. Use "asc" ou "desc".',
    enum: ['asc', 'desc'],
    required: false
  })
  @IsOptional()
  @IsEnum(['asc', 'desc'])
  views?: 'asc' | 'desc';

  @ApiProperty({
    description: 'Filtrar apenas por status de destaque.',
    required: false,
    type: Boolean
  })
  @IsOptional()
  @Transform(({ value }) => {
    if (value === 'true' || value === true) return true;
    if (value === 'false' || value === false) return false;
    return undefined;
  })
  @IsBoolean()
  featured?: boolean;
}
