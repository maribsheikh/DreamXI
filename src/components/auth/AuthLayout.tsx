import React from 'react';
import { motion } from 'framer-motion';
import Logo from '../common/Logo';
import { Trophy, Users, BarChart3, TrendingUp } from 'lucide-react';
import backgroundImage from '../../assets/herobg.png';

interface AuthLayoutProps {
  children: React.ReactNode;
  title: string;
  subtitle: string;
}

const AuthLayout: React.FC<AuthLayoutProps> = ({ children, title, subtitle }) => {
  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-gray-50">
      {/* Hero Section */}
      <div 
        className="w-full md:w-1/2 lg:w-3/5 bg-gradient-to-br from-primary-800 via-primary-900 to-primary-950 animate-gradient-x relative overflow-hidden hidden md:flex md:flex-col"
        style={{
          backgroundImage: `linear-gradient(rgba(15, 23, 42, 0.85), rgba(15, 23, 42, 0.85)), url(${backgroundImage})`, 
          backgroundSize: 'cover',
          backgroundPosition: 'top center',
          backgroundRepeat: 'no-repeat',
        }}  
      >
        {/* Decorative elements */}
        <div className="absolute top-[10%] left-[15%] w-20 h-20 rounded-full bg-white opacity-5"></div>
        <div className="absolute top-[70%] left-[75%] w-32 h-32 rounded-full bg-white opacity-5"></div>
        <div className="absolute top-[40%] left-[65%] w-16 h-16 rounded-full bg-white opacity-5"></div>
        
        <div className="relative z-10 flex flex-col justify-center items-center h-full px-8 text-white">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="flex items-center justify-center mb-8"
          >
            <Trophy size={48} className="mr-4 text-yellow-400" />
            <Logo size="lg" />
          </motion.div>
          
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 text-center leading-tight"
          >
            Make Your Dream Team
          </motion.h1>
          
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="text-xl md:text-2xl opacity-90 max-w-2xl text-center mb-12 leading-relaxed"
          >
            Select your champions, compete with others, and rise to the top of the leaderboards.
          </motion.p>

          {/* Stats Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.6 }}
            className="w-full max-w-2xl"
          >
            <div className="grid grid-cols-2 gap-6 mb-8">
              <div className="text-center">
                <div className="flex items-center justify-center mb-2">
                  <Users size={32} className="text-primary-300" />
                </div>
                <div className="text-3xl font-bold text-white mb-1">2500+</div>
                <div className="text-sm text-gray-300 uppercase tracking-wide">Players</div>
              </div>
              <div className="text-center">
                <div className="flex items-center justify-center mb-2">
                  <TrendingUp size={32} className="text-primary-300" />
                </div>
                <div className="text-3xl font-bold text-white mb-1">100%</div>
                <div className="text-sm text-gray-300 uppercase tracking-wide">Analytics</div>
              </div>
            </div>
            
            {/* Leagues List */}
            <div className="text-center">
              <div className="flex items-center justify-center mb-5">
                <BarChart3 size={28} className="text-primary-300 mr-2" />
                <div className="text-lg font-semibold text-white uppercase tracking-wider">5 Major Leagues</div>
              </div>
              <div className="flex flex-wrap justify-center gap-2.5">
                <span className="px-4 py-2.5 bg-white/15 backdrop-blur-md rounded-xl text-white text-sm font-semibold border border-white/25 shadow-lg hover:bg-white/20 transition-all duration-200">Premier League</span>
                <span className="px-4 py-2.5 bg-white/15 backdrop-blur-md rounded-xl text-white text-sm font-semibold border border-white/25 shadow-lg hover:bg-white/20 transition-all duration-200">La Liga</span>
                <span className="px-4 py-2.5 bg-white/15 backdrop-blur-md rounded-xl text-white text-sm font-semibold border border-white/25 shadow-lg hover:bg-white/20 transition-all duration-200">Bundesliga</span>
                <span className="px-4 py-2.5 bg-white/15 backdrop-blur-md rounded-xl text-white text-sm font-semibold border border-white/25 shadow-lg hover:bg-white/20 transition-all duration-200">Serie A</span>
                <span className="px-4 py-2.5 bg-white/15 backdrop-blur-md rounded-xl text-white text-sm font-semibold border border-white/25 shadow-lg hover:bg-white/20 transition-all duration-200">Ligue 1</span>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
      
      {/* Form Section */}
      <div className="w-full md:w-1/2 lg:w-2/5 flex items-center justify-center p-6 md:p-12 bg-gradient-to-br from-gray-50 to-white">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="w-full max-w-md"
        >
          <div className="md:hidden flex justify-center mb-10">
            <Logo size="md" />
          </div>
          
          <div className="mb-10">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-3 tracking-tight">
              {title}
            </h2>
            <p className="text-gray-600 text-lg leading-relaxed">
              {subtitle}
            </p>
          </div>
          
          <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8">
            {children}
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default AuthLayout;
