from rest_framework import serializers
from .models import Player

class PlayerSerializer(serializers.ModelSerializer):
    class Meta:
        model = Player
        fields = '__all__'

class PlayerSearchSerializer(serializers.ModelSerializer):
    team = serializers.CharField(source='squad')  # Map 'squad' to 'team' for frontend compatibility
    
    class Meta:
        model = Player
        fields = ['id', 'name', 'team', 'position', 'nation']  # Using 'nation' instead of 'nationality' 