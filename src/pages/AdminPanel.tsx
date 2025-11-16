import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Upload, FileText, CheckCircle, XCircle, AlertCircle, Shield, LogOut } from 'lucide-react';
import backgroundImage from '../assets/homepage.png';
import { logoutUser } from '../utils/auth';

interface UploadStatus {
  status: 'idle' | 'uploading' | 'success' | 'error';
  message: string;
}

const AdminPanel: React.FC = () => {
  const navigate = useNavigate();
  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  const [checking, setChecking] = useState<boolean>(true);
  const [token, setToken] = useState<string | null>(null);
  
  const [playerStatsStatus, setPlayerStatsStatus] = useState<UploadStatus>({ status: 'idle', message: '' });
  const [teamStandingsStatus, setTeamStandingsStatus] = useState<UploadStatus>({ status: 'idle', message: '' });
  const [leagueStatsStatus, setLeagueStatsStatus] = useState<UploadStatus>({ status: 'idle', message: '' });

  useEffect(() => {
    // Get token from localStorage
    const storedToken = localStorage.getItem('authToken');
    if (!storedToken) {
      navigate('/login');
      return;
    }
    setToken(storedToken);
    checkAdminStatus(storedToken);
  }, [navigate]);

  const checkAdminStatus = async (authToken: string) => {
    try {
      const response = await fetch('http://localhost:8000/api/admin/check/', {
        headers: {
          'Authorization': `Token ${authToken}`,
        },
      });
      
      if (response.ok) {
        const data = await response.json();
        setIsAdmin(data.is_admin);
        if (!data.is_admin) {
          navigate('/home');
        }
      } else {
        navigate('/login');
      }
    } catch (error) {
      console.error('Error checking admin status:', error);
      navigate('/login');
    } finally {
      setChecking(false);
    }
  };

  const handleFileUpload = async (
    file: File,
    endpoint: string,
    setStatus: React.Dispatch<React.SetStateAction<UploadStatus>>
  ) => {
    if (!file) {
      setStatus({ status: 'error', message: 'Please select a file' });
      return;
    }

    setStatus({ status: 'uploading', message: 'Uploading file...' });

    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch(`http://localhost:8000/api/${endpoint}`, {
        method: 'POST',
        headers: {
          'Authorization': `Token ${token}`,
        },
        body: formData,
      });

      const data = await response.json();

      if (response.ok) {
        let successMessage = data.message || 'File uploaded successfully';
        
        // Add additional info for player stats
        if (endpoint.includes('player-stats') && data.players_loaded) {
          successMessage += `. ${data.players_loaded} players loaded. New dataset is now live!`;
        } else {
          successMessage += '. New dataset is now live and available immediately!';
        }
        
        setStatus({
          status: 'success',
          message: successMessage,
        });
      } else {
        setStatus({
          status: 'error',
          message: data.error || 'Upload failed',
        });
      }
    } catch (error) {
      setStatus({
        status: 'error',
        message: 'Network error. Please try again.',
      });
    }
  };

  if (checking) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  if (!isAdmin) {
    return null;
  }

  return (
    <div className="relative min-h-screen">
      {/* Background Image */}
      <div
        className="fixed inset-0 bg-cover bg-center bg-no-repeat -z-10"
        style={{
          backgroundImage: `linear-gradient(rgba(17, 24, 39, 0.95), rgba(17, 24, 39, 0.95)), url(${backgroundImage})`,
          minHeight: '100vh',
        }}
      />

      {/* Header */}
      <header className="bg-gray-800 border-b border-gray-700 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Shield className="text-yellow-400" size={24} />
              <h1 className="text-3xl font-bold text-white">Admin Panel</h1>
            </div>
            <button
              onClick={async () => {
                try {
                  await logoutUser();
                  navigate('/login');
                } catch (error) {
                  console.error('Logout error:', error);
                  // Navigate to login even if logout fails
                  navigate('/login');
                }
              }}
              className="inline-flex items-center gap-2 px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white font-medium rounded-lg transition-colors duration-200"
            >
              <LogOut size={18} />
              Back to Login
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-8"
        >
          {/* Info Card */}
          <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-6">
            <div className="flex items-start gap-4">
              <AlertCircle className="text-yellow-400 mt-1" size={24} />
              <div>
                <h3 className="text-lg font-semibold text-yellow-400 mb-2">Season Data Upload</h3>
                <p className="text-gray-300 text-sm mb-2">
                  Upload new season datasets after a season ends. This will replace all existing data.
                  Make sure to upload all three files for complete data synchronization.
                </p>
                <p className="text-green-400 text-sm font-medium">
                  ✓ New datasets are immediately available - no server restart needed!
                </p>
              </div>
            </div>
          </div>

          {/* Upload Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Player Stats Upload */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-gray-800/80 backdrop-blur-sm rounded-2xl border border-gray-700 shadow-xl p-6"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-blue-500/20 rounded-lg">
                  <FileText className="text-blue-400" size={24} />
                </div>
                <h2 className="text-xl font-bold text-white">Player Stats</h2>
              </div>
              <p className="text-gray-400 text-sm mb-4">
                Upload player_stats.csv with all player performance data
              </p>
              <FileUpload
                accept=".csv"
                onUpload={(file) => handleFileUpload(file, 'admin/upload/player-stats/', setPlayerStatsStatus)}
                status={playerStatsStatus}
                fileName="player_stats.csv"
              />
            </motion.div>

            {/* Team Standings Upload */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-gray-800/80 backdrop-blur-sm rounded-2xl border border-gray-700 shadow-xl p-6"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-green-500/20 rounded-lg">
                  <FileText className="text-green-400" size={24} />
                </div>
                <h2 className="text-xl font-bold text-white">Team Standings</h2>
              </div>
              <p className="text-gray-400 text-sm mb-4">
                Upload team_standings.csv with league table data
              </p>
              <FileUpload
                accept=".csv"
                onUpload={(file) => handleFileUpload(file, 'admin/upload/team-standings/', setTeamStandingsStatus)}
                status={teamStandingsStatus}
                fileName="team_standings.csv"
              />
            </motion.div>

            {/* League Stats Upload */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-gray-800/80 backdrop-blur-sm rounded-2xl border border-gray-700 shadow-xl p-6"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-purple-500/20 rounded-lg">
                  <FileText className="text-purple-400" size={24} />
                </div>
                <h2 className="text-xl font-bold text-white">League Stats</h2>
              </div>
              <p className="text-gray-400 text-sm mb-4">
                Upload League_stats.csv with league overview statistics
              </p>
              <FileUpload
                accept=".csv"
                onUpload={(file) => handleFileUpload(file, 'admin/upload/league-stats/', setLeagueStatsStatus)}
                status={leagueStatsStatus}
                fileName="League_stats.csv"
              />
            </motion.div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

interface FileUploadProps {
  accept: string;
  onUpload: (file: File) => void;
  status: UploadStatus;
  fileName: string;
}

const FileUpload: React.FC<FileUploadProps> = ({ accept, onUpload, status, fileName }) => {
  const [file, setFile] = useState<File | null>(null);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      setFile(selectedFile);
      onUpload(selectedFile);
    }
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="space-y-3">
      <input
        ref={fileInputRef}
        type="file"
        accept={accept}
        onChange={handleFileChange}
        className="hidden"
      />
      
      <button
        onClick={handleClick}
        disabled={status.status === 'uploading'}
        className="w-full px-4 py-3 bg-primary-600 hover:bg-primary-700 disabled:bg-gray-700 disabled:cursor-not-allowed text-white font-semibold rounded-lg transition-colors flex items-center justify-center gap-2"
      >
        {status.status === 'uploading' ? (
          <>
            <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white"></div>
            Uploading...
          </>
        ) : (
          <>
            <Upload size={18} />
            Upload {fileName}
          </>
        )}
      </button>

      {file && (
        <div className="text-sm text-gray-400">
          Selected: {file.name}
        </div>
      )}

      {status.status === 'success' && (
        <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-3">
          <div className="flex items-start gap-2 text-green-400 text-sm">
            <CheckCircle size={16} className="mt-0.5 flex-shrink-0" />
            <div>
              <span className="font-medium">{status.message}</span>
              <p className="text-green-300/80 text-xs mt-1">
                All users will see the updated data immediately. No refresh needed!
              </p>
            </div>
          </div>
        </div>
      )}

      {status.status === 'error' && (
        <div className="flex items-center gap-2 text-red-400 text-sm">
          <XCircle size={16} />
          <span>{status.message}</span>
        </div>
      )}
    </div>
  );
};

export default AdminPanel;

