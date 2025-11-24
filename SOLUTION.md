# Security Implementation

## Security Approach
Our security strategy focuses on "defense in depth," implementing controls at multiple layers: infrastructure, application logic, and data handling. We assume that any component could be compromised and thus require independent validation and protection.

## 1. Security Threats Identified
- **Brute Force / DoS**: Attackers flooding the API to exhaust resources.
- **Race Conditions**: Concurrent requests attempting to disburse the same loan twice.
- **Privilege Escalation**: Unauthorized users attempting to perform admin operations (disbursements).
- **Data Leakage**: Sensitive data (passwords, tokens) appearing in logs.
- **Injection/XSS**: Malicious payloads in input fields.
- **Missing Security Headers**: Vulnerability to clickjacking, sniffing, etc.

## 2. Implemented Measures

### Infrastructure & Middleware
- **Rate Limiting (`@nestjs/throttler`)**: Configured global rate limiting (100 req/min) to prevent abuse and DoS attacks.
- **Security Headers (`helmet`)**: Applied standard HTTP security headers (HSTS, X-Frame-Options, X-Content-Type-Options) to harden the browser interaction.
- **CORS Configuration**: Restricted Cross-Origin Resource Sharing to trusted frontend origins.

### Application Logic
- **Role-Based Access Control (RBAC)**: Implemented `RolesGuard` and `@Roles` decorator. Restricted sensitive operations (e.g., `disburseLoan`) to `ADMIN` users only.
- **Idempotency & Race Condition Protection**:
    - Leveraged database unique constraints (`P2002` error handling) to prevent double disbursements.
    - Wrapped disbursement logic in transactions to ensure atomicity.
- **Input Validation**: Enhanced DTOs with `class-validator` (e.g., `IsDateString`, `IsPositive`) to reject malformed data early.

### Data Protection
- **Log Sanitization**: Implemented a `sanitize` method in `LoggerService` to automatically redact sensitive keys (`password`, `token`, `secret`) from logs before they are written.

## 3. Trade-offs
- **Strictness vs. Usability**: Rate limiting is set to a conservative 100 req/min. This might affect power users but protects the system. It can be tuned per endpoint in the future.
- **Performance**: Log sanitization adds a small overhead to every log call, but this is acceptable for the safety of not leaking PII/secrets.

## 4. Future Improvements
- **Audit Logging**: While we have basic logging, a dedicated, immutable audit log table for all financial transactions would be robust.
- **2FA**: Implement Two-Factor Authentication for Admin actions.
- **API Keys**: For service-to-service communication if the system scales.
