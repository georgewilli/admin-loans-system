import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import helmet from 'helmet';

/**
 * CORS Configuration
 * Allow requests from frontend development servers
 */
const CORS_OPTIONS = {
  origin: ['http://localhost:3002', 'http://localhost:3001'],
  credentials: true,
};

/**
 * Global Validation Pipe Configuration
 * Ensures incoming requests are validated against DTOs
 */
const VALIDATION_PIPE_OPTIONS = {
  whitelist: true,
  forbidNonWhitelisted: true, // Throw error if unknown field exists
  transform: true, // Transform types (string->number)
  transformOptions: { enableImplicitConversion: true },
};

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Apply security headers
  app.use(helmet());

  // Enable CORS for frontend
  app.enableCors(CORS_OPTIONS);

  // Enable global validation
  app.useGlobalPipes(new ValidationPipe(VALIDATION_PIPE_OPTIONS));

  await app.listen(process.env.PORT ?? 3000);
}

bootstrap();
