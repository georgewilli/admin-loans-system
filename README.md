# Admin Loans System

A comprehensive loan management system built with NestJS (backend) and React Admin (frontend), featuring loan disbursement, payment processing, repayment schedules, and complete audit logging.

## 📋 Table of Contents

- [Features](#features)
- [Prerequisites](#prerequisites)
- [Quick Start with Docker](#quick-start-with-docker)
- [Manual Setup](#manual-setup)
- [Running Tests](#running-tests)
- [API Documentation](#api-documentation)
- [Project Structure](#project-structure)
- [Known Issues & Limitations](#known-issues--limitations)
- [License](#license)

## ✨ Features

- **Loan Management**: Create, approve, and track loans with customizable terms
- **Disbursement System**: Secure fund disbursement with idempotency protection
- **Payment Processing**: Waterfall allocation (Interest → Late Fees → Principal)
- **Repayment Schedules**: Automated schedule generation and tracking
- **Transaction Rollback**: Ability to rollback payments and disbursements
- **Audit Logging**: Complete audit trail of all system operations
- **Role-Based Access Control**: Admin and User roles with permission management
- **Security**: Rate limiting, helmet security headers, JWT authentication

## 🔧 Prerequisites

### Required Software

| Software | Minimum Version | Recommended |
|----------|----------------|-------------|
| **Node.js** | 16.x | 20.x LTS |
| **npm** | 8.x | 10.x |
| **Docker** | 20.x | 24.x |
| **Docker Compose** | 2.x | 2.20+ |
| **PostgreSQL** | 14.x | 15.x |

### Verify Installations

```bash
# Check Node.js version
node --version

# Check npm version
npm --version

# Check Docker version
docker --version

# Check Docker Compose version
docker-compose --version
```

## 🚀 Quick Start with Docker

**The easiest way to run the entire system:**

```bash
# Clone the repository
git clone <repository-url>
cd admin-loans-system

# Start all services (PostgreSQL, Backend, Frontend)
docker-compose up

# Or run in detached mode
docker-compose up -d
```

**Access the application:**
- Frontend: http://localhost:80
- Backend API: http://localhost:3000
- Database: localhost:5432

**Default credentials:**
- Email: `admin@system.com`
- Password: `admin123`

**Stop services:**
```bash
docker-compose down

# Stop and remove volumes (delete database data)
docker-compose down -v
```

## 🛠 Manual Setup

### 1. Clone and Install Dependencies

```bash
# Clone repository
git clone <repository-url>
cd admin-loans-system

# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend
npm install
```

### 2. Set Up Environment Variables

**Backend (.env):**
```bash
cd backend
cp .env.example .env
```

Edit `backend/.env`:
```env
DATABASE_URL="postgresql://admin:adminpassword@localhost:5432/loans_db?schema=public"
JWT_SECRET="your-secure-secret-key-change-in-production"
PORT=3000
```

**Frontend (.env):**
```bash
cd frontend
cp .env.example .env
```

Edit `frontend/.env`:
```env
REACT_APP_API_URL=http://localhost:3000
```

### 3. Set Up PostgreSQL Database

**Option A: Use Docker for PostgreSQL only**
```bash
docker run --name loans_postgres \
  -e POSTGRES_USER=admin \
  -e POSTGRES_PASSWORD=adminpassword \
  -e POSTGRES_DB=loans_db \
  -p 5432:5432 \
  -d postgres:15-alpine
```

**Option B: Use local PostgreSQL**
```bash
# Create database
createdb loans_db

# Update DATABASE_URL in backend/.env to use your local credentials
```

### 4. Run Database Migrations and Seed

```bash
cd backend

# Generate Prisma Client
npx prisma generate

# Run migrations
npx prisma migrate dev

# Seed initial data (admin user, platform account, test users)
npm run db:seed
```

### 5. Start the Applications

**Start Backend (Terminal 1):**
```bash
cd backend
npm run start:dev
```
Backend will be available at http://localhost:3000

**Start Frontend (Terminal 2):**
```bash
cd frontend
npm start
```
Frontend will be available at http://localhost:3002

### 6. Login to the System

Navigate to http://localhost:3002 and login with:
- Email: `admin@system.com`
- Password: `admin123`

## 🧪 Running Tests

### Backend Tests

```bash
cd backend

# Run all unit tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:cov

# Run specific test file
npm test -- loans.service.spec.ts
```

### Frontend Tests

```bash
cd frontend

# Run tests
npm test

# Run tests with coverage
npm test -- --coverage
```

### Database Testing

```bash
cd backend

# Reset database and apply migrations
npx prisma migrate reset

# View database in Prisma Studio
npx prisma studio
```

## 📚 API Documentation

### API Base URL
- Development: `http://localhost:3000`
- Production: Configure based on deployment

### Authentication

All API endpoints (except `/auth/login` and `/auth/register`) require JWT authentication.

**Login:**
```bash
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
    "role": "ADMIN"
  }
}
```

### Main Endpoints

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/auth/login` | User login | ❌ |
| POST | `/auth/register` | User registration | ❌ |
| GET | `/loans` | List all loans | ✅ |
| POST | `/loans` | Create new loan | ✅ |
| POST | `/disbursements` | Disburse loan | ✅ Admin |
| POST | `/payments` | Process payment | ✅ |
| POST | `/rollback/payment/:id` | Rollback payment | ✅ Admin |
| POST | `/rollback/disbursement/:id` | Rollback disbursement | ✅ Admin |
| GET | `/audit` | View audit logs | ✅ Admin |

### Example: Create Loan

```bash
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

### Swagger/OpenAPI

> ⚠️ **Note:** Swagger documentation is not currently configured. To add it:
> 1. Install: `npm install @nestjs/swagger`
> 2. Configure in `main.ts`
> 3. Access at: `http://localhost:3000/api`

## 📁 Project Structure

```
admin-loans-system/
├── backend/                # NestJS backend application
│   ├── prisma/            # Database schema and migrations
│   │   ├── schema.prisma  # Prisma schema
│   │   ├── migrations/    # Migration files
│   │   └── seed.ts        # Database seeding script
│   ├── src/
│   │   ├── accounts/      # Account management
│   │   ├── auth/          # Authentication & authorization
│   │   ├── audit/         # Audit logging
│   │   ├── disbursements/ # Loan disbursement
│   │   ├── loans/         # Loan management
│   │   ├── payments/      # Payment processing
│   │   ├── repayments/    # Repayment schedules
│   │   ├── rollback/      # Transaction rollback
│   │   ├── transactions/  # Transaction tracking
│   │   └── main.ts        # Application entry point
│   └── package.json
├── frontend/              # React Admin frontend
│   ├── src/
│   │   ├── resources/     # Resource components (Loans, Payments, etc.)
│   │   ├── authProvider.ts
│   │   ├── dataProvider.ts
│   │   └── App.tsx
│   └── package.json
├── docker-compose.yml     # Docker orchestration
└── README.md             # This file
```

## ⚠️ Known Issues & Limitations

### Current Limitations

1. **No Swagger Documentation**
   - API documentation not yet configured
   - Manual endpoint reference required
   - **Workaround:** Refer to controller files or this README

2. **Limited E2E Tests**
   - Most tests are unit tests
   - E2E test suite not fully implemented
   - **Recommendation:** Manual testing for critical flows

3. **No Email Notifications**
   - System doesn't send email notifications for loan events
   - **Planned:** Email service integration

4. **Single Currency Support**
   - Only supports USD (or single default currency)
   - **Planned:** Multi-currency support

5. **No Document Upload**
   - Cannot attach documents to loans
   - **Planned:** File upload feature for loan documentation

### Security Considerations

- **Change default credentials** in production
- **Set strong JWT_SECRET** in production environment
- **Use HTTPS** in production
- **Configure rate limiting** based on your needs (currently 100 req/min)
- **Review CORS settings** in `main.ts` for production deployment

### Development Quirks

1. **Hot Reload:** Both frontend and backend support hot reload in development
2. **Port Conflicts:** Ensure ports 3000, 3002, and 5432 are available
3. **Migration Conflicts:** If migration issues occur, use `npx prisma migrate reset`

## 🔐 Default Seed Data

After running `npm run db:seed`, the following accounts are created:

**Admin Account:**
- Email: `admin@system.com`
- Password: `admin123`
- Role: ADMIN

**Test Users:**
- John Doe: `john.doe@example.com` / `user123`
- Jane Smith: `jane.smith@example.com` / `user123`

**Platform Account:**
- Initial balance: $500,000

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License.

---

**Need Help?** Check the backend and frontend README files for more detailed information about each component.
