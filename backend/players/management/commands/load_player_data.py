import csv
import json
import random
from django.core.management.base import BaseCommand
from players.models import Player
import os
from datetime import datetime
import shutil

class Command(BaseCommand):
    help = 'Load player data from CSV file and split by position into separate tables'
    
    # Position mapping from CSV to standardized positions
    POSITION_MAPPING = {
        'GK': ['Goalkeeper'],
        'DF': ['Centre-Back', 'Left-Back', 'Right-Back'],
        'MF': ['Defensive Midfielder', 'Central Midfielder', 'Attacking Midfielder'],
        'FW': ['Left Wing', 'Right Wing', 'Centre-Forward', 'Striker']
    }
    
    # 11 specific positions
    POSITIONS = [
        'Goalkeeper',
        'Centre-Back',
        'Left-Back',
        'Right-Back',
        'Defensive Midfielder',
        'Central Midfielder',
        'Attacking Midfielder',
        'Left Wing',
        'Right Wing',
        'Centre-Forward',
        'Striker'
    ]
    
    def add_arguments(self, parser):
        parser.add_argument(
            '--revert',
            action='store_true',
            help='Revert to original dataset structure',
        )
        parser.add_argument(
            '--backup',
            action='store_true',
            help='Create backup of current data before changes',
        )
    
    def normalize_position(self, position_str):
        """Normalize position string to one of the 11 standard positions"""
        if not position_str:
            return None
        
        pos_upper = position_str.upper()
        pos_lower = position_str.lower()
        
        # Check for goalkeeper
        if 'GK' in pos_upper or 'goalkeeper' in pos_lower:
            return 'Goalkeeper'
        
        # Check for defenders
        if 'DF' in pos_upper or 'defender' in pos_lower or 'back' in pos_lower:
            if 'left' in pos_lower:
                return 'Left-Back'
            elif 'right' in pos_lower:
                return 'Right-Back'
            else:
                return 'Centre-Back'
        
        # Check for midfielders
        if 'MF' in pos_upper or 'midfielder' in pos_lower or 'midfield' in pos_lower:
            if 'defensive' in pos_lower or 'defending' in pos_lower:
                return 'Defensive Midfielder'
            elif 'attacking' in pos_lower or 'attack' in pos_lower:
                return 'Attacking Midfielder'
            else:
                return 'Central Midfielder'
        
        # Check for forwards
        if 'FW' in pos_upper or 'forward' in pos_lower or 'striker' in pos_lower or 'wing' in pos_lower:
            if 'striker' in pos_lower:
                return 'Striker'
            elif 'left wing' in pos_lower or 'left' in pos_lower:
                return 'Left Wing'
            elif 'right wing' in pos_lower or 'right' in pos_lower:
                return 'Right Wing'
            elif 'centre-forward' in pos_lower or 'center-forward' in pos_lower:
                return 'Centre-Forward'
            else:
                return 'Striker'
        
        return None
    
    def generate_goalkeeper_metrics(self, row, minutes_90s):
        """Generate realistic goalkeeper-specific metrics"""
        matches_played = int(float(row.get('Playing Time_MP', 0)) or 0)
        minutes_played = int(float(row.get('Playing Time_Min', 0)) or 0)
        
        # Goals conceded (use goals_per90 as proxy, inverted)
        goals_conceded_per90 = float(row.get('Per 90 Minutes_Gls', 0)) or 0
        if goals_conceded_per90 == 0:
            # Generate based on matches played
            goals_conceded_per90 = random.uniform(0.8, 1.5)  # Typical range
        
        # Saves per 90 (realistic range: 2.5-4.5)
        saves_per90 = random.uniform(2.5, 4.5)
        total_saves = int(saves_per90 * minutes_90s)
        
        # Clean sheets (based on goals conceded - lower goals = more clean sheets)
        clean_sheet_rate = max(0.1, min(0.5, 0.5 - (goals_conceded_per90 - 1.0) * 0.2))
        clean_sheets = int(matches_played * clean_sheet_rate)
        
        # Goals prevented (difference between expected goals and actual goals conceded)
        expected_goals_against = float(row.get('Per 90 Minutes_xG', 0)) or goals_conceded_per90
        goals_prevented = max(0, (expected_goals_against - goals_conceded_per90) * minutes_90s)
        
        # Save percentage (realistic range: 65-80%)
        save_percentage = random.uniform(65.0, 80.0)
        
        # Punches and catches (realistic ranges)
        punches_per90 = random.uniform(0.2, 0.8)
        catches_per90 = random.uniform(0.5, 1.5)
        
        return {
            'goals_conceded_per90': round(goals_conceded_per90, 2),
            'total_goals_conceded': int(goals_conceded_per90 * minutes_90s),
            'saves_per90': round(saves_per90, 2),
            'total_saves': total_saves,
            'clean_sheets': clean_sheets,
            'clean_sheet_percentage': round((clean_sheets / matches_played * 100) if matches_played > 0 else 0, 1),
            'goals_prevented': round(goals_prevented, 2),
            'save_percentage': round(save_percentage, 1),
            'punches_per90': round(punches_per90, 2),
            'catches_per90': round(catches_per90, 2),
        }
    
    def generate_defender_metrics(self, row, minutes_90s):
        """Generate realistic defender-specific metrics"""
        matches_played = int(float(row.get('Playing Time_MP', 0)) or 0)
        progressive_passes = int(float(row.get('Progression_PrgP', 0)) or 0)
        progressive_carries = int(float(row.get('Progression_PrgC', 0)) or 0)
        
        # Tackles per 90 (realistic range: 1.5-3.5 for defenders)
        tackles_per90 = random.uniform(1.5, 3.5)
        total_tackles = int(tackles_per90 * minutes_90s)
        
        # Tackle success rate (realistic range: 60-75%)
        tackle_success_rate = random.uniform(60.0, 75.0)
        
        # Interceptions per 90 (realistic range: 1.0-2.5)
        interceptions_per90 = random.uniform(1.0, 2.5)
        total_interceptions = int(interceptions_per90 * minutes_90s)
        
        # Aerial duels per 90 (realistic range: 2.0-4.5 for centre-backs)
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
        
        # Clearances per 90 (realistic range: 2.0-5.0)
        clearances_per90 = random.uniform(2.0, 5.0)
        total_clearances = int(clearances_per90 * minutes_90s)
        
        # Blocks per 90 (realistic range: 0.5-1.5)
        blocks_per90 = random.uniform(0.5, 1.5)
        total_blocks = int(blocks_per90 * minutes_90s)
        
        return {
            'tackles_per90': round(tackles_per90, 2),
            'total_tackles': total_tackles,
            'tackle_success_rate': round(tackle_success_rate, 1),
            'interceptions_per90': round(interceptions_per90, 2),
            'total_interceptions': total_interceptions,
            'aerial_duels_per90': round(aerial_duels_per90, 2),
            'total_aerial_duels': total_aerial_duels,
            'aerial_duel_win_rate': round(aerial_duel_win_rate, 1),
            'passing_accuracy': round(passing_accuracy, 1),
            'clearances_per90': round(clearances_per90, 2),
            'total_clearances': total_clearances,
            'blocks_per90': round(blocks_per90, 2),
            'total_blocks': total_blocks,
        }
    
    def generate_midfielder_metrics(self, row, minutes_90s):
        """Generate realistic midfielder-specific metrics"""
        progressive_passes = int(float(row.get('Progression_PrgP', 0)) or 0)
        expected_assists = float(row.get('Expected_xAG', 0)) or 0
        
        # Key passes (use expected assists as proxy)
        key_passes_per90 = (expected_assists / minutes_90s) if minutes_90s > 0 else 0
        if key_passes_per90 == 0:
            key_passes_per90 = random.uniform(0.5, 2.0)
        total_key_passes = int(key_passes_per90 * minutes_90s)
        
        # Passing accuracy (realistic range: 80-92% for midfielders)
        base_accuracy = 85.0
        if progressive_passes > 150:
            base_accuracy += 3
        passing_accuracy = random.uniform(max(80.0, base_accuracy - 5), min(92.0, base_accuracy + 5))
        
        # Interceptions per 90 (realistic range: 0.8-2.0)
        interceptions_per90 = random.uniform(0.8, 2.0)
        total_interceptions = int(interceptions_per90 * minutes_90s)
        
        # Dribbles per 90 (based on progressive dribbles)
        progressive_dribbles = int(float(row.get('Progression_PrgR', 0)) or 0)
        dribbles_per90 = (progressive_dribbles / minutes_90s) if minutes_90s > 0 else random.uniform(1.0, 3.0)
        total_dribbles = int(dribbles_per90 * minutes_90s)
        
        # Dribble success rate (realistic range: 55-70%)
        dribble_success_rate = random.uniform(55.0, 70.0)
        
        return {
            'key_passes_per90': round(key_passes_per90, 2),
            'total_key_passes': total_key_passes,
            'passing_accuracy': round(passing_accuracy, 1),
            'interceptions_per90': round(interceptions_per90, 2),
            'total_interceptions': total_interceptions,
            'dribbles_per90': round(dribbles_per90, 2),
            'total_dribbles': total_dribbles,
            'dribble_success_rate': round(dribble_success_rate, 1),
        }
    
    def generate_forward_metrics(self, row, minutes_90s):
        """Generate realistic forward-specific metrics"""
        goals = int(float(row.get('Performance_Gls', 0)) or 0)
        expected_goals = float(row.get('Expected_xG', 0)) or 0
        
        # Shots per 90 (realistic range: 2.5-5.0)
        shots_per90 = random.uniform(2.5, 5.0)
        total_shots = int(shots_per90 * minutes_90s)
        
        # Shots on target per 90 (realistic range: 35-50% of shots)
        shots_on_target_percentage = random.uniform(35.0, 50.0)
        shots_on_target_per90 = round(shots_per90 * (shots_on_target_percentage / 100), 2)
        total_shots_on_target = int(shots_on_target_per90 * minutes_90s)
        
        # Conversion rate (goals / shots on target)
        conversion_rate = (goals / total_shots_on_target * 100) if total_shots_on_target > 0 else random.uniform(15.0, 30.0)
        
        # Dribbles per 90 (realistic range: 2.0-5.0)
        progressive_dribbles = int(float(row.get('Progression_PrgR', 0)) or 0)
        dribbles_per90 = (progressive_dribbles / minutes_90s) if minutes_90s > 0 else random.uniform(2.0, 5.0)
        total_dribbles = int(dribbles_per90 * minutes_90s)
        
        # Dribble success rate (realistic range: 50-65%)
        dribble_success_rate = random.uniform(50.0, 65.0)
        
        return {
            'shots_per90': round(shots_per90, 2),
            'total_shots': total_shots,
            'shots_on_target_per90': round(shots_on_target_per90, 2),
            'total_shots_on_target': total_shots_on_target,
            'shot_accuracy': round(shots_on_target_percentage, 1),
            'conversion_rate': round(conversion_rate, 1),
            'dribbles_per90': round(dribbles_per90, 2),
            'total_dribbles': total_dribbles,
            'dribble_success_rate': round(dribble_success_rate, 1),
        }
    
    def create_backup(self):
        """Create backup of current Player data"""
        backup_dir = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(__file__)))), 'backups')
        os.makedirs(backup_dir, exist_ok=True)
        
        timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
        backup_file = os.path.join(backup_dir, f'players_backup_{timestamp}.json')
        
        players = Player.objects.all()
        backup_data = []
        for player in players:
            backup_data.append({
                'name': player.name,
                'nation': player.nation,
                'position': player.position,
                'squad': player.squad,
                'competition': player.competition,
                'age': player.age,
                'matches_played': player.matches_played,
                'matches_started': player.matches_started,
                'minutes_played': player.minutes_played,
                'minutes_90s': player.minutes_90s,
                'goals': player.goals,
                'assists': player.assists,
                'goals_assists': player.goals_assists,
                'goals_no_penalty': player.goals_no_penalty,
                'penalties_made': player.penalties_made,
                'penalties_attempted': player.penalties_attempted,
                'yellow_cards': player.yellow_cards,
                'red_cards': player.red_cards,
                'expected_goals': float(player.expected_goals),
                'expected_goals_no_penalty': float(player.expected_goals_no_penalty),
                'expected_assists': float(player.expected_assists),
                'expected_goals_assists': float(player.expected_goals_assists),
                'progressive_carries': player.progressive_carries,
                'progressive_passes': player.progressive_passes,
                'progressive_dribbles': player.progressive_dribbles,
                'goals_per90': float(player.goals_per90),
                'assists_per90': float(player.assists_per90),
                'goals_assists_per90': float(player.goals_assists_per90),
                'goals_no_penalty_per90': float(player.goals_no_penalty_per90),
                'goals_assists_no_penalty_per90': float(player.goals_assists_no_penalty_per90),
                'expected_goals_per90': float(player.expected_goals_per90),
                'expected_assists_per90': float(player.expected_assists_per90),
                'expected_goals_assists_per90': float(player.expected_goals_assists_per90),
                'expected_goals_no_penalty_per90': float(player.expected_goals_no_penalty_per90),
                'expected_goals_assists_no_penalty_per90': float(player.expected_goals_assists_no_penalty_per90),
            })
        
        with open(backup_file, 'w', encoding='utf-8') as f:
            json.dump(backup_data, f, indent=2)
        
        print(f"Backup created: {backup_file}")
        return backup_file
    
    def revert_from_backup(self):
        """Revert to original dataset structure"""
        backup_dir = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(__file__)))), 'backups')
        
        if not os.path.exists(backup_dir):
            print("No backup directory found. Cannot revert.")
            return
        
        # Find latest backup
        backup_files = [f for f in os.listdir(backup_dir) if f.startswith('players_backup_') and f.endswith('.json')]
        if not backup_files:
            print("No backup files found. Cannot revert.")
            return
        
        backup_files.sort(reverse=True)
        latest_backup = os.path.join(backup_dir, backup_files[0])
        
        print(f"Reverting from backup: {latest_backup}")
        
        # Clear current data
        Player.objects.all().delete()
        
        # Load from backup
        with open(latest_backup, 'r', encoding='utf-8') as f:
            backup_data = json.load(f)
        
        players = []
        for data in backup_data:
            player = Player(**data)
            players.append(player)
        
        Player.objects.bulk_create(players)
        print(f"Successfully reverted {len(players)} players from backup")
    
    def handle(self, *args, **options):
        if options['revert']:
            self.revert_from_backup()
            return
        
        try:
            # Create backup if requested
            if options['backup']:
                self.create_backup()
            
            # Get the absolute path to the CSV file
            base_dir = os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(__file__))))
            csv_path = os.path.join(base_dir, 'player_stats.csv')
            output_dir = os.path.join(base_dir, 'position_tables')
            os.makedirs(output_dir, exist_ok=True)
            
            print(f"Reading CSV from: {csv_path}")
            
            if not os.path.exists(csv_path):
                print(f"Error: CSV file not found at {csv_path}")
                return
            
            # Dictionary to store players by position
            position_players = {pos: [] for pos in self.POSITIONS}
            
            # Read CSV file
            with open(csv_path, 'r', encoding='utf-8') as file:
                lines = file.readlines()
                data_lines = [line for line in lines if not line.startswith('Player,Nation,') or lines.index(line) == 0]
                csv_reader = csv.DictReader(data_lines)
                
                skipped_rows = 0
                processed_rows = 0
                
                for row in csv_reader:
                    try:
                        if not row.get('Player') or not row.get('Squad'):
                            skipped_rows += 1
                            continue
                        
                        position_str = row.get('Position', '')
                        normalized_position = self.normalize_position(position_str)
                        
                        if not normalized_position:
                            skipped_rows += 1
                            continue
                        
                        # Get common data
                        minutes_90s = float(row.get('Playing Time_90s', 0)) or 0
                        
                        # Base player data (common for all positions)
                        player_data = {
                            # Basic Information
                            'name': row.get('Player', ''),
                            'nation': row.get('Nation', ''),
                            'position': normalized_position,
                            'squad': row.get('Squad', ''),
                            'competition': row.get('Competition', ''),
                            'age': int(float(row.get('Age', 0)) or 0),
                            
                            # Playing Time
                            'matches_played': int(float(row.get('Playing Time_MP', 0)) or 0),
                            'matches_started': int(float(row.get('Playing Time_Starts', 0)) or 0),
                            'minutes_played': int(float(row.get('Playing Time_Min', 0)) or 0),
                            'minutes_90s': minutes_90s,
                            
                            # Discipline
                            'yellow_cards': int(float(row.get('Performance_CrdY', 0)) or 0),
                            'red_cards': int(float(row.get('Performance_CrdR', 0)) or 0),
                        }
                        
                        # Add position-specific metrics
                        if normalized_position == 'Goalkeeper':
                            gk_metrics = self.generate_goalkeeper_metrics(row, minutes_90s)
                            player_data.update(gk_metrics)
                            # Exclude goals/assists for goalkeepers
                        elif normalized_position in ['Centre-Back', 'Left-Back', 'Right-Back']:
                            def_metrics = self.generate_defender_metrics(row, minutes_90s)
                            player_data.update(def_metrics)
                            # Include relevant stats but exclude goals per 90 as primary metric
                            player_data['goals'] = int(float(row.get('Performance_Gls', 0)) or 0)
                            player_data['assists'] = int(float(row.get('Performance_Ast', 0)) or 0)
                            player_data['progressive_passes'] = int(float(row.get('Progression_PrgP', 0)) or 0)
                            player_data['progressive_carries'] = int(float(row.get('Progression_PrgC', 0)) or 0)
                            player_data['progressive_dribbles'] = int(float(row.get('Progression_PrgR', 0)) or 0)
                        elif normalized_position in ['Defensive Midfielder', 'Central Midfielder', 'Attacking Midfielder']:
                            mf_metrics = self.generate_midfielder_metrics(row, minutes_90s)
                            player_data.update(mf_metrics)
                            # Include all relevant stats
                            player_data['goals'] = int(float(row.get('Performance_Gls', 0)) or 0)
                            player_data['assists'] = int(float(row.get('Performance_Ast', 0)) or 0)
                            player_data['goals_assists'] = int(float(row.get('Performance_G+A', 0)) or 0)
                            player_data['expected_assists'] = float(row.get('Expected_xAG', 0)) or 0
                            player_data['expected_assists_per90'] = float(row.get('Per 90 Minutes_xAG', 0)) or 0
                            player_data['progressive_passes'] = int(float(row.get('Progression_PrgP', 0)) or 0)
                            player_data['progressive_carries'] = int(float(row.get('Progression_PrgC', 0)) or 0)
                            player_data['progressive_dribbles'] = int(float(row.get('Progression_PrgR', 0)) or 0)
                        else:  # Forwards
                            fw_metrics = self.generate_forward_metrics(row, minutes_90s)
                            player_data.update(fw_metrics)
                            # Include all relevant stats
                            player_data['goals'] = int(float(row.get('Performance_Gls', 0)) or 0)
                            player_data['assists'] = int(float(row.get('Performance_Ast', 0)) or 0)
                            player_data['goals_assists'] = int(float(row.get('Performance_G+A', 0)) or 0)
                            player_data['goals_per90'] = float(row.get('Per 90 Minutes_Gls', 0)) or 0
                            player_data['assists_per90'] = float(row.get('Per 90 Minutes_Ast', 0)) or 0
                            player_data['expected_goals'] = float(row.get('Expected_xG', 0)) or 0
                            player_data['expected_goals_per90'] = float(row.get('Per 90 Minutes_xG', 0)) or 0
                            player_data['expected_assists'] = float(row.get('Expected_xAG', 0)) or 0
                            player_data['expected_assists_per90'] = float(row.get('Per 90 Minutes_xAG', 0)) or 0
                            player_data['progressive_carries'] = int(float(row.get('Progression_PrgC', 0)) or 0)
                            player_data['progressive_dribbles'] = int(float(row.get('Progression_PrgR', 0)) or 0)
                        
                        position_players[normalized_position].append(player_data)
                        processed_rows += 1
                        
                    except Exception as e:
                        print(f"Error processing row: {e}")
                        skipped_rows += 1
                        continue
                
                # Create CSV files for each position
                print("\n" + "="*60)
                print("Creating position-specific tables...")
                print("="*60)
                
                for position in self.POSITIONS:
                    players = position_players[position]
                    if not players:
                        print(f"\n{position}: No players found")
                        continue
                    
                    # Create CSV file for this position
                    csv_filename = position.replace(' ', '_').lower() + '_players.csv'
                    csv_filepath = os.path.join(output_dir, csv_filename)
                    
                    # Get all unique keys from all players (to handle different metrics)
                    all_keys = set()
                    for player in players:
                        all_keys.update(player.keys())
                    
                    # Sort keys: common first, then position-specific
                    common_keys = ['name', 'nation', 'squad', 'competition', 'age', 
                                 'matches_played', 'matches_started', 'minutes_played', 'minutes_90s',
                                 'yellow_cards', 'red_cards']
                    position_keys = sorted([k for k in all_keys if k not in common_keys])
                    fieldnames = common_keys + position_keys
                    
                    with open(csv_filepath, 'w', newline='', encoding='utf-8') as csvfile:
                        writer = csv.DictWriter(csvfile, fieldnames=fieldnames)
                        writer.writeheader()
                        for player in players:
                            # Fill missing keys with empty values
                            row = {key: player.get(key, '') for key in fieldnames}
                            writer.writerow(row)
                    
                    print(f"\n{position}: {len(players)} players -> {csv_filename}")
                
                print("\n" + "="*60)
                print(f"Successfully processed {processed_rows} players")
                print(f"Skipped {skipped_rows} rows")
                print(f"Position tables saved to: {output_dir}")
                print("="*60)
                
        except Exception as e:
            print(f"Error: {e}")
            import traceback
            traceback.print_exc()
