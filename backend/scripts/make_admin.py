#!/usr/bin/env python3
"""Promote a PromesaPay user to admin by email.

Usage (from backend folder):
  python scripts/make_admin.py your@email.com
"""

import sys
import os

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from dotenv import load_dotenv

load_dotenv()

from pymongo import MongoClient


def main():
    if len(sys.argv) < 2:
        print("Usage: python scripts/make_admin.py <email>")
        sys.exit(1)

    email = sys.argv[1].strip().lower()
    uri = os.getenv("MONGO_URI")
    if not uri:
        print("MONGO_URI not set in .env")
        sys.exit(1)

    client = MongoClient(uri, serverSelectionTimeoutMS=15000)
    db = client.get_database("fundme")

    result = db.users.update_one({"email": email}, {"$set": {"role": "admin"}})
    if result.matched_count == 0:
        print(f"No user found with email: {email}")
        sys.exit(1)

    user = db.users.find_one({"email": email}, {"username": 1, "email": 1, "role": 1})
    print(f"Admin enabled for {user['email']} (@{user.get('username')})")
    print("Log out and log back in, then open: http://localhost:5173/admin/finance")


if __name__ == "__main__":
    main()
