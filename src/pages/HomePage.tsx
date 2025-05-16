import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import Logo from '../components/common/Logo';
import Button from '../components/common/Button';
import SearchBar from '../components/SearchBar';
import { LogOut, Users, LineChart, Trophy, Search } from 'lucide-react';
import backgroundImage from '../assets/homepage.png';

const HomePage: React.FC = () => {
  return (
    <div
      className="min-h-screen bg-cover bg-center bg-no-repeat"
      style={{
        backgroundImage: `url(${backgroundImage})`,
      }}
    >
      {/* Header */}
      <header className="bg-gray-800 border-b border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <Logo size="md" />
            <div className="flex items-center gap-4">
              <SearchBar />
              <Link to="/login">
                <Button
                  variant="outline"
                  className="relative overflow-hidden bg-transparent border-2 border-red-600 text-red-500 hover:text-white group px-6 py-2 transition-all duration-300"
                >
                  <span className="absolute inset-0 w-full h-full bg-red-600 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left"></span>
                  <span className="relative flex items-center">
                    <LogOut size={18} className="mr-2 transition-transform duration-300 group-hover:translate-x-1" />
                    <span>Sign Out</span>
                  </span>
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Navigation */}
      <nav className="bg-gray-800 border-b border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex space-x-8">
            {['Statistics', 'Compare', 'Rankings'].map((item) => (
              <button
                key={item}
                className="relative px-3 py-4 text-sm font-medium text-gray-300 hover:text-white group"
              >
                {item}
                <span className="absolute bottom-0 left-0 w-full h-0.5 bg-primary-500 transform scale-x-0 transition-transform duration-200 ease-out group-hover:scale-x-100" />
              </button>
            ))}
            <Link
              to="/faqs"
              className="relative px-3 py-4 text-sm font-medium text-gray-300 hover:text-white group"
            >
              FAQs
              <span className="absolute bottom-0 left-0 w-full h-0.5 bg-primary-500 transform scale-x-0 transition-transform duration-200 ease-out group-hover:scale-x-100" />
            </Link>
            <Link
              to="/about"
              className="relative px-3 py-4 text-sm font-medium text-gray-300 hover:text-white group"
            >
              About
              <span className="absolute bottom-0 left-0 w-full h-0.5 bg-primary-500 transform scale-x-0 transition-transform duration-200 ease-out group-hover:scale-x-100" />
            </Link>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Player Standings Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="bg-gray-800 rounded-xl p-6 border border-gray-700 hover:border-primary-500 transition-all cursor-pointer"
          >
            <div className="flex flex-col items-center text-center">
              <div className="p-3 bg-gray-700 rounded-full mb-4">
                <Users size={24} className="text-primary-400" />
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">Player Standings</h3>
              <p className="text-gray-400 text-sm">View comprehensive player rankings and statistics</p>
            </div>
          </motion.div>

          {/* Player Stats Card */}
          <Link to="/player-stats">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.1 }}
              className="bg-gray-800 rounded-xl p-6 border border-gray-700 hover:border-primary-500 transition-all cursor-pointer"
            >
              <div className="flex flex-col items-center text-center">
                <div className="p-3 bg-gray-700 rounded-full mb-4">
                  <LineChart size={24} className="text-primary-400" />
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">Player Stats</h3>
                <p className="text-gray-400 text-sm">Analyze detailed performance metrics and trends</p>
              </div>
            </motion.div>
          </Link>

          {/* Position Analysis Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.2 }}
            className="bg-gray-800 rounded-xl p-6 border border-gray-700 hover:border-primary-500 transition-all cursor-pointer"
          >
            <div className="flex flex-col items-center text-center">
              <div className="p-3 bg-gray-700 rounded-full mb-4">
                <Trophy size={24} className="text-primary-400" />
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">Position Analysis</h3>
              <p className="text-gray-400 text-sm">Find the best players for each position</p>
            </div>
          </motion.div>

          {/* Player Shortlist Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.3 }}
            className="bg-gray-800 rounded-xl p-6 border border-gray-700 hover:border-primary-500 transition-all cursor-pointer"
          >
            <div className="flex flex-col items-center text-center">
              <div className="p-3 bg-gray-700 rounded-full mb-4">
                <Users size={24} className="text-primary-400" />
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">Player Shortlist</h3>
              <p className="text-gray-400 text-sm">Create and manage your player watchlist</p>
            </div>
          </motion.div>
        </div>

        {/* Team Selector Dropdown */}
        <div className="mt-12 bg-gray-800 rounded-xl p-8 border border-gray-700">
          <h2 className="text-2xl font-bold text-white mb-6">Team Selection</h2>
          <select
            className="w-full bg-gray-700 border border-gray-600 text-white text-sm rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
            defaultValue=""
          >
            <option value="" disabled>Select a team</option>
            <option value="team1">Team 1</option>
            <option value="team2">Team 2</option>
            <option value="team3">Team 3</option>
          </select>
        </div>
      </main>
    </div>
  );
};

export default HomePage;
