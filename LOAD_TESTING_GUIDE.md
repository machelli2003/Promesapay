# Load Testing Guide

## Overview

Load testing verifies system performance under stress. This guide uses **Locust**, a Python-based load testing tool.

---

## Installation

### 1. Install Locust

```bash
cd c:\Users\_MONI_\Desktop\StartUp\Promesapay\backend
.\venv\Scripts\Activate.ps1
pip install locust -q
```

### 2. Verify Installation

```bash
locust --version
```

---

## Load Testing Scenarios

### Scenario 1: Authentication Load Test

**File:** `backend/tests/load_tests/auth_load_test.py`

```python
from locust import HttpUser, task, between
import random

class AuthLoadTest(HttpUser):
    wait_time = between(1, 3)
    
    @task(2)
    def get_csrf_token(self):
        """Get CSRF token"""
        self.client.get("/api/auth/csrf-token")
    
    @task(3)
    def register_user(self):
        """Simulate user registration"""
        email = f"user{random.randint(1000, 9999)}@example.com"
        self.client.post("/api/auth/register", json={
            "email": email,
            "password": "TestPass123!",
            "username": f"user{random.randint(100, 999)}",
            "full_name": "Load Test User"
        })
    
    @task(5)
    def login_user(self):
        """Simulate login attempts"""
        self.client.post("/api/auth/login", json={
            "email": "test@example.com",
            "password": "Password123!"
        })
```

### Scenario 2: Payment Processing Load Test

**File:** `backend/tests/load_tests/payment_load_test.py`

```python
from locust import HttpUser, task, between
from datetime import datetime

class PaymentLoadTest(HttpUser):
    wait_time = between(2, 5)
    headers = {}
    
    def on_start(self):
        """Set up auth token before tests"""
        # In real scenario, get valid token
        self.headers = {
            "Authorization": f"Bearer YOUR_TEST_TOKEN"
        }
    
    @task(2)
    def initiate_donation(self):
        """Simulate donation initiation"""
        self.client.post("/api/donations/initiate", 
            json={
                "recipient_id": "test_recipient_123",
                "amount": 1000.00,
                "currency": "USD",
                "message": "Load test donation"
            },
            headers=self.headers,
            timeout=5
        )
    
    @task(1)
    def verify_payment(self):
        """Verify payment"""
        self.client.post("/api/donations/verify",
            json={"reference": "test_ref_123"},
            headers=self.headers
        )
    
    @task(3)
    def get_donation_history(self):
        """Fetch donation history"""
        self.client.get("/api/donations/?page=1&limit=10",
            headers=self.headers
        )
```

### Scenario 3: Concurrent User Load Test

**File:** `backend/tests/load_tests/concurrent_load_test.py`

```python
from locust import HttpUser, task, between, constant
import random

class ConcurrentUser(HttpUser):
    wait_time = constant(1)  # 1 second between requests
    
    @task(1)
    def read_profile(self):
        """Read user profile"""
        user_id = random.randint(1, 1000)
        self.client.get(f"/api/profile/user{user_id}")
    
    @task(2)
    def get_transactions(self):
        """Get transaction history"""
        self.client.get("/api/transactions/?page=1&limit=20",
            headers={"Authorization": "Bearer test_token"}
        )
    
    @task(1)
    def health_check(self):
        """Health check"""
        self.client.get("/api/health")
```

---

## Running Load Tests

### Basic Load Test (10 users, 2 ramp-up per second)

```bash
cd c:\Users\_MONI_\Desktop\StartUp\Promesapay\backend

# Start backend first
python run.py &

# In another terminal, activate venv and run test
.\venv\Scripts\Activate.ps1
locust -f tests/load_tests/auth_load_test.py \
  --host=http://localhost:5000 \
  --users=10 \
  --spawn-rate=2 \
  --run-time=60s
```

### Web UI (Interactive)

```bash
locust -f tests/load_tests/auth_load_test.py \
  --host=http://localhost:5000 \
  --web
```

Then open: `http://localhost:8089`

Configure in UI:
- **Number of users:** 10
- **Spawn rate:** 2 users/second
- **Duration:** 60 seconds

### Distributed Load Test (Multiple machines)

**Master process:**
```bash
locust -f tests/load_tests/payment_load_test.py \
  --host=http://localhost:5000 \
  --master \
  --users=100 \
  --spawn-rate=5 \
  --run-time=300s
```

**Worker processes (other machines):**
```bash
locust -f tests/load_tests/payment_load_test.py \
  --host=http://localhost:5000 \
  --worker \
  --master-host=<master-ip>
```

---

## Performance Metrics to Monitor

### Key Metrics

