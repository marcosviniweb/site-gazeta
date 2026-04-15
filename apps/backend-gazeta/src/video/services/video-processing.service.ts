import { Injectable, Logger } from '@nestjs/common';
import { writeFile, mkdir, unlink } from 'fs/promises';
import * as path from 'path';
import sharp from 'sharp';
import { sanitizeFileName } from '../../utils/file-name-sanitizer';

@Injectable()
export class VideoProcessingService {
  private readonly logger = new Logger(VideoProcessingService.name);
  private readonly baseUploadDir = 'uploads';

  async saveVideo(file: any, filename: string): Promise<string> {
    // Extrair timestamp do filename (formato: {timestamp}_{nome} ou {timestamp}_{randomId}_{nome})
    const timestampMatch = filename.match(/^(\d{13})/);
    const timestamp = timestampMatch
      ? timestampMatch[1]
      : Date.now().toString();

    // Remover timestamp e randomId do início do filename para obter o nome original
    const nameWithoutTimestamp = filename
      .replace(/^\d{13}_/, '')
      .replace(/^\d{13}_[a-z0-9]+_/, '');
    const sanitizedName = sanitizeFileName(nameWithoutTimestamp);

    // Criar diretório baseado no timestamp
    const timestampDir = path.join(this.baseUploadDir, timestamp);
    await this.ensureUploadDirectoryExists(timestampDir);

    const videoPath = path.join(timestampDir, sanitizedName);
    await writeFile(videoPath, file.buffer);

    return videoPath;
  }

  async saveThumbnail(file: any, videoFilename: string): Promise<string> {
    // Extrair timestamp do filename (formato: {timestamp}_{nome} ou {timestamp}_{randomId}_{nome})
    const timestampMatch = videoFilename.match(/^(\d{13})/);
    const timestamp = timestampMatch
      ? timestampMatch[1]
      : Date.now().toString();

    // Remover timestamp e randomId do início do filename para obter o nome base
    const nameWithoutTimestamp = videoFilename
      .replace(/^\d{13}_/, '')
      .replace(/^\d{13}_[a-z0-9]+_/, '');
    const sanitizedName = sanitizeFileName(nameWithoutTimestamp);
    const baseFilename = path.parse(sanitizedName).name;

    // Criar diretório baseado no timestamp
    const timestampDir = path.join(this.baseUploadDir, timestamp);
    await this.ensureUploadDirectoryExists(timestampDir);

    const thumbnailFilename = `${baseFilename}_thumb.webp`;
    const thumbnailPath = path.join(timestampDir, thumbnailFilename);

    // Se for uma imagem, processamos com Sharp (convertendo para WebP)
    if (file.mimetype.startsWith('image/')) {
      await sharp(file.buffer)
        .resize(640, 360, {
          fit: 'cover',
          position: 'center',
        })
        .webp({
          quality: 85,
          effort: 4,
        })
        .toFile(thumbnailPath);
    } else {
      // Se for outro tipo de arquivo, apenas salvamos
      await writeFile(thumbnailPath, file.buffer);
    }

    return thumbnailPath;
  }

  generatePublicUrl(filePath: string, baseUrl: string): string {
    let cleanBaseUrl = baseUrl.replace(/\\/g, '/');
    cleanBaseUrl = cleanBaseUrl.replace(/^https,?\s+/i, 'https://');
    cleanBaseUrl = cleanBaseUrl.replace(/^http,?\s+/i, 'http://');
    cleanBaseUrl = cleanBaseUrl.replace(/,+$/, '');
    const relativePath = filePath.replace(/\\/g, '/');
    return `${cleanBaseUrl}/${relativePath}`;
  }

  async deleteVideoFiles(
    videoPath?: string,
    thumbnailPath?: string,
  ): Promise<void> {
    if (videoPath) {
      try {
        await unlink(videoPath);
        this.logger.log(`Arquivo de vídeo deletado: ${videoPath}`);
      } catch (error) {
        this.logger.error(`Erro ao deletar arquivo de vídeo: ${error.message}`);
        throw error;
      }
    }

    if (thumbnailPath) {
      try {
        await unlink(thumbnailPath);
        this.logger.log(`Arquivo de thumbnail deletado: ${thumbnailPath}`);
      } catch (error) {
        this.logger.error(
          `Erro ao deletar arquivo de thumbnail: ${error.message}`,
        );
        throw error;
      }
    }
  }

  private async ensureUploadDirectoryExists(dir?: string): Promise<void> {
    const targetDir = dir || this.baseUploadDir;
    try {
      await mkdir(targetDir, { recursive: true });
    } catch (error) {
      this.logger.error(`Erro ao criar diretório de upload: ${error.message}`);
      throw error;
    }
  }
}
