import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Search, TrendingUp, Target, ArrowLeft, CheckCircle2, X, Bookmark, BookmarkCheck, AlertCircle } from 'lucide-react';
import backgroundImage from '../assets/homepage.png';

interface PlayerData {
  id: number;
  name: string;
  squad: string;
  position: string;
  nation?: string;
  competition?: string;
}

interface ComparisonResult {
  player1: PlayerData;
  player2: PlayerData;
  position: string;
  scores: {
    player1: number;
    player2: number;
    winner: 'player1' | 'player2' | 'tie';
    breakdown: {
      [key: string]: {
        player1: number;
        player2: number;
        weight: number;
      };
    };
  };
}

// Position mapping to backend format
const positionMapping: { [key: string]: string } = {
  'Goalkeeper': 'GK',
  'Centre-Back': 'DF',
  'Left-Back': 'DF',
  'Right-Back': 'DF',
  'Defensive Midfielder': 'MF',
  'Central Midfielder': 'MF',
  'Attacking Midfielder': 'MF',
  'Left Wing': 'FW',
  'Right Wing': 'FW',
  'Centre-Forward': 'FW',
  'Striker': 'FW'
};

const ComparePlayers: React.FC = () => {
  const [selectedPosition, setSelectedPosition] = useState<string>('');
  const [searchQuery1, setSearchQuery1] = useState('');
  const [searchQuery2, setSearchQuery2] = useState('');
  const [searchResults1, setSearchResults1] = useState<PlayerData[]>([]);
  const [searchResults2, setSearchResults2] = useState<PlayerData[]>([]);
  const [selectedPlayer1, setSelectedPlayer1] = useState<PlayerData | null>(null);
  const [selectedPlayer2, setSelectedPlayer2] = useState<PlayerData | null>(null);
  const [comparisonResult, setComparisonResult] = useState<ComparisonResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [showResults1, setShowResults1] = useState(false);
  const [showResults2, setShowResults2] = useState(false);
  const [isLoading1, setIsLoading1] = useState(false);
  const [isLoading2, setIsLoading2] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [modalMessage, setModalMessage] = useState('');
  const searchRef1 = useRef<HTMLDivElement>(null);
  const searchRef2 = useRef<HTMLDivElement>(null);
  // Shortlist - load from localStorage on mount
  const [shortlist, setShortlist] = useState<number[]>(() => {
    try {
      const saved = localStorage.getItem('player_shortlist');
      if (saved) {
        const parsed = JSON.parse(saved);
        // Ensure it's an array and contains only numbers
        if (Array.isArray(parsed) && parsed.every(id => typeof id === 'number')) {
          return parsed;
        }
      }
    } catch (error) {
      console.error('Error loading shortlist from localStorage:', error);
    }
    return [];
  });

  const positions = [
    'Goalkeeper', 'Centre-Back', 'Left-Back', 'Right-Back',
    'Defensive Midfielder', 'Central Midfielder', 'Attacking Midfielder',
    'Left Wing', 'Right Wing', 'Centre-Forward', 'Striker'
  ];

  // Clear selections when position changes
  useEffect(() => {
    if (selectedPosition) {
      setSelectedPlayer1(null);
      setSelectedPlayer2(null);
      setSearchQuery1('');
      setSearchQuery2('');
      setSearchResults1([]);
      setSearchResults2([]);
      setComparisonResult(null);
    }
  }, [selectedPosition]);

  const searchPlayers = async (query: string, resultSetter: (results: PlayerData[]) => void, loadingSetter: (loading: boolean) => void) => {
    if (query.length < 1) {
      resultSetter([]);
      return;
    }

    loadingSetter(true);
    try {
      // Build URL with position filter if one is selected
      let url = `http://localhost:8000/api/players/search/?q=${encodeURIComponent(query)}`;
      if (selectedPosition) {
        const positionCode = positionMapping[selectedPosition];
        if (positionCode) {
          url += `&position=${encodeURIComponent(positionCode)}`;
        }
      }
      
      const response = await fetch(url);
      if (response.ok) {
        const data = await response.json();
        resultSetter(data || []);
      } else {
        resultSetter([]);
      }
    } catch (error) {
      console.error('Error searching players:', error);
      resultSetter([]);
    } finally {
      loadingSetter(false);
    }
  };

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      searchPlayers(searchQuery1, setSearchResults1, setIsLoading1);
    }, 200);
    return () => clearTimeout(timeoutId);
  }, [searchQuery1, selectedPosition]);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      searchPlayers(searchQuery2, setSearchResults2, setIsLoading2);
    }, 200);
    return () => clearTimeout(timeoutId);
  }, [searchQuery2, selectedPosition]);

  // Click outside handlers
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef1.current && !searchRef1.current.contains(event.target as Node)) {
        setShowResults1(false);
      }
      if (searchRef2.current && !searchRef2.current.contains(event.target as Node)) {
        setShowResults2(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const comparePlayers = async () => {
    if (!selectedPlayer1 || !selectedPlayer2 || !selectedPosition) return;

    // Check if both players are the same
    if (selectedPlayer1.id === selectedPlayer2.id) {
      setModalMessage('Please select at least 2 different players to compare to each other');
      setShowModal(true);
      setComparisonResult(null);
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('http://localhost:8000/api/players/compare/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          player1_id: selectedPlayer1.id,
          player2_id: selectedPlayer2.id,
          position: selectedPosition
        }),
      });

      if (response.ok) {
        const result = await response.json();
        setComparisonResult(result);
      }
    } catch (error) {
      console.error('Error comparing players:', error);
      setModalMessage('An error occurred while comparing players. Please try again.');
      setShowModal(true);
    } finally {
      setLoading(false);
    }
  };

  const getPositionColor = (position: string) => {
    const pos = position.toLowerCase();
    if (pos.includes('goalkeeper')) return 'from-red-500 to-red-600';
    if (pos.includes('back') || pos.includes('centre-back')) return 'from-blue-500 to-blue-600';
    if (pos.includes('midfielder')) return 'from-green-500 to-green-600';
    if (pos.includes('forward') || pos.includes('striker') || pos.includes('wing')) return 'from-yellow-500 to-yellow-600';
    return 'from-gray-500 to-gray-600';
  };

  const handlePlayerSelect = (player: PlayerData, playerNum: 1 | 2) => {
    if (playerNum === 1) {
      // Check if the selected player is already selected in player2
      if (selectedPlayer2 && selectedPlayer2.id === player.id) {
        setModalMessage('Please select at least 2 different players to compare to each other');
        setShowModal(true);
        return;
      }
      setSelectedPlayer1(player);
      setSearchQuery1(player.name);
      setShowResults1(false);
    } else {
      // Check if the selected player is already selected in player1
      if (selectedPlayer1 && selectedPlayer1.id === player.id) {
        setModalMessage('Please select at least 2 different players to compare to each other');
        setShowModal(true);
        return;
      }
      setSelectedPlayer2(player);
      setSearchQuery2(player.name);
      setShowResults2(false);
    }
    
    // Clear comparison result when players change
    setComparisonResult(null);
  };

  const clearPlayer = (playerNum: 1 | 2) => {
    if (playerNum === 1) {
      setSelectedPlayer1(null);
      setSearchQuery1('');
      setSearchResults1([]);
    } else {
      setSelectedPlayer2(null);
      setSearchQuery2('');
      setSearchResults2([]);
    }
    setComparisonResult(null); // Clear comparison result when clearing a player
  };

  const toggleShortlist = (playerId: number) => {
    setShortlist(prev => {
      const newShortlist = prev.includes(playerId) 
        ? prev.filter(id => id !== playerId)
        : [...prev, playerId];
      try {
        localStorage.setItem('player_shortlist', JSON.stringify(newShortlist));
      } catch (error) {
        console.error('Error saving shortlist to localStorage:', error);
      }
      return newShortlist;
    });
  };

  const isShortlisted = (playerId: number) => shortlist.includes(playerId);

  const getWinnerPlayer = () => {
    if (!comparisonResult || !selectedPlayer1 || !selectedPlayer2) return null;
    if (comparisonResult.scores.winner === 'tie') return null;
    return comparisonResult.scores.winner === 'player1' ? selectedPlayer1 : selectedPlayer2;
  };

  return (
    <div className="relative min-h-screen bg-gray-900">
      {/* Background */}
      <div
        className="fixed inset-0 bg-cover bg-center bg-no-repeat -z-10"
        style={{
          backgroundImage: `linear-gradient(rgba(17, 24, 39, 0.95), rgba(17, 24, 39, 0.95)), url(${backgroundImage})`,
          minHeight: '100vh',
        }}
      />

      {/* Header */}
      <header className="sticky top-0 z-50 bg-gray-800/90 backdrop-blur-xl border-b border-gray-700/50 shadow-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center">
              <Link
                to="/home"
              className="inline-flex items-center text-gray-300 hover:text-white transition-colors duration-200 mr-6 group"
            >
              <motion.div whileHover={{ x: -5 }} transition={{ type: 'spring', stiffness: 400 }}>
                <ArrowLeft size={20} className="mr-2" />
              </motion.div>
              <span>Back to Home</span>
              </Link>
            <h1 className="text-3xl font-bold text-white">Player Comparison</h1>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header Section */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="text-center mb-12"
        >
          <h2 className="text-5xl font-bold text-white mb-4 bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
            Compare Players
          </h2>
          <p className="text-gray-300 text-lg">AI-powered position-specific player analysis</p>
        </motion.div>

        {/* Position Filter */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="relative overflow-hidden rounded-3xl p-8 mb-8 border border-white/10 backdrop-blur-xl bg-gradient-to-br from-gray-900/80 via-gray-800/70 to-gray-900/80 shadow-2xl"
        >
          <div className="flex items-center gap-3 mb-6">
            <div className="p-3 rounded-xl bg-gradient-to-br from-primary-500/20 to-primary-600/20 border border-primary-500/30">
              <Target className="w-6 h-6 text-primary-400" />
            </div>
            <h3 className="text-2xl font-bold text-white">Select Position for Comparison</h3>
            {selectedPosition && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="ml-auto flex items-center gap-2 px-4 py-2 rounded-lg bg-primary-500/20 border border-primary-500/30"
              >
                <CheckCircle2 size={18} className="text-primary-400" />
                <span className="text-sm font-medium text-primary-300">{selectedPosition}</span>
                <button
                  onClick={() => setSelectedPosition('')}
                  className="ml-2 hover:bg-primary-500/30 rounded p-1 transition-colors"
                >
                  <X size={16} className="text-primary-400" />
                </button>
              </motion.div>
            )}
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
            {positions.map((position) => (
              <motion.button
                key={position}
                onClick={() => setSelectedPosition(position)}
                whileHover={{ scale: 1.05, y: -2 }}
                whileTap={{ scale: 0.98 }}
                className={`relative px-4 py-3 rounded-xl text-sm font-semibold transition-all duration-300 border-2 ${
                  selectedPosition === position
                    ? `bg-gradient-to-r ${getPositionColor(position)} text-white shadow-lg border-transparent`
                    : 'bg-gray-800/50 text-gray-300 hover:bg-gray-700/50 border-gray-700 hover:border-gray-600'
                }`}
              >
                {selectedPosition === position && (
                  <motion.div
                    layoutId="selectedPosition"
                    className="absolute inset-0 rounded-xl bg-gradient-to-r opacity-20"
                    style={{ background: `linear-gradient(135deg, var(--tw-gradient-stops))` }}
                    transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                  />
                )}
                <span className="relative z-10">{position}</span>
              </motion.button>
            ))}
          </div>
          
          {!selectedPosition && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="mt-6 p-4 rounded-lg bg-yellow-500/10 border border-yellow-500/20"
            >
              <p className="text-yellow-300 text-sm flex items-center gap-2">
                <Target size={16} />
                Please select a position to filter player recommendations
              </p>
            </motion.div>
          )}
        </motion.div>

        {/* Player Selection */}
        <div className="grid md:grid-cols-2 gap-8 mb-8">
          {/* Player 1 Selection */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
            className="relative overflow-visible rounded-3xl p-8 border border-white/10 backdrop-blur-xl bg-gradient-to-br from-gray-900/80 via-gray-800/70 to-gray-900/80 shadow-2xl"
          >
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-white flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                Player 1
              </h3>
              {selectedPlayer1 && (
                <button
                  onClick={() => clearPlayer(1)}
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  <X size={20} />
                </button>
              )}
            </div>
            
            <div className="relative z-10" ref={searchRef1}>
              <div className="relative">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                  placeholder={
                    selectedPosition
                      ? `Search ${selectedPosition} players...`
                      : "Select a position first..."
                  }
                value={searchQuery1}
                  onChange={(e) => {
                    setSearchQuery1(e.target.value);
                    setShowResults1(true);
                  }}
                  onFocus={() => {
                    if (selectedPosition && searchQuery1.length >= 1) {
                      setShowResults1(true);
                    }
                  }}
                  disabled={!selectedPosition}
                  className="w-full pl-12 pr-4 py-4 bg-gray-800/50 border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                />
                {isLoading1 && (
                  <div className="absolute right-4 top-1/2 transform -translate-y-1/2">
                    <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                  </div>
                )}
              </div>
              
              {showResults1 && searchResults1.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="absolute top-full left-0 right-0 mt-2 bg-gray-900 border-2 border-blue-500/50 rounded-xl shadow-2xl max-h-64 overflow-y-auto z-[100] backdrop-blur-xl"
                  style={{
                    boxShadow: '0 20px 60px rgba(0, 0, 0, 0.8), 0 0 20px rgba(59, 130, 246, 0.3)'
                  }}
                >
                  {searchResults1.map((player) => (
                    <motion.div
                      key={player.id}
                      whileHover={{ backgroundColor: 'rgba(59, 130, 246, 0.2)' }}
                      onClick={() => handlePlayerSelect(player, 1)}
                      className="p-4 cursor-pointer border-b border-gray-700 last:border-b-0 hover:bg-blue-500/20 transition-all duration-200"
                    >
                      <div className="text-white font-bold text-base">{player.name}</div>
                      <div className="text-gray-300 text-sm mt-1 font-medium">{player.squad} • {player.position}</div>
                    </motion.div>
                  ))}
                </motion.div>
              )}
              
              {showResults1 && searchQuery1.length >= 1 && !isLoading1 && searchResults1.length === 0 && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="absolute top-full left-0 right-0 mt-2 bg-gray-900 border-2 border-gray-600 rounded-xl shadow-2xl p-4 z-[100] backdrop-blur-xl"
                  style={{
                    boxShadow: '0 20px 60px rgba(0, 0, 0, 0.8)'
                  }}
                >
                  <p className="text-gray-300 text-center font-medium">
                    {selectedPosition
                      ? `No ${selectedPosition} players found matching "${searchQuery1}"`
                      : 'No players found'}
                  </p>
                </motion.div>
              )}
            </div>
            
            {selectedPlayer1 && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-6 p-5 bg-gradient-to-r from-blue-500/20 to-blue-600/20 border border-blue-500/30 rounded-xl"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-white font-bold text-lg">{selectedPlayer1.name}</div>
                    <div className="text-gray-300 text-sm mt-1">{selectedPlayer1.squad} • {selectedPlayer1.position}</div>
                  </div>
                  <CheckCircle2 className="text-blue-400" size={24} />
              </div>
              </motion.div>
            )}
          </motion.div>

          {/* Player 2 Selection */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4 }}
            className="relative overflow-visible rounded-3xl p-8 border border-white/10 backdrop-blur-xl bg-gradient-to-br from-gray-900/80 via-gray-800/70 to-gray-900/80 shadow-2xl"
          >
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-white flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-purple-500"></div>
                Player 2
              </h3>
              {selectedPlayer2 && (
                <button
                  onClick={() => clearPlayer(2)}
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  <X size={20} />
                </button>
              )}
            </div>
            
            <div className="relative z-10" ref={searchRef2}>
              <div className="relative">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                  placeholder={
                    selectedPosition
                      ? `Search ${selectedPosition} players...`
                      : "Select a position first..."
                  }
                value={searchQuery2}
                  onChange={(e) => {
                    setSearchQuery2(e.target.value);
                    setShowResults2(true);
                  }}
                  onFocus={() => {
                    if (selectedPosition && searchQuery2.length >= 1) {
                      setShowResults2(true);
                    }
                  }}
                  disabled={!selectedPosition}
                  className="w-full pl-12 pr-4 py-4 bg-gray-800/50 border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                />
                {isLoading2 && (
                  <div className="absolute right-4 top-1/2 transform -translate-y-1/2">
                    <div className="w-5 h-5 border-2 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
                  </div>
                )}
              </div>
              
              {showResults2 && searchResults2.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="absolute top-full left-0 right-0 mt-2 bg-gray-900 border-2 border-purple-500/50 rounded-xl shadow-2xl max-h-64 overflow-y-auto z-[100] backdrop-blur-xl"
                  style={{
                    boxShadow: '0 20px 60px rgba(0, 0, 0, 0.8), 0 0 20px rgba(168, 85, 247, 0.3)'
                  }}
                >
                  {searchResults2.map((player) => (
                    <motion.div
                      key={player.id}
                      whileHover={{ backgroundColor: 'rgba(168, 85, 247, 0.2)' }}
                      onClick={() => handlePlayerSelect(player, 2)}
                      className="p-4 cursor-pointer border-b border-gray-700 last:border-b-0 hover:bg-purple-500/20 transition-all duration-200"
                    >
                      <div className="text-white font-bold text-base">{player.name}</div>
                      <div className="text-gray-300 text-sm mt-1 font-medium">{player.squad} • {player.position}</div>
                    </motion.div>
                  ))}
                </motion.div>
              )}
              
              {showResults2 && searchQuery2.length >= 1 && !isLoading2 && searchResults2.length === 0 && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="absolute top-full left-0 right-0 mt-2 bg-gray-900 border-2 border-gray-600 rounded-xl shadow-2xl p-4 z-[100] backdrop-blur-xl"
                  style={{
                    boxShadow: '0 20px 60px rgba(0, 0, 0, 0.8)'
                  }}
                >
                  <p className="text-gray-300 text-center font-medium">
                    {selectedPosition
                      ? `No ${selectedPosition} players found matching "${searchQuery2}"`
                      : 'No players found'}
                  </p>
                </motion.div>
              )}
            </div>
            
            {selectedPlayer2 && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-6 p-5 bg-gradient-to-r from-purple-500/20 to-purple-600/20 border border-purple-500/30 rounded-xl"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-white font-bold text-lg">{selectedPlayer2.name}</div>
                    <div className="text-gray-300 text-sm mt-1">{selectedPlayer2.squad} • {selectedPlayer2.position}</div>
                  </div>
                  <CheckCircle2 className="text-purple-400" size={24} />
              </div>
              </motion.div>
            )}
          </motion.div>
        </div>

        {/* Compare Button - Only show when both players are selected */}
        {selectedPlayer1 && selectedPlayer2 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="flex justify-center mb-12"
          >
            <motion.button
              onClick={comparePlayers}
              disabled={!selectedPosition || loading}
              whileHover={(!selectedPosition || loading) ? {} : { scale: 1.05 }}
              whileTap={(!selectedPosition || loading) ? {} : { scale: 0.98 }}
              className={`relative px-10 py-4 rounded-xl font-bold text-lg flex items-center gap-3 overflow-hidden ${
                !selectedPosition || loading
                  ? 'bg-gray-700 text-gray-400 cursor-not-allowed'
                  : 'bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 text-white shadow-2xl hover:shadow-blue-500/50 transition-all duration-300'
              }`}
            >
              {loading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Analyzing...</span>
                </>
              ) : (
                <>
                  <TrendingUp size={22} />
                  <span>Compare Players</span>
                </>
              )}
            </motion.button>
          </motion.div>
        )}

        {/* Comparison Results */}
        {comparisonResult && (
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            className="relative overflow-hidden rounded-3xl p-10 border border-white/10 backdrop-blur-xl bg-gradient-to-br from-gray-900/80 via-gray-800/70 to-gray-900/80 shadow-2xl"
          >
            <h2 className="text-3xl font-bold text-white mb-8 text-center">Comparison Results</h2>
            
            {/* Winner Display */}
            <div className="text-center mb-10">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', stiffness: 200 }}
                className="relative inline-block"
              >
                <div
                  className="text-5xl font-black mb-4 bg-gradient-to-r bg-clip-text text-transparent"
                  style={{
                    backgroundImage: comparisonResult.scores.winner === 'tie'
                      ? 'linear-gradient(to right, #FBBF24, #F59E0B)'
                      : comparisonResult.scores.winner === 'player1'
                      ? 'linear-gradient(to right, #3B82F6, #60A5FA)'
                      : 'linear-gradient(to right, #A855F7, #C084FC)'
                  }}
                >
                {comparisonResult.scores.winner === 'tie' 
                  ? "It's a Tie!" 
                  : `${comparisonResult.scores.winner === 'player1' ? selectedPlayer1?.name : selectedPlayer2?.name} Wins!`
                }
              </div>
              </motion.div>
              <div className="text-gray-300 text-lg mb-4">
                Position: <span className="font-semibold text-white">{comparisonResult.position}</span>
              </div>
              
              {/* Add Winner to Shortlist Button */}
              {comparisonResult.scores.winner !== 'tie' && getWinnerPlayer() && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="flex items-center justify-center gap-3"
                >
                  <button
                    onClick={() => toggleShortlist(getWinnerPlayer()!.id)}
                    className={`inline-flex items-center gap-2 px-6 py-3 rounded-xl font-semibold transition-all duration-300 ${
                      isShortlisted(getWinnerPlayer()!.id)
                        ? 'bg-yellow-500/20 text-yellow-400 border-2 border-yellow-500/50 hover:bg-yellow-500/30 hover:border-yellow-400'
                        : 'bg-pink-500/20 text-pink-400 border-2 border-pink-500/50 hover:bg-pink-500/30 hover:border-pink-400'
                    }`}
                  >
                    {isShortlisted(getWinnerPlayer()!.id) ? (
                      <>
                        <BookmarkCheck size={20} />
                        <span>Added to Shortlist</span>
                      </>
                    ) : (
                      <>
                        <Bookmark size={20} />
                        <span>Add Winner to Shortlist</span>
                      </>
                    )}
                  </button>
                </motion.div>
              )}
            </div>

            {/* Score Comparison */}
            <div className="grid md:grid-cols-2 gap-6 mb-10">
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className={`relative overflow-hidden rounded-2xl p-8 border-2 transition-all duration-300 ${
                  comparisonResult.scores.winner === 'player1'
                    ? 'bg-gradient-to-br from-blue-500/30 to-blue-600/30 border-blue-400 shadow-2xl shadow-blue-500/30'
                    : 'bg-gradient-to-br from-blue-500/20 to-blue-600/20 border-blue-500/30'
                }`}
              >
                {comparisonResult.scores.winner === 'player1' && (
                  <div className="absolute top-4 right-4">
                    <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse shadow-lg shadow-green-400/50"></div>
                  </div>
                )}
                <div className="text-6xl font-black text-blue-400 mb-3" style={{ textShadow: '0 0 20px rgba(59, 130, 246, 0.5)' }}>
                  {comparisonResult.scores.player1.toFixed(1)}
                </div>
                <div className="text-xs text-gray-400 mb-2 uppercase tracking-wider">Weighted Score</div>
                <div className="text-white font-bold text-xl mb-2">{selectedPlayer1?.name}</div>
                <div className="text-gray-300 text-sm">{selectedPlayer1?.squad} • {selectedPlayer1?.position}</div>
              </motion.div>
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className={`relative overflow-hidden rounded-2xl p-8 border-2 transition-all duration-300 ${
                  comparisonResult.scores.winner === 'player2'
                    ? 'bg-gradient-to-br from-purple-500/30 to-purple-600/30 border-purple-400 shadow-2xl shadow-purple-500/30'
                    : 'bg-gradient-to-br from-purple-500/20 to-purple-600/20 border-purple-500/30'
                }`}
              >
                {comparisonResult.scores.winner === 'player2' && (
                  <div className="absolute top-4 right-4">
                    <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse shadow-lg shadow-green-400/50"></div>
              </div>
                )}
                <div className="text-6xl font-black text-purple-400 mb-3" style={{ textShadow: '0 0 20px rgba(168, 85, 247, 0.5)' }}>
                  {comparisonResult.scores.player2.toFixed(1)}
                </div>
                <div className="text-xs text-gray-400 mb-2 uppercase tracking-wider">Weighted Score</div>
                <div className="text-white font-bold text-xl mb-2">{selectedPlayer2?.name}</div>
                <div className="text-gray-300 text-sm">{selectedPlayer2?.squad} • {selectedPlayer2?.position}</div>
              </motion.div>
            </div>

            {/* Detailed Breakdown */}
            <div>
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-2xl font-semibold text-white">Detailed Analysis</h3>
                
              </div>
              <div className="space-y-4">
                {Object.entries(comparisonResult.scores.breakdown).map(([metric, data], index) => {
                  const player1Raw = (data as any).player1_raw ?? data.player1;
                  const player2Raw = (data as any).player2_raw ?? data.player2;
                  const player1Better = data.player1 > data.player2; // Use normalized scores for comparison
                  const player2Better = data.player2 > data.player1;
                  const player1ZScore = (data as any).player1_zscore || 0;
                  const player2ZScore = (data as any).player2_zscore || 0;
                  const isNegativeWeight = data.weight < 0;
                  
                  // Get user-friendly metric name based on metric
                  const getMetricDisplayName = (metricName: string) => {
                    if (metricName === 'matches_played') {
                      return 'Matches Played';
                    } else if (metricName === 'saves_per90') {
                      return 'Saves per 90';
                    } else if (metricName === 'total_saves') {
                      return 'Total Saves';
                    } else if (metricName === 'clean_sheets') {
                      return 'Clean Sheets';
                    } else if (metricName === 'clean_sheet_percentage') {
                      return 'Clean Sheet %';
                    } else if (metricName === 'goals_prevented') {
                      return 'Goals Prevented';
                    } else if (metricName === 'penalty_saves') {
                      return 'Penalty Saves';
                    } else if (metricName === 'tackles_per90') {
                      return 'Tackles per 90';
                    } else if (metricName === 'total_tackles') {
                      return 'Total Tackles';
                    } else if (metricName === 'interceptions_per90') {
                      return 'Interceptions per 90';
                    } else if (metricName === 'total_interceptions') {
                      return 'Total Interceptions';
                    } else if (metricName === 'aerial_duels_per90') {
                      return 'Aerial Duels per 90';
                    } else if (metricName === 'total_aerial_duels') {
                      return 'Total Aerial Duels';
                    } else if (metricName === 'aerial_duel_win_rate') {
                      return 'Aerial Duel Win Rate %';
                    } else if (metricName === 'passing_accuracy') {
                      return 'Passing Accuracy %';
                    } else if (metricName === 'progressive_passes_per90') {
                      return 'Progressive Passes per 90';
                    } else if (metricName === 'progressive_carries_per90') {
                      return 'Progressive Carries per 90';
                    } else if (metricName === 'goals_per90') {
                      return 'Goals per 90';
                    } else if (metricName === 'assists_per90') {
                      return 'Assists per 90';
                    } else if (metricName === 'key_passes_per90') {
                      return 'Key Passes per 90';
                    } else if (metricName === 'total_key_passes') {
                      return 'Total Key Passes';
                    } else if (metricName === 'expected_goals_per90') {
                      return 'Expected Goals (xG) per 90';
                    } else if (metricName === 'expected_assists_per90') {
                      return 'Expected Assists (xA) per 90';
                    } else if (metricName === 'dribbles_per90') {
                      return 'Dribbles per 90';
                    } else if (metricName === 'total_dribbles') {
                      return 'Total Dribbles';
                    } else if (metricName === 'dribble_success_rate') {
                      return 'Dribble Success Rate %';
                    } else {
                      return metricName.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
                    }
                  };
                  
                  // Format raw value based on metric type
                  const formatValue = (value: number, metricName: string) => {
                    if (metricName === 'matches_played' || 
                        metricName === 'clean_sheets' || 
                        metricName === 'penalty_saves' ||
                        metricName === 'total_saves' ||
                        metricName === 'total_tackles' ||
                        metricName === 'total_interceptions' ||
                        metricName === 'total_aerial_duels' ||
                        metricName === 'total_key_passes' ||
                        metricName === 'total_dribbles') {
                      return Math.round(value).toString();
                    } else if (metricName.includes('percentage') || 
                               metricName.includes('win_rate') || 
                               metricName.includes('accuracy') ||
                               metricName.includes('success_rate')) {
                      return value.toFixed(1);
                    } else if (metricName.includes('per90') || 
                              metricName.includes('progressive') ||
                              metricName === 'goals_prevented') {
                      return value.toFixed(2);
                    } else {
                      return value.toFixed(1);
                    }
                  };
                  
                  // Get unit for metric
                  const getUnit = (metricName: string) => {
                    if (metricName === 'matches_played') {
                      return 'matches';
                    } else if (metricName === 'clean_sheets' || 
                              metricName === 'penalty_saves' ||
                              metricName === 'total_saves' ||
                              metricName === 'total_tackles' ||
                              metricName === 'total_interceptions' ||
                              metricName === 'total_aerial_duels' ||
                              metricName === 'total_key_passes' ||
                              metricName === 'total_dribbles') {
                      return '';
                    } else if (metricName.includes('percentage') || 
                              metricName.includes('win_rate') || 
                              metricName.includes('accuracy') ||
                              metricName.includes('success_rate')) {
                      return '%';
                    } else if (metricName.includes('per90') || 
                              metricName.includes('progressive') ||
                              metricName === 'goals_prevented') {
                      return 'per 90';
                    } else {
                      return '';
                    }
                  };
                  
                  const metricDisplayName = getMetricDisplayName(metric);
                  
                  return (
                    <motion.div
                      key={metric}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="bg-gray-800/50 rounded-xl p-6 border border-gray-700/50 hover:border-gray-600/50 transition-all duration-300"
                    >
                      <div className="flex justify-between items-center mb-4">
                        <span className="text-white font-semibold text-lg">
                          {metricDisplayName}
                          {isNegativeWeight && (
                            <span className="ml-2 text-xs text-yellow-400 font-normal">
                              (Lower is Better)
                            </span>
                          )}
                      </span>
                        <span className="text-gray-400 text-xs px-3 py-1 rounded-full bg-gray-700/50">
                          Weight: {(Math.abs(data.weight) * 100).toFixed(1)}%
                      </span>
                    </div>
                      <div className="grid grid-cols-2 gap-4 mb-3">
                        <div className={`text-center p-4 rounded-lg border-2 transition-all duration-300 ${
                          player1Better
                            ? 'bg-blue-500/20 border-blue-400/50 shadow-lg shadow-blue-500/20'
                            : 'bg-blue-500/10 border-blue-500/20'
                        }`}>
                          <div className="text-blue-400 font-bold text-2xl mb-1">
                            {formatValue(player1Raw, metric)}
                            {getUnit(metric) && <span className="text-sm font-normal text-gray-400 ml-1">{getUnit(metric)}</span>}
                          </div>
                          <div className="text-gray-300 text-xs mb-1">{selectedPlayer1?.name}</div>
                          <div className="text-gray-500 text-xs">
                            Z-Score: {player1ZScore > 0 ? '+' : ''}{player1ZScore.toFixed(2)}
                          </div>
                        </div>
                        <div className={`text-center p-4 rounded-lg border-2 transition-all duration-300 ${
                          player2Better
                            ? 'bg-purple-500/20 border-purple-400/50 shadow-lg shadow-purple-500/20'
                            : 'bg-purple-500/10 border-purple-500/20'
                        }`}>
                          <div className="text-purple-400 font-bold text-2xl mb-1">
                            {formatValue(player2Raw, metric)}
                            {getUnit(metric) && <span className="text-sm font-normal text-gray-400 ml-1">{getUnit(metric)}</span>}
                          </div>
                          <div className="text-gray-300 text-xs mb-1">{selectedPlayer2?.name}</div>
                          <div className="text-gray-500 text-xs">
                            Z-Score: {player2ZScore > 0 ? '+' : ''}{player2ZScore.toFixed(2)}
                          </div>
                        </div>
                      </div>
                      {/* Visual Comparison Bar - based on normalized scores for accurate comparison */}
                      <div className="relative h-2 bg-gray-700 rounded-full overflow-hidden">
                        <div className="absolute inset-0 flex">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${data.player1 + data.player2 > 0 ? (data.player1 / (data.player1 + data.player2)) * 100 : 50}%` }}
                            transition={{ duration: 0.8, delay: index * 0.05 }}
                            className="bg-blue-500/50 h-full"
                          />
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${data.player1 + data.player2 > 0 ? (data.player2 / (data.player1 + data.player2)) * 100 : 50}%` }}
                            transition={{ duration: 0.8, delay: index * 0.05 }}
                            className="bg-purple-500/50 h-full"
                          />
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          </motion.div>
        )}
      </div>

      {/* Error Modal */}
      <AnimatePresence>
        {showModal && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowModal(false)}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[200]"
            />
            
            {/* Modal */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="fixed inset-0 z-[201] flex items-center justify-center p-4"
            >
              <div className="bg-gray-800/95 backdrop-blur-xl rounded-2xl border border-red-500/50 shadow-2xl max-w-md w-full p-6 relative">
                {/* Close Button */}
                <button
                  onClick={() => setShowModal(false)}
                  className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors"
                >
                  <X size={20} />
                </button>
                
                {/* Icon */}
                <div className="flex justify-center mb-4">
                  <div className="w-16 h-16 rounded-full bg-red-500/20 flex items-center justify-center">
                    <AlertCircle className="text-red-400" size={32} />
                  </div>
                </div>
                
                {/* Message */}
                <h3 className="text-xl font-bold text-white text-center mb-2">
                  Invalid Selection
                </h3>
                <p className="text-gray-300 text-center mb-6">
                  {modalMessage}
                </p>
                
                {/* OK Button */}
                <button
                  onClick={() => setShowModal(false)}
                  className="w-full px-6 py-3 bg-gradient-to-r from-red-600 to-red-700 text-white font-semibold rounded-lg hover:from-red-700 hover:to-red-800 transition-all shadow-lg hover:shadow-xl"
                >
                  OK
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ComparePlayers;
