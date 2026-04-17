# Auth Service

Complete authentication service for TechLearn LMS with email/password, OAuth, MFA, and session management.

## Features

### ✅ Implemented

- **Registration & Login**
  - Email/password authentication
  - Strong password validation (12+ chars, upper, lower, number, special)
  - Account locking after 5 failed attempts (30min lockout)
  - Single active session enforcement

- **Token Management**
  - JWT access tokens (8h default)
  - Refresh tokens (30d default)
  - Automatic token rotation
  - Token revocation on logout/password change

- **Multi-Factor Authentication (MFA)**
  - TOTP-based 2FA (Google Authenticator, Authy, etc.)
  - QR code generation
  - MFA setup, confirm, and disable

- **OAuth Providers**
  - Google OAuth 2.0
  - GitHub OAuth
  - Microsoft OAuth
  - Automatic account linking

- **Email Verification**
  - Send verification email
  - Verify email with token
  - Resend verification

- **Password Reset**
  - Request password reset
  - Reset password with token
  - Revokes all sessions on reset

- **User Profile**
  - Get current user
  - Update profile (name, avatar)
  - Change password

- **Admin Management**
  - Create admin users
  - List all users (with filters)
  - Toggle user active status

## API Endpoints

### Public Endpoints

```http
POST   /api/auth/register              # Register new user
POST   /api/auth/login                 # Login with email/password
POST   /api/auth/refresh               # Refresh access token
POST   /api/auth/logout                # Logout (revoke refresh token)
POST   /api/auth/verify-email          # Verify email with token
POST   /api/auth/forgot-password       # Request password reset
POST   /api/auth/reset-password        # Reset password with token
```

### OAuth Endpoints

```http
GET    /api/auth/oauth/google          # Initiate Google OAuth
GET    /api/auth/oauth/google/callback # Google OAuth callback
GET    /api/auth/oauth/github          # Initiate GitHub OAuth
GET    /api/auth/oauth/github/callback # GitHub OAuth callback
GET    /api/auth/oauth/microsoft       # Initiate Microsoft OAuth
GET    /api/auth/oauth/microsoft/callback # Microsoft OAuth callback
```

### Authenticated Endpoints

```http
GET    /api/auth/me                    # Get current user
PATCH  /api/auth/me                    # Update profile
POST   /api/auth/change-password       # Change password
POST   /api/auth/resend-verification   # Resend verification email
POST   /api/auth/mfa/setup             # Setup MFA (get QR code)
POST   /api/auth/mfa/confirm           # Confirm MFA with code
POST   /api/auth/mfa/disable           # Disable MFA
```

### Admin Endpoints

```http
POST   /api/auth/admin/users           # Create admin user
GET    /api/auth/admin/users           # List all users
PATCH  /api/auth/admin/users/:id/toggle # Toggle user active status
```

## Request/Response Examples

### Register

```bash
POST /api/auth/register
Content-Type: application/json

{
  "email": "student@example.com",
  "password": "SecurePass123!@#",
  "firstName": "John",
  "lastName": "Doe",
  "role": "student"
}

# Response
{
  "success": true,
  "message": "Registration successful. Please verify your email.",
  "data": {
    "id": "uuid",
    "email": "student@example.com",
    "role": "student"
  }
}
```

### Login

```bash
POST /api/auth/login
Content-Type: application/json

{
  "email": "student@example.com",
  "password": "SecurePass123!@#"
}

# Response (without MFA)
{
  "success": true,
  "data": {
    "accessToken": "eyJhbGc...",
    "refreshToken": "eyJhbGc...",
    "user": {
      "id": "uuid",
      "email": "student@example.com",
      "firstName": "John",
      "lastName": "Doe",
      "role": "student",
      "mfaEnabled": false
    }
  }
}

# Response (MFA required)
{
  "success": true,
  "mfaRequired": true
}

# Then send MFA code:
POST /api/auth/login
{
  "email": "student@example.com",
  "password": "SecurePass123!@#",
  "mfaCode": "123456"
}
```

### Setup MFA

```bash
POST /api/auth/mfa/setup
Authorization: Bearer {accessToken}

# Response
{
  "success": true,
  "data": {
    "otpauthUrl": "otpauth://totp/TechLearn...",
    "secret": "JBSWY3DPEHPK3PXP"
  }
}

# User scans QR code, then confirms:
POST /api/auth/mfa/confirm
Authorization: Bearer {accessToken}
{
  "code": "123456"
}
```

### Update Profile

```bash
PATCH /api/auth/me
Authorization: Bearer {accessToken}

{
  "firstName": "Jane",
  "avatarUrl": "https://example.com/avatar.jpg"
}
```

