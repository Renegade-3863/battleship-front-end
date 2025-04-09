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
import GameBoard, { CellState } from '../components/game/GameBoard';
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
  
  // Board states
  const [playerBoard, setPlayerBoard] = useState<CellState[][]>(
    Array(10).fill(null).map(() => Array(10).fill(CellState.EMPTY))
  );
  const [opponentBoard, setOpponentBoard] = useState<CellState[][]>(
    Array(10).fill(null).map(() => Array(10).fill(CellState.EMPTY))
  );
  
  // Ship placement state
  const [ships, setShips] = useState<Ship[]>(getDefaultShipPlacement());
  
  // Connect to socket on mount
  useEffect(() => {
    console.log('Game component mounted, gameId:', gameId);
    
    if (!socketService.isConnected()) {
      socketService.connect();
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
    });
    
    // Listen for game started event
    socketService.onGameStarted(() => {
      console.log('Game started event received, changing to PLAYING state');
      setGameState(GameState.PLAYING);
    });
    
    // Listen for turn update
    socketService.on('turn_update', (data: { playerTurn: boolean }) => {
      console.log('Turn update received:', data);
      setPlayerTurn(data.playerTurn);
    });
    
    // Listen for move result
    socketService.on('move_result', (data: {
      row: number;
      col: number;
      result: 'hit' | 'miss' | 'sunk';
      isPlayerBoard: boolean;
    }) => {
      const { row, col, result, isPlayerBoard } = data;
      
      if (isPlayerBoard) {
        // Update player board when opponent attacks
        const newPlayerBoard = [...playerBoard.map(rowArray => [...rowArray])];
        
        if (result === 'hit' || result === 'sunk') {
          newPlayerBoard[row][col] = result === 'sunk' ? CellState.SUNK : CellState.HIT;
        } else {
          newPlayerBoard[row][col] = CellState.MISS;
        }
        
        setPlayerBoard(newPlayerBoard);
      } else {
        // Update opponent board when player attacks
        const newOpponentBoard = [...opponentBoard.map(rowArray => [...rowArray])];
        
        if (result === 'hit' || result === 'sunk') {
          newOpponentBoard[row][col] = result === 'sunk' ? CellState.SUNK : CellState.HIT;
        } else {
          newOpponentBoard[row][col] = CellState.MISS;
        }
        
        setOpponentBoard(newOpponentBoard);
      }
    });
    
    // Listen for game over
    socketService.on('game_over', (data: { winner: 'player' | 'opponent' }) => {
      setWinner(data.winner);
      setGameState(GameState.GAME_OVER);
      setGameOverDialogOpen(true);
    });
    
    // Listen for opponent disconnected
    socketService.onOpponentDisconnected(() => {
      setIsOpponentConnected(false);
    });
    
    // Listen for opponent reconnected
    socketService.onOpponentReconnected(() => {
      setIsOpponentConnected(true);
    });
    
    return () => {
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
  }, [gameId, user]);
  
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
    console.log('Player ready, submitting ships');
    setPlayerReady(true);
    socketService.submitShips(ships, playerBoard);
    // Game state will be updated when server sends the game_started event
  };
  
  // Handle player attack on opponent's board
  const handleAttackOpponent = (row: number, col: number) => {
    if (
      gameState !== GameState.PLAYING || 
      !playerTurn || 
      opponentBoard[row][col] === CellState.HIT || 
      opponentBoard[row][col] === CellState.MISS ||
      opponentBoard[row][col] === CellState.SUNK
    ) {
      return;
    }
    
    // Make the move through the socket
    socketService.makeMove(row, col);
  };
  
  // Handle leaving the game
  const handleLeaveGame = () => {
    navigate('/play');
  };

  // Determine which board to show based on turn
  const shouldShowPlayerBoard = gameState === GameState.SETUP || !playerTurn;
  const shouldShowOpponentBoard = gameState === GameState.SETUP || playerTurn;
  
  // Text to show based on game state
  const getTurnText = () => {
    if (!isOpponentConnected) {
      return "Opponent Disconnected";
    }
    
    if (gameState === GameState.SETUP) {
      return "Position Your Ships";
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
    } else if (playerTurn) {
      return "Click on the opponent's board to attack a position";
    } else {
      return "Waiting for opponent to make a move...";
    }
  };
  
  return (
    <Container maxWidth="lg" sx={{ mb: 4 }}>
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
        
        {/* Game content with boards and chat */}
        <Grid container spacing={3}>
          {/* Boards section */}
          <Grid item xs={12} md={8}>
            {/* Setup phase - Ship placement */}
            {gameState === GameState.SETUP && (
              <ShipPlacementBoard 
                ships={ships}
                onShipsPlaced={handleShipsPlaced}
                onReady={handlePlayerReady}
                isReady={playerReady}
              />
            )}
            
            {/* Playing phase - show only the active board */}
            {gameState === GameState.PLAYING && (
              <Box sx={{ position: 'relative', minHeight: { xs: '400px', md: '600px' } }}>
                <Fade in={shouldShowPlayerBoard} timeout={500}>
                  <Box sx={{ 
                    position: shouldShowOpponentBoard ? 'absolute' : 'static', 
                    top: 0, 
                    left: 0, 
                    width: '100%',
                    display: shouldShowPlayerBoard ? 'block' : 'none'
                  }}>
                    <GameBoard 
                      size={10}
                      isPlayerBoard={true}
                      editable={false}
                      boardState={playerBoard}
                      isActive={true}
                    />
                  </Box>
                </Fade>
                
                <Fade in={shouldShowOpponentBoard} timeout={500}>
                  <Box sx={{ 
                    position: shouldShowPlayerBoard ? 'absolute' : 'static',
                    top: 0, 
                    left: 0, 
                    width: '100%',
                    display: shouldShowOpponentBoard ? 'block' : 'none'
                  }}>
                    <GameBoard 
                      size={10}
                      isPlayerBoard={false}
                      boardState={opponentBoard}
                      onCellClick={handleAttackOpponent}
                      isActive={playerTurn}
                    />
                  </Box>
                </Fade>
              </Box>
            )}
          </Grid>
          
          {/* Chat section */}
          <Grid item xs={12} md={4}>
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
    </Container>
  );
};

export default Game; 