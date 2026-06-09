# Database Optimization Guide

## Current Index Status

### Existing Indexes (Already Configured)

Run this to verify all indexes are created:

```python
# backend/scripts/verify_indexes.py
from pymongo import MongoClient
from app.config import settings

client = MongoClient(settings.MONGO_URI)
db = client.fundme

# Verify indexes exist
collections_to_check = [
    'users', 'donations', 'payments', 'transactions',
    'receipts', 'disputes', 'notifications', 'activities'
]

for col_name in collections_to_check:
    col = db[col_name]
    indexes = col.list_indexes()
    print(f"\n{col_name} indexes:")
    for idx in indexes:
        print(f"  - {idx['name']}: {idx['key']}")
```

---

## Query Optimization

### 1. User Lookups (High Traffic)

**Current:** Find by email, username
```python
# Indexes needed:
users_col.create_index([("email", 1)])           # 1=ascending, UNIQUE
users_col.create_index([("username", 1)])        # UNIQUE
users_col.create_index([("email_verified", 1)])  # For filtering
users_col.create_index([("status", 1)])          # Active/suspended
```

**Verify:**
```python
# Find by email - should use index
explain = users_col.find({"email": "test@example.com"}).explain()
print(f"Docs scanned: {explain['executionStats']['totalDocsExamined']}")
print(f"Docs returned: {explain['executionStats']['nReturned']}")
# Good: docsExamined == nReturned (uses index)
```

### 2. Donation Queries (Very High Traffic)

**Current:** Filter by donor, recipient, status, date range
```python
# Multi-field compound indexes:
donations_col.create_index([
    ("donor_id", 1),
    ("created_at", -1)  # -1 = descending
])

donations_col.create_index([
    ("recipient_id", 1),
    ("status", 1),
    ("created_at", -1)
])

donations_col.create_index([
    ("status", 1),
    ("created_at", -1)
])

# Range queries on amount
donations_col.create_index([("amount", 1)])
```

**Optimize query:**
```python
# Bad: Full collection scan
donations = donations_col.find({
    "donor_id": user_id,
    "status": "completed"
}).sort("created_at", -1)

# Good: Uses compound index
donations = donations_col.find({
    "donor_id": user_id,
    "status": "completed"
}).sort("created_at", -1).limit(20)

# Verify execution plan
explain = donations_col.find({...}).explain()
if explain['executionStats']['executionStages']['stage'] == 'COLLSCAN':
    print("⚠️  Full collection scan - query not using index!")
```

### 3. Transaction Queries

```python
# Indexes for transaction filtering
transactions_col.create_index([
    ("user_id", 1),
    ("created_at", -1)
])

transactions_col.create_index([
    ("type", 1),  # 'donation', 'payment', 'payout'
    ("status", 1)
])

# Aggregation pipeline indexes
transactions_col.create_index([("created_at", 1)])
```

### 4. Activity/Audit Logs (Insert-heavy)

```python
# TTL index - auto-delete after 90 days
activities_col.create_index(
    [("created_at", 1)],
    expireAfterSeconds=7776000  # 90 days
)

# Query index
activities_col.create_index([
    ("user_id", 1),
    ("action", 1),
    ("created_at", -1)
])
```

---

## Query Performance Analysis

### Check Index Usage

```python
# backend/scripts/analyze_queries.py
from pymongo import MongoClient

client = MongoClient('mongodb://localhost:27017')
db = client.fundme

def analyze_query(collection_name, query, sort_spec=None):
    """Analyze if query uses indexes efficiently"""
    col = db[collection_name]
    
    cursor = col.find(query)
    if sort_spec:
        cursor.sort(sort_spec)
    
    explain = cursor.explain()
    stats = explain['executionStats']
    
    docs_scanned = stats['totalDocsExamined']
    docs_returned = stats['nReturned']
    efficiency = (docs_returned / docs_scanned * 100) if docs_scanned > 0 else 0
    
    print(f"Query: {query}")
    print(f"  Scanned: {docs_scanned} docs")
    print(f"  Returned: {docs_returned} docs")
    print(f"  Efficiency: {efficiency:.1f}%")
    print(f"  Stage: {stats['executionStages']['stage']}")
    
    if efficiency < 90:
        print("  ⚠️  Consider adding index!")
    else:
        print("  ✅ Good efficiency")
    print()

# Analyze common queries
analyze_query('donations', 
    {"donor_id": "123", "status": "completed"},
    [("created_at", -1)]
)

analyze_query('users',
    {"email": "test@example.com"}
)
```

