# Admin Loans System - Backend

NestJS-based backend API for the Admin Loans System, providing comprehensive loan management, payment processing, and transaction tracking with robust security and audit capabilities.

## 🏗 Technology Stack

- **Framework:** NestJS 11.x
- **Language:** TypeScript 5.x
- **Database:** PostgreSQL 15.x
- **ORM:** Prisma 6.x
- **Authentication:** JWT with Passport
- **Security:** Helmet, Rate Limiting (@nestjs/throttler)
- **Logging:** Winston
- **Validation:** class-validator, class-transformer
- **Testing:** Jest

## 📋 Prerequisites

- **Node.js:** 16.x or higher (20.x recommended)
- **npm:** 8.x or higher
- **PostgreSQL:** 14.x or higher (15.x recommended)
- **Docker:** (Optional) 20.x or higher

## 🚀 Quick Start

### Installation

```bash
# Install dependencies
npm install

# Generate Prisma Client
npx prisma generate
```

### Environment Setup

Create a `.env` file in the backend root:

```env
# Database
DATABASE_URL="postgresql://admin:adminpassword@localhost:5432/loans_db?schema=public"

# JWT
JWT_SECRET="your-secure-secret-key-change-in-production"

# Server
PORT=3000
NODE_ENV=development
```

### Database Setup

```bash
# Run migrations
npx prisma migrate dev

# Seed database with initial data
npm run db:seed

# (Optional) Open Prisma Studio to view data
npx prisma studio
```

### Run the Application

```bash
# Development mode (with watch)
npm run start:dev

# Production mode
npm run build
npm run start:prod

# Debug mode
npm run start:debug
```

The API will be available at `http://localhost:3000`

## 🧪 Running Tests

```bash
# Run all unit tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage report
npm run test:cov

# Run specific test file
npm test -- loans.service.spec.ts

# Debug tests
npm run test:debug
```

### Test Coverage

Current test coverage includes:
- Loans Service & Controller
- Payments Service & Controller
- Disbursements Service & Controller
- Repayments Service & Controller
- Rollback Service & Controller
- Auth Service & Controller
- Accounts Service & Controller
- Transactions Service & Controller

## 📚 API Documentation

### Authentication

#### Login
```http
POST /auth/login
Content-Type: application/json

{
  "email": "admin@system.com",
  "password": "admin123"
}
```

**Response:**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "uuid",
    "email": "admin@system.com",
    "name": "System Administrator",
    "role": "ADMIN"
  }
}
```

#### Register
```http
POST /auth/register
Content-Type: application/json

{
  "email": "newuser@example.com",
  "password": "password123",
  "name": "New User"
}
```

### Loans

#### Create Loan
```http
POST /loans
Authorization: Bearer <token>
Content-Type: application/json

{
  "userId": "user-uuid",
  "amount": 10000,
  "interestRate": 12.5,
  "termMonths": 12
}
```

#### Get All Loans
```http
GET /loans
Authorization: Bearer <token>
```

#### Get Loan by ID
```http
GET /loans/:id
Authorization: Bearer <token>
```

### Disbursements

#### Disburse Loan (Admin Only)
```http
POST /disbursements
Authorization: Bearer <token>
Content-Type: application/json

{
  "loanId": "loan-uuid",
  "disbursementDate": "2024-01-15"
}
```

### Payments

#### Process Payment
```http
POST /payments
Authorization: Bearer <token>
Content-Type: application/json

{
  "loanId": "loan-uuid",
  "amount": 950.50,
  "paymentDate": "2024-02-15"
}
```

**Payment Allocation Priority (Waterfall):**
1. Interest
2. Late Fees
3. Principal

### Rollback

#### Rollback Payment (Admin Only)
```http
POST /rollback/payment/:paymentId
Authorization: Bearer <token>
```

#### Rollback Disbursement (Admin Only)
```http
POST /rollback/disbursement/:disbursementId
Authorization: Bearer <token>
```

### Audit Logs

#### Get Audit Logs (Admin Only)
```http
GET /audit
Authorization: Bearer <token>
```

### Swagger/OpenAPI

> **Note:** Swagger is not currently configured. To add Swagger documentation:
>
> ```bash
> npm install @nestjs/swagger
> ```
>
> Then configure in `main.ts`:
> ```typescript
> import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
> 
> const config = new DocumentBuilder()
>   .setTitle('Admin Loans System API')
>   .setDescription('Loan management system API')
>   .setVersion('1.0')
>   .addBearerAuth()
>   .build();
> const document = SwaggerModule.createDocument(app, config);
> SwaggerModule.setup('api', app, document);
> ```
>
> Access at: `http://localhost:3000/api`

## 🗄 Database Schema

### Key Models

- **User**: System users (Admin, User roles)
- **Account**: User and Platform accounts for tracking balances
- **Loan**: Loan records with terms and status
- **Disbursement**: Loan disbursement records
- **RepaymentSchedule**: Installment schedules
- **Payment**: Payment records with allocation breakdown
- **Transaction**: Audit trail of all financial transactions
- **AuditLog**: System-wide audit logging

### Database Commands

