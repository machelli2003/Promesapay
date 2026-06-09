# Pre-Commit Hooks Setup

Automatically lint and format code before each commit.

## Installation

### 1. Install pre-commit tool
```bash
pip install pre-commit
```

### 2. Install git hooks
```bash
cd Promesapay
pre-commit install
```

### 3. (Optional) Update hooks
```bash
pre-commit autoupdate
```

## Usage

### Automatic (On every commit)
```bash
git add .
git commit -m "Your message"
# Hooks run automatically
```

### Manual (Check all files)
```bash
pre-commit run --all-files
```

### Run specific hook
```bash
pre-commit run flake8 --all-files
pre-commit run black --all-files
pre-commit run prettier --all-files
```

### Skip hooks (if needed)
```bash
git commit --no-verify
```

## What Gets Checked

### Python
- **flake8** - Style guide enforcement (PEP 8)
- **black** - Code formatting
- **isort** - Import sorting
- **mypy** - Type checking (optional)

### JavaScript/TypeScript
- **prettier** - Code formatting
- **eslint** - Linting (if configured)

### General
- **YAML validation** - Check .yml/.yaml files
- **JSON validation** - Check .json files
- **Trailing whitespace** - Remove extra spaces
- **Merge conflicts** - Detect unresolved merges
- **Large files** - Warn if files > 1MB
- **Secrets detection** - Prevent committing credentials

## Configuration

Edit `.pre-commit-config.yaml` to:
- Enable/disable hooks
- Change settings
- Add new tools

Example: Change line length for flake8
```yaml
- repo: https://github.com/PyCQA/flake8
  hooks:
    - id: flake8
      args: ["--max-line-length=120"]  # Changed from 100
```

## Troubleshooting

### Hook is too slow
- Reduce scope: exclude large directories
- Use `fail_fast: true` to stop on first error
- Run manually during development

### Hook keeps failing
- Read the error message carefully
- Run the tool manually to fix: `black src/`
- Some hooks auto-fix (black, isort, prettier)

### Need to update dependencies
```bash
pip install --upgrade pre-commit
pre-commit autoupdate
```

### Remove hooks
```bash
pre-commit uninstall
```

---

# Logging Usage Guide

Structured logging for debugging and monitoring.

## Quick Start

### Initialize logging (backend startup)
```python
# In backend/app/__init__.py or run.py
from app.logging_config import setup_logging

logger = setup_logging(app, log_level="DEBUG")
logger.info("Application started")
```

### Basic logging
```python
from loguru import logger

# Different levels
logger.debug("Debug message")
logger.info("Info message")
logger.warning("Warning message")
logger.error("Error message")
logger.critical("Critical message")
```

### Structured logging with context
```python
from loguru import logger

# Bind context (persists across calls)
logger = logger.bind(user_id="12345", request_id="abc-def")
logger.info("User action")
logger.info("Another action")
# Both logs will include user_id and request_id
```

### Logging with variables
```python
user_id = "12345"
amount = 1000.00
logger.info(f"Donation received | user_id={user_id} | amount={amount}")
```

### Using log context manager
```python
from app.logging_config import log_context

with log_context("process_payment", user_id="12345", amount=1000):
    # Your code here
    logger.info("Payment processing...")
    # Logs automatically track: starting, completion, or errors
```

### Exception logging
```python
try:
    do_something()
except Exception as e:
    logger.error(f"Operation failed: {e}", exc_info=True)
    # exc_info=True includes full stack trace
```

## Log Files

Generated in `backend/logs/`:

| File | Purpose | Rotation |
|------|---------|----------|
| `app.log` | All application logs | 500 MB / 7 days |
| `error.log` | Errors only | 500 MB / 30 days |
| `security.log` | Security events | 1 GB / 90 days |

## Common Patterns

### Authentication logging
```python
from app.logging_config import LogTemplates

logger.info(LogTemplates.auth_success(user_id="123", method="password"))
logger.warning(LogTemplates.auth_failure(email="user@example.com", reason="Invalid password"))
```

### Security events
```python
from app.logging_config import LogTemplates

logger.info(
    LogTemplates.security_event(
        event_type="2FA_ENABLED",
        user_id="123",
        details="TOTP setup completed"
    )
)
```

### Database operations
```python
from app.logging_config import LogTemplates
import time

start = time.time()
result = users_col.insert_one(user_data)
duration = int((time.time() - start) * 1000)  # milliseconds

logger.info(LogTemplates.db_operation(
    operation="INSERT",
    collection="users",
    affected_rows=1,
    duration_ms=duration
))
```

### API errors
```python
from app.logging_config import LogTemplates

logger.error(LogTemplates.api_error(
    endpoint="/api/donations/verify",
    status_code=400,
    error_msg="Invalid payment reference"
))
```

## Configuration

### Log level in development
```python
setup_logging(app, log_level="DEBUG")  # Verbose
```

### Log level in production
```python
setup_logging(app, log_level="INFO")  # Less verbose
```

### Custom log directory
```python
setup_logging(app, log_level="INFO", log_dir="/var/log/promesapay")
```

## Monitoring

### View logs in real-time
```bash
# All logs
tail -f backend/logs/app.log

# Error logs only
tail -f backend/logs/error.log

# Security logs only
tail -f backend/logs/security.log

# Follow new entries
tail -f -n 50 backend/logs/app.log
```

### Search logs
```bash
# Find all payment errors
grep "payment" backend/logs/error.log

# Find specific user
grep "user_id=12345" backend/logs/app.log

# Case-insensitive search
grep -i "failed" backend/logs/app.log

# Count occurrences
grep "authentication" backend/logs/app.log | wc -l
```

### Grep with context
```bash
# Show 3 lines before and after
grep -C 3 "error" backend/logs/app.log

# Show 5 lines after
grep -A 5 "error" backend/logs/app.log
```

## Best Practices

1. **Use appropriate log levels:**
   - `DEBUG` - Detailed info for debugging
   - `INFO` - Normal application events
   - `WARNING` - Something unexpected
   - `ERROR` - Error that needs attention
   - `CRITICAL` - System failure

2. **Include context:**
   ```python
   logger.info(f"User login | user_id={user_id} | ip={request.remote_addr}")
   ```

3. **Avoid logging sensitive data:**
   ```python
   # Bad:
   logger.info(f"Password: {password}")
   
   # Good:
   logger.info("Password validation passed")
   ```

4. **Use structured format:**
   ```python
   # Bad:
   logger.info("Something happened with user and amount")
   
   # Good:
   logger.info("Donation processed | user_id={uid} | amount={amt}")
   ```

5. **Log at the right level:**
   ```python
   # Bad: Too verbose
   logger.info(f"Checking user: {user_id}")
   
   # Good: Log meaningful events
   logger.info(f"User authenticated | user_id={user_id}")
   ```

## Debugging with Logs

### Step 1: Identify the issue
```bash
grep -i "error" backend/logs/error.log | tail -20
```

### Step 2: Find context
```bash
# Get the request ID from error
grep "REQUEST_ID_XYZ" backend/logs/app.log
```

### Step 3: Trace the flow
```bash
# Look for patterns
grep "user_id=12345" backend/logs/app.log | tail -30
```

### Step 4: Fix and verify
- Make changes
- Run tests
- Monitor logs for the issue

---

## Integration with Monitoring Tools

### Send to external service (example)
```python
# In production, integrate with:
# - Sentry (error tracking)
# - DataDog (monitoring)
# - ELK Stack (log aggregation)
# - Splunk (log analytics)

# See loguru documentation for handlers
```
