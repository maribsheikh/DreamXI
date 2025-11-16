from django.core.management.base import BaseCommand
from django.contrib.auth.models import User


class Command(BaseCommand):
    help = 'Creates or updates the admin account (admin@dreamxi.com)'

    def handle(self, *args, **options):
        admin_email = 'admin@dreamxi.com'
        admin_username = 'admin@dreamxi.com'
        admin_password = 'admin123'
        
        # Check if admin exists
        admin_user = User.objects.filter(email=admin_email).first()
        
        if admin_user:
            # Update existing admin
            admin_user.username = admin_username
            admin_user.email = admin_email
            admin_user.is_staff = True
            admin_user.is_superuser = True
            admin_user.is_active = True
            admin_user.set_password(admin_password)
            admin_user.save()
            self.stdout.write(
                self.style.SUCCESS(f'Admin account updated: {admin_email}')
            )
        else:
            # Create new admin
            admin_user = User.objects.create_user(
                username=admin_username,
                email=admin_email,
                password=admin_password,
                is_staff=True,
                is_superuser=True,
                is_active=True
            )
            self.stdout.write(
                self.style.SUCCESS(f'Admin account created: {admin_email}')
            )
        
        self.stdout.write(
            self.style.SUCCESS(f'  Username: {admin_username}')
        )
        self.stdout.write(
            self.style.SUCCESS(f'  Password: {admin_password}')
        )

