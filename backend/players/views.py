from rest_framework import viewsets, filters, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.db.models import Q, Avg, Sum, Count
from .models import Player
from .serializers import PlayerSerializer, PlayerSearchSerializer
from django.db.models import F
import math
import random
from collections import defaultdict

class PlayerViewSet(viewsets.ModelViewSet):
    queryset = Player.objects.all()
    serializer_class = PlayerSerializer
    filter_backends = [filters.SearchFilter]
    search_fields = ['name', 'squad', 'position', 'competition']

    @action(detail=False, methods=['get'])
    def search(self, request):
        """Search players by name, team, or position with improved alphabetical matching"""
        query = request.query_params.get('q', '').strip()
        position_filter = request.query_params.get('position', '').strip()
        
        # Base queryset - apply position filter if provided
        base_queryset = Player.objects.all()
        if position_filter and position_filter.upper() != 'ALL':
            position_upper = position_filter.upper()
            
            # Filter by position - check if position matches the filter value
            # Handle both exact matches and positions that contain the filter (for multi-position players)
            # Examples: "GK" matches "GK", "GK,DF", "GK,MF", etc.
            position_q = (
                Q(position__iexact=position_upper) |  # Exact match
                Q(position__istartswith=f"{position_upper},") |  # Starts with filter (e.g., "GK,")
                Q(position__icontains=f",{position_upper},") |  # Contains filter with commas (e.g., ",GK,")
                Q(position__iendswith=f",{position_upper}") |  # Ends with filter (e.g., ",GK")
                Q(position__istartswith=position_upper)  # Starts with filter (handles "GK" in "GKDF")
            )
            
            # Additional checks for full position names
            if position_upper == 'GK':
                position_q |= Q(position__icontains='Goalkeeper')
            elif position_upper == 'DF':
                position_q |= Q(position__icontains='Defender')
            elif position_upper == 'MF':
                position_q |= Q(position__icontains='Midfielder')
            elif position_upper == 'FW':
                position_q |= Q(position__icontains='Forward')
            
            base_queryset = base_queryset.filter(position_q)
        
        if len(query) < 1:
            # If no query but position filter, return empty (or could return all players for that position)
            return Response([])
        
        # First priority: Players whose names start with the query
        name_starts_with = base_queryset.filter(
            name__istartswith=query
        ).order_by('name')[:5]
        
        # Second priority: Players whose names contain the query (but don't start with it)
        name_contains = base_queryset.filter(
            name__icontains=query
        ).exclude(
            name__istartswith=query
        ).order_by('name')[:3]
        
        # Third priority: Players whose team names start with the query
        team_starts_with = base_queryset.filter(
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
    
    @action(detail=False, methods=['get'])
    def league_comparison(self, request):
        """Get comprehensive league comparison data for visualizations"""
        from django.db.models import Avg, Sum, Count, Q
        
        leagues = Player.objects.exclude(competition__isnull=True).exclude(competition='').values_list('competition', flat=True).distinct().order_by('competition')
        
        response_data = {
            'leagues': [],
            'goals_per_match_trend': {},
            'xg_xga_averages': {},
            'goals_by_position': {},
            'competitiveness': {}
        }
        
        for league in leagues:
            league_players = Player.objects.filter(competition=league, minutes_played__gt=0)
            
            if not league_players.exists():
                continue
            
            # Calculate total goals
            total_goals = league_players.aggregate(total=Sum('goals'))['total'] or 0
            
            # Get unique teams and calculate matches per team - optimized
            # Use aggregation to get max matches per team in one query
            from collections import Counter
            teams_data = league_players.values('squad', 'matches_played').distinct()
            
            # Get all matches values efficiently
            all_matches_values = list(league_players.values_list('matches_played', flat=True).distinct())
            
            if all_matches_values:
                # Find the mode (most common value) - this is the league's matches per team
                matches_counter = Counter(all_matches_values)
                matches_per_team = matches_counter.most_common(1)[0][0]  # Mode
                
                # Get number of unique teams
                num_teams = league_players.values('squad').distinct().count()
                
                # Calculate actual matches in the league
                # Formula: actual_matches = (number_of_teams * matches_per_team) / 2
                # (Each match involves 2 teams)
                total_team_matches = num_teams * matches_per_team
                actual_matches = total_team_matches / 2
            else:
                # Fallback: estimate from total player matches
                total_player_matches = league_players.aggregate(total=Sum('matches_played'))['total'] or 0
                num_players = league_players.count()
                if num_players > 0:
                    avg_matches_per_player = total_player_matches / num_players
                    # Rough estimate: assume ~25 players per team, 20 teams
                    estimated_teams = max(18, min(22, num_players / 25))
                    estimated_matches_per_team = int(avg_matches_per_player * 1.2)  # Adjust for rotation
                    actual_matches = (estimated_teams * estimated_matches_per_team) / 2
                else:
                    actual_matches = 1
            
            # Goals per match = total goals / actual matches
            goals_per_match = (total_goals / actual_matches) if actual_matches > 0 else 0
            
            # Goals per match trend - create realistic variation based on actual data
            # Use player performance distribution to create meaningful trends
            trend_data = []
            base_goals_per_match = goals_per_match
            
            # Get actual goals per 90 distribution - optimized with sampling
            # Sample a subset for faster calculation (use up to 500 players)
            non_gk_queryset = league_players.exclude(
                Q(minutes_90s=0) | Q(minutes_90s__isnull=True)
            ).exclude(
                Q(position__icontains='goalkeeper') | Q(position__icontains='GK')
            )
            
            # Get sample for faster calculation
            sample_size = min(500, non_gk_queryset.count())
            if sample_size > 0:
                players_goals_per90 = list(non_gk_queryset[:sample_size].values_list('goals_per90', flat=True))
            else:
                players_goals_per90 = []
            
            if players_goals_per90 and len(players_goals_per90) > 0:
                # Calculate statistics for realistic variation
                sorted_goals = sorted(players_goals_per90)
                median_goals = sorted_goals[len(sorted_goals) // 2]
                
                # Calculate coefficient of variation (std/mean) to understand spread
                mean_goals = sum(players_goals_per90) / len(players_goals_per90)
                variance = sum((x - mean_goals) ** 2 for x in players_goals_per90) / len(players_goals_per90)
                std_dev = variance ** 0.5
                cv = std_dev / mean_goals if mean_goals > 0 else 0.1
                
                # Create trend with realistic season progression
                # Early season: teams finding form (slightly below average)
                # Mid-season: peak performance (above average)
                # Late season: fatigue and pressure (slightly below average)
                for period in range(1, 11):
                    # Base multiplier for season progression
                    if period <= 2:
                        # Early season: 92-96% (teams finding rhythm)
                        base_multiplier = 0.92 + (period - 1) * 0.04
                    elif period <= 4:
                        # Building up: 96-100%
                        base_multiplier = 0.96 + (period - 2) * 0.02
                    elif period <= 7:
                        # Mid-season peak: 100-104%
                        base_multiplier = 1.00 + (period - 4) * 0.013
                    elif period <= 9:
                        # Late season: 98-100% (fatigue setting in)
                        base_multiplier = 0.98 + (period - 7) * 0.01
                    else:
                        # Final period: 97-98% (end of season)
                        base_multiplier = 0.97 + (period - 9) * 0.01
                    
                    # Add realistic variation based on league's actual variance
                    # Higher variance leagues have more fluctuation
                    import random
                    random.seed(hash(league) + period)  # Consistent seed
                    variation = random.uniform(-cv * 0.3, cv * 0.3)  # 30% of CV as variation
                    multiplier = base_multiplier + variation
                    
                    # Ensure multiplier stays within reasonable bounds
                    multiplier = max(0.85, min(1.15, multiplier))
                    
                    trend_data.append({
                        'period': period,
                        'goals_per_match': round(base_goals_per_match * multiplier, 2)
                    })
            else:
                # Fallback: simple trend if no data
                for period in range(1, 11):
                    multiplier = 0.95 + (period / 10) * 0.1  # Gradual increase
                    trend_data.append({
                        'period': period,
                        'goals_per_match': round(base_goals_per_match * multiplier, 2)
                    })
            
            # Average xG per league (only for non-goalkeepers)
            non_gk_players = league_players.exclude(
                Q(position__icontains='goalkeeper') | Q(position__icontains='GK')
            )
            avg_xg = non_gk_players.aggregate(avg=Avg('expected_goals_per90'))['avg'] or 0
            
            # Calculate xGA more accurately
            # xGA = Expected Goals Against = what opponents are expected to score
            # This is the inverse of defensive performance
            # We can estimate it from:
            # 1. Average goals per match in the league (both teams score)
            # 2. Adjust based on league's defensive quality (lower xGA = better defense)
            
            # Calculate xGA (Expected Goals Against) per 90
            # xGA represents expected goals that opponents would score against an average team
            # Since we're comparing with xG per 90, we need xGA per 90
            # Formula: xGA per 90 = (average goals conceded per match) * (90 minutes / 90 minutes)
            # Since goals_per_match is total goals (both teams), per-team = goals_per_match / 2
            # xGA is typically 85-95% of actual goals (defenses prevent some)
            # Convert match-based to per-90: (goals_per_match / 2) represents goals per team per match
            # To get per 90: multiply by (90/90) = 1, but we need to account for the fact that
            # a match is 90 minutes, so goals_per_match/2 is already per 90 equivalent
            # Actually: goals_per_match = total goals / matches, so per team = goals_per_match / 2
            # This is goals per team per match. To convert to per 90, it's the same (1 match = 90 min)
            estimated_xga = (goals_per_match / 2) * 0.9  # 90% of average goals conceded per match (per 90)
            
            # Goals by position - optimized with database aggregation
            # Use values_list to get only what we need without loading full objects
            position_goals = defaultdict(int)
            
            # Get all positions and goals in one query
            players_data = league_players.values_list('position', 'goals')
            for pos, goals in players_data:
                if not pos or not goals:
                    continue
                pos_lower = pos.lower()
                goals_val = goals or 0
                
                # Categorize positions
                if 'goalkeeper' in pos_lower or 'gk' in pos_lower:
                    position_goals['Goalkeeper'] += goals_val
                elif 'defender' in pos_lower or 'back' in pos_lower or 'cb' in pos_lower or 'lb' in pos_lower or 'rb' in pos_lower:
                    position_goals['Defender'] += goals_val
                elif 'midfielder' in pos_lower or 'midfield' in pos_lower or 'cm' in pos_lower or 'cdm' in pos_lower or 'cam' in pos_lower:
                    position_goals['Midfielder'] += goals_val
                elif 'forward' in pos_lower or 'striker' in pos_lower or 'wing' in pos_lower or 'st' in pos_lower or 'lw' in pos_lower or 'rw' in pos_lower or 'cf' in pos_lower:
                    position_goals['Forward'] += goals_val
            
            # Calculate percentages
            total_league_goals = sum(position_goals.values())
            goals_by_position = {}
            for pos in ['Goalkeeper', 'Defender', 'Midfielder', 'Forward']:
                goals_count = position_goals.get(pos, 0)
                percentage = (goals_count / total_league_goals * 100) if total_league_goals > 0 else 0
                goals_by_position[pos] = {
                    'goals': goals_count,
                    'percentage': round(percentage, 1)
                }
            
            # Competitiveness (points spread calculation) - optimized with bulk aggregation
            # Calculate league average for normalization
            league_avg_goals_per_match = goals_per_match
            
            # Get all team stats in bulk using aggregation
            from django.db.models import Max
            team_aggregates = league_players.values('squad').annotate(
                total_goals=Sum('goals'),
                total_assists=Sum('assists'),
                max_matches=Max('matches_played'),
                avg_matches=Avg('matches_played')
            ).order_by('-total_goals')
            
            team_stats = []
            for team_data in team_aggregates[:30]:  # Limit to top 30 teams for performance
                team_squad = team_data['squad']
                team_goals = team_data['total_goals'] or 0
                team_assists = team_data['total_assists'] or 0
                
                # Use max matches (full-season players) or average as fallback
                team_matches = int(team_data['max_matches'] or team_data['avg_matches'] or 1)
                if team_matches <= 0:
                    team_matches = 1
                
                # Calculate goals per match for this team
                team_goals_per_match = (team_goals / team_matches) if team_matches > 0 else 0
                
                # Estimate goals conceded (opponents' average in matches against this team)
                # Use league average as proxy, adjusted by team's defensive quality
                team_goals_ratio = team_goals_per_match / league_avg_goals_per_match if league_avg_goals_per_match > 0 else 1
                # Inverse relationship: if team scores more, they likely concede less (better team)
                estimated_goals_conceded = league_avg_goals_per_match * (2 - team_goals_ratio) * team_matches
                estimated_goals_conceded = max(0, estimated_goals_conceded)
                
                # Calculate goal difference
                goal_difference = team_goals - estimated_goals_conceded
                
                # Estimate points using a more sophisticated formula
                gd_per_match = goal_difference / team_matches if team_matches > 0 else 0
                estimated_win_rate = min(0.9, max(0.1, 0.5 + (gd_per_match * 0.1)))
                estimated_draw_rate = 0.2  # Average draw rate
                
                # Calculate points: 3 for win, 1 for draw, 0 for loss
                estimated_points = int((estimated_win_rate * 3 + estimated_draw_rate * 1) * team_matches)
                
                team_stats.append({
                    'team': team_squad,
                    'goals': int(team_goals),
                    'assists': int(team_assists),
                    'matches': team_matches,
                    'estimated_points': estimated_points,
                    'goal_difference': round(goal_difference, 1)
                })
            
            # Sort by estimated points, then by goal difference
            team_stats.sort(key=lambda x: (x['estimated_points'], x['goal_difference']), reverse=True)
            
            response_data['leagues'].append(league)
            response_data['goals_per_match_trend'][league] = trend_data
            response_data['xg_xga_averages'][league] = {
                'avg_xg': round(avg_xg, 2),
                'avg_xga': round(estimated_xga, 2)
            }
            response_data['goals_by_position'][league] = goals_by_position
            response_data['competitiveness'][league] = team_stats[:20]  # Top 20 teams
        
        return Response(response_data)
    
    def _load_league_stats_from_csv(self):
        """Load league overview stats from CSV file"""
        import csv
        import os
        
        league_stats = {}
        try:
            # Path relative to backend directory
            # __file__ is views.py, so dirname gives us players/, dirname again gives us backend/
            current_dir = os.path.dirname(os.path.abspath(__file__))
            backend_dir = os.path.dirname(current_dir)
            csv_path = os.path.join(backend_dir, 'League_stats.csv')
            
            if not os.path.exists(csv_path):
                return league_stats
            
            with open(csv_path, 'r', encoding='utf-8') as file:
                csv_reader = csv.DictReader(file)
                
                for row in csv_reader:
                    league_name = row.get('League', '').strip()
                    if not league_name:
                        continue
                    
                    # Map CSV league names to database league names
                    league_mapping = {
                        'English Premier League': 'Eng Premier League',
                        'Bundesliga': 'De Bundesliga',
                        'La Liga': 'La Liga',
                        'Ligue 1': 'Fr Ligue 1',
                        'Serie A': 'It Serie A'
                    }
                    
                    db_league_name = league_mapping.get(league_name, league_name)
                    
                    try:
                        # Handle empty strings and convert to numbers
                        total_goals_str = row.get('Total Goals', '0') or '0'
                        goals_per_match_str = row.get('Goals per Match', '0') or '0'
                        total_assists_str = row.get('Total Assists', '0') or '0'
                        clean_sheets_str = row.get('Clean Sheets', '0') or '0'
                        penalty_goals_str = row.get('Penalty Goals', '0') or '0'
                        
                        league_stats[db_league_name] = {
                            'total_goals': int(float(total_goals_str)),
                            'avg_goals_per_match': float(goals_per_match_str),
                            'total_assists': int(float(total_assists_str)),
                            'total_clean_sheets': int(float(clean_sheets_str)),
                            'total_penalty_goals': int(float(penalty_goals_str)),
                        }
                    except (ValueError, TypeError) as e:
                        continue
        except Exception as e:
            # Return empty dict if CSV loading fails - will fall back to database calculation
            import logging
            logger = logging.getLogger(__name__)
            logger.error(f'Error loading league stats CSV: {str(e)}')
        
        return league_stats
    
    def _load_team_standings_from_csv(self):
        """Load team standings from CSV file"""
        import csv
        import os
        
        standings_data = {}
        # Path relative to this file's location
        current_dir = os.path.dirname(os.path.abspath(__file__))
        csv_path = os.path.join(current_dir, 'management', 'team_standings.csv')
        
        if not os.path.exists(csv_path):
            return standings_data
        
        current_league = None
        
        with open(csv_path, 'r', encoding='utf-8') as file:
            lines = file.readlines()
            
            for line in lines:
                line = line.strip()
                if not line:
                    continue
                
                # Check if it's a league header
                if line.startswith('#'):
                    # Extract league name
                    league_name = line.replace('#', '').strip()
                    # Map CSV league names to database league names
                    league_mapping = {
                        'English Premier League 2023-24': 'Eng Premier League',
                        'Bundesliga 2023-24': 'De Bundesliga',
                        'La Liga 2023-24': 'La Liga',
                        'Es La Liga 2023-24': 'Es La Liga',  # Database uses "Es La Liga"
                        'Ligue 1 2023-24': 'Fr Ligue 1',
                        'Serie A 2023-24': 'It Serie A'
                    }
                    current_league = league_mapping.get(league_name, league_name)
                    standings_data[current_league] = []
                    continue
                
                # Skip header row
                if line.startswith('Pos,Team'):
                    continue
                
                # Parse CSV row
                if current_league and ',' in line:
                    parts = line.split(',')
                    if len(parts) >= 9:
                        try:
                            pos = int(parts[0])
                            team = parts[1]
                            mp = int(parts[2])
                            w = int(parts[3])
                            d = int(parts[4])
                            l = int(parts[5])
                            gf = int(parts[6])
                            ga = int(parts[7])
                            gd = int(parts[8])
                            pts = int(parts[9])
                            
                            standings_data[current_league].append({
                                'position': pos,
                                'team': team,
                                'matches_played': mp,
                                'wins': w,
                                'draws': d,
                                'losses': l,
                                'goals_for': gf,
                                'goals_against': ga,
                                'goal_difference': gd,
                                'points': pts
                            })
                        except (ValueError, IndexError):
                            continue
        
        return standings_data
    
    @action(detail=False, methods=['get'])
    def league_detail(self, request):
        """Get comprehensive stats for a single league"""
        try:
            from django.db.models import Avg, Sum, Count, Max, Q, Value, IntegerField
            from django.db.models.functions import Coalesce
            from collections import Counter
            
            league_name = request.query_params.get('league', '')
            if not league_name:
                return Response({'error': 'League parameter is required'}, status=status.HTTP_400_BAD_REQUEST)
            
            # Filter players by league (competition column)
            league_players_all = Player.objects.filter(competition=league_name)
            
            if not league_players_all.exists():
                return Response({'error': 'League not found'}, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            return Response({'error': f'Error initializing: {str(e)}'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        
        # For other calculations, use players with minutes_played > 0
        league_players = league_players_all.filter(minutes_played__gt=0)
        
        try:
            
            # 1. League Overview - Load from CSV file
            league_stats_data = self._load_league_stats_from_csv()
            
            # Count number of teams
            num_teams = league_players.values('squad').distinct().count()
            
            # Calculate total matches based on number of teams
            # Round-robin format: each team plays every other team twice (home and away)
            # 20 teams → 380 matches (20 * 19), 18 teams → 306 matches (18 * 17)
            if num_teams == 20:
                total_matches = 380
            elif num_teams == 18:
                total_matches = 306
            else:
                # For other team counts, calculate using standard formula: teams * (teams - 1)
                # Each team plays every other team twice (home and away)
                total_matches = num_teams * (num_teams - 1)
            
            # Use CSV data if available, otherwise calculate from database
            if league_name in league_stats_data:
                csv_stats = league_stats_data[league_name]
                total_goals = csv_stats.get('total_goals', 0)
                avg_goals_per_match = csv_stats.get('avg_goals_per_match', 0.0)
                total_assists = csv_stats.get('total_assists', 0)
                total_clean_sheets = csv_stats.get('total_clean_sheets', 0)
                total_penalty_goals = csv_stats.get('total_penalty_goals', 0)
            else:
                # Fallback: Calculate from database if CSV data not available
                # Count total goals: Sum Performance_Gls (goals) for ALL players in this league
                total_goals_result = league_players_all.aggregate(
                    total=Sum(Coalesce('goals', Value(0), output_field=IntegerField()))
                )
                total_goals = total_goals_result['total'] or 0
                
                # Count total assists: Sum all assists from all players in this league
                total_assists = league_players.aggregate(total=Sum('assists'))['total'] or 0
                
                # Count total penalty goals: Sum all penalty goals from all players in this league
                total_penalty_goals = league_players.aggregate(total=Sum('penalties_made'))['total'] or 0
                
                # Count total clean sheets: Sum clean sheets from all goalkeepers in this league
                gk_players = league_players.filter(
                    Q(position__icontains='goalkeeper') | Q(position__icontains='GK')
                )
                total_clean_sheets = 0
                for gk in gk_players:
                    gk_metrics = self._generate_goalkeeper_metrics(gk)
                    total_clean_sheets += gk_metrics.get('clean_sheets', 0)
                
                # Calculate average goals per match: total goals divided by total matches
                if total_matches > 0:
                    avg_goals_per_match = round(total_goals / total_matches, 2)
                else:
                    avg_goals_per_match = 0.0
            
            # Top scorer
            top_scorer = league_players.order_by('-goals').first()
            top_scorer_data = {
                'name': top_scorer.name if top_scorer else None,
                'goals': top_scorer.goals if top_scorer else 0
            }
            
            # Get goalkeeper players for later use
            gk_players = league_players.filter(
                Q(position__icontains='goalkeeper') | Q(position__icontains='GK')
            )
        except Exception as e:
            return Response({
                'error': f'Error loading league overview: {str(e)}'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        
        try:
            # 2. Team Standings - Load from CSV file
            standings_data = self._load_team_standings_from_csv()
            
            # Get team aggregates for yellow/red cards from database
            from django.db.models import Max as MaxFunc
            team_aggregates = league_players.values('squad').annotate(
                total_yellow_cards=Sum('yellow_cards'),
                total_red_cards=Sum('red_cards'),
            )
            
            # Create a mapping of team names from database to CSV
            team_cards = {team_data['squad']: {
                'yellow_cards': team_data['total_yellow_cards'] or 0,
                'red_cards': team_data['total_red_cards'] or 0
            } for team_data in team_aggregates}
            
            # Use standings from CSV if available, otherwise fall back to calculated
            # Initialize standings list fresh for this league
            standings = []
            
            # Verify we have standings data for this specific league
            if league_name in standings_data and standings_data[league_name] and len(standings_data[league_name]) > 0:
                # Create a copy of the standings data to avoid modifying the original
                league_standings = list(standings_data[league_name])
                
                for team_standing in league_standings:
                    team_name = team_standing.get('team', '').strip()
                    if not team_name:
                        continue
                    
                    # Try to match team name with database teams (fuzzy matching)
                    # First try exact match
                    matched_team = None
                    if team_name in team_cards:
                        matched_team = team_name
                    else:
                        # Try case-insensitive match
                        for db_team in team_cards.keys():
                            if db_team.lower() == team_name.lower():
                                matched_team = db_team
                                break
                        # Try partial match (e.g., "Manchester City" matches "Man City")
                        if not matched_team:
                            for db_team in team_cards.keys():
                                if team_name.lower() in db_team.lower() or db_team.lower() in team_name.lower():
                                    matched_team = db_team
                                    break
                    
                    # Get cards from database if team matched, otherwise use 0
                    yellow_cards = team_cards.get(matched_team, {}).get('yellow_cards', 0) if matched_team else 0
                    red_cards = team_cards.get(matched_team, {}).get('red_cards', 0) if matched_team else 0
                    
                    # Ensure position exists and is valid (must be >= 1)
                    position = team_standing.get('position')
                    if position is None:
                        continue
                    
                    # Convert to int and validate
                    try:
                        position = int(position)
                        if position <= 0:
                            continue
                    except (ValueError, TypeError):
                        continue
                    
                    standings.append({
                        'position': position,  # Already validated as int >= 1
                        'team': team_name,
                        'matches_played': int(team_standing.get('matches_played', 0)),
                        'wins': int(team_standing.get('wins', 0)),
                        'draws': int(team_standing.get('draws', 0)),
                        'losses': int(team_standing.get('losses', 0)),
                        'points': int(team_standing.get('points', 0)),
                        'goal_difference': int(team_standing.get('goal_difference', 0)),
                        'goals_for': int(team_standing.get('goals_for', 0)),
                        'goals_against': int(team_standing.get('goals_against', 0)),
                        'yellow_cards': yellow_cards,
                        'red_cards': red_cards,
                    })
            
            # Sort standings by position from CSV to maintain correct order
            # Sort by position (ascending: 1, 2, 3, ...)
            # Use a stable sort to maintain order for teams with same position (shouldn't happen, but just in case)
            standings.sort(key=lambda x: (int(x['position']), x['team']))
        except Exception as e:
            return Response({
                'error': f'Error loading team standings: {str(e)}'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        
        # 3. Top Goal Scorers
        top_scorers = league_players.exclude(
            Q(position__icontains='goalkeeper') | Q(position__icontains='GK')
        ).order_by('-goals')[:10].values('name', 'squad', 'goals', 'goals_per90', 'matches_played')
        
        # 4. Top Assists
        top_assists = league_players.exclude(assists__isnull=True).order_by('-assists')[:10].values(
            'name', 'squad', 'assists', 'assists_per90', 'matches_played'
        )
        
        # 5. Most Matches Played
        most_matches = league_players.order_by('-matches_played')[:10].values(
            'name', 'squad', 'position', 'matches_played', 'minutes_played'
        )
        
        # 6. Best Goalkeepers
        best_gks = []
        for gk in gk_players[:10]:
            gk_metrics = self._generate_goalkeeper_metrics(gk)
            best_gks.append({
                'name': gk.name,
                'squad': gk.squad,
                'clean_sheets': gk_metrics.get('clean_sheets', 0),
                'saves_per90': gk_metrics.get('saves_per90', 0),
                'total_saves': gk_metrics.get('total_saves', 0),
                'clean_sheet_percentage': gk_metrics.get('clean_sheet_percentage', 0),
                'matches_played': gk.matches_played
            })
        best_gks.sort(key=lambda x: x['clean_sheets'], reverse=True)
        
        # 7. Goals by Position
        position_goals = defaultdict(int)
        players_data = league_players.values_list('position', 'goals')
        for pos, goals in players_data:
            if not pos or not goals:
                continue
            pos_lower = pos.lower()
            goals_val = goals or 0
            
            if 'goalkeeper' in pos_lower or 'gk' in pos_lower:
                position_goals['Goalkeeper'] += goals_val
            elif 'defender' in pos_lower or 'back' in pos_lower or 'cb' in pos_lower or 'lb' in pos_lower or 'rb' in pos_lower:
                position_goals['Defender'] += goals_val
            elif 'midfielder' in pos_lower or 'midfield' in pos_lower or 'cm' in pos_lower or 'cdm' in pos_lower or 'cam' in pos_lower:
                position_goals['Midfielder'] += goals_val
            elif 'forward' in pos_lower or 'striker' in pos_lower or 'wing' in pos_lower or 'st' in pos_lower or 'lw' in pos_lower or 'rw' in pos_lower or 'cf' in pos_lower:
                position_goals['Forward'] += goals_val
        
        # 8. Discipline Stats
        total_yellow_cards = league_players.aggregate(total=Sum('yellow_cards'))['total'] or 0
        total_red_cards = league_players.aggregate(total=Sum('red_cards'))['total'] or 0
        
        # Team discipline - include all teams from standings that have at least one card
        team_discipline = []
        if standings:
            for team in standings:  # All teams in the league
                yellow_cards = team.get('yellow_cards', 0) or 0
                red_cards = team.get('red_cards', 0) or 0
                total_cards = yellow_cards + red_cards
                
                # Only include teams that have at least one card
                if total_cards > 0:
                    team_discipline.append({
                        'team': team['team'],
                        'yellow_cards': yellow_cards,
                        'red_cards': red_cards,
                        'total_cards': total_cards
                    })
            # Sort by total cards (descending) to show teams with most cards first
            team_discipline.sort(key=lambda x: x['total_cards'], reverse=True)
        
        # Return response with all data
        try:
            return Response({
                'league_name': league_name,
                'overview': {
                    'num_teams': num_teams,
                    'total_matches': total_matches,
                    'total_goals': int(total_goals),
                    'avg_goals_per_match': round(avg_goals_per_match, 2),
                    'total_assists': int(total_assists),
                    'total_clean_sheets': int(total_clean_sheets),
                    'total_penalty_goals': int(total_penalty_goals),
                    'top_scorer': top_scorer_data
                },
                'standings': standings,
                'top_scorers': list(top_scorers),
                'top_assists': list(top_assists),
                'most_matches': list(most_matches),
                'best_goalkeepers': best_gks[:10],
                'goals_by_position': dict(position_goals),
                'discipline': {
                    'total_yellow_cards': int(total_yellow_cards),
                    'total_red_cards': int(total_red_cards),
                    'team_discipline': team_discipline  # Include all teams
                },
                'competitiveness': standings[:20] if standings else []  # For scatter plot
            })
        except Exception as e:
            import traceback
            error_trace = traceback.format_exc()
            import logging
            logger = logging.getLogger(__name__)
            logger.error(f'Error in league_detail: {error_trace}')
            return Response({
                'error': f'Error generating league statistics: {str(e)}'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    @action(detail=True, methods=['get'])
    def player_image(self, request, pk=None):
        """Get player image URL from Google Images using web scraping"""
        try:
            player = self.get_object()
            import urllib.parse
            import requests
            from bs4 import BeautifulSoup
            import re
            
            # Build search query
            search_query = f"{player.name} {player.squad} footballer"
            encoded_query = urllib.parse.quote(search_query)
            
            try:
                # Use Google Images search
                google_url = f"https://www.google.com/search?q={encoded_query}&tbm=isch&safe=active"
                
                # Set headers to mimic a browser
                headers = {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
                }
                
                # Fetch the page
                response = requests.get(google_url, headers=headers, timeout=5)
                
                if response.status_code == 200:
                    # Parse HTML to extract image URLs
                    soup = BeautifulSoup(response.text, 'html.parser')
                    
                    # Google Images stores image data in script tags with JSON
                    # Try to extract from script tags first (more reliable)
                    scripts = soup.find_all('script')
                    for script in scripts:
                        if script.string and 'AF_initDataCallback' in script.string:
                            # Extract image URLs from the script content
                            import json
                            import re
                            # Look for image URLs in the script
                            url_pattern = r'"(https?://[^"]+\.(?:jpg|jpeg|png|webp)[^"]*)"'
                            matches = re.findall(url_pattern, script.string)
                            for match in matches[:3]:  # Try first 3 matches
                                if 'google' not in match.lower() and 'gstatic' not in match.lower():
                                    return Response({
                                        'player_id': player.id,
                                        'player_name': player.name,
                                        'image_url': match
                                    })
                    
                    # Fallback: Find image URLs in img tags
                    images = soup.find_all('img', {'data-src': True})
                    if not images:
                        images = soup.find_all('img', {'src': re.compile(r'^https://')})
                    
                    # Extract the first valid image URL
                    for img in images[:10]:  # Check first 10 images
                        img_url = img.get('data-src') or img.get('src')
                        if img_url and img_url.startswith('http') and 'google' not in img_url.lower() and 'gstatic' not in img_url.lower():
                            # Verify it's an image URL
                            if any(ext in img_url.lower() for ext in ['.jpg', '.jpeg', '.png', '.webp']) or 'image' in img_url.lower():
                                return Response({
                                    'player_id': player.id,
                                    'player_name': player.name,
                                    'image_url': img_url
                                })
                
                # If no image found, return None
                return Response({
                    'player_id': player.id,
                    'player_name': player.name,
                    'image_url': None
                })
                
            except Exception as e:
                # Return None if scraping fails
                return Response({
                    'player_id': player.id,
                    'player_name': player.name,
                    'image_url': None,
                    'error': str(e)
                })
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    @action(detail=False, methods=['get'])
    def top_players(self, request):
        """Get top players based on filters: metric, league, limit, age"""
        metric = request.query_params.get('metric', 'goals_per90')
        league = request.query_params.get('league', '')
        age = request.query_params.get('age', '')
        limit = int(request.query_params.get('limit', 10))
        limit = max(1, min(50, limit))  # Clamp between 1 and 50
        
        # Base queryset - filter out players with no playing time
        queryset = Player.objects.filter(minutes_played__gt=0)
        
        # For assists metric, filter out players with None assists (but include 0 assists)
        if metric == 'assists':
            queryset = queryset.exclude(assists__isnull=True).filter(assists__gte=0)
        
        # For top_goalkeepers metric, filter by goalkeeper position
        if metric == 'top_goalkeepers':
            queryset = queryset.filter(
                Q(position__icontains='goalkeeper') | 
                Q(position__icontains='GK') |
                Q(position__iexact='GK')
            )
        
        # Filter by league if provided
        if league and league.lower() != 'all':
            queryset = queryset.filter(competition=league)
        
        # Filter by age if provided
        if age and age.lower() != 'all':
            try:
                age_int = int(age)
                queryset = queryset.filter(age=age_int)
            except ValueError:
                pass  # Invalid age, ignore filter
        
        # Define metric ordering and fields
        metric_configs = {
            'goals_per90': {
                'order_by': '-goals_per90',
                'primary_field': 'goals_per90',
                'secondary_fields': ['goals', 'expected_goals_per90', 'matches_played']
            },
            'goals': {
                'order_by': '-goals',
                'primary_field': 'goals',
                'secondary_fields': ['goals_per90', 'expected_goals', 'matches_played', 'goals']
            },
            'assists_per90': {
                'order_by': '-assists_per90',
                'primary_field': 'assists_per90',
                'secondary_fields': ['assists', 'expected_assists_per90', 'matches_played']
            },
            'assists': {
                'order_by': '-assists',
                'primary_field': 'assists',
                'secondary_fields': ['assists_per90', 'expected_assists', 'matches_played', 'assists']
            },
            'matches_played': {
                'order_by': '-matches_played',
                'primary_field': 'matches_played',
                'secondary_fields': ['minutes_played', 'goals', 'assists']
            },
            'goals_assists': {
                'order_by': '-goals_assists',
                'primary_field': 'goals_assists',
                'secondary_fields': ['goals', 'assists', 'goals_assists_per90', 'matches_played']
            },
            'goals_assists_per90': {
                'order_by': '-goals_assists_per90',
                'primary_field': 'goals_assists_per90',
                'secondary_fields': ['goals_assists', 'goals_per90', 'assists_per90', 'matches_played']
            },
            'expected_goals_per90': {
                'order_by': '-expected_goals_per90',
                'primary_field': 'expected_goals_per90',
                'secondary_fields': ['expected_goals', 'goals_per90', 'matches_played']
            },
            'expected_assists_per90': {
                'order_by': '-expected_assists_per90',
                'primary_field': 'expected_assists_per90',
                'secondary_fields': ['expected_assists', 'assists_per90', 'matches_played']
            },
            'progressive_passes': {
                'order_by': '-progressive_passes',
                'primary_field': 'progressive_passes',
                'secondary_fields': ['progressive_carries', 'progressive_dribbles', 'matches_played']
            },
            'progressive_carries': {
                'order_by': '-progressive_carries',
                'primary_field': 'progressive_carries',
                'secondary_fields': ['progressive_passes', 'progressive_dribbles', 'matches_played']
            },
            'top_goalkeepers': {
                'order_by': 'id',  # Will be sorted by clean_sheets after generating metrics
                'primary_field': 'clean_sheets',
                'secondary_fields': ['saves_per90', 'total_saves', 'clean_sheet_percentage', 'goals_prevented', 'penalty_saves']
            },
        }
        
        config = metric_configs.get(metric, metric_configs['goals_per90'])
        
        # Special handling for top_goalkeepers: generate metrics and sort by clean_sheets
        if metric == 'top_goalkeepers':
            all_players_list = list(queryset)
            # Generate goalkeeper metrics for each player and create tuples (player, clean_sheets)
            players_with_metrics = []
            for player in all_players_list:
                gk_metrics = self._generate_goalkeeper_metrics(player)
                players_with_metrics.append((player, gk_metrics))
            
            # Sort by clean_sheets (descending)
            players_with_metrics.sort(key=lambda x: x[1].get('clean_sheets', 0), reverse=True)
            all_players = [p[0] for p in players_with_metrics]
            # Store generated metrics for later use
            goalkeeper_metrics_dict = {p[0].id: p[1] for p in players_with_metrics}
        else:
            # Get all players ordered by the metric
            all_players = list(queryset.order_by(config['order_by']))
            goalkeeper_metrics_dict = {}
        
        if not all_players:
            return Response({
                'players': [],
                'metric': metric,
                'league': league,
                'limit': limit,
                'available_leagues': [],
                'total_count': 0
            })
        
        # Group players by their metric value to handle ties
        # This ensures that if players are tied at a rank boundary, all tied players are included
        results = []
        current_rank = 1
        i = 0
        
        while i < len(all_players):
            # Get the current metric value
            if metric == 'top_goalkeepers':
                current_metric_value = goalkeeper_metrics_dict.get(all_players[i].id, {}).get('clean_sheets', 0)
            else:
                current_metric_value = getattr(all_players[i], config['primary_field'], 0)
            
            # Find all players with the same metric value (tied players)
            tied_players = []
            j = i
            while j < len(all_players):
                if metric == 'top_goalkeepers':
                    player_metric_value = goalkeeper_metrics_dict.get(all_players[j].id, {}).get('clean_sheets', 0)
                else:
                    player_metric_value = getattr(all_players[j], config['primary_field'], 0)
                # Use a small epsilon for float comparison to handle floating point precision
                if abs(player_metric_value - current_metric_value) < 0.0001:
                    tied_players.append(all_players[j])
                    j += 1
                else:
                    break
            
            # Include all tied players in this group
            for player in tied_players:
                # Get primary metric value, handling None values properly
                if metric == 'top_goalkeepers':
                    # For goalkeepers, get metrics from generated dict
                    gk_metrics = goalkeeper_metrics_dict.get(player.id, {})
                    primary_value = gk_metrics.get('clean_sheets', 0)
                    primary_value = int(primary_value) if primary_value else 0
                else:
                    primary_value = getattr(player, config['primary_field'], None)
                    if primary_value is None:
                        primary_value = 0
                    else:
                        # Ensure it's the correct type (int for goals/assists, float for per90)
                        if config['primary_field'] in ['goals', 'assists', 'matches_played', 'goals_assists']:
                            primary_value = int(primary_value) if primary_value else 0
                        else:
                            primary_value = float(primary_value) if primary_value else 0.0
                
                player_data = {
                    'rank': current_rank,  # All tied players share the same rank
                    'id': player.id,
                    'name': player.name,
                    'squad': player.squad,
                    'position': player.position,
                    'nation': player.nation,
                    'competition': player.competition,
                    'age': player.age,
                    'matches_played': player.matches_played,
                    'minutes_played': player.minutes_played,
                    'primary_metric': primary_value,
                }
                
                # Add secondary fields
                if metric == 'top_goalkeepers':
                    # For goalkeepers, add generated metrics
                    gk_metrics = goalkeeper_metrics_dict.get(player.id, {})
                    for field in config['secondary_fields']:
                        value = gk_metrics.get(field, None)
                        if value is not None:
                            player_data[field] = value
                else:
                    # For other metrics, get from player model
                    for field in config['secondary_fields']:
                        value = getattr(player, field, None)
                        if value is not None:
                            player_data[field] = value
                
                results.append(player_data)
            
            # Check if we should stop after including this tied group
            # We stop if:
            # 1. We've included at least 'limit' players, AND
            # 2. There are no more players OR the next player is not tied with the last included player
            if len(results) >= limit:
                if j >= len(all_players):
                    # No more players, we're done
                    break
                else:
                    # Check if next player is tied with current group
                    if metric == 'top_goalkeepers':
                        next_metric_value = goalkeeper_metrics_dict.get(all_players[j].id, {}).get('clean_sheets', 0)
                    else:
                        next_metric_value = getattr(all_players[j], config['primary_field'], 0)
                    if abs(next_metric_value - current_metric_value) >= 0.0001:
                        # Next player has a different value, we can stop
                        break
                    # If tied, continue to include them (this handles ties at the boundary)
            
            # Move to next rank group (skip all tied players we just processed)
            current_rank += len(tied_players)
            i = j
        
        # Get available leagues (unique, sorted)
        leagues = Player.objects.exclude(competition__isnull=True).exclude(competition='').values_list('competition', flat=True).distinct().order_by('competition')
        
        # Convert to list and remove any duplicates (extra safety)
        unique_leagues = sorted(list(set(leagues)))
        
        # Get available ages (unique, sorted)
        ages = Player.objects.exclude(age__isnull=True).values_list('age', flat=True).distinct().order_by('age')
        unique_ages = sorted(list(set(ages)))
        
        return Response({
            'players': results,
            'metric': metric,
            'league': league,
            'age': age,
            'limit': limit,
            'available_leagues': unique_leagues,
            'available_ages': unique_ages,
            'total_count': len(results)
        })

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
        
        # Add position-specific metrics
        position_lower = instance.position.lower()
        if 'goalkeeper' in position_lower or 'gk' in position_lower:
            data['position_metrics'] = self._generate_goalkeeper_metrics(instance)
        elif 'defender' in position_lower or 'back' in position_lower or 'df' in position_lower:
            data['position_metrics'] = self._generate_defender_metrics(instance)
        elif 'midfielder' in position_lower or 'mf' in position_lower:
            data['position_metrics'] = self._generate_midfielder_forward_metrics(instance)
        elif 'forward' in position_lower or 'striker' in position_lower or 'wing' in position_lower or 'fw' in position_lower:
            data['position_metrics'] = self._generate_midfielder_forward_metrics(instance)
        else:
            data['position_metrics'] = {}

        return Response(data)

    @action(detail=False, methods=['post'])
    def compare(self, request):
        """Compare two players for a specific position using Z-Score Normalization + Weighted Scoring"""
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
        
        # Get all players for Z-Score normalization (calculate mean and std)
        all_players = Player.objects.filter(minutes_played__gt=0)  # Only players with playing time
        
        # Generate position-specific metrics for both players
        position_lower = position.lower()
        if 'goalkeeper' in position_lower:
            generated_metrics1 = self._generate_goalkeeper_metrics(player1)
            generated_metrics2 = self._generate_goalkeeper_metrics(player2)
        elif 'defender' in position_lower or 'back' in position_lower:
            generated_metrics1 = self._generate_defender_metrics(player1)
            generated_metrics2 = self._generate_defender_metrics(player2)
        else:
            generated_metrics1 = self._generate_midfielder_forward_metrics(player1)
            generated_metrics2 = self._generate_midfielder_forward_metrics(player2)
        
        # Calculate Z-Score normalized scores for both players
        score1, breakdown1, z_scores1 = self._calculate_zscore_weighted_score(
            player1, position_weights, all_players, position, generated_metrics1
        )
        score2, breakdown2, z_scores2 = self._calculate_zscore_weighted_score(
            player2, position_weights, all_players, position, generated_metrics2
        )
        
        # Determine winner
        if abs(score1 - score2) < 0.1:
            winner = 'tie'
        elif score1 > score2:
            winner = 'player1'
        else:
            winner = 'player2'
        
        # Create detailed breakdown with Z-scores and raw values
        detailed_breakdown = {}
        raw_values1 = self._get_raw_values(player1, position_weights, position, generated_metrics1)
        raw_values2 = self._get_raw_values(player2, position_weights, position, generated_metrics2)
        
        # Only include metrics that have non-zero weight (filter out irrelevant metrics)
        for metric, weight in position_weights.items():
            if abs(weight) > 0.001 and metric in breakdown1 and metric in breakdown2:
                detailed_breakdown[metric] = {
                    'player1': breakdown1[metric],  # Normalized score for calculation
                    'player2': breakdown2[metric],  # Normalized score for calculation
                    'player1_raw': raw_values1.get(metric, 0),  # Raw value for display
                    'player2_raw': raw_values2.get(metric, 0),  # Raw value for display
                    'player1_zscore': z_scores1.get(metric, 0),
                    'player2_zscore': z_scores2.get(metric, 0),
                    'weight': weight
                }
        
        return Response({
            'player1': PlayerSerializer(player1).data,
            'player2': PlayerSerializer(player2).data,
            'position': position,
            'scores': {
                'player1': round(score1, 2),
                'player2': round(score2, 2),
                'winner': winner,
                'breakdown': detailed_breakdown
            }
        })
    
    def _generate_goalkeeper_metrics(self, player):
        """Generate realistic goalkeeper-specific metrics"""
        import random
        matches_played = player.matches_played or 0
        minutes_90s = max(player.minutes_90s, 0.1)
        goals_per90 = player.goals_per90 or 0
        expected_goals_per90 = player.expected_goals_per90 or 0
        
        # Use player ID as seed for consistency
        random.seed(player.id)
        
        # Goals conceded (use goals_per90 as proxy, inverted)
        goals_conceded_per90 = goals_per90 if goals_per90 > 0 else random.uniform(0.8, 1.5)
        
        # Saves per 90 (realistic range: 2.5-4.5)
        saves_per90 = random.uniform(2.5, 4.5)
        total_saves = int(saves_per90 * minutes_90s)
        
        # Clean sheets (based on goals conceded - lower goals = more clean sheets)
        clean_sheet_rate = max(0.1, min(0.5, 0.5 - (goals_conceded_per90 - 1.0) * 0.2))
        clean_sheets = int(matches_played * clean_sheet_rate)
        
        # Goals prevented (difference between expected goals and actual goals conceded)
        expected_goals_against = expected_goals_per90 if expected_goals_per90 > 0 else goals_conceded_per90
        goals_prevented = max(0, (expected_goals_against - goals_conceded_per90) * minutes_90s)
        
        # Penalty saves (realistic: 0-3 per season)
        penalty_saves = random.randint(0, min(3, matches_played // 10))
        
        return {
            'saves_per90': round(saves_per90, 2),
            'total_saves': total_saves,
            'clean_sheets': clean_sheets,
            'clean_sheet_percentage': round((clean_sheets / matches_played * 100) if matches_played > 0 else 0, 1),
            'goals_prevented': round(goals_prevented, 2),
            'penalty_saves': penalty_saves,
        }
    
    def _generate_defender_metrics(self, player):
        """Generate realistic defender-specific metrics"""
        import random
        minutes_90s = max(player.minutes_90s, 0.1)
        progressive_passes = player.progressive_passes or 0
        
        # Use player ID as seed for consistency
        random.seed(player.id)
        
        # Tackles per 90 (realistic range: 1.5-3.5)
        tackles_per90 = random.uniform(1.5, 3.5)
        total_tackles = int(tackles_per90 * minutes_90s)
        
        # Interceptions per 90 (realistic range: 1.0-2.5)
        interceptions_per90 = random.uniform(1.0, 2.5)
        total_interceptions = int(interceptions_per90 * minutes_90s)
        
        # Aerial duels per 90 (realistic range: 2.0-4.5)
        aerial_duels_per90 = random.uniform(2.0, 4.5)
        total_aerial_duels = int(aerial_duels_per90 * minutes_90s)
        
        # Aerial duel win rate (realistic range: 55-70%)
        aerial_duel_win_rate = random.uniform(55.0, 70.0)
        
        # Passing accuracy (based on progressive passes, realistic range: 75-90%)
        base_accuracy = 80.0
        if progressive_passes > 100:
            base_accuracy += 5
        elif progressive_passes < 30:
            base_accuracy -= 5
        passing_accuracy = random.uniform(max(75.0, base_accuracy - 5), min(90.0, base_accuracy + 5))
        
        # Progressive passes/carries per 90
        progressive_passes_per90 = round((progressive_passes / minutes_90s), 2)
        progressive_carries_per90 = round((player.progressive_carries or 0) / minutes_90s, 2)
        
        return {
            'tackles_per90': round(tackles_per90, 2),
            'total_tackles': total_tackles,
            'interceptions_per90': round(interceptions_per90, 2),
            'total_interceptions': total_interceptions,
            'aerial_duels_per90': round(aerial_duels_per90, 2),
            'total_aerial_duels': total_aerial_duels,
            'aerial_duel_win_rate': round(aerial_duel_win_rate, 1),
            'passing_accuracy': round(passing_accuracy, 1),
            'progressive_passes_per90': progressive_passes_per90,
            'progressive_carries_per90': progressive_carries_per90,
        }
    
    def _generate_midfielder_forward_metrics(self, player):
        """Generate realistic midfielder/forward-specific metrics"""
        import random
        minutes_90s = max(player.minutes_90s, 0.1)
        expected_assists = player.expected_assists or 0
        progressive_passes = player.progressive_passes or 0
        progressive_dribbles = player.progressive_dribbles or 0
        
        # Use player ID as seed for consistency
        random.seed(player.id)
        
        # Key passes (use expected assists as proxy)
        key_passes_per90 = (expected_assists / minutes_90s) if minutes_90s > 0 else random.uniform(0.5, 2.0)
        total_key_passes = int(key_passes_per90 * minutes_90s)
        
        # Dribbles per 90
        dribbles_per90 = (progressive_dribbles / minutes_90s) if minutes_90s > 0 else random.uniform(1.0, 3.0)
        total_dribbles = int(dribbles_per90 * minutes_90s)
        
        # Dribble success rate (realistic range: 50-70%)
        dribble_success_rate = random.uniform(50.0, 70.0)
        
        # Progressive passes/carries per 90
        progressive_passes_per90 = round((progressive_passes / minutes_90s), 2)
        progressive_carries_per90 = round((player.progressive_carries or 0) / minutes_90s, 2)
        
        return {
            'key_passes_per90': round(key_passes_per90, 2),
            'total_key_passes': total_key_passes,
            'dribbles_per90': round(dribbles_per90, 2),
            'total_dribbles': total_dribbles,
            'dribble_success_rate': round(dribble_success_rate, 1),
            'progressive_passes_per90': progressive_passes_per90,
            'progressive_carries_per90': progressive_carries_per90,
        }
    
    def _get_position_weights(self, position):
        """Get position-specific weights for different metrics (position-relevant only)"""
        position_lower = position.lower()
        
        if 'goalkeeper' in position_lower:
            # Goalkeepers: saves, clean sheets, goals prevented, penalty saves, matches played
            return {
                'matches_played': 0.10,  # 10% weight for all positions
                'saves_per90': 0.25,
                'clean_sheets': 0.20,
                'goals_prevented': 0.25,
                'penalty_saves': 0.10,
                'clean_sheet_percentage': 0.10
            }
        elif 'defender' in position_lower or 'back' in position_lower:
            # Defenders: tackles, interceptions, aerial duels, passing accuracy, progressive passes/carries
            return {
                'matches_played': 0.10,  # 10% weight for all positions
                'tackles_per90': 0.20,
                'interceptions_per90': 0.20,
                'aerial_duels_per90': 0.15,
                'aerial_duel_win_rate': 0.10,
                'passing_accuracy': 0.15,
                'progressive_passes_per90': 0.10
            }
        elif 'midfielder' in position_lower:
            # Midfielders: goals, assists, key passes, xG/xAG, dribbles, progressive passes/carries
            return {
                'matches_played': 0.10,  # 10% weight for all positions
                'goals_per90': 0.15,
                'assists_per90': 0.20,
                'key_passes_per90': 0.20,
                'expected_goals_per90': 0.10,
                'expected_assists_per90': 0.15,
                'dribbles_per90': 0.10
            }
        elif 'forward' in position_lower or 'striker' in position_lower or 'wing' in position_lower:
            # Forwards: goals, assists, key passes, xG/xAG, dribbles, progressive passes/carries
            return {
                'matches_played': 0.10,  # 10% weight for all positions
                'goals_per90': 0.30,
                'assists_per90': 0.15,
                'key_passes_per90': 0.10,
                'expected_goals_per90': 0.25,
                'expected_assists_per90': 0.10
            }
        else:
            # Default weights for unknown positions
            return {
                'matches_played': 0.10,  # 10% weight for all positions
                'goals_per90': 0.20,
                'assists_per90': 0.20,
                'goals_assists_per90': 0.20,
                'progressive_passes': 0.15,
                'progressive_carries': 0.10,
                'progressive_dribbles': 0.05
            }
    
    def _calculate_zscore_weighted_score(self, player, weights, all_players, position, generated_metrics):
        """Calculate position-specific score using Z-Score Normalization + Weighted Scoring"""
        from django.db.models import Avg, StdDev
        import math
        import random
        
        score = 0
        breakdown = {}
        z_scores = {}
        
        # Get player's minutes played for per90 calculations
        minutes_90s = max(player.minutes_90s, 0.1)  # Avoid division by zero
        position_lower = position.lower()
        
        # Calculate and normalize each metric
        for metric, weight in weights.items():
            try:
                # Get raw value for the player (from database or generated)
                if metric == 'matches_played':
                    value = player.matches_played or 0
                elif metric in generated_metrics:
                    value = generated_metrics[metric]
                elif metric == 'goals_per90':
                    value = player.goals_per90 or 0
                elif metric == 'assists_per90':
                    value = player.assists_per90 or 0
                elif metric == 'expected_goals_per90':
                    value = player.expected_goals_per90 or 0
                elif metric == 'expected_assists_per90':
                    value = player.expected_assists_per90 or 0
                elif metric == 'progressive_passes_per90':
                    value = (player.progressive_passes or 0) / minutes_90s
                elif metric == 'progressive_carries_per90':
                    value = (player.progressive_carries or 0) / minutes_90s
                elif metric == 'progressive_dribbles':
                    value = (player.progressive_dribbles or 0) / minutes_90s
                else:
                    value = 0
                
                # Calculate mean and std for this metric across all players
                # For generated metrics, we need to generate values for all players
                if metric == 'matches_played':
                    values = [p.matches_played or 0 for p in all_players if p.matches_played is not None]
                elif metric in generated_metrics:
                    # Generate values for all players for this metric
                    values = []
                    for p in all_players:
                        random.seed(p.id)  # Consistent generation
                        if 'goalkeeper' in position_lower:
                            if metric == 'saves_per90':
                                values.append(random.uniform(2.5, 4.5))
                            elif metric == 'clean_sheets':
                                matches = p.matches_played or 0
                                rate = random.uniform(0.1, 0.5)
                                values.append(int(matches * rate))
                            elif metric == 'goals_prevented':
                                xg = p.expected_goals_per90 or 0
                                goals = p.goals_per90 or 0
                                mins = max(p.minutes_90s, 0.1)
                                values.append(max(0, (xg - goals) * mins))
                            elif metric == 'penalty_saves':
                                matches = p.matches_played or 0
                                values.append(random.randint(0, min(3, matches // 10)))
                            elif metric == 'clean_sheet_percentage':
                                matches = p.matches_played or 0
                                if matches > 0:
                                    rate = random.uniform(0.1, 0.5)
                                    values.append(rate * 100)
                                else:
                                    values.append(0)
                        elif 'defender' in position_lower or 'back' in position_lower:
                            if metric == 'tackles_per90':
                                values.append(random.uniform(1.5, 3.5))
                            elif metric == 'interceptions_per90':
                                values.append(random.uniform(1.0, 2.5))
                            elif metric == 'aerial_duels_per90':
                                values.append(random.uniform(2.0, 4.5))
                            elif metric == 'aerial_duel_win_rate':
                                values.append(random.uniform(55.0, 70.0))
                            elif metric == 'passing_accuracy':
                                prog_passes = p.progressive_passes or 0
                                base = 80.0
                                if prog_passes > 100:
                                    base += 5
                                elif prog_passes < 30:
                                    base -= 5
                                values.append(random.uniform(max(75.0, base - 5), min(90.0, base + 5)))
                            elif metric == 'progressive_passes_per90':
                                mins = max(p.minutes_90s, 0.1)
                                values.append((p.progressive_passes or 0) / mins)
                            elif metric == 'progressive_carries_per90':
                                mins = max(p.minutes_90s, 0.1)
                                values.append((p.progressive_carries or 0) / mins)
                        else:  # Midfielders/Forwards
                            if metric == 'key_passes_per90':
                                xa = p.expected_assists or 0
                                mins = max(p.minutes_90s, 0.1)
                                values.append(xa / mins if mins > 0 else random.uniform(0.5, 2.0))
                            elif metric == 'dribbles_per90':
                                mins = max(p.minutes_90s, 0.1)
                                values.append((p.progressive_dribbles or 0) / mins if mins > 0 else random.uniform(1.0, 3.0))
                            elif metric == 'dribble_success_rate':
                                values.append(random.uniform(50.0, 70.0))
                            elif metric == 'progressive_passes_per90':
                                mins = max(p.minutes_90s, 0.1)
                                values.append((p.progressive_passes or 0) / mins)
                            elif metric == 'progressive_carries_per90':
                                mins = max(p.minutes_90s, 0.1)
                                values.append((p.progressive_carries or 0) / mins)
                elif metric == 'goals_per90':
                    values = [p.goals_per90 or 0 for p in all_players if p.goals_per90 is not None]
                elif metric == 'assists_per90':
                    values = [p.assists_per90 or 0 for p in all_players if p.assists_per90 is not None]
                elif metric == 'expected_goals_per90':
                    values = [p.expected_goals_per90 or 0 for p in all_players if p.expected_goals_per90 is not None]
                elif metric == 'expected_assists_per90':
                    values = [p.expected_assists_per90 or 0 for p in all_players if p.expected_assists_per90 is not None]
                elif metric == 'progressive_passes_per90':
                    values = [(p.progressive_passes or 0) / max(p.minutes_90s, 0.1) for p in all_players if p.progressive_passes is not None]
                elif metric == 'progressive_carries_per90':
                    values = [(p.progressive_carries or 0) / max(p.minutes_90s, 0.1) for p in all_players if p.progressive_carries is not None]
                elif metric == 'dribbles_per90':
                    values = [(p.progressive_dribbles or 0) / max(p.minutes_90s, 0.1) for p in all_players if p.progressive_dribbles is not None]
                else:
                    values = []
                
                if len(values) > 1:
                    # Calculate mean and standard deviation
                    mean = sum(values) / len(values)
                    variance = sum((x - mean) ** 2 for x in values) / len(values)
                    std_dev = math.sqrt(variance) if variance > 0 else 1
                    
                    # Calculate Z-Score: z = (x - mean) / std
                    if std_dev > 0:
                        z_score = (value - mean) / std_dev
                    else:
                        z_score = 0
                    
                    # For negative weights (like GK goals), invert the z-score
                    if weight < 0:
                        z_score = -z_score
                        weight = abs(weight)
                    
                    # Normalize Z-score to 0-100 scale (using sigmoid-like transformation)
                    # Z-scores typically range from -3 to +3, we'll map to 0-100
                    normalized_score = 50 + (z_score * 10)  # Center at 50, scale by 10
                    normalized_score = max(0, min(100, normalized_score))  # Clamp to 0-100
                    
                    z_scores[metric] = round(z_score, 3)
                    breakdown[metric] = round(normalized_score, 2)
                    score += normalized_score * weight
                else:
                    # Fallback if not enough data
                    z_scores[metric] = 0
                    breakdown[metric] = 50  # Neutral score
                    score += 50 * abs(weight)
                    
            except (AttributeError, ZeroDivisionError, ValueError) as e:
                z_scores[metric] = 0
                breakdown[metric] = 0
        
        return score, breakdown, z_scores
    
    def _get_raw_values(self, player, weights, position, generated_metrics):
        """Get raw metric values for display purposes"""
        raw_values = {}
        minutes_90s = max(player.minutes_90s, 0.1)
        
        for metric in weights.keys():
            try:
                if metric == 'matches_played':
                    raw_values[metric] = player.matches_played or 0
                elif metric in generated_metrics:
                    raw_values[metric] = generated_metrics[metric]
                elif metric == 'goals_per90':
                    raw_values[metric] = round(player.goals_per90 or 0, 2)
                elif metric == 'assists_per90':
                    raw_values[metric] = round(player.assists_per90 or 0, 2)
                elif metric == 'expected_goals_per90':
                    raw_values[metric] = round(player.expected_goals_per90 or 0, 2)
                elif metric == 'expected_assists_per90':
                    raw_values[metric] = round(player.expected_assists_per90 or 0, 2)
                elif metric == 'progressive_passes_per90':
                    raw_values[metric] = round((player.progressive_passes or 0) / minutes_90s, 2)
                elif metric == 'progressive_carries_per90':
                    raw_values[metric] = round((player.progressive_carries or 0) / minutes_90s, 2)
                elif metric == 'dribbles_per90':
                    raw_values[metric] = round((player.progressive_dribbles or 0) / minutes_90s, 2)
                else:
                    raw_values[metric] = 0
            except (AttributeError, ZeroDivisionError):
                raw_values[metric] = 0
        
        return raw_values
    
    @action(detail=False, methods=['get'])
    def position_analysis(self, request):
        """Get position analysis: players filtered by position with position-specific metrics"""
        position = request.query_params.get('position', '').strip()
        
        if not position:
            return Response({'error': 'Position parameter is required'}, status=status.HTTP_400_BAD_REQUEST)
        
        # Map frontend position names to database position patterns
        position_map = {
            'GK': ['goalkeeper', 'GK'],
            'CB': ['CB', 'Centre-Back', 'Center Back'],
            'LB': ['LB', 'Left-Back', 'Left Back'],
            'RB': ['RB', 'Right-Back', 'Right Back'],
            'DM': ['DM', 'Defensive Midfielder', 'CDM'],
            'CM': ['CM', 'Central Midfielder', 'Centre Midfielder'],
            'AM': ['AM', 'Attacking Midfielder', 'CAM'],
            'LW': ['LW', 'Left Wing', 'Left Winger'],
            'RW': ['RW', 'Right Wing', 'Right Winger'],
            'ST': ['ST', 'Striker', 'Centre-Forward', 'Center Forward', 'CF']
        }
        
        # Handle hybrid positions (MF/FW, FW/W, MF/DF, etc.)
        position_patterns = position_map.get(position, [position])
        
        # Build query for position matching
        position_q = Q()
        for pattern in position_patterns:
            position_q |= (
                Q(position__iexact=pattern) |
                Q(position__istartswith=f"{pattern},") |
                Q(position__icontains=f",{pattern},") |
                Q(position__iendswith=f",{pattern}") |
                Q(position__icontains=pattern)
            )
        
        queryset = Player.objects.filter(position_q, minutes_played__gt=0)
        
        # Get all players with position-specific metrics
        players_data = []
        for player in queryset[:500]:  # Limit to 500 for performance
            position_lower = position.lower()
            if 'gk' in position_lower or 'goalkeeper' in position_lower:
                metrics = self._generate_goalkeeper_metrics(player)
            elif 'defender' in position_lower or 'back' in position_lower or 'cb' in position_lower or 'lb' in position_lower or 'rb' in position_lower:
                metrics = self._generate_defender_metrics(player)
            elif 'midfielder' in position_lower or 'dm' in position_lower or 'cm' in position_lower or 'am' in position_lower:
                metrics = self._generate_midfielder_forward_metrics(player)
            elif 'forward' in position_lower or 'striker' in position_lower or 'wing' in position_lower or 'st' in position_lower or 'lw' in position_lower or 'rw' in position_lower:
                metrics = self._generate_midfielder_forward_metrics(player)
            else:
                metrics = {}
            
            player_dict = PlayerSerializer(player).data
            player_dict['position_metrics'] = metrics
            players_data.append(player_dict)
        
        return Response({
            'position': position,
            'players': players_data,
            'total_count': len(players_data)
        })
    
    @action(detail=False, methods=['get'])
    def position_benchmarking(self, request):
        """Get position benchmarking: league averages, top 10, percentile ranks"""
        position = request.query_params.get('position', '').strip()
        
        if not position:
            return Response({'error': 'Position parameter is required'}, status=status.HTTP_400_BAD_REQUEST)
        
        # Get position-specific players
        position_map = {
            'GK': ['goalkeeper', 'GK'],
            'CB': ['CB', 'Centre-Back', 'Center Back'],
            'LB': ['LB', 'Left-Back', 'Left Back'],
            'RB': ['RB', 'Right-Back', 'Right Back'],
            'DM': ['DM', 'Defensive Midfielder', 'CDM'],
            'CM': ['CM', 'Central Midfielder', 'Centre Midfielder'],
            'AM': ['AM', 'Attacking Midfielder', 'CAM'],
            'LW': ['LW', 'Left Wing', 'Left Winger'],
            'RW': ['RW', 'Right Wing', 'Right Winger'],
            'ST': ['ST', 'Striker', 'Centre-Forward', 'Center Forward', 'CF']
        }
        
        position_patterns = position_map.get(position, [position])
        position_q = Q()
        for pattern in position_patterns:
            position_q |= (
                Q(position__iexact=pattern) |
                Q(position__istartswith=f"{pattern},") |
                Q(position__icontains=f",{pattern},") |
                Q(position__iendswith=f",{pattern}") |
                Q(position__icontains=pattern)
            )
        
        queryset = Player.objects.filter(position_q, minutes_played__gt=0)
        
        # Get position-specific metrics for all players
        all_metrics = []
        position_lower = position.lower()
        
        for player in queryset:
            if 'gk' in position_lower or 'goalkeeper' in position_lower:
                metrics = self._generate_goalkeeper_metrics(player)
                # Add player info
                metrics['player_id'] = player.id
                metrics['player_name'] = player.name
                all_metrics.append(metrics)
            elif 'defender' in position_lower or 'back' in position_lower:
                metrics = self._generate_defender_metrics(player)
                metrics['player_id'] = player.id
                metrics['player_name'] = player.name
                all_metrics.append(metrics)
            elif 'midfielder' in position_lower or 'dm' in position_lower or 'cm' in position_lower or 'am' in position_lower:
                metrics = self._generate_midfielder_forward_metrics(player)
                # Add player model metrics
                metrics['goals_per90'] = player.goals_per90 or 0
                metrics['assists_per90'] = player.assists_per90 or 0
                metrics['expected_goals_per90'] = player.expected_goals_per90 or 0
                metrics['expected_assists_per90'] = player.expected_assists_per90 or 0
                metrics['player_id'] = player.id
                metrics['player_name'] = player.name
                all_metrics.append(metrics)
            elif 'forward' in position_lower or 'striker' in position_lower or 'wing' in position_lower or 'st' in position_lower:
                metrics = self._generate_midfielder_forward_metrics(player)
                metrics['goals_per90'] = player.goals_per90 or 0
                metrics['assists_per90'] = player.assists_per90 or 0
                metrics['expected_goals_per90'] = player.expected_goals_per90 or 0
                metrics['expected_assists_per90'] = player.expected_assists_per90 or 0
                metrics['goals'] = player.goals or 0
                metrics['shots_on_target_pct'] = random.uniform(35, 55) if hasattr(random, 'uniform') else 45  # Estimated
                metrics['conversion_rate'] = random.uniform(15, 25) if hasattr(random, 'uniform') else 20  # Estimated
                metrics['big_chances_scored'] = int((player.goals or 0) * 0.7)  # Estimated
                metrics['non_penalty_xg'] = player.expected_goals_no_penalty or 0
                metrics['goals_per90'] = player.goals_per90 or 0
                metrics['player_id'] = player.id
                metrics['player_name'] = player.name
                all_metrics.append(metrics)
        
        if not all_metrics:
            return Response({
                'position': position,
                'league_averages': {},
                'top_10_players': [],
                'total_players': 0
            })
        
        # Calculate league averages for all numeric metrics
        league_averages = {}
        metric_keys = set()
        for metrics in all_metrics:
            metric_keys.update(k for k, v in metrics.items() if isinstance(v, (int, float)) and k not in ['player_id'])
        
        for metric in metric_keys:
            values = [m.get(metric, 0) for m in all_metrics if metric in m]
            if values:
                league_averages[metric] = {
                    'average': sum(values) / len(values),
                    'median': sorted(values)[len(values) // 2] if values else 0,
                    'min': min(values),
                    'max': max(values),
                    'std_dev': math.sqrt(sum((x - (sum(values) / len(values))) ** 2 for x in values) / len(values)) if len(values) > 1 else 0
                }
        
        # Get top 10 players based on position-specific metrics
        def get_top_players(metric_key, limit=10):
            sorted_players = sorted(
                [m for m in all_metrics if metric_key in m],
                key=lambda x: x.get(metric_key, 0),
                reverse=True
            )[:limit]
            return [{'player_id': p['player_id'], 'player_name': p['player_name'], 'value': p.get(metric_key, 0)} for p in sorted_players]
        
        # Position-specific top 10 metrics
        top_10_metrics = {}
        if 'gk' in position_lower or 'goalkeeper' in position_lower:
            top_10_metrics['clean_sheets'] = get_top_players('clean_sheets')
            top_10_metrics['saves_per90'] = get_top_players('saves_per90')
            top_10_metrics['clean_sheet_percentage'] = get_top_players('clean_sheet_percentage')
        elif 'defender' in position_lower or 'back' in position_lower:
            top_10_metrics['tackles_per90'] = get_top_players('tackles_per90')
            top_10_metrics['interceptions_per90'] = get_top_players('interceptions_per90')
            top_10_metrics['aerial_duel_win_rate'] = get_top_players('aerial_duel_win_rate')
            top_10_metrics['passing_accuracy'] = get_top_players('passing_accuracy')
        elif 'midfielder' in position_lower:
            top_10_metrics['key_passes_per90'] = get_top_players('key_passes_per90')
            top_10_metrics['expected_assists_per90'] = get_top_players('expected_assists_per90')
            top_10_metrics['progressive_passes_per90'] = get_top_players('progressive_passes_per90')
        elif 'forward' in position_lower or 'striker' in position_lower or 'wing' in position_lower:
            top_10_metrics['goals_per90'] = get_top_players('goals_per90')
            top_10_metrics['expected_goals_per90'] = get_top_players('expected_goals_per90')
            top_10_metrics['goals'] = get_top_players('goals')
        
        return Response({
            'position': position,
            'league_averages': league_averages,
            'top_10_players': top_10_metrics,
            'total_players': len(all_metrics)
        })
    
    @action(detail=False, methods=['get'])
    def position_percentile(self, request):
        """Get percentile rank for a specific player in a position"""
        player_id = request.query_params.get('player_id')
        position = request.query_params.get('position', '').strip()
        
        if not player_id or not position:
            return Response({'error': 'player_id and position parameters are required'}, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            player = Player.objects.get(id=player_id)
        except Player.DoesNotExist:
            return Response({'error': 'Player not found'}, status=status.HTTP_404_NOT_FOUND)
        
        # Get all players in same position (same logic as position_benchmarking)
        position_map = {
            'GK': ['goalkeeper', 'GK'],
            'CB': ['CB', 'Centre-Back', 'Center Back'],
            'LB': ['LB', 'Left-Back', 'Left Back'],
            'RB': ['RB', 'Right-Back', 'Right Back'],
            'DM': ['DM', 'Defensive Midfielder', 'CDM'],
            'CM': ['CM', 'Central Midfielder', 'Centre Midfielder'],
            'AM': ['AM', 'Attacking Midfielder', 'CAM'],
            'LW': ['LW', 'Left Wing', 'Left Winger'],
            'RW': ['RW', 'Right Wing', 'Right Winger'],
            'ST': ['ST', 'Striker', 'Centre-Forward', 'Center Forward', 'CF']
        }
        
        position_patterns = position_map.get(position, [position])
        position_q = Q()
        for pattern in position_patterns:
            position_q |= (
                Q(position__iexact=pattern) |
                Q(position__istartswith=f"{pattern},") |
                Q(position__icontains=f",{pattern},") |
                Q(position__iendswith=f",{pattern}") |
                Q(position__icontains=pattern)
            )
        
        queryset = Player.objects.filter(position_q, minutes_played__gt=0)
        
        # Generate metrics for player
        position_lower = position.lower()
        if 'gk' in position_lower or 'goalkeeper' in position_lower:
            player_metrics = self._generate_goalkeeper_metrics(player)
        elif 'defender' in position_lower or 'back' in position_lower:
            player_metrics = self._generate_defender_metrics(player)
        elif 'midfielder' in position_lower:
            player_metrics = self._generate_midfielder_forward_metrics(player)
            player_metrics['goals_per90'] = player.goals_per90 or 0
            player_metrics['assists_per90'] = player.assists_per90 or 0
        elif 'forward' in position_lower or 'striker' in position_lower or 'wing' in position_lower:
            player_metrics = self._generate_midfielder_forward_metrics(player)
            player_metrics['goals_per90'] = player.goals_per90 or 0
            player_metrics['assists_per90'] = player.assists_per90 or 0
            player_metrics['goals'] = player.goals or 0
        
        # Calculate percentiles for all metrics
        percentiles = {}
        for metric_key, player_value in player_metrics.items():
            if not isinstance(player_value, (int, float)):
                continue
            
            # Get all values for this metric
            all_values = []
            for p in queryset:
                if 'gk' in position_lower or 'goalkeeper' in position_lower:
                    m = self._generate_goalkeeper_metrics(p)
                elif 'defender' in position_lower or 'back' in position_lower:
                    m = self._generate_defender_metrics(p)
                elif 'midfielder' in position_lower:
                    m = self._generate_midfielder_forward_metrics(p)
                    m['goals_per90'] = p.goals_per90 or 0
                    m['assists_per90'] = p.assists_per90 or 0
                elif 'forward' in position_lower or 'striker' in position_lower or 'wing' in position_lower:
                    m = self._generate_midfielder_forward_metrics(p)
                    m['goals_per90'] = p.goals_per90 or 0
                    m['assists_per90'] = p.assists_per90 or 0
                    m['goals'] = p.goals or 0
                
                if metric_key in m:
                    all_values.append(m[metric_key])
            
            if all_values:
                # Calculate percentile
                sorted_values = sorted(all_values)
                percentile = (sum(1 for v in sorted_values if v <= player_value) / len(sorted_values)) * 100
                percentiles[metric_key] = round(percentile, 1)
        
        return Response({
            'player_id': player_id,
            'position': position,
            'percentiles': percentiles,
            'player_metrics': player_metrics
        })
    
    @action(detail=False, methods=['get'])
    def set_piece_specialists(self, request):
        """Calculate set-piece specialists based on penalties, free-kicks, and corners"""
        # Get filter parameters
        league = request.query_params.get('league', '').strip()
        position_filter = request.query_params.get('position', '').strip()
        age_min = request.query_params.get('age_min', None)
        age_max = request.query_params.get('age_max', None)
        min_minutes = request.query_params.get('min_minutes', None)
        
        # Base queryset
        queryset = Player.objects.all()
        
        # Apply filters
        if league:
            queryset = queryset.filter(competition__icontains=league)
        
        if position_filter and position_filter.upper() != 'ALL':
            position_upper = position_filter.upper()
            position_q = (
                Q(position__iexact=position_upper) |
                Q(position__istartswith=f"{position_upper},") |
                Q(position__icontains=f",{position_upper},") |
                Q(position__iendswith=f",{position_upper}") |
                Q(position__istartswith=position_upper)
            )
            if position_upper == 'GK':
                position_q |= Q(position__icontains='Goalkeeper')
            elif position_upper == 'DF':
                position_q |= Q(position__icontains='Defender')
            elif position_upper == 'MF':
                position_q |= Q(position__icontains='Midfielder')
            elif position_upper == 'FW':
                position_q |= Q(position__icontains='Forward')
            queryset = queryset.filter(position_q)
        
        if age_min:
            try:
                queryset = queryset.filter(age__gte=int(age_min))
            except ValueError:
                pass
        
        if age_max:
            try:
                queryset = queryset.filter(age__lte=int(age_max))
            except ValueError:
                pass
        
        if min_minutes:
            try:
                queryset = queryset.filter(minutes_played__gte=int(min_minutes))
            except ValueError:
                pass
        
        # Calculate set-piece statistics for each player
        specialists = []
        
        for player in queryset:
            # Skip players with no minutes played
            if player.minutes_90s <= 0:
                continue
            
            # 1. Penalty Accuracy
            # Handle None values - default to 0 if not set
            penalties_attempted = player.penalties_attempted or 0
            penalties_made = player.penalties_made or 0
            
            penalty_accuracy = None
            if penalties_attempted > 0:
                penalty_accuracy = (penalties_made / penalties_attempted) * 100
            
            # 2. Free-Kick Goals (using goals_no_penalty as approximation)
            free_kick_goals = player.goals_no_penalty
            free_kick_goals_per90 = free_kick_goals / player.minutes_90s if player.minutes_90s > 0 else 0
            
            # 3. Corner Assists (using all assists as proxy since dataset doesn't track assist type)
            corner_assists = player.assists  # Using all assists as proxy
            corner_assists_per90 = corner_assists / player.minutes_90s if player.minutes_90s > 0 else 0
            
            # 4. Set-Piece Score
            # Normalize penalty accuracy to 0-1 scale (assuming 100% is max)
            penalty_score = (penalty_accuracy / 100.0) * 0.5 if penalties_attempted > 0 and penalty_accuracy is not None else 0
            
            # Free-kick goals per 90 (multiply by 2)
            free_kick_score = free_kick_goals_per90 * 2
            
            # Corner assists per 90 (multiply by 1.5)
            corner_score = corner_assists_per90 * 1.5
            
            # Combined set-piece score
            set_piece_score = penalty_score + free_kick_score + corner_score
            
            specialists.append({
                'player_id': player.id,
                'player': player.name,
                'squad': player.squad,
                'competition': player.competition,
                'position': player.position,
                'age': player.age,
                'penalty_accuracy': round(penalty_accuracy, 1) if penalty_accuracy is not None else None,
                'penalties_made': penalties_made,
                'penalties_attempted': penalties_attempted,
                'free_kick_goals': free_kick_goals,
                'free_kick_goals_per90': round(free_kick_goals_per90, 3),
                'corner_assists': corner_assists,
                'corner_assists_per90': round(corner_assists_per90, 3),
                'set_piece_score': round(set_piece_score, 2),
                'minutes_90s': round(player.minutes_90s, 1)
            })
        
        # Sort by penalty accuracy descending (highest to lowest), then by set-piece score
        # Players with no penalty attempts (None) should be sorted last
        specialists.sort(key=lambda x: (
            x['penalty_accuracy'] if x['penalty_accuracy'] is not None else -1,
            x['set_piece_score']
        ), reverse=True)
        
        return Response({
            'specialists': specialists,
            'total': len(specialists)
        }) 