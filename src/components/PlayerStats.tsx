import React from 'react';
import { motion } from 'framer-motion';
import { Target, Zap, Clock, TrendingUp, Award, BarChart3 } from 'lucide-react';

interface PlayerStatsProps {
  player: {
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
  };
}

const StatCard: React.FC<{
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ReactNode;
  color: string;
  trend?: number;
}> = ({ title, value, subtitle, icon, color, trend }) => (
  <motion.div
    initial={{ opacity: 0, scale: 0.9 }}
    animate={{ opacity: 1, scale: 1 }}
    transition={{ duration: 0.3 }}
    className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-xl p-6 hover:bg-gray-800/70 transition-all duration-300"
  >
    <div className="flex items-center justify-between mb-4">
      <div className={`p-3 rounded-lg ${color}`}>
        {icon}
      </div>
      {trend && (
        <div className={`text-sm font-medium ${trend > 0 ? 'text-green-400' : 'text-red-400'}`}>
          {trend > 0 ? '+' : ''}{trend}%
        </div>
      )}
    </div>
    <div className="text-2xl font-bold text-white mb-1">{value}</div>
    <div className="text-sm text-gray-400">{title}</div>
    {subtitle && <div className="text-xs text-gray-500 mt-1">{subtitle}</div>}
  </motion.div>
);

