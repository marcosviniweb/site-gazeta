import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { PrismaClient } from '../../generated/prisma';
import { existsSync, readdirSync } from 'fs';
import { join } from 'path';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PrismaService.name);

  private configurePrismaEngineLibraryPath() {
    if (process.env.PRISMA_QUERY_ENGINE_LIBRARY) {
      return;
    }

    const cwd = process.cwd();
    const candidateDirs = [
      // Caminhos mais comuns em produção (deploy por artefato dist).
      join(cwd, 'dist/apps/backend-gazeta/generated/prisma'),
      join(cwd, 'dist/apps/generated/prisma'),
      join(cwd, 'dist/apps/backend-gazeta'),
      join(cwd, 'dist/apps'),
      // Caminho de desenvolvimento/monorepo.
      join(cwd, 'apps/backend-gazeta/generated/prisma'),
    ];

    for (const dir of candidateDirs) {
      if (!existsSync(dir)) {
        continue;
      }

      const engineFile = readdirSync(dir).find(
        (file) =>
          file.startsWith('libquery_engine-') &&
          (file.endsWith('.so.node') || file.endsWith('.dylib.node') || file.endsWith('.dll.node')),
      );

      if (engineFile) {
        const fullPath = join(dir, engineFile);
        process.env.PRISMA_QUERY_ENGINE_LIBRARY = fullPath;
        this.logger.log(`📦 Query Engine Prisma localizado em: ${fullPath}`);
        return;
      }
    }

    this.logger.warn(
      '⚠️ Query Engine Prisma não encontrado automaticamente. O Prisma tentará os caminhos padrão.',
    );
  }

  async onModuleInit() {
    try {
      this.configurePrismaEngineLibraryPath();

      // Log da configuração do banco (mascarando senha)
      const dbUrl = process.env.DATABASE_URL || 'não configurada';
      const maskedUrl = dbUrl.replace(/:[^:@]+@/, ':****@');
      this.logger.log(`🔍 Tentando conectar ao banco: ${maskedUrl}`);
      this.logger.log(`📁 NODE_ENV: ${process.env.NODE_ENV || 'development'}`);
      this.logger.log(
        `📂 DATABASE_URL vem de process.env (ConfigModule + PM2/systemd). Em produção, use .env.production na raiz ou apps/backend-gazeta/.env.production, ou defina DATABASE_URL no processo.`,
      );
      
      await this.$connect();
      this.logger.log('Conexão com o banco de dados estabelecida com sucesso! 🚀');
      
      // Testa a conexão fazendo uma query simples
      await this.user.count();
      this.logger.log('Banco de dados está respondendo corretamente! ✅');
    } catch (error) {
      this.logger.error('Erro ao conectar com o banco de dados ❌');
      this.logger.error(error);
      throw error;
    }
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
} 