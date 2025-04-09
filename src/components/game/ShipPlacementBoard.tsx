import React, { useState, useRef, useEffect } from 'react';
import { Box, Typography, Paper, Button } from '@mui/material';
import { Ship, Orientation } from '../../models/Ship';
import { CellState } from './GameBoard';
import DraggableShip from './DraggableShip';

interface ShipPlacementBoardProps {
  ships: Ship[];
  onShipsPlaced: (ships: Ship[]) => void;
  onReady: () => void;
  isReady: boolean;
}

const ShipPlacementBoard: React.FC<ShipPlacementBoardProps> = ({
  ships: initialShips,
  onShipsPlaced,
  onReady,
  isReady
}) => {
  const [ships, setShips] = useState<Ship[]>(initialShips);
  const [boardState, setBoardState] = useState<CellState[][]>(
    Array(10).fill(null).map(() => Array(10).fill(CellState.EMPTY))
  );
  const [draggingShipId, setDraggingShipId] = useState<string | null>(null);
  const [isAllShipsPlaced, setIsAllShipsPlaced] = useState(false);
  const boardRef = useRef<HTMLDivElement>(null);
  const cellSize = 48; // Match this with your GameBoard cell size

  // Update board state when ships change
  useEffect(() => {
    updateBoardState();
    
    // Check if all ships are placed
    const allPlaced = ships.every(ship => ship.position !== undefined);
    setIsAllShipsPlaced(allPlaced);
    
    // Notify parent component about ship changes
    onShipsPlaced(ships);
  }, [ships]);

  // Update the board state based on ship positions
  const updateBoardState = () => {
    const newBoardState = Array(10)
      .fill(null)
      .map(() => Array(10).fill(CellState.EMPTY));
    
    ships.forEach(ship => {
      if (ship.position) {
        const { row, col } = ship.position;
        const { orientation, size } = ship;
        
        for (let i = 0; i < size; i++) {
          if (orientation === Orientation.HORIZONTAL) {
            if (col + i < 10) {
              newBoardState[row][col + i] = CellState.SHIP;
            }
          } else {
            if (row + i < 10) {
              newBoardState[row + i][col] = CellState.SHIP;
            }
          }
        }
      }
    });
    
    setBoardState(newBoardState);
  };

  // Handle drag start
  const handleDragStart = (shipId: string) => {
    setDraggingShipId(shipId);
  };

  // Handle drag end
  const handleDragEnd = (shipId: string, row: number, col: number) => {
    setShips(prevShips => {
      return prevShips.map(ship => {
        if (ship.id === shipId) {
          // Check if the new position is valid
          if (isValidPosition(ship, row, col)) {
            return {
              ...ship,
              position: { row, col }
            };
          }
        }
        return ship;
      });
    });
    setDraggingShipId(null);
  };

  // Handle ship rotation
  const handleRotate = (shipId: string) => {
    setShips(prevShips => {
      return prevShips.map(ship => {
        if (ship.id === shipId) {
          const newOrientation = ship.orientation === Orientation.HORIZONTAL
            ? Orientation.VERTICAL
            : Orientation.HORIZONTAL;
          
          // Check if rotation is valid
          if (ship.position && isValidRotation(ship, ship.position.row, ship.position.col, newOrientation)) {
            return {
              ...ship,
              orientation: newOrientation
            };
          }
        }
        return ship;
      });
    });
  };

  // Check if a position is valid for a ship
  const isValidPosition = (
    ship: Ship,
    row: number,
    col: number,
    orientation = ship.orientation
  ): boolean => {
    // Check if ship is within board bounds
    if (orientation === Orientation.HORIZONTAL) {
      if (col + ship.size > 10) return false;
    } else {
      if (row + ship.size > 10) return false;
    }
    
    // Check if ship overlaps with other ships
    for (let i = 0; i < ship.size; i++) {
      let checkRow = row;
      let checkCol = col;
      
      if (orientation === Orientation.HORIZONTAL) {
        checkCol = col + i;
      } else {
        checkRow = row + i;
      }
      
      // Check if any other ship occupies this cell
      const overlapShip = ships.find(otherShip => {
        if (otherShip.id === ship.id || !otherShip.position) return false;
        
        const { position, orientation: otherOrientation, size } = otherShip;
        
        for (let j = 0; j < size; j++) {
          let otherRow = position.row;
          let otherCol = position.col;
          
          if (otherOrientation === Orientation.HORIZONTAL) {
            otherCol = position.col + j;
          } else {
            otherRow = position.row + j;
          }
          
          if (otherRow === checkRow && otherCol === checkCol) {
            return true;
          }
        }
        
        return false;
      });
      
      if (overlapShip) return false;
    }
    
    return true;
  };

  // Check if a rotation is valid
  const isValidRotation = (
    ship: Ship,
    row: number,
    col: number,
    newOrientation: Orientation
  ): boolean => {
    return isValidPosition(
      { ...ship, orientation: newOrientation },
      row,
      col,
      newOrientation
    );
  };

  // Generate column headers (A-J)
  const renderColumnHeaders = () => {
    return Array(10).fill(null).map((_, index) => (
      <Box 
        key={`col-${index}`}
        sx={{ 
          flex: '1 0 auto',
          textAlign: 'center',
          width: `${cellSize}px`,
          maxWidth: `${cellSize}px`,
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
    ));
  };

  // Generate row headers (1-10)
  const renderRowHeaders = (rowIndex: number) => {
    return (
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
    );
  };

  // Generate cells for a row
  const renderCells = (rowIndex: number) => {
    return Array(10).fill(null).map((_, colIndex) => (
      <Box 
        key={`cell-${rowIndex}-${colIndex}`}
        sx={{ 
          flex: '1 0 auto',
          width: `${cellSize}px`,
          height: `${cellSize}px`,
          maxWidth: `${cellSize}px`,
        }}
      >
        <Box 
          sx={{
            aspectRatio: '1/1',
            width: '100%',
            height: '100%',
            background: boardState[rowIndex][colIndex] === CellState.EMPTY 
              ? 'linear-gradient(135deg, rgba(0, 40, 80, 0.4) 0%, rgba(0, 20, 60, 0.5) 100%)' 
              : undefined,
            border: '1px solid rgba(120, 200, 255, 0.25)',
            borderRadius: '3px',
            boxShadow: 'inset 0 0 2px rgba(120, 200, 255, 0.15)',
          }}
        />
      </Box>
    ));
  };

  return (
    <Box sx={{ width: '100%' }}>
      <Typography 
        variant="h6" 
        gutterBottom 
        align="center" 
        sx={{ 
          fontWeight: 'bold',
          color: 'primary.main',
          textShadow: '0 0 10px rgba(64, 128, 255, 0.4)'
        }}
      >
        Position Your Ships
      </Typography>
      
      <Typography variant="body2" align="center" sx={{ mb: 2 }}>
        Drag to position ships. Click the button to rotate.
      </Typography>
      
      <Paper 
        elevation={6} 
        sx={{ 
          p: { xs: 1, sm: 2 }, 
          backgroundColor: 'rgba(0, 10, 30, 0.9)',
          borderRadius: '8px',
          overflow: 'hidden',
          border: '2px solid rgba(72, 145, 255, 0.6)',
          boxShadow: '0 4px 20px rgba(0, 30, 60, 0.6), inset 0 0 20px rgba(0, 20, 40, 0.6), 0 0 8px rgba(72, 145, 255, 0.4)',
          width: '100%',
          position: 'relative',
        }}
      >
        <Box ref={boardRef} sx={{ position: 'relative' }}>
          {/* Column Headers */}
          <Box sx={{ 
            display: 'flex', 
            mb: 1, 
            pl: '40px', 
            pr: 1, 
            borderBottom: '1px solid rgba(120, 200, 255, 0.1)', 
            pb: 0.5 
          }}>
            {renderColumnHeaders()}
          </Box>
          
          {/* Board Rows */}
          <Box sx={{ 
            display: 'flex',
            flexDirection: 'column',
            gap: 1
          }}>
            {Array(10).fill(null).map((_, rowIndex) => (
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
                {renderRowHeaders(rowIndex)}
                
                {/* Row Cells */}
                <Box sx={{ 
                  display: 'flex', 
                  flex: 1, 
                  gap: 1
                }}>
                  {renderCells(rowIndex)}
                </Box>
              </Box>
            ))}
          </Box>
          
          {/* Draggable Ships */}
          {ships.map(ship => (
            <DraggableShip
              key={ship.id}
              ship={ship}
              cellSize={cellSize}
              onDragStart={handleDragStart}
              onDragEnd={handleDragEnd}
              onRotate={handleRotate}
              boardRef={boardRef}
              isPlaced={!isReady}
            />
          ))}
        </Box>
      </Paper>
      
      <Box sx={{ mt: 3, display: 'flex', justifyContent: 'center' }}>
        <Button
          variant="contained"
          color="primary"
          size="large"
          disabled={!isAllShipsPlaced || isReady}
          onClick={onReady}
          sx={{ py: 1.5, px: 4, fontWeight: 'bold' }}
        >
          {isReady ? 'Waiting for opponent...' : 'Ready to Play'}
        </Button>
      </Box>
    </Box>
  );
};

export default ShipPlacementBoard; 