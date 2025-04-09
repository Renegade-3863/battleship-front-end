import React, { useState, useEffect } from 'react';
import { 
  Container, 
  Typography, 
  Paper, 
  Box, 
  Avatar, 
  Grid, 
  Card,
  CardContent,
  Button,
  CircularProgress
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import firebaseService, { GameHistory } from '../services/firebaseService';

const Profile = () => {
  const navigate = useNavigate();
  const { userProfile, signOut } = useAuth();
  
  const [gameHistory, setGameHistory] = useState<GameHistory[]>([]);
  const [loading, setLoading] = useState(true);

  // Load game history
  useEffect(() => {
    const loadGameHistory = async () => {
      setLoading(true);
      try {
        const history = await firebaseService.getGameHistory(5);
        setGameHistory(history);
      } catch (error) {
        console.error('Error loading game history:', error);
      } finally {
        setLoading(false);
      }
    };
    
    if (userProfile) {
      loadGameHistory();
    }
  }, [userProfile]);

  const getInitial = (name: string) => {
    return name?.charAt(0).toUpperCase() || '?';
  };
  
  const handleLogout = async () => {
    try {
      await signOut();
      navigate('/login');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };
  
  // Format date to readable string
  const formatDate = (date: Date) => {
    return date.toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  if (!userProfile) {
    return (
      <Container maxWidth="md" sx={{ mt: 8, textAlign: 'center' }}>
        <CircularProgress />
        <Typography variant="h6" sx={{ mt: 2 }}>
          Loading profile...
        </Typography>
      </Container>
    );
  }

  return (
    <Container maxWidth="md">
      <Paper 
        elevation={3} 
        sx={{ 
          p: 4, 
          mt: 4,
          mb: 4,
          background: 'rgba(0, 0, 0, 0.8)',
          color: 'white'
        }}
      >
        <Grid container spacing={4}>
          {/* Profile Header */}
          <Grid item xs={12} display="flex" alignItems="center" gap={3}>
            <Avatar
              sx={{ 
                width: 100, 
                height: 100, 
                bgcolor: 'primary.main',
                fontSize: '2.5rem'
              }}
              src={userProfile.photoURL || undefined}
            >
              {!userProfile.photoURL && getInitial(userProfile.username)}
            </Avatar>
            
            <Box>
              <Typography variant="h4">{userProfile.username}</Typography>
              <Typography variant="body1" color="rgba(255, 255, 255, 0.7)">
                {userProfile.email}
              </Typography>
            </Box>
            
            <Box sx={{ ml: 'auto' }}>
              <Button 
                variant="outlined" 
                color="primary"
                onClick={handleLogout}
              >
                Log Out
              </Button>
            </Box>
          </Grid>
          
          {/* Stats Cards */}
          <Grid item xs={12}>
            <Typography variant="h5" gutterBottom>Stats</Typography>
            <Grid container spacing={2}>
              <Grid item xs={6} md={3}>
                <Card sx={{ bgcolor: 'rgba(0, 30, 60, 0.8)', color: 'white' }}>
                  <CardContent>
                    <Typography variant="h6">ELO</Typography>
                    <Typography variant="h4">{userProfile.stats.elo}</Typography>
                  </CardContent>
                </Card>
              </Grid>
              
              <Grid item xs={6} md={3}>
                <Card sx={{ bgcolor: 'rgba(0, 30, 60, 0.8)', color: 'white' }}>
                  <CardContent>
                    <Typography variant="h6">Wins</Typography>
                    <Typography variant="h4">{userProfile.stats.wins}</Typography>
                  </CardContent>
                </Card>
              </Grid>
              
              <Grid item xs={6} md={3}>
                <Card sx={{ bgcolor: 'rgba(0, 30, 60, 0.8)', color: 'white' }}>
                  <CardContent>
                    <Typography variant="h6">Losses</Typography>
                    <Typography variant="h4">{userProfile.stats.losses}</Typography>
                  </CardContent>
                </Card>
              </Grid>
              
              <Grid item xs={6} md={3}>
                <Card sx={{ bgcolor: 'rgba(0, 30, 60, 0.8)', color: 'white' }}>
                  <CardContent>
                    <Typography variant="h6">Win Rate</Typography>
                    <Typography variant="h4">{userProfile.stats.winRate}%</Typography>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          </Grid>
          
          {/* Game History */}
          <Grid item xs={12}>
            <Typography variant="h5" gutterBottom>Recent Games</Typography>
            <Box sx={{ maxHeight: 300, overflow: 'auto' }}>
              {loading ? (
                <Box sx={{ textAlign: 'center', py: 4 }}>
                  <CircularProgress size={40} />
                </Box>
              ) : gameHistory.length > 0 ? (
                gameHistory.map((game) => (
                  <Card 
                    key={game.id} 
                    sx={{ 
                      mb: 1.5, 
                      bgcolor: 'rgba(0, 30, 60, 0.8)', 
                      color: 'white' 
                    }}
                  >
                    <CardContent>
                      <Grid container alignItems="center">
                        <Grid item xs={6}>
                          <Typography variant="body1">
                            vs {game.playerNames.find(name => name !== userProfile.username) || 'Unknown'}
                          </Typography>
                        </Grid>
                        <Grid item xs={3}>
                          <Typography 
                            variant="body1" 
                            color={game.winnerId === userProfile.id ? 'success.main' : 'error.main'}
                            fontWeight="bold"
                          >
                            {game.winnerId === userProfile.id ? 'WIN' : 'LOSS'}
                          </Typography>
                        </Grid>
                        <Grid item xs={3}>
                          <Typography variant="body2" color="rgba(255, 255, 255, 0.7)">
                            {formatDate(game.date)}
                          </Typography>
                        </Grid>
                      </Grid>
                    </CardContent>
                  </Card>
                ))
              ) : (
                <Typography variant="body1" color="rgba(255, 255, 255, 0.7)" textAlign="center" py={3}>
                  No games played yet. Start playing to build your history!
                </Typography>
              )}
            </Box>
          </Grid>
          
          {/* Play Button */}
          <Grid item xs={12} sx={{ textAlign: 'center', mt: 2 }}>
            <Button 
              variant="contained" 
              color="primary"
              size="large"
              onClick={() => navigate('/play')}
              sx={{ py: 1.5, px: 4 }}
            >
              Play Now
            </Button>
          </Grid>
        </Grid>
      </Paper>
    </Container>
  );
};

export default Profile; 