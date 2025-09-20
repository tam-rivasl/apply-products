import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { GlobalExceptionFilter } from './common/filters/global-exception.filter';
import { TransformInterceptor } from './common/interceptors/transform.interceptor';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { RequestLoggingInterceptor } from './common/interceptors/request-logging.interceptor';
import { ErrorLoggingInterceptor } from './common/interceptors/error-logging.interceptor';
import { LoggerService } from './common/services/logger.service';
import helmet from 'helmet';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );
  app.use(helmet());
  
  // Get logger service instance
  const loggerService = app.get(LoggerService);
  
  app.useGlobalFilters(new GlobalExceptionFilter(loggerService));
  
  app.useGlobalInterceptors(
    new TransformInterceptor(),
    new RequestLoggingInterceptor(loggerService),
    new ErrorLoggingInterceptor(loggerService),
  );
  const cfg = new DocumentBuilder()
    .setTitle('Apply Products API')
    .setDescription('A robust NestJS-based REST API for managing product data with automatic synchronization from Contentful CMS. Features include secure authentication, comprehensive product management, automated data synchronization, and professional logging.')
    .setVersion('1.0.0')
    .addBearerAuth()
    .addTag('Products', 'Product management operations')
    .addTag('Auth', 'Authentication operations')
    .addTag('Reports', 'Reporting and analytics')
    .addTag('Sync', 'Contentful synchronization')
    .build();

  const doc = SwaggerModule.createDocument(app, cfg);
  SwaggerModule.setup('/api/docs', app, doc);
  await app.listen(process.env.PORT || 3000);
}
bootstrap();
