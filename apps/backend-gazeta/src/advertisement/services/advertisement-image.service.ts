import { Injectable, BadRequestException } from '@nestjs/common';
import { ImageProcessingService } from '../../media/services/image-processing.service';
import * as path from 'path';
import * as fs from 'fs/promises';
import { sanitizeFileName } from '../../utils/file-name-sanitizer';

@Injectable()
export class AdvertisementImageService {
  constructor(private imageProcessingService: ImageProcessingService) {}

  private cleanBaseUrl(baseUrl: string): string {
    let clean = baseUrl.replace(/\\/g, '/');
    clean = clean.replace(/^https,?\s+/i, 'https://');
    clean = clean.replace(/^http,?\s+/i, 'http://');
    clean = clean.replace(/,+$/, '');
    return clean;
  }

  async uploadAdvertisementImage(file: any): Promise<string> {
    if (!file) {
      throw new BadRequestException('Nenhuma imagem foi enviada');
    }

    // Validar tipo de arquivo
    const allowedMimes = [
      'image/jpeg',
      'image/jpg',
      'image/png',
      'image/gif',
      'image/webp',
    ];
    if (!allowedMimes.includes(file.mimetype)) {
      throw new BadRequestException(
        'Tipo de arquivo não permitido. Use: JPG, PNG, GIF ou WebP',
      );
    }

    // Validar tamanho (max 5MB)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      throw new BadRequestException(
        'Arquivo muito grande. Tamanho máximo: 5MB',
      );
    }

    try {
      // Gerar nome único para o arquivo (formato: {timestamp}_{nome_sanitizado})
      const timestamp = Date.now();
      const sanitizedFilename = sanitizeFileName(file.originalname);

      // Criar diretório baseado no timestamp
      const timestampDir = path.join(
        process.cwd(),
        'uploads',
        timestamp.toString(),
      );
      await fs.mkdir(timestampDir, { recursive: true });

      // Salvar arquivo
      const filePath = path.join(timestampDir, sanitizedFilename);
      await fs.writeFile(filePath, file.buffer);

      // Gerar URL pública
      const rawBaseUrl = process.env.BASE_URL || 'http://localhost:3002';
      const publicUrl = `${this.cleanBaseUrl(rawBaseUrl)}/uploads/${timestamp}/${sanitizedFilename}`;

      return publicUrl;
    } catch (error) {
      throw new BadRequestException(
        'Erro ao fazer upload da imagem: ' + error.message,
      );
    }
  }

  async deleteAdvertisementImage(imageUrl: string): Promise<void> {
    try {
      // Extrair timestamp e nome do arquivo da URL (formato: /uploads/{timestamp}/{filename})
      const urlMatch = imageUrl.match(/\/uploads\/(\d+)\/([^\/]+)$/);
      if (urlMatch) {
        const timestamp = urlMatch[1];
        const filename = urlMatch[2];
        const filePath = path.join(
          process.cwd(),
          'uploads',
          timestamp,
          filename,
        );

        // Verificar se arquivo existe e deletar
        try {
          await fs.access(filePath);
          await fs.unlink(filePath);
        } catch (error) {
          // Arquivo não existe, ignorar erro
        }
      }
    } catch (error) {
      // Log do erro mas não lançar exceção para não quebrar a exclusão do anúncio
      console.error('Erro ao deletar imagem do anúncio:', error);
    }
  }
}
