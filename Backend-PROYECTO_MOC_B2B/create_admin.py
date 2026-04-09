import os
import django

# Configure Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from django.contrib.auth.models import User

# Configuration
username = 'admin'
email = 'admin@example.com'
password = 'admin' # You should change this after logging in

def create_superuser():
    if not User.objects.filter(username=username).exists():
        User.objects.create_superuser(username, email, password)
        print(f"✅ Superusuario '{username}' creado exitosamente con la contraseña '{password}'.")
    else:
        # If it exists, we can still update the password to be sure
        user = User.objects.get(username=username)
        user.set_password(password)
        user.is_superuser = True
        user.is_staff = True
        user.save()
        print(f"ℹ️ El usuario '{username}' ya existía. La contraseña ha sido actualizada a '{password}'.")

if __name__ == "__main__":
    create_superuser()