const PlayerStats: React.FC<PlayerStatsProps> = ({ player }) => {
  const formatMinutes = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
  };

  const calculateEfficiency = (actual: number, expected: number) => {
    if (expected === 0) return 0;
    return ((actual - expected) / expected * 100);
  };

  return (
    <div className="space-y-8">
      {/* Performance Overview */}
      <div>
        <h3 className="text-xl font-bold text-white mb-6 flex items-center">
          <BarChart3 className="mr-2" size={24} />
          Performance Overview
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard
            title="Goals"
            value={player.goals}
            subtitle={`${player.goals_per90.toFixed(2)} per 90`}
            icon={<Target className="text-white" size={24} />}
            color="bg-red-600/20"
            trend={calculateEfficiency(player.goals, player.expected_goals)}
          />
          <StatCard
            title="Assists"
            value={player.assists}
            subtitle={`${player.assists_per90.toFixed(2)} per 90`}
            icon={<Zap className="text-white" size={24} />}
            color="bg-green-600/20"
            trend={calculateEfficiency(player.assists, player.expected_assists)}
          />
          <StatCard
            title="Goal Contributions"
            value={player.goals_assists}
            subtitle={`${player.goals_assists_per90.toFixed(2)} per 90`}
            icon={<Award className="text-white" size={24} />}
            color="bg-yellow-600/20"
            trend={calculateEfficiency(player.goals_assists, player.expected_goals_assists)}
          />
          <StatCard
            title="Minutes Played"
            value={formatMinutes(player.minutes_played)}
            subtitle={`${player.minutes_90s.toFixed(1)} 90s`}
            icon={<Clock className="text-white" size={24} />}
            color="bg-blue-600/20"
          />
        </div>
      </div>

      {/* Expected vs Actual */}
      <div>
        <h3 className="text-xl font-bold text-white mb-6 flex items-center">
          <TrendingUp className="mr-2" size={24} />
          Expected vs Actual Performance
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Goals Comparison */}
          <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-xl p-6">
            <h4 className="text-lg font-semibold text-white mb-4">Goals Analysis</h4>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-gray-400">Actual Goals</span>
                <span className="text-white font-semibold">{player.goals}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-400">Expected Goals (xG)</span>
                <span className="text-white font-semibold">{player.expected_goals.toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-400">Non-Penalty Goals</span>
                <span className="text-white font-semibold">{player.goals_no_penalty}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-400">Penalties</span>
                <span className="text-white font-semibold">{player.penalties_made}/{player.penalties_attempted}</span>
              </div>
              
              {/* Progress Bar */}
              <div className="mt-4">
                <div className="flex justify-between text-xs text-gray-400 mb-2">
                  <span>Efficiency</span>
                  <span>{calculateEfficiency(player.goals, player.expected_goals).toFixed(1)}%</span>
                </div>
                <div className="w-full bg-gray-700 rounded-full h-2">
                  <div 
                    className={`h-2 rounded-full ${calculateEfficiency(player.goals, player.expected_goals) >= 0 ? 'bg-green-500' : 'bg-red-500'}`}
                    style={{ width: `${Math.min(100, Math.abs(calculateEfficiency(player.goals, player.expected_goals)))}%` }}
                  ></div>
                </div>
              </div>
            </div>
          </div>

          {/* Assists Comparison */}
          <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-xl p-6">
            <h4 className="text-lg font-semibold text-white mb-4">Assists Analysis</h4>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-gray-400">Actual Assists</span>
                <span className="text-white font-semibold">{player.assists}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-400">Expected Assists (xA)</span>
                <span className="text-white font-semibold">{player.expected_assists.toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-400">Goal Contributions</span>
                <span className="text-white font-semibold">{player.goals_assists}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-400">Non-Penalty Contributions</span>
                <span className="text-white font-semibold">{player.goals_assists_no_penalty_per90.toFixed(2)}/90</span>
              </div>
              
              {/* Progress Bar */}
              <div className="mt-4">
                <div className="flex justify-between text-xs text-gray-400 mb-2">
                  <span>Efficiency</span>
                  <span>{calculateEfficiency(player.assists, player.expected_assists).toFixed(1)}%</span>
                </div>
                <div className="w-full bg-gray-700 rounded-full h-2">
                  <div 
                    className={`h-2 rounded-full ${calculateEfficiency(player.assists, player.expected_assists) >= 0 ? 'bg-green-500' : 'bg-red-500'}`}
                    style={{ width: `${Math.min(100, Math.abs(calculateEfficiency(player.assists, player.expected_assists)))}%` }}
                  ></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Per 90 Minutes Stats */}
      <div>
        <h3 className="text-xl font-bold text-white mb-6">Per 90 Minutes Statistics</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <StatCard
            title="Goals per 90"
            value={player.goals_per90.toFixed(2)}
            subtitle={`Expected: ${player.expected_goals_per90.toFixed(2)}`}
            icon={<Target className="text-white" size={24} />}
            color="bg-red-600/20"
          />
          <StatCard
            title="Assists per 90"
            value={player.assists_per90.toFixed(2)}
            subtitle={`Expected: ${player.expected_assists_per90.toFixed(2)}`}
            icon={<Zap className="text-white" size={24} />}
            color="bg-green-600/20"
          />
          <StatCard
            title="Contributions per 90"
            value={player.goals_assists_per90.toFixed(2)}
            subtitle={`Expected: ${player.expected_goals_assists_per90.toFixed(2)}`}
            icon={<Award className="text-white" size={24} />}
            color="bg-yellow-600/20"
          />
        </div>
      </div>

      {/* Discipline & Progression */}
      <div>
        <h3 className="text-xl font-bold text-white mb-6">Discipline & Progression</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-xl p-6">
            <h4 className="text-lg font-semibold text-white mb-4">Discipline</h4>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-gray-400">Yellow Cards</span>
                <span className="text-yellow-400 font-semibold">{player.yellow_cards}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-400">Red Cards</span>
                <span className="text-red-400 font-semibold">{player.red_cards}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-400">Total Cards</span>
                <span className="text-white font-semibold">{player.yellow_cards + player.red_cards}</span>
              </div>
            </div>
          </div>

          <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-xl p-6">
            <h4 className="text-lg font-semibold text-white mb-4">Progressive Actions</h4>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-gray-400">Progressive Carries</span>
                <span className="text-blue-400 font-semibold">{player.progressive_carries}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-400">Progressive Passes</span>
                <span className="text-green-400 font-semibold">{player.progressive_passes}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-400">Progressive Dribbles</span>
                <span className="text-purple-400 font-semibold">{player.progressive_dribbles}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PlayerStats;


