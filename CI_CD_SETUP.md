# CI/CD Pipeline Setup

## Overview

Automated testing and deployment using GitHub Actions.

---

## Setup

### 1. Create Workflow Directory

```bash
mkdir -p .github/workflows
```

### 2. Create Main CI Workflow

**File:** `.github/workflows/test.yml`

```yaml
name: Tests

on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main, develop ]

jobs:
  backend-tests:
    runs-on: ubuntu-latest
    strategy:
      matrix:
        python-version: ['3.11', '3.12']
    
    services:
      mongodb:
        image: mongo:7.0
        options: >-
          --health-cmd "mongosh --eval \"db.adminCommand('ping')\""
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
        ports:
          - 27017:27017
    
    steps:
    - uses: actions/checkout@v3
    
    - name: Set up Python ${{ matrix.python-version }}
      uses: actions/setup-python@v4
      with:
        python-version: ${{ matrix.python-version }}
    
    - name: Cache dependencies
      uses: actions/cache@v3
      with:
        path: ~/.cache/pip
        key: ${{ runner.os }}-pip-${{ hashFiles('**/requirements.txt') }}
        restore-keys: |
          ${{ runner.os }}-pip-
    
    - name: Install dependencies
      run: |
        cd backend
        python -m pip install --upgrade pip
        pip install -r requirements.txt
        pip install pytest pytest-cov pytest-mock
    
    - name: Lint with flake8
      run: |
        pip install flake8
        cd backend
        flake8 app --count --select=E9,F63,F7,F82 --show-source --statistics
        flake8 app --count --exit-zero --max-complexity=10 --max-line-length=100 --statistics
    
    - name: Run backend tests
      env:
        MONGO_URI: mongodb://localhost:27017/test_fundme
      run: |
        cd backend
        pytest tests/ -v --cov=app --cov-report=xml --cov-report=html
    
    - name: Upload coverage to Codecov
      uses: codecov/codecov-action@v3
      with:
        file: ./backend/coverage.xml
        flags: unittests
        name: codecov-umbrella
    
    - name: Comment PR with test results
      if: github.event_name == 'pull_request'
      uses: actions/github-script@v6
      with:
        script: |
          const fs = require('fs');
          const coverage = fs.readFileSync('backend/htmlcov/status.json', 'utf8');
          github.rest.issues.createComment({
            issue_number: context.issue.number,
            owner: context.repo.owner,
            repo: context.repo.repo,
            body: `## Test Results ✅\n\nCoverage: ${coverage}`
          });

  frontend-tests:
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v3
    
    - name: Set up Node.js
      uses: actions/setup-node@v3
      with:
        node-version: '18'
        cache: 'npm'
        cache-dependency-path: 'frontend/package-lock.json'
    
    - name: Install dependencies
      run: |
        cd frontend
        npm ci
    
    - name: Lint
      run: |
        cd frontend
        npm run lint
    
    - name: Build
      run: |
        cd frontend
        npm run build
    
    - name: Run tests
      run: |
        cd frontend
        npm test -- --coverage
    
    - name: Upload artifacts
      if: always()
      uses: actions/upload-artifact@v3
      with:
        name: frontend-build
        path: frontend/dist/

  security-scan:
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v3
    
    - name: Run Trivy vulnerability scanner
      uses: aquasecurity/trivy-action@master
      with:
        scan-type: 'fs'
        scan-ref: '.'
        format: 'sarif'
        output: 'trivy-results.sarif'
    
    - name: Upload Trivy results to GitHub
      uses: github/codeql-action/upload-sarif@v2
      with:
        sarif_file: 'trivy-results.sarif'

  code-quality:
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v3
    
    - name: Set up Python
      uses: actions/setup-python@v4
      with:
        python-version: '3.11'
    
    - name: Install dependencies
      run: |
        pip install black isort flake8 mypy
    
    - name: Check formatting with black
      run: |
        cd backend
        black --check app/
    
    - name: Check imports with isort
      run: |
        cd backend
        isort --check-only app/
    
    - name: Type check with mypy
      run: |
        cd backend
        mypy app/ --ignore-missing-imports || true
```

### 3. Create Deployment Workflow

**File:** `.github/workflows/deploy.yml`

```yaml
name: Deploy

on:
  push:
    branches: [ main ]
    tags: [ 'v*' ]

jobs:
  build-and-deploy:
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main' || startsWith(github.ref, 'refs/tags/')
    
    steps:
    - uses: actions/checkout@v3
    
    - name: Build Docker image
      run: |
        docker build -t promesapay:${{ github.sha }} .
        docker tag promesapay:${{ github.sha }} promesapay:latest
    
    - name: Push to Docker Registry
      env:
        REGISTRY_USERNAME: ${{ secrets.DOCKER_USERNAME }}
        REGISTRY_PASSWORD: ${{ secrets.DOCKER_PASSWORD }}
      run: |
        echo "$REGISTRY_PASSWORD" | docker login -u "$REGISTRY_USERNAME" --password-stdin
        docker push promesapay:${{ github.sha }}
        docker push promesapay:latest
    
    - name: Deploy to production
      env:
        DEPLOY_KEY: ${{ secrets.DEPLOY_KEY }}
        DEPLOY_HOST: ${{ secrets.DEPLOY_HOST }}
        DEPLOY_USER: ${{ secrets.DEPLOY_USER }}
      run: |
        mkdir -p ~/.ssh
        echo "$DEPLOY_KEY" > ~/.ssh/deploy_key
        chmod 600 ~/.ssh/deploy_key
        ssh-keyscan -H $DEPLOY_HOST >> ~/.ssh/known_hosts
        ssh -i ~/.ssh/deploy_key $DEPLOY_USER@$DEPLOY_HOST \
          "cd /app && docker-compose pull && docker-compose up -d"
    
    - name: Run smoke tests
      run: |
        sleep 10
        curl -f http://localhost:5000/api/health || exit 1
    
    - name: Notify Slack on success
      if: success()
      uses: 8398a7/action-slack@v3
      with:
        status: ${{ job.status }}
        text: 'Deployment successful!'
        webhook_url: ${{ secrets.SLACK_WEBHOOK }}
    
    - name: Notify Slack on failure
      if: failure()
      uses: 8398a7/action-slack@v3
      with:
        status: ${{ job.status }}
        text: 'Deployment failed!'
        webhook_url: ${{ secrets.SLACK_WEBHOOK }}
