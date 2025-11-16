import csv
import os
import shutil
from django.core.management import call_command
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from players.models import Player

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def check_admin(request):
    """Check if user is admin"""
    is_admin = request.user.is_staff or request.user.is_superuser
    return Response({
        'is_admin': is_admin,
        'username': request.user.username
    })

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def upload_player_stats(request):
    """Upload and process player_stats.csv file"""
    if not (request.user.is_staff or request.user.is_superuser):
        return Response(
            {'error': 'Permission denied. Admin access required.'},
            status=status.HTTP_403_FORBIDDEN
        )
    
    if 'file' not in request.FILES:
        return Response(
            {'error': 'No file provided'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    file = request.FILES['file']
    
    # Validate file name
    if not file.name.endswith('.csv'):
        return Response(
            {'error': 'File must be a CSV file'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    try:
        # Get the base directory
        base_dir = os.path.dirname(os.path.dirname(os.path.dirname(__file__)))
        csv_path = os.path.join(base_dir, 'player_stats.csv')
        
        # Create backup of existing file if it exists
        if os.path.exists(csv_path):
            backup_path = csv_path + '.backup'
            shutil.copy2(csv_path, backup_path)
        
        # Save the uploaded file
        with open(csv_path, 'wb+') as destination:
            for chunk in file.chunks():
                destination.write(chunk)
        
        # Clear existing players
        Player.objects.all().delete()
        
        # Process the CSV file using the existing management command
        call_command('load_player_data')
        
        # Count players loaded
        player_count = Player.objects.count()
        
        return Response({
            'message': 'Player stats uploaded and processed successfully',
            'players_loaded': player_count,
            'file_name': file.name
        }, status=status.HTTP_200_OK)
        
    except Exception as e:
        return Response(
            {'error': f'Error processing file: {str(e)}'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def upload_team_standings(request):
    """Upload team_standings.csv file"""
    if not (request.user.is_staff or request.user.is_superuser):
        return Response(
            {'error': 'Permission denied. Admin access required.'},
            status=status.HTTP_403_FORBIDDEN
        )
    
    if 'file' not in request.FILES:
        return Response(
            {'error': 'No file provided'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    file = request.FILES['file']
    
    # Validate file name
    if not file.name.endswith('.csv'):
        return Response(
            {'error': 'File must be a CSV file'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    try:
        # Get the base directory
        base_dir = os.path.dirname(os.path.dirname(os.path.dirname(__file__)))
        standings_path = os.path.join(base_dir, 'players', 'management', 'team_standings.csv')
        
        # Create backup of existing file if it exists
        if os.path.exists(standings_path):
            backup_path = standings_path + '.backup'
            shutil.copy2(standings_path, backup_path)
        
        # Save the uploaded file
        with open(standings_path, 'wb+') as destination:
            for chunk in file.chunks():
                destination.write(chunk)
        
        return Response({
            'message': 'Team standings uploaded successfully',
            'file_name': file.name
        }, status=status.HTTP_200_OK)
        
    except Exception as e:
        return Response(
            {'error': f'Error processing file: {str(e)}'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def upload_league_stats(request):
    """Upload League_stats.csv file"""
    if not (request.user.is_staff or request.user.is_superuser):
        return Response(
            {'error': 'Permission denied. Admin access required.'},
            status=status.HTTP_403_FORBIDDEN
        )
    
    if 'file' not in request.FILES:
        return Response(
            {'error': 'No file provided'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    file = request.FILES['file']
    
    # Validate file name
    if not file.name.endswith('.csv'):
        return Response(
            {'error': 'File must be a CSV file'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    try:
        # Get the base directory
        base_dir = os.path.dirname(os.path.dirname(os.path.dirname(__file__)))
        league_stats_path = os.path.join(base_dir, 'League_stats.csv')
        
        # Create backup of existing file if it exists
        if os.path.exists(league_stats_path):
            backup_path = league_stats_path + '.backup'
            shutil.copy2(league_stats_path, backup_path)
        
        # Save the uploaded file
        with open(league_stats_path, 'wb+') as destination:
            for chunk in file.chunks():
                destination.write(chunk)
        
        return Response({
            'message': 'League stats uploaded successfully',
            'file_name': file.name
        }, status=status.HTTP_200_OK)
        
    except Exception as e:
        return Response(
            {'error': f'Error processing file: {str(e)}'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

