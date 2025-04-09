import { initializeApp } from 'firebase/app';
import {
  getAuth,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  signOut,
  onAuthStateChanged as firebaseAuthStateChanged,
  User
} from 'firebase/auth';
import {
  getFirestore,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  collection,
  query,
  where,
  orderBy,
  limit,
  getDocs
} from 'firebase/firestore';

// Firebase configuration
// In a real application, these values would come from environment variables
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || 'your-api-key',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || 'your-auth-domain',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || 'your-project-id',
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || 'your-storage-bucket',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || 'your-messaging-sender-id',
  appId: import.meta.env.VITE_FIREBASE_APP_ID || 'your-app-id'
};

// User profile interface
export interface UserProfile {
  id: string;
  username: string;
  email: string;
  photoURL: string | null;
  stats: {
    wins: number;
    losses: number;
    winRate: number;
    elo: number;
  };
  createdAt: Date;
  lastActive: Date;
  shipPlacements?: any[];
}

// Game history interface
export interface GameHistory {
  id: string;
  playerIds: string[];
  playerNames: string[];
  winnerId: string;
  winnerName: string;
  date: Date;
}

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const googleProvider = new GoogleAuthProvider();

// Firebase service class
class FirebaseService {
  // Current user state
  private currentUser: User | null = null;
  private userProfile: UserProfile | null = null;
  
  // Auth state change listener
  constructor() {
    firebaseAuthStateChanged(auth, (user) => {
      this.currentUser = user;
      
      if (user) {
        this.loadUserProfile(user.uid);
      } else {
        this.userProfile = null;
      }
    });
  }
  
  // Auth state change subscription
  onAuthStateChanged(callback: (user: User | null) => void) {
    return firebaseAuthStateChanged(auth, callback);
  }
  
  // Get the current user
  getCurrentUser(): User | null {
    return this.currentUser;
  }
  
  // Get the current user profile
  async getUserProfile(): Promise<UserProfile | null> {
    if (!this.currentUser) return null;
    
    if (!this.userProfile) {
      await this.loadUserProfile(this.currentUser.uid);
    }
    
    return this.userProfile;
  }
  
  // Load user profile from Firestore
  private async loadUserProfile(userId: string): Promise<void> {
    try {
      const userDocRef = doc(db, 'users', userId);
      const userDoc = await getDoc(userDocRef);
      
      if (userDoc.exists()) {
        const userData = userDoc.data() as Omit<UserProfile, 'id'>;
        this.userProfile = {
          id: userId,
          ...userData,
          createdAt: userData.createdAt.toDate(),
          lastActive: userData.lastActive.toDate()
        };
      } else {
        console.log('User profile not found in Firestore');
      }
    } catch (error) {
      console.error('Error loading user profile:', error);
    }
  }
  
