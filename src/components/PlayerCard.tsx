import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { MapPin, Calendar, Trophy, Users } from 'lucide-react';
import { getPositionBasedImage, getTeamBasedImage, getPlayerImage } from '../utils/imageService';

interface PlayerCardProps {
  player: {
    name: string;
    squad: string;
    position: string;
    nation: string;
    competition: string;
    age: number;
    goals: number;
    assists: number;
    matches_played: number;
    goals_per90: number;
    assists_per90: number;
    position_metrics?: {
      saves_per90?: number;
      total_saves?: number;
      clean_sheets?: number;
      clean_sheet_percentage?: number;
      goals_prevented?: number;
      penalty_saves?: number;
    };
  };
}

const PlayerCard: React.FC<PlayerCardProps> = ({ player }) => {
  const [playerImage, setPlayerImage] = useState<string | null>(null);
  const [imageLoading, setImageLoading] = useState(true);
  const [imageError, setImageError] = useState(false);

  useEffect(() => {
    const fetchPlayerImage = async () => {
      try {
        setImageLoading(true);
        setImageError(false);

        // Prefer real image from Wikipedia; fall back to team/position avatar
        const realImg = await getPlayerImage(player.name, player.squad, player.nation);
        if (realImg) {
          setPlayerImage(realImg);
        } else {
          const teamBased = getTeamBasedImage(player.name, player.squad);
          setPlayerImage(teamBased || getPositionBasedImage(player.name, player.position));
        }
      } catch (error) {
        console.error('Error fetching player image:', error);
        setImageError(true);
      } finally {
        setImageLoading(false);
      }
    };

    fetchPlayerImage();
  }, [player.name, player.squad, player.position, player.nation]);

  const getPositionColor = (position: string) => {
    const pos = position.toLowerCase();
    if (pos.includes('goalkeeper') || pos.includes('gk')) return 'bg-red-600';
    if (pos.includes('defender') || pos.includes('cb') || pos.includes('lb') || pos.includes('rb')) return 'bg-blue-600';
    if (pos.includes('midfielder') || pos.includes('cm') || pos.includes('cdm') || pos.includes('cam')) return 'bg-green-600';
    if (pos.includes('forward') || pos.includes('st') || pos.includes('lw') || pos.includes('rw') || pos.includes('cf')) return 'bg-yellow-600';
    return 'bg-gray-600';
  };

  const getPositionAbbreviation = (position: string) => {
    const pos = position.toLowerCase();
    if (pos.includes('goalkeeper')) return 'GK';
    if (pos.includes('centre-back') || pos.includes('center-back')) return 'CB';
    if (pos.includes('left-back')) return 'LB';
    if (pos.includes('right-back')) return 'RB';
    if (pos.includes('defensive midfielder')) return 'CDM';
    if (pos.includes('central midfielder')) return 'CM';
    if (pos.includes('attacking midfielder')) return 'CAM';
    if (pos.includes('left wing')) return 'LW';
    if (pos.includes('right wing')) return 'RW';
    if (pos.includes('centre-forward') || pos.includes('center-forward')) return 'CF';
    if (pos.includes('striker')) return 'ST';
    return position.split(' ').map(word => word[0]).join('').toUpperCase();
  };

  const isGoalkeeper = () => {
    const pos = player.position.toLowerCase();
    return pos.includes('goalkeeper') || pos.includes('gk');
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className="relative bg-gradient-to-br from-gray-800 via-gray-850 to-gray-900 rounded-3xl shadow-2xl border border-gray-700/50 overflow-hidden backdrop-blur-xl"
    >
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute inset-0" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.1'%3E%3Ccircle cx='30' cy='30' r='2'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }} />
      </div>

      {/* Gradient Overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary-600/5 via-transparent to-green-600/5"></div>

      <div className="relative p-10">
        {/* Header */}
        <div className="flex items-start justify-between mb-8">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-3">
              <span className={`px-4 py-1.5 rounded-full text-xs font-bold text-white shadow-lg ${getPositionColor(player.position)}`}>
                {getPositionAbbreviation(player.position)}
              </span>
              <span className="text-sm text-gray-300 font-medium bg-gray-700/50 px-3 py-1 rounded-full">#{player.age}</span>
            </div>
            <h1 className="text-4xl font-bold text-white mb-2 tracking-tight">{player.name}</h1>
            <div className="flex items-center text-gray-300 text-base font-medium">
              <Users size={18} className="mr-2" />
              <span>{player.squad}</span>
            </div>
          </div>
        </div>

        {/* Player Image */}
        <div className="flex justify-center mb-8">
          <div className="relative">
            <div className="w-64 h-64 rounded-full overflow-hidden border-4 border-primary-500/80 shadow-2xl bg-gray-700 ring-4 ring-primary-500/20">
              {imageLoading ? (
                <div className="w-full h-full bg-gray-700 flex items-center justify-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary-500"></div>
                </div>
              ) : (
                <img
                  src={playerImage || getTeamBasedImage(player.name, player.squad)}
                  alt={player.name}
                  className="w-full h-full object-cover object-top"
                  style={{ objectPosition: 'center 20%' }}
                  onError={(e) => {
                    setImageError(true);
                    (e.currentTarget as HTMLImageElement).src = getPositionBasedImage(player.name, player.position);
                  }}
                />
              )}
            </div>
            {/* Badge */}
            <div className="absolute -bottom-2 -right-2 bg-gradient-to-br from-primary-600 to-primary-700 text-white rounded-full w-14 h-14 flex items-center justify-center text-sm font-bold shadow-xl ring-4 ring-gray-800">
              {player.age}
            </div>
          </div>
        </div>

        {/* Player Info */}
        <div className="space-y-3 mb-8">
          <div className="flex items-center justify-between py-3 px-4 bg-gray-800/40 rounded-xl border border-gray-700/50 hover:bg-gray-800/60 transition-colors">
            <div className="flex items-center text-gray-300">
              <MapPin size={18} className="mr-3" />
              <span className="text-sm font-medium">Nationality</span>
            </div>
            <span className="font-bold text-white text-base">{player.nation}</span>
          </div>
          
          <div className="flex items-center justify-between py-3 px-4 bg-gray-800/40 rounded-xl border border-gray-700/50 hover:bg-gray-800/60 transition-colors">
            <div className="flex items-center text-gray-300">
              <Trophy size={18} className="mr-3" />
              <span className="text-sm font-medium">League</span>
            </div>
            <span className="font-bold text-white text-base">{player.competition}</span>
          </div>
          
          <div className="flex items-center justify-between py-3 px-4 bg-gray-800/40 rounded-xl border border-gray-700/50 hover:bg-gray-800/60 transition-colors">
            <div className="flex items-center text-gray-300">
              <Users size={18} className="mr-3" />
              <span className="text-sm font-medium">Position</span>
            </div>
            <div className="text-right">
              <span className="font-bold text-white text-base">{player.position}</span>
              <span className="text-gray-400 text-sm ml-2">({getPositionAbbreviation(player.position)})</span>
            </div>
          </div>
          
          <div className="flex items-center justify-between py-3 px-4 bg-gray-800/40 rounded-xl border border-gray-700/50 hover:bg-gray-800/60 transition-colors">
            <div className="flex items-center text-gray-300">
              <Calendar size={18} className="mr-3" />
              <span className="text-sm font-medium">Matches</span>
            </div>
            <span className="font-bold text-white text-base">{player.matches_played}</span>
          </div>
        </div>

        {/* Stats Grid */}
        {isGoalkeeper() ? (
          <div className="grid grid-cols-2 gap-5 mb-8">
            <div className="text-center p-6 bg-gradient-to-br from-gray-800/60 to-gray-800/40 rounded-xl border border-gray-700/50 shadow-lg hover:shadow-xl transition-all">
              <div className="text-3xl font-bold text-primary-400 mb-1">
                {player.position_metrics?.clean_sheets || 0}
              </div>
              <div className="text-sm text-gray-300 font-medium mb-1">Clean Sheets</div>
              <div className="text-xs text-gray-400">
                {player.position_metrics?.clean_sheet_percentage?.toFixed(1) || '0.0'}%
              </div>
            </div>
            
            <div className="text-center p-6 bg-gradient-to-br from-gray-800/60 to-gray-800/40 rounded-xl border border-gray-700/50 shadow-lg hover:shadow-xl transition-all">
              <div className="text-3xl font-bold text-green-400 mb-1">
                {player.position_metrics?.total_saves || 0}
              </div>
              <div className="text-sm text-gray-300 font-medium mb-1">Total Saves</div>
              <div className="text-xs text-gray-400">
                {player.position_metrics?.saves_per90?.toFixed(2) || '0.00'}/90
              </div>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-5 mb-8">
            <div className="text-center p-6 bg-gradient-to-br from-gray-800/60 to-gray-800/40 rounded-xl border border-gray-700/50 shadow-lg hover:shadow-xl transition-all">
              <div className="text-3xl font-bold text-primary-400 mb-1">{player.goals}</div>
              <div className="text-sm text-gray-300 font-medium mb-1">Goals</div>
              <div className="text-xs text-gray-400">{player.goals_per90.toFixed(2)}/90</div>
            </div>
            
            <div className="text-center p-6 bg-gradient-to-br from-gray-800/60 to-gray-800/40 rounded-xl border border-gray-700/50 shadow-lg hover:shadow-xl transition-all">
              <div className="text-3xl font-bold text-green-400 mb-1">{player.assists}</div>
              <div className="text-sm text-gray-300 font-medium mb-1">Assists</div>
              <div className="text-xs text-gray-400">{player.assists_per90.toFixed(2)}/90</div>
            </div>
          </div>
        )}

        {/* Performance Indicator */}
        <div className="p-5 bg-gradient-to-r from-primary-600/20 via-primary-600/15 to-green-600/20 rounded-xl border border-primary-500/40 shadow-lg">
          <div className="flex items-center justify-between">
            <span className="text-base font-semibold text-gray-200">Performance Rating</span>
            <div className="flex items-center gap-1.5">
              {[...Array(5)].map((_, i) => {
                let rating = 0;
                if (isGoalkeeper()) {
                  // For goalkeepers, use clean sheets and saves for rating
                  const cleanSheets = player.position_metrics?.clean_sheets || 0;
                  const saves = player.position_metrics?.total_saves || 0;
                  rating = Math.min(5, Math.floor((cleanSheets + saves / 10) / 3));
                } else {
                  // For other players, use goals and assists
                  rating = Math.min(5, Math.floor((player.goals + player.assists) / 3));
                }
                return (
                  <div
                    key={i}
                    className={`w-3 h-3 rounded-full transition-all ${
                      i < rating ? 'bg-yellow-400 shadow-lg shadow-yellow-400/50' : 'bg-gray-600/50'
                    }`}
                  />
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default PlayerCard;
