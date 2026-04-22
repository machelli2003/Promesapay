import re

def is_valid_email(email):
    return re.match(r"[^@]+@[^@]+\.[^@]+", email)

def is_valid_username(username):
    return re.match(r"^[a-zA-Z0-9_]{3,30}$", username)