### Slow Query Log

```python
# Enable MongoDB profiling
db.set_profiling_level(1)  # Profile slow operations (> 100ms)

# Get slow queries
slow_queries = db.system.profile.find({
    "millis": {"$gt": 100}
}).sort("ts", -1).limit(10)

for query in slow_queries:
    print(f"Operation: {query['op']}")
    print(f"Namespace: {query['ns']}")
    print(f"Duration: {query['millis']}ms")
    print(f"Query: {query.get('command', query.get('filter'))}")
    print()
```

---

## Connection Pooling

### Current Setup

```python
# backend/app/db.py - Already configured
client = MongoClient(
    settings.MONGO_URI,
    maxPoolSize=50,  # Max connections
    minPoolSize=10,  # Min connections
    maxIdleTimeMS=45000  # Kill idle connections
)
```

### Monitor Connection Usage

```python
# Check active connections
from pymongo import monitoring

# Enable command monitoring
def command_started(event):
    print(f"Command: {event.command_name}")

monitoring.register(command_started)
```

---

## Aggregation Pipeline Optimization

### Example: Get User Statistics

**Unoptimized:**
```python
# Python - N+1 problem
for user in users_col.find():
    total_received = donations_col.count_documents({
        "recipient_id": user['_id'],
        "status": "completed"
    })
    total_donated = donations_col.count_documents({
        "donor_id": user['_id'],
        "status": "completed"
    })
```

**Optimized with Aggregation:**
```python
# Single MongoDB query
pipeline = [
    {
        "$facet": {
            "received": [
                {
                    "$match": {
                        "recipient_id": user_id,
                        "status": "completed"
                    }
                },
                {
                    "$group": {
                        "_id": None,
                        "total": {"$sum": "$amount"},
                        "count": {"$sum": 1}
                    }
                }
            ],
            "donated": [
                {
                    "$match": {
                        "donor_id": user_id,
                        "status": "completed"
                    }
                },
                {
                    "$group": {
                        "_id": None,
                        "total": {"$sum": "$amount"},
                        "count": {"$sum": 1}
                    }
                }
            ]
        }
    }
]

result = donations_col.aggregate(pipeline)
```

---

## Caching Strategy

### Redis Caching

**Installation:**
```bash
pip install redis flask-caching -q
```

**Setup:**
```python
# backend/app/__init__.py
from flask_caching import Cache

cache = Cache(app, config={
    'CACHE_TYPE': 'redis',
    'CACHE_REDIS_URL': 'redis://localhost:6379/0',
    'CACHE_DEFAULT_TIMEOUT': 300
})
```

**Usage:**
```python
from app import cache

@app.route('/api/profile/<username>')
@cache.cached(timeout=600)  # Cache for 10 minutes
def get_profile(username):
    user = users_col.find_one({"username": username})
    return {"data": user}

# Invalidate cache when needed
@app.route('/api/profile/update', methods=['PUT'])
def update_profile():
    # ... update logic ...
    cache.delete(f'get_profile/{current_user}')
    return {"message": "Updated"}
```

### What to Cache

| Item | TTL | Size | Benefit |
|------|-----|------|---------|
| User profiles | 10 min | ~5 KB | High (frequent reads) |
| Donation history | 5 min | ~50 KB | Medium |
| Statistics | 1 hour | ~1 KB | High |
| Admin dashboard | 1 min | ~100 KB | High |
| Recent transactions | 2 min | ~30 KB | Medium |

---

