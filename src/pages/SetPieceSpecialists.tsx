import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Target, Filter, Search, Bookmark, Check } from 'lucide-react';
import backgroundImage from '../assets/homepage.png';
import { getShortlist, toggleShortlist as toggleShortlistAPI } from '../utils/shortlist';

interface Specialist {
  player_id: number;
  player: string;
  squad: string;
  competition: string;
  position: string;
  age: number;
  penalty_accuracy: number | null;
  penalties_made: number;
  penalties_attempted: number;
  free_kick_goals: number;
  free_kick_goals_per90: number;
  corner_assists: number;
  corner_assists_per90: number;
  set_piece_score: number;
  minutes_90s: number;
}

const SetPieceSpecialists: React.FC = () => {
  const [specialists, setSpecialists] = useState<Specialist[]>([]);
  const [loading, setLoading] = useState(false);
  const [total, setTotal] = useState(0);
  
  // Filters
  const [selectedLeague, setSelectedLeague] = useState<string>('All');
  const [selectedPosition, setSelectedPosition] = useState<string>('All');
  const [ageMin, setAgeMin] = useState<string>('');
  const [ageMax, setAgeMax] = useState<string>('');
  const [minMinutes, setMinMinutes] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [showFilters, setShowFilters] = useState(false);
  const [sortField, setSortField] = useState<string>('penalty_accuracy');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  
  // Shortlist - load from API on mount
  const [shortlist, setShortlist] = useState<number[]>([]);

  // Load shortlist from API on mount
  useEffect(() => {
    const loadShortlist = async () => {
      const playerIds = await getShortlist();
      setShortlist(playerIds);
    };
    loadShortlist();
  }, []);
  
  const positions = ['All', 'GK', 'DF', 'MF', 'FW'];
  const leagues = ['All', 'Premier League', 'La Liga', 'Bundesliga', 'Serie A', 'Ligue 1'];

  useEffect(() => {
    fetchSpecialists();
  }, [selectedLeague, selectedPosition, ageMin, ageMax, minMinutes]);

  const fetchSpecialists = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (selectedLeague !== 'All') {
        params.append('league', selectedLeague);
      }
      if (selectedPosition !== 'All') {
        params.append('position', selectedPosition);
      }
      if (ageMin) {
        params.append('age_min', ageMin);
      }
      if (ageMax) {
        params.append('age_max', ageMax);
      }
      if (minMinutes) {
        params.append('min_minutes', minMinutes);
      }

      const response = await fetch(`http://localhost:8000/api/players/set_piece_specialists/?${params.toString()}`);
      if (!response.ok) {
        throw new Error('Failed to fetch specialists');
      }
      const data = await response.json();
      setSpecialists(data.specialists || []);
      setTotal(data.total || 0);
    } catch (error) {
      console.error('Error fetching specialists:', error);
      setSpecialists([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  };

  const filteredAndSortedSpecialists = specialists
    .filter(specialist => {
      if (!searchQuery) return true;
      const query = searchQuery.toLowerCase();
      return (
        specialist.player.toLowerCase().includes(query) ||
        specialist.squad.toLowerCase().includes(query) ||
        specialist.competition.toLowerCase().includes(query)
      );
    })
    .sort((a, b) => {
      let aVal: any = a[sortField as keyof Specialist];
      let bVal: any = b[sortField as keyof Specialist];
      
      // Handle null/undefined values - put them at the end
      if (aVal === null || aVal === undefined) return 1;
      if (bVal === null || bVal === undefined) return -1;
      
      if (typeof aVal === 'string') {
        aVal = aVal.toLowerCase();
        bVal = bVal.toLowerCase();
      }
      
      if (sortDirection === 'asc') {
        return aVal > bVal ? 1 : aVal < bVal ? -1 : 0;
      } else {
        return aVal < bVal ? 1 : aVal > bVal ? -1 : 0;
      }
    });

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  const toggleShortlist = async (playerId: number) => {
    const result = await toggleShortlistAPI(playerId);
    if (result.success) {
      setShortlist(prev => {
        if (result.in_shortlist) {
          return prev.includes(playerId) ? prev : [...prev, playerId];
        } else {
          return prev.filter(id => id !== playerId);
        }
      });
    }
  };

  const isShortlisted = (playerId: number) => shortlist.includes(playerId);

  const getPositionColor = (position: string) => {
    const pos = position.toLowerCase();
    if (pos.includes('goalkeeper') || pos.includes('gk')) return 'bg-red-600';
    if (pos.includes('defender') || pos.includes('cb') || pos.includes('lb') || pos.includes('rb')) return 'bg-blue-600';
    if (pos.includes('midfielder') || pos.includes('cm') || pos.includes('cdm') || pos.includes('cam')) return 'bg-green-600';
    if (pos.includes('forward') || pos.includes('st') || pos.includes('lw') || pos.includes('rw') || pos.includes('cf')) return 'bg-yellow-600';
    return 'bg-gray-600';
  };

  const getScoreColor = (score: number) => {
    if (score >= 2.0) return 'text-green-400 font-bold';
    if (score >= 1.0) return 'text-yellow-400 font-semibold';
    if (score >= 0.5) return 'text-orange-400';
    return 'text-gray-400';
  };

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
              <h1 className="text-3xl font-bold text-white">Set-piece Specialists</h1>
            </div>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-2 px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
            >
              <Filter size={18} />
              Filters
            </button>
          </div>
        </div>
      </header>

      <div 
        className="relative bg-cover bg-center flex flex-col"
        style={{
          backgroundImage: `linear-gradient(rgba(17, 24, 39, 0.95), rgba(17, 24, 39, 0.95)), url(${backgroundImage})`,
          minHeight: 'calc(100vh - 64px)',
        }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex-1 flex flex-col py-6">
        {/* Filters Panel */}
        {showFilters && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-gray-800/80 backdrop-blur-sm rounded-2xl p-4 md:p-6 mb-4 border border-gray-700 shadow-lg flex-shrink-0"
          >
            <div className="flex items-center gap-2 mb-6">
              <Filter className="text-blue-400" size={24} />
              <h2 className="text-xl font-semibold text-white">Filters</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">League</label>
                <select
                  value={selectedLeague}
                  onChange={(e) => setSelectedLeague(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-700 text-white rounded-lg border border-gray-600 focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  {leagues.map(league => (
                    <option key={league} value={league === 'All' ? 'All' : league}>
                      {league}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Position</label>
                <select
                  value={selectedPosition}
                  onChange={(e) => setSelectedPosition(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-700 text-white rounded-lg border border-gray-600 focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  {positions.map(pos => (
                    <option key={pos} value={pos}>{pos}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Min Age</label>
                <input
                  type="number"
                  value={ageMin}
                  onChange={(e) => setAgeMin(e.target.value)}
                  placeholder="Any"
                  className="w-full px-3 py-2 bg-gray-700 text-white rounded-lg border border-gray-600 focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Max Age</label>
                <input
                  type="number"
                  value={ageMax}
                  onChange={(e) => setAgeMax(e.target.value)}
                  placeholder="Any"
                  className="w-full px-3 py-2 bg-gray-700 text-white rounded-lg border border-gray-600 focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Min Minutes</label>
                <input
                  type="number"
                  value={minMinutes}
                  onChange={(e) => setMinMinutes(e.target.value)}
                  placeholder="Any"
                  className="w-full px-3 py-2 bg-gray-700 text-white rounded-lg border border-gray-600 focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
            </div>
          </motion.div>
        )}

        {/* Search Bar */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-4 flex-shrink-0"
        >
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by player name, squad, or league..."
              className="w-full pl-10 pr-4 py-3 bg-gray-800/80 backdrop-blur-sm text-white rounded-lg border border-gray-700 focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>
        </motion.div>

        {/* Stats Summary */}
        <div className="mb-4 flex items-center justify-between flex-shrink-0">
          <div className="text-gray-300 text-sm">
            Showing <span className="font-semibold text-white">{filteredAndSortedSpecialists.length}</span> of{' '}
            <span className="font-semibold text-white">{total}</span> specialists
          </div>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="flex justify-center items-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500"></div>
          </div>
        )}

        {/* Table */}
        {!loading && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-gray-800/80 backdrop-blur-sm rounded-2xl border border-gray-700 shadow-xl overflow-hidden flex flex-col flex-1 min-h-0"
          >
            <div className="p-4 md:p-6 border-b border-gray-700/50 flex-shrink-0">
              <h2 className="text-xl md:text-2xl font-bold text-white">Set-piece Specialists</h2>
              <p className="text-xs md:text-sm text-gray-400 mt-1">Players ranked by penalty accuracy and set-piece contributions</p>
            </div>
            <div className="overflow-hidden flex-1 min-h-0">
              <div className="h-full overflow-auto scrollbar-hide" style={{
                scrollbarWidth: 'none',
                msOverflowStyle: 'none',
              }}>
                <style>{`
                  .scrollbar-hide::-webkit-scrollbar {
                    display: none;
                  }
                `}</style>
                <table className="w-full">
                <thead className="bg-gradient-to-r from-gray-700/60 to-gray-700/40 border-b border-gray-600/50">
                  <tr>
                    <th className="px-2 md:px-4 lg:px-6 py-4 text-left text-xs font-bold text-gray-200 uppercase tracking-wider border-r border-gray-600/30 w-12">
                      Rank
                    </th>
                    <th className="px-2 md:px-4 lg:px-6 py-4 text-left text-xs font-bold text-gray-200 uppercase tracking-wider min-w-[120px]">
                      Player
                    </th>
                    <th className="px-2 md:px-4 lg:px-6 py-4 text-left text-xs font-bold text-gray-200 uppercase tracking-wider hidden md:table-cell min-w-[100px]">
                      Squad
                    </th>
                    <th className="px-2 md:px-4 lg:px-6 py-4 text-left text-xs font-bold text-gray-200 uppercase tracking-wider hidden lg:table-cell min-w-[120px]">
                      Competition
                    </th>
                    <th className="px-2 md:px-4 lg:px-6 py-4 text-left text-xs font-bold text-gray-200 uppercase tracking-wider w-20">
                      Position
                    </th>
                    <th className="px-2 md:px-4 lg:px-6 py-4 text-center text-xs font-bold text-gray-200 uppercase tracking-wider border-l border-gray-600/30 w-16">
                      Age
                    </th>
                    <th 
                      className="px-2 md:px-4 lg:px-6 py-4 text-center text-xs font-bold text-gray-200 uppercase tracking-wider border-l border-gray-600/30 bg-primary-500/10 min-w-[100px] cursor-pointer hover:bg-primary-500/20 transition-colors"
                      onClick={() => handleSort('penalty_accuracy')}
                    >
                      <div className="flex items-center justify-center gap-1">
                        <span className="hidden sm:inline">Penalty </span>Accuracy
                        {sortField === 'penalty_accuracy' && (
                          <span className="text-primary-400">{sortDirection === 'asc' ? '↑' : '↓'}</span>
                        )}
                      </div>
                    </th>
                    <th 
                      className="px-2 md:px-4 lg:px-6 py-4 text-center text-xs font-bold text-gray-200 uppercase tracking-wider border-l border-gray-600/30 min-w-[90px] cursor-pointer hover:bg-gray-700/30 transition-colors"
                      onClick={() => handleSort('free_kick_goals')}
                    >
                      <div className="flex items-center justify-center gap-1">
                        <span className="hidden sm:inline">Free-Kick </span>Goals
                        {sortField === 'free_kick_goals' && (
                          <span className="text-primary-400">{sortDirection === 'asc' ? '↑' : '↓'}</span>
                        )}
                      </div>
                    </th>
                    <th 
                      className="px-2 md:px-4 lg:px-6 py-4 text-center text-xs font-bold text-gray-200 uppercase tracking-wider border-l border-gray-600/30 min-w-[90px] cursor-pointer hover:bg-gray-700/30 transition-colors"
                      onClick={() => handleSort('corner_assists')}
                    >
                      <div className="flex items-center justify-center gap-1">
                        <span className="hidden sm:inline">Corner </span>Assists
                        {sortField === 'corner_assists' && (
                          <span className="text-primary-400">{sortDirection === 'asc' ? '↑' : '↓'}</span>
                        )}
                      </div>
                    </th>
                    <th className="px-2 md:px-4 lg:px-6 py-4 text-center text-xs font-bold text-gray-200 uppercase tracking-wider border-l border-gray-600/30 bg-yellow-500/10 min-w-[100px]">
                      Score
                    </th>
                    <th className="px-2 md:px-4 lg:px-6 py-4 text-center text-xs font-bold text-gray-200 uppercase tracking-wider border-l border-gray-600/30 w-20">
                      Action
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-700/50">
                  {filteredAndSortedSpecialists.length === 0 ? (
                    <tr>
                      <td colSpan={11} className="px-4 md:px-6 py-12 md:py-16 text-center">
                        <div className="flex flex-col items-center">
                          <div className="text-gray-400 text-base md:text-lg mb-2">No specialists found</div>
                          <div className="text-gray-500 text-sm">Try adjusting your filters</div>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    filteredAndSortedSpecialists.map((specialist, index) => (
                      <motion.tr
                        key={specialist.player_id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.01 }}
                        className="hover:bg-gray-700/40 transition-all duration-200 border-b border-gray-700/30"
                      >
                        <td className="px-2 md:px-4 lg:px-6 py-4 md:py-5 whitespace-nowrap border-r border-gray-700/30">
                          <div className="flex items-center justify-center">
                            <span className={`inline-flex items-center justify-center w-7 h-7 md:w-8 md:h-8 rounded-full text-xs md:text-sm font-bold ${
                              index === 0 ? 'bg-gradient-to-br from-yellow-500 to-yellow-600 text-white shadow-lg shadow-yellow-500/30' :
                              index === 1 ? 'bg-gradient-to-br from-gray-400 to-gray-500 text-white shadow-lg shadow-gray-400/30' :
                              index === 2 ? 'bg-gradient-to-br from-orange-500 to-orange-600 text-white shadow-lg shadow-orange-500/30' :
                              'bg-gray-700/50 text-gray-300'
                            }`}>
                              {index + 1}
                            </span>
                          </div>
                        </td>
                        <td className="px-2 md:px-4 lg:px-6 py-4 md:py-5">
                          <Link
                            to={`/player-stats/${specialist.player_id}`}
                            className="group flex flex-col"
                          >
                            <span className="text-white font-semibold text-sm md:text-base group-hover:text-primary-400 transition-colors">
                              {specialist.player}
                            </span>
                            <span className="text-gray-400 text-xs md:hidden mt-0.5">{specialist.squad}</span>
                          </Link>
                        </td>
                        <td className="px-2 md:px-4 lg:px-6 py-4 md:py-5 hidden md:table-cell">
                          <span className="text-gray-200 font-medium text-sm">{specialist.squad}</span>
                        </td>
                        <td className="px-2 md:px-4 lg:px-6 py-4 md:py-5 hidden lg:table-cell">
                          <span className="text-gray-300 text-xs">{specialist.competition}</span>
                        </td>
                        <td className="px-2 md:px-4 lg:px-6 py-4 md:py-5">
                          <span className={`inline-flex items-center px-2 md:px-3 py-1 md:py-1.5 rounded-lg text-xs font-bold text-white shadow-md ${getPositionColor(specialist.position)}`}>
                            {specialist.position.split(',')[0]}
                          </span>
                        </td>
                        <td className="px-2 md:px-4 lg:px-6 py-4 md:py-5 whitespace-nowrap text-center border-l border-gray-700/30">
                          <span className="inline-flex items-center justify-center w-8 h-8 md:w-10 md:h-10 rounded-full bg-gray-700/50 text-gray-200 font-semibold text-xs md:text-sm">
                            {specialist.age}
                          </span>
                        </td>
                        <td className="px-2 md:px-4 lg:px-6 py-4 md:py-5 text-center border-l border-gray-700/30 bg-primary-500/5">
                          {specialist.penalty_accuracy !== null ? (
                            <div className="flex flex-col items-center">
                              <span className="text-white font-bold text-base md:text-lg mb-0.5 md:mb-1">
                                {specialist.penalty_accuracy}%
                              </span>
                              <span className="text-xs text-gray-400 bg-gray-700/30 px-1.5 md:px-2 py-0.5 rounded text-[10px] md:text-xs">
                                {specialist.penalties_made}/{specialist.penalties_attempted}
                              </span>
                            </div>
                          ) : (
                            <span className="text-gray-500 text-xs md:text-sm italic">-</span>
                          )}
                        </td>
                        <td className="px-2 md:px-4 lg:px-6 py-4 md:py-5 text-center border-l border-gray-700/30">
                          <div className="flex flex-col items-center">
                            <span className="text-white font-bold text-base md:text-lg mb-0.5 md:mb-1">
                              {specialist.free_kick_goals}
                            </span>
                            <span className="text-xs text-gray-400 bg-gray-700/30 px-1.5 md:px-2 py-0.5 rounded text-[10px] md:text-xs">
                              {specialist.free_kick_goals_per90.toFixed(2)}/90
                            </span>
                          </div>
                        </td>
                        <td className="px-2 md:px-4 lg:px-6 py-4 md:py-5 text-center border-l border-gray-700/30">
                          <div className="flex flex-col items-center">
                            <span className="text-white font-bold text-base md:text-lg mb-0.5 md:mb-1">
                              {specialist.corner_assists}
                            </span>
                            <span className="text-xs text-gray-400 bg-gray-700/30 px-1.5 md:px-2 py-0.5 rounded text-[10px] md:text-xs">
                              {specialist.corner_assists_per90.toFixed(2)}/90
                            </span>
                          </div>
                        </td>
                        <td className="px-2 md:px-4 lg:px-6 py-4 md:py-5 text-center border-l border-gray-700/30 bg-yellow-500/5">
                          <div className="flex flex-col items-center">
                            <span className={`text-xl md:text-2xl font-bold mb-0.5 md:mb-1 ${getScoreColor(specialist.set_piece_score)}`}>
                              {specialist.set_piece_score}
                            </span>
                            <div className={`h-1 rounded-full ${
                              specialist.set_piece_score >= 2.0 ? 'bg-green-500' :
                              specialist.set_piece_score >= 1.0 ? 'bg-yellow-500' :
                              specialist.set_piece_score >= 0.5 ? 'bg-orange-500' :
                              'bg-gray-600'
                            }`} style={{
                              width: `${Math.min(100, (specialist.set_piece_score / 3.0) * 100)}%`,
                              minWidth: '20px',
                              maxWidth: '60px'
                            }}></div>
                          </div>
                        </td>
                        <td className="px-2 md:px-4 lg:px-6 py-4 md:py-5 text-center border-l border-gray-700/30">
                          <button
                            onClick={() => toggleShortlist(specialist.player_id)}
                            className={`p-2 rounded-lg transition-all duration-200 ${
                              isShortlisted(specialist.player_id)
                                ? 'bg-green-500/20 text-green-400 hover:bg-green-500/30 border border-green-500/30'
                                : 'bg-blue-500/20 text-blue-400 hover:bg-blue-500/30 border border-blue-500/30 hover:scale-110'
                            }`}
                            title={isShortlisted(specialist.player_id) ? 'Remove from shortlist' : 'Add to shortlist'}
                          >
                            {isShortlisted(specialist.player_id) ? (
                              <Check size={18} className="font-bold" />
                            ) : (
                              <Bookmark size={18} />
                            )}
                          </button>
                        </td>
                      </motion.tr>
                    ))
                  )}
                </tbody>
              </table>
              </div>
            </div>
          </motion.div>
        )}
        </div>
      </div>
    </div>
  );
};

export default SetPieceSpecialists;

