# PromesaPay Security Layer

Production-oriented security integrated with JWT (`flask-jwt-extended`).

## Features

| Feature | Description |
|---------|-------------|
| **Rate limiting** | Flask-Limiter on auth, recovery, and 2FA endpoints; global defaults `50/hour`, `200/day` |
| **2FA (TOTP)** | Google Authenticator–compatible; backup codes; pre-auth JWT step on login |
| **Fraud detection** | Failed-login tracking, IP velocity, account lockout, security audit log |
| **Account recovery** | Email recovery codes + recovery JWT; unlock locked accounts |

## JWT scopes

| Scope | Use |
|-------|-----|
| `full` | Normal API access (default after login or 2FA) |
| `pre_auth` | 5 min — only `/api/auth/2fa/verify-login` |
| `recovery` | 15 min — only `/api/auth/recovery/reset-password` |

`require_auth` and `require_full_token` reject non-`full` tokens.

## API endpoints

### Login with 2FA

1. `POST /api/auth/login` → `{ requires_2fa: true, pre_auth_token }` or `{ token, user }`
2. `POST /api/auth/2fa/verify-login`  
   Header: `Authorization: Bearer <pre_auth_token>`  
   Body: `{ "code": "123456" }`  
   → `{ token, user }`

### 2FA management (full JWT)

| Method | Path | Body |
|--------|------|------|
| POST | `/api/auth/2fa/setup` | — |
| POST | `/api/auth/2fa/enable` | `{ "code" }` → returns `backup_codes` |
| POST | `/api/auth/2fa/disable` | `{ "password", "code" }` |
| POST | `/api/auth/2fa/backup-codes` | `{ "password", "code" }` |

### Account recovery

| Method | Path | Body |
|--------|------|------|
| POST | `/api/auth/recovery/request` | `{ "email", "purpose": "password_reset" \| "unlock_account" }` |
| POST | `/api/auth/recovery/verify` | `{ "email", "code", "purpose" }` → `recovery_token` |
| POST | `/api/auth/recovery/reset-password` | Bearer `recovery_token`, `{ "new_password" }` |

Legacy link reset: `POST /api/auth/forgot-password`, `POST /api/auth/reset-password`

### Security visibility

| Method | Path |
|--------|------|
| GET | `/api/auth/security/status` |
| GET | `/api/auth/security/events` |

## Configuration (`.env`)

```env
SECURITY_MAX_LOGIN_ATTEMPTS=5
SECURITY_MAX_IP_LOGIN_ATTEMPTS=20
SECURITY_LOGIN_WINDOW_MINUTES=15
SECURITY_LOCKOUT_MINUTES=30
RATELIMIT_STORAGE_URL=redis://localhost:6379/1
```

Use **Redis** for rate limits in production (`RATELIMIT_STORAGE_URL`).

## Paystack split payments (future)

Config stored in `platform_settings` (`paystack_splits`).  
`GET/PUT /api/admin/finance/paystack-splits` (admin).  
When `enabled` and `mode=paystack_split`, use `build_paystack_split_payload()` in `app/services/paystack_splits.py` from `initialize_payment()`.

## Dependencies

```bash
pip install pyotp cryptography fpdf2
```

## Collections

- `security_events` — audit log
- `login_attempts` — fraud / lockout (TTL 7 days)
- `recovery_requests` — email codes
