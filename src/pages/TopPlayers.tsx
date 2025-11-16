import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Trophy, Medal, Award, Filter, Plus, Check } from 'lucide-react';
import backgroundImage from '../assets/homepage.png';
import { getShortlist, toggleShortlist as toggleShortlistAPI } from '../utils/shortlist';

interface Player {
  rank: number;
  id: number;
  name: string;
  squad: string;
  position: string;
  nation: string;
  competition: string;
  age: number;
  matches_played: number;
  minutes_played: number;
  primary_metric: number;
  goals?: number;
  assists?: number;
  goals_per90?: number;
  assists_per90?: number;
  goals_assists?: number;
  goals_assists_per90?: number;
  expected_goals?: number;
  expected_goals_per90?: number;
  expected_assists?: number;
  expected_assists_per90?: number;
  progressive_passes?: number;
  progressive_carries?: number;
  progressive_dribbles?: number;
  // Goalkeeper metrics
  clean_sheets?: number;
  saves_per90?: number;
  total_saves?: number;
  clean_sheet_percentage?: number;
  goals_prevented?: number;
  penalty_saves?: number;
}

interface TopPlayersResponse {
  players: Player[];
  metric: string;
  league: string;
  age: string;
  limit: number;
  available_leagues: string[];
  available_ages: number[];
  total_count: number;
}

