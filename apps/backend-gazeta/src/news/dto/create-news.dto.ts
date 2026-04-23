import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsArray, IsBoolean, IsOptional, IsObject, MinLength, MaxLength, ValidateNested, IsNumber, IsEnum } from 'class-validator';
import { Type } from 'class-transformer';
import { NewsStatus } from './news-status.enum';

export class CreateNewsMediaDto {
  @ApiProperty({ description: 'ID da mídia (opcional)', example: 1, required: false })
  @IsOptional()
  @IsNumber({}, { message: 'ID deve ser um número' })
  id?: number;

  @ApiProperty({ description: 'ID da notícia (opcional)', example: 1, required: false })
  @IsOptional()
  @IsNumber({}, { message: 'ID da notícia deve ser um número' })
  idNews?: number;

  @ApiProperty({ description: 'Se a mídia é destaque', example: false, default: false })
  @IsOptional()
  @IsBoolean({ message: 'Emphasis deve ser um boolean' })
  emphasis?: boolean;

  @ApiProperty({ description: 'Tamanhos da imagem', required: false })
  @IsOptional()
  imgSize?: Array<{
    original: string;
    small: string;
    medium: string;
    superSmall: string;
  }> | {
    original: string;
    small: string;
    medium: string;
    superSmall: string;
  };

  @ApiProperty({ description: 'Autor da mídia (opcional)', example: 'João Fotógrafo', required: false })
  @IsOptional()
  @IsString({ message: 'Autor da mídia deve ser uma string' })
  author?: string;

  @ApiProperty({ description: 'Data da mídia (opcional)', example: '2025-01-20', required: false })
  @IsOptional()
  @IsString({ message: 'Data da mídia deve ser uma string' })
  date?: string;
}

export class CreateNewsVideoDto {
  @ApiProperty({ description: 'ID do vídeo (opcional)', example: 1, required: false })
  @IsOptional()
  @IsNumber({}, { message: 'ID deve ser um número' })
  id?: number;

  @ApiProperty({ description: 'URL do vídeo', example: 'https://youtube.com/watch?v=123' })
  @IsNotEmpty({ message: 'URL do vídeo é obrigatória' })
  @IsString({ message: 'URL do vídeo deve ser uma string' })
  url: string;

  @ApiProperty({ description: 'Thumbnail do vídeo', example: 'https://exemplo.com/thumbnail.jpg' })
  @IsNotEmpty({ message: 'Thumbnail do vídeo é obrigatório' })
  @IsString({ message: 'Thumbnail do vídeo deve ser uma string' })
  thumbnail: string;
}

export class CreateNewsDto {
  @ApiProperty({
    description: 'Título da notícia',
    example: 'Nova tecnologia revoluciona o mercado',
    minLength: 5,
    maxLength: 255
  })
  @IsNotEmpty({ message: 'Título é obrigatório' })
  @IsString({ message: 'Título deve ser uma string' })
  @MinLength(5, { message: 'Título deve ter no mínimo 5 caracteres' })
  @MaxLength(255, { message: 'Título deve ter no máximo 255 caracteres' })
  title: string;

  @ApiProperty({
    description: 'Subtítulo/resumo da notícia',
    example: 'Inovação promete transformar a forma como trabalhamos'
  })
  @IsNotEmpty({ message: 'Subtítulo é obrigatório' })
  @IsString({ message: 'Subtítulo deve ser uma string' })
  subtitle: string;

  @ApiProperty({
    description: 'Conteúdo completo da notícia',
    example: 'O conteúdo completo da notícia com todos os detalhes...'
  })
  @IsNotEmpty({ message: 'Conteúdo é obrigatório' })
  @IsString({ message: 'Conteúdo deve ser uma string' })
  content: string;

  @ApiProperty({
    description: 'IDs das categorias',
    example: [1, 2, 3],
    type: [Number]
  })
  @IsArray({ message: 'categoryId deve ser um array' })
  @IsNotEmpty({ message: 'Pelo menos uma categoria é obrigatória' })
  categoryId: number[];

  @ApiProperty({
    description: 'Nome do autor da notícia',
    example: 'Maria Silva'
  })
  @IsNotEmpty({ message: 'Autor é obrigatório' })
  @IsString({ message: 'Autor deve ser uma string' })
  author: string;

  @ApiProperty({
    description: 'Mídias da notícia',
    type: [CreateNewsMediaDto],
    isArray: true
  })
  @IsArray({ message: 'mediaNews deve ser um array' })
  @ValidateNested({ each: true })
  @Type(() => CreateNewsMediaDto)
  @IsOptional()
  mediaNews?: CreateNewsMediaDto[];

  @ApiProperty({
    description: 'Vídeos da notícia',
    type: [CreateNewsVideoDto],
    isArray: true
  })
  @IsArray({ message: 'videoNews deve ser um array' })
  @ValidateNested({ each: true })
  @Type(() => CreateNewsVideoDto)
  @IsOptional()
  videoNews?: CreateNewsVideoDto[];

  @ApiProperty({
    description: 'Se a notícia está publicada',
    example: 'true',
    default: 'false'
  })
  @IsOptional()
  @IsString({ message: 'Published deve ser uma string' })
  published?: string;

  @ApiProperty({
    description: 'Status da notícia',
    enum: NewsStatus,
    example: NewsStatus.ACTIVE,
    default: NewsStatus.ACTIVE
  })
  @IsOptional()
  @IsEnum(NewsStatus, { message: 'Status deve ser ACTIVE, INACTIVE ou TRASH' })
  status?: NewsStatus;

  @ApiProperty({
    description: 'Validade da notícia (opcional)',
    example: '2025-12-31',
    required: false
  })
  @IsOptional()
  @IsString({ message: 'Validade deve ser uma string' })
  validity?: string;

  @ApiProperty({
    description: 'Slug da notícia',
    example: 'nova-tecnologia-revoluciona-mercado'
  })
  @IsNotEmpty({ message: 'Slug é obrigatório' })
  @IsString({ message: 'Slug deve ser uma string' })
  slug: string;

  @ApiProperty({
    description: 'Se a notícia é destaque',
    example: false,
    default: false
  })
  @IsOptional()
  @IsBoolean({ message: 'isEmphasis deve ser um boolean' })
  isEmphasis?: boolean;
} 