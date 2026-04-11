import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsEnum, IsBoolean, IsString, IsNumber, Matches } from 'class-validator';
import { Transform } from 'class-transformer';
import { NewsStatus } from './news-status.enum';

export class NewsQueryDto {
  @ApiProperty({
    description: 'Filtrar por status da notícia (ACTIVE, INACTIVE ou TRASH). Se não fornecido, retorna apenas ACTIVE por padrão.',
    enum: NewsStatus,
    required: false,
    example: NewsStatus.ACTIVE
  })
  @IsOptional()
  @IsEnum(NewsStatus, { message: 'Status deve ser ACTIVE, INACTIVE ou TRASH' })
  status?: NewsStatus;

  @ApiProperty({
    description: 'Incluir itens do lixo na consulta. Se true, retorna todas as notícias independente do status. Ignorado se status for fornecido.',
    example: false,
    required: false,
    default: false,
    type: Boolean
  })
  @IsOptional()
  @IsBoolean({ message: 'includeTrash deve ser true ou false' })
  @Transform(({ value }) => {
    if (value === 'true' || value === true) return true;
    if (value === 'false' || value === false) return false;
    return undefined;
  })
  includeTrash?: boolean;

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
    description: 'Filtrar apenas notícias com ou sem destaque.',
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
  isEmphasis?: boolean;

  @ApiProperty({
    description: 'IDs de notícias a serem excluídas do resultado (separados por vírgula). Útil para evitar duplicatas na mesma página.',
    example: '1,2,3',
    required: false,
    type: String
  })
  @IsOptional()
  @IsString()
  exclude?: string;

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
}