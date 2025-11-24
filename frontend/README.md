# Admin Loans System - Frontend

React Admin-based frontend application for the Admin Loans System, providing an intuitive interface for managing loans, payments, disbursements, and viewing audit logs.

## 🏗 Technology Stack

- **Framework:** React 19.x
- **Admin Framework:** React Admin 5.x
- **Language:** TypeScript 4.9.x
- **Build Tool:** React Scripts 5.x (Create React App)
- **Data Provider:** ra-data-simple-rest
- **Testing:** Jest, React Testing Library

## 📋 Prerequisites

- **Node.js:** 16.x or higher (20.x recommended)
- **npm:** 8.x or higher
- **Backend API:** Running on port 3000

## 🚀 Quick Start

### Installation

```bash
# Install dependencies
npm install
```

### Environment Setup

Create a `.env` file in the frontend root:

```env
# Backend API URL
REACT_APP_API_URL=http://localhost:3000

# Optional: Custom port (default is 3000, but backend uses 3000)
PORT=3002
```

### Run the Application

```bash
# Development mode
npm start

# Production build
npm run build

# Run tests
npm test
```

The application will be available at `http://localhost:3002`

## 🔐 Login Credentials

### Default Admin Account
- **Email:** `admin@system.com`
- **Password:** `admin123`

### Test User Accounts
- **Email:** `john.doe@example.com` | **Password:** `user123`
- **Email:** `jane.smith@example.com` | **Password:** `user123`

> ⚠️ **Important:** Change default credentials in production!

## 🧪 Running Tests

```bash
# Run tests in watch mode
npm test

# Run tests with coverage
npm test -- --coverage

# Run tests once (CI mode)
CI=true npm test
```

## 📚 Application Features

### Available Resources

1. **Users** (`/users`)
   - View all users
   - Create new users
   - Edit user details
   - Manage roles (Admin/User)

2. **Accounts** (`/accounts`)
   - View user and platform accounts
   - Track balances
   - View account type

3. **Loans** (`/loans`)
   - Create new loan applications
   - View loan details
   - Track loan status (PENDING, ACTIVE, CLOSED)
   - View repayment schedules

4. **Disbursements** (`/disbursements`)
   - **Admin Only:** Disburse approved loans
   - View disbursement history
   - Rollback disbursements

5. **Payments** (`/payments`)
   - Process loan payments
   - View payment history
   - See allocation breakdown (Principal/Interest/Late Fees)
   - Rollback payments (Admin only)

6. **Repayment Schedules** (`/repayment-schedules`)
   - View installment schedules
   - Track payment status (PENDING, PARTIALLY_PAID, PAID, OVERDUE)
   - View due dates and amounts

7. **Transactions** (`/transactions`)
   - Complete transaction audit trail
   - View transaction types (DISBURSEMENT, REPAYMENT, etc.)
   - Track all financial movements

8. **Audit Logs** (`/audit`)
   - **Admin Only:** View system audit logs
   - Track user actions
   - Monitor system changes

### User Roles & Permissions

#### Admin Role
- Full access to all resources
- Can disburse loans
- Can rollback transactions
- Can view audit logs
- User management access

#### User Role
- View own loans and payments
- Make payments on own loans
- Limited to personal data
- Cannot disburse or rollback

## 📁 Project Structure

```
frontend/
├── public/
│   ├── index.html             # HTML template
│   └── favicon.ico            # App icon
├── src/
│   ├── resources/             # Resource components
│   │   ├── Users.tsx          # User management
│   │   ├── Accounts.tsx       # Account views
│   │   ├── Loans.tsx          # Loan management
│   │   ├── Payments.tsx       # Payment processing
│   │   ├── Disbursements.tsx  # Disbursement UI
│   │   ├── RepaymentSchedules.tsx
│   │   ├── Transactions.tsx   # Transaction history
│   │   └── AuditLogs.tsx      # Audit log viewer (Admin)
│   ├── authProvider.ts        # Authentication logic
│   ├── dataProvider.ts        # Data fetching logic
│   ├── App.tsx                # Main application component
│   └── index.tsx              # Application entry point
├── .env                       # Environment variables
├── package.json               # Dependencies & scripts
└── tsconfig.json              # TypeScript configuration
```

## 🎨 Key Features

### Payment Processing
The payment form includes:
- Loan selection dropdown
- Amount input (supports partial payments)
- Payment date picker
- Automatic allocation calculation (Interest → Fees → Principal)

### Disbursement Dialog
Admin-only feature:
- Select pending loans
- Set disbursement date
- Automatic platform account validation
- Idempotency protection

### Rollback Functionality
Admin-only capability to reverse transactions:
- Rollback payments
- Rollback disbursements
- Automatic account reconciliation
- Audit trail preserved

### Audit Trail
Complete visibility into system operations:
- User actions
- Entity changes
- Old vs. new values
- Timestamps and user identification

## 🛠 Available Scripts

