import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User } from 'firebase/auth';
import { useNavigate } from 'react-router-dom';
import firebaseService, { UserProfile } from '../services/firebaseService';

// Context interface
interface AuthContextType {
  currentUser: User | null;
  userProfile: UserProfile | null;
  loading: boolean;
  signInWithEmail: (email: string, password: string) => Promise<User>;
  signInWithGoogle: () => Promise<User>;
  signUpWithEmail: (email: string, password: string, username: string) => Promise<User>;
  signOut: () => Promise<void>;
  updateUserProfile: (updates: Partial<UserProfile>) => Promise<void>;
}

// Create context with default values
const AuthContext = createContext<AuthContextType>({
  currentUser: null,
  userProfile: null,
  loading: true,
  signInWithEmail: async () => { throw new Error('Not implemented'); },
  signInWithGoogle: async () => { throw new Error('Not implemented'); },
  signUpWithEmail: async () => { throw new Error('Not implemented'); },
  signOut: async () => { throw new Error('Not implemented'); },
  updateUserProfile: async () => { throw new Error('Not implemented'); },
});

// Hook to use the auth context
export const useAuth = () => {
  const context = useContext(AuthContext);
  
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  
  // For backward compatibility with code that uses 'user' instead of 'currentUser'
  const contextWithUserAlias = {
    ...context,
    user: context.currentUser
  };
  
  return contextWithUserAlias;
};

// AuthProvider component
export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  // Listen for auth state changes
  useEffect(() => {
    const unsubscribe = firebaseService.onAuthStateChanged((user) => {
      console.log("Auth state changed:", user ? `User: ${user.displayName || user.email}` : "No user");
      setCurrentUser(user);
      setLoading(false);
      
      // If user is signed in, load profile
      if (user) {
        loadUserProfile(user.uid);
      } else {
        setUserProfile(null);
      }
    });
    
    return unsubscribe;
  }, []);
  
  // Load user profile
  const loadUserProfile = async (userId: string) => {
    try {
      const profile = await firebaseService.getUserProfile();
      setUserProfile(profile);
    } catch (error) {
      console.error('Error loading user profile:', error);
    }
  };
  
  // Sign in with email and password
  const signInWithEmail = async (email: string, password: string) => {
    try {
      const user = await firebaseService.signInWithEmail(email, password);
      setCurrentUser(user);
      await loadUserProfile(user.uid);
      return user;
    } catch (error) {
      console.error('Error signing in with email:', error);
      throw error;
    }
  };
  
  // Sign in with Google
  const signInWithGoogle = async () => {
    try {
      const user = await firebaseService.signInWithGoogle();
      setCurrentUser(user);
      
      // Check if user profile exists, if not create it
      const profile = await firebaseService.getUserProfile();
      
      if (!profile) {
        // Create profile for new Google user
        await firebaseService.createUserProfile(user.uid, {
          username: user.displayName || `User${user.uid.substring(0, 6)}`,
          email: user.email || '',
          photoURL: user.photoURL,
          stats: {
            wins: 0,
            losses: 0,
            winRate: 0,
            elo: 1000
          },
          createdAt: new Date(),
          lastActive: new Date()
        });
        
        await loadUserProfile(user.uid);
      }
      
      return user;
    } catch (error) {
      console.error('Error signing in with Google:', error);
      throw error;
    }
  };
  
  // Sign up with email and password
  const signUpWithEmail = async (email: string, password: string, username: string) => {
    try {
      const user = await firebaseService.signUpWithEmail(email, password, username);
      setCurrentUser(user);
      await loadUserProfile(user.uid);
      return user;
    } catch (error) {
      console.error('Error signing up with email:', error);
      throw error;
    }
  };
  
  // Sign out
  const signOut = async () => {
    try {
      await firebaseService.signOut();
      setCurrentUser(null);
      setUserProfile(null);
    } catch (error) {
      console.error('Error signing out:', error);
      throw error;
    }
  };
  
  // Update user profile
  const updateUserProfile = async (updates: Partial<UserProfile>) => {
    try {
      await firebaseService.updateUserProfile(updates);
      
      // Update local state
      if (userProfile) {
        setUserProfile({
          ...userProfile,
          ...updates
        });
      }
    } catch (error) {
      console.error('Error updating user profile:', error);
      throw error;
    }
  };

  const value = {
    currentUser,
    userProfile,
    loading,
    signInWithEmail,
    signInWithGoogle,
    signUpWithEmail,
    signOut,
    updateUserProfile
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export default AuthContext; 