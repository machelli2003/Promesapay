# PromesaPay API Documentation

API base URL: `http://localhost:5000/api`

## Overview

PromesaPay API provides endpoints for:

- User authentication & account management
- Donations & coffee tips
- Payments processing (Paystack)
- Transactions & receipts
- Admin operations
- Security (2FA, email verification)

## Authentication

### Token-Based (JWT)

Most endpoints require a Bearer token in the `Authorization` header:

```
Authorization: Bearer <token>
```

**Token Scopes:**

- `full` - Normal API access (after login/2FA)
- `pre_auth` - 2FA verification only (5 min)
- `recovery` - Password reset only (15 min)

### CSRF Protection

All state-changing requests (POST, PUT, PATCH, DELETE) require CSRF token:

```
X-CSRF-Token: <token>
```

**Getting CSRF token:**

```
GET /api/auth/csrf-token
```

## Response Format

### Success Response

```json
{
  "success": true,
  "data": { ... },
  "message": "Optional success message"
}
```

### Error Response

```json
{
  "success": false,
  "error": "Error message",
  "error_code": "ERROR_CODE",
  "details": { ... }
}
```

### HTTP Status Codes

- `200` - Success
- `201` - Created
- `400` - Bad request (validation error)
- `401` - Unauthorized (invalid/missing token)
- `403` - Forbidden (permission denied / CSRF token invalid)
- `404` - Not found
- `429` - Rate limited
- `500` - Server error

---

## Endpoints

### Authentication

#### Register User

```
POST /api/auth/register

Body:
{
  "email": "user@example.com",
  "password": "SecurePass123!",
  "username": "username",
  "full_name": "User Name"
}

Response:
{
  "success": true,
  "data": {
    "user_id": "...",
    "email": "user@example.com",
    "username": "username"
  },
  "message": "Registration successful"
}

Status: 201
```

#### Login

```
POST /api/auth/login

Body:
{
  "email": "user@example.com",
  "password": "SecurePass123!"
}

Response (No 2FA):
{
  "success": true,
  "data": {
    "token": "eyJ...",
    "user": { ... }
  }
}

Response (2FA Required):
{
  "success": true,
  "data": {
    "requires_2fa": true,
    "pre_auth_token": "eyJ..."
  },
  "message": "Enter 2FA code"
}

Status: 200
```

#### Verify 2FA Code

```
POST /api/auth/2fa/verify-login

Headers:
Authorization: Bearer <pre_auth_token>

Body:
{
  "code": "123456"
}

Response:
{
  "success": true,
  "data": {
    "token": "eyJ...",
    "user": { ... }
  }
}

Status: 200
```

#### Get Current User

```
GET /api/auth/me

Headers:
Authorization: Bearer <token>

Response:
{
  "success": true,
  "data": {
    "user_id": "...",
    "email": "user@example.com",
    "username": "username",
    "full_name": "User Name",
    "avatar_url": "...",
    "email_verified": true,
    "two_factor_enabled": true
  }
}

Status: 200
```

#### Email Verification

```
POST /api/auth/send-verification-email

Headers:
Authorization: Bearer <token>

Response:
{
  "success": true,
  "message": "Verification email sent"
}

Status: 200

---

POST /api/auth/verify-email

Body:
{
  "token": "<email-verification-token>"
}

Response:
{
  "success": true,
  "message": "Email verified successfully"
}

Status: 200
```

#### Password Reset

**Request reset:**

```
POST /api/auth/forgot-password

Body:
{
  "email": "user@example.com"
}

Response:
{
  "success": true,
  "message": "Password reset link sent to email"
}

Status: 200
```

**Reset with token:**

```
POST /api/auth/reset-password

Body:
{
  "token": "<reset-token>",
  "new_password": "NewPass123!"
}

Response:
{
  "success": true,
  "message": "Password reset successfully"
}

Status: 200
```

---

### Two-Factor Authentication

#### Setup 2FA