## Write Performance (Batch Operations)

### Bulk Inserts

```python
# Slow: Individual inserts
for donation in donations:
    donations_col.insert_one(donation)

# Fast: Batch insert
donations_col.insert_many(donations, ordered=False)
```

### Bulk Updates

```python
from pymongo import UpdateOne

# Prepare operations
operations = [
    UpdateOne(
        {"_id": doc_id},
        {"$set": {"status": "completed"}}
    )
    for doc_id in ids
]

# Execute in batch
donations_col.bulk_write(operations)
```

---

## Storage Optimization

### Check Collection Sizes

```python
# Get storage stats
stats = db.command("collStats", "donations")
print(f"Size: {stats['size'] / 1024 / 1024:.1f} MB")
print(f"Document count: {stats['count']}")
print(f"Avg document size: {stats['avgObjSize']} bytes")

# List all collections by size
for col_name in db.list_collection_names():
    stats = db.command("collStats", col_name)
    size_mb = stats['size'] / 1024 / 1024
    count = stats['count']
    print(f"{col_name}: {size_mb:.1f} MB ({count} docs)")
```

### Compression

Enable compression at application level:

```python
import zlib
import json

def compress_data(data):
    json_str = json.dumps(data)
    return zlib.compress(json_str.encode())

def decompress_data(compressed):
    json_str = zlib.decompress(compressed).decode()
    return json.loads(json_str)
```

---

## Performance Benchmarks

### Target Metrics

| Operation | Target Time | Notes |
|-----------|------------|-------|
| Find by email | < 10ms | Should use index |
| Find donation history (20 docs) | < 50ms | Compound index |
| User stats aggregation | < 100ms | Pipeline optimization |
| Batch insert (100 docs) | < 50ms | Use bulk_write |
| Update with filter | < 30ms | Should use index |

### Baseline Measurement

```python
import time

def benchmark_query(name, func, iterations=100):
    start = time.time()
    for _ in range(iterations):
        func()
    elapsed = time.time() - start
    avg_ms = (elapsed / iterations) * 1000
    print(f"{name}: {avg_ms:.2f}ms avg")

# Run benchmarks
benchmark_query("Find by email", 
    lambda: users_col.find_one({"email": "test@example.com"}))

benchmark_query("Find donations",
    lambda: donations_col.find({"donor_id": "123"}).limit(20).to_list())
```

---

## Maintenance

### Regular Tasks

**Weekly:**
```bash
# Rebuild indexes if collection grew significantly
db.donations.reIndex()

# Check index size
db.donations.aggregate([{"$indexStats": {}}])
```

**Monthly:**
```bash
# Defragment collection
db.runCommand({"compact": "donations"})

# Remove unused indexes
# Manually review indexStats
```

**Quarterly:**
```bash
# Full backup
mongodump --uri="mongodb://..." --out=backup_dir

# Analyze query patterns
# Review and optimize slow queries
```

---

## Troubleshooting

### "Exceeded memory limit"
```python
# Reduce batch size
donations_col.aggregate(pipeline, allowDiskUse=True)

# Use batch processing
for batch in batches(data, size=1000):
    donations_col.insert_many(batch)
```

### "Slow query detected"
```python
# Check indexes exist
db.donations.getIndexes()

# Rebuild if needed
db.donations.reIndex()

# Analyze execution plan
db.donations.find({...}).explain("executionStats")
```

### High CPU during query
```python
# Enable index intersection
db.setProfilingLevel(1, {"slowms": 100})

# Check if using index
explain = db.donations.find({...}).explain()
stage = explain['executionStats']['executionStages']['stage']
if stage != 'COLLSCAN':
    print("✅ Using index")
```

---

## Next Steps

1. **Verify indexes** are created in production
2. **Monitor query performance** for 1 week
3. **Identify slowest queries** from logs
4. **Create missing indexes** for those queries
5. **Set up caching** for frequently accessed data
6. **Establish baseline** metrics for comparison
7. **Re-test after optimizations** to verify improvements
