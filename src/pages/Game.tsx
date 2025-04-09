import React, { useState, useEffect } from 'react';
import { 
  Container, 
  Typography, 
  Paper, 
  Box, 
  Grid, 
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  useMediaQuery,
  useTheme,
  Fade
} from '@mui/material';
import { useParams, useNavigate } from 'react-router-dom';
import { CellState } from '../components/game/GameBoard';
import CanvasGameBoard from '../components/game/CanvasGameBoard';
import GameChat from '../components/game/GameChat';
import ShipPlacementBoard from '../components/game/ShipPlacementBoard';
import { getDefaultShipPlacement, Ship } from '../models/Ship';
import socketService from '../services/socketService';
import { useAuth } from '../context/AuthContext';

// Game state enum
enum GameState {
  SETUP,
  PLAYING,
  GAME_OVER
}

// Generate a demo board for testing
const generateDemoOpponentBoard = (): CellState[][] => {
  const board = Array(10)
    .fill(null)
    .map(() => Array(10).fill(CellState.EMPTY));
  
  // Add some sample hits and misses
  board[2][3] = CellState.HIT;
  board[2][4] = CellState.HIT;
  board[2][5] = CellState.SUNK;
  board[3][7] = CellState.MISS;
  board[4][1] = CellState.MISS;
  board[5][5] = CellState.HIT;
  
  return board;
};