```
POST /api/auth/2fa/setup

Headers:
Authorization: Bearer <token>

Response:
{
  "success": true,
  "data": {
    "secret": "ABCD1234...",
    "provisioning_uri": "otpauth://totp/...",
    "qr_code_url": "data:image/png;base64,..."
  },
  "message": "Scan QR code with authenticator app"
}

Status: 200
```

#### Enable 2FA

```
POST /api/auth/2fa/enable

Headers:
Authorization: Bearer <token>

Body:
{
  "code": "123456"
}

Response:
{
  "success": true,
  "data": {
    "backup_codes": [
      "XXXX-XXXX-XXXX",
      "YYYY-YYYY-YYYY",
      ...
    ]
  },
  "message": "2FA enabled. Save backup codes!"
}

Status: 200
```

#### Disable 2FA

```
POST /api/auth/2fa/disable

Headers:
Authorization: Bearer <token>

Body:
{
  "password": "YourPassword123!",
  "code": "123456"
}

Response:
{
  "success": true,
  "message": "2FA disabled"
}

Status: 200
```

---

### Profile

#### Get Public Profile

```
GET /api/profile/:username

Response:
{
  "success": true,
  "data": {
    "user_id": "...",
    "username": "username",
    "full_name": "User Name",
    "bio": "Bio here",
    "avatar_url": "...",
    "cover_url": "...",
    "follower_count": 100,
    "following_count": 50
  }
}

Status: 200
```

#### Update Profile

```
PUT /api/profile/update

Headers:
Authorization: Bearer <token>
X-CSRF-Token: <token>

Body:
{
  "full_name": "New Name",
  "bio": "New bio",
  "avatar": "<file>",  // multipart form-data
  "cover": "<file>"
}

Response:
{
  "success": true,
  "data": { ... updated profile ... }
}

Status: 200
```

#### Get Profile Stats

```
GET /api/profile/stats

Headers:
Authorization: Bearer <token>

Response:
{
  "success": true,
  "data": {
    "total_received": 5000.00,
    "total_donated": 1200.00,
    "followers": 100,
    "following": 50,
    "total_transactions": 42
  }
}

Status: 200
```

---

### Donations

#### Initiate Donation

```
POST /api/donations/initiate

Body:
{
  "recipient_id": "...",
  "amount": 1000.00,
  "currency": "USD",
  "message": "Great work!"
}

Response:
{
  "success": true,
  "data": {
    "donation_id": "...",
    "payment_reference": "...",
    "authorization_url": "https://checkout.paystack.com/..."
  }
}

Status: 201
```

#### Verify Donation

```
POST /api/donations/verify

Body:
{
  "reference": "payment_reference"
}

Response:
{
  "success": true,
  "data": {
    "donation_id": "...",
    "status": "completed",
    "amount": 1000.00,
    "receipt_url": "..."
  }
}

Status: 200
```

#### Get Donation History

```
GET /api/donations/?page=1&limit=10

Headers:
Authorization: Bearer <token>

Query Parameters:
- page: Page number (default: 1)
- limit: Items per page (default: 10)
- status: Filter by status (completed, pending, failed)

Response:
{
  "success": true,
  "data": {
    "donations": [ ... ],
    "total": 42,
    "page": 1,
    "limit": 10
  }
}

Status: 200
```

---

### Coffee (Tips)

Same endpoints as donations:

- `POST /api/coffee/initiate`
- `POST /api/coffee/verify`
- `GET /api/coffee/`

---

### Transactions

#### Get Transaction History

```
GET /api/transactions/?page=1&limit=20

Headers:
Authorization: Bearer <token>

Response:
{
  "success": true,
  "data": {
    "transactions": [
      {
        "transaction_id": "...",
        "type": "donation",  // "donation", "coffee", "payout"
        "amount": 1000.00,
        "currency": "USD",
        "status": "completed",  // "completed", "pending", "failed"
        "created_at": "2024-01-15T10:30:00Z",
        "counterparty": "username"
      }
    ],
    "total": 150,
    "page": 1,
    "limit": 20
  }
}

Status: 200
```

---

### Receipts

#### Download Receipt (PDF)

```
GET /api/receipts/:receipt_id/download

Headers:
Authorization: Bearer <token>

Response: PDF file

Status: 200
```

