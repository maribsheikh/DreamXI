import React from 'react';
import AuthLayout from '../components/auth/AuthLayout';
import LoginForm from '../components/auth/LoginForm';

const LoginPage: React.FC = () => {
  return (
    <AuthLayout 
      title="Welcome back"
      subtitle="Sign in to your DREAM-XI account"
    >
      <LoginForm />
    </AuthLayout>
  );
};

export default LoginPage;