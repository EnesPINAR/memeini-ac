import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import helmet from 'helmet';
import * as express from 'express';
import * as path from 'path';

import { AppModule } from './app.module';

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  const app = await NestFactory.create(AppModule);

  const configService = app.get(ConfigService);
  const port = configService.get<number>('port', 3000);
  const uploadDir = configService.get<string>('storage.uploadDir', 'uploads');

  // Security Headers
  app.use(
    helmet({
      crossOriginResourcePolicy: { policy: 'cross-origin' }, // Allows mobile app to display images
    }),
  );

  // Enable CORS for mobile development & Web
  app.enableCors({
    origin: '*',
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    credentials: true,
  });

  // Serve static uploaded files locally
  const fullUploadPath = path.isAbsolute(uploadDir)
    ? uploadDir
    : path.join(process.cwd(), uploadDir);
  app.use('/uploads', express.static(fullUploadPath));

  // Global Validation Pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: false,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  // Swagger OpenAPI Documentation
  const config = new DocumentBuilder()
    .setTitle("Meme'ini Bul RESTful API")
    .setDescription(
      "Meme'ini Bul (Pinterest tarzı görsel keşif, meme arama, puanlama ve koleksiyon mobil uygulaması) için geliştirilmiş RESTful API dokümantasyonu.",
    )
    .setVersion('1.0')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'JWT',
        description: 'Bearer token giriniz',
        in: 'header',
      },
      'JWT-auth',
    )
    .addTag('Auth', 'Kimlik doğrulama, kayıt, giriş ve token yönetimi')
    .addTag('Memes', 'Keşfet akışı, meme yükleme, arama ve detaylar')
    .addTag('Search', 'Yapay zekamsı arama algoritması (bestMatch & alternatifler)')
    .addTag('Ratings', 'Yıldız puanlama ve atomik ortalama hesaplama')
    .addTag('Collections', 'Meme kaydetme ve favoriler')
    .addTag('Users', 'Kullanıcı profili ve koleksiyon sekmeleri (uploaded, starred, saved)')
    .addTag('Reports', 'Uygunsuz içerik şikayetleri')
    .addTag('Admin', 'Moderasyon ve iki aşamalı onay kuyrukları (Silme ve Etiket onayları)')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document, {
    customSiteTitle: "Meme'ini Bul API Docs",
    swaggerOptions: {
      persistAuthorization: true,
    },
  });

  await app.listen(port);
  logger.log(`🚀 Server running on http://localhost:${port}`);
  logger.log(`📚 Swagger documentation available at http://localhost:${port}/api/docs`);
}
bootstrap();