### Change Password

```bash
POST /api/auth/change-password
Authorization: Bearer {accessToken}

{
  "currentPassword": "OldPass123!@#",
  "newPassword": "NewSecurePass456!@#"
}
```

### Password Reset Flow

```bash
# 1. Request reset
POST /api/auth/forgot-password
{
  "email": "student@example.com"
}

# 2. User receives email with token, then:
POST /api/auth/reset-password
{
  "token": "abc123...",
  "password": "NewSecurePass456!@#"
}
```

## Environment Variables

Required variables in `.env`:

```bash
# Database
DATABASE_URL=postgresql://user:password@localhost:5432/techlearn

# Redis
REDIS_URL=redis://localhost:6379

# JWT
JWT_SECRET=your_jwt_secret_here
JWT_REFRESH_SECRET=your_refresh_secret_here
JWT_EXPIRES_IN=8h
REFRESH_TOKEN_EXPIRES_IN=30d

# URLs
FRONTEND_URL=http://localhost:5173
API_BASE_URL=http://localhost:4001

# OAuth (optional)
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GITHUB_CLIENT_ID=
GITHUB_CLIENT_SECRET=
MICROSOFT_CLIENT_ID=
MICROSOFT_CLIENT_SECRET=

# Security
BCRYPT_ROUNDS=12
```

## Database Setup

Run the schema:

```bash
psql $DATABASE_URL < src/db/schema.sql
```

Or use any PostgreSQL client to execute `src/db/schema.sql`.

## Development

```bash
# Install dependencies (from Backend root)
npm install

# Run in development mode
npm run dev --workspace=@techlearn/auth-service

# Build
npm run build --workspace=@techlearn/auth-service

# Run production
npm start --workspace=@techlearn/auth-service
```

## Security Features

- **Password Requirements**: 12+ characters, uppercase, lowercase, number, special character
- **Account Locking**: 5 failed attempts = 30 minute lockout
- **Token Rotation**: Refresh tokens are single-use
- **Single Session**: Only one active session per user
- **Rate Limiting**: 20 requests per 15 minutes
- **MFA Support**: TOTP-based two-factor authentication
- **OAuth Security**: State parameter validation, PKCE support
- **Password Hashing**: bcrypt with 12 rounds
- **Token Storage**: Refresh tokens hashed with SHA-256

## Role-Based Access Control (RBAC)

Roles:
- `student` - Default role for new users
- `instructor` - Can create and manage courses
- `admin` - Full system access
- `hr_manager` - Enterprise HR management (future)

Middleware:
```typescript
import { authenticate, authorize } from './middleware/authenticate';

// Require authentication
router.get('/protected', authenticate, handler);

// Require specific role
router.get('/admin-only', authenticate, authorize('admin'), handler);

// Allow multiple roles
router.get('/teaching', authenticate, authorize('instructor', 'admin'), handler);
```

## Testing

### Test User Creation

```bash
# Create test student
curl -X POST http://localhost:4001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "student@test.com",
    "password": "TestPass123!@#",
    "firstName": "Test",
    "lastName": "Student",
    "role": "student"
  }'

# Create test instructor
curl -X POST http://localhost:4001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "instructor@test.com",
    "password": "TestPass123!@#",
    "firstName": "Test",
    "lastName": "Instructor",
    "role": "instructor"
  }'

# Create admin (requires existing admin token)
curl -X POST http://localhost:4001/api/auth/admin/users \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -d '{
    "email": "admin@test.com",
    "password": "TestPass123!@#",
    "firstName": "Test",
    "lastName": "Admin"
  }'
```

## Error Codes

| Status | Code | Description |
|--------|------|-------------|
| 400 | VALIDATION_ERROR | Invalid request data |
| 401 | UNAUTHORIZED | Invalid credentials or token |
| 403 | FORBIDDEN | Insufficient permissions |
| 409 | CONFLICT | Email already registered |
| 423 | LOCKED | Account temporarily locked |
| 429 | RATE_LIMIT | Too many requests |
| 500 | INTERNAL_ERROR | Server error |

## Production Checklist

- [ ] Set strong JWT secrets
- [ ] Configure OAuth providers
- [ ] Set up email service (SendGrid/SES)
- [ ] Enable HTTPS
- [ ] Configure CORS properly
- [ ] Set up monitoring/logging
- [ ] Configure backup strategy for database
- [ ] Test account recovery flow
- [ ] Set up Redis cluster for HA
- [ ] Configure rate limiting per environment
- [ ] Remove debug tokens from responses (verify-email, reset-password)
- [ ] Set up email templates
- [ ] Configure session timeout policies
- [ ] Test MFA flow end-to-end
