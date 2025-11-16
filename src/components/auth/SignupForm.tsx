import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { UserPlus, Facebook, ArrowRight } from 'lucide-react';
import Input from '../common/Input';
import Button from '../common/Button';
import { AuthFormData } from '../../types';
import { registerUser, handleGoogleAuth, handleFacebookAuth } from '../../utils/auth';

const SignupForm: React.FC = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState<AuthFormData>({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [errors, setErrors] = useState<Partial<AuthFormData>>({});
  const [isLoading, setIsLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target;
    setFormData({
      ...formData,
      [id]: value,
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
    
    if (!formData.name) {
      newErrors.name = 'Name is required';
    }
    
    if (!formData.email) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email is invalid';
    }
    
    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters';
    }
    
    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password';
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setIsLoading(true);
    try {
      // Split name into first and last name
      const nameParts = formData.name?.split(' ') || [];
      const firstName = nameParts[0] || '';
      const lastName = nameParts.slice(1).join(' ') || '';
      
      const result = await registerUser({
        email: formData.email,
        username: formData.email, // Use email as username
        first_name: firstName,
        last_name: lastName,
        password: formData.password,
        confirm_password: formData.confirmPassword || '',
      });
      
      // Ensure token is set before navigation
      const token = localStorage.getItem('authToken');
      if (!token) {
        throw new Error('Registration succeeded but authentication token was not set. Please try logging in.');
      }
      
      // Check if user is admin and redirect accordingly
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
        // Continue to home page even if admin check fails
      }
      
      // Navigate to home page for regular users
      navigate('/home');
    } catch (error: any) {
      console.error('Signup error:', error);
      const errorMessage = error?.message || 'Registration failed. Please check your information and try again.';
      
      // Set appropriate error fields
      if (errorMessage.toLowerCase().includes('email')) {
        setErrors({ email: errorMessage });
      } else if (errorMessage.toLowerCase().includes('password')) {
        setErrors({ password: errorMessage, confirmPassword: errorMessage });
      } else if (errorMessage.toLowerCase().includes('username')) {
        setErrors({ email: errorMessage }); // Username is same as email
      } else {
        setErrors({ 
          email: errorMessage,
          password: errorMessage.includes('server') ? '' : errorMessage
        });
      }
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
          id="name"
          label="Full Name"
          type="text"
          placeholder="John Doe"
          value={formData.name || ''}
          onChange={handleChange}
          required
          error={errors.name}
        />
        
        <Input
          id="email"
          label="Email address"
          type="email"
          placeholder="name@example.com"
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
        
        <Input
          id="confirmPassword"
          label="Confirm Password"
          type="password"
          placeholder="••••••••"
          value={formData.confirmPassword || ''}
          onChange={handleChange}
          required
          error={errors.confirmPassword}
        />
        
        <Button type="submit" variant="primary" fullWidth disabled={isLoading} className="mt-2">
          <UserPlus size={18} className="mr-2" />
          {isLoading ? 'Creating account...' : 'Create account'}
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
            Already have an account?{' '}
            <Link to="/login" className="font-semibold text-primary-600 hover:text-primary-700 inline-flex items-center transition-colors">
              Sign in
              <ArrowRight size={16} className="ml-1" />
            </Link>
          </p>
        </div>
      </form>
    </motion.div>
  );
};

export default SignupForm;