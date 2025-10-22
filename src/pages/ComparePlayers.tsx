import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Search, Users, Trophy, TrendingUp, Target, Zap, Home, ArrowLeft, LogOut } from 'lucide-react';
import { PlayerData } from '../types';
import backgroundImage from '../assets/homepage.png';

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
  const searchRef1 = useRef<HTMLDivElement>(null);
  const searchRef2 = useRef<HTMLDivElement>(null);

  const positions = [
    'Goalkeeper', 'Centre-Back', 'Left-Back', 'Right-Back',
    'Defensive Midfielder', 'Central Midfielder', 'Attacking Midfielder',
    'Left Wing', 'Right Wing', 'Centre-Forward', 'Striker'
  ];

  const searchPlayers = async (query: string, resultSetter: (results: PlayerData[]) => void) => {
    if (query.length < 1) {
      resultSetter([]);
      return;
    }

    try {
      const response = await fetch(`http://localhost:8000/api/players/search/?q=${encodeURIComponent(query)}`);
      if (response.ok) {
        const data = await response.json();
        let results = data || []; // API returns array directly, not wrapped in results
        
        // Filter by selected position if one is chosen
        if (selectedPosition) {
          results = results.filter((player: PlayerData) => {
            const playerPos = player.position.toLowerCase();
            const selectedPos = selectedPosition.toLowerCase();
            
            // Check for exact position match or partial match in either direction
            return playerPos === selectedPos || 
                   playerPos.includes(selectedPos) || 
                   selectedPos.includes(playerPos);
          });
        }
        
        resultSetter(results);
      }
    } catch (error) {
      console.error('Error searching players:', error);
    }
  };

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      searchPlayers(searchQuery1, setSearchResults1);
    }, 150);
    return () => clearTimeout(timeoutId);
  }, [searchQuery1, selectedPosition]);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      searchPlayers(searchQuery2, setSearchResults2);
    }, 150);
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
    } finally {
      setLoading(false);
    }
  };

  const getPositionColor = (position: string) => {
    const pos = position.toLowerCase();
    if (pos.includes('goalkeeper')) return 'bg-red-600';
    if (pos.includes('defender') || pos.includes('back')) return 'bg-blue-600';
    if (pos.includes('midfielder')) return 'bg-green-600';
    if (pos.includes('forward') || pos.includes('striker') || pos.includes('wing')) return 'bg-yellow-600';
    return 'bg-gray-600';
  };

  return (
    <div 
      className="min-h-screen bg-gray-900"
    >
      {/* Header */}
      <header className="bg-gray-800 border-b border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <Link to="/home" className="text-white font-bold text-xl">DreamXI</Link>
            <div className="flex items-center gap-4">
              <Link
                to="/home"
                className="inline-flex items-center px-4 py-2 bg-gray-700 rounded-lg text-white hover:bg-gray-600 transition-all duration-300 group"
              >
                <Home size={18} className="mr-2" />
                <span>Home</span>
              </Link>
            </div>
          </div>
        </div>
      </header>

      <div 
        className="relative py-12 bg-cover bg-center"
        style={{
          backgroundImage: `linear-gradient(rgba(17, 24, 39, 0.9), rgba(17, 24, 39, 0.9)), url(${backgroundImage})`,
        }}
      >
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="text-center mb-12"
        >
          <h1 className="text-4xl font-bold text-white mb-4">Player Comparison</h1>
          <p className="text-gray-300 text-lg">Compare players with AI-powered position-specific analysis</p>
        </motion.div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">

        {/* Position Filter */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-gray-800/80 backdrop-blur-sm rounded-2xl p-6 mb-8 border border-gray-700 shadow-lg"
        >
          <h2 className="text-xl font-semibold text-white mb-4 flex items-center">
            <Target className="mr-2" />
            Select Position for Comparison
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
            {positions.map((position) => (
              <button
                key={position}
                onClick={() => setSelectedPosition(position)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  selectedPosition === position
                    ? `${getPositionColor(position)} text-white shadow-lg`
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                }`}
              >
                {position}
              </button>
            ))}
          </div>
        </motion.div>

        {/* Player Selection */}
        <div className="grid md:grid-cols-2 gap-8 mb-8">
          {/* Player 1 Selection */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-gray-800/80 backdrop-blur-sm rounded-2xl p-6 border border-gray-700 shadow-lg"
          >
            <h3 className="text-lg font-semibold text-white mb-4">Player 1</h3>
            <div className="relative" ref={searchRef1}>
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                placeholder={selectedPosition ? `Search ${selectedPosition} players...` : "Search for player..."}
                value={searchQuery1}
                onChange={(e) => setSearchQuery1(e.target.value)}
                onFocus={() => setShowResults1(true)}
                className="w-full pl-10 pr-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              {showResults1 && searchResults1.length > 0 && (
                <div className="absolute top-full left-0 right-0 bg-gray-700 border border-gray-600 rounded-lg mt-1 max-h-60 overflow-y-auto z-10">
                  {searchResults1.map((player) => (
                    <div
                      key={player.id}
                      onClick={() => {
                        setSelectedPlayer1(player);
                        setSearchQuery1(player.name);
                        setShowResults1(false);
                      }}
                      className="p-3 hover:bg-gray-600 cursor-pointer border-b border-gray-600 last:border-b-0"
                    >
                      <div className="text-white font-medium">{player.name}</div>
                      <div className="text-gray-400 text-sm">{player.squad} • {player.position}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            {selectedPlayer1 && (
              <div className="mt-4 p-4 bg-gray-700 rounded-lg">
                <div className="text-white font-medium">{selectedPlayer1.name}</div>
                <div className="text-gray-400 text-sm">{selectedPlayer1.squad} • {selectedPlayer1.position}</div>
              </div>
            )}
          </motion.div>

          {/* Player 2 */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-gray-800/80 backdrop-blur-sm rounded-2xl p-6 border border-gray-700 shadow-lg"
          >
            <h3 className="text-lg font-semibold text-white mb-4">Player 2</h3>
            <div className="relative" ref={searchRef2}>
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                placeholder={selectedPosition ? `Search ${selectedPosition} players...` : "Search for player..."}
                value={searchQuery2}
                onChange={(e) => setSearchQuery2(e.target.value)}
                onFocus={() => setShowResults2(true)}
                className="w-full pl-10 pr-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              {showResults2 && searchResults2.length > 0 && (
                <div className="absolute top-full left-0 right-0 bg-gray-700 border border-gray-600 rounded-lg mt-1 max-h-60 overflow-y-auto z-10">
                  {searchResults2.map((player) => (
                    <div
                      key={player.id}
                      onClick={() => {
                        setSelectedPlayer2(player);
                        setSearchQuery2(player.name);
                        setShowResults2(false);
                      }}
                      className="p-3 hover:bg-gray-600 cursor-pointer border-b border-gray-600 last:border-b-0"
                    >
                      <div className="text-white font-medium">{player.name}</div>
                      <div className="text-gray-400 text-sm">{player.squad} • {player.position}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            {selectedPlayer2 && (
              <div className="mt-4 p-4 bg-gray-700 rounded-lg">
                <div className="text-white font-medium">{selectedPlayer2.name}</div>
                <div className="text-gray-400 text-sm">{selectedPlayer2.squad} • {selectedPlayer2.position}</div>
              </div>
            )}
          </motion.div>
        </div>

        {/* Compare Button */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="flex justify-center mb-12"
        >
          <button
            onClick={comparePlayers}
            disabled={!selectedPlayer1 || !selectedPlayer2 || !selectedPosition || loading}
            className={`px-8 py-3 rounded-xl font-semibold flex items-center ${
              !selectedPlayer1 || !selectedPlayer2 || !selectedPosition
                ? 'bg-gray-700 text-gray-400 cursor-not-allowed'
                : 'bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:from-blue-700 hover:to-purple-700 shadow-lg transform hover:scale-105 transition-all duration-300'
            }`}
          >
            {loading ? (
              <span className="flex items-center">
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Analyzing...
              </span>
            ) : (
              <span className="flex items-center">
                <TrendingUp size={20} className="mr-2" />
                Compare Players
              </span>
            )}
          </button>
        </motion.div>

        {/* Comparison Results */}
        {comparisonResult && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-gray-800/50 backdrop-blur-sm rounded-2xl p-8 border border-gray-700"
          >
            <h2 className="text-2xl font-bold text-white mb-6 text-center">Comparison Results</h2>
            
            {/* Winner Display */}
            <div className="text-center mb-8">
              <div className="text-3xl font-bold text-green-400 mb-2">
                {comparisonResult.scores.winner === 'tie' 
                  ? "It's a Tie!" 
                  : `${comparisonResult.scores.winner === 'player1' ? selectedPlayer1?.name : selectedPlayer2?.name} Wins!`
                }
              </div>
              <div className="text-gray-300">
                Position: <span className="font-semibold">{comparisonResult.position}</span>
              </div>
            </div>

            {/* Score Comparison */}
            <div className="grid md:grid-cols-2 gap-6 mb-8">
              <div className="text-center p-6 bg-gray-700 rounded-xl">
                <div className="text-4xl font-bold text-blue-400 mb-2">
                  {comparisonResult.scores.player1.toFixed(1)}
                </div>
                <div className="text-white font-medium">{selectedPlayer1?.name}</div>
                <div className="text-gray-400 text-sm">{selectedPlayer1?.squad}</div>
              </div>
              <div className="text-center p-6 bg-gray-700 rounded-xl">
                <div className="text-4xl font-bold text-purple-400 mb-2">
                  {comparisonResult.scores.player2.toFixed(1)}
                </div>
                <div className="text-white font-medium">{selectedPlayer2?.name}</div>
                <div className="text-gray-400 text-sm">{selectedPlayer2?.squad}</div>
              </div>
            </div>

            {/* Detailed Breakdown */}
            <div>
              <h3 className="text-xl font-semibold text-white mb-4">Detailed Analysis</h3>
              <div className="space-y-4">
                {Object.entries(comparisonResult.scores.breakdown).map(([metric, data]) => (
                  <div key={metric} className="bg-gray-700 rounded-lg p-4">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-white font-medium capitalize">
                        {metric.replace(/_/g, ' ')}
                      </span>
                      <span className="text-gray-400 text-sm">
                        Weight: {(data.weight * 100).toFixed(1)}%
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="text-center">
                        <div className="text-blue-400 font-bold text-lg">
                          {data.player1.toFixed(1)}
                        </div>
                        <div className="text-gray-400 text-sm">{selectedPlayer1?.name}</div>
                      </div>
                      <div className="text-center">
                        <div className="text-purple-400 font-bold text-lg">
                          {data.player2.toFixed(1)}
                        </div>
                        <div className="text-gray-400 text-sm">{selectedPlayer2?.name}</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default ComparePlayers;
