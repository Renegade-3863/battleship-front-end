import React, { ReactNode, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

interface AuthRedirectWrapperProps {
  children: ReactNode;
}

const AuthRedirectWrapper: React.FC<AuthRedirectWrapperProps> = ({ children }) => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  
  useEffect(() => {
    // After successful authentication, redirect from login page to home
    if (currentUser && location.pathname === '/login') {
      navigate('/');
    }
  }, [currentUser, navigate, location.pathname]);
  
  return <>{children}</>;
};

export default AuthRedirectWrapper; 