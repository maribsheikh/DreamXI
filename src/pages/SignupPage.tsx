import React from 'react';
import AuthLayout from '../components/auth/AuthLayout';
import SignupForm from '../components/auth/SignupForm';

const SignupPage: React.FC = () => {
  return (
    <AuthLayout 
      title="Create an account"
      subtitle="Join DREAM-XI and start building your team"
    >
      <SignupForm />
    </AuthLayout>
  );
};

export default SignupPage;