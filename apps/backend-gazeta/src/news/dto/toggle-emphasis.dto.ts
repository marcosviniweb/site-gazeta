import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean } from 'class-validator';

export class ToggleEmphasisDto {
  @ApiProperty({
    description: 'Define se a notícia deve ser destaque ou não',
    example: true
  })
  @IsBoolean()
  isEmphasis: boolean;
}