| Metric | Target | Alert Level |
|--------|--------|------------|
| **Response Time (avg)** | < 500ms | > 2000ms |
| **Response Time (p95)** | < 1s | > 5s |
| **Response Time (p99)** | < 2s | > 10s |
| **Request Rate** | > 100 req/s | < 50 req/s |
| **Error Rate** | < 1% | > 5% |
| **CPU Usage** | < 70% | > 90% |
| **Memory Usage** | < 60% | > 85% |
| **Database Queries/sec** | < 1000 | > 5000 |

### Example Results Output

```
Response time percentiles (in milliseconds)
 Type     Name                                          50%    66%    75%    80%    90%    95%    98%    99%   100%
---------|--------|------|------|------|------|------|------|------|------|------|
 POST     /api/auth/login                              312    415    502    587    850   1234   2100   3456  15234
 GET      /api/donations/                              145    198    234    267    398    587    912   1456   8234
 POST     /api/donations/initiate                      487    634    756    823   1134   1456   2345   3456  12345
---------|------|------|------|------|------|------|------|------|------|------|

Total requests: 12,456
Total errors: 45 (0.36%)
Average response time: 423ms
```

---

## Load Testing Script (batch)

**File:** `backend/scripts/load_test.ps1`

```powershell
param(
    [int]$users = 50,
    [int]$spawn_rate = 5,
    [int]$duration = 300
)

# Ensure backend is running
Write-Host "Starting backend server..."
Start-Process python -ArgumentList "run.py" -NoNewWindow

Start-Sleep -Seconds 3

# Activate venv
& ".\venv\Scripts\Activate.ps1"

# Run load test
Write-Host "Starting load test: $users users, $spawn_rate spawn rate, ${duration}s duration"
locust -f tests/load_tests/payment_load_test.py `
  --host=http://localhost:5000 `
  --users=$users `
  --spawn-rate=$spawn_rate `
  --run-time="${duration}s" `
  --csv=load_test_results

Write-Host "Load test complete. Results saved to load_test_results_*"
```

**Run it:**
```bash
.\scripts\load_test.ps1 -users 100 -spawn_rate 10 -duration 300
```

---

## Performance Analysis

### Analyzing Results

```python
import csv
from datetime import datetime

# Read Locust CSV output
with open('load_test_results_stats.csv') as f:
    reader = csv.DictReader(f)
    for row in reader:
        print(f"Endpoint: {row['Name']}")
        print(f"  Requests: {row['Request Count']}")
        print(f"  Failures: {row['Failure Count']}")
        print(f"  Avg: {row['Average Response Time']}ms")
        print(f"  p95: {row['95%']}ms")
        print(f"  p99: {row['99%']}ms")
        print()
```

### Red Flags

1. **High error rate (> 1%)**
   - Check backend logs
   - Review database performance
   - Check rate limiting settings

2. **Slow response times (p95 > 2s)**
   - Add database indexes
   - Optimize queries
   - Increase server resources

3. **Memory leak indicators**
   - Memory grows during test
   - Not released after test completes
   - Check for unclosed connections

4. **CPU spike**
   - Single core maxing out
   - Check for blocking operations
   - Consider horizontal scaling

---

## Optimization Tips

### Database Optimization
```python
# Create indexes before load test
from pymongo import ASCENDING
users_col.create_index([("email", ASCENDING)])
users_col.create_index([("username", ASCENDING)])
donations_col.create_index([("donor_id", ASCENDING)])
donations_col.create_index([("created_at", ASCENDING)])
```

### Caching Strategy
```python
# Add Redis caching
from flask_caching import Cache
cache = Cache(app, config={'CACHE_TYPE': 'redis'})

@app.route('/api/donations/')
@cache.cached(timeout=300)  # Cache for 5 minutes
def get_donations():
    # ...
```

### Connection Pooling
```python
# MongoDB connection pooling
from pymongo import MongoClient
client = MongoClient(
    maxPoolSize=50,
    minPoolSize=10
)
```

---

## Baseline Targets

Set these as goals after initial load testing:

```
- 100 concurrent users
- 500+ requests/second
- < 500ms avg response time
- < 1% error rate
- < 70% CPU usage
- < 2GB memory usage
```

---

## Troubleshooting

### "Connection refused" errors
```bash
# Ensure backend is running
cd backend
python run.py

# Or check port
netstat -ano | findstr :5000
```

### High memory usage during test
```python
# Add garbage collection to test
import gc

class MyLoadTest(HttpUser):
    def on_start(self):
        gc.collect()
```

### Locust not finding test file
```bash
# Use absolute path
locust -f C:\path\to\tests\load_tests\auth_load_test.py
```

### Rate limiting blocking test
```python
# Disable rate limiting in test config
class TestConfig(Config):
    RATELIMIT_ENABLED = False
```

---

## Next Steps

1. ✅ Create load test files in `tests/load_tests/`
2. Run baseline test: 10 users for 60 seconds
3. Identify bottlenecks
4. Optimize identified areas
5. Re-run to verify improvements
6. Establish performance baseline
7. Monitor in production