const Game = () => {
  const navigate = useNavigate();
  const { gameId } = useParams<{ gameId: string }>();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const { user } = useAuth();
  
  // Game state
  const [gameState, setGameState] = useState<GameState>(GameState.SETUP);
  const [playerReady, setPlayerReady] = useState(false);
  const [opponentReady, setOpponentReady] = useState(false);
  const [playerTurn, setPlayerTurn] = useState(true);
  const [gameOverDialogOpen, setGameOverDialogOpen] = useState(false);
  const [winner, setWinner] = useState<'player' | 'opponent' | null>(null);
  const [opponentName, setOpponentName] = useState('Waiting for opponent...');
  const [isOpponentConnected, setIsOpponentConnected] = useState(true);
  
  // Animation state
  const [isAnimating, setIsAnimating] = useState(false);
  const [pendingTurnUpdate, setPendingTurnUpdate] = useState<boolean | null>(null);
  
  // Board states
  const [playerBoard, setPlayerBoard] = useState<CellState[][]>(
    Array(10).fill(null).map(() => Array(10).fill(CellState.EMPTY))
  );
  const [opponentBoard, setOpponentBoard] = useState<CellState[][]>(
    Array(10).fill(null).map(() => Array(10).fill(CellState.EMPTY))
  );
  
  // Ship placement state
  const [ships, setShips] = useState<Ship[]>(getDefaultShipPlacement());
  
  // Add state for extra turn notification
  const [showExtraTurnNotice, setShowExtraTurnNotice] = useState(false);
  
  // Connect to socket on mount
  useEffect(() => {
    console.log('Game component mounted, gameId:', gameId);
    
    // First, ensure we're connected to the socket
    if (!socketService.isConnected()) {
      console.log('Socket not connected, connecting now...');
      socketService.connect();
    } else {
      console.log('Socket already connected');
    }
    
    // If we have a gameId from the URL, we should join that game
    if (gameId) {
      console.log('Joining game with ID:', gameId);
      
      // Generate a guest ID if user is not logged in
      const playerId = user ? user.uid : `guest_${Math.random().toString(36).substring(2, 9)}`;
      const playerName = user ? (user.displayName || 'Player') : `Guest ${Math.floor(Math.random() * 1000)}`;
      
      socketService.joinPrivateGame(gameId, {
        id: playerId,
        name: playerName
      });
    }
    
    // Set up all socket event listeners
    const setupSocketListeners = () => {
      console.log('Setting up all socket listeners');
    
      // Listen for opponent data
      socketService.on('opponent_data', (data: { name: string }) => {
        console.log('Received opponent data:', data);
        setOpponentName(data.name);
        setIsOpponentConnected(true);
      });
      
      // Listen for opponent ready
      socketService.on('opponent_ready', () => {
        console.log('Opponent is ready');
        setOpponentReady(true);
        
        // Debug check if both players are ready
        if (playerReady) {
          console.log('Both players are ready! Waiting for server to start game...');
        }
      });
      
      // Listen for game started event - using dedicated handler
      socketService.onGameStarted(() => {
        console.log('Game started event received in Game.tsx, changing to PLAYING state');
        console.log('Current game state before change:', GameState[gameState]);
        
        // Force state update to PLAYING
        setGameState(GameState.PLAYING);
        
        console.log('Game state update triggered');
      });
      
      // Listen for turn update
      socketService.on('turn_update', (data: { playerTurn: boolean; reason?: string }) => {
        console.log('Turn update received:', data);
        
        if (data.reason) {
          console.log('Turn change reason:', data.reason);
        }
        
        // Special case: if reason is "hit", player should keep their turn
        if (data.reason === 'hit' && playerTurn === true) {
          console.log('Maintaining player turn after hit');
          // Don't change turn
          return;
        }
        
        if (isAnimating) {
          // If an animation is playing, delay the turn update
          console.log('Animation in progress, delaying turn update');
          setPendingTurnUpdate(data.playerTurn);
        } else {
          // Otherwise update immediately
          setPlayerTurn(data.playerTurn);
        }
      });
      
      // Listen for move result
      socketService.on('move_result', (data: {
        row: number;
        col: number;
        result: 'hit' | 'miss' | 'sunk';
        isPlayerBoard: boolean;
        keepTurn?: boolean;
        gameOver?: boolean;
      }) => {
        const { row, col, result, isPlayerBoard, keepTurn, gameOver } = data;
        console.log('Move result received:', data);
        
        if (isPlayerBoard) {
          // Update player board when opponent attacks
          const newPlayerBoard = [...playerBoard.map(rowArray => [...rowArray])];
          
          if (result === 'hit' || result === 'sunk') {
            newPlayerBoard[row][col] = result === 'sunk' ? CellState.SUNK : CellState.HIT;
          } else {
            newPlayerBoard[row][col] = CellState.MISS;
          }
          
          setPlayerBoard(newPlayerBoard);
          
          // If all of player's ships are sunk, the game is over
          if (gameOver) {
            setWinner('opponent');
            setGameState(GameState.GAME_OVER);
            setGameOverDialogOpen(true);
          }
        } else {
          // Update opponent board when player attacks
          const newOpponentBoard = [...opponentBoard.map(rowArray => [...rowArray])];
          
          if (result === 'hit' || result === 'sunk') {
            newOpponentBoard[row][col] = result === 'sunk' ? CellState.SUNK : CellState.HIT;
            
            // Player got a hit, so they should keep their turn unless server explicitly says otherwise
            if (keepTurn !== false) {
              console.log('You got a hit! You get another turn!');
              // Show notification
              setShowExtraTurnNotice(true);
              // Hide after 3 seconds
              setTimeout(() => {
                setShowExtraTurnNotice(false);
              }, 3000);
            }
          } else {
            newOpponentBoard[row][col] = CellState.MISS;
          }
          
          setOpponentBoard(newOpponentBoard);
          
          // If all opponent's ships are sunk, the game is over
          if (gameOver) {
            setWinner('player');
            setGameState(GameState.GAME_OVER);
            setGameOverDialogOpen(true);
          }
        }
      });
      
      // Listen for game over
      socketService.on('game_over', (data: { winner: 'player' | 'opponent' }) => {
        console.log('Game over event received:', data);
        setWinner(data.winner);
        setGameState(GameState.GAME_OVER);
        setGameOverDialogOpen(true);
      });
      
      // Listen for opponent disconnected/reconnected
      socketService.onOpponentDisconnected(() => {
        console.log('Opponent disconnected');
        setIsOpponentConnected(false);
      });
      
      socketService.onOpponentReconnected(() => {
        console.log('Opponent reconnected');
        setIsOpponentConnected(true);
      });
    };
    
    // If we have a gameId from the URL, we should join that game
    if (gameId) {
      console.log('Joining game with ID:', gameId);
      
      // Generate a guest ID if user is not logged in
      const playerId = user ? user.uid : `guest_${Math.random().toString(36).substring(2, 9)}`;
      const playerName = user ? (user.displayName || 'Player') : `Guest ${Math.floor(Math.random() * 1000)}`;
      
      socketService.joinPrivateGame(gameId, {
        id: playerId,
        name: playerName
      });
    }
    
    // Now set up all the event listeners
    setupSocketListeners();
    
    // Clean up function to remove all listeners
    return () => {
      console.log('Game component unmounting, cleaning up listeners');
      
      // Clean up all listeners when component unmounts
      socketService.off('opponent_data', () => {});
      socketService.off('opponent_ready', () => {});
      socketService.off('turn_update', () => {});
      socketService.off('move_result', () => {});
      socketService.off('game_over', () => {});
      socketService.offOpponentDisconnected();
      socketService.offOpponentReconnected();
      socketService.offGameStarted();
    };
  }, [gameId, user, isAnimating]); // Add isAnimating to dependencies
  
  // Handle applying delayed turn update after animation completes
  useEffect(() => {
    if (pendingTurnUpdate !== null && !isAnimating) {
      console.log('Applying delayed turn update:', pendingTurnUpdate);
      setPlayerTurn(pendingTurnUpdate);
      setPendingTurnUpdate(null);
    }
  }, [isAnimating, pendingTurnUpdate]);
  
  // Handle ship placement update
  const handleShipsPlaced = (updatedShips: Ship[]) => {
    setShips(updatedShips);
    
    // Update player board based on ship positions
    const newBoard = Array(10)
      .fill(null)
      .map(() => Array(10).fill(CellState.EMPTY));
    
    updatedShips.forEach(ship => {
      if (ship.position) {
        const { row, col } = ship.position;
        const { orientation, size } = ship;
        
        for (let i = 0; i < size; i++) {
          if (orientation === 'horizontal') {
            if (col + i < 10) {
              newBoard[row][col + i] = CellState.SHIP;
            }
          } else {
            if (row + i < 10) {
              newBoard[row + i][col] = CellState.SHIP;
            }
          }
        }
      }
    });
    
    setPlayerBoard(newBoard);
  };
  
  // Handle player ready
  const handlePlayerReady = () => {
    console.log('Player ready button clicked, submitting ships');
    
    // Update local state
    setPlayerReady(true);
    
    // Send ships to server
    socketService.submitShips(ships, playerBoard);
    
    // Debug check if both players are ready
    if (opponentReady) {
      console.log('Both players are ready! Waiting for server to start game...');
    } else {
      console.log('Waiting for opponent to be ready...');
    }
  };
  
  // Handle player attack on opponent's board
  const handleAttackOpponent = (row: number, col: number) => {
    if (
      gameState !== GameState.PLAYING || 
      !playerTurn || 
      opponentBoard[row][col] === CellState.HIT || 
      opponentBoard[row][col] === CellState.MISS ||
      opponentBoard[row][col] === CellState.SUNK ||
      isAnimating // Prevent shooting while animation is playing
    ) {
      return;
    }
    
    // Start animation
    setIsAnimating(true);
    
    // Make the move through the socket
    socketService.makeMove(row, col);
  };
  
  // Handle animation completion
  const handleAnimationComplete = (row: number, col: number, type: 'hit' | 'miss') => {
    console.log('Animation completed for shot at', row, col, 'of type', type);
    setIsAnimating(false);
  };
  
  // Handle leaving the game
  const handleLeaveGame = () => {
    navigate('/play');
  };

  // Determine which board to show based on turn
  const shouldShowPlayerBoard = gameState === GameState.SETUP || (!playerTurn && !isAnimating);
  const shouldShowOpponentBoard = gameState === GameState.SETUP || (playerTurn || isAnimating);
  
  // Text to show based on game state
  const getTurnText = () => {
    if (!isOpponentConnected) {
      return "Opponent Disconnected";
    }
    
    if (gameState === GameState.SETUP) {
      return "Position Your Ships";
    } else if (gameState === GameState.GAME_OVER) {
      return winner === 'player' ? "Victory!" : "Defeat!";
    } else if (playerTurn) {
      return "Your Turn - Attack the Enemy!";
    } else {
      return "Opponent's Turn - Defending...";
    }
  };

  const getTurnInstructions = () => {
    if (!isOpponentConnected) {
      return "Waiting for opponent to reconnect...";
    }
    
    if (gameState === GameState.SETUP) {
      return "Drag ships to position them. Click the button to rotate.";
    } else if (gameState === GameState.GAME_OVER) {
      return winner === 'player' 
        ? "Congratulations! You've sunk all enemy ships!" 
        : "Your fleet has been destroyed.";
    } else if (playerTurn) {
      return isAnimating 
        ? "Wait for your shot to land..." 
        : "Click on the opponent's board to attack a position";
    } else {
      return "Waiting for opponent to make a move...";
    }
  };
  
  // Add a useEffect to monitor game state changes
  useEffect(() => {
    console.log(`Game state changed to: ${GameState[gameState]}`);
    
    if (gameState === GameState.PLAYING) {
      console.log('Game is now in PLAYING state, both boards should be visible');
    }
  }, [gameState]);

  return (
    <Container maxWidth="xl" sx={{ mb: 4 }}>
      <Paper 
        elevation={3} 
        sx={{ 
          p: { xs: 2, md: 3 }, 
          mt: 2,
          background: 'rgba(0, 0, 0, 0.8)',
          color: 'white',
          borderRadius: '10px',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.5)'
        }}
      >
        <Box sx={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          mb: 3,
          flexDirection: { xs: 'column', sm: 'row' },
          gap: { xs: 2, sm: 0 }
        }}>
          <Typography variant="h4" component="h1" sx={{ fontWeight: 'bold' }}>
            {gameId ? `Private Game: ${gameId}` : 'Battleship Game'}
          </Typography>
          
          <Box sx={{ 
            display: 'flex', 
            alignItems: 'center',
            gap: 2
          }}>
            <Typography variant="subtitle1" component="span" sx={{ 
              fontWeight: 'medium',
              color: isOpponentConnected ? 'white' : 'error.main'
            }}>
              Opponent: {opponentName}
              {!isOpponentConnected && ' (Disconnected)'}
            </Typography>
            <Button 
              variant="outlined" 
              color="primary"
              onClick={handleLeaveGame}
              size="small"
              sx={{ fontWeight: 'bold' }}
            >
              Leave Game
            </Button>
          </Box>
        </Box>
        
        {/* Game status display */}
        <Box 
          sx={{ 
            textAlign: 'center', 
            mb: 3, 
            p: 2, 
            borderRadius: '10px',
            backgroundColor: 'rgba(10, 30, 50, 0.7)'
          }}
        >
          <Typography variant="h5" color="primary.main" sx={{ fontWeight: 'bold' }}>
            {getTurnText()}
          </Typography>
          <Typography variant="body1">
            {getTurnInstructions()}
          </Typography>
        </Box>
        
        {/* Game content with boards and chat */}
        <Grid container spacing={3}>
          {/* Boards section - expanded width in playing mode */}
          <Grid item xs={12} md={gameState === GameState.PLAYING ? 9 : 8}>
            {/* Playing phase - show only the active board */}
            {gameState === GameState.PLAYING ? (
              <Box sx={{ 
                position: 'relative', 
                minHeight: { xs: '500px', sm: '600px', md: '700px' },
                width: '100%'
              }}>
                <Fade in={shouldShowPlayerBoard} timeout={800}>
                  <Box sx={{ 
                    position: shouldShowOpponentBoard ? 'absolute' : 'static', 
                    top: 0, 
                    left: 0, 
                    width: '100%',
                    display: shouldShowPlayerBoard ? 'block' : 'none'
                  }}>
                    <CanvasGameBoard 
                      size={10}
                      isPlayerBoard={true}
                      editable={false}
                      boardState={playerBoard}
                      isActive={true}
                    />
                  </Box>
                </Fade>
                
                <Fade in={shouldShowOpponentBoard} timeout={800}>
                  <Box sx={{ 
                    position: shouldShowPlayerBoard ? 'absolute' : 'static',
                    top: 0, 
                    left: 0, 
                    width: '100%',
                    display: shouldShowOpponentBoard ? 'block' : 'none'
                  }}>
                    <CanvasGameBoard 
                      size={10}
                      isPlayerBoard={false}
                      boardState={opponentBoard}
                      onCellClick={handleAttackOpponent}
                      onAnimationComplete={handleAnimationComplete}
                      isActive={playerTurn && !isAnimating} 
                    />
                  </Box>
                </Fade>
              </Box>
            ) : (
              /* Setup phase - Ship placement */
              <ShipPlacementBoard 
                ships={ships}
                onShipsPlaced={handleShipsPlaced}
                onReady={handlePlayerReady}
                isReady={playerReady}
              />
            )}
            
            {/* Debug button to force game start - only shown when both players are ready */}
            {gameState === GameState.SETUP && playerReady && opponentReady && (
              <Box sx={{ mt: 2, textAlign: 'center' }}>
                <Typography variant="body2" color="error" sx={{ mb: 1 }}>
                  Game should have started automatically. If stuck, try this:
                </Typography>
                <Button 
                  variant="outlined" 
                  color="error"
                  onClick={() => setGameState(GameState.PLAYING)}
                >
                  Force Start Game
                </Button>
              </Box>
            )}
          </Grid>
          
          {/* Chat section - narrower in playing mode */}
          <Grid item xs={12} md={gameState === GameState.PLAYING ? 3 : 4}>
            <GameChat opponentName={opponentName} />
          </Grid>
        </Grid>
      </Paper>
      
      {/* Game Over Dialog */}
      <Dialog
        open={gameOverDialogOpen}
        onClose={() => setGameOverDialogOpen(false)}
        PaperProps={{
          sx: {
            backgroundColor: 'rgba(0, 30, 60, 0.95)',
            color: 'white',
            borderRadius: '10px',
            border: '1px solid rgba(72, 145, 255, 0.3)'
          }
        }}
      >
        <DialogTitle sx={{ fontWeight: 'bold', textAlign: 'center' }}>
          {winner === 'player' ? 'Victory!' : 'Defeat!'}
        </DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ color: 'rgba(255, 255, 255, 0.8)', textAlign: 'center' }}>
            {winner === 'player' 
              ? 'Congratulations! You have sunk all enemy ships.' 
              : 'Your fleet has been destroyed by the enemy.'}
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ justifyContent: 'center', pb: 2 }}>
          <Button 
            onClick={handleLeaveGame} 
            color="primary"
            variant="outlined"
            sx={{ mr: 1 }}
          >
            Return to Lobby
          </Button>
          <Button 
            onClick={() => setGameOverDialogOpen(false)} 
            color="primary" 
            variant="contained"
          >
            View Final Board
          </Button>
        </DialogActions>
      </Dialog>

      {showExtraTurnNotice && (
        <Box sx={{
          position: 'fixed',
          bottom: '20px',
          left: '50%',
          transform: 'translateX(-50%)',
          backgroundColor: 'success.main',
          color: 'white',
          padding: '10px 20px',
          borderRadius: '20px',
          fontWeight: 'bold',
          boxShadow: '0 3px 5px rgba(0,0,0,0.3)',
          zIndex: 1000,
          animation: 'fadeIn 0.3s',
          transition: 'all 0.3s ease',
          '@keyframes fadeIn': {
            from: { opacity: 0, transform: 'translate(-50%, 20px)' },
            to: { opacity: 1, transform: 'translate(-50%, 0)' }
          }
        }}>
          <Typography variant="body1" fontWeight="bold">
            🎯 Hit! You get another turn!
          </Typography>
        </Box>
      )}
    </Container>
  );
};

export default Game; 