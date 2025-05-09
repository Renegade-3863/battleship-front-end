import React from 'react';
import { Button, Container, Typography, Box, Paper, Grid } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Home = () => {
  const navigate = useNavigate();
  const { currentUser } = useAuth();

  return (
    <Container maxWidth="lg">
      <Paper 
        elevation={3} 
        sx={{ 
          p: 4, 
          mt: 8, 
          textAlign: 'center',
          background: 'rgba(0, 0, 0, 0.8)',
          color: 'white'
        }}
      >
        <Typography variant="h2" component="h1" gutterBottom>
          Battleship Online
        </Typography>
        <Typography variant="h5" component="h2" gutterBottom>
          Challenge players around the world in the classic naval combat game
        </Typography>
        
        {currentUser ? (
          <Grid container spacing={4} justifyContent="center" sx={{ mt: 4 }}>
            <Grid item xs={12} md={4}>
              <Box sx={{ p: 3, height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                <Typography variant="h6" gutterBottom>
                  Ready to play?
                </Typography>
                <Typography variant="body1" sx={{ mb: 3 }}>
                  Jump into a game and test your skills against opponents worldwide.
                </Typography>
                <Button 
                  variant="contained" 
                  color="primary" 
                  size="large"
                  onClick={() => navigate('/play')}
                  sx={{ py: 1.5 }}
                  fullWidth
                >
                  Play Now
                </Button>
              </Box>
            </Grid>
            
            <Grid item xs={12} md={4}>
              <Box sx={{ p: 3, height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                <Typography variant="h6" gutterBottom>
                  New to Battleship?
                </Typography>
                <Typography variant="body1" sx={{ mb: 3 }}>
                  Learn the rules and strategies with our interactive tutorial.
                </Typography>
                <Button 
                  variant="outlined" 
                  color="primary" 
                  size="large"
                  onClick={() => navigate('/tutorial')}
                  sx={{ py: 1.5 }}
                  fullWidth
                >
                  Tutorial
                </Button>
              </Box>
            </Grid>
            
            {/* <Grid item xs={12} md={4}>
              <Box sx={{ p: 3, height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                <Typography variant="h6" gutterBottom>
                  Check your stats
                </Typography>
                <Typography variant="body1" sx={{ mb: 3 }}>
                  View your game history, win rate, and ELO rating.
                </Typography>
                <Button 
                  variant="outlined" 
                  color="primary" 
                  size="large"
                  onClick={() => navigate('/profile')}
                  sx={{ py: 1.5 }}
                  fullWidth
                >
                  Profile
                </Button>
              </Box>
            </Grid> */}
          </Grid>
        ) : (
          <Box sx={{ mt: 6, display: 'flex', flexDirection: 'column', gap: 3, maxWidth: 300, mx: 'auto' }}>
            <Button 
              variant="contained" 
              color="primary" 
              size="large"
              onClick={() => navigate('/login')}
              sx={{ py: 1.5 }}
            >
              Sign In
            </Button>
            
            <Button 
              variant="outlined" 
              color="primary" 
              size="large"
              onClick={() => navigate('/register')}
              sx={{ py: 1.5 }}
            >
              Create Account
            </Button>
            
            <Button 
              variant="text" 
              color="primary" 
              size="large"
              onClick={() => navigate('/tutorial')}
              sx={{ py: 1.5 }}
            >
              Learn to Play
            </Button>
          </Box>
        )}
      </Paper>
    </Container>
  );
};

export default Home; 