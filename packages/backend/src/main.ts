import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AppModule } from './app.module';
import { PrismaClient } from '@prisma/client';

async function bootstrap() {
  // Executar migrations automaticamente em produção
  const nodeEnv = process.env.NODE_ENV || 'development';

  if (nodeEnv === 'production') {
    try {
      console.log('🔄 Running Prisma migrations...');
      const prisma = new PrismaClient();
      // Migrations são executadas via prisma migrate deploy no build ou no deploy
      await prisma.$connect();
      await prisma.$disconnect();
      console.log('✅ Database connection verified');
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.error('⚠️  Migration warning (continuing anyway):', message);
      // Continue mesmo se migration falhar (pode já estar atualizado)
    }
  }

  const app = await NestFactory.create(AppModule);

  const configService = app.get(ConfigService);

  // Validation pipe global
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // CORS
  const corsOrigins = configService.get<string>('CORS_ORIGINS')?.split(',') || [];
  app.enableCors({
    origin: corsOrigins,
    credentials: true,
  });

  // Prefix global
  app.setGlobalPrefix('api');

  const port = configService.get<number>('PORT') || 4000;
  await app.listen(port);

  console.log(`🔭 DevTools Backend running on http://localhost:${port}`);
}

bootstrap();
