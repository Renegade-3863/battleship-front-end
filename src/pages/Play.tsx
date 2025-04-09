import React, { useState, useEffect } from 'react';
import { 
  Container, 
  Typography, 
  Paper, 
  Box, 
  Button,
  Grid,
  CircularProgress,
  TextField,
  Snackbar,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  FormControlLabel,
  Switch
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import socketService from '../services/socketService';
import { useAuth } from '../context/AuthContext';

const Play = () => {
  const navigate = useNavigate();
  const { user, userProfile } = useAuth();
  const [matchmakingActive, setMatchmakingActive] = useState(false);
  const [privateGameId, setPrivateGameId] = useState('');
  const [joinError, setJoinError] = useState<string | null>(null);
  const [privateGameLink, setPrivateGameLink] = useState<string | null>(null);
  const [openLinkDialog, setOpenLinkDialog] = useState(false);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [humanOnlyMode, setHumanOnlyMode] = useState(true);
  const [noPlayersFound, setNoPlayersFound] = useState(false);
  
  useEffect(() => {
    // Make sure socket is connected
    if (!socketService.isConnected()) {
      socketService.connect();
    }

    // Listen for match found event
    socketService.onMatchFound((gameId) => {
      console.log('Match found! Navigating to game:', gameId);
      setMatchmakingActive(false);
      
      // Use a small timeout to ensure the state update happens before navigation
      setTimeout(() => {
        navigate(`/game/${gameId}`);
      }, 100);
    });
    
    // Listen for no players found event
    socketService.onNoPlayersFound(() => {
      console.log('No players found event received');
      setNoPlayersFound(true);
      setMatchmakingActive(false);
    });
    
    return () => {
      // Cleanup listeners
      socketService.offMatchFound();
      socketService.offNoPlayersFound();
    };
  }, [navigate]);
  
  // Handle URL parameters for game joining
  useEffect(() => {
    // Check if we have a gameId in the path
    const pathParts = window.location.pathname.split('/');
    if (pathParts.length >= 3 && pathParts[1] === 'join') {
      const joinGameId = pathParts[2];
      console.log('Found game ID in URL:', joinGameId);
      setPrivateGameId(joinGameId);
      handleJoinPrivateGame(joinGameId);
    }
  }, []);
  
  const handleStartMatchmaking = () => {
    setMatchmakingActive(true);
    setNoPlayersFound(false);
    
    // Connect to server and start looking for a match
    if (!socketService.isConnected()) {
      socketService.connect();
    }
    
    // Generate a guest ID if user is not logged in
    const playerId = user ? user.uid : `guest_${Math.random().toString(36).substring(2, 9)}`;
    const playerName = user ? (userProfile?.username || user.displayName || 'Player') : `Guest ${Math.floor(Math.random() * 1000)}`;
    
    // Join matchmaking with user data and preferences
    socketService.joinMatchmaking({
      id: playerId,
      name: playerName,
      humanOnly: humanOnlyMode
    });
  };
  
  const handleCancelMatchmaking = () => {
    setMatchmakingActive(false);
    socketService.cancelMatchmaking();
  };
  
  const handleCreatePrivateGame = () => {
    // In a real implementation, this would create a game on the server
    // and return a unique game ID
    
    // For demo, generate a random ID
    const randomId = Math.random().toString(36).substring(2, 10);
    const gameLink = `${window.location.origin}/join/${randomId}`;
    
    setPrivateGameLink(gameLink);
    setOpenLinkDialog(true);
  };
  
  const handleCopyLink = () => {
    if (privateGameLink) {
      navigator.clipboard.writeText(privateGameLink);
      setSnackbarOpen(true);
    }
  };
  
  const handleJoinPrivateGame = (gameIdParam?: string) => {
    const gameIdToJoin = gameIdParam || privateGameId;
    
    if (!gameIdToJoin.trim()) {
      setJoinError('Please enter a game ID');
      return;
    }
    
    console.log('Joining private game with ID:', gameIdToJoin);
    navigate(`/game/${gameIdToJoin}`);
  };

  return (
    <Container maxWidth="md">
      <Paper 
        elevation={3} 
        sx={{ 
          p: 4, 
          mt: 4,
          background: 'rgba(0, 0, 0, 0.8)',
          color: 'white'
        }}
      >
        <Typography variant="h4" component="h1" align="center" gutterBottom>
          Play Battleship
        </Typography>
        
        <Grid container spacing={6} sx={{ mt: 2 }}>
          {/* Matchmaking Section */}
          <Grid item xs={12} md={6}>
            <Box sx={{ textAlign: 'center', height: '100%', display: 'flex', flexDirection: 'column' }}>
              <Typography variant="h5" gutterBottom>
                Matchmaking
              </Typography>
              <Typography variant="body1" sx={{ mb: 2 }}>
                Play against a random opponent with similar skill level
              </Typography>
              
              <FormControlLabel
                control={
                  <Switch
                    checked={humanOnlyMode}
                    onChange={(e) => setHumanOnlyMode(e.target.checked)}
                    color="primary"
                    disabled={matchmakingActive}
                  />
                }
                label="Human opponents only"
                sx={{ mb: 2, justifyContent: 'center' }}
              />
              
              {!user && humanOnlyMode && (
                <Alert severity="info" sx={{ mb: 2 }}>
                  Note: For the best experience with human opponents, consider <Button size="small" color="primary" onClick={() => navigate('/login')}>logging in</Button>
                </Alert>
              )}
              
              {noPlayersFound && (
                <Alert severity="info" sx={{ mb: 2 }}>
                  No human players found. Try again or disable "Human only" option.
                </Alert>
              )}
              
              {matchmakingActive ? (
                <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flexGrow: 1, justifyContent: 'center' }}>
                  <CircularProgress size={60} sx={{ mb: 3 }} />
                  <Typography variant="body1" gutterBottom>
                    Searching for {humanOnlyMode ? 'human ' : ''}opponent...
                  </Typography>
                  <Button 
                    variant="outlined" 
                    color="primary"
                    onClick={handleCancelMatchmaking}
                    sx={{ mt: 2 }}
                  >
                    Cancel
                  </Button>
                </Box>
              ) : (
                <Box sx={{ mt: 'auto' }}>
                  <Button 
                    variant="contained" 
                    color="primary"
                    size="large"
                    fullWidth
                    onClick={handleStartMatchmaking}
                    sx={{ py: 1.5 }}
                  >
                    Find Match
                  </Button>
                </Box>
              )}
            </Box>
          </Grid>
          
          {/* Private Game Section */}
          <Grid item xs={12} md={6}>
            <Box sx={{ textAlign: 'center', height: '100%', display: 'flex', flexDirection: 'column' }}>
              <Typography variant="h5" gutterBottom>
                Private Game
              </Typography>
              <Typography variant="body1" sx={{ mb: 3 }}>
                Create a game and invite a friend, or join a friend's game
              </Typography>
              
              <Button 
                variant="contained" 
                color="primary"
                size="large"
                onClick={handleCreatePrivateGame}
                sx={{ py: 1.5, mb: 3 }}
                disabled={matchmakingActive}
              >
                Create Private Game
              </Button>
              
              <Typography variant="body1" sx={{ mt: 1 }}>
                Or join with game ID:
              </Typography>
              
              <Box sx={{ display: 'flex', mt: 1, gap: 1 }}>
                <TextField
                  placeholder="Enter game ID"
                  variant="outlined"
                  fullWidth
                  value={privateGameId}
                  onChange={(e) => {
                    setPrivateGameId(e.target.value);
                    setJoinError(null);
                  }}
                  disabled={matchmakingActive}
                  error={!!joinError}
                  helperText={joinError}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      '& fieldset': {
                        borderColor: 'rgba(255, 255, 255, 0.3)',
                      },
                    },
                    '& .MuiInputLabel-root': {
                      color: 'rgba(255, 255, 255, 0.7)',
                    },
                    '& .MuiOutlinedInput-input': {
                      color: 'white',
                    },
                  }}
                />
                <Button 
                  variant="outlined" 
                  color="primary"
                  onClick={() => handleJoinPrivateGame()}
                  disabled={matchmakingActive}
                >
                  Join
                </Button>
              </Box>
            </Box>
          </Grid>
        </Grid>
        
        <Box sx={{ mt: 4, textAlign: 'center' }}>
          <Button 
            variant="text" 
            color="primary"
            onClick={() => navigate('/')}
          >
            Back to Home
          </Button>
        </Box>
      </Paper>
      
      {/* Share Link Dialog */}
      <Dialog
        open={openLinkDialog}
        onClose={() => setOpenLinkDialog(false)}
        PaperProps={{
          sx: {
            backgroundColor: 'rgba(0, 30, 60, 0.95)',
            color: 'white'
          }
        }}
      >
        <DialogTitle>Share Game Link</DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
            Share this link with a friend to play a private game:
          </DialogContentText>
          <TextField
            fullWidth
            margin="dense"
            variant="outlined"
            value={privateGameLink}
            InputProps={{
              readOnly: true,
            }}
            sx={{
              mt: 2,
              '& .MuiOutlinedInput-root': {
                '& fieldset': {
                  borderColor: 'rgba(255, 255, 255, 0.3)',
                },
              },
              '& .MuiOutlinedInput-input': {
                color: 'white',
              },
            }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenLinkDialog(false)} color="primary">
            Close
          </Button>
          <Button onClick={handleCopyLink} color="primary" variant="contained">
            Copy Link
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Snackbar for copy confirmation */}
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={3000}
        onClose={() => setSnackbarOpen(false)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert 
          onClose={() => setSnackbarOpen(false)} 
          severity="success" 
          sx={{ width: '100%' }}
        >
          Game link copied to clipboard!
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default Play; 