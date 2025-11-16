import React, { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { InputProps } from '../../types';

const Input: React.FC<InputProps> = ({
  id,
  label,
  type,
  placeholder,
  value,
  onChange,
  required = false,
  error,
}) => {
  const [showPassword, setShowPassword] = useState(false);
  const isPasswordType = type === 'password';
  const inputType = isPasswordType ? (showPassword ? 'text' : 'password') : type;

  return (
    <div className="space-y-2">
      <label 
        htmlFor={id} 
        className="block text-sm font-semibold text-gray-700 mb-1.5"
      >
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>
      <div className="relative">
        <input
          id={id}
          type={inputType}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          required={required}
          className={`
            w-full rounded-lg border px-4 py-3 text-sm transition-all duration-200 ease-in-out
            bg-gray-50 border-gray-200 text-gray-900 placeholder-gray-400
            ${error 
              ? 'border-red-300 focus:border-red-500 focus:ring-red-500 bg-red-50/50' 
              : 'hover:border-gray-300 focus:border-primary-500 focus:ring-primary-500 focus:bg-white'
            }
            focus:outline-none focus:ring-2 focus:ring-offset-0
            disabled:bg-gray-100/80 disabled:cursor-not-allowed disabled:text-gray-500
          `}
        />
        {isPasswordType && (
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 focus:outline-none transition-colors"
            aria-label={showPassword ? 'Hide password' : 'Show password'}
          >
            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        )}
      </div>
      {error && (
        <p className="text-xs text-red-600 mt-1.5 font-medium flex items-center">
          <span className="mr-1">•</span>
          {error}
        </p>
      )}
    </div>
  );
};

export default Input;