# Developer Setup Guide

Welcome to PromesaPay! This guide will help you set up your development environment and start contributing.

## Prerequisites

- **Python 3.11+** - [Download](https://www.python.org/downloads/)
- **Node.js 18+** - [Download](https://nodejs.org/)
- **MongoDB 5.0+** - [Download](https://www.mongodb.com/try/download/community) or use [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
- **Git** - [Download](https://git-scm.com/downloads)

## Quick Start (5 minutes)

### 1. Clone & Navigate
```bash
git clone <repository-url>
cd Promesapay
```

### 2. One-Command Startup (Windows)
```bash
# Batch script
.\start-dev.bat

# OR PowerShell
.\start-dev.ps1
```

This starts both servers automatically:
- **Frontend:** http://localhost:5173
- **Backend:** http://localhost:5000

### 3. Manual Setup (if scripts don't work)

#### Backend Setup
```bash
cd backend

# Create & activate virtual environment
python -m venv venv
venv\Scripts\activate           # Windows
source venv/bin/activate        # macOS/Linux

# Install dependencies
pip install -r requirements.txt

# Create environment file
copy .env.example .env

# Add your config (MongoDB URI, Paystack keys, etc.)
# See Configuration section below

# Start server
python run.py
```

#### Frontend Setup (new terminal)
```bash
cd frontend

# Install dependencies
npm install

# Start development server
npm run dev
```

## Configuration

### Backend (.env)

Create `backend/.env` from template:
```bash
cd backend
copy .env.example .env
```

**Required keys:**
```
FLASK_ENV=development
SECRET_KEY=your-dev-secret-key-32-chars-minimum!
JWT_SECRET_KEY=your-dev-jwt-secret-key-32-chars-minimum!
MONGO_URI=mongodb://localhost:27017/fundme
PAYSTACK_SECRET_KEY=sk_test_xxxxx
```

**Optional (for local testing):**
```
SMTP_USERNAME=your-email@gmail.com
SMTP_PASSWORD=your-app-password
GOOGLE_CLIENT_ID=your-google-oauth-id
GOOGLE_CLIENT_SECRET=your-google-oauth-secret
```

### Frontend (.env)

Optional, for Paystack public key testing:
```
VITE_PAYSTACK_PUBLIC_KEY=pk_test_xxxxx
```

## Project Structure

```
Promesapay/
├── backend/                    # Flask API
│   ├── app/
│   │   ├── routes/            # API endpoints
│   │   ├── models/            # Database schemas
│   │   ├── services/          # Business logic
│   │   ├── security/          # JWT, 2FA, CSRF
│   │   ├── config.py          # Configuration
│   │   └── db.py              # MongoDB collections
│   ├── tests/                 # Test suite (pytest)
│   ├── requirements.txt        # Python dependencies
│   └── run.py                 # Entry point
│
├── frontend/                   # React + Vite
│   ├── src/
│   │   ├── api/               # API client modules
│   │   ├── components/        # Reusable components
│   │   ├── pages/             # Page components
│   │   ├── context/           # React context
│   │   ├── hooks/             # Custom hooks
│   │   └── utils/             # Helpers (errors, constants)
│   ├── package.json
│   └── vite.config.js
│
├── README.md                  # Project overview
├── SECURITY_AUDIT.md         # Security review
└── start-dev.bat/.ps1        # Development startup
```

## Development Workflow

### 1. Create a Feature Branch
```bash
git checkout -b feature/your-feature-name
```

### 2. Make Changes

#### Backend Changes
```bash
cd backend

# Write your code

# Run tests
pytest

# Run specific test
pytest tests/test_auth.py -v

# Check code style
# (Use any Python linter: flake8, pylint, black)
```

#### Frontend Changes
```bash
cd frontend

# Write your code

# The dev server hot-reloads automatically

# Format code
npx prettier --write src/

# Lint
npm run lint  # if configured
```

### 3. Commit & Push
```bash
git add .
git commit -m "feat: describe your changes"
git push origin feature/your-feature-name
```

### 4. Create Pull Request
- Push to GitHub
- Open PR with clear description
- Request review from teammates

## Common Commands

### Backend

```bash
cd backend

# Run development server
python run.py

# Run tests
pytest

# Run tests with coverage
pytest --cov=app --cov-report=html

# Run specific test file
pytest tests/test_auth.py -v

# Install new dependency
pip install package-name
pip freeze > requirements.txt

# Check database
cd backend
python -c "from app.db import users_col; print(users_col.count_documents({}))"
```

### Frontend

```bash
cd frontend

# Run dev server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Install new dependency
npm install package-name

# Update dependencies
npm update
```

## Environment-Specific Config

### Development
```
FLASK_ENV=development
DEBUG=True
LOG_LEVEL=DEBUG
```

### Production
```
FLASK_ENV=production
DEBUG=False
LOG_LEVEL=INFO
SESSION_COOKIE_SECURE=True
```

## Debugging

### Backend Debugging

**Enable detailed logging:**
```python
# In backend/app/__init__.py or route
from loguru import logger
logger.debug("My debug message", variable=value)
```

**View logs:**
```bash
tail -f backend/logs/app.log
```

**Python debugger:**
```python
# In your code
import pdb; pdb.set_trace()

# Then in terminal:
# Step through code using: n (next), s (step), c (continue), p variable
```

### Frontend Debugging

**Browser DevTools:**
1. Open http://localhost:5173
2. Press F12 or Ctrl+Shift+I
3. Use Console, Network, Sources tabs

**React DevTools:**
- Install React Developer Tools extension
- Inspect components in DevTools

**Network Requests:**
- Open DevTools Network tab
- Check requests to http://localhost:5000/api/*
- Verify response status and data

## Testing

### Backend Tests
```bash
cd backend

# Run all tests
pytest

# Run with verbose output
pytest -v

# Run specific test
pytest tests/test_auth.py::test_login -v

# Run with coverage report
pytest --cov=app --cov-report=html
# Open htmlcov/index.html in browser
```

**Test locations:**
- `backend/tests/test_*.py` - Test files

### Frontend Tests
```bash
cd frontend

# No tests currently configured
# Consider adding Jest, Vitest, or React Testing Library
```

## Code Style

### Backend
- Python 3.11+
- Follow PEP 8 style guide
- Use type hints where possible
- Docstrings for public functions

### Frontend
- ES6+ JavaScript
- React functional components with hooks
- Tailwind CSS for styling
- Clear component organization

## Documentation

### Adding API Documentation
See [API_DOCS.md](./API_DOCS.md) for OpenAPI/Swagger format.

### Code Comments
- Use JSDoc for JavaScript functions
- Use docstrings for Python functions
- Explain "why", not "what" (code shows what it does)

## Troubleshooting

### "Module not found" Error

**Backend:**
```bash
pip install -r requirements.txt
# Or for specific module:
pip install module-name
```

**Frontend:**
```bash
npm install
# Or for specific module:
npm install package-name
```

### MongoDB Connection Error

```bash
# Check if MongoDB is running
# macOS/Linux:
brew services list

# Windows:
# Open Services app, look for MongoDB

# Or use MongoDB Atlas cloud
# Update MONGO_URI in .env to your Atlas connection string
```

### Port Already in Use

```bash
# Find process using port 5000 (backend)
netstat -ano | findstr :5000

# Find process using port 5173 (frontend)
netstat -ano | findstr :5173

# Kill process (Windows)
taskkill /PID <process-id> /F

# Or change ports in config
```

### Vite Proxy Errors

If frontend can't connect to backend:
1. Ensure backend is running on http://localhost:5000
2. Check `frontend/vite.config.js` proxy configuration
3. Verify no CORS issues in backend logs

## Performance Tips

### Frontend
- Use React DevTools Profiler to find slow components
- Enable code splitting for large routes
- Optimize images (use WebP where possible)
- Lazy load components with `React.lazy()`

### Backend
- Use MongoDB indexes (already configured in `db.py`)
- Profile slow endpoints: `from cProfile import run`
- Enable query logging: `LOG_LEVEL=DEBUG`
- Cache frequently accessed data

## Security Notes

### Never commit secrets!
- `.env` files are in `.gitignore`
- Use `.env.example` as template
- Production secrets via environment variables

### Password Requirements
- Minimum 8 characters
- Mix of letters, numbers, symbols recommended

### CSRF Protection
- Backend validates `X-CSRF-Token` header
- Frontend automatically includes token
- Don't disable for testing

## Getting Help

### Resources
1. **Backend Documentation:** `backend/SECURITY.md`
2. **API Reference:** `API_DOCS.md`
3. **Code Comments:** Check source files
4. **Stack Overflow:** Search Flask, React, MongoDB tags

### Reporting Issues
1. Describe the problem
2. Include error message and stack trace
3. List steps to reproduce
4. Share your environment (OS, Python version, Node version)

## Next Steps

1. ✅ Complete this guide
2. 🚀 Start the dev servers
3. 📝 Create your first feature branch
4. 🧪 Run the test suite
5. 🔍 Explore the codebase

Happy coding! 🎉