const TopPlayers: React.FC = () => {
  const [players, setPlayers] = useState<Player[]>([]);
  const [loading, setLoading] = useState(false);
  const [availableLeagues, setAvailableLeagues] = useState<string[]>([]);
  const [availableAges, setAvailableAges] = useState<number[]>([]);
  
  // Filters
  const [selectedMetric, setSelectedMetric] = useState<string>('goals');
  const [selectedLeague, setSelectedLeague] = useState<string>('All');
  const [selectedAge, setSelectedAge] = useState<string>('All');
  const [customTopN, setCustomTopN] = useState<string>('0');
  const [sortField, setSortField] = useState<string>('rank');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [topNError, setTopNError] = useState<string>('');
  
  // Shortlist - load from API on mount
  const [shortlist, setShortlist] = useState<number[]>([]);

  // Scroll to top when component mounts
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  // Load shortlist from API on mount
  useEffect(() => {
    const loadShortlist = async () => {
      const playerIds = await getShortlist();
      setShortlist(playerIds);
    };
    loadShortlist();
  }, []);

  const metrics = [
    { value: 'goals', label: 'Top Scorers', icon: Trophy },
    { value: 'assists', label: 'Top Assist Providers', icon: Award },
    { value: 'goals_assists', label: 'Goal Contributions', icon: Medal },
    { value: 'matches_played', label: 'Most Matches Played', icon: Award },
    { value: 'top_goalkeepers', label: 'Top Goalkeepers', icon: Trophy },
    { value: 'progressive_passes', label: 'Progressive Passes', icon: Award },
    { value: 'progressive_carries', label: 'Progressive Carries', icon: Award },
  ];

  // Debounce the customTopN to avoid too many API calls while typing
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      fetchTopPlayers();
    }, 300); // Wait 300ms after user stops typing
    
    return () => clearTimeout(timeoutId);
  }, [selectedMetric, selectedLeague, selectedAge, customTopN, topNError]);

  // Shortlist is now managed via API, no need to save to localStorage

  const fetchTopPlayers = async () => {
    // Don't fetch if there's an error in the input or if value is 0
    if (topNError) {
      setPlayers([]);
      setLoading(false);
      return;
    }

    // Parse and validate the limit value
    const parsedValue = customTopN.trim() === '' ? 0 : parseInt(customTopN.trim());
    
    // If value is 0, empty, invalid, or out of range, don't fetch
    if (isNaN(parsedValue) || parsedValue < 1 || parsedValue > 50 || parsedValue === 0) {
      setPlayers([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const limit = Math.max(1, Math.min(50, parsedValue));
      
      const leagueParam = selectedLeague === 'All' ? '' : selectedLeague;
      const ageParam = selectedAge === 'All' ? '' : selectedAge;
      const response = await fetch(
        `http://localhost:8000/api/players/top_players/?metric=${selectedMetric}&league=${encodeURIComponent(leagueParam)}&age=${encodeURIComponent(ageParam)}&limit=${limit}`
      );
      if (response.ok) {
        const data: TopPlayersResponse = await response.json();
        setPlayers(data.players);
        if (data.available_leagues && data.available_leagues.length > 0) {
          // Remove duplicates and sort
          const uniqueLeagues = Array.from(new Set(data.available_leagues)).sort();
          setAvailableLeagues(uniqueLeagues);
        }
        if (data.available_ages && data.available_ages.length > 0) {
          // Remove duplicates and sort
          const uniqueAges = Array.from(new Set(data.available_ages)).sort((a, b) => a - b);
          setAvailableAges(uniqueAges);
        }
      }
    } catch (error) {
      console.error('Error fetching top players:', error);
    } finally {
      setLoading(false);
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

  const getMetricDisplayName = (metric: string) => {
    // Special case for goals metric - show "No of goals" in table column
    if (metric === 'goals') {
      return 'No of goals';
    }
    // Special case for assists metric - show "No of assists" in table column
    if (metric === 'assists') {
      return 'No of assists';
    }
    // Special case for matches_played metric - show "Matches played" in table
    if (metric === 'matches_played') {
      return 'Matches played';
    }
    // Special case for top_goalkeepers metric - show "Clean Sheets" in table column
    if (metric === 'top_goalkeepers') {
      return 'Clean Sheets';
    }
    const metricObj = metrics.find(m => m.value === metric);
    return metricObj ? metricObj.label : metric;
  };

  // Get display name for table heading (different from column header)
  const getTableHeadingName = (metric: string) => {
    const metricObj = metrics.find(m => m.value === metric);
    return metricObj ? metricObj.label : metric;
  };

  const getMetricValue = (player: Player) => {
    return player.primary_metric;
  };

  const formatMetricValue = (value: number, metric: string) => {
    if (metric.includes('per90') || metric.includes('expected')) {
      return value.toFixed(2);
    }
    return Math.round(value).toString();
  };

  const getMetricUnit = (metric: string) => {
    if (metric.includes('per90')) {
      return 'per 90';
    }
    return '';
  };

  // Filter and sort players
  const filteredAndSortedPlayers = useMemo(() => {
    let filtered = players;
    
    // When sorting by rank or primary_metric, apply tie-breaker for all metrics
    if (sortField === 'rank' || sortField === 'primary_metric') {
      filtered = [...filtered].sort((a, b) => {
        const aPrimary = a.primary_metric ?? 0;
        const bPrimary = b.primary_metric ?? 0;
        
        // Primary sort: primary_metric descending (higher value = higher rank)
        if (aPrimary !== bPrimary) {
          return bPrimary - aPrimary; // Descending: higher value first
        }
        
        // Tie-breaker for all metrics: if primary_metric values are equal, 
        // sort by matches played ascending (fewer matches = higher rank)
        const aMatches = a.matches_played ?? 0;
        const bMatches = b.matches_played ?? 0;
        return aMatches - bMatches; // Ascending: fewer matches first
      });
    } else {
      // Regular sort for other fields
      filtered = [...filtered].sort((a, b) => {
        let aVal: any = a[sortField as keyof Player] ?? 0;
        let bVal: any = b[sortField as keyof Player] ?? 0;
        
        if (typeof aVal === 'string') {
          aVal = aVal.toLowerCase();
          bVal = bVal.toLowerCase();
        }
        
        let comparison = 0;
        if (sortDirection === 'asc') {
          comparison = aVal > bVal ? 1 : aVal < bVal ? -1 : 0;
        } else {
          comparison = aVal < bVal ? 1 : aVal > bVal ? -1 : 0;
        }
        
        // Tie-breaker for all metrics: if sort values are equal, break by matches played
        if (comparison === 0) {
          const aPrimary = a.primary_metric ?? 0;
          const bPrimary = b.primary_metric ?? 0;
          
          // If primary metrics are equal, break tie by matches played
          if (aPrimary === bPrimary) {
            const aMatches = a.matches_played ?? 0;
            const bMatches = b.matches_played ?? 0;
            return aMatches - bMatches; // Ascending: fewer matches first
          }
        }
        
        return comparison;
      });
    }
    
    // Calculate ranks: players with same primary_metric and matches_played get same rank
    // Sequential ranking: tied players share rank, but next rank continues sequentially
    const rankedPlayers: Array<Player & { calculatedRank: number }> = [];
    let currentRank = 1;
    
    for (let i = 0; i < filtered.length; i++) {
      const player = filtered[i];
      
      // Check if this player starts a new rank group (different from previous player)
      if (i === 0 || 
          (filtered[i - 1].primary_metric ?? 0) !== (player.primary_metric ?? 0) ||
          (filtered[i - 1].matches_played ?? 0) !== (player.matches_played ?? 0)) {
        // Count how many consecutive players have the same primary_metric and matches_played
        let tiedCount = 1;
        for (let j = i + 1; j < filtered.length; j++) {
          if ((filtered[j].primary_metric ?? 0) === (player.primary_metric ?? 0) &&
              (filtered[j].matches_played ?? 0) === (player.matches_played ?? 0)) {
            tiedCount++;
          } else {
            break;
          }
        }
        
        // All tied players get the same rank
        for (let k = 0; k < tiedCount; k++) {
          rankedPlayers.push({ ...filtered[i + k], calculatedRank: currentRank });
        }
        
        // Next rank continues sequentially (increment by 1, not by tiedCount)
        currentRank += 1;
        i += tiedCount - 1; // Skip the tied players we just processed
      }
    }
    
    // Limit to top N players
    const limit = parseInt(customTopN) || 0;
    if (limit > 0 && limit <= 50) {
      return rankedPlayers.slice(0, limit);
    }
    
    return rankedPlayers;
  }, [players, sortField, sortDirection, selectedMetric, customTopN]);

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const getRankBadge = (rank: number) => {
    if (rank === 1) {
      return <Trophy className="text-yellow-400" size={20} />;
    } else if (rank === 2) {
      return <Medal className="text-gray-300" size={20} />;
    } else if (rank === 3) {
      return <Award className="text-orange-400" size={20} />;
    }
    return <span className="text-gray-400 font-semibold">#{rank}</span>;
  };

  const getRankStyle = (rank: number) => {
    if (rank === 1) {
      return 'bg-gradient-to-r from-yellow-500/20 to-yellow-600/20 border-yellow-400/50 shadow-lg shadow-yellow-500/20';
    } else if (rank === 2) {
      return 'bg-gradient-to-r from-gray-400/20 to-gray-500/20 border-gray-300/50 shadow-lg shadow-gray-400/20';
    } else if (rank === 3) {
      return 'bg-gradient-to-r from-orange-500/20 to-orange-600/20 border-orange-400/50 shadow-lg shadow-orange-500/20';
    }
    return 'bg-gray-800/50 border-gray-700/50';
  };

  return (
    <div className="min-h-screen bg-gray-900">
      {/* Header */}
      <header className="bg-gray-800 border-b border-gray-700 sticky top-0 z-50">
        <div className="w-full px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-6">
              <Link 
                to="/home" 
                className="inline-flex items-center text-gray-300 hover:text-white transition-colors duration-200"
              >
                <ArrowLeft size={20} className="mr-2" />
                Back to Home
              </Link>
              <h1 className="text-3xl font-bold text-white">Top Players</h1>
            </div>
          </div>
        </div>
      </header>

      <div 
        className="relative py-12 bg-cover bg-center"
        style={{
          backgroundImage: `linear-gradient(rgba(17, 24, 39, 0.95), rgba(17, 24, 39, 0.95)), url(${backgroundImage})`,
        }}
      >
        <div className="w-full px-4 sm:px-6 lg:px-8">
          {/* Filters Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-gray-800/80 backdrop-blur-sm rounded-2xl p-6 mb-8 border border-gray-700 shadow-lg"
          >
            <div className="flex items-center gap-2 mb-6">
              <Filter className="text-blue-400" size={24} />
              <h2 className="text-xl font-semibold text-white">Filters</h2>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Metric Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Metric</label>
                <select
                  value={selectedMetric}
                  onChange={(e) => setSelectedMetric(e.target.value)}
                  className="w-full px-4 py-2.5 bg-gray-800/80 backdrop-blur-sm border border-gray-600/50 rounded-xl text-white shadow-lg transition-all duration-200 hover:bg-gray-700/80 hover:border-blue-500/50 hover:shadow-xl hover:shadow-blue-500/10 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/70 focus:shadow-xl focus:shadow-blue-500/20 cursor-pointer appearance-none"
                  style={{
                    backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%23ffffff' d='M6 9L1 4h10z'/%3E%3C/svg%3E")`,
                    backgroundRepeat: 'no-repeat',
                    backgroundPosition: 'right 1rem center',
                    paddingRight: '2.5rem'
                  }}
                >
                  {metrics.map(metric => (
                    <option key={metric.value} value={metric.value} className="bg-gray-800 text-white">{metric.label}</option>
                  ))}
                </select>
              </div>

              {/* League Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">League</label>
                <select
                  value={selectedLeague}
                  onChange={(e) => setSelectedLeague(e.target.value)}
                  className="w-full px-4 py-2.5 bg-gray-800/80 backdrop-blur-sm border border-gray-600/50 rounded-xl text-white shadow-lg transition-all duration-200 hover:bg-gray-700/80 hover:border-blue-500/50 hover:shadow-xl hover:shadow-blue-500/10 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/70 focus:shadow-xl focus:shadow-blue-500/20 cursor-pointer appearance-none"
                  style={{
                    backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%23ffffff' d='M6 9L1 4h10z'/%3E%3C/svg%3E")`,
                    backgroundRepeat: 'no-repeat',
                    backgroundPosition: 'right 1rem center',
                    paddingRight: '2.5rem'
                  }}
                >
                  <option value="All" className="bg-gray-800 text-white">All Leagues</option>
                  {availableLeagues.map(league => (
                    <option key={league} value={league} className="bg-gray-800 text-white">{league}</option>
                  ))}
                </select>
              </div>

              {/* Age Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Age</label>
                <select
                  value={selectedAge}
                  onChange={(e) => setSelectedAge(e.target.value)}
                  className="w-full px-4 py-2.5 bg-gray-800/80 backdrop-blur-sm border border-gray-600/50 rounded-xl text-white shadow-lg transition-all duration-200 hover:bg-gray-700/80 hover:border-blue-500/50 hover:shadow-xl hover:shadow-blue-500/10 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/70 focus:shadow-xl focus:shadow-blue-500/20 cursor-pointer appearance-none"
                  style={{
                    backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%23ffffff' d='M6 9L1 4h10z'/%3E%3C/svg%3E")`,
                    backgroundRepeat: 'no-repeat',
                    backgroundPosition: 'right 1rem center',
                    paddingRight: '2.5rem'
                  }}
                >
                  <option value="All" className="bg-gray-800 text-white">All Ages</option>
                  {availableAges.map(age => (
                    <option key={age} value={age.toString()} className="bg-gray-800 text-white">{age} years</option>
                  ))}
                </select>
              </div>

              {/* Top N Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Number of Top Players (1-50)</label>
                <input
                  type="number"
                  min="0"
                  max="50"
                  value={customTopN === '0' ? '' : customTopN}
                  onChange={(e) => {
                    const val = e.target.value;
                    // Allow empty string for deletion (but keep state as '0' internally)
                    if (val === '') {
                      setCustomTopN('0');
                      setTopNError('');
                      setPlayers([]); // Clear table when empty
                      return;
                    }
                    // Only allow digits
                    if (/^\d+$/.test(val)) {
                      const numVal = parseInt(val);
                      // Check if value is within valid range (allow 0 as default state)
                      if (numVal === 0) {
                        setCustomTopN(val);
                        setTopNError('');
                        setPlayers([]); // Clear table when value is 0
                      } else if (numVal >= 1 && numVal <= 50) {
                        setCustomTopN(val);
                        setTopNError('');
                      } else if (numVal < 1) {
                        setCustomTopN(val);
                        setTopNError('Wrong input value. Please enter a number between 1-50.');
                        setPlayers([]); // Clear table when error
                      } else if (numVal > 50) {
                        setCustomTopN(val);
                        setTopNError('Wrong input value. Please enter a number between 1-50.');
                        setPlayers([]); // Clear table when error
                      }
                    }
                  }}
                  onBlur={(e) => {
                    // Validate and handle empty, invalid, or out of range values
                    const val = e.target.value.trim();
                    const numVal = parseInt(val);
                    if (val === '' || isNaN(numVal)) {
                      // If empty or invalid, set to 0 (default state)
                      setCustomTopN('0');
                      setTopNError('');
                    } else if (numVal < 1 || numVal > 50) {
                      // If out of range, show error and set to 0
                      setTopNError('Wrong input value. Please enter a number between 1-50.');
                      setCustomTopN('0');
                    } else {
                      // Ensure value is within 1-50 range
                      const num = Math.max(1, Math.min(50, numVal));
                      setCustomTopN(num.toString());
                      setTopNError('');
                    }
                  }}
                  onWheel={(e) => {
                    // Prevent scroll from changing the input value
                    e.currentTarget.blur();
                  }}
                  onKeyDown={(e) => {
                    // Prevent arrow keys from changing the value
                    if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
                      e.preventDefault();
                    }
                  }}
                  placeholder="Enter number (1-50)"
                  className={`w-full px-4 py-2.5 bg-gray-800/80 backdrop-blur-sm border rounded-xl text-white shadow-lg transition-all duration-200 hover:bg-gray-700/80 hover:shadow-xl focus:outline-none focus:ring-2 focus:shadow-xl [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none ${
                    topNError 
                      ? 'border-red-500/70 hover:border-red-500/50 focus:ring-red-500/50 focus:border-red-500/70 focus:shadow-red-500/20' 
                      : 'border-gray-600/50 hover:border-blue-500/50 hover:shadow-blue-500/10 focus:ring-blue-500/50 focus:border-blue-500/70 focus:shadow-blue-500/20'
                  }`}
                />
                {topNError && (
                  <p className="mt-2 text-sm text-red-400 font-medium">{topNError}</p>
                )}
              </div>
            </div>
          </motion.div>

          {/* Results Table */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-gray-800/80 backdrop-blur-sm rounded-2xl border border-gray-700 shadow-lg overflow-hidden"
          >
            <div className="p-6 border-b border-gray-700">
                <h2 className="text-2xl font-bold text-white">
                  {getTableHeadingName(selectedMetric)}
                  {selectedLeague !== 'All' && ` - ${selectedLeague}`}
                </h2>
            </div>

            {loading ? (
              <div className="flex items-center justify-center py-20">
                <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
              </div>
            ) : filteredAndSortedPlayers.length === 0 ? (
              <div className="flex items-center justify-center py-20">
                <div className="text-center">
                  <p className="text-gray-400 text-lg">
                    {customTopN === '0' || customTopN === '' 
                      ? 'The players with selected criteria will be shown here'
                      : 'No players found matching your criteria'
                    }
                  </p>
                </div>
              </div>
            ) : (
              <div className="w-full overflow-x-auto">
                <table className="w-full min-w-full table-auto">
                  <thead className="bg-gray-700/50">
                    <tr>
                      <th className="px-2 md:px-3 py-4 text-center text-xs font-semibold text-gray-300 uppercase tracking-wider w-12">
                        #
                      </th>
                      <th className="px-2 md:px-3 py-4 text-center text-xs font-semibold text-gray-300 uppercase tracking-wider w-16">
                        Rank
                      </th>
                      <th 
                        className="px-2 md:px-3 py-4 text-left text-xs font-semibold text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-gray-700/70 transition-colors min-w-[120px]"
                        onClick={() => handleSort('name')}
                      >
                        Player {sortField === 'name' && (sortDirection === 'asc' ? '↑' : '↓')}
                      </th>
                      <th 
                        className="px-2 md:px-3 py-4 text-left text-xs font-semibold text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-gray-700/70 transition-colors min-w-[100px]"
                        onClick={() => handleSort('squad')}
                      >
                        Team {sortField === 'squad' && (sortDirection === 'asc' ? '↑' : '↓')}
                      </th>
                      <th 
                        className="px-2 md:px-3 py-4 text-left text-xs font-semibold text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-gray-700/70 transition-colors w-20"
                        onClick={() => handleSort('position')}
                      >
                        Pos {sortField === 'position' && (sortDirection === 'asc' ? '↑' : '↓')}
                      </th>
                      {selectedLeague === 'All' && (
                        <th 
                          className="px-2 md:px-3 py-4 text-left text-xs font-semibold text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-gray-700/70 transition-colors min-w-[100px]"
                          onClick={() => handleSort('competition')}
                        >
                          League {sortField === 'competition' && (sortDirection === 'asc' ? '↑' : '↓')}
                        </th>
                      )}
                      <th 
                        className="px-2 md:px-3 py-4 text-center text-xs font-semibold text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-gray-700/70 transition-colors w-24"
                        onClick={() => handleSort('primary_metric')}
                      >
                        {getMetricDisplayName(selectedMetric)} {sortField === 'primary_metric' && (sortDirection === 'asc' ? '↑' : '↓')}
                      </th>
                      {selectedMetric !== 'matches_played' && (
                        <th 
                          className="px-2 md:px-3 py-4 text-center text-xs font-semibold text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-gray-700/70 transition-colors w-20"
                          onClick={() => handleSort('matches_played')}
                        >
                          MP {sortField === 'matches_played' && (sortDirection === 'asc' ? '↑' : '↓')}
                        </th>
                      )}
                      {selectedMetric.includes('goals') && !selectedMetric.includes('assist') && selectedMetric !== 'goals' && (
                        <th className="px-2 md:px-3 py-4 text-center text-xs font-semibold text-gray-300 uppercase tracking-wider w-16">
                          Goals
                        </th>
                      )}
                      {selectedMetric.includes('assist') && !selectedMetric.includes('goals') && selectedMetric !== 'assists' && (
                        <th className="px-2 md:px-3 py-4 text-center text-xs font-semibold text-gray-300 uppercase tracking-wider w-16">
                          Assists
                        </th>
                      )}
                      {selectedMetric === 'top_goalkeepers' && (
                        <>
                          <th className="px-2 md:px-3 py-4 text-center text-xs font-semibold text-gray-300 uppercase tracking-wider whitespace-nowrap">
                            Saves/90
                          </th>
                          <th className="px-2 md:px-3 py-4 text-center text-xs font-semibold text-gray-300 uppercase tracking-wider whitespace-nowrap">
                            Total Saves
                          </th>
                          <th className="px-2 md:px-3 py-4 text-center text-xs font-semibold text-gray-300 uppercase tracking-wider whitespace-nowrap">
                            CS %
                          </th>
                          <th className="px-2 md:px-3 py-4 text-center text-xs font-semibold text-gray-300 uppercase tracking-wider whitespace-nowrap">
                            Goals Prev
                          </th>
                          <th className="px-2 md:px-3 py-4 text-center text-xs font-semibold text-gray-300 uppercase tracking-wider whitespace-nowrap">
                            Pen Saves
                          </th>
                        </>
                      )}
                      <th className="px-2 md:px-3 py-4 text-center text-xs font-semibold text-gray-300 uppercase tracking-wider w-24">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-700">
                    {filteredAndSortedPlayers.map((player: any, index) => {
                      const displayRank = player.calculatedRank ?? (index + 1);
                      const rowNumber = index + 1;
                      return (
                      <motion.tr
                        key={player.id}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className={`hover:bg-gray-700/30 transition-colors ${getRankStyle(displayRank)}`}
                      >
                        <td className="px-2 md:px-3 py-4 whitespace-nowrap text-center text-gray-400 font-semibold text-sm">
                          {rowNumber}
                        </td>
                        <td className="px-2 md:px-3 py-4 whitespace-nowrap">
                          <div className="flex items-center justify-center">
                            {getRankBadge(displayRank)}
                          </div>
                        </td>
                        <td className="px-2 md:px-3 py-4 whitespace-nowrap">
                          <Link
                            to={`/player-stats/${player.id}`}
                            className="text-white font-semibold hover:text-blue-400 transition-colors block text-sm"
                          >
                            {player.name}
                          </Link>
                          <div className="text-xs text-gray-400">{player.nation}</div>
                        </td>
                        <td className="px-2 md:px-3 py-4 whitespace-nowrap text-gray-300 text-sm">{player.squad}</td>
                        <td className="px-2 md:px-3 py-4 whitespace-nowrap">
                          <span className="px-2 py-1 text-xs font-medium rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/30">
                            {player.position}
                          </span>
                        </td>
                        {selectedLeague === 'All' && (
                          <td className="px-2 md:px-3 py-4 whitespace-nowrap text-gray-300 text-sm">
                            {player.competition || 'N/A'}
                          </td>
                        )}
                        <td className="px-2 md:px-3 py-4 whitespace-nowrap text-center">
                          <span className="text-white font-bold text-base">
                            {formatMetricValue(getMetricValue(player), selectedMetric)}
                            {getMetricUnit(selectedMetric) && (
                              <span className="text-xs text-gray-400 ml-1">{getMetricUnit(selectedMetric)}</span>
                            )}
                          </span>
                        </td>
                        {selectedMetric !== 'matches_played' && (
                          <td className="px-2 md:px-3 py-4 whitespace-nowrap text-center text-gray-300 text-sm">
                            {player.matches_played}
                          </td>
                        )}
                        {selectedMetric.includes('goals') && !selectedMetric.includes('assist') && selectedMetric !== 'goals' && (
                          <td className="px-2 md:px-3 py-4 whitespace-nowrap text-center text-gray-300 text-sm">
                            {player.goals || 0}
                          </td>
                        )}
                        {selectedMetric.includes('assist') && !selectedMetric.includes('goals') && selectedMetric !== 'assists' && (
                          <td className="px-2 md:px-3 py-4 whitespace-nowrap text-center text-gray-300 text-sm">
                            {player.assists || 0}
                          </td>
                        )}
                        {selectedMetric === 'top_goalkeepers' && (
                          <>
                            <td className="px-2 md:px-3 py-4 whitespace-nowrap text-center text-gray-300 text-sm">
                              {player.saves_per90?.toFixed(2) || '0.00'}
                            </td>
                            <td className="px-2 md:px-3 py-4 whitespace-nowrap text-center text-gray-300 text-sm">
                              {player.total_saves || 0}
                            </td>
                            <td className="px-2 md:px-3 py-4 whitespace-nowrap text-center text-gray-300 text-sm">
                              {player.clean_sheet_percentage?.toFixed(1) || '0.0'}%
                            </td>
                            <td className="px-2 md:px-3 py-4 whitespace-nowrap text-center text-gray-300 text-sm">
                              {player.goals_prevented?.toFixed(2) || '0.00'}
                            </td>
                            <td className="px-2 md:px-3 py-4 whitespace-nowrap text-center text-gray-300 text-sm">
                              {player.penalty_saves || 0}
                            </td>
                          </>
                        )}
                        <td className="px-2 md:px-3 py-4 whitespace-nowrap">
                          <div className="flex items-center justify-center gap-2">
                            <button
                              onClick={() => toggleShortlist(player.id)}
                              className={`px-2 py-1.5 rounded-lg transition-all duration-200 font-medium text-xs flex items-center gap-1 ${
                                isShortlisted(player.id)
                                  ? 'bg-green-500/20 text-green-400 hover:bg-green-500/30 border border-green-500/30'
                                  : 'bg-blue-500/20 text-blue-400 hover:bg-blue-500/30 border border-blue-500/30 hover:scale-105'
                              }`}
                              title={isShortlisted(player.id) ? 'Remove from shortlist' : 'Add to shortlist'}
                            >
                              {isShortlisted(player.id) ? (
                                <>
                                  <Check size={14} className="font-bold" />
                                  <span className="text-xs">Added</span>
                                </>
                              ) : (
                                <>
                                  <Plus size={14} className="font-bold" />
                                  <span className="text-xs">Add</span>
                                </>
                              )}
                            </button>
                          </div>
                        </td>
                      </motion.tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default TopPlayers;

