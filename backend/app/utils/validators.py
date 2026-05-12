import re

def is_valid_email(email):
    return re.match(r"[^@]+@[^@]+\.[^@]+", email)

def is_valid_username(username):
    return re.match(r"^[a-zA-Z0-9_]{3,30}$", username)


def is_valid_password(password):
    if len(password) < 10:
        return False
    if not re.search(r"[A-Z]", password):
        return False
    if not re.search(r"[a-z]", password):
        return False
    if not re.search(r"[0-9]", password):
        return False
    if not re.search(r"[!@#$%^&*(),.?\":{}|<>]", password):
        return False
    return True