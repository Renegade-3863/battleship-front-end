import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export const useAuthRedirect = () => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  
  useEffect(() => {
    // After successful authentication, redirect to the home page
    if (currentUser && window.location.pathname === '/login') {
      navigate('/');
    }
  }, [currentUser, navigate]);
};

export default useAuthRedirect; 