#### Get Receipt Details

```
GET /api/receipts/:receipt_id

Headers:
Authorization: Bearer <token>

Response:
{
  "success": true,
  "data": {
    "receipt_id": "...",
    "transaction_id": "...",
    "amount": 1000.00,
    "currency": "USD",
    "issued_at": "2024-01-15T10:30:00Z",
    "recipient": { ... },
    "donor": { ... },
    "message": "Thank you!"
  }
}

Status: 200
```

---

### Payouts

#### Request Payout

```
POST /api/payouts/request

Headers:
Authorization: Bearer <token>
X-CSRF-Token: <token>

Body:
{
  "amount": 5000.00,
  "bank_code": "033",
  "account_number": "1234567890"
}

Response:
{
  "success": true,
  "data": {
    "payout_id": "...",
    "status": "pending",
    "amount": 5000.00,
    "created_at": "2024-01-15T10:30:00Z"
  }
}

Status: 201
```

#### Get Payout History

```
GET /api/payouts/

Headers:
Authorization: Bearer <token>

Response:
{
  "success": true,
  "data": [
    {
      "payout_id": "...",
      "amount": 5000.00,
      "status": "completed",  // "pending", "processing", "completed", "failed"
      "created_at": "2024-01-15T10:30:00Z",
      "completed_at": "2024-01-16T14:20:00Z"
    }
  ]
}

Status: 200
```

---

### Admin Endpoints

#### Get All Users (Admin)

```
GET /api/admin/users?page=1&limit=20

Headers:
Authorization: Bearer <admin-token>

Response:
{
  "success": true,
  "data": {
    "users": [ ... ],
    "total": 1000,
    "page": 1
  }
}

Status: 200
```

#### Get User Details (Admin)

```
GET /api/admin/users/:user_id

Headers:
Authorization: Bearer <admin-token>

Response:
{
  "success": true,
  "data": {
    "user_id": "...",
    "email": "...",
    "created_at": "...",
    "last_login": "...",
    "total_received": 50000.00,
    "total_donated": 12000.00
  }
}

Status: 200
```

---

## Rate Limiting

All endpoints are rate limited:

- **Default:** 50 requests/hour per IP
- **Global:** 200 requests/day per IP
- **Auth endpoints:** 10 requests/minute

Response headers include:

```
X-RateLimit-Limit: 50
X-RateLimit-Remaining: 48
X-RateLimit-Reset: 1705316400
```

---

## Error Codes

| Code | Meaning | Status |
|------|---------|--------|
| `INVALID_CREDENTIALS` | Wrong email/password | 401 |
| `EMAIL_NOT_VERIFIED` | Email verification required | 403 |
| `2FA_REQUIRED` | 2FA code needed | 403 |
| `INVALID_2FA_CODE` | Wrong 2FA code | 401 |
| `CSRF_INVALID` | CSRF token missing/invalid | 403 |
| `ACCOUNT_LOCKED` | Too many failed attempts | 429 |
| `INSUFFICIENT_FUNDS` | Not enough balance for payout | 400 |
| `PAYMENT_FAILED` | Payment processing failed | 400 |
| `USER_NOT_FOUND` | User doesn't exist | 404 |
| `INTERNAL_ERROR` | Server error | 500 |

---

## Testing Endpoints

### Get CSRF Token

```bash
curl -X GET http://localhost:5000/api/auth/csrf-token
```

### Register

```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "TestPass123!",
    "username": "testuser",
    "full_name": "Test User"
  }'
```

### Login

```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "TestPass123!"
  }'
```

### Get Current User

```bash
curl -X GET http://localhost:5000/api/auth/me \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

## Webhooks

### Paystack Webhook

```
POST /api/webhook/paystack

Body: Paystack payload (see Paystack docs)

Handles:
- charge.success
- charge.failed
- transfer.success
- transfer.failed
```

---

## Changelog

### v1.0.0 (Current)

- Initial API release
- Authentication with 2FA
- Donations and coffee tips
- Payment processing
- Receipts generation
- Admin dashboard
