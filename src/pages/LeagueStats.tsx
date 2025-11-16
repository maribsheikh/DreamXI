import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, TrendingUp, Trophy, Users, Goal, Award, Shield, AlertTriangle, Filter } from 'lucide-react';
import { getPlayerImage, getTeamBasedImage, getPositionBasedImage } from '../utils/imageService';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';
import { Bar } from 'react-chartjs-2';
import backgroundImage from '../assets/homepage.png';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

interface LeagueDetailData {
  league_name: string;
  overview: {
    num_teams: number;
    total_matches: number;
    total_goals: number;
    avg_goals_per_match: number;
    total_assists: number;
    total_clean_sheets: number;
    total_penalty_goals: number;
    top_scorer: {
      name: string | null;
      goals: number;
    };
  };
  standings: Array<{
    position?: number;
    team: string;
    matches_played: number;
    wins: number;
    draws: number;
    losses: number;
    points: number;
    goal_difference: number;
    goals_for: number;
    goals_against: number;
    yellow_cards: number;
    red_cards: number;
  }>;
    top_scorers: Array<{
      name: string;
      squad: string;
      goals: number;
      goals_per90: number;
    matches_played: number;
    }>;
  top_assists: Array<{
      name: string;
      squad: string;
      assists: number;
      assists_per90: number;
    matches_played: number;
  }>;
  most_matches: Array<{
    name: string;
    squad: string;
    position: string;
    matches_played: number;
    minutes_played: number;
  }>;
  best_goalkeepers: Array<{
    name: string;
    squad: string;
    clean_sheets: number;
    saves_per90: number;
    total_saves: number;
    clean_sheet_percentage: number;
    matches_played: number;
  }>;
  goals_by_position: {
    [position: string]: number;
  };
  discipline: {
    total_yellow_cards: number;
    total_red_cards: number;
    team_discipline: Array<{
      team: string;
      yellow_cards: number;
      red_cards: number;
      total_cards: number;
    }>;
  };
}

