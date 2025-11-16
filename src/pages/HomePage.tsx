import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { motion, useScroll, useTransform } from 'framer-motion';
import Logo from '../components/common/Logo';
import SearchBar from '../components/SearchBar';
import { 
  LogOut, Users, LineChart, Trophy, GitCompare, ChevronDown, 
  Mail, Bookmark, Target, Shield, ArrowRight, 
  Sparkles
} from 'lucide-react';
import backgroundImage from '../assets/homepage.png';

const HomePage: React.FC = () => {
  const [selectedPosition, setSelectedPosition] = useState<string>('All');
  const [openFAQIndex, setOpenFAQIndex] = useState<number | null>(null);
  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  const heroRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll();
  const y = useTransform(scrollYProgress, [0, 1], ['0%', '50%']);
  const opacity = useTransform(scrollYProgress, [0, 0.5], [1, 0]);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    checkAdminStatus();
  }, []);

  const checkAdminStatus = async () => {
    try {
      const token = localStorage.getItem('authToken');
      if (!token) return;
      
      const response = await fetch('http://localhost:8000/api/admin/check/', {
        headers: { 'Authorization': `Token ${token}` },
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

  const features = [
    { icon: Trophy, title: "Top Players", desc: "View top players by various metrics and leagues", link: "/top-players", color: "blue", delay: 0 },
    { icon: Target, title: "Set-piece Specialists", desc: "Identify players excelling at penalties, free-kicks, and corners", link: "/set-piece-specialists", color: "yellow", delay: 0.1 },
    { icon: Bookmark, title: "Player Shortlist", desc: "View and manage your saved players", link: "/shortlist", color: "pink", delay: 0.2 },
    { icon: GitCompare, title: "Compare Players", desc: "Compare players with AI-powered position-specific analysis", link: "/compare", color: "purple", delay: 0.3 },
    { icon: LineChart, title: "League Statistics", desc: "Compare all leagues with interactive visualizations", link: "/player-stats", color: "green", delay: 0.4 },
  ];

  const colorClasses = {
    blue: {
      gradient: "from-blue-500/20 via-blue-600/15 to-blue-500/20",
      hoverGradient: "from-blue-500/30 via-blue-600/25 to-blue-500/30",
      shadow: "shadow-[0_20px_50px_rgba(59,130,246,0.4)]",
      iconGlow: "rgba(59, 130, 246, 0.6)",
      iconBg: "from-blue-500/30 via-blue-600/25 to-blue-500/30",
      border: "border-blue-400/40",
      text: "text-blue-300",
      hoverText: "text-blue-200"
    },
    yellow: {
      gradient: "from-yellow-500/20 via-yellow-600/15 to-yellow-500/20",
      hoverGradient: "from-yellow-500/30 via-yellow-600/25 to-yellow-500/30",
      shadow: "shadow-[0_20px_50px_rgba(234,179,8,0.4)]",
      iconGlow: "rgba(234, 179, 8, 0.6)",
      iconBg: "from-yellow-500/30 via-yellow-600/25 to-yellow-500/30",
      border: "border-yellow-400/40",
      text: "text-yellow-300",
      hoverText: "text-yellow-200"
    },
    pink: {
      gradient: "from-pink-500/20 via-pink-600/15 to-pink-500/20",
      hoverGradient: "from-pink-500/30 via-pink-600/25 to-pink-500/30",
      shadow: "shadow-[0_20px_50px_rgba(236,72,153,0.4)]",
      iconGlow: "rgba(236, 72, 153, 0.6)",
      iconBg: "from-pink-500/30 via-pink-600/25 to-pink-500/30",
      border: "border-pink-400/40",
      text: "text-pink-300",
      hoverText: "text-pink-200"
    },
    purple: {
      gradient: "from-purple-500/20 via-purple-600/15 to-purple-500/20",
      hoverGradient: "from-purple-500/30 via-purple-600/25 to-purple-500/30",
      shadow: "shadow-[0_20px_50px_rgba(168,85,247,0.4)]",
      iconGlow: "rgba(168, 85, 247, 0.6)",
      iconBg: "from-purple-500/30 via-purple-600/25 to-purple-500/30",
      border: "border-purple-400/40",
      text: "text-purple-300",
      hoverText: "text-purple-200"
    },
    green: {
      gradient: "from-green-500/20 via-green-600/15 to-green-500/20",
      hoverGradient: "from-green-500/30 via-green-600/25 to-green-500/30",
      shadow: "shadow-[0_20px_50px_rgba(34,197,94,0.4)]",
      iconGlow: "rgba(34, 197, 94, 0.6)",
      iconBg: "from-green-500/30 via-green-600/25 to-green-500/30",
      border: "border-green-400/40",
      text: "text-green-300",
      hoverText: "text-green-200"
    }
  };

  return (
    <div className="relative min-h-screen overflow-x-hidden">
      {/* Animated Background with Parallax */}
      <motion.div
        ref={heroRef}
        style={{ y, opacity }}
        className="fixed inset-0 -z-10"
      >
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{ backgroundImage: `url(${backgroundImage})` }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-gray-900/95 via-gray-900/90 to-gray-900/95" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(59,130,246,0.1),transparent_70%)]" />
      </motion.div>

      {/* Floating Particles Effect */}
      <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
        {typeof window !== 'undefined' && [...Array(20)].map((_, i) => {
          const width = window.innerWidth || 1920;
          const height = window.innerHeight || 1080;
          const randomX = Math.random() * width;
          const randomY = Math.random() * height;
          const randomEndY = Math.random() * height;
          const randomDuration = Math.random() * 3 + 2;
          const randomDelay = Math.random() * 2;
          
          return (
            <motion.div
              key={i}
              className="absolute w-1 h-1 bg-white/20 rounded-full"
              initial={{
                x: randomX,
                y: randomY,
                opacity: 0.2,
              }}
              animate={{
                y: randomEndY,
                opacity: [0.2, 0.8, 0.2],
              }}
              transition={{
                duration: randomDuration,
                repeat: Infinity,
                delay: randomDelay,
                ease: "easeInOut",
              }}
            />
          );
        })}
      </div>

      {/* Glass-morphism Header */}
      <motion.header
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        className="fixed top-0 left-0 right-0 z-50 backdrop-blur-xl bg-white/5 border-b border-white/10 shadow-2xl"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
              <Logo size="md" />
            <div className="flex items-center gap-4">
              <div className="flex flex-col gap-2">
                <SearchBar positionFilter={selectedPosition} />
                <div className="flex items-center gap-1.5 flex-wrap">
                  {positionFilters.map((position) => (
                    <motion.button
                      key={position}
                      onClick={() => setSelectedPosition(position)}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all duration-300 border backdrop-blur-sm ${
                        selectedPosition === position
                          ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-lg shadow-blue-500/50 border-blue-500/50 scale-105'
                          : 'bg-white/5 text-gray-300 hover:bg-white/10 hover:text-white border-white/10 hover:border-white/20'
                      }`}
                    >
                      {position}
                    </motion.button>
                  ))}
                </div>
              </div>
              <Link to="/login">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="relative overflow-hidden bg-gradient-to-r from-red-600 via-red-600 to-red-700 hover:from-red-700 hover:via-red-700 hover:to-red-800 text-white font-bold px-6 py-2.5 rounded-xl border border-red-500/50 shadow-xl hover:shadow-2xl hover:shadow-red-500/40 transition-all duration-300 group flex items-center gap-2"
                >
                  <span className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 translate-x-[-200%] group-hover:translate-x-[200%] transition-transform duration-1000" />
                  <LogOut size={18} className="relative z-10 transition-transform duration-300 group-hover:translate-x-1" />
                  <span className="relative z-10">Sign Out</span>
                </motion.button>
              </Link>
            </div>
          </div>
        </div>
      </motion.header>

      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center pt-32 pb-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto w-full">
          <div className="text-center space-y-8">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
              className="space-y-6"
            >
                <motion.div 
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.6, delay: 0.2 }}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-white/90 text-sm font-semibold shadow-lg"
              >
                <Sparkles className="w-4 h-4 text-yellow-400" />
                <span>Powered by Advanced Analytics</span>
            </motion.div>

              <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.3 }}
                className="text-5xl md:text-7xl lg:text-8xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white via-blue-200 to-white leading-tight tracking-tight"
              >
                Elevate Your
                <br />
                <span className="bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
                  Player Analysis
                </span>
              </motion.h1>

              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.5 }}
                className="text-xl md:text-2xl text-gray-300 max-w-3xl mx-auto leading-relaxed font-light"
              >
                Discover, analyze, and compare players with cutting-edge technology. 
                Make data-driven decisions that give you the competitive edge.
              </motion.p>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.7 }}
                className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4"
              >
                <motion.button
                  whileHover={{ scale: 1.05, boxShadow: "0 20px 40px rgba(59, 130, 246, 0.4)" }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => {
                    const featuresSection = document.getElementById('features');
                    if (featuresSection) {
                      featuresSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
                    }
                  }}
                  className="group relative overflow-hidden bg-gradient-to-r from-blue-600 via-blue-600 to-purple-600 hover:from-blue-500 hover:via-blue-500 hover:to-purple-500 text-white font-bold px-8 py-4 rounded-2xl shadow-2xl hover:shadow-blue-500/50 transition-all duration-300 flex items-center gap-3 text-lg"
                >
                  <span className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/30 to-white/0 translate-x-[-200%] group-hover:translate-x-[200%] transition-transform duration-1000" />
                  <span className="relative z-10">Explore Features</span>
                  <ArrowRight className="relative z-10 w-5 h-5 transition-transform duration-300 group-hover:translate-x-1" />
                </motion.button>
              </motion.div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Features Grid Section */}
      <section id="features" className="relative py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl md:text-6xl font-black text-white mb-4 tracking-tight">
              Powerful <span className="bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">Features</span>
            </h2>
            <p className="text-xl text-gray-400 max-w-2xl mx-auto">
              Everything you need to make informed player decisions
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => {
              const colors = colorClasses[feature.color as keyof typeof colorClasses];
              return (
                <Link key={index} to={feature.link} className="block h-full">
            <motion.div
                    initial={{ opacity: 0, y: 50, scale: 0.9 }}
                    whileInView={{ opacity: 1, y: 0, scale: 1 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6, delay: feature.delay, ease: [0.22, 1, 0.36, 1] }}
                    whileHover={{ y: -10, scale: 1.02 }}
                    className="group relative h-full overflow-hidden rounded-3xl p-8 border border-white/10 backdrop-blur-xl bg-gradient-to-br from-gray-900/60 via-gray-800/50 to-gray-900/60 shadow-2xl hover:shadow-[0_30px_60px_rgba(0,0,0,0.5)] transition-all duration-500 cursor-pointer"
                  >
                    {/* Animated gradient overlay */}
                    <motion.div
                      className={`absolute inset-0 bg-gradient-to-br ${colors.gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-500`}
                      animate={{
                        backgroundPosition: ['0% 0%', '100% 100%'],
                      }}
                      transition={{
                        duration: 3,
                        repeat: Infinity,
                        repeatType: 'reverse',
                      }}
                    />
                    
                    {/* Shine effect */}
                    <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700">
                      <motion.div
                        className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
                        initial={{ x: '-100%' }}
                        whileHover={{ x: '200%' }}
                        transition={{ duration: 0.8 }}
                      />
              </div>
              
                    {/* Content */}
                    <div className="relative z-10">
                <motion.div 
                        whileHover={{ rotate: [0, -10, 10, -10, 0], scale: 1.1 }}
                  transition={{ duration: 0.5 }}
                        className={`inline-flex items-center justify-center w-20 h-20 mb-6 rounded-2xl bg-gradient-to-br ${colors.iconBg} backdrop-blur-sm border ${colors.border} transition-all duration-500 shadow-xl`}
                        style={{
                          filter: 'drop-shadow(0 0 0px transparent)',
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.filter = `drop-shadow(0 0 30px ${colors.iconGlow})`;
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.filter = 'drop-shadow(0 0 0px transparent)';
                        }}
                      >
                        <feature.icon size={36} className={`${colors.text} drop-shadow-lg transition-all duration-300 group-hover:scale-110`} style={{ color: 'inherit' }} />
                </motion.div>
                      <h3 className={`text-2xl font-bold ${colors.text} mb-3 tracking-tight drop-shadow-md transition-all duration-300 group-hover:scale-105`}>
                        {feature.title}
                </h3>
                      <p className="text-gray-400 text-base leading-relaxed font-medium group-hover:text-gray-300 transition-colors duration-300">
                        {feature.desc}
                      </p>
                      <motion.div
                        initial={{ x: -10, opacity: 0 }}
                        whileHover={{ x: 0, opacity: 1 }}
                        className="mt-6 flex items-center gap-2 text-sm font-semibold text-white/80"
                      >
                        <span>Explore</span>
                        <ArrowRight className="w-4 h-4" />
                      </motion.div>
              </div>
            </motion.div>
          </Link>
              );
            })}

            {/* Admin Panel Card */}
          {isAdmin && (
            <Link to="/admin" className="block h-full">
              <motion.div
                  initial={{ opacity: 0, y: 50, scale: 0.9 }}
                  whileInView={{ opacity: 1, y: 0, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.6, delay: 0.5, ease: [0.22, 1, 0.36, 1] }}
                  whileHover={{ y: -10, scale: 1.02 }}
                  className="group relative h-full overflow-hidden rounded-3xl p-8 border border-white/10 backdrop-blur-xl bg-gradient-to-br from-gray-900/60 via-gray-800/50 to-gray-900/60 shadow-2xl hover:shadow-[0_30px_60px_rgba(234,179,8,0.4)] transition-all duration-500 cursor-pointer"
                >
                  <motion.div
                    className="absolute inset-0 bg-gradient-to-br from-yellow-500/20 via-yellow-600/15 to-yellow-500/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                  />
                  <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700">
                    <motion.div
                      className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
                      initial={{ x: '-100%' }}
                      whileHover={{ x: '200%' }}
                      transition={{ duration: 0.8 }}
                    />
                </div>
                  <div className="relative z-10">
                  <motion.div 
                      whileHover={{ rotate: [0, -10, 10, -10, 0], scale: 1.1 }}
                    transition={{ duration: 0.5 }}
                      className="inline-flex items-center justify-center w-20 h-20 mb-6 rounded-2xl bg-gradient-to-br from-yellow-500/30 via-yellow-600/25 to-yellow-500/30 backdrop-blur-sm border border-yellow-400/40 group-hover:shadow-[0_0_30px_rgba(234,179,8,0.6)] transition-all duration-500 shadow-xl"
                    >
                      <Shield size={36} className="text-yellow-300 group-hover:text-yellow-200 drop-shadow-lg transition-colors duration-300" />
                    </motion.div>
                    <h3 className="text-2xl font-bold text-yellow-300 mb-3 tracking-tight group-hover:text-yellow-200 drop-shadow-md transition-colors duration-300">
                      Admin Panel
                    </h3>
                    <p className="text-gray-400 text-base leading-relaxed font-medium group-hover:text-gray-300 transition-colors duration-300">
                      Upload new season datasets
                    </p>
                    <motion.div
                      initial={{ x: -10, opacity: 0 }}
                      whileHover={{ x: 0, opacity: 1 }}
                      className="mt-6 flex items-center gap-2 text-sm font-semibold text-white/80"
                    >
                      <span>Access</span>
                      <ArrowRight className="w-4 h-4" />
                  </motion.div>
                </div>
              </motion.div>
            </Link>
          )}
          </div>
        </div>
      </section>

      {/* FAQs Section */}
      <section className="relative py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl md:text-6xl font-black text-white mb-4 tracking-tight">
              Frequently Asked <span className="bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">Questions</span>
            </h2>
            <p className="text-xl text-gray-400 max-w-2xl mx-auto">
              Everything you need to know about our platform
            </p>
          </motion.div>

          <div className="space-y-4">
            {faqs.map((faq, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                whileHover={{ scale: 1.01 }}
                className="group relative overflow-hidden rounded-2xl border border-white/10 backdrop-blur-xl bg-gradient-to-br from-gray-900/60 via-gray-800/50 to-gray-900/60 shadow-xl hover:shadow-2xl transition-all duration-300"
              >
                <motion.button
                  whileTap={{ scale: 0.98 }}
                  className="w-full px-8 py-6 text-left flex justify-between items-center hover:bg-white/5 transition-colors duration-300"
                  onClick={() => toggleFAQ(index)}
                >
                  <span className="text-lg font-bold text-white pr-4">{faq.question}</span>
                  <motion.div
                    animate={{ rotate: openFAQIndex === index ? 180 : 0 }}
                    transition={{ duration: 0.3 }}
                    className="flex-shrink-0"
                  >
                    <ChevronDown className="text-gray-400 w-5 h-5" />
                  </motion.div>
                </motion.button>
                {openFAQIndex === index && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.3 }}
                    className="px-8 pb-6 border-t border-white/10"
                  >
                    <p className="text-gray-300 leading-relaxed pt-4 text-base">{faq.answer}</p>
                  </motion.div>
                )}
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* About Section */}
      <section className="relative py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl md:text-6xl font-black text-white mb-4 tracking-tight">
              About <span className="bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">DREAM-XI</span>
            </h2>
            <p className="text-xl text-gray-400 max-w-3xl mx-auto">
              Empowering player recruitment with cutting-edge technology and comprehensive analytics
            </p>
          </motion.div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 mb-16">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
              whileHover={{ scale: 1.02 }}
              className="relative overflow-hidden rounded-3xl p-10 border border-white/10 backdrop-blur-xl bg-gradient-to-br from-gray-900/60 via-gray-800/50 to-gray-900/60 shadow-2xl"
            >
              <h3 className="text-3xl font-black text-white mb-6">Our Mission</h3>
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
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  whileHover={{ scale: 1.05, y: -5 }}
                  className="relative overflow-hidden rounded-2xl p-6 border border-white/10 backdrop-blur-xl bg-gradient-to-br from-gray-900/60 via-gray-800/50 to-gray-900/60 shadow-xl hover:shadow-2xl transition-all duration-300"
                >
                  <div className="inline-flex items-center justify-center w-14 h-14 mb-4 rounded-xl bg-gradient-to-br from-blue-500/30 to-purple-500/30 border border-blue-400/40">
                    <item.icon className="text-blue-400 w-7 h-7" />
                  </div>
                  <h4 className="text-white font-bold mb-2 text-lg">{item.title}</h4>
                  <p className="text-gray-400 text-sm leading-relaxed">{item.desc}</p>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Contact CTA */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            whileHover={{ scale: 1.01 }}
            className="relative overflow-hidden rounded-3xl p-12 border border-white/10 backdrop-blur-xl bg-gradient-to-br from-gray-900/60 via-gray-800/50 to-gray-900/60 shadow-2xl"
          >
            <div className="flex flex-col md:flex-row items-center justify-between gap-6">
              <div>
                <h3 className="text-3xl font-black text-white mb-4">Get in Touch</h3>
                <p className="text-gray-300 max-w-xl leading-relaxed text-lg">
                  Have questions or suggestions? We'd love to hear from you. Our support team is 
                  always ready to help you get the most out of DREAM-XI.
                </p>
              </div>
              <motion.a
                href="mailto:khuzemaasim123@gmail.com"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="group relative overflow-hidden inline-flex items-center px-8 py-4 bg-gradient-to-r from-blue-600 via-blue-600 to-purple-600 hover:from-blue-500 hover:via-blue-500 hover:to-purple-500 text-white font-bold rounded-xl shadow-xl hover:shadow-2xl hover:shadow-blue-500/50 transition-all duration-300"
              >
                <span className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/30 to-white/0 translate-x-[-200%] group-hover:translate-x-[200%] transition-transform duration-1000" />
                <Mail className="w-5 h-5 mr-2 relative z-10" />
                <span className="relative z-10">Contact Us</span>
              </motion.a>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
};

export default HomePage;
