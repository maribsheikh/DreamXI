import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, BookmarkCheck, X, ExternalLink, Trash2, Filter } from 'lucide-react';
import backgroundImage from '../assets/homepage.png';
import { getPlayerImage, getTeamBasedImage, getPositionBasedImage } from '../utils/imageService';
import { getShortlist, clearShortlist as clearShortlistUtil, removeFromShortlist as removeFromShortlistAPI } from '../utils/shortlist';

interface Player {
  id: number;
  name: string;
  squad: string;
  position: string;
  nation: string;
  competition: string;
  age: number;
  matches_played: number;
  goals?: number;
  assists?: number;
  goals_per90?: number;
  assists_per90?: number;
}

interface PlayerWithImage extends Player {
  imageUrl?: string;
  imageLoading?: boolean;
}

const PlayerShortlist: React.FC = () => {
  const [shortlist, setShortlist] = useState<number[]>([]);
  const [players, setPlayers] = useState<PlayerWithImage[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedPosition, setSelectedPosition] = useState<string>('All');

  // Load shortlist from API on mount
  useEffect(() => {
    const loadShortlist = async () => {
      const playerIds = await getShortlist();
      setShortlist(playerIds);
    };
    loadShortlist();
  }, []);

  useEffect(() => {
    fetchShortlistedPlayers();
  }, [shortlist]);

  const fetchGoogleImage = async (playerId: number): Promise<string | null> => {
    try {
      // Use backend endpoint to fetch Google Images
      const response = await fetch(`http://localhost:8000/api/players/${playerId}/player_image/`);
      if (response.ok) {
        const data = await response.json();
        if (data.image_url) {
          return data.image_url;
        }
      }
      return null;
    } catch (error) {
      console.error('Google Images fetch error:', error);
      return null;
    }
  };

  const fetchPlayerImageFromMultipleSources = async (player: Player): Promise<string> => {
    // Strategy 1: Try Wikipedia/Wikidata first (cached, reliable, fast)
    try {
      const wikiImage = await Promise.race([
        getPlayerImage(player.name, player.squad, player.nation),
        new Promise<string>((_, reject) => setTimeout(() => reject(new Error('Timeout')), 3000))
      ]);
      // Check if we got a real image (not the ui-avatars fallback)
      if (wikiImage && !wikiImage.includes('ui-avatars.com')) {
        return wikiImage;
      }
    } catch (error) {
      // Continue to next source
    }

    // Strategy 2: Try Google Images via backend endpoint
    try {
      const googleImage = await fetchGoogleImage(player.id);
      if (googleImage) {
        return googleImage;
      }
    } catch (error) {
      console.error('Google Images fetch failed:', error);
    }

    // Final fallback: team/position avatar (always available)
    return getTeamBasedImage(player.name, player.squad) || getPositionBasedImage(player.name, player.position);
  };

  const fetchShortlistedPlayers = async () => {
    if (shortlist.length === 0) {
      setPlayers([]);
      return;
    }

    setLoading(true);
    try {
      // Fetch all player data in parallel
      const playerPromises = shortlist.map(async (id) => {
        const playerData = await fetch(`http://localhost:8000/api/players/${id}/`)
          .then(res => res.json())
          .catch(() => null);
        
        if (!playerData) return null;
        
        // Start with fallback image immediately for instant display
        const fallbackImage = getTeamBasedImage(playerData.name, playerData.squad) || getPositionBasedImage(playerData.name, playerData.position);
        
        const playerWithImage: PlayerWithImage = {
          ...playerData,
          imageUrl: fallbackImage,
          imageLoading: true, // Show loading initially
        };
        
        // Fetch real image in background (non-blocking)
        fetchPlayerImageFromMultipleSources(playerData)
          .then((imageUrl) => {
            setPlayers(prev => prev.map(p => 
              p.id === id ? { ...p, imageUrl, imageLoading: false } : p
            ));
          })
          .catch((error) => {
            console.error(`Error fetching image for ${playerData.name}:`, error);
            // On error, keep fallback and stop loading
            setPlayers(prev => prev.map(p => 
              p.id === id ? { ...p, imageLoading: false } : p
            ));
          });
        
        return playerWithImage;
      });
      
      const playerData = await Promise.all(playerPromises);
      const validPlayers = playerData.filter(p => p !== null) as PlayerWithImage[];
      setPlayers(validPlayers);
    } catch (error) {
      console.error('Error fetching shortlisted players:', error);
    } finally {
      setLoading(false);
    }
  };

  const removeFromShortlist = async (playerId: number) => {
    const success = await removeFromShortlistAPI(playerId);
    if (success) {
      setShortlist(prev => prev.filter(id => id !== playerId));
    }
  };

  const clearShortlist = async () => {
    const success = await clearShortlistUtil();
    if (success) {
      setShortlist([]);
    }
  };

  // Get unique positions from shortlisted players
  const availablePositions = useMemo(() => {
    const positions = players.map(p => p.position).filter(Boolean);
    const unique = Array.from(new Set(positions)).sort();
    return unique;
  }, [players]);

  // Filter players based on selected position
  const filteredPlayers = useMemo(() => {
    if (selectedPosition === 'All') {
      return players;
    }
    return players.filter(player => player.position === selectedPosition);
  }, [players, selectedPosition]);

  return (
    <div className="min-h-screen bg-gray-900">
      {/* Header */}
      <header className="bg-gray-800 border-b border-gray-700 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-6">
              <Link 
                to="/home" 
                className="inline-flex items-center text-gray-300 hover:text-white transition-colors duration-200"
              >
                <ArrowLeft size={20} className="mr-2" />
                Back to Home
              </Link>
              <h1 className="text-3xl font-bold text-white">Player Shortlist</h1>
            </div>
            {shortlist.length > 0 && (
              <button
                onClick={clearShortlist}
                className="px-4 py-2 bg-red-600/20 text-red-400 hover:bg-red-600/30 rounded-lg border border-red-500/30 transition-all flex items-center gap-2"
              >
                <Trash2 size={18} />
                Clear All
              </button>
            )}
          </div>
        </div>
      </header>

      <div 
        className="relative py-12 bg-cover bg-center"
        style={{
          backgroundImage: `linear-gradient(rgba(17, 24, 39, 0.95), rgba(17, 24, 39, 0.95)), url(${backgroundImage})`,
        }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <div className="w-12 h-12 border-4 border-pink-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : shortlist.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-gray-800/80 backdrop-blur-sm rounded-2xl border border-gray-700 shadow-lg p-12 text-center"
            >
              <BookmarkCheck size={64} className="mx-auto text-gray-600 mb-4" />
              <h2 className="text-2xl font-bold text-white mb-2">Your Shortlist is Empty</h2>
              <p className="text-gray-400 mb-6">Start adding players to your shortlist from the Top Players page</p>
              <Link
                to="/top-players"
                className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-pink-600 to-pink-700 text-white font-semibold rounded-lg hover:from-pink-700 hover:to-pink-800 shadow-lg hover:shadow-xl transition-all"
              >
                Browse Top Players
              </Link>
            </motion.div>
          ) : (
            <>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-gray-800/80 backdrop-blur-sm rounded-2xl border border-gray-700 shadow-lg p-6 mb-6"
              >
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h2 className="text-2xl font-bold text-white mb-2">Your Shortlist</h2>
                    <p className="text-gray-400">
                      {filteredPlayers.length} of {shortlist.length} {shortlist.length === 1 ? 'player' : 'players'} 
                      {selectedPosition !== 'All' && ` (${selectedPosition})`}
                    </p>
                  </div>
                </div>

                {/* Position Filter */}
                {availablePositions.length > 0 && (
                  <div className="mt-4 pt-4 border-t border-gray-700">
                    <div className="flex items-center gap-2 mb-3">
                      <Filter className="text-pink-400" size={20} />
                      <label className="text-sm font-medium text-gray-300">Filter by Position</label>
                    </div>
                    <select
                      value={selectedPosition}
                      onChange={(e) => setSelectedPosition(e.target.value)}
                      className="w-full md:w-auto px-4 py-2.5 bg-gray-800/80 backdrop-blur-sm border border-gray-600/50 rounded-xl text-white shadow-lg transition-all duration-200 hover:bg-gray-700/80 hover:border-pink-500/50 hover:shadow-xl hover:shadow-pink-500/10 focus:outline-none focus:ring-2 focus:ring-pink-500/50 focus:border-pink-500/70 focus:shadow-xl focus:shadow-pink-500/20 cursor-pointer appearance-none"
                      style={{
                        backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%23ffffff' d='M6 9L1 4h10z'/%3E%3C/svg%3E")`,
                        backgroundRepeat: 'no-repeat',
                        backgroundPosition: 'right 1rem center',
                        paddingRight: '2.5rem'
                      }}
                    >
                      <option value="All" className="bg-gray-800 text-white">All Positions</option>
                      {availablePositions.map(position => (
                        <option key={position} value={position} className="bg-gray-800 text-white">{position}</option>
                      ))}
                    </select>
                  </div>
                )}
              </motion.div>

              {filteredPlayers.length === 0 ? (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-gray-800/80 backdrop-blur-sm rounded-2xl border border-gray-700 shadow-lg p-12 text-center"
                >
                  <BookmarkCheck size={64} className="mx-auto text-gray-600 mb-4" />
                  <h2 className="text-2xl font-bold text-white mb-2">No Players Found</h2>
                  <p className="text-gray-400 mb-6">No players match the selected position filter.</p>
                  <button
                    onClick={() => setSelectedPosition('All')}
                    className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-pink-600 to-pink-700 text-white font-semibold rounded-lg hover:from-pink-700 hover:to-pink-800 shadow-lg hover:shadow-xl transition-all"
                  >
                    Show All Players
                  </button>
                </motion.div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredPlayers.map((player) => (
                  <motion.div
                    key={player.id}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="group relative overflow-hidden rounded-2xl border border-gray-700 backdrop-blur-xl bg-gradient-to-br from-gray-900/80 via-gray-800/70 to-gray-900/80 shadow-xl hover:shadow-2xl transition-all duration-300"
                  >
                    <div className="p-6">
                      {/* Player Image */}
                      <div className="flex justify-center mb-4">
                        <div className="relative">
                          <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-pink-500/50 shadow-lg bg-gray-700 relative">
                            {player.imageLoading ? (
                              <div className="w-full h-full bg-gray-700 flex items-center justify-center">
                                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-pink-500"></div>
                              </div>
                            ) : (
                              <img
                                key={player.imageUrl} // Force re-render when image changes
                                src={player.imageUrl || getTeamBasedImage(player.name, player.squad)}
                                alt={player.name}
                                className="w-full h-full object-cover object-top transition-opacity duration-300"
                                style={{ objectPosition: 'center 20%' }}
                                loading="lazy"
                                crossOrigin="anonymous"
                                onError={(e) => {
                                  const target = e.currentTarget as HTMLImageElement;
                                  if (!target.src.includes('ui-avatars.com')) {
                                    target.src = getPositionBasedImage(player.name, player.position);
                                  }
                                }}
                                onLoad={() => {
                                  // Image loaded successfully
                                  setPlayers(prev => prev.map(p => 
                                    p.id === player.id ? { ...p, imageLoading: false } : p
                                  ));
                                }}
                              />
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1 text-center">
                          <Link
                            to={`/player-stats/${player.id}`}
                            className="text-xl font-bold text-white hover:text-pink-400 transition-colors block mb-1"
                          >
                            {player.name}
                          </Link>
                          <p className="text-gray-400 text-sm">{player.nation}</p>
                        </div>
                        <button
                          onClick={() => removeFromShortlist(player.id)}
                          className="p-2 text-gray-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all"
                          title="Remove from shortlist"
                        >
                          <X size={20} />
                        </button>
                      </div>

                      <div className="space-y-3 mb-4">
                        <div className="flex items-center justify-between">
                          <span className="text-gray-400 text-sm">Team</span>
                          <span className="text-white font-semibold">{player.squad}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-gray-400 text-sm">Position</span>
                          <span className="px-2 py-1 text-xs font-medium rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/30">
                            {player.position}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-gray-400 text-sm">League</span>
                          <span className="text-white font-medium text-sm">{player.competition}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-gray-400 text-sm">Matches</span>
                          <span className="text-white font-semibold">{player.matches_played}</span>
                        </div>
                        {player.goals !== undefined && !player.position?.toLowerCase().includes('goalkeeper') && !player.position?.toLowerCase().includes('gk') && (
                          <div className="flex items-center justify-between">
                            <span className="text-gray-400 text-sm">Goals</span>
                            <span className="text-white font-semibold">{player.goals}</span>
                          </div>
                        )}
                        {player.assists !== undefined && !player.position?.toLowerCase().includes('goalkeeper') && !player.position?.toLowerCase().includes('gk') && (
                          <div className="flex items-center justify-between">
                            <span className="text-gray-400 text-sm">Assists</span>
                            <span className="text-white font-semibold">{player.assists}</span>
                          </div>
                        )}
                      </div>

                      <div className="pt-4 border-t border-gray-700">
                        <Link
                          to={`/player-stats/${player.id}`}
                          className="w-full px-4 py-2 bg-blue-600/20 text-blue-400 hover:bg-blue-600/30 rounded-lg border border-blue-500/30 text-center text-sm font-medium transition-all flex items-center justify-center gap-2"
                        >
                          <ExternalLink size={16} />
                          View Profile
                        </Link>
                      </div>
                    </div>
                  </motion.div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default PlayerShortlist;

