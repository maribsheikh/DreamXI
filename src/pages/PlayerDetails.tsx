import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

interface PlayerStats {
  name: string;
  squad: string;
  position: string;
  nation: string;
  competition: string;
  age: number;
  matches_played: number;
  matches_started: number;
  minutes_played: number;
  goals: number;
  assists: number;
  goals_per90: number;
  assists_per90: number;
  expected_goals: number;
  expected_assists: number;
  expected_goals_per90: number;
  expected_assists_per90: number;
}

const PlayerDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [player, setPlayer] = useState<PlayerStats | null>(null);
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
          <h1 className="text-3xl font-bold">{player.name}</h1>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Basic Information */}
          <div className="bg-gray-800 p-6 rounded-lg shadow-lg border border-gray-700">
            <h2 className="text-xl font-semibold mb-4">Player Information</h2>
            <div className="space-y-2">
              <p><span className="text-gray-400">Team:</span> {player.squad}</p>
              <p><span className="text-gray-400">Position:</span> {player.position}</p>
              <p><span className="text-gray-400">Nationality:</span> {player.nation}</p>
              <p><span className="text-gray-400">League:</span> {player.competition}</p>
              <p><span className="text-gray-400">Age:</span> {player.age}</p>
            </div>
          </div>

          {/* Performance Stats */}
          <div className="bg-gray-800 p-6 rounded-lg shadow-lg border border-gray-700">
            <h2 className="text-xl font-semibold mb-4">Performance</h2>
            <div className="space-y-2">
              <p><span className="text-gray-400">Matches Played:</span> {player.matches_played}</p>
              <p><span className="text-gray-400">Matches Started:</span> {player.matches_started}</p>
              <p><span className="text-gray-400">Minutes Played:</span> {player.minutes_played}</p>
            </div>
          </div>

          {/* Goals and Assists */}
          <div className="bg-gray-800 p-6 rounded-lg shadow-lg border border-gray-700">
            <h2 className="text-xl font-semibold mb-4">Goals & Assists</h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <h3 className="text-lg font-medium mb-2">Actual</h3>
                <p><span className="text-gray-400">Goals:</span> {player.goals}</p>
                <p><span className="text-gray-400">Assists:</span> {player.assists}</p>
                <p><span className="text-gray-400">Goals/90:</span> {player.goals_per90.toFixed(2)}</p>
                <p><span className="text-gray-400">Assists/90:</span> {player.assists_per90.toFixed(2)}</p>
              </div>
              <div>
                <h3 className="text-lg font-medium mb-2">Expected</h3>
                <p><span className="text-gray-400">xG:</span> {player.expected_goals.toFixed(2)}</p>
                <p><span className="text-gray-400">xA:</span> {player.expected_assists.toFixed(2)}</p>
                <p><span className="text-gray-400">xG/90:</span> {player.expected_goals_per90.toFixed(2)}</p>
                <p><span className="text-gray-400">xA/90:</span> {player.expected_assists_per90.toFixed(2)}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PlayerDetails; 