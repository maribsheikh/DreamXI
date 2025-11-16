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
      className="relative bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl shadow-2xl border border-gray-700 overflow-hidden"
    >
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute inset-0" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.1'%3E%3Ccircle cx='30' cy='30' r='2'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }} />
      </div>

      <div className="relative p-8">
        {/* Header */}
        <div className="flex items-start justify-between mb-6">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <span className={`px-3 py-1 rounded-full text-xs font-semibold text-white ${getPositionColor(player.position)}`}>
                {getPositionAbbreviation(player.position)}
              </span>
              <span className="text-sm text-gray-400">#{player.age}</span>
            </div>
            <h1 className="text-3xl font-bold text-white mb-1">{player.name}</h1>
            <div className="flex items-center text-gray-400 text-sm">
              <Users size={16} className="mr-1" />
              <span>{player.squad}</span>
            </div>
          </div>
        </div>

        {/* Player Image */}
        <div className="flex justify-center mb-6">
          <div className="relative">
            <div className="w-56 h-56 rounded-full overflow-hidden border-4 border-primary-500 shadow-lg bg-gray-700">
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
            <div className="absolute -bottom-2 -right-2 bg-primary-600 text-white rounded-full w-12 h-12 flex items-center justify-center text-xs font-bold shadow-lg">
              {player.age}
            </div>
          </div>
        </div>

        {/* Player Info */}
        <div className="space-y-4">
          <div className="flex items-center justify-between py-2 border-b border-gray-700">
            <div className="flex items-center text-gray-300">
              <MapPin size={16} className="mr-2" />
              <span className="text-sm">Nationality</span>
            </div>
            <span className="font-semibold text-white">{player.nation}</span>
          </div>
          
          <div className="flex items-center justify-between py-2 border-b border-gray-700">
            <div className="flex items-center text-gray-300">
              <Trophy size={16} className="mr-2" />
              <span className="text-sm">League</span>
            </div>
            <span className="font-semibold text-white">{player.competition}</span>
          </div>
          
          <div className="flex items-center justify-between py-2 border-b border-gray-700">
            <div className="flex items-center text-gray-300">
              <Users size={16} className="mr-2" />
              <span className="text-sm">Position</span>
            </div>
            <div className="text-right">
              <span className="font-semibold text-white">{player.position}</span>
              <span className="text-gray-400 text-sm ml-2">({getPositionAbbreviation(player.position)})</span>
            </div>
          </div>
          
          <div className="flex items-center justify-between py-2 border-b border-gray-700">
            <div className="flex items-center text-gray-300">
              <Calendar size={16} className="mr-2" />
              <span className="text-sm">Matches</span>
            </div>
            <span className="font-semibold text-white">{player.matches_played}</span>
          </div>
        </div>

        {/* Stats Grid */}
        {isGoalkeeper() ? (
          <div className="grid grid-cols-2 gap-4 mt-6">
            <div className="text-center p-4 bg-gray-800/50 rounded-lg border border-gray-700">
              <div className="text-2xl font-bold text-primary-400">
                {player.position_metrics?.clean_sheets || 0}
              </div>
              <div className="text-xs text-gray-400">Clean Sheets</div>
              <div className="text-xs text-gray-500">
                {player.position_metrics?.clean_sheet_percentage?.toFixed(1) || '0.0'}%
              </div>
            </div>
            
            <div className="text-center p-4 bg-gray-800/50 rounded-lg border border-gray-700">
              <div className="text-2xl font-bold text-green-400">
                {player.position_metrics?.total_saves || 0}
              </div>
              <div className="text-xs text-gray-400">Total Saves</div>
              <div className="text-xs text-gray-500">
                {player.position_metrics?.saves_per90?.toFixed(2) || '0.00'}/90
              </div>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4 mt-6">
            <div className="text-center p-4 bg-gray-800/50 rounded-lg border border-gray-700">
              <div className="text-2xl font-bold text-primary-400">{player.goals}</div>
              <div className="text-xs text-gray-400">Goals</div>
              <div className="text-xs text-gray-500">{player.goals_per90.toFixed(2)}/90</div>
            </div>
            
            <div className="text-center p-4 bg-gray-800/50 rounded-lg border border-gray-700">
              <div className="text-2xl font-bold text-green-400">{player.assists}</div>
              <div className="text-xs text-gray-400">Assists</div>
              <div className="text-xs text-gray-500">{player.assists_per90.toFixed(2)}/90</div>
            </div>
          </div>
        )}

        {/* Performance Indicator */}
        <div className="mt-6 p-4 bg-gradient-to-r from-primary-600/20 to-green-600/20 rounded-lg border border-primary-500/30">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-300">Performance Rating</span>
            <div className="flex items-center">
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
                    className={`w-2 h-2 rounded-full mx-1 ${
                      i < rating ? 'bg-yellow-400' : 'bg-gray-600'
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