  // Sign in with email and password
  async signInWithEmail(email: string, password: string): Promise<User> {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      return userCredential.user;
    } catch (error) {
      console.error('Error signing in with email:', error);
      throw error;
    }
  }
  
  // Sign in with Google
  async signInWithGoogle(): Promise<User> {
    try {
      const userCredential = await signInWithPopup(auth, googleProvider);
      return userCredential.user;
    } catch (error) {
      console.error('Error signing in with Google:', error);
      throw error;
    }
  }
  
  // Sign up with email and password
  async signUpWithEmail(email: string, password: string, username: string): Promise<User> {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      
      // Create user profile in Firestore
      await this.createUserProfile(user.uid, {
        username,
        email,
        photoURL: null,
        stats: {
          wins: 0,
          losses: 0,
          winRate: 0,
          elo: 1000 // Starting ELO
        },
        createdAt: new Date(),
        lastActive: new Date()
      });
      
      return user;
    } catch (error) {
      console.error('Error signing up with email:', error);
      throw error;
    }
  }
  
  // Create user profile in Firestore
  async createUserProfile(userId: string, profile: Omit<UserProfile, 'id'>): Promise<void> {
    try {
      const userDocRef = doc(db, 'users', userId);
      await setDoc(userDocRef, profile);
    } catch (error) {
      console.error('Error creating user profile:', error);
      throw error;
    }
  }
  
  // Sign out
  async signOut(): Promise<void> {
    try {
      await signOut(auth);
      this.userProfile = null;
    } catch (error) {
      console.error('Error signing out:', error);
      throw error;
    }
  }
  
  // Update user profile
  async updateUserProfile(updates: Partial<UserProfile>): Promise<void> {
    if (!this.currentUser) throw new Error('No user signed in');
    
    try {
      const userDocRef = doc(db, 'users', this.currentUser.uid);
      await updateDoc(userDocRef, updates as any);
      
      // Update local user profile
      if (this.userProfile) {
        this.userProfile = {
          ...this.userProfile,
          ...updates
        };
      }
    } catch (error) {
      console.error('Error updating user profile:', error);
      throw error;
    }
  }
  
  // Save ship placements
  async saveShipPlacements(placements: any[]): Promise<void> {
    if (!this.currentUser) throw new Error('No user signed in');
    
    try {
      await this.updateUserProfile({ shipPlacements: placements });
    } catch (error) {
      console.error('Error saving ship placements:', error);
      throw error;
    }
  }
  
  // Get ship placements
  async getShipPlacements(): Promise<any[] | null> {
    if (!this.currentUser) return null;
    
    try {
      const profile = await this.getUserProfile();
      return profile?.shipPlacements || null;
    } catch (error) {
      console.error('Error getting ship placements:', error);
      return null;
    }
  }
  
  // Record game result
  async recordGameResult(
    opponentId: string,
    opponentName: string,
    won: boolean
  ): Promise<void> {
    if (!this.currentUser || !this.userProfile) throw new Error('No user signed in');
    
    try {
      // Update user stats
      const userDocRef = doc(db, 'users', this.currentUser.uid);
      const stats = this.userProfile.stats;
      
      const wins = won ? stats.wins + 1 : stats.wins;
      const losses = won ? stats.losses : stats.losses + 1;
      const winRate = Math.round((wins / (wins + losses)) * 100);
      
      // Simple ELO adjustment (winner takes 10 points from loser)
      // In a real implementation, this would be more complex and handled on the server
      const eloChange = 10;
      const elo = won ? stats.elo + eloChange : Math.max(stats.elo - eloChange, 0);
      
      await updateDoc(userDocRef, {
        'stats.wins': wins,
        'stats.losses': losses,
        'stats.winRate': winRate,
        'stats.elo': elo,
        lastActive: new Date()
      });
      
      // Create game history record
      const gameId = `game_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
      const gameDocRef = doc(db, 'games', gameId);
      
      await setDoc(gameDocRef, {
        playerIds: [this.currentUser.uid, opponentId],
        playerNames: [this.userProfile.username, opponentName],
        winnerId: won ? this.currentUser.uid : opponentId,
        winnerName: won ? this.userProfile.username : opponentName,
        date: new Date()
      });
      
      // Update local user profile
      if (this.userProfile) {
        this.userProfile.stats = {
          wins,
          losses,
          winRate,
          elo
        };
      }
    } catch (error) {
      console.error('Error recording game result:', error);
      throw error;
    }
  }
  
  // Get user game history
  async getGameHistory(limit = 10): Promise<GameHistory[]> {
    if (!this.currentUser) return [];
    
    try {
      const gamesQuery = query(
        collection(db, 'games'),
        where('playerIds', 'array-contains', this.currentUser.uid),
        orderBy('date', 'desc'),
        limit(limit)
      );
      
      const querySnapshot = await getDocs(gamesQuery);
      const games: GameHistory[] = [];
      
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        games.push({
          id: doc.id,
          playerIds: data.playerIds,
          playerNames: data.playerNames,
          winnerId: data.winnerId,
          winnerName: data.winnerName,
          date: data.date.toDate()
        });
      });
      
      return games;
    } catch (error) {
      console.error('Error getting game history:', error);
      return [];
    }
  }
  
  // Get leaderboard
  async getLeaderboard(limit = 10): Promise<UserProfile[]> {
    try {
      const usersQuery = query(
        collection(db, 'users'),
        orderBy('stats.elo', 'desc'),
        limit(limit)
      );
      
      const querySnapshot = await getDocs(usersQuery);
      const users: UserProfile[] = [];
      
      querySnapshot.forEach((doc) => {
        const data = doc.data() as Omit<UserProfile, 'id'>;
        users.push({
          id: doc.id,
          ...data,
          createdAt: data.createdAt.toDate(),
          lastActive: data.lastActive.toDate()
        });
      });
      
      return users;
    } catch (error) {
      console.error('Error getting leaderboard:', error);
      return [];
    }
  }
}

// Create and export a singleton instance
const firebaseService = new FirebaseService();
export default firebaseService; 