```

### 4. Create Scheduled Performance Tests

**File:** `.github/workflows/performance.yml`

```yaml
name: Performance Tests

on:
  schedule:
    - cron: '0 2 * * *'  # Daily at 2 AM UTC
  workflow_dispatch:

jobs:
  load-test:
    runs-on: ubuntu-latest
    
    services:
      mongodb:
        image: mongo:7.0
        ports:
          - 27017:27017
    
    steps:
    - uses: actions/checkout@v3
    
    - name: Set up Python
      uses: actions/setup-python@v4
      with:
        python-version: '3.11'
    
    - name: Install dependencies
      run: |
        cd backend
        pip install -r requirements.txt
        pip install locust
    
    - name: Start backend
      run: |
        cd backend
        python run.py &
        sleep 5
    
    - name: Run load test
      run: |
        cd backend
        locust -f tests/load_tests/payment_load_test.py \
          --host=http://localhost:5000 \
          --users=50 \
          --spawn-rate=5 \
          --run-time=300s \
          --csv=load_test_results
    
    - name: Upload results
      uses: actions/upload-artifact@v3
      with:
        name: load-test-results
        path: backend/load_test_results_*
```

### 5. Create Pre-Commit Hook Setup

**File:** `.github/workflows/pre-commit.yml`

```yaml
name: Pre-commit

on:
  pull_request:

jobs:
  pre-commit:
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v3
    
    - name: Set up Python
      uses: actions/setup-python@v4
      with:
        python-version: '3.11'
    
    - name: Set up Node.js
      uses: actions/setup-node@v3
      with:
        node-version: '18'
    
    - name: Run pre-commit
      uses: pre-commit/action@v3
```

---

## GitHub Secrets Configuration

Add these secrets to GitHub repository settings:

```
DOCKER_USERNAME        # Docker Hub username
DOCKER_PASSWORD        # Docker Hub token
DEPLOY_KEY             # SSH private key for deployment
DEPLOY_HOST            # Deployment server hostname
DEPLOY_USER            # SSH username for deployment
SLACK_WEBHOOK          # Slack webhook URL for notifications
```

---

## Local Setup (Optional)

### Install Pre-commit Hooks

```bash
pip install pre-commit
cd Promesapay
pre-commit install
```

### Test Workflow Locally

```bash
pip install act
cd .github/workflows
act -j backend-tests
```

---

## Branch Protection

Set up GitHub branch protection rules:

1. Go to **Settings** → **Branches**
2. Select **main** branch
3. Enable:
   - ✅ Require pull request reviews before merging
   - ✅ Require status checks to pass before merging
   - ✅ Require branches to be up to date
   - ✅ Require code reviews from code owners

**Status checks required:**
- backend-tests
- frontend-tests  
- code-quality
- security-scan

---

## Monitoring & Alerts

### View Workflow Status

- GitHub Actions tab: See all workflow runs
- Merge request status: Shows required checks
- Email notifications: On workflow failure

### Slack Integration

Notifications sent to Slack on:
- ✅ Successful deployments
- ❌ Test failures
- ⚠️ Security vulnerabilities

---

## Performance Monitoring

### Workflow Timing

Check action logs for:
- Test execution time
- Build time
- Deployment time

Target times:
- Backend tests: < 5 minutes
- Frontend build: < 2 minutes
- Deployment: < 5 minutes

### Cost Optimization

- Use caching for dependencies
- Parallelize independent jobs
- Limit matrix builds (2 Python versions)
- Use ubuntu-latest for cost savings

---

## Troubleshooting

### Tests failing in CI but passing locally

```bash
# Match CI environment
python -m pytest tests/ -v

# Use same Python version
python --version  # Should be 3.11+
```

### Secrets not found

```bash
# Verify secrets are set in GitHub
# Settings → Secrets and variables → Actions

# Check workflow references correct secret name
# ${{ secrets.SECRET_NAME }}
```

### Deployment fails

```bash
# Check SSH connection
ssh -i private_key user@host

# Verify Docker registry credentials
docker login <registry>

# Check deployment logs on target server
ssh user@host "docker-compose logs"
```

---

## Next Steps

1. Create `.github/workflows/` directory
2. Add `test.yml` workflow
3. Create secrets in GitHub settings
4. Trigger workflow on next push
5. Review test results
6. Add branch protection rules
7. Set up Slack notifications
8. Monitor for issues

---

## Resources

- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [GitHub Actions for Python](https://github.com/actions/setup-python)
- [Pre-commit Framework](https://pre-commit.com/)
- [Docker GitHub Action](https://github.com/docker/build-push-action)
