from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import PlayerViewSet
from .auth_views import register, login_view, logout_view, user_profile
from .admin_views import check_admin, upload_player_stats, upload_team_standings, upload_league_stats
from .shortlist_views import get_shortlist, add_to_shortlist, remove_from_shortlist, toggle_shortlist, clear_shortlist

router = DefaultRouter()
router.register(r'players', PlayerViewSet)

urlpatterns = [
    path('', include(router.urls)),
    path('auth/register/', register, name='register'),
    path('auth/login/', login_view, name='login'),
    path('auth/logout/', logout_view, name='logout'),
    path('auth/profile/', user_profile, name='user_profile'),
    path('admin/check/', check_admin, name='check_admin'),
    path('admin/upload/player-stats/', upload_player_stats, name='upload_player_stats'),
    path('admin/upload/team-standings/', upload_team_standings, name='upload_team_standings'),
    path('admin/upload/league-stats/', upload_league_stats, name='upload_league_stats'),
    # Shortlist endpoints
    path('shortlist/', get_shortlist, name='get_shortlist'),
    path('shortlist/add/', add_to_shortlist, name='add_to_shortlist'),
    path('shortlist/remove/', remove_from_shortlist, name='remove_from_shortlist'),
    path('shortlist/toggle/', toggle_shortlist, name='toggle_shortlist'),
    path('shortlist/clear/', clear_shortlist, name='clear_shortlist'),
] 