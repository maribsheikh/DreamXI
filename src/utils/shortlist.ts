// Shortlist utility functions using PostgreSQL via API

import { getAuthToken } from './auth';

const API_BASE_URL = 'http://localhost:8000/api';

/**
 * Get the current user's shortlist from PostgreSQL via API
 */
export const getShortlist = async (): Promise<number[]> => {
  try {
    const token = getAuthToken();
    if (!token) {
      return [];
    }

    const response = await fetch(`${API_BASE_URL}/shortlist/`, {
      headers: {
        'Authorization': `Token ${token}`,
      },
    });

    if (response.ok) {
      const data = await response.json();
      return data.player_ids || [];
    }
  } catch (error) {
    console.error('Error fetching shortlist from API:', error);
  }
  return [];
};

/**
 * Get shortlist synchronously (for initial state) - returns cached or empty array
 * This is a fallback for initial component state
 */
export const getShortlistSync = (): number[] => {
  // For initial state, return empty array - will be populated by API call
  return [];
};

/**
 * Add a player to the current user's shortlist via API
 */
export const addToShortlist = async (playerId: number): Promise<boolean> => {
  try {
    const token = getAuthToken();
    if (!token) {
      console.error('No auth token available');
      return false;
    }

    const response = await fetch(`${API_BASE_URL}/shortlist/add/`, {
      method: 'POST',
      headers: {
        'Authorization': `Token ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ player_id: playerId }),
    });

    return response.ok;
  } catch (error) {
    console.error('Error adding to shortlist:', error);
    return false;
  }
};

/**
 * Remove a player from the current user's shortlist via API
 */
export const removeFromShortlist = async (playerId: number): Promise<boolean> => {
  try {
    const token = getAuthToken();
    if (!token) {
      console.error('No auth token available');
      return false;
    }

    const response = await fetch(`${API_BASE_URL}/shortlist/remove/`, {
      method: 'POST',
      headers: {
        'Authorization': `Token ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ player_id: playerId }),
    });

    return response.ok;
  } catch (error) {
    console.error('Error removing from shortlist:', error);
    return false;
  }
};

/**
 * Toggle a player in/out of the current user's shortlist via API
 */
export const toggleShortlist = async (playerId: number): Promise<{ success: boolean; in_shortlist: boolean }> => {
  try {
    const token = getAuthToken();
    if (!token) {
      console.error('No auth token available');
      return { success: false, in_shortlist: false };
    }

    const response = await fetch(`${API_BASE_URL}/shortlist/toggle/`, {
      method: 'POST',
      headers: {
        'Authorization': `Token ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ player_id: playerId }),
    });

    if (response.ok) {
      const data = await response.json();
      return { success: true, in_shortlist: data.in_shortlist || false };
    }
    return { success: false, in_shortlist: false };
  } catch (error) {
    console.error('Error toggling shortlist:', error);
    return { success: false, in_shortlist: false };
  }
};

/**
 * Clear the current user's shortlist via API
 */
export const clearShortlist = async (): Promise<boolean> => {
  try {
    const token = getAuthToken();
    if (!token) {
      console.error('No auth token available');
      return false;
    }

    const response = await fetch(`${API_BASE_URL}/shortlist/clear/`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Token ${token}`,
      },
    });

    return response.ok;
  } catch (error) {
    console.error('Error clearing shortlist:', error);
    return false;
  }
};

/**
 * Check if a player is in the current user's shortlist via API
 */
export const isInShortlist = async (playerId: number): Promise<boolean> => {
  try {
    const shortlist = await getShortlist();
    return shortlist.includes(playerId);
  } catch (error) {
    console.error('Error checking shortlist:', error);
    return false;
  }
};

/**
 * Legacy function for backward compatibility - now uses API
 * @deprecated Use getShortlist() instead
 */
export const saveShortlist = async (shortlist: number[]): Promise<void> => {
  // This function is no longer needed as we use API endpoints
  // But we keep it for backward compatibility
  console.warn('saveShortlist is deprecated. Shortlist is now managed via API.');
};

/**
 * Clean up old shortlist data from localStorage when user logs in
 * This prevents data leakage between users
 */
export const cleanupOldShortlist = (): void => {
  try {
    // Remove all old localStorage shortlist keys
    const keysToRemove: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith('player_shortlist')) {
        keysToRemove.push(key);
      }
    }
    keysToRemove.forEach(key => localStorage.removeItem(key));
  } catch (error) {
    console.error('Error cleaning up old shortlist:', error);
  }
};

