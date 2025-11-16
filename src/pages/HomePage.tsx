import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import Logo from '../components/common/Logo';
import SearchBar from '../components/SearchBar';
import { LogOut, Users, LineChart, Trophy, GitCompare, ChevronDown, ChevronUp, Mail, Bookmark, Target, Shield } from 'lucide-react';
import backgroundImage from '../assets/homepage.png';

const HomePage: React.FC = () => {
  const [selectedPosition, setSelectedPosition] = useState<string>('All');
  const [openFAQIndex, setOpenFAQIndex] = useState<number | null>(null);
  const [isAdmin, setIsAdmin] = useState<boolean>(false);

  // Always scroll to top when component mounts
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    checkAdminStatus();
  }, []);

  const checkAdminStatus = async () => {
    try {
      const token = localStorage.getItem('authToken');
      if (!token) return;
      
      const response = await fetch('http://localhost:8000/api/admin/check/', {
        headers: {
          'Authorization': `Token ${token}`,
        },
      });
      
      if (response.ok) {
        const data = await response.json();
        setIsAdmin(data.is_admin);
      }
    } catch (error) {
      console.error('Error checking admin status:', error);
    }
  };

  const positionFilters = ['All', 'GK', 'DF', 'MF', 'FW'];

  const faqs = [
    {
      question: "How does the player analysis system work?",
      answer: "Our player analysis system uses advanced algorithms to evaluate players based on multiple parameters including performance statistics, physical attributes, and historical data. We process this data to provide comprehensive insights that help in making informed recruitment decisions."
    },
    {
      question: "What metrics are used to compare players?",
      answer: "We analyze various metrics including technical skills (passing accuracy, shot precision, tackle success rate), physical attributes (speed, stamina, strength), tactical understanding, and consistency in performance. The system also considers league-specific factors and opposition quality for a more accurate comparison."
    },
    {
      question: "How often is player data updated?",
      answer: "Player data is updated after every match to ensure you have access to the most recent performance metrics. Historical data is maintained to track player development and identify trends in performance over time."
    },
    {
      question: "Can I create custom analysis parameters?",
      answer: "Yes, our platform allows you to create custom parameters and weightages for player analysis. This helps you focus on specific attributes that are most important for your team's requirements and playing style."
    },
    {
      question: "How do you ensure data accuracy?",
      answer: "We source our data from multiple reliable providers and cross-validate it for accuracy. Our system also employs validation algorithms to flag any anomalies in the data, ensuring you get accurate and reliable insights."
    }
  ];

  const toggleFAQ = (index: number) => {
    setOpenFAQIndex(openFAQIndex === index ? null : index);
  };

  return (
    <div className="relative min-h-screen">
      {/* Background Image - Fixed and scrollable */}
      <div
        className="fixed inset-0 bg-cover bg-center bg-no-repeat -z-10"
        style={{
          backgroundImage: `url(${backgroundImage})`,
          minHeight: '100vh',
        }}
      />
      
      {/* Fixed Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-gray-800/98 backdrop-blur-md border-b border-gray-700/50 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Top Row: Logo and Search/Sign Out */}
          <div className="flex justify-between items-start py-4">
            <div className="flex flex-col">
              <Logo size="md" />
            </div>
            <div className="flex items-start gap-4">
              <div className="flex flex-col gap-2">
                <SearchBar positionFilter={selectedPosition} />
                {/* Position Filters */}
                <div className="flex items-center gap-1.5 flex-wrap">
                  {positionFilters.map((position) => (
                    <button
                      key={position}
                      onClick={() => setSelectedPosition(position)}
                      className={`px-2.5 py-1 text-xs font-medium rounded-md transition-all duration-200 border ${
                        selectedPosition === position
                          ? 'bg-primary-600 text-white shadow-md border-primary-500 scale-105'
                          : 'bg-gray-700/90 text-gray-200 hover:bg-gray-600 hover:text-white border-gray-600 hover:border-gray-500'
                      }`}
                    >
                      {position}
                    </button>
                  ))}
                </div>
              </div>
              <Link to="/login" className="pt-0">
                <button
                  className="relative overflow-hidden bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white font-semibold px-6 py-2.5 rounded-lg border border-red-500/50 shadow-lg hover:shadow-xl hover:shadow-red-500/30 transition-all duration-300 group flex items-center gap-2"
                >
                  <span className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/0 to-white/0 group-hover:from-white/10 group-hover:via-white/20 group-hover:to-white/10 transition-all duration-300"></span>
                  <LogOut size={18} className="relative z-10 transition-transform duration-300 group-hover:translate-x-1" />
                  <span className="relative z-10">Sign Out</span>
                </button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content - with padding to account for fixed header */}
      <main className="relative pt-[160px] pb-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
          {/* Top Players Card */}
          <Link to="/top-players" className="block h-full">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className="group relative overflow-hidden rounded-3xl p-8 border border-white/10 backdrop-blur-xl bg-gradient-to-br from-gray-900/80 via-gray-800/70 to-gray-900/80 cursor-pointer h-full flex flex-col items-center justify-center text-center shadow-2xl hover:shadow-[0_20px_50px_rgba(59,130,246,0.3)] transition-all duration-500"
            >
              {/* Animated background gradient */}
              <div className="absolute inset-0 bg-gradient-to-br from-blue-500/0 via-blue-600/0 to-blue-500/0 group-hover:from-blue-500/10 group-hover:via-blue-600/15 group-hover:to-blue-500/10 transition-all duration-500"></div>
              
              {/* Shine effect on hover */}
              <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
              </div>
              
              <div className="relative z-10 w-full">
                <motion.div 
                  whileHover={{ rotate: [0, -5, 5, -5, 0] }}
                  transition={{ duration: 0.5 }}
                  className="inline-flex items-center justify-center w-20 h-20 mb-6 rounded-2xl bg-gradient-to-br from-blue-500/30 via-blue-600/25 to-blue-500/30 backdrop-blur-sm border border-blue-400/40 group-hover:border-blue-400/60 group-hover:from-blue-500/40 group-hover:via-blue-600/35 group-hover:to-blue-500/40 group-hover:scale-110 group-hover:shadow-[0_0_30px_rgba(59,130,246,0.5)] transition-all duration-500 shadow-xl"
                >
                  <Trophy size={32} className="text-blue-300 group-hover:text-blue-200 drop-shadow-lg transition-colors duration-300" />
                </motion.div>
                <h3 className="text-xl font-bold text-white mb-3 tracking-tight group-hover:text-blue-200 drop-shadow-md transition-colors duration-300">Top Players</h3>
                <p className="text-gray-300 text-sm leading-relaxed font-medium group-hover:text-gray-200 transition-colors duration-300">View top players by various metrics and leagues</p>
              </div>
            </motion.div>
          </Link>

          {/* Set-piece Specialists Card */}
          <Link to="/set-piece-specialists" className="block h-full">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.1 }}
              className="group relative overflow-hidden rounded-3xl p-8 border border-white/10 backdrop-blur-xl bg-gradient-to-br from-gray-900/80 via-gray-800/70 to-gray-900/80 cursor-pointer h-full flex flex-col items-center justify-center text-center shadow-2xl hover:shadow-[0_20px_50px_rgba(234,179,8,0.3)] transition-all duration-500"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-yellow-500/0 via-yellow-600/0 to-yellow-500/0 group-hover:from-yellow-500/10 group-hover:via-yellow-600/15 group-hover:to-yellow-500/10 transition-all duration-500"></div>
              
              <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
              </div>
              
              <div className="relative z-10 w-full">
                <motion.div 
                  whileHover={{ rotate: [0, -5, 5, -5, 0] }}
                  transition={{ duration: 0.5 }}
                  className="inline-flex items-center justify-center w-20 h-20 mb-6 rounded-2xl bg-gradient-to-br from-yellow-500/30 via-yellow-600/25 to-yellow-500/30 backdrop-blur-sm border border-yellow-400/40 group-hover:border-yellow-400/60 group-hover:from-yellow-500/40 group-hover:via-yellow-600/35 group-hover:to-yellow-500/40 group-hover:scale-110 group-hover:shadow-[0_0_30px_rgba(234,179,8,0.5)] transition-all duration-500 shadow-xl"
                >
                  <Target size={32} className="text-yellow-300 group-hover:text-yellow-200 drop-shadow-lg transition-colors duration-300" />
                </motion.div>
                <h3 className="text-xl font-bold text-white mb-3 tracking-tight group-hover:text-yellow-200 drop-shadow-md transition-colors duration-300">Set-piece Specialists</h3>
                <p className="text-gray-300 text-sm leading-relaxed font-medium group-hover:text-gray-200 transition-colors duration-300">Identify players excelling at penalties, free-kicks, and corners</p>
              </div>
            </motion.div>
          </Link>

          {/* Player Shortlist Card */}
          <Link to="/shortlist" className="block h-full">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.2 }}
              className="group relative overflow-hidden rounded-3xl p-8 border border-white/10 backdrop-blur-xl bg-gradient-to-br from-gray-900/80 via-gray-800/70 to-gray-900/80 cursor-pointer h-full flex flex-col items-center justify-center text-center shadow-2xl hover:shadow-[0_20px_50px_rgba(236,72,153,0.3)] transition-all duration-500"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-pink-500/0 via-pink-600/0 to-pink-500/0 group-hover:from-pink-500/10 group-hover:via-pink-600/15 group-hover:to-pink-500/10 transition-all duration-500"></div>
              
              <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
              </div>
              
              <div className="relative z-10 w-full">
                <motion.div 
                  whileHover={{ rotate: [0, -5, 5, -5, 0] }}
                  transition={{ duration: 0.5 }}
                  className="inline-flex items-center justify-center w-20 h-20 mb-6 rounded-2xl bg-gradient-to-br from-pink-500/30 via-pink-600/25 to-pink-500/30 backdrop-blur-sm border border-pink-400/40 group-hover:border-pink-400/60 group-hover:from-pink-500/40 group-hover:via-pink-600/35 group-hover:to-pink-500/40 group-hover:scale-110 group-hover:shadow-[0_0_30px_rgba(236,72,153,0.5)] transition-all duration-500 shadow-xl"
                >
                  <Bookmark size={32} className="text-pink-300 group-hover:text-pink-200 drop-shadow-lg transition-colors duration-300" />
                </motion.div>
                <h3 className="text-xl font-bold text-white mb-3 tracking-tight group-hover:text-pink-200 drop-shadow-md transition-colors duration-300">Player Shortlist</h3>
                <p className="text-gray-300 text-sm leading-relaxed font-medium group-hover:text-gray-200 transition-colors duration-300">View and manage your saved players</p>
              </div>
            </motion.div>
          </Link>

          {/* Compare Players Card */}
          <Link to="/compare" className="block h-full">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.3 }}
              className="group relative overflow-hidden rounded-3xl p-8 border border-white/10 backdrop-blur-xl bg-gradient-to-br from-gray-900/80 via-gray-800/70 to-gray-900/80 cursor-pointer h-full flex flex-col items-center justify-center text-center shadow-2xl hover:shadow-[0_20px_50px_rgba(168,85,247,0.3)] transition-all duration-500"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-purple-500/0 via-purple-600/0 to-purple-500/0 group-hover:from-purple-500/10 group-hover:via-purple-600/15 group-hover:to-purple-500/10 transition-all duration-500"></div>
              
              <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
              </div>
              
              <div className="relative z-10 w-full">
                <motion.div 
                  whileHover={{ rotate: [0, -5, 5, -5, 0] }}
                  transition={{ duration: 0.5 }}
                  className="inline-flex items-center justify-center w-20 h-20 mb-6 rounded-2xl bg-gradient-to-br from-purple-500/30 via-purple-600/25 to-purple-500/30 backdrop-blur-sm border border-purple-400/40 group-hover:border-purple-400/60 group-hover:from-purple-500/40 group-hover:via-purple-600/35 group-hover:to-purple-500/40 group-hover:scale-110 group-hover:shadow-[0_0_30px_rgba(168,85,247,0.5)] transition-all duration-500 shadow-xl"
                >
                  <GitCompare size={32} className="text-purple-300 group-hover:text-purple-200 drop-shadow-lg transition-colors duration-300" />
                </motion.div>
                <h3 className="text-xl font-bold text-white mb-3 tracking-tight group-hover:text-purple-200 drop-shadow-md transition-colors duration-300">Compare Players</h3>
                <p className="text-gray-300 text-sm leading-relaxed font-medium group-hover:text-gray-200 transition-colors duration-300">Compare players with AI-powered position-specific analysis</p>
              </div>
            </motion.div>
          </Link>

          {/* League Statistics Card */}
          <Link to="/player-stats" className="block h-full">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.4 }}
              className="group relative overflow-hidden rounded-3xl p-8 border border-white/10 backdrop-blur-xl bg-gradient-to-br from-gray-900/80 via-gray-800/70 to-gray-900/80 cursor-pointer h-full flex flex-col items-center justify-center text-center shadow-2xl hover:shadow-[0_20px_50px_rgba(34,197,94,0.3)] transition-all duration-500"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-green-500/0 via-green-600/0 to-green-500/0 group-hover:from-green-500/10 group-hover:via-green-600/15 group-hover:to-green-500/10 transition-all duration-500"></div>
              
              <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
              </div>
              
              <div className="relative z-10 w-full">
                <motion.div 
                  whileHover={{ rotate: [0, -5, 5, -5, 0] }}
                  transition={{ duration: 0.5 }}
                  className="inline-flex items-center justify-center w-20 h-20 mb-6 rounded-2xl bg-gradient-to-br from-green-500/30 via-green-600/25 to-green-500/30 backdrop-blur-sm border border-green-400/40 group-hover:border-green-400/60 group-hover:from-green-500/40 group-hover:via-green-600/35 group-hover:to-green-500/40 group-hover:scale-110 group-hover:shadow-[0_0_30px_rgba(34,197,94,0.5)] transition-all duration-500 shadow-xl"
                >
                  <LineChart size={32} className="text-green-300 group-hover:text-green-200 drop-shadow-lg transition-colors duration-300" />
                </motion.div>
                <h3 className="text-xl font-bold text-white mb-3 tracking-tight group-hover:text-green-200 drop-shadow-md transition-colors duration-300">
                  League Statistics <span className="text-sm font-normal text-gray-400">(2023-2024)</span>
                </h3>
                <p className="text-gray-300 text-sm leading-relaxed font-medium group-hover:text-gray-200 transition-colors duration-300">Compare all leagues with interactive visualizations</p>
              </div>
            </motion.div>
          </Link>

          {/* Admin Panel Card - Only visible to admins */}
          {isAdmin && (
            <Link to="/admin" className="block h-full">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.5 }}
                className="group relative overflow-hidden rounded-3xl p-8 border border-white/10 backdrop-blur-xl bg-gradient-to-br from-gray-900/80 via-gray-800/70 to-gray-900/80 cursor-pointer h-full flex flex-col items-center justify-center text-center shadow-2xl hover:shadow-[0_20px_50px_rgba(234,179,8,0.3)] transition-all duration-500"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-yellow-500/0 via-yellow-600/0 to-yellow-500/0 group-hover:from-yellow-500/10 group-hover:via-yellow-600/15 group-hover:to-yellow-500/10 transition-all duration-500"></div>
                
                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
                </div>
                
                <div className="relative z-10 w-full">
                  <motion.div 
                    whileHover={{ rotate: [0, -5, 5, -5, 0] }}
                    transition={{ duration: 0.5 }}
                    className="inline-flex items-center justify-center w-20 h-20 mb-6 rounded-2xl bg-gradient-to-br from-yellow-500/30 via-yellow-600/25 to-yellow-500/30 backdrop-blur-sm border border-yellow-400/40 group-hover:border-yellow-400/60 group-hover:from-yellow-500/40 group-hover:via-yellow-600/35 group-hover:to-yellow-500/40 group-hover:scale-110 group-hover:shadow-[0_0_30px_rgba(234,179,8,0.5)] transition-all duration-500 shadow-xl"
                  >
                    <Shield size={32} className="text-yellow-300 group-hover:text-yellow-200 drop-shadow-lg transition-colors duration-300" />
                  </motion.div>
                  <h3 className="text-xl font-bold text-white mb-3 tracking-tight group-hover:text-yellow-200 drop-shadow-md transition-colors duration-300">Admin Panel</h3>
                  <p className="text-gray-300 text-sm leading-relaxed font-medium group-hover:text-gray-200 transition-colors duration-300">Upload new season datasets</p>
                </div>
              </motion.div>
            </Link>
          )}
          </div>
        </div>
      </main>

      {/* FAQs Section */}
      <section id="faqs" className="relative py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="text-center mb-12"
          >
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-4 tracking-tight">Frequently Asked Questions</h2>
            <p className="text-xl text-gray-300 max-w-2xl mx-auto">
              Find answers to common questions about our platform
            </p>
          </motion.div>

          <div className="space-y-4">
            {faqs.map((faq, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="group relative overflow-hidden rounded-2xl border border-white/10 backdrop-blur-xl bg-gradient-to-br from-gray-900/80 via-gray-800/70 to-gray-900/80 shadow-xl hover:shadow-2xl transition-all duration-300"
              >
                <button
                  className="w-full px-6 py-5 text-left flex justify-between items-center hover:bg-white/5 transition-colors duration-300"
                  onClick={() => toggleFAQ(index)}
                >
                  <span className="text-lg font-semibold text-white pr-4">{faq.question}</span>
                  <div className="flex-shrink-0">
                    {openFAQIndex === index ? (
                      <ChevronUp className="text-gray-300 w-5 h-5 transition-transform duration-300" />
                    ) : (
                      <ChevronDown className="text-gray-300 w-5 h-5 transition-transform duration-300" />
                    )}
                  </div>
                </button>
                {openFAQIndex === index && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.3 }}
                    className="px-6 pb-5 border-t border-white/10"
                  >
                    <p className="text-gray-300 leading-relaxed pt-4">{faq.answer}</p>
                  </motion.div>
                )}
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* About Section */}
      <section id="about" className="relative py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-4 tracking-tight">About DREAM-XI</h2>
            <p className="text-xl text-gray-300 max-w-3xl mx-auto">
              Empowering player recruitment with cutting-edge technology and comprehensive analytics
            </p>
          </motion.div>

          {/* Mission Section */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 mb-16">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
              className="relative overflow-hidden rounded-3xl p-8 border border-white/10 backdrop-blur-xl bg-gradient-to-br from-gray-900/80 via-gray-800/70 to-gray-900/80 shadow-2xl"
            >
              <h3 className="text-3xl font-bold text-white mb-6">Our Mission</h3>
              <p className="text-gray-300 text-lg leading-relaxed">
                DREAM-XI is dedicated to revolutionizing the recruitment and player analysis experience. We combine 
                cutting-edge technology with comprehensive sports analytics to deliver an unmatched 
                platform that helps you make informed decisions and stay ahead of the competition.
              </p>
            </motion.div>

            <div className="grid grid-cols-2 gap-6">
              {[
                { icon: Trophy, title: "Competitive Edge", desc: "Advanced analytics to help you make winning decisions" },
                { icon: Users, title: "Community", desc: "Connect with fellow sports enthusiasts" }
              ].map((item, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  className="relative overflow-hidden rounded-2xl p-6 border border-white/10 backdrop-blur-xl bg-gradient-to-br from-gray-900/80 via-gray-800/70 to-gray-900/80 shadow-xl hover:shadow-2xl transition-all duration-300"
                >
                  <div className="inline-flex items-center justify-center w-12 h-12 mb-4 rounded-xl bg-gradient-to-br from-primary-500/20 to-primary-600/20 border border-primary-500/30">
                    <item.icon className="text-primary-400 w-6 h-6" />
                  </div>
                  <h4 className="text-white font-semibold mb-2 text-lg">{item.title}</h4>
                  <p className="text-gray-400 text-sm">{item.desc}</p>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Features Grid */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16"
          >
            {[
              { icon: Users, title: "Team Building", desc: "Advanced tools to help you create the perfect lineup" },
              { icon: LineChart, title: "Position Analytics", desc: "Get instant access to player statistics and performance metrics" },
              { icon: Trophy, title: "Player Comparisons", desc: "Compare player performances and make data-driven recruitment decisions" }
            ].map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="group relative overflow-hidden rounded-2xl p-8 border border-white/10 backdrop-blur-xl bg-gradient-to-br from-gray-900/80 via-gray-800/70 to-gray-900/80 shadow-xl hover:shadow-2xl hover:border-primary-500/30 transition-all duration-300"
              >
                <div className="inline-flex items-center justify-center w-14 h-14 mb-6 rounded-xl bg-gradient-to-br from-primary-500/20 to-primary-600/20 border border-primary-500/30 group-hover:scale-110 transition-transform duration-300">
                  <feature.icon className="text-primary-400 w-7 h-7" />
                </div>
                <h4 className="text-xl font-semibold text-white mb-3">{feature.title}</h4>
                <p className="text-gray-300 leading-relaxed">{feature.desc}</p>
              </motion.div>
            ))}
          </motion.div>

          {/* Contact Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="relative overflow-hidden rounded-3xl p-8 md:p-12 border border-white/10 backdrop-blur-xl bg-gradient-to-br from-gray-900/80 via-gray-800/70 to-gray-900/80 shadow-2xl"
          >
            <div className="flex flex-col md:flex-row items-center justify-between gap-6">
              <div>
                <h3 className="text-2xl font-bold text-white mb-4">Get in Touch</h3>
                <p className="text-gray-300 max-w-xl leading-relaxed">
                  Have questions or suggestions? We'd love to hear from you. Our support team is 
                  always ready to help you get the most out of DREAM-XI.
                </p>
              </div>
              <a
                href="mailto:khuzemaasim123@gmail.com"
                className="inline-flex items-center px-6 py-4 bg-gradient-to-r from-primary-600 to-primary-700 text-white font-semibold rounded-xl hover:from-primary-700 hover:to-primary-800 shadow-lg hover:shadow-xl transition-all duration-300"
              >
                <Mail className="w-5 h-5 mr-2" />
                Contact Us
              </a>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
};

export default HomePage;
