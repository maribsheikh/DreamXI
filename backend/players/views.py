from rest_framework import viewsets, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from django.db.models import Q
from .models import Player
from .serializers import PlayerSerializer, PlayerSearchSerializer
from django.db.models import F
import math

class PlayerViewSet(viewsets.ModelViewSet):
    queryset = Player.objects.all()
    serializer_class = PlayerSerializer
    filter_backends = [filters.SearchFilter]
    search_fields = ['name', 'squad', 'position', 'competition']

    @action(detail=False, methods=['get'])
    def search(self, request):
        """Search players by name, team, or position with improved alphabetical matching"""
        query = request.query_params.get('q', '').strip()
        if len(query) < 1:
            return Response([])
        
        # First priority: Players whose names start with the query
        name_starts_with = Player.objects.filter(
            name__istartswith=query
        ).order_by('name')[:5]
        
        # Second priority: Players whose names contain the query (but don't start with it)
        name_contains = Player.objects.filter(
            name__icontains=query
        ).exclude(
            name__istartswith=query
        ).order_by('name')[:3]
        
        # Third priority: Players whose team names start with the query
        team_starts_with = Player.objects.filter(
            squad__istartswith=query
        ).exclude(
            Q(name__istartswith=query) | Q(name__icontains=query)
        ).order_by('squad', 'name')[:2]
        
        # Combine results maintaining priority order
        combined_results = list(name_starts_with) + list(name_contains) + list(team_starts_with)
        
        # Remove duplicates while preserving order
        seen_ids = set()
        unique_results = []
        for player in combined_results:
            if player.id not in seen_ids:
                unique_results.append(player)
                seen_ids.add(player.id)
        
        # Limit to 10 results for suggestions
        final_results = unique_results[:10]
        
        serializer = PlayerSearchSerializer(final_results, many=True)
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

    @action(detail=False, methods=['post'])
    def compare(self, request):
        """Compare two players for a specific position using ML-based scoring"""
        player1_id = request.data.get('player1_id')
        player2_id = request.data.get('player2_id')
        position = request.data.get('position')
        
        if not all([player1_id, player2_id, position]):
            return Response({'error': 'Missing required parameters'}, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            player1 = Player.objects.get(id=player1_id)
            player2 = Player.objects.get(id=player2_id)
        except Player.DoesNotExist:
            return Response({'error': 'Player not found'}, status=status.HTTP_404_NOT_FOUND)
        
        # Position-specific scoring weights
        position_weights = self._get_position_weights(position)
        
        # Calculate scores for both players
        score1, breakdown1 = self._calculate_position_score(player1, position_weights)
        score2, breakdown2 = self._calculate_position_score(player2, position_weights)
        
        # Determine winner
        if abs(score1 - score2) < 0.5:
            winner = 'tie'
        elif score1 > score2:
            winner = 'player1'
        else:
            winner = 'player2'
        
        # Create detailed breakdown
        detailed_breakdown = {}
        for metric, weight in position_weights.items():
            if metric in breakdown1 and metric in breakdown2:
                detailed_breakdown[metric] = {
                    'player1': breakdown1[metric],
                    'player2': breakdown2[metric],
                    'weight': weight
                }
        
        return Response({
            'player1': PlayerSerializer(player1).data,
            'player2': PlayerSerializer(player2).data,
            'position': position,
            'scores': {
                'player1': score1,
                'player2': score2,
                'winner': winner,
                'breakdown': detailed_breakdown
            }
        })
    
    def _get_position_weights(self, position):
        """Get position-specific weights for different metrics"""
        position_lower = position.lower()
        
        if 'goalkeeper' in position_lower:
            return {
                'saves_per90': 0.25,
                'clean_sheets': 0.20,
                'goals_conceded_per90': 0.15,
                'pass_accuracy': 0.15,
                'distribution_accuracy': 0.10,
                'aerial_duels_won': 0.10,
                'penalty_saves': 0.05
            }
        elif 'defender' in position_lower or 'back' in position_lower:
            return {
                'tackles_per90': 0.20,
                'interceptions_per90': 0.20,
                'clearances_per90': 0.15,
                'aerial_duels_won': 0.15,
                'pass_accuracy': 0.10,
                'progressive_passes': 0.10,
                'blocks_per90': 0.10
            }
        elif 'midfielder' in position_lower:
            return {
                'pass_accuracy': 0.20,
                'key_passes_per90': 0.15,
                'progressive_passes': 0.15,
                'tackles_per90': 0.10,
                'interceptions_per90': 0.10,
                'dribbles_completed': 0.10,
                'long_balls_completed': 0.10,
                'ball_recoveries': 0.10
            }
        elif 'forward' in position_lower or 'striker' in position_lower or 'wing' in position_lower:
            return {
                'goals_per90': 0.25,
                'expected_goals_per90': 0.20,
                'shots_on_target_per90': 0.15,
                'assists_per90': 0.15,
                'key_passes_per90': 0.10,
                'dribbles_completed': 0.10,
                'aerial_duels_won': 0.05
            }
        else:
            # Default weights for unknown positions
            return {
                'goals_per90': 0.15,
                'assists_per90': 0.15,
                'pass_accuracy': 0.15,
                'tackles_per90': 0.10,
                'interceptions_per90': 0.10,
                'key_passes_per90': 0.10,
                'dribbles_completed': 0.10,
                'aerial_duels_won': 0.10,
                'progressive_passes': 0.05
            }
    
    def _calculate_position_score(self, player, weights):
        """Calculate position-specific score for a player"""
        score = 0
        breakdown = {}
        
        # Normalize and score each metric
        for metric, weight in weights.items():
            try:
                if metric == 'saves_per90':
                    value = getattr(player, 'saves', 0) / max(player.minutes_played / 90, 1)
                elif metric == 'clean_sheets':
                    value = getattr(player, 'clean_sheets', 0)
                elif metric == 'goals_conceded_per90':
                    value = getattr(player, 'goals_conceded', 0) / max(player.minutes_played / 90, 1)
                elif metric == 'distribution_accuracy':
                    value = getattr(player, 'pass_accuracy', 0)
                elif metric == 'aerial_duels_won':
                    value = getattr(player, 'aerial_duels_won', 0)
                elif metric == 'penalty_saves':
                    value = getattr(player, 'penalty_saves', 0)
                elif metric == 'tackles_per90':
                    value = getattr(player, 'tackles', 0) / max(player.minutes_played / 90, 1)
                elif metric == 'interceptions_per90':
                    value = getattr(player, 'interceptions', 0) / max(player.minutes_played / 90, 1)
                elif metric == 'clearances_per90':
                    value = getattr(player, 'clearances', 0) / max(player.minutes_played / 90, 1)
                elif metric == 'blocks_per90':
                    value = getattr(player, 'blocks', 0) / max(player.minutes_played / 90, 1)
                elif metric == 'pass_accuracy':
                    value = getattr(player, 'pass_accuracy', 0)
                elif metric == 'progressive_passes':
                    value = getattr(player, 'progressive_passes', 0)
                elif metric == 'key_passes_per90':
                    value = getattr(player, 'key_passes', 0) / max(player.minutes_played / 90, 1)
                elif metric == 'dribbles_completed':
                    value = getattr(player, 'dribbles_completed', 0)
                elif metric == 'long_balls_completed':
                    value = getattr(player, 'long_balls_completed', 0)
                elif metric == 'ball_recoveries':
                    value = getattr(player, 'ball_recoveries', 0)
                elif metric == 'goals_per90':
                    value = player.goals_per90
                elif metric == 'expected_goals_per90':
                    value = getattr(player, 'expected_goals_per90', 0)
                elif metric == 'shots_on_target_per90':
                    value = getattr(player, 'shots_on_target', 0) / max(player.minutes_played / 90, 1)
                elif metric == 'assists_per90':
                    value = player.assists_per90
                else:
                    value = 0
                
                # Normalize value (0-100 scale)
                normalized_value = min(100, max(0, value * 10))  # Simple normalization
                breakdown[metric] = normalized_value
                score += normalized_value * weight
                
            except (AttributeError, ZeroDivisionError):
                breakdown[metric] = 0
        
        return score, breakdown 