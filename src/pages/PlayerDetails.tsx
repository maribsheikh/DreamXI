import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Share2, Bookmark } from 'lucide-react';
import { motion } from 'framer-motion';
import PlayerCard from '../components/PlayerCard';
import PlayerStats from '../components/PlayerStats';

interface PlayerData {
  id: number;
  name: string;
  squad: string;
  position: string;
  nation: string;
  competition: string;
  age: number;
  matches_played: number;
  matches_started: number;
  minutes_played: number;
  minutes_90s: number;
  goals: number;
  assists: number;
  goals_assists: number;
  goals_no_penalty: number;
  penalties_made: number;
  penalties_attempted: number;
  yellow_cards: number;
  red_cards: number;
  expected_goals: number;
  expected_goals_no_penalty: number;
  expected_assists: number;
  expected_goals_assists: number;
  goals_per90: number;
  assists_per90: number;
  goals_assists_per90: number;
  goals_no_penalty_per90: number;
  goals_assists_no_penalty_per90: number;
  expected_goals_per90: number;
  expected_assists_per90: number;
  expected_goals_assists_per90: number;
  expected_goals_no_penalty_per90: number;
  expected_goals_assists_no_penalty_per90: number;
  progressive_carries: number;
  progressive_passes: number;
  progressive_dribbles: number;
  created_at: string;
  updated_at: string;
}

const PlayerDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [player, setPlayer] = useState<PlayerData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPlayerData = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await fetch(`http://localhost:8000/api/players/${id}/`);
        if (!response.ok) {
          throw new Error('Failed to fetch player data');
        }
        const data = await response.json();
        setPlayer(data);
      } catch (error) {
        console.error('Error fetching player data:', error);
        setError('Failed to load player data. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchPlayerData();
    }
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 text-gray-100 p-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !player) {
    return (
      <div className="min-h-screen bg-gray-900 text-gray-100 p-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center mb-8">
            <Link 
              to="/home" 
              className="flex items-center text-primary-400 hover:text-primary-300 transition-colors mr-4"
            >
              <ArrowLeft size={20} className="mr-2" />
              Back to Home
            </Link>
          </div>
          <div className="bg-red-900/50 border border-red-500 rounded-lg p-4 text-red-200">
            {error || 'Player not found'}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
      {/* Background Pattern */}
      <div className="fixed inset-0 opacity-5">
        <div className="absolute inset-0" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.1'%3E%3Ccircle cx='30' cy='30' r='2'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }} />
      </div>

      <div className="relative z-10">
        {/* Header */}
        <div className="bg-gray-900/80 backdrop-blur-sm border-b border-gray-800 sticky top-0 z-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              <div className="flex items-center">
                <Link 
                  to="/home" 
                  className="flex items-center text-primary-400 hover:text-primary-300 transition-colors mr-6"
                >
                  <ArrowLeft size={20} className="mr-2" />
                  Back to Home
                </Link>
                <div className="h-6 w-px bg-gray-700 mr-6"></div>
                <h1 className="text-xl font-bold text-white">{player.name}</h1>
              </div>
              
              <div className="flex items-center space-x-4">
                <button className="p-2 text-gray-400 hover:text-white transition-colors">
                  <Bookmark size={20} />
                </button>
                <button className="p-2 text-gray-400 hover:text-white transition-colors">
                  <Share2 size={20} />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="space-y-8"
          >
            {/* Player Card */}
            <div className="flex justify-center">
              <PlayerCard player={player} />
            </div>

            {/* Statistics */}
            <PlayerStats player={player} />

            {/* League Context */}
            {player.league_context && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.3 }}
                className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-xl p-6"
              >
                <h3 className="text-xl font-bold text-white mb-6">
                  League Context - {player.league_context.league_name}
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="text-lg font-semibold text-white mb-4">Top Players in League</h4>
                    <div className="space-y-2">
                      {player.league_context.top_players.slice(0, 5).map((leaguePlayer: any, index: number) => (
                        <div key={index} className="flex justify-between items-center py-2 border-b border-gray-700 last:border-0">
                          <span className="text-gray-300">{leaguePlayer.name}</span>
                          <div className="text-sm text-gray-400">
                            {leaguePlayer.goals}G {leaguePlayer.assists}A
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="flex items-center justify-center">
                    <div className="text-center">
                      <div className="text-4xl font-bold text-primary-400 mb-2">
                        {player.competition}
                      </div>
                      <div className="text-gray-400">Current League</div>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default PlayerDetails; 