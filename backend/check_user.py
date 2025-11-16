#!/usr/bin/env python
"""
Script to check user authentication details
Run with: python manage.py shell < check_user.py
Or: python manage.py shell -c "exec(open('check_user.py').read())"
"""

import os
import django

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'dreamxi.settings')
django.setup()

from django.contrib.auth.models import User

# Check user by email
email = 'khuzemaasim@dreamxi.com'
user = User.objects.filter(email__iexact=email).first()

if user:
    print(f"✓ User found!")
    print(f"  Username: {user.username}")
    print(f"  Email: {user.email}")
    print(f"  Is Active: {user.is_active}")
    print(f"  Is Staff: {user.is_staff}")
    print(f"  Is Superuser: {user.is_superuser}")
    print(f"  Has Usable Password: {user.has_usable_password()}")
    print(f"\nTo reset password, run:")
    print(f"  user.set_password('your_new_password')")
    print(f"  user.save()")
else:
    print(f"✗ User with email '{email}' not found")
    print(f"\nTo create user, run:")
    print(f"  user = User.objects.create_user(")
    print(f"      username='khuzemaasim@dreamxi.com',")
    print(f"      email='khuzemaasim@dreamxi.com',")
    print(f"      password='your_password'")
    print(f"  )")

