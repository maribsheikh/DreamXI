from rest_framework import viewsets, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from django.db.models import Q
from .models import Player
from .serializers import PlayerSerializer, PlayerSearchSerializer
from django.db.models import F

class PlayerViewSet(viewsets.ModelViewSet):
    queryset = Player.objects.all()
    serializer_class = PlayerSerializer
    filter_backends = [filters.SearchFilter]
    search_fields = ['name', 'squad', 'position', 'competition']

    @action(detail=False, methods=['get'])
    def search(self, request):
        """Search players by name, team, or position"""
        query = request.query_params.get('q', '')
        if len(query) < 2:
            return Response([])
        
        # Improved search with better relevance
        players = Player.objects.filter(
            Q(name__icontains=query) |  # Match name
            Q(squad__icontains=query) |  # Match team name
            Q(position__icontains=query) |  # Match position
            Q(nation__icontains=query)  # Match nationality
        ).order_by(
            '-matches_played',  # Prioritize players with more matches
            '-goals_per90',  # Then by goals per 90
            'name'  # Then alphabetically
        )[:10]  # Limit to 10 results for suggestions
        
        serializer = PlayerSearchSerializer(players, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=['get'])
    def stats(self, request, pk=None):
        player = self.get_object()
        return Response({
            'current_season': {
                'goals': player.goals,
                'assists': player.assists,
                'matches_played': player.matches_played,
                'minutes_played': player.minutes_played,
                'shots_on_target': player.shots_on_target,
                'pass_accuracy': player.pass_accuracy,
                'tackles': player.tackles,
                'interceptions': player.interceptions,
            },
            'performance_history': player.performance_history
        })

    @action(detail=False, methods=['get'])
    def league_stats(self, request):
        """Get top players stats for each league"""
        leagues = Player.objects.exclude(competition__isnull=True).exclude(competition='').values_list('competition', flat=True).distinct()
        
        response = {}
        for league in leagues:
            league_players = Player.objects.filter(competition=league)
            
            # Get top scorers
            top_scorers = league_players.order_by('-goals_per90')[:5]
            top_scorers_data = [{
                'name': p.name,
                'squad': p.squad,
                'goals': p.goals,
                'goals_per90': p.goals_per90,
                'expected_goals': p.expected_goals,
                'expected_goals_per90': p.expected_goals_per90
            } for p in top_scorers]
            
            # Get top assisters
            top_assisters = league_players.order_by('-assists_per90')[:5]
            top_assisters_data = [{
                'name': p.name,
                'squad': p.squad,
                'assists': p.assists,
                'assists_per90': p.assists_per90,
                'expected_assists': p.expected_assists,
                'expected_assists_per90': p.expected_assists_per90
            } for p in top_assisters]
            
            response[league] = {
                'top_scorers': top_scorers_data,
                'top_assisters': top_assisters_data
            }
            
        return Response(response)

    def retrieve(self, request, *args, **kwargs):
        instance = self.get_object()
        serializer = self.get_serializer(instance)
        data = serializer.data

        # Add league context
        league_stats = Player.objects.filter(competition=instance.competition)\
            .order_by('-goals')[:10]\
            .values('name', 'squad', 'goals', 'assists')
        
        data['league_context'] = {
            'league_name': instance.competition,
            'top_players': list(league_stats)
        }

        return Response(data) 