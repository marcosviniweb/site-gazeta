/**
 * This is not a production server yet!
 * This is only a minimal backend to get started.
 */

import { Logger, ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app/app.module';
import { errorMessage } from './auth/constants/error-messages';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';
import { devCorsConfig } from './config/cors.config';
import compression from 'compression';
import helmet from 'helmet';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  
  // Segurança com Helmet
  app.use(helmet({
    crossOriginResourcePolicy: false, // Necessário para exibir imagens/vídeos locais em domínios diferentes
    contentSecurityPolicy: false,     // Desativado para facilitar compatibilidade com Swagger e editor
  }));

  // Compressão Gzip para reduzir tamanho dos chunks
  app.use(compression());
  const globalPrefix = 'api';
  app.setGlobalPrefix(globalPrefix);

  // Configuração de CORS para desenvolvimento
  app.enableCors(devCorsConfig);

  // Servir arquivos estáticos com suporte a Range Requests para streaming progressivo
  const uploadsPath = join(process.cwd(), 'uploads');
  Logger.log(`📁 Serving static files from: ${uploadsPath}`);
  app.useStaticAssets(uploadsPath, {
    prefix: '/uploads/',
    // Headers para streaming progressivo de vídeo
    setHeaders: (res, path) => {
      // Se for um arquivo de vídeo, adicionar headers apropriados
      if (path.match(/\.(mp4|webm|ogg|mov|m4v)$/i)) {
        res.setHeader('Accept-Ranges', 'bytes');
        const isMov = path.match(/\.mov$/i);
        res.setHeader('Content-Type', isMov ? 'video/quicktime' : 'video/mp4');
        // Cache por 1 dia para vídeos
        res.setHeader('Cache-Control', 'public, max-age=86400');
      }
    },
  });

  // Configuração da validação global
  app.useGlobalPipes(new ValidationPipe({
    transform: true,
    exceptionFactory: (errors) => {
      const result = errors.map((error) => ({
        property: error.property,
        message: error.constraints[Object.keys(error.constraints)[0]] || errorMessage.required,
      }));
      return {
        statusCode: 400,
        message: result[0].message,
        error: 'Bad Request'
      };
    },
  }));

  // Configuração do Swagger
  const config = new DocumentBuilder()
    .setTitle('API Gazeta')
    .setDescription('Documentação da API do sistema Gazeta')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);

  const port = process.env.PORT || 3002;
  const baseUrl = process.env.BASE_URL || `http://localhost:${port}`;
  await app.listen(port);
  Logger.log(
    `🚀 Application is running on: ${baseUrl}/${globalPrefix}`
  );
  Logger.log(
    `📚 Swagger documentation available at: ${baseUrl}/api`
  );
  Logger.log(
    `🔒 CORS enabled for localhost development`
  );
  Logger.log(
    `🌐 BASE_URL: ${baseUrl}`
  );
  Logger.log(
    `📂 Working directory: ${process.cwd()}`
  );
}

bootstrap();
