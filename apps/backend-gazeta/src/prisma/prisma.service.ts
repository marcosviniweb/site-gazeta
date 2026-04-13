import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { PrismaClient } from '../../generated/prisma';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PrismaService.name);
 

  async onModuleInit() {
    try {
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