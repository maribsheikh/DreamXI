from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.authtoken.models import Token
from django.contrib.auth import authenticate, login, logout
from django.contrib.auth.models import User
from rest_framework import serializers

class UserRegistrationSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=8)
    confirm_password = serializers.CharField(write_only=True)

    class Meta:
        model = User
        fields = ('email', 'username', 'first_name', 'last_name', 'password', 'confirm_password')

    def validate_email(self, value):
        """Validate that email is unique (case-insensitive)"""
        if value:
            value = value.strip().lower()
            if User.objects.filter(email__iexact=value).exists():
                raise serializers.ValidationError("A user with this email already exists.")
        return value

    def validate_username(self, value):
        """Validate that username is unique (case-insensitive)"""
        if value:
            value = value.strip()
            if User.objects.filter(username__iexact=value).exists():
                raise serializers.ValidationError("A user with this username already exists.")
        return value

    def validate(self, attrs):
        if attrs['password'] != attrs['confirm_password']:
            raise serializers.ValidationError("Passwords don't match")
        
        # Note: Field-level validation (validate_email, validate_username) already checks uniqueness
        # This method-level validation is a backup check
        email = attrs.get('email', '').strip().lower() if attrs.get('email') else ''
        username = attrs.get('username', '').strip() if attrs.get('username') else ''
        
        # Update attrs with normalized values
        if email:
            attrs['email'] = email
        if username:
            attrs['username'] = username
        
        return attrs

    def create(self, validated_data):
        validated_data.pop('confirm_password')
        try:
            user = User.objects.create_user(**validated_data)
            return user
        except Exception as e:
            # Handle database-level unique constraint violations
            error_msg = str(e)
            if 'username' in error_msg.lower() or 'unique constraint' in error_msg.lower():
                if 'username' in error_msg.lower():
                    raise serializers.ValidationError({'username': ['A user with this username already exists.']})
            if 'email' in error_msg.lower():
                raise serializers.ValidationError({'email': ['A user with this email already exists.']})
            raise

class UserLoginSerializer(serializers.Serializer):
    email = serializers.CharField()  # Changed to CharField to accept both email and username
    password = serializers.CharField()

    def validate(self, attrs):
        email_or_username = attrs.get('email')
        password = attrs.get('password')

        if email_or_username and password:
            user = None
            
            # First, try to authenticate using the input as username
            user = authenticate(username=email_or_username, password=password)
            
            # If that fails, try to find user by email and authenticate with their username
            if not user:
                try:
                    # Check if input looks like an email (contains @)
                    if '@' in email_or_username:
                        user_obj = User.objects.filter(email__iexact=email_or_username).first()
                    else:
                        # Try to find by username (case-insensitive)
                        user_obj = User.objects.filter(username__iexact=email_or_username).first()
                    
                    if user_obj:
                        user = authenticate(username=user_obj.username, password=password)
                except User.DoesNotExist:
                    pass
                except Exception as e:
                    # Log the error for debugging
                    import logging
                    logger = logging.getLogger(__name__)
                    logger.error(f'Authentication error: {str(e)}')
            
            if not user:
                raise serializers.ValidationError('Invalid credentials')
            if not user.is_active:
                raise serializers.ValidationError('User account is disabled')
            attrs['user'] = user
            return attrs
        else:
            raise serializers.ValidationError('Must include email/username and password')

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ('id', 'email', 'username', 'first_name', 'last_name', 'date_joined')
        read_only_fields = ('id', 'date_joined')

@api_view(['POST'])
@permission_classes([AllowAny])
def register(request):
    """User registration endpoint"""
    try:
        serializer = UserRegistrationSerializer(data=request.data)
        if serializer.is_valid():
            try:
                user = serializer.save()
                token, created = Token.objects.get_or_create(user=user)
                return Response({
                    'user': UserSerializer(user).data,
                    'token': token.key,
                    'message': 'User created successfully'
                }, status=status.HTTP_201_CREATED)
            except serializers.ValidationError as ve:
                # Re-raise validation errors from create method
                return Response(ve.detail, status=status.HTTP_400_BAD_REQUEST)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    except serializers.ValidationError as ve:
        # Handle validation errors
        return Response(ve.detail, status=status.HTTP_400_BAD_REQUEST)
    except Exception as e:
        import logging
        logger = logging.getLogger(__name__)
        logger.error(f'Registration error: {str(e)}')
        # Check if it's a unique constraint violation
        error_msg = str(e)
        if 'username' in error_msg.lower() and ('unique' in error_msg.lower() or 'duplicate' in error_msg.lower()):
            return Response(
                {'username': ['A user with this username already exists.']},
                status=status.HTTP_400_BAD_REQUEST
            )
        if 'email' in error_msg.lower() and ('unique' in error_msg.lower() or 'duplicate' in error_msg.lower()):
            return Response(
                {'email': ['A user with this email already exists.']},
                status=status.HTTP_400_BAD_REQUEST
            )
        return Response(
            {'error': f'Registration failed: {str(e)}'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

@api_view(['POST'])
@permission_classes([AllowAny])
def login_view(request):
    """User login endpoint"""
    serializer = UserLoginSerializer(data=request.data)
    if serializer.is_valid():
        user = serializer.validated_data['user']
        token, created = Token.objects.get_or_create(user=user)
        login(request, user)
        return Response({
            'user': UserSerializer(user).data,
            'token': token.key,
            'message': 'Login successful'
        }, status=status.HTTP_200_OK)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def logout_view(request):
    """User logout endpoint"""
    try:
        request.user.auth_token.delete()
    except:
        pass
    logout(request)
    return Response({'message': 'Logout successful'}, status=status.HTTP_200_OK)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def user_profile(request):
    """Get current user profile"""
    serializer = UserSerializer(request.user)
    return Response(serializer.data)


