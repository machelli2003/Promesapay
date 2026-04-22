# FundMe — Crowdfunding + Creator Support Platform

A full-stack web app combining GoFundMe-style donations and Buy Me a Coffee-style tips.

## Tech Stack
- **Frontend**: React + Vite + Tailwind CSS
- **Backend**: Flask + PyMongo
- **Database**: MongoDB
- **Payments**: Paystack

## Project Structure
```
fundme-app/
├── backend/   ← Flask API
└── frontend/  ← React + Vite
```

## Getting Started

### 1. Clone & setup backend
```bash
cd backend
python -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env            # Fill in your keys
python run.py
```

### 2. Setup frontend
```bash
cd frontend
npm install
cp .env.example .env            # Fill in Paystack public key
npm run dev
```

### 3. MongoDB
Make sure MongoDB is running locally:
```bash
mongod
```
Or use MongoDB Atlas — paste your connection string in `backend/.env`

### 4. Environment variables

**backend/.env**
```
FLASK_ENV=development
SECRET_KEY=your_secret
JWT_SECRET_KEY=your_jwt_secret
MONGO_URI=mongodb://localhost:27017/fundme
PAYSTACK_SECRET_KEY=sk_test_...
FRONTEND_URL=http://localhost:5173
```

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