```bash
# Generate Prisma Client after schema changes
npx prisma generate

# Create a new migration
npx prisma migrate dev --name migration_name

# Reset database (WARNING: Deletes all data)
npx prisma migrate reset

# Apply migrations in production
npx prisma migrate deploy

# Open Prisma Studio (Database GUI)
npx prisma studio
```

## 🔐 Security Features

### Implemented Security Measures

1. **Authentication & Authorization**
   - JWT-based authentication
   - Role-based access control (RBAC)
   - Password hashing with bcrypt

2. **Rate Limiting**
   - Global rate limit: 100 requests per minute
   - Prevents DoS attacks and abuse

3. **Security Headers**
   - Helmet middleware for HTTP security headers
   - CORS configuration for trusted origins

4. **Input Validation**
   - Global validation pipes
   - DTO validation with class-validator
   - Whitelist mode to reject unknown properties

5. **Idempotency Protection**
   - Prevents duplicate disbursements via database constraints
   - Transaction-based operations for atomicity

6. **Audit Logging**
   - Complete audit trail of all operations
   - Sensitive data sanitization in logs

### Security Configuration

**CORS Settings** (`src/main.ts`):
```typescript
const CORS_OPTIONS = {
  origin: ['http://localhost:3002', 'http://localhost:3001'],
  credentials: true,
};
```

**Rate Limiting** (`src/app.module.ts`):
```typescript
ThrottlerModule.forRoot([{
  ttl: 60000, // 1 minute
  limit: 100, // 100 requests
}])
```

## 📁 Project Structure

```
backend/
├── prisma/
│   ├── schema.prisma          # Database schema
│   ├── migrations/            # Database migrations
│   └── seed.ts                # Seed script
├── src/
│   ├── accounts/              # Account management
│   ├── auth/                  # Authentication & JWT
│   │   ├── jwt/              # JWT strategy & guard
│   │   └── roles/            # RBAC decorators & guards
│   ├── audit/                 # Audit logging
│   ├── constants/             # Application constants
│   ├── disbursements/         # Loan disbursement logic
│   ├── loans/                 # Loan CRUD operations
│   ├── logger/                # Winston logger service
│   ├── payments/              # Payment processing
│   ├── prisma/                # Prisma service
│   ├── repayments/            # Repayment schedules
│   ├── rollback/              # Transaction rollback
│   ├── transactions/          # Transaction tracking
│   ├── app.module.ts          # Root module
│   └── main.ts                # Application entry point
├── test/                      # E2E tests (empty)
├── .env                       # Environment variables
├── package.json               # Dependencies & scripts
└── tsconfig.json              # TypeScript configuration
```

## 🛠 Available Scripts

| Script | Description |
|--------|-------------|
| `npm run start` | Start in production mode |
| `npm run start:dev` | Start in development mode with watch |
| `npm run start:debug` | Start in debug mode |
| `npm run start:prod` | Start compiled production build |
| `npm run build` | Build for production |
| `npm run format` | Format code with Prettier |
| `npm run lint` | Lint and fix code with ESLint |
| `npm test` | Run unit tests |
| `npm run test:watch` | Run tests in watch mode |
| `npm run test:cov` | Run tests with coverage |
| `npm run db:migrate` | Run database migrations |
| `npm run db:seed` | Seed database with initial data |

## 🌱 Seed Data

The seed script creates:

**Admin User:**
- Email: `admin@system.com`
- Password: `admin123`
- Role: ADMIN

**Platform Account:**
- Type: PLATFORM
- Initial Balance: $500,000

**Test Users:**
- John Doe (`john.doe@example.com` / `user123`)
- Jane Smith (`jane.smith@example.com` / `user123`)

Run seed: `npm run db:seed`

## ⚠️ Known Issues & Limitations

### Current Limitations

1. **No Swagger Documentation**
   - API documentation needs to be added
   - See setup instructions above

2. **Limited E2E Tests**
   - E2E test suite not fully implemented
   - Unit tests provide good coverage

3. **Single Currency**
   - System assumes single currency (USD)
   - No multi-currency support

4. **No Email Service**
   - Email notifications not implemented
   - Planned for future release

### Development Notes

- **Port 3000** must be available
- **PostgreSQL** must be running before starting the app
- Run `npx prisma generate` after any schema changes
- Use `npm run start:dev` for hot reload during development

## 🐛 Troubleshooting

### Database Connection Issues

```bash
# Check if PostgreSQL is running
docker ps  # If using Docker
# OR
pg_isready  # If using local PostgreSQL

# Verify DATABASE_URL in .env
# Ensure credentials match your PostgreSQL setup
```

### Prisma Client Issues

```bash
# Regenerate Prisma Client
npx prisma generate

# If migrations are out of sync
npx prisma migrate reset  # WARNING: Deletes data
npx prisma migrate dev
```

### Port Already in Use

```bash
# Find process using port 3000
lsof -i :3000
# OR (Linux)
netstat -tuln | grep 3000

# Kill process
kill -9 <PID>
```

## 📄 License

MIT License

---

For more information about the overall system, see the [main README](../README.md).
