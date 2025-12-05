import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import helmet from 'helmet';
import { AppModule } from './app.module';
import { AppDataSource } from './database/data-source';
import { seed } from './database/seeds/seed';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Security headers (X-Frame-Options, X-Content-Type-Options, etc.)
  app.use(helmet());

  // Enable CORS
  app.enableCors({
    origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
    credentials: true,
  });

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // Global request logging (logs method, URL, response time)
  app.useGlobalInterceptors(new LoggingInterceptor());

  // Swagger documentation
  const config = new DocumentBuilder()
    .setTitle('TixPeer API')
    .setDescription('API documentation for TixPeer - A peer-to-peer ticket exchange marketplace')
    .setVersion('1.0')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  const port = process.env.BACKEND_PORT || 3001;
  await app.listen(port);

  console.log(`Application is running on: http://localhost:${port}`);
  console.log(`Swagger documentation: http://localhost:${port}/api/docs`);

  // Conditional database seeding
  if (process.env.NODE_ENV !== 'production' && process.env.RUN_SEED === 'true') {
    try {
      console.log('\n🌱 Starting database seed...');
      const dataSource = await AppDataSource.initialize();
      await seed(dataSource);
      await dataSource.destroy();
    } catch (error) {
      console.error('❌ Seeding failed:', error);
    }
  }
}

bootstrap();