| Script | Description |
|--------|-------------|
| `npm start` | Start development server |
| `npm run build` | Build for production |
| `npm test` | Run tests in watch mode |
| `npm run eject` | Eject from Create React App (one-way) |

## 🔧 Configuration

### Data Provider Configuration

The application uses `ra-data-simple-rest` for API communication:

```typescript
// src/dataProvider.ts
import simpleRestProvider from 'ra-data-simple-rest';

const dataProvider = simpleRestProvider(
  process.env.REACT_APP_API_URL || 'http://localhost:3000'
);
```

### Auth Provider Configuration

JWT-based authentication:

```typescript
// src/authProvider.ts
const authProvider = {
  login: async ({ username, password }) => {
    const response = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      body: JSON.stringify({ email: username, password }),
      headers: { 'Content-Type': 'application/json' },
    });
    // Store token in localStorage
  },
  logout: async () => {
    localStorage.removeItem('token');
  },
  checkAuth: async () => {
    return localStorage.getItem('token') ? Promise.resolve() : Promise.reject();
  },
  // ...
};
```

## 🎯 Common Tasks

### Adding a New Resource

1. Create a new component in `src/resources/`:
```tsx
// src/resources/MyNewResource.tsx
import { List, Datagrid, TextField } from 'react-admin';

export const MyResourceList = () => (
  <List>
    <Datagrid>
      <TextField source="id" />
      <TextField source="name" />
    </Datagrid>
  </List>
);
```

2. Register in `App.tsx`:
```tsx
import { MyResourceList } from './resources/MyNewResource';

<Resource name="my-resource" list={MyResourceList} />
```

### Custom Actions

Add custom buttons or actions:
```tsx
import { Button } from 'react-admin';

const MyCustomButton = () => (
  <Button
    label="Custom Action"
    onClick={() => {
      // Custom logic
    }}
  />
);
```

## 🌐 API Integration

The frontend expects these endpoints from the backend:

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/auth/login` | POST | User authentication |
| `/users` | GET, POST, PUT | User management |
| `/loans` | GET, POST, PUT | Loan operations |
| `/disbursements` | GET, POST | Disbursement operations |
| `/payments` | GET, POST | Payment processing |
| `/rollback/payment/:id` | POST | Payment rollback |
| `/rollback/disbursement/:id` | POST | Disbursement rollback |
| `/audit` | GET | Audit log retrieval |
| `/repayment-schedules` | GET | Schedule viewing |
| `/transactions` | GET | Transaction history |

## ⚠️ Known Issues & Limitations

### Current Limitations

1. **No Real-time Updates**
   - List views don't auto-refresh
   - **Workaround:** Manually refresh the page

2. **Limited Validation Messages**
   - Some error messages are generic
   - **Improvement:** Enhanced error handling planned

3. **No File Uploads**
   - Cannot attach documents to loans
   - **Planned:** Document upload feature

4. **No Bulk Operations**
   - Cannot process multiple payments at once
   - **Planned:** Bulk action support

5. **No Export Functionality**
   - Cannot export data to CSV/Excel
   - **Planned:** Export feature

### Browser Compatibility

- **Chrome:** ✅ Fully supported (Recommended)
- **Firefox:** ✅ Fully supported
- **Safari:** ✅ Fully supported
- **Edge:** ✅ Fully supported
- **IE11:** ❌ Not supported

## 🐛 Troubleshooting

### Cannot Connect to Backend

**Error:** Network error or CORS issues

**Solutions:**
```bash
# 1. Verify backend is running
curl http://localhost:3000

# 2. Check REACT_APP_API_URL in .env
cat .env

# 3. Ensure CORS is configured in backend main.ts
# Backend should allow origin: http://localhost:3002
```

### Login Fails

**Error:** Invalid credentials or 401 Unauthorized

**Solutions:**
1. Verify backend is running
2. Check default credentials: `admin@system.com` / `admin123`
3. Ensure database is seeded: `npm run db:seed` in backend
4. Check browser console for errors

### Build Errors

**Error:** TypeScript compilation errors

**Solutions:**
```bash
# Clear cache and reinstall
rm -rf node_modules package-lock.json
npm install

# Clear React Scripts cache
rm -rf node_modules/.cache
```

### Port Already in Use

**Error:** Port 3002 is already in use

**Solutions:**
```bash
# Change port in .env
PORT=3003

# Or kill existing process
lsof -i :3002
kill -9 <PID>
```

## 📱 Production Build

### Building for Production

```bash
# Create optimized production build
npm run build

# Build output will be in the 'build/' directory
```

### Serving Production Build

```bash
# Install serve (if not already installed)
npm install -g serve

# Serve the build
serve -s build -l 3002
```

### Environment Variables for Production

Create `.env.production`:
```env
REACT_APP_API_URL=https://api.yourproductiondomain.com
```

### Docker Deployment

The frontend includes a Dockerfile for containerized deployment. See the root [docker-compose.yml](../docker-compose.yml) for full stack deployment.

## 📄 License

MIT License

---

For more information about the overall system, see the [main README](../README.md).
