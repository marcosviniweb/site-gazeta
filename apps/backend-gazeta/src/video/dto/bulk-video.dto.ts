import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsBoolean, IsNumber } from 'class-validator';

export class BulkToggleFeaturedDto {
  @ApiProperty({
    description: 'Array de IDs dos vídeos para alterar o destaque',
    example: [1, 2, 3],
    type: [Number]
  })
  @IsArray()
  @IsNumber({}, { each: true })
  ids: number[];

  @ApiProperty({
    description: 'Define se os vídeos devem ser destaque ou não',
    example: true
  })
  @IsBoolean()
  featured: boolean;
}

export class BulkDeleteVideoDto {
  @ApiProperty({
    description: 'Array de IDs dos vídeos para exclusão permanente',
    example: [1, 2, 3],
    type: [Number]
  })
  @IsArray()
  @IsNumber({}, { each: true })
  ids: number[];
}
