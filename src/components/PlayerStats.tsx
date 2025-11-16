import React from 'react';
import { motion } from 'framer-motion';
import { Target, Zap, Clock, TrendingUp, Award, BarChart3 } from 'lucide-react';

interface PlayerStatsProps {
  player: {
    position: string;
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
    position_metrics?: {
      // Goalkeeper metrics
      saves_per90?: number;
      total_saves?: number;
      clean_sheets?: number;
      clean_sheet_percentage?: number;
      goals_prevented?: number;
      penalty_saves?: number;
      // Defender metrics
      tackles_per90?: number;
      total_tackles?: number;
      interceptions_per90?: number;
      total_interceptions?: number;
      aerial_duels_per90?: number;
      total_aerial_duels?: number;
      aerial_duel_win_rate?: number;
      passing_accuracy?: number;
      progressive_passes_per90?: number;
      progressive_carries_per90?: number;
      // Midfielder/Forward metrics
      key_passes_per90?: number;
      total_key_passes?: number;
      dribbles_per90?: number;
      total_dribbles?: number;
      dribble_success_rate?: number;
    };
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

  const position = player.position?.toLowerCase() || '';
  const isGoalkeeper = position.includes('goalkeeper') || position.includes('gk');
  const isDefender = position.includes('defender') || position.includes('back') || position.includes('df');
  const isMidfielder = position.includes('midfielder') || position.includes('mf');
  const isForward = position.includes('forward') || position.includes('striker') || position.includes('wing') || position.includes('fw');
  const positionMetrics = player.position_metrics || {};

  return (
    <div className="space-y-8">
      {/* Position-Specific Performance Overview */}
      <div>
        <h3 className="text-xl font-bold text-white mb-6 flex items-center">
          <BarChart3 className="mr-2" size={24} />
          {isGoalkeeper ? 'Goalkeeper Performance' : isDefender ? 'Defensive Performance' : 'Performance Overview'}
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Goalkeeper Metrics */}
          {isGoalkeeper && positionMetrics.saves_per90 !== undefined && (
            <>
              <StatCard
                title="Saves per 90"
                value={positionMetrics.saves_per90?.toFixed(2) || '0.00'}
                subtitle={`${positionMetrics.total_saves || 0} total saves`}
                icon={<Target className="text-white" size={24} />}
                color="bg-blue-600/20"
              />
              <StatCard
                title="Clean Sheets"
                value={positionMetrics.clean_sheets || 0}
                subtitle={`${positionMetrics.clean_sheet_percentage?.toFixed(1) || 0}% of matches`}
                icon={<Award className="text-white" size={24} />}
                color="bg-green-600/20"
              />
              <StatCard
                title="Goals Prevented"
                value={positionMetrics.goals_prevented?.toFixed(2) || '0.00'}
                subtitle="vs Expected Goals"
                icon={<Zap className="text-white" size={24} />}
                color="bg-purple-600/20"
              />
              <StatCard
                title="Penalty Saves"
                value={positionMetrics.penalty_saves || 0}
                subtitle="This season"
                icon={<Target className="text-white" size={24} />}
                color="bg-yellow-600/20"
              />
            </>
          )}
          
          {/* Defender Metrics */}
          {isDefender && positionMetrics.tackles_per90 !== undefined && (
            <>
              <StatCard
                title="Tackles per 90"
                value={positionMetrics.tackles_per90?.toFixed(2) || '0.00'}
                subtitle={`${positionMetrics.total_tackles || 0} total`}
                icon={<Target className="text-white" size={24} />}
                color="bg-red-600/20"
              />
              <StatCard
                title="Interceptions per 90"
                value={positionMetrics.interceptions_per90?.toFixed(2) || '0.00'}
                subtitle={`${positionMetrics.total_interceptions || 0} total`}
                icon={<Zap className="text-white" size={24} />}
                color="bg-green-600/20"
              />
              <StatCard
                title="Aerial Duels per 90"
                value={positionMetrics.aerial_duels_per90?.toFixed(2) || '0.00'}
                subtitle={`${positionMetrics.aerial_duel_win_rate?.toFixed(1) || 0}% win rate`}
                icon={<Award className="text-white" size={24} />}
                color="bg-yellow-600/20"
              />
              <StatCard
                title="Passing Accuracy"
                value={`${positionMetrics.passing_accuracy?.toFixed(1) || 0}%`}
                subtitle={`${positionMetrics.progressive_passes_per90?.toFixed(2) || 0} prog passes/90`}
                icon={<BarChart3 className="text-white" size={24} />}
                color="bg-blue-600/20"
              />
            </>
          )}
          
          {/* Midfielder/Forward Metrics */}
          {!isGoalkeeper && !isDefender && (
            <>
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
              {positionMetrics.key_passes_per90 !== undefined && (
                <StatCard
                  title="Key Passes per 90"
                  value={positionMetrics.key_passes_per90?.toFixed(2) || '0.00'}
                  subtitle={`${positionMetrics.total_key_passes || 0} total`}
                  icon={<Award className="text-white" size={24} />}
                  color="bg-yellow-600/20"
                />
              )}
              {positionMetrics.dribbles_per90 !== undefined ? (
                <StatCard
                  title="Dribbles per 90"
                  value={positionMetrics.dribbles_per90?.toFixed(2) || '0.00'}
                  subtitle={`${positionMetrics.dribble_success_rate?.toFixed(1) || 0}% success rate`}
                  icon={<BarChart3 className="text-white" size={24} />}
                  color="bg-purple-600/20"
                />
              ) : (
                <StatCard
                  title="Goal Contributions"
                  value={player.goals_assists}
                  subtitle={`${player.goals_assists_per90.toFixed(2)} per 90`}
                  icon={<Award className="text-white" size={24} />}
                  color="bg-yellow-600/20"
                  trend={calculateEfficiency(player.goals_assists, player.expected_goals_assists)}
                />
              )}
            </>
          )}
          
          {/* Matches Played - Always shown */}
          <StatCard
            title="Matches Played"
            value={player.matches_played}
            subtitle={`${formatMinutes(player.minutes_played)} total`}
            icon={<Clock className="text-white" size={24} />}
            color="bg-blue-600/20"
          />
        </div>
      </div>

      {/* Position-Specific Detailed Stats */}
      {!isGoalkeeper && (
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
      )}

      {/* Goalkeeper Detailed Stats */}
      {isGoalkeeper && positionMetrics.saves_per90 !== undefined && (
        <div>
          <h3 className="text-xl font-bold text-white mb-6 flex items-center">
            <TrendingUp className="mr-2" size={24} />
            Goalkeeper Statistics
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-xl p-6">
              <h4 className="text-lg font-semibold text-white mb-4">Saves & Clean Sheets</h4>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">Saves per 90</span>
                  <span className="text-white font-semibold">{positionMetrics.saves_per90?.toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">Total Saves</span>
                  <span className="text-white font-semibold">{positionMetrics.total_saves || 0}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">Clean Sheets</span>
                  <span className="text-white font-semibold">{positionMetrics.clean_sheets || 0}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">Clean Sheet %</span>
                  <span className="text-white font-semibold">{positionMetrics.clean_sheet_percentage?.toFixed(1) || 0}%</span>
                </div>
              </div>
            </div>
            <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-xl p-6">
              <h4 className="text-lg font-semibold text-white mb-4">Defensive Impact</h4>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">Goals Prevented</span>
                  <span className="text-white font-semibold">{positionMetrics.goals_prevented?.toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">Penalty Saves</span>
                  <span className="text-white font-semibold">{positionMetrics.penalty_saves || 0}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">Matches Played</span>
                  <span className="text-white font-semibold">{player.matches_played}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Defender Detailed Stats */}
      {isDefender && positionMetrics.tackles_per90 !== undefined && (
        <div>
          <h3 className="text-xl font-bold text-white mb-6 flex items-center">
            <TrendingUp className="mr-2" size={24} />
            Defensive Statistics
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-xl p-6">
              <h4 className="text-lg font-semibold text-white mb-4">Defensive Actions</h4>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">Tackles per 90</span>
                  <span className="text-white font-semibold">{positionMetrics.tackles_per90?.toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">Total Tackles</span>
                  <span className="text-white font-semibold">{positionMetrics.total_tackles || 0}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">Interceptions per 90</span>
                  <span className="text-white font-semibold">{positionMetrics.interceptions_per90?.toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">Total Interceptions</span>
                  <span className="text-white font-semibold">{positionMetrics.total_interceptions || 0}</span>
                </div>
              </div>
            </div>
            <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-xl p-6">
              <h4 className="text-lg font-semibold text-white mb-4">Aerial & Passing</h4>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">Aerial Duels per 90</span>
                  <span className="text-white font-semibold">{positionMetrics.aerial_duels_per90?.toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">Aerial Duel Win Rate</span>
                  <span className="text-white font-semibold">{positionMetrics.aerial_duel_win_rate?.toFixed(1)}%</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">Passing Accuracy</span>
                  <span className="text-white font-semibold">{positionMetrics.passing_accuracy?.toFixed(1)}%</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">Progressive Passes/90</span>
                  <span className="text-white font-semibold">{positionMetrics.progressive_passes_per90?.toFixed(2)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Midfielder/Forward Detailed Stats */}
      {(isMidfielder || isForward) && positionMetrics.key_passes_per90 !== undefined && (
        <div>
          <h3 className="text-xl font-bold text-white mb-6 flex items-center">
            <TrendingUp className="mr-2" size={24} />
            Attacking Statistics
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-xl p-6">
              <h4 className="text-lg font-semibold text-white mb-4">Key Passes & Assists</h4>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">Key Passes per 90</span>
                  <span className="text-white font-semibold">{positionMetrics.key_passes_per90?.toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">Total Key Passes</span>
                  <span className="text-white font-semibold">{positionMetrics.total_key_passes || 0}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">Assists</span>
                  <span className="text-white font-semibold">{player.assists}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">Expected Assists (xA)</span>
                  <span className="text-white font-semibold">{player.expected_assists.toFixed(2)}</span>
                </div>
              </div>
            </div>
            <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-xl p-6">
              <h4 className="text-lg font-semibold text-white mb-4">Dribbling & Progression</h4>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">Dribbles per 90</span>
                  <span className="text-white font-semibold">{positionMetrics.dribbles_per90?.toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">Total Dribbles</span>
                  <span className="text-white font-semibold">{positionMetrics.total_dribbles || 0}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">Dribble Success Rate</span>
                  <span className="text-white font-semibold">{positionMetrics.dribble_success_rate?.toFixed(1)}%</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">Progressive Passes/90</span>
                  <span className="text-white font-semibold">{positionMetrics.progressive_passes_per90?.toFixed(2)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Per 90 Minutes Stats - Only for non-goalkeepers */}
      {!isGoalkeeper && (
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
      )}

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


