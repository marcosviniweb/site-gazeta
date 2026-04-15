import { Injectable } from '@nestjs/common';
import sharp from 'sharp';
import * as fs from 'fs';
import * as path from 'path';
import { promisify } from 'util';
import { sanitizeFileName } from '../../utils/file-name-sanitizer';

const mkdir = promisify(fs.mkdir);
const writeFile = promisify(fs.writeFile);

export interface ImageSizes {
  original: string;
  medium: string;
  small: string;
  superSmall: string;
}

@Injectable()
export class ImageProcessingService {
  private readonly baseUploadDir = 'uploads';
  private readonly imageSizes = {
    original: 'original',
    medium: '500x500',
    small: '300x300',
    superSmall: '150x150',
  };

  async processImage(file: any, filename: string): Promise<ImageSizes> {
    // Extrair timestamp do filename (formato: {timestamp}_{nome} ou {timestamp}_{randomId}_{nome})
    const timestampMatch = filename.match(/^(\d{13})/);
    const timestamp = timestampMatch
      ? timestampMatch[1]
      : Date.now().toString();

    // Remover timestamp e randomId do início do filename para obter o nome original
    // Formatos possíveis: {timestamp}_{nome} ou {timestamp}_{randomId}_{nome}
    let nameWithoutTimestamp = filename.replace(/^\d{13}_/, '');
    // Se ainda começa com algo que parece randomId (letras/números seguido de _), remover também
    nameWithoutTimestamp = nameWithoutTimestamp.replace(/^[a-z0-9]+_/, '');

    const sanitizedOriginalName = sanitizeFileName(nameWithoutTimestamp);
    const baseFilename = path.parse(sanitizedOriginalName).name;
    const extension = '.webp'; // Converter para WebP

    // Criar diretório baseado no timestamp
    const timestampDir = path.join(this.baseUploadDir, timestamp);
    await this.ensureUploadDirectoryExists(timestampDir);

    // Converter e salvar imagem original em WebP
    const originalFilename = `${baseFilename}${extension}`;
    const originalPath = path.join(timestampDir, originalFilename);
    await this.convertToWebP(file.buffer, originalPath);

    // Processar e gerar diferentes tamanhos
    const imagePaths: ImageSizes = {
      original: originalPath,
      medium: await this.resizeImage(
        file.buffer,
        timestampDir,
        baseFilename,
        'medium',
        500,
        500,
      ),
      small: await this.resizeImage(
        file.buffer,
        timestampDir,
        baseFilename,
        'small',
        300,
        300,
      ),
      superSmall: await this.resizeImage(
        file.buffer,
        timestampDir,
        baseFilename,
        'superSmall',
        150,
        150,
      ),
    };

    return imagePaths;
  }

  private async resizeImage(
    buffer: Buffer,
    timestampDir: string,
    baseFilename: string,
    sizeType: string,
    width: number,
    height: number,
  ): Promise<string> {
    const filename = `${baseFilename}_${sizeType}.webp`;
    const outputPath = path.join(timestampDir, filename);

    await sharp(buffer)
      .resize(width, height, {
        fit: 'cover',
        position: 'center',
      })
      .webp({
        quality: 85,
        effort: 4, // Balance entre qualidade e velocidade (0-6)
      })
      .toFile(outputPath);

    return outputPath;
  }

  /**
   * Converte imagem para WebP
   */
  private async convertToWebP(
    buffer: Buffer,
    outputPath: string,
  ): Promise<void> {
    await sharp(buffer)
      .webp({
        quality: 85,
        effort: 4,
      })
      .toFile(outputPath);
  }

  private async ensureUploadDirectoryExists(dir?: string): Promise<void> {
    const targetDir = dir || this.baseUploadDir;
    try {
      await mkdir(targetDir, { recursive: true });
    } catch (error: any) {
      if (error.code !== 'EEXIST') {
        throw error;
      }
    }
  }

  async deleteImageFiles(imageSizes: ImageSizes): Promise<void> {
    const paths = Object.values(imageSizes);

    for (const imagePath of paths) {
      try {
        // Verificar se o caminho existe
        if (fs.existsSync(imagePath)) {
          fs.unlinkSync(imagePath);
          console.log(`✅ Arquivo deletado: ${imagePath}`);
        } else {
          console.warn(`⚠️ Arquivo não encontrado: ${imagePath}`);
        }
      } catch (error) {
        console.error(`❌ Erro ao deletar arquivo ${imagePath}:`, error);
      }
    }
  }

  generatePublicUrls(imageSizes: ImageSizes, baseUrl: string): ImageSizes {
    let cleanBaseUrl = baseUrl.replace(/\\/g, '/');
    cleanBaseUrl = cleanBaseUrl.replace(/^https,?\s+/i, 'https://');
    cleanBaseUrl = cleanBaseUrl.replace(/^http,?\s+/i, 'http://');
    cleanBaseUrl = cleanBaseUrl.replace(/,+$/, '');

    const normalizePath = (path: string) => path.replace(/\\/g, '/');

    return {
      original: `${cleanBaseUrl}/${normalizePath(imageSizes.original)}`,
      medium: `${cleanBaseUrl}/${normalizePath(imageSizes.medium)}`,
      small: `${cleanBaseUrl}/${normalizePath(imageSizes.small)}`,
      superSmall: `${cleanBaseUrl}/${normalizePath(imageSizes.superSmall)}`,
    };
  }
}
