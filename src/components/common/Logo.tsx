import React from 'react';
import { Trophy } from 'lucide-react';

const Logo: React.FC<{ size?: 'sm' | 'md' | 'lg' }> = ({ size = 'md' }) => {
  const sizeClasses = {
    sm: 'text-xl',
    md: 'text-2xl',
    lg: 'text-3xl',
  };

  const iconSizes = {
    sm: 20,
    md: 24,
    lg: 30,
  };
  
  return (
    <div className="flex items-center gap-2">
      <div className="flex items-center justify-center rounded-full bg-gradient-to-r from-primary-600 to-secondary-500 p-2">
        <Trophy size={iconSizes[size]} className="text-white" />
      </div>
      <div className={`font-bold ${sizeClasses[size]} text-white`}>
        DREAM-<span className="text-primary-400">XI</span>
      </div>
    </div>
  );
};

export default Logo;