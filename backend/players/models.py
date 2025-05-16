from django.db import models

class Player(models.Model):
    # Basic Information
    name = models.CharField(max_length=100)  # Player
    nation = models.CharField(max_length=100)  # Nation
    position = models.CharField(max_length=50)  # Pos
    squad = models.CharField(max_length=100)  # Squad
    competition = models.CharField(max_length=100)  # Competition
    age = models.IntegerField()  # Age
    
    # Playing Time
    matches_played = models.IntegerField()  # Playing Time_MP
    matches_started = models.IntegerField()  # Playing Time_Starts
    minutes_played = models.IntegerField()  # Playing Time_Min
    minutes_90s = models.FloatField()  # Playing Time_90s
    
    # Performance
    goals = models.IntegerField()  # Performance_Gls
    assists = models.IntegerField()  # Performance_Ast
    goals_assists = models.IntegerField()  # Performance_G+A
    goals_no_penalty = models.IntegerField()  # Performance_G-PK
    penalties_made = models.IntegerField()  # Performance_PK
    penalties_attempted = models.IntegerField()  # Performance_PKatt
    yellow_cards = models.IntegerField()  # Performance_CrdY
    red_cards = models.IntegerField()  # Performance_CrdR
    
    # Expected Stats
    expected_goals = models.FloatField()  # Expected_xG
    expected_goals_no_penalty = models.FloatField()  # Expected_npxG
    expected_assists = models.FloatField()  # Expected_xAG
    expected_goals_assists = models.FloatField()  # Expected_npxG+xAG
    
    # Progression
    progressive_carries = models.IntegerField()  # Progression_PrgC
    progressive_passes = models.IntegerField()  # Progression_PrgP
    progressive_dribbles = models.IntegerField()  # Progression_PrgR
    
    # Per 90 Minutes Stats
    goals_per90 = models.FloatField()  # Per 90 Minutes_Gls
    assists_per90 = models.FloatField()  # Per 90 Minutes_Ast
    goals_assists_per90 = models.FloatField()  # Per 90 Minutes_G+A
    goals_no_penalty_per90 = models.FloatField()  # Per 90 Minutes_G-PK
    goals_assists_no_penalty_per90 = models.FloatField()  # Per 90 Minutes_G+A-PK
    expected_goals_per90 = models.FloatField()  # Per 90 Minutes_xG
    expected_assists_per90 = models.FloatField()  # Per 90 Minutes_xAG
    expected_goals_assists_per90 = models.FloatField()  # Per 90 Minutes_xG+xAG
    expected_goals_no_penalty_per90 = models.FloatField()  # Per 90 Minutes_npxG
    expected_goals_assists_no_penalty_per90 = models.FloatField()  # Per 90 Minutes_npxG+xAG

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.name} - {self.squad} ({self.position})"

    class Meta:
        db_table = 'players'
        indexes = [
            models.Index(fields=['name']),
            models.Index(fields=['squad']),
            models.Index(fields=['position']),
            models.Index(fields=['competition']),
        ]
        ordering = ['name'] 