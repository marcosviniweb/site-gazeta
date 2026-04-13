import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

/** Arquivos .env em ordem: os últimos da lista sobrescrevem os anteriores (Nest/dotenv). */
function configEnvFilePaths(): string[] {
  const isProd = process.env.NODE_ENV === 'production';
  if (isProd) {
    return [
      'apps/backend-gazeta/.env',
      'apps/backend-gazeta/.env.production',
      '.env.production',
    ];
  }
  return [
    'apps/backend-gazeta/.env.local',
    'apps/backend-gazeta/.env',
    '.env.local',
    '.env',
  ];
}
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from '../auth/auth.module';
import { PrismaModule } from '../prisma/prisma.module';
import { CategoriesModule } from '../categories/categories.module';
import { NewsModule } from '../news/news.module';
import { MediaModule } from '../media/media.module';
import { NewsVideoModule } from '../news-video/news-video.module';
import { AdvertisementModule } from '../advertisement/advertisement.module';
import { ConfigSystemModule } from '../config-system/config-system.module';
import { MenuModule } from '../menu/menu.module';
import { VideoModule } from '../video/video.module';
import { AnalyticsModule } from '../analytics/analytics.module';
import { ContentMediaModule } from '../content-media/content-media.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true, // Torna o ConfigModule disponível globalmente
      envFilePath: configEnvFilePaths(),
    }),
    PrismaModule,
    AuthModule,
    CategoriesModule,
    NewsModule,
    MediaModule,
    NewsVideoModule,
    AdvertisementModule,
    ConfigSystemModule,
    MenuModule,
    VideoModule,
    AnalyticsModule,
    ContentMediaModule
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
