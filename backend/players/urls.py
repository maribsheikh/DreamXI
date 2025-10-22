from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import PlayerViewSet
from .auth_views import register, login_view, logout_view, user_profile

router = DefaultRouter()
router.register(r'players', PlayerViewSet)

urlpatterns = [
    path('', include(router.urls)),
    path('auth/register/', register, name='register'),
    path('auth/login/', login_view, name='login'),
    path('auth/logout/', logout_view, name='logout'),
    path('auth/profile/', user_profile, name='user_profile'),
] 