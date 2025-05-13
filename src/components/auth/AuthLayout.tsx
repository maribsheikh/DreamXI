import React from 'react';
import { motion } from 'framer-motion';
import Logo from '../common/Logo';
import { Trophy } from 'lucide-react';
import backgroundImage from '../../assets/herobg.png';
  // Import the image

interface AuthLayoutProps {
  children: React.ReactNode;
  title: string;
  subtitle: string;
}

const AuthLayout: React.FC<AuthLayoutProps> = ({ children, title, subtitle }) => {
  return (
    <div className="min-h-screen flex flex-col md:flex-row">
      {/* Hero Section */}
      <div 
        className="w-full md:w-1/2 lg:w-3/5 bg-gradient-to-br from-primary-800 via-primary-900 to-primary-950 animate-gradient-x relative overflow-hidden hidden md:flex md:flex-col"
        style={{
          backgroundImage: `url(${backgroundImage})`, 
          backgroundSize: 'cover',  // Ensure the image covers the space
          backgroundPosition: 'top center',  // Align the image from the top center to avoid cutting off important parts
          backgroundRepeat: 'no-repeat',  // Prevent tiling if the image is too small
        }}  
      >
        <div className="absolute inset-0 bg-black opacity-10"></div>
        
        {/* Decorative elements */}
        <div className="absolute top-[10%] left-[15%] w-20 h-20 rounded-full bg-white opacity-10"></div>
        <div className="absolute top-[70%] left-[75%] w-32 h-32 rounded-full bg-white opacity-10"></div>
        <div className="absolute top-[40%] left-[65%] w-16 h-16 rounded-full bg-white opacity-10"></div>
        
        <div className="relative z-10 flex flex-col justify-center items-center h-full px-8 text-white">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="flex items-center justify-center mb-8"
          >
            <Trophy size={48} className="mr-4" />
            <Logo size="lg" />
          </motion.div>
          
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-4xl md:text-5xl font-bold mb-4 text-center"
          >
            Make Your Dream Team
          </motion.h1>
          
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="text-xl opacity-90 max-w-md text-center"
          >
             Select your champions, compete with others, and rise to the top of the leaderboards.
          </motion.p>
        </div>
      </div>
      
      {/* Form Section */}
      <div className="w-full md:w-1/2 lg:w-2/5 flex items-center justify-center p-6">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="w-full max-w-md"
        >
          <div className="md:hidden flex justify-center mb-8">
            <Logo size="md" />
          </div>
          
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">
            {title}
          </h2>
          <p className="text-gray-600 mb-8">
            {subtitle}
          </p>
          
          {children}
        </motion.div>
      </div>
    </div>
  );
};

export default AuthLayout;
