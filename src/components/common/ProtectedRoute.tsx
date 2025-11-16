import React, { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [isChecking, setIsChecking] = useState<boolean>(true);

  useEffect(() => {
    const checkAdminStatus = async () => {
      try {
        const token = localStorage.getItem('authToken');
        if (!token) {
          // No token means not authenticated - redirect to login
          setIsAdmin(null);
          setIsChecking(false);
          return;
        }

        const response = await fetch('http://localhost:8000/api/admin/check/', {
          headers: {
            'Authorization': `Token ${token}`,
          },
        });

        if (response.ok) {
          const data = await response.json();
          setIsAdmin(data.is_admin);
        } else if (response.status === 401) {
          // Unauthorized - token invalid, redirect to login
          localStorage.removeItem('authToken');
          localStorage.removeItem('user');
          setIsAdmin(null);
        } else {
          // Other error - assume not admin but allow access
          setIsAdmin(false);
        }
      } catch (error) {
        console.error('Error checking admin status:', error);
        // On error, assume not admin but allow access
        setIsAdmin(false);
      } finally {
        setIsChecking(false);
      }
    };

    checkAdminStatus();
  }, []);

  if (isChecking) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  // If no token (isAdmin is null), redirect to login
  if (isAdmin === null) {
    return <Navigate to="/login" replace />;
  }

  // If user is admin, redirect to admin panel
  if (isAdmin) {
    return <Navigate to="/admin" replace />;
  }

  // If not admin but has token, allow access to the route
  return <>{children}</>;
};

export default ProtectedRoute;

