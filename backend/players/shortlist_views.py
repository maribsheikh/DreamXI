from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from django.contrib.auth.models import User
from .models import UserShortlist, Player


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_shortlist(request):
    """Get all shortlisted player IDs for the current user"""
    try:
        shortlisted = UserShortlist.objects.filter(user=request.user).values_list('player_id', flat=True)
        return Response({
            'player_ids': list(shortlisted),
            'count': len(shortlisted)
        }, status=status.HTTP_200_OK)
    except Exception as e:
        return Response(
            {'error': f'Error fetching shortlist: {str(e)}'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def add_to_shortlist(request):
    """Add a player to the user's shortlist"""
    try:
        player_id = request.data.get('player_id')
        
        if not player_id:
            return Response(
                {'error': 'player_id is required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Check if player exists
        try:
            player = Player.objects.get(id=player_id)
        except Player.DoesNotExist:
            return Response(
                {'error': 'Player not found'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        # Check if already in shortlist
        shortlist_item, created = UserShortlist.objects.get_or_create(
            user=request.user,
            player=player
        )
        
        if created:
            return Response({
                'message': 'Player added to shortlist',
                'player_id': player_id
            }, status=status.HTTP_201_CREATED)
        else:
            return Response({
                'message': 'Player already in shortlist',
                'player_id': player_id
            }, status=status.HTTP_200_OK)
            
    except Exception as e:
        return Response(
            {'error': f'Error adding to shortlist: {str(e)}'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def remove_from_shortlist(request):
    """Remove a player from the user's shortlist"""
    try:
        player_id = request.data.get('player_id')
        
        if not player_id:
            return Response(
                {'error': 'player_id is required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Remove from shortlist
        deleted = UserShortlist.objects.filter(
            user=request.user,
            player_id=player_id
        ).delete()
        
        if deleted[0] > 0:
            return Response({
                'message': 'Player removed from shortlist',
                'player_id': player_id
            }, status=status.HTTP_200_OK)
        else:
            return Response({
                'message': 'Player not found in shortlist',
                'player_id': player_id
            }, status=status.HTTP_404_NOT_FOUND)
            
    except Exception as e:
        return Response(
            {'error': f'Error removing from shortlist: {str(e)}'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def toggle_shortlist(request):
    """Toggle a player in/out of the user's shortlist"""
    try:
        player_id = request.data.get('player_id')
        
        if not player_id:
            return Response(
                {'error': 'player_id is required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Check if player exists
        try:
            player = Player.objects.get(id=player_id)
        except Player.DoesNotExist:
            return Response(
                {'error': 'Player not found'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        # Check if in shortlist
        shortlist_item = UserShortlist.objects.filter(
            user=request.user,
            player=player
        ).first()
        
        if shortlist_item:
            # Remove from shortlist
            shortlist_item.delete()
            return Response({
                'message': 'Player removed from shortlist',
                'player_id': player_id,
                'in_shortlist': False
            }, status=status.HTTP_200_OK)
        else:
            # Add to shortlist
            UserShortlist.objects.create(user=request.user, player=player)
            return Response({
                'message': 'Player added to shortlist',
                'player_id': player_id,
                'in_shortlist': True
            }, status=status.HTTP_201_CREATED)
            
    except Exception as e:
        return Response(
            {'error': f'Error toggling shortlist: {str(e)}'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['DELETE'])
@permission_classes([IsAuthenticated])
def clear_shortlist(request):
    """Clear all players from the user's shortlist"""
    try:
        deleted = UserShortlist.objects.filter(user=request.user).delete()
        return Response({
            'message': 'Shortlist cleared',
            'deleted_count': deleted[0]
        }, status=status.HTTP_200_OK)
    except Exception as e:
        return Response(
            {'error': f'Error clearing shortlist: {str(e)}'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

