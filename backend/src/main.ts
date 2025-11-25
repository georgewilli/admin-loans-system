import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
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

  // Swagger/OpenAPI Documentation Setup
  const config = new DocumentBuilder()
    .setTitle('Loan Management System API')
    .setDescription(
      'RESTful API for managing loans, payments, disbursements, and accounts. ' +
      'Includes JWT authentication, role-based access control, audit logging, and automated payment processing.',
    )
    .setVersion('1.0')
    .addTag('Authentication', 'User authentication and registration')
    .addTag('Loans', 'Loan creation, approval, and management')
    .addTag('Payments', 'Payment processing and tracking')
    .addTag('Disbursements', 'Loan disbursement operations')
    .addTag('Accounts', 'User and platform account management')
    .addTag('Repayment Schedules', 'Repayment schedule tracking')
    .addTag('Audit Logs', 'System audit trail (Admin only)')
    .addTag('Rollbacks', 'Payment rollback operations (Admin only)')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'JWT',
        description: 'Enter JWT token',
        in: 'header',
      },
      'JWT-auth',
    )
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document, {
    customSiteTitle: 'Loan System API Docs',
    customCss: '.swagger-ui .topbar { display: none }',
  });

  await app.listen(process.env.PORT ?? 3000);
  console.log(`Application is running on: http://localhost:${process.env.PORT ?? 3000}`);
  console.log(`Swagger documentation available at: http://localhost:${process.env.PORT ?? 3000}/api/docs`);
}

bootstrap();
