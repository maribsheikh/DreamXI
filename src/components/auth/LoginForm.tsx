import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { LogIn, Facebook, ArrowRight } from 'lucide-react';
import Input from '../common/Input';
import Button from '../common/Button';
import { AuthFormData } from '../../types';
import { loginUser, handleGoogleAuth, handleFacebookAuth } from '../../utils/auth';

const LoginForm: React.FC = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState<AuthFormData>({
    email: '',
    password: '',
    rememberMe: false,
  });
  const [errors, setErrors] = useState<Partial<AuthFormData>>({});
  const [isLoading, setIsLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [id]: type === 'checkbox' ? checked : value,
    });
    
    // Clear error when user types
    if (errors[id as keyof typeof errors]) {
      setErrors({
        ...errors,
        [id]: undefined,
      });
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Partial<AuthFormData> = {};
    
    if (!formData.email) {
      newErrors.email = 'Email or username is required';
    }
    
    if (!formData.password) {
      newErrors.password = 'Password is required';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setIsLoading(true);
    try {
      await loginUser(formData.email, formData.password);
      
      // Check if user is admin and redirect accordingly
      const token = localStorage.getItem('authToken');
      if (token) {
        try {
          const adminCheck = await fetch('http://localhost:8000/api/admin/check/', {
            headers: {
              'Authorization': `Token ${token}`,
            },
          });
          
          if (adminCheck.ok) {
            const adminData = await adminCheck.json();
            if (adminData.is_admin) {
              navigate('/admin');
              return;
            }
          }
        } catch (error) {
          console.error('Error checking admin status:', error);
        }
      }
      
      navigate('/home');
    } catch (error: any) {
      console.error('Login error:', error);
      const errorMessage = error?.message || 'Invalid credentials. Please check your email/username and password.';
      setErrors({ 
        email: errorMessage,
        password: errorMessage
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        <Input
          id="email"
          label="Email or Username"
          type="text"
          placeholder="email@example.com or username"
          value={formData.email}
          onChange={handleChange}
          required
          error={errors.email}
        />
        
        <Input
          id="password"
          label="Password"
          type="password"
          placeholder="••••••••"
          value={formData.password}
          onChange={handleChange}
          required
          error={errors.password}
        />
        
        <div className="flex items-center justify-between pt-2">
          <div className="flex items-center">
            <input
              id="rememberMe"
              type="checkbox"
              checked={formData.rememberMe}
              onChange={handleChange}
              className="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-2 focus:ring-primary-500 focus:ring-offset-0"
            />
            <label htmlFor="rememberMe" className="ml-2 block text-sm text-gray-600 font-medium">
              Remember me
            </label>
          </div>
          
          <div className="text-sm">
            <Link to="/forgot-password" className="font-semibold text-primary-600 hover:text-primary-700 transition-colors">
              Forgot password?
            </Link>
          </div>
        </div>
        
        <Button type="submit" variant="primary" fullWidth disabled={isLoading} className="mt-2">
          <LogIn size={18} className="mr-2" />
          {isLoading ? 'Signing in...' : 'Sign in'}
        </Button>
        
        <div className="relative my-8">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-200"></div>
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="bg-white px-4 text-gray-500 font-medium">Or continue with</span>
          </div>
        </div>
        
        <div className="grid grid-cols-2 gap-3">
          <Button 
            variant="outline" 
            fullWidth 
            type="button"
            onClick={handleGoogleAuth}
            className="hover:border-gray-400"
          >
            <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
              <path
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                fill="#4285F4"
              />
              <path
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                fill="#34A853"
              />
              <path
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                fill="#FBBC05"
              />
              <path
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                fill="#EA4335"
              />
            </svg>
            Google
          </Button>
          <Button 
            variant="outline" 
            fullWidth 
            type="button"
            onClick={handleFacebookAuth}
            className="hover:border-gray-400"
          >
            <Facebook size={18} className="mr-2 text-blue-600" />
            Facebook
          </Button>
        </div>
        
        <div className="text-center mt-8 pt-6 border-t border-gray-100">
          <p className="text-sm text-gray-600">
            Don't have an account?{' '}
            <Link to="/signup" className="font-semibold text-primary-600 hover:text-primary-700 inline-flex items-center transition-colors">
              Sign up now
              <ArrowRight size={16} className="ml-1" />
            </Link>
          </p>
        </div>
      </form>
    </motion.div>
  );
};

export default LoginForm;