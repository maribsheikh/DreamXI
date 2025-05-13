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
        className="block text-sm font-medium text-gray-700"
      >
        {label}
        {required && <span className="text-accent-500 ml-1">*</span>}
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
            w-full rounded-md border px-3 py-2 text-sm transition duration-200 ease-in-out 
            ${error ? 'border-accent-500 focus:border-accent-500 focus:ring-accent-500' : 'border-gray-300 focus:border-primary-500 focus:ring-primary-500'}
            focus:outline-none focus:ring-1
          `}
        />
        {isPasswordType && (
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 focus:outline-none"
            aria-label={showPassword ? 'Hide password' : 'Show password'}
          >
            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        )}
      </div>
      {error && (
        <p className="text-xs text-accent-500 mt-1">
          {error}
        </p>
      )}
    </div>
  );
};

export default Input;