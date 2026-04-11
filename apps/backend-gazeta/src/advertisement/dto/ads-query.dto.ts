import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsEnum, IsBoolean, IsString } from 'class-validator';
import { Transform } from 'class-transformer';

export class AdsQueryDto {
  @ApiProperty({ description: 'Página atual para paginação.', example: 1, required: false, default: 1, type: Number })
  @IsOptional()
  @Transform(({ value }) => parseInt(value, 10))
  page?: number = 1;

  @ApiProperty({ description: 'Quantidade de itens por página.', example: 25, required: false, default: 25, type: Number })
  @IsOptional()
  @Transform(({ value }) => parseInt(value, 10))
  limit?: number = 25;

  @ApiProperty({ description: 'Termo de busca.', required: false, type: String })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiProperty({ description: 'Data específica no formato YYYY-MM-DD.', example: '2023-12-01', required: false, type: String })
  @IsOptional()
  @IsString()
  date?: string;

  @ApiProperty({ description: 'Ordenação pela data. Use "asc" ou "desc".', enum: ['asc', 'desc'], required: false })
  @IsOptional()
  @IsEnum(['asc', 'desc'])
  order?: 'asc' | 'desc';

  @ApiProperty({ description: 'Status de ativo / inativo.', required: false, type: Boolean })
  @IsOptional()
  @Transform(({ value }) => {
    if (value === 'true' || value === true) return true;
    if (value === 'false' || value === false) return false;
    return undefined;
  })
  @IsBoolean()
  active?: boolean;
}
