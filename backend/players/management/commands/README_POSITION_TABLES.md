# Position-Specific Tables Documentation

## Overview
This command splits the player dataset by position into 11 separate tables (CSV files), each containing position-specific metrics relevant to that role.

## 11 Positions
1. **Goalkeeper** - GK-specific metrics (saves, clean sheets, goals prevented)
2. **Centre-Back** - Defender metrics (tackles, interceptions, aerial duels)
3. **Left-Back** - Defender metrics (tackles, interceptions, aerial duels)
4. **Right-Back** - Defender metrics (tackles, interceptions, aerial duels)
5. **Defensive Midfielder** - Midfielder metrics (key passes, interceptions, dribbles)
6. **Central Midfielder** - Midfielder metrics (key passes, interceptions, dribbles)
7. **Attacking Midfielder** - Midfielder metrics (key passes, interceptions, dribbles)
8. **Left Wing** - Forward metrics (goals, assists, shots on target, dribbles)
9. **Right Wing** - Forward metrics (goals, assists, shots on target, dribbles)
10. **Centre-Forward** - Forward metrics (goals, assists, shots on target, dribbles)
11. **Striker** - Forward metrics (goals, assists, shots on target, dribbles)

## Common Columns (All Positions)
- **Basic Information**: Player, Nation, Squad, Competition, Age
- **Playing Time**: Matches Played, Matches Started, Total Minutes Played, Minutes in 90s
- **Discipline**: Yellow Cards, Red Cards

## Position-Specific Metrics

### Goalkeepers
- Goals Conceded per 90
- Total Goals Conceded
- Saves per 90
- Total Saves
- Clean Sheets
- Clean Sheet Percentage
- Goals Prevented
- Save Percentage
- Punches per 90
- Catches per 90

**Note**: Goals and assists are excluded for goalkeepers.

### Defenders (Centre-Back, Left-Back, Right-Back)
- Tackles per 90
- Total Tackles
- Tackle Success Rate
- Interceptions per 90
- Total Interceptions
- Aerial Duels per 90
- Total Aerial Duels
- Aerial Duel Win Rate
- Passing Accuracy
- Clearances per 90
- Total Clearances
- Blocks per 90
- Total Blocks
- Progressive Passes
- Progressive Carries
- Progressive Dribbles

**Note**: Goals per 90 is not a primary metric but goals/assists are included.

### Midfielders (Defensive, Central, Attacking)
- Key Passes per 90
- Total Key Passes
- Passing Accuracy
- Interceptions per 90
- Total Interceptions
- Dribbles per 90
- Total Dribbles
- Dribble Success Rate
- Goals
- Assists
- Goals + Assists
- Expected Assists
- Expected Assists per 90
- Progressive Passes
- Progressive Carries
- Progressive Dribbles

### Forwards (Left Wing, Right Wing, Centre-Forward, Striker)
- Shots per 90
- Total Shots
- Shots on Target per 90
- Total Shots on Target
- Shot Accuracy
- Conversion Rate
- Dribbles per 90
- Total Dribbles
- Dribble Success Rate
- Goals
- Assists
- Goals + Assists
- Goals per 90
- Assists per 90
- Expected Goals (xG)
- Expected Goals per 90
- Expected Assists
- Expected Assists per 90
- Progressive Carries
- Progressive Dribbles

## Usage

### Split Dataset by Position
```bash
python manage.py load_player_data
```

This will:
1. Read the original `player_stats.csv` file
2. Split players by position (normalizing to 11 standard positions)
3. Generate position-specific metrics where missing
4. Create 11 CSV files in `backend/position_tables/` directory

### Create Backup Before Changes
```bash
python manage.py load_player_data --backup
```

This creates a JSON backup of all current player data in `backend/backups/` directory.

### Revert to Original Dataset
```bash
python manage.py load_player_data --revert
```

This restores the dataset from the most recent backup.

## Generated Metrics

The command generates realistic, position-appropriate metrics based on:
- Real-world football statistics standards
- Existing player data (minutes played, matches, etc.)
- Position-specific performance ranges

All generated metrics are consistent with the dataset and follow realistic distributions.

## Output Files

Position-specific CSV files are saved in:
```
backend/position_tables/
├── goalkeeper_players.csv
├── centre-back_players.csv
├── left-back_players.csv
├── right-back_players.csv
├── defensive_midfielder_players.csv
├── central_midfielder_players.csv
├── attacking_midfielder_players.csv
├── left_wing_players.csv
├── right_wing_players.csv
├── centre-forward_players.csv
└── striker_players.csv
```

## Backup Files

Backup files are saved in:
```
backend/backups/
└── players_backup_YYYYMMDD_HHMMSS.json
```

## Notes

- Players with multiple positions (e.g., "MF,FW") are assigned to the first matching position
- If a player's position cannot be determined, they are skipped
- All generated metrics use realistic ranges based on professional football standards
- The original CSV structure is preserved where possible

