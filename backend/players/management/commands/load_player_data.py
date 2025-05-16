import csv
from django.core.management.base import BaseCommand
from players.models import Player
import os

class Command(BaseCommand):
    help = 'Load player data from CSV file'

    def handle(self, *args, **kwargs):
        try:
            # Clear existing data
            Player.objects.all().delete()
            print("Cleared existing data")
            
            # Get the absolute path to the CSV file
            csv_path = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(__file__)))), 'player_stats.csv')
            print(f"Reading CSV from: {csv_path}")
            
            if not os.path.exists(csv_path):
                print(f"Error: CSV file not found at {csv_path}")
                return
                
            # Read CSV file
            with open(csv_path, 'r', encoding='utf-8') as file:
                # Skip any duplicate headers by reading all lines
                lines = file.readlines()
                # Keep only the first header and data lines (skip duplicate headers)
                data_lines = [line for line in lines if not line.startswith('Player,Nation,') or lines.index(line) == 0]
                
                # Create CSV reader from filtered lines
                csv_reader = csv.DictReader(data_lines)
                players = []
                skipped_rows = 0
                processed_rows = 0
                
                for row in csv_reader:
                    try:
                        # Basic validation
                        if not row.get('Player') or not row.get('Squad'):
                            skipped_rows += 1
                            continue
                            
                        # Create player object using exact column names from CSV
                        player = Player(
                            # Basic Information
                            name=row.get('Player', ''),
                            nation=row.get('Nation', ''),
                            position=row.get('Position', ''),
                            squad=row.get('Squad', ''),
                            competition=row.get('Competition', ''),
                            age=int(float(row.get('Age', 0)) or 0),
                            
                            # Playing Time
                            matches_played=int(float(row.get('Playing Time_MP', 0)) or 0),
                            matches_started=int(float(row.get('Playing Time_Starts', 0)) or 0),
                            minutes_played=int(float(row.get('Playing Time_Min', 0)) or 0),
                            minutes_90s=float(row.get('Playing Time_90s', 0)) or 0,
                            
                            # Performance
                            goals=int(float(row.get('Performance_Gls', 0)) or 0),
                            assists=int(float(row.get('Performance_Ast', 0)) or 0),
                            goals_assists=int(float(row.get('Performance_G+A', 0)) or 0),
                            goals_no_penalty=int(float(row.get('Performance_G-PK', 0)) or 0),
                            penalties_made=int(float(row.get('Performance_PK', 0)) or 0),
                            penalties_attempted=int(float(row.get('Performance_PKatt', 0)) or 0),
                            yellow_cards=int(float(row.get('Performance_CrdY', 0)) or 0),
                            red_cards=int(float(row.get('Performance_CrdR', 0)) or 0),
                            
                            # Expected Stats
                            expected_goals=float(row.get('Expected_xG', 0)) or 0,
                            expected_goals_no_penalty=float(row.get('Expected_npxG', 0)) or 0,
                            expected_assists=float(row.get('Expected_xAG', 0)) or 0,
                            expected_goals_assists=float(row.get('Expected_npxG+xAG', 0)) or 0,
                            
                            # Progression
                            progressive_carries=int(float(row.get('Progression_PrgC', 0)) or 0),
                            progressive_passes=int(float(row.get('Progression_PrgP', 0)) or 0),
                            progressive_dribbles=int(float(row.get('Progression_PrgR', 0)) or 0),
                            
                            # Per 90 Minutes Stats
                            goals_per90=float(row.get('Per 90 Minutes_Gls', 0)) or 0,
                            assists_per90=float(row.get('Per 90 Minutes_Ast', 0)) or 0,
                            goals_assists_per90=float(row.get('Per 90 Minutes_G+A', 0)) or 0,
                            goals_no_penalty_per90=float(row.get('Per 90 Minutes_G-PK', 0)) or 0,
                            goals_assists_no_penalty_per90=float(row.get('Per 90 Minutes_G+A-PK', 0)) or 0,
                            expected_goals_per90=float(row.get('Per 90 Minutes_xG', 0)) or 0,
                            expected_assists_per90=float(row.get('Per 90 Minutes_xAG', 0)) or 0,
                            expected_goals_assists_per90=float(row.get('Per 90 Minutes_xG+xAG', 0)) or 0,
                            expected_goals_no_penalty_per90=float(row.get('Per 90 Minutes_npxG', 0)) or 0,
                            expected_goals_assists_no_penalty_per90=float(row.get('Per 90 Minutes_npxG+xAG', 0)) or 0
                        )
                        players.append(player)
                        processed_rows += 1
                        
                    except Exception as e:
                        print(f"Error processing row: {e}")
                        skipped_rows += 1
                        continue
                
                # Bulk create players
                if players:
                    Player.objects.bulk_create(players)
                    print(f"Successfully loaded {len(players)} players")
                else:
                    print("No players were loaded")
                    
                print(f"\nProcessed {processed_rows + skipped_rows} total rows")
                print(f"Skipped {skipped_rows} rows")
                print(f"Successfully processed {processed_rows} rows")
                
        except Exception as e:
            print(f"Error: {e}") 