const LeagueStats: React.FC = () => {
  const [selectedLeague, setSelectedLeague] = useState<string>('');
  const [availableLeagues, setAvailableLeagues] = useState<string[]>([]);
  const [data, setData] = useState<LeagueDetailData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [topScorerImage, setTopScorerImage] = useState<string | null>(null);
  const [topScorerImageLoading, setTopScorerImageLoading] = useState(false);

  // Fetch available leagues
  useEffect(() => {
    const fetchLeagues = async () => {
      try {
        const response = await fetch('http://localhost:8000/api/players/league_comparison/');
        if (response.ok) {
          const result = await response.json();
          if (result.leagues && result.leagues.length > 0) {
            setAvailableLeagues(result.leagues);
            // Don't auto-select - let user choose from dropdown
          }
        }
      } catch (error) {
        console.error('Error fetching leagues:', error);
      }
    };
    fetchLeagues();
  }, []);

  // Fetch league detail data
  useEffect(() => {
    if (selectedLeague) {
      const fetchLeagueDetail = async () => {
        try {
          setLoading(true);
          setError(null);
          // Clear previous data immediately when league changes
          setData(null);
          
          const response = await fetch(`http://localhost:8000/api/players/league_detail/?league=${encodeURIComponent(selectedLeague)}`);
          
          if (!response.ok) {
            const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
            throw new Error(errorData.error || 'Failed to fetch league details');
          }
          
          const result = await response.json();
          
          // Check if response contains an error
          if (result.error) {
            throw new Error(result.error);
          }
          
          // Ensure standings are sorted correctly
          if (result.standings && Array.isArray(result.standings)) {
            result.standings.sort((a: any, b: any) => {
              const posA = a.position || 999;
              const posB = b.position || 999;
              return posA - posB;
            });
          }
          
          setData(result);
          
          // Fetch top scorer image if available
          if (result.overview?.top_scorer?.name) {
            fetchTopScorerImage(result.overview.top_scorer.name, result);
          } else {
            setTopScorerImage(null);
          }
        } catch (error: any) {
          console.error('Error fetching league details:', error);
          setError(error.message || 'Failed to load league statistics. Please try again.');
        } finally {
          setLoading(false);
        }
      };
      fetchLeagueDetail();
    } else {
      // Clear data when no league is selected
      setData(null);
      setTopScorerImage(null);
    }
  }, [selectedLeague]);
  
  // Fetch top scorer image
  const fetchTopScorerImage = async (playerName: string, leagueData: LeagueDetailData) => {
    setTopScorerImageLoading(true);
    try {
      // Try to find the player in top_scorers to get squad info
      const topScorerInfo = leagueData.top_scorers?.find(p => p.name === playerName);
      const squad = topScorerInfo?.squad;
      
      // Try to fetch player image
      const imageUrl = await getPlayerImage(playerName, squad);
      setTopScorerImage(imageUrl);
    } catch (error) {
      console.error('Error fetching top scorer image:', error);
      // Use fallback image
      const topScorerInfo = leagueData.top_scorers?.find(p => p.name === playerName);
      const squad = topScorerInfo?.squad;
      const fallbackImage = getTeamBasedImage(playerName, squad || '') || getPositionBasedImage(playerName, 'Forward');
      setTopScorerImage(fallbackImage);
    } finally {
      setTopScorerImageLoading(false);
    }
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
        labels: {
          color: '#E5E7EB',
          font: { size: 12 },
          padding: 15,
        },
      },
      tooltip: {
        backgroundColor: 'rgba(31, 41, 55, 0.9)',
        titleColor: '#F3F4F6',
        bodyColor: '#E5E7EB',
        borderColor: '#4B5563',
        borderWidth: 1,
        padding: 12,
        displayColors: true,
      },
    },
  };

  if (loading && !data) {
    return (
      <div className="min-h-screen bg-gray-900">
        <div className="flex items-center justify-center h-screen">
          <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      </div>
    );
  }

  if (error && !data) {
    return (
      <div className="min-h-screen bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="bg-red-900/50 border border-red-500 rounded-lg p-4 text-red-200">
            {error}
          </div>
        </div>
      </div>
    );
  }

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
              <h1 className="text-3xl font-bold text-white">League Statistics</h1>
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
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* League Selector */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-gray-800/80 backdrop-blur-sm rounded-2xl p-6 mb-8 border border-gray-700 shadow-lg"
          >
            <div className="flex items-center gap-3 mb-4">
              <Filter className="text-blue-400" size={24} />
              <h2 className="text-xl font-semibold text-white">Select League</h2>
            </div>
            <select
              value={selectedLeague}
              onChange={(e) => setSelectedLeague(e.target.value)}
              className="w-full md:w-auto px-6 py-3 bg-gray-800/80 backdrop-blur-sm border border-gray-600/50 rounded-xl text-white shadow-lg transition-all duration-200 hover:bg-gray-700/80 hover:border-blue-500/50 hover:shadow-xl hover:shadow-blue-500/10 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/70 focus:shadow-xl focus:shadow-blue-500/20 cursor-pointer appearance-none"
              style={{
                backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%23ffffff' d='M6 9L1 4h10z'/%3E%3C/svg%3E")`,
                backgroundRepeat: 'no-repeat',
                backgroundPosition: 'right 1rem center',
                paddingRight: '2.5rem'
              }}
            >
              <option value="" className="bg-gray-800 text-white">Select a league...</option>
              {availableLeagues.map(league => (
                <option key={league} value={league} className="bg-gray-800 text-white">{league}</option>
              ))}
            </select>
          </motion.div>

          {!data && !loading && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-gray-800/80 backdrop-blur-sm rounded-2xl p-12 text-center border border-gray-700"
            >
              <Trophy size={64} className="mx-auto text-gray-600 mb-4" />
              <h2 className="text-2xl font-bold text-white mb-2">Select a League</h2>
              <p className="text-gray-400">Choose a league from the dropdown above to view detailed statistics</p>
            </motion.div>
          )}

          {data && (
            <>
              {/* 1. League Overview */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-8"
              >
                <h2 className="text-3xl font-bold text-white mb-6">{data.league_name} Overview</h2>
                
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-3">
                  <motion.div
                    whileHover={{ scale: 1.05 }}
                    className="bg-gradient-to-br from-blue-600/20 to-blue-700/20 border border-blue-500/50 rounded-lg p-3 backdrop-blur-sm"
                  >
                    <Users className="text-blue-400 mb-1" size={18} />
                    <div className="text-xl font-bold text-white">{data.overview.num_teams}</div>
                    <div className="text-gray-300 text-xs">Teams</div>
                  </motion.div>
                  
                  <motion.div
                    whileHover={{ scale: 1.05 }}
                    className="bg-gradient-to-br from-green-600/20 to-green-700/20 border border-green-500/50 rounded-lg p-3 backdrop-blur-sm"
                  >
                    <Trophy className="text-green-400 mb-1" size={18} />
                    <div className="text-xl font-bold text-white">{data.overview.total_matches}</div>
                    <div className="text-gray-300 text-xs">Matches</div>
                  </motion.div>
                  
                  <motion.div
                    whileHover={{ scale: 1.05 }}
                    className="bg-gradient-to-br from-yellow-600/20 to-yellow-700/20 border border-yellow-500/50 rounded-lg p-3 backdrop-blur-sm"
                  >
                    <Goal className="text-yellow-400 mb-1" size={18} />
                    <div className="text-xl font-bold text-white">{data.overview.total_goals}</div>
                    <div className="text-gray-300 text-xs">Total Goals</div>
                  </motion.div>
                  
                  <motion.div
                    whileHover={{ scale: 1.05 }}
                    className="bg-gradient-to-br from-purple-600/20 to-purple-700/20 border border-purple-500/50 rounded-lg p-3 backdrop-blur-sm"
                  >
                    <TrendingUp className="text-purple-400 mb-1" size={18} />
                    <div className="text-xl font-bold text-white">{data.overview.avg_goals_per_match.toFixed(2)}</div>
                    <div className="text-gray-300 text-xs">Avg Goals/Match</div>
                  </motion.div>
                  
                  <motion.div
                    whileHover={{ scale: 1.05 }}
                    className="bg-gradient-to-br from-pink-600/20 to-pink-700/20 border border-pink-500/50 rounded-lg p-3 backdrop-blur-sm"
                  >
                    <Award className="text-pink-400 mb-1" size={18} />
                    <div className="text-xl font-bold text-white">{data.overview.total_assists}</div>
                    <div className="text-gray-300 text-xs">Total Assists</div>
                  </motion.div>
                  
                  <motion.div
                    whileHover={{ scale: 1.05 }}
                    className="bg-gradient-to-br from-cyan-600/20 to-cyan-700/20 border border-cyan-500/50 rounded-lg p-3 backdrop-blur-sm"
                  >
                    <Shield className="text-cyan-400 mb-1" size={18} />
                    <div className="text-xl font-bold text-white">{data.overview.total_clean_sheets}</div>
                    <div className="text-gray-300 text-xs">Clean Sheets</div>
                  </motion.div>
                  
                  <motion.div
                    whileHover={{ scale: 1.05 }}
                    className="bg-gradient-to-br from-orange-600/20 to-orange-700/20 border border-orange-500/50 rounded-lg p-3 backdrop-blur-sm"
                  >
                    <Goal className="text-orange-400 mb-1" size={18} />
                    <div className="text-xl font-bold text-white">{data.overview.total_penalty_goals}</div>
                    <div className="text-gray-300 text-xs">Penalty Goals</div>
                  </motion.div>
        </div>

                {/* Top Scorer Card */}
                {data.overview.top_scorer.name && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="mt-6 bg-gradient-to-r from-yellow-600/20 to-yellow-700/20 border border-yellow-500/50 rounded-xl p-6 backdrop-blur-sm"
                  >
                    <div className="flex items-center gap-4">
                      {/* Top Scorer Image */}
                      <div className="flex-shrink-0">
                        {topScorerImageLoading ? (
                          <div className="w-20 h-20 rounded-full bg-gray-700/50 animate-pulse flex items-center justify-center border-2 border-yellow-400/30">
                            <div className="w-8 h-8 border-2 border-yellow-400/50 border-t-transparent rounded-full animate-spin"></div>
                          </div>
                        ) : topScorerImage ? (
                          <img
                            src={topScorerImage}
                            alt={data.overview.top_scorer.name || 'Top Scorer'}
                            className="w-20 h-20 rounded-full object-cover border-2 border-yellow-400/50 shadow-lg"
                            onError={(e) => {
                              // Fallback to avatar if image fails to load
                              const target = e.target as HTMLImageElement;
                              const topScorerInfo = data.top_scorers?.find(p => p.name === data.overview.top_scorer.name);
                              target.src = getTeamBasedImage(data.overview.top_scorer.name || '', topScorerInfo?.squad || '') || getPositionBasedImage(data.overview.top_scorer.name || '', 'Forward');
                            }}
                          />
                        ) : (
                          <div className="w-20 h-20 rounded-full bg-gradient-to-br from-yellow-500/20 to-yellow-600/20 border-2 border-yellow-400/50 flex items-center justify-center">
                            <span className="text-yellow-400 font-bold text-lg">
                              {data.overview.top_scorer.name?.charAt(0).toUpperCase() || '?'}
                            </span>
                          </div>
                        )}
                      </div>
                      <div>
                        <div className="text-gray-300 text-sm">Top Scorer</div>
                        <div className="text-2xl font-bold text-white">{data.overview.top_scorer.name}</div>
                        <div className="text-yellow-400 font-semibold">{data.overview.top_scorer.goals} Goals</div>
                      </div>
                    </div>
                  </motion.div>
                )}
              </motion.div>

              {/* 2. Team Standings */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="bg-gray-800/80 backdrop-blur-sm rounded-2xl p-6 mb-8 border border-gray-700 shadow-lg"
              >
                <div className="flex items-center gap-3 mb-6">
                  <Trophy className="text-yellow-400" size={24} />
                  <h2 className="text-2xl font-bold text-white">Team Standings</h2>
                </div>
                
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[800px]">
                    <thead className="bg-gray-700/50">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-300 uppercase">Pos</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-300 uppercase">Team</th>
                        <th className="px-4 py-3 text-center text-xs font-semibold text-gray-300 uppercase">MP</th>
                        <th className="px-4 py-3 text-center text-xs font-semibold text-gray-300 uppercase">W</th>
                        <th className="px-4 py-3 text-center text-xs font-semibold text-gray-300 uppercase">D</th>
                        <th className="px-4 py-3 text-center text-xs font-semibold text-gray-300 uppercase">L</th>
                        <th className="px-4 py-3 text-center text-xs font-semibold text-gray-300 uppercase">GF</th>
                        <th className="px-4 py-3 text-center text-xs font-semibold text-gray-300 uppercase">GA</th>
                        <th className="px-4 py-3 text-center text-xs font-semibold text-gray-300 uppercase">GD</th>
                        <th className="px-4 py-3 text-center text-xs font-semibold text-gray-300 uppercase">Pts</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-700">
                      {data.standings.map((team, index) => {
                        const position = team.position || (index + 1);
                        const isTop3 = position <= 3;
                        return (
                          <motion.tr
                            key={team.team}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: index * 0.05 }}
                            className={`hover:bg-gray-700/30 transition-colors ${
                              isTop3 ? 'bg-gradient-to-r from-yellow-500/10 to-yellow-600/10 border-l-4 border-yellow-400' : ''
                            }`}
                          >
                            <td className="px-4 py-3">
                              <div className="flex items-center">
                                {position === 1 && <Trophy className="text-yellow-400 mr-2" size={20} />}
                                {position === 2 && <span className="text-gray-400 mr-2">🥈</span>}
                                {position === 3 && <span className="text-orange-400 mr-2">🥉</span>}
                                <span className={`font-bold ${isTop3 ? 'text-yellow-400' : 'text-gray-300'}`}>
                                  {position}
                                </span>
                              </div>
                            </td>
                            <td className="px-4 py-3 text-white font-semibold">{team.team}</td>
                            <td className="px-4 py-3 text-center text-gray-300">{team.matches_played}</td>
                            <td className="px-4 py-3 text-center text-green-400 font-semibold">{team.wins}</td>
                            <td className="px-4 py-3 text-center text-gray-400">{team.draws}</td>
                            <td className="px-4 py-3 text-center text-red-400 font-semibold">{team.losses}</td>
                            <td className="px-4 py-3 text-center text-gray-300">{team.goals_for}</td>
                            <td className="px-4 py-3 text-center text-gray-300">{team.goals_against}</td>
                            <td className={`px-4 py-3 text-center font-semibold ${
                              team.goal_difference > 0 ? 'text-green-400' : team.goal_difference < 0 ? 'text-red-400' : 'text-gray-400'
                            }`}>
                              {team.goal_difference > 0 ? '+' : ''}{team.goal_difference}
                            </td>
                            <td className="px-4 py-3 text-center text-white font-bold text-lg">{team.points}</td>
                          </motion.tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </motion.div>

              {/* 3. Goals & Scoring Analytics */}
              <div className="mb-8">
                {/* Top 10 Goal Scorers */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="bg-gray-800/80 backdrop-blur-sm rounded-2xl p-6 border border-gray-700 shadow-lg"
                >
                  <div className="flex items-center gap-3 mb-6">
                    <Goal className="text-yellow-400" size={24} />
                    <h2 className="text-2xl font-bold text-white">Top 10 Goal Scorers</h2>
                  </div>
                  <div className="h-80">
                    <Bar
                      data={{
                        labels: data.top_scorers.map(p => p.name),
                        datasets: [{
                          label: 'Goals',
                          data: data.top_scorers.map(p => p.goals),
                          backgroundColor: '#FBBF24',
                          borderColor: '#F59E0B',
                          borderWidth: 2,
                        }]
                      }}
                      options={{
                        ...chartOptions,
                    scales: {
                      x: {
                            ticks: { color: '#E5E7EB', font: { size: 10 } },
                            grid: { display: false },
                      },
                      y: {
                            ticks: { color: '#E5E7EB', font: { size: 12 } },
                            grid: { color: '#4B5563', lineWidth: 1 },
                            beginAtZero: true,
                            title: {
                          display: true,
                              text: 'Goals',
                              color: '#E5E7EB',
                              font: { size: 14, weight: 'bold' as const },
                            },
                          },
                        },
                      }}
                    />
                  </div>
                </motion.div>

              </div>

              {/* 4. Player Contributions */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8"
              >
                {/* Top Assists */}
                <div className="bg-gray-800/80 backdrop-blur-sm rounded-2xl p-6 border border-gray-700 shadow-lg">
                  <div className="flex items-center gap-3 mb-6">
                    <Award className="text-pink-400" size={24} />
                    <h2 className="text-2xl font-bold text-white">Top 10 Assists</h2>
                  </div>
                  <div className="space-y-3">
                    {data.top_assists.map((player, index) => (
                      <motion.div
                        key={player.name}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.05 }}
                        className="flex items-center justify-between p-4 bg-gray-700/30 rounded-lg hover:bg-gray-700/50 transition-colors"
                      >
                        <div className="flex items-center gap-4">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${
                            index === 0 ? 'bg-yellow-500/20 text-yellow-400' :
                            index === 1 ? 'bg-gray-400/20 text-gray-300' :
                            index === 2 ? 'bg-orange-500/20 text-orange-400' :
                            'bg-gray-600/20 text-gray-400'
                          }`}>
                            {index + 1}
                          </div>
                          <div>
                            <div className="text-white font-semibold">{player.name}</div>
                            <div className="text-gray-400 text-sm">{player.squad}</div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-pink-400 font-bold text-lg">{player.assists}</div>
                          <div className="text-gray-500 text-xs">{player.assists_per90.toFixed(2)}/90</div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>

                {/* Best Goalkeepers */}
                <div className="bg-gray-800/80 backdrop-blur-sm rounded-2xl p-6 border border-gray-700 shadow-lg">
                  <div className="flex items-center gap-3 mb-6">
                    <Shield className="text-cyan-400" size={24} />
                    <h2 className="text-2xl font-bold text-white">Best Goalkeepers</h2>
                  </div>
                  <div className="space-y-3">
                    {data.best_goalkeepers.map((gk, index) => (
                      <motion.div
                        key={gk.name}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.05 }}
                        className="flex items-center justify-between p-4 bg-gray-700/30 rounded-lg hover:bg-gray-700/50 transition-colors"
                      >
                        <div className="flex items-center gap-4">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${
                            index === 0 ? 'bg-yellow-500/20 text-yellow-400' :
                            index === 1 ? 'bg-gray-400/20 text-gray-300' :
                            index === 2 ? 'bg-orange-500/20 text-orange-400' :
                            'bg-gray-600/20 text-gray-400'
                          }`}>
                            {index + 1}
                          </div>
                          <div>
                            <div className="text-white font-semibold">{gk.name}</div>
                            <div className="text-gray-400 text-sm">{gk.squad}</div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-cyan-400 font-bold text-lg">{gk.clean_sheets}</div>
                          <div className="text-gray-500 text-xs">{gk.clean_sheet_percentage.toFixed(1)}%</div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>
              </motion.div>

              {/* 5. Discipline & Fair Play */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
                className="mb-8"
              >
                {/* Team Discipline Bar Chart */}
                <div className="bg-gray-800/80 backdrop-blur-sm rounded-2xl p-6 border border-gray-700 shadow-lg">
                  <div className="flex items-center gap-3 mb-6">
                    <AlertTriangle className="text-red-400" size={24} />
                    <h2 className="text-2xl font-bold text-white">Team Discipline</h2>
                  </div>
                  <div className="h-96">
                    <Bar
                  data={{
                        labels: data.discipline.team_discipline.map(t => t.team),
                    datasets: [
                      {
                            label: 'Yellow Cards',
                            data: data.discipline.team_discipline.map(t => t.yellow_cards),
                            backgroundColor: '#FBBF24',
                            borderColor: '#F59E0B',
                            borderWidth: 1,
                          },
                          {
                            label: 'Red Cards',
                            data: data.discipline.team_discipline.map(t => t.red_cards),
                            backgroundColor: '#EF4444',
                            borderColor: '#DC2626',
                            borderWidth: 1,
                          },
                        ]
                      }}
                      options={{
                        ...chartOptions,
                        scales: {
                          x: {
                            ticks: { 
                              color: '#E5E7EB', 
                              font: { size: 9 },
                              maxRotation: 45,
                              minRotation: 45,
                            },
                            grid: { display: false },
                          },
                          y: {
                            ticks: { color: '#E5E7EB', font: { size: 12 } },
                            grid: { color: '#4B5563', lineWidth: 1 },
                            beginAtZero: true,
                            title: {
                              display: true,
                              text: 'Cards',
                              color: '#E5E7EB',
                              font: { size: 14, weight: 'bold' as const },
                            },
                          },
                        },
                      }}
                    />
                  </div>
                </div>
              </motion.div>

            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default LeagueStats;
