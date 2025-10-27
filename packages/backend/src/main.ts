import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DataSource } from 'typeorm';
import { AppModule } from './app.module';
import { Event } from './modules/events/entities/event.entity';
import { User } from './modules/auth/entities/user.entity';
import { Project } from './modules/projects/entities/project.entity';
import { InitialSchema1698000000000 } from './migrations/1698000000000-InitialSchema';

async function bootstrap() {
  // Executar migrations automaticamente em produção
  const nodeEnv = process.env.NODE_ENV || 'development';

  if (nodeEnv === 'production') {
    try {
      console.log('🔄 Running database migrations...');
      const dataSource = new DataSource({
        type: 'postgres',
        url: process.env.DATABASE_URL,
        entities: [Event, User, Project],
        migrations: [InitialSchema1698000000000],
        synchronize: false,
        ssl: process.env.DATABASE_URL?.includes('supabase') ? { rejectUnauthorized: false } : false,
      });
      await dataSource.initialize();
      await dataSource.runMigrations();
      await dataSource.destroy();
      console.log('✅ Migrations completed successfully');
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
