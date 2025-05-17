import React, { useState, useEffect } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js';
import { Line } from 'react-chartjs-2';
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

interface LeagueStats {
  [key: string]: {
    top_scorers: Array<{
      name: string;
      squad: string;
      goals: number;
      goals_per90: number;
      expected_goals: number;
      expected_goals_per90: number;
    }>;
    top_assisters: Array<{
      name: string;
      squad: string;
      assists: number;
      assists_per90: number;
      expected_assists: number;
      expected_assists_per90: number;
    }>;
  };
}

const PlayerStats: React.FC = () => {
  const [leagueStats, setLeagueStats] = useState<LeagueStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await fetch('http://localhost:8000/api/players/league_stats/');
        if (!response.ok) {
          throw new Error('Failed to fetch league statistics');
        }
        const data = await response.json();
        console.log('Fetched data:', data);
        setLeagueStats(data);
      } catch (error) {
        console.error('Error fetching data:', error);
        setError('Failed to load league statistics. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
        labels: {
          color: '#E5E7EB',
          font: {
            size: 12
          },
          padding: 20
        }
      },
      title: {
        display: true,
        color: '#E5E7EB',
        font: {
          size: 16,
          weight: 'bold' as const
        },
        padding: {
          bottom: 30
        }
      },
      tooltip: {
        backgroundColor: 'rgba(17, 24, 39, 0.8)',
        titleFont: {
          size: 14
        },
        bodyFont: {
          size: 13
        },
        padding: 12,
        cornerRadius: 8,
        callbacks: {
          label: function(context: any) {
            const label = context.dataset.label || '';
            const value = context.parsed.y || 0;
            return `${label}: ${value.toFixed(2)}`;
          }
        }
      }
    },
    scales: {
      x: {
        grid: {
          color: 'rgba(75, 85, 99, 0.3)',
        },
        ticks: {
          color: '#E5E7EB',
          maxRotation: 45,
          minRotation: 45,
          font: {
            size: 11
          }
        }
      },
      y: {
        grid: {
          color: 'rgba(75, 85, 99, 0.3)',
        },
        ticks: {
          color: '#E5E7EB',
          font: {
            size: 12
          },
          callback: function(value: any) {
            return value.toFixed(2);
          },
          stepSize: 0.01
        },
        beginAtZero: true
      },
    },
  };

  if (loading) {
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
            <h1 className="text-3xl font-bold">League Statistics</h1>
          </div>
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
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
            <h1 className="text-3xl font-bold">League Statistics</h1>
          </div>
          <div className="bg-red-900/50 border border-red-500 rounded-lg p-4 text-red-200">
            {error}
          </div>
        </div>
      </div>
    );
  }

  if (!leagueStats || Object.keys(leagueStats).length === 0) {
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
            <h1 className="text-3xl font-bold">League Statistics</h1>
          </div>
          <div className="bg-gray-800 rounded-lg p-6 text-center">
            No league data available. Please make sure the database is populated with player statistics.
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
          <h1 className="text-3xl font-bold">League Statistics</h1>
        </div>

        <div className="grid grid-cols-1 gap-8">
          {Object.entries(leagueStats).map(([league, stats]) => (
            <div key={league} className="bg-gray-800 p-6 rounded-lg shadow-lg border border-gray-700">
              <h2 className="text-2xl font-bold mb-6">{league}</h2>
              
              {/* Top Scorers Chart */}
              <h3 className="text-xl font-semibold mb-4">Top Scorers (Per 90 Minutes)</h3>
              <div className="h-[400px]">
                <Line
                  data={{
                    labels: stats.top_scorers.map(player => `${player.name} (${player.squad})`),
                    datasets: [
                      {
                        label: 'Goals per 90',
                        data: stats.top_scorers.map(player => player.goals_per90),
                        borderColor: 'rgb(99, 102, 241)',
                        backgroundColor: 'rgba(99, 102, 241, 0.5)',
                        pointRadius: 6,
                        pointHoverRadius: 8,
                        tension: 0.1,
                        fill: false
                      },
                      {
                        label: 'Expected Goals per 90',
                        data: stats.top_scorers.map(player => player.expected_goals_per90),
                        borderColor: 'rgb(52, 211, 153)',
                        backgroundColor: 'rgba(52, 211, 153, 0.5)',
                        pointRadius: 6,
                        pointHoverRadius: 8,
                        tension: 0.1,
                        fill: false
                      },
                      {
                        label: 'Total Goals per 90 (Actual + Expected)',
                        data: stats.top_scorers.map(player => player.goals_per90 + player.expected_goals_per90),
                        borderColor: 'rgb(244, 114, 182)',
                        backgroundColor: 'rgba(244, 114, 182, 0.5)',
                        pointRadius: 6,
                        pointHoverRadius: 8,
                        tension: 0.1,
                        fill: false
                      }
                    ],
                  }}
                  options={{
                    ...chartOptions,
                    maintainAspectRatio: false,
                    plugins: {
                      ...chartOptions.plugins,
                      title: {
                        ...chartOptions.plugins.title,
                        text: 'Goals vs Expected Goals (Per 90 Minutes)',
                      },
                      tooltip: {
                        ...chartOptions.plugins.tooltip,
                        callbacks: {
                          label: function(context: any) {
                            const label = context.dataset.label || '';
                            const value = context.parsed.y || 0;
                            return `${label}: ${value.toFixed(2)}`;
                          },
                          afterBody: function(context: any) {
                            const playerIndex = context[0].dataIndex;
                            const player = stats.top_scorers[playerIndex];
                            return [
                              '',
                              `Total Goals: ${player.goals}`,
                              `Expected Goals: ${player.expected_goals.toFixed(2)}`
                            ];
                          }
                        }
                      }
                    },
                    scales: {
                      x: {
                        ...chartOptions.scales.x,
                        grid: {
                          display: true,
                          color: 'rgba(75, 85, 99, 0.2)'
                        }
                      },
                      y: {
                        ...chartOptions.scales.y,
                        grid: {
                          display: true,
                          color: 'rgba(75, 85, 99, 0.2)'
                        },
                        min: 0,
                        max: Math.max(...stats.top_scorers.map(p => Math.max(p.goals_per90 + p.expected_goals_per90))) + 0.1,
                        ticks: {
                          stepSize: 0.01,
                          callback: function(value: any) {
                            return value.toFixed(2);
                          }
                        }
                      }
                    }
                  }}
                />
              </div>

              {/* Top Assisters Chart */}
              <h3 className="text-xl font-semibold mb-4">Top Assisters (Per 90 Minutes)</h3>
              <div className="h-[400px]">
                <Line
                  data={{
                    labels: stats.top_assisters.map(player => `${player.name} (${player.squad})`),
                    datasets: [
                      {
                        label: 'Assists per 90',
                        data: stats.top_assisters.map(player => player.assists_per90),
                        borderColor: 'rgb(52, 211, 153)',
                        backgroundColor: 'rgba(52, 211, 153, 0.5)',
                        pointRadius: 6,
                        pointHoverRadius: 8,
                        tension: 0.1,
                        fill: false
                      },
                      {
                        label: 'Expected Assists per 90',
                        data: stats.top_assisters.map(player => player.expected_assists_per90),
                        borderColor: 'rgb(99, 102, 241)',
                        backgroundColor: 'rgba(99, 102, 241, 0.5)',
                        pointRadius: 6,
                        pointHoverRadius: 8,
                        tension: 0.1,
                        fill: false
                      },
                      {
                        label: 'Total Assists per 90 (Actual + Expected)',
                        data: stats.top_assisters.map(player => player.assists_per90 + player.expected_assists_per90),
                        borderColor: 'rgb(244, 114, 182)',
                        backgroundColor: 'rgba(244, 114, 182, 0.5)',
                        pointRadius: 6,
                        pointHoverRadius: 8,
                        tension: 0.1,
                        fill: false
                      }
                    ],
                  }}
                  options={{
                    ...chartOptions,
                    maintainAspectRatio: false,
                    plugins: {
                      ...chartOptions.plugins,
                      title: {
                        ...chartOptions.plugins.title,
                        text: 'Assists vs Expected Assists (Per 90 Minutes)',
                      },
                      tooltip: {
                        ...chartOptions.plugins.tooltip,
                        callbacks: {
                          label: function(context: any) {
                            const label = context.dataset.label || '';
                            const value = context.parsed.y || 0;
                            return `${label}: ${value.toFixed(2)}`;
                          },
                          afterBody: function(context: any) {
                            const playerIndex = context[0].dataIndex;
                            const player = stats.top_assisters[playerIndex];
                            return [
                              '',
                              `Total Assists: ${player.assists}`,
                              `Expected Assists: ${player.expected_assists.toFixed(2)}`
                            ];
                          }
                        }
                      }
                    },
                    scales: {
                      x: {
                        ...chartOptions.scales.x,
                        grid: {
                          display: true,
                          color: 'rgba(75, 85, 99, 0.2)'
                        }
                      },
                      y: {
                        ...chartOptions.scales.y,
                        grid: {
                          display: true,
                          color: 'rgba(75, 85, 99, 0.2)'
                        },
                        min: 0,
                        max: Math.max(...stats.top_assisters.map(p => Math.max(p.assists_per90 + p.expected_assists_per90))) + 0.1,
                        ticks: {
                          stepSize: 0.01,
                          callback: function(value: any) {
                            return value.toFixed(2);
                          }
                        }
                      }
                    }
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default PlayerStats; 