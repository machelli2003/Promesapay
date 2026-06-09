#!/usr/bin/env python
"""Database Connection Test Script"""

import sys
import os

# Add backend to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'backend'))

def test_database():
    """Test MongoDB connection"""
    try:
        from app.db import db, client
        from app.config import settings
        
        print("\n" + "="*50)
        print("Testing PromesaPay Database Connection")
        print("="*50 + "\n")
        
        # Test basic connection
        print("1. Testing MongoDB connection...")
        print(f"   MONGO_URI: {settings.MONGO_URI[:50]}...")
        
        # Ping the server
        client.admin.command('ping')
        print("   ✓ MongoDB connection successful\n")
        
        # Check database and collections
        print("2. Checking database and collections...")
        db_list = client.list_database_names()
        print(f"   ✓ Available databases: {len(db_list)}")
        
        db_obj = client.get_database("fundme")
        collections = db_obj.list_collection_names()
        print(f"   ✓ Collections in 'fundme': {len(collections)}")
        for col in sorted(collections)[:5]:
            print(f"     - {col}")
        if len(collections) > 5:
            print(f"     ... and {len(collections) - 5} more")
        
        # Get collection stats
        print("\n3. Collection Statistics:")
        from app.db import users_col, donations_col, campaigns_col
        
        users_count = users_col.count_documents({})
        donations_count = donations_col.count_documents({})
        campaigns_count = campaigns_col.count_documents({})
        
        print(f"   - Users: {users_count}")
        print(f"   - Donations: {donations_count}")
        print(f"   - Campaigns: {campaigns_count}")
        
        print("\n" + "="*50)
        print("✓ ALL CHECKS PASSED")
        print("="*50 + "\n")
        return True
        
    except Exception as e:
        print("\n" + "="*50)
        print("✗ DATABASE CONNECTION FAILED")
        print("="*50)
        print(f"\nError: {str(e)}")
        print("\nPossible fixes:")
        print("  1. Check MongoDB connection string in backend/.env")
        print("  2. Ensure MongoDB is running")
        print("  3. Check network/firewall settings")
        print("  4. Verify credentials in MONGO_URI\n")
        return False

if __name__ == "__main__":
    success = test_database()
    sys.exit(0 if success else 1)
