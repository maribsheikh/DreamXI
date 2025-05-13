import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Users, Trophy, LineChart, Mail } from 'lucide-react';
import Logo from '../components/common/Logo';
import backgroundImage from '../assets/homepage.png';

const AboutPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-900">
      {/* Header */}
      <header className="bg-gray-800 border-b border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <Logo size="md" />
            <Link 
              to="/home" 
              className="inline-flex items-center text-gray-300 hover:text-white transition-colors duration-200"
            >
              <ArrowLeft size={20} className="mr-2" />
              Back to Home
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <div 
        className="relative py-24 bg-cover bg-center"
        style={{
          backgroundImage: `linear-gradient(rgba(17, 24, 39, 0.9), rgba(17, 24, 39, 0.9)), url(${backgroundImage})`,
        }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-6">About DREAM-XI</h1>
          <p className="text-xl text-gray-300 max-w-3xl mx-auto">
            Empowering player recruitment with cutting-edge technology and comprehensive analytics
            to build and manage ultimate dream teams.
          </p>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        {/* Mission Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center mb-24">
          <div>
            <h2 className="text-3xl font-bold text-white mb-6">Our Mission</h2>
            <p className="text-gray-300 text-lg leading-relaxed">
              DREAM-XI is dedicated to revolutionizing the recruitment and players analysis experience. We combine 
              cutting-edge technology with comprehensive sports analytics to deliver an unmatched 
              platform that helps you make informed decisions and stay ahead of the competition.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-6">
            <div className="bg-gray-800 p-6 rounded-xl border border-gray-700">
              <Trophy className="text-primary-500 w-12 h-12 mb-4" />
              <h3 className="text-white font-semibold mb-2">Competitive Edge</h3>
              <p className="text-gray-400">Advanced analytics to help you make winning decisions</p>
            </div>
            <div className="bg-gray-800 p-6 rounded-xl border border-gray-700">
              <Users className="text-primary-500 w-12 h-12 mb-4" />
              <h3 className="text-white font-semibold mb-2">Community</h3>
              <p className="text-gray-400">Connect with fellow sports enthusiasts</p>
            </div>
          </div>
        </div>

        {/* Features Section */}
        <div className="mb-24">
          <h2 className="text-3xl font-bold text-white mb-12 text-center">What We Offer</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                icon: <Users className="text-primary-500 w-8 h-8" />,
                title: "Team Building",
                description: "Advanced tools to help you create the perfect lineup"
              },
              {
                icon: <LineChart className="text-primary-500 w-8 h-8" />,
                title: "Real-time Analytics",
                description: "Get instant access to player statistics and performance metrics"
              },
              {
                icon: <Trophy className="text-primary-500 w-8 h-8" />,
                title: "Player Comparisons",
                description: "Compare player performances and make data-driven recruitment decisions"
              }
            ].map((feature, index) => (
              <div 
                key={index}
                className="bg-gray-800 rounded-xl p-8 border border-gray-700 hover:border-primary-500 transition-all"
              >
                <div className="bg-gray-700 rounded-full w-16 h-16 flex items-center justify-center mb-6">
                  {feature.icon}
                </div>
                <h3 className="text-xl font-semibold text-white mb-4">{feature.title}</h3>
                <p className="text-gray-300">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Contact Section */}
        <div className="bg-gray-800 rounded-xl p-8 border border-gray-700">
          <div className="flex flex-col md:flex-row items-center justify-between">
            <div className="mb-6 md:mb-0">
              <h2 className="text-2xl font-bold text-white mb-4">Get in Touch</h2>
              <p className="text-gray-300 max-w-xl">
                Have questions or suggestions? We'd love to hear from you. Our support team is 
                always ready to help you get the most out of DREAM-XI.
              </p>
            </div>
            <div className="flex items-center bg-gray-700 rounded-lg px-6 py-4">
              <Mail className="text-primary-500 w-6 h-6 mr-3" />
              <a 
                href="mailto:support@dream-xi.com" 
                className="text-white hover:text-primary-500 transition-colors duration-200"
              >
                khuzemaasim123@gmail.com
              </a>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default AboutPage; 