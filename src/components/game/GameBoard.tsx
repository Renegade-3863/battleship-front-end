import React, { useState } from 'react';
import { Box, Typography, Paper } from '@mui/material';

// Define cell states
export enum CellState {
  EMPTY = 'empty',
  SHIP = 'ship',
  HIT = 'hit',
  MISS = 'miss',
  SUNK = 'sunk'
}

// Define props for the component
interface GameBoardProps {
  size: number;
  isPlayerBoard?: boolean;
  editable?: boolean;
  boardState?: CellState[][];
  onCellClick?: (row: number, col: number) => void;
  isActive?: boolean;
}

const GameBoard = ({
  size = 10,
  isPlayerBoard = true,
  editable = false,
  boardState: externalBoardState,
  onCellClick,
  isActive = true
}: GameBoardProps) => {
  // Create default board state if not provided
  const defaultBoardState = Array(size)
    .fill(null)
    .map(() => Array(size).fill(CellState.EMPTY));

  // If boardState is provided externally, use it; otherwise, use internal state
  const [internalBoardState, setInternalBoardState] = useState<CellState[][]>(defaultBoardState);
  const boardState = externalBoardState || internalBoardState;

  // Handle cell click
  const handleCellClick = (row: number, col: number) => {
    // If there's an external handler, use that
    if (onCellClick) {
      onCellClick(row, col);
      return;
    }

    // For demo purposes, toggle between empty and ship if editable
    if (editable && isPlayerBoard) {
      setInternalBoardState(prevState => {
        const newState = [...prevState.map(row => [...row])];
        newState[row][col] = prevState[row][col] === CellState.EMPTY ? CellState.SHIP : CellState.EMPTY;
        return newState;
      });
    }
  };

  // Get appropriate cell content based on state
  const getCellContent = (state: CellState, isPlayerBoard: boolean) => {
    switch (state) {
      case CellState.SHIP:
        return isPlayerBoard ? (
          <Box sx={{ 
            width: '100%', 
            height: '100%', 
            borderRadius: '2px',
            background: 'linear-gradient(135deg, #5c9ce6 0%, #4285f4 100%)',
            boxShadow: 'inset 0 1px 3px rgba(255,255,255,0.3), 0 1px 2px rgba(0,0,0,0.2)'
          }} />
        ) : null;
      case CellState.HIT:
        return (
          <Box sx={{ 
            width: '80%', 
            height: '80%', 
            borderRadius: '50%', 
            background: 'radial-gradient(circle, #ff5252 0%, #d32f2f 70%, #b71c1c 100%)',
            boxShadow: '0 0 10px #ff6659, inset 0 0 4px rgba(0,0,0,0.3)'
          }} />
        );
      case CellState.MISS:
        return (
          <Box sx={{ 
            width: '80%', 
            height: '80%', 
            borderRadius: '50%',
            background: 'radial-gradient(circle, #ffffff 0%, #e0e0e0 70%, #bdbdbd 100%)',
            boxShadow: '0 0 6px rgba(255,255,255,0.5), inset 0 0 4px rgba(0,0,0,0.1)'
          }} />
        );
      case CellState.SUNK:
        return (
          <Box sx={{ 
            width: '100%', 
            height: '100%',
            background: 'repeating-linear-gradient(45deg, #3e2723, #3e2723 10px, #5d4037 10px, #5d4037 20px)',
            boxShadow: 'inset 0 0 8px rgba(0,0,0,0.5)',
            position: 'relative',
            '&::after': {
              content: '""',
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: 'rgba(0,0,0,0.2)',
              mixBlendMode: 'overlay'
            }
          }} />
        );
      default:
        return null;
    }
  };

  // Get cell base styles
  const getCellBaseStyles = (state: CellState, isPlayerBoard: boolean, row: number, col: number) => {
    const baseStyles = {
      aspectRatio: '1/1',
      width: '100%',
      height: '100%',
      background: state === CellState.EMPTY 
        ? 'linear-gradient(135deg, rgba(0, 40, 80, 0.4) 0%, rgba(0, 20, 60, 0.5) 100%)' 
        : undefined,
      border: '1px solid rgba(120, 200, 255, 0.25)',
      borderRadius: '3px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      transition: 'all 0.2s ease',
      position: 'relative',
      cursor: isActive && (!isPlayerBoard || editable) ? 'pointer' : 'default',
      boxShadow: 'inset 0 0 2px rgba(120, 200, 255, 0.15)',
    };

    // Add hover effect only if board is active and cell is clickable
    if (isActive && (!isPlayerBoard || editable)) {
      return {
        ...baseStyles,
        '&:hover': {
          background: 'linear-gradient(135deg, rgba(72, 145, 255, 0.4) 0%, rgba(50, 100, 255, 0.5) 100%)',
          transform: 'scale(1.05)',
          zIndex: 2,
          boxShadow: '0 0 6px rgba(72, 145, 255, 0.6), inset 0 0 8px rgba(72, 145, 255, 0.4)'
        }
      };
    }
    
    return baseStyles;
  };

  return (
    <Box sx={{ 
      opacity: isActive ? 1 : 0.7,
      transition: 'opacity 0.3s ease',
      width: '100%'
    }}>
      <Typography 
        variant="h6" 
        gutterBottom 
        align="center" 
        sx={{ 
          fontWeight: 'bold',
          color: isActive ? 'primary.main' : 'text.secondary',
          textShadow: isActive ? '0 0 10px rgba(64, 128, 255, 0.4)' : 'none'
        }}
      >
        {isPlayerBoard ? 'Your Board' : 'Opponent\'s Board'}
      </Typography>
      
      <Paper 
        elevation={6} 
        sx={{ 
          p: { xs: 1, sm: 2 }, 
          backgroundColor: 'rgba(0, 10, 30, 0.9)',
          borderRadius: '8px',
          overflow: 'hidden',
          border: isActive ? '2px solid rgba(72, 145, 255, 0.6)' : '2px solid transparent',
          boxShadow: isActive 
            ? '0 4px 20px rgba(0, 30, 60, 0.6), inset 0 0 20px rgba(0, 20, 40, 0.6), 0 0 8px rgba(72, 145, 255, 0.4)'
            : '0 4px 20px rgba(0, 30, 60, 0.4), inset 0 0 20px rgba(0, 20, 40, 0.4)',
          width: '100%',
          position: 'relative',
          '&::before': {
            content: '""',
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundImage: 'radial-gradient(circle at 50% 50%, rgba(120, 200, 255, 0.08) 0%, transparent 70%)',
            pointerEvents: 'none'
          }
        }}
      >
        {/* Column Headers */}
        <Box sx={{ 
          display: 'flex', 
          mb: 1, 
          pl: '40px', 
          pr: 1, 
          borderBottom: '1px solid rgba(120, 200, 255, 0.1)', 
          pb: 0.5 
        }}>
          {Array(size).fill(null).map((_, index) => (
            <Box 
              key={`col-${index}`}
              sx={{ 
                flex: '1 0 auto',
                textAlign: 'center',
                width: { xs: '36px', sm: '42px', md: '48px' },
                maxWidth: { xs: '36px', sm: '42px', md: '48px' },
              }}
            >
              <Typography 
                variant="body2" 
                sx={{ 
                  color: 'rgba(255, 255, 255, 0.9)',
                  fontWeight: 'bold',
                  textShadow: '0 0 4px rgba(120, 200, 255, 0.6)'
                }}
              >
                {String.fromCharCode(65 + index)}
              </Typography>
            </Box>
          ))}
        </Box>
        
        {/* Board Rows */}
        <Box sx={{ 
          display: 'flex',
          flexDirection: 'column',
          gap: { xs: 1, sm: 1.2 }
        }}>
          {Array(size).fill(null).map((_, rowIndex) => (
            <Box 
              key={`row-${rowIndex}`} 
              sx={{ 
                display: 'flex', 
                alignItems: 'center',
                pl: 1,
                pr: 1
              }}
            >
              {/* Row Headers */}
              <Box
                sx={{ 
                  width: '40px',
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center',
                  pr: 1
                }}
              >
                <Typography 
                  variant="body2" 
                  sx={{ 
                    color: 'rgba(255, 255, 255, 0.9)',
                    fontWeight: 'bold',
                    textShadow: '0 0 4px rgba(120, 200, 255, 0.6)'
                  }}
                >
                  {rowIndex + 1}
                </Typography>
              </Box>
              
              {/* Row Cells */}
              <Box sx={{ 
                display: 'flex', 
                flex: 1, 
                gap: { xs: 1, sm: 1.2 } 
              }}>
                {Array(size).fill(null).map((_, colIndex) => (
                  <Box 
                    key={`cell-${rowIndex}-${colIndex}`}
                    sx={{ 
                      flex: '1 0 auto',
                      width: { xs: '36px', sm: '42px', md: '48px' },
                      height: { xs: '36px', sm: '42px', md: '48px' },
                      maxWidth: { xs: '36px', sm: '42px', md: '48px' },
                    }}
                  >
                    <Box 
                      sx={getCellBaseStyles(boardState[rowIndex][colIndex], isPlayerBoard, rowIndex, colIndex)}
                      onClick={() => isActive && handleCellClick(rowIndex, colIndex)}
                    >
                      {getCellContent(boardState[rowIndex][colIndex], isPlayerBoard)}
                    </Box>
                  </Box>
                ))}
              </Box>
            </Box>
          ))}
        </Box>
      </Paper>
    </Box>
  );
};

export default GameBoard; 