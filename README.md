# Promesapay — Creator Support Platform

A full-stack web app combining GoFundMe-style donations and Buy Me a Coffee-style tips with advanced security features.

## 🚀 Current Status

✅ **Phase 1** - Complete

- Email system & password reset
- PDF receipt generation
- Admin dashboard basics

✅ **Phase 2** - Complete

- Email verification system
- Two-factor authentication (2FA)
- Comprehensive test suite
- See [PHASE_2_IMPLEMENTATION.md](./PHASE_2_IMPLEMENTATION.md)

⏳ **Phase 3** - Coming Soon

- Admin user management
- Dispute resolution workflow
- Advanced analytics

## Tech Stack

- **Frontend**: React 18.2 + Vite 5.1 + Tailwind CSS 3.4
- **Backend**: Flask + PyMongo + MongoDB
- **Security**: JWT + 2FA (TOTP) + CSRF protection
- **Payments**: Paystack
- **Testing**: pytest with 78+ tests

## Project Structure
```
fundme-app/
├── backend/   ← Flask API
└── frontend/  ← React + Vite
```

## Getting Started

### Quick Start (Recommended)

1. **One-command startup** (Windows):
```bash
# From the Promesapay root folder
.\start-dev.bat
```

Or for PowerShell:
```powershell
.\start-dev.ps1
```

This will automatically start:
- Backend API: `http://localhost:5000`
- Frontend: `http://localhost:5173`

### Manual Setup

#### 1. Setup backend
```bash
cd backend
python -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env            # Fill in your keys
python run.py
```

> Do not commit `.env` to source control. Use a separate `.env.example` file for local setup and environment variables for production.

#### 2. Setup frontend (in a new terminal)
```bash
cd frontend
npm install
npm run dev
```

#### 3. MongoDB
Make sure MongoDB is running locally:
```bash
mongod
```
Or use MongoDB Atlas — paste your connection string in `backend/.env`

#### 4. Environment variables

Use `backend/.env.example` as a template for local development.

**backend/.env**
```
FLASK_ENV=development
SECRET_KEY=your_secret
JWT_SECRET_KEY=your_jwt_secret
MONGO_URI=mongodb://localhost:27017/fundme
PAYSTACK_SECRET_KEY=sk_test_...
FRONTEND_URL=http://localhost:5173
```

In production, set these values directly in your environment rather than relying on `.env` files.

**frontend/.env**
```
VITE_PAYSTACK_PUBLIC_KEY=pk_test_...
```

## API Endpoints

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | /api/auth/register | ❌ | Register |
| POST | /api/auth/login | ❌ | Login |
| GET | /api/auth/me | ✅ | Current user |
| GET | /api/profile/:username | ❌ | Public profile |
| PUT | /api/profile/update | ✅ | Update profile |
| GET | /api/profile/stats | ✅ | My stats |
| POST | /api/donations/initiate | ❌ | Start donation |
| POST | /api/donations/verify | ❌ | Verify donation |
| POST | /api/coffee/initiate | ❌ | Start coffee |
| POST | /api/coffee/verify | ❌ | Verify coffee |
| GET | /api/transactions/ | ✅ | Transaction history |
| POST | /api/auth/forgot-password | ❌ | Request password reset |
| POST | /api/auth/reset-password | ❌ | Reset password with token |
| POST | /api/auth/send-verification-email | ✅ | Send verification email |
| POST | /api/auth/verify-email | ❌ | Verify email with token |
| GET | /api/auth/verification-status | ✅ | Check email verification status |
| POST | /api/auth/2fa/setup | ✅ | Setup 2FA - get QR code |
| POST | /api/auth/2fa/enable | ✅ | Enable 2FA - verify code |
| POST | /api/auth/2fa/verify-login | ❌ | Verify 2FA during login |
| GET | /api/receipts/ | ✅ | Get receipts list |
| GET | /api/receipts/<id> | ✅ | Get receipt details |
| GET | /api/receipts/<id>/download | ✅ | Download receipt PDF |

## 📚 Documentation

- **[SECURITY.md](./backend/SECURITY.md)** - Security best practices & configuration

### Project Organization

- **backend/** - Flask API server, database models, and routes
- **frontend/** - React UI, components, and Vite configuration
- **requirements.txt** - Python dependencies
- **package.json** - JavaScript dependencies

## 🧪 Testing

Run the comprehensive test suite:

```bash
cd backend

# Run all tests
pytest

# Run specific test file
pytest tests/test_auth_advanced.py -v

# Run with coverage
pytest --cov=app --cov-report=html
```

**Test Coverage:**

- 51 authentication & security tests
- 27 payment & financial tests
- 78+ total test cases