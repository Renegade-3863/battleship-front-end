import React, { useState, useEffect } from 'react';
import { Box, Typography, Button } from '@mui/material';
import { Ship } from '../../models/Ship';
import { CellState } from './GameBoard';
import CanvasGameBoard from './CanvasGameBoard';

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
  const [isAllShipsPlaced, setIsAllShipsPlaced] = useState(false);

  // Update when ships change
  useEffect(() => {
    // Check if all ships are placed
    const allPlaced = ships.every(ship => ship.position !== undefined);
    setIsAllShipsPlaced(allPlaced);
    
    // Notify parent component about ship changes
    onShipsPlaced(ships);
  }, [ships]);

  // Handle ship placement from CanvasGameBoard
  const handleShipPlaced = (updatedShips: Ship[]) => {
    console.log('Ship placement updated in ShipPlacementBoard');
    setShips(updatedShips);
  };

  // Handle ready event from CanvasGameBoard
  const handleReady = () => {
    console.log('Ready event received in ShipPlacementBoard, passing to Game.tsx');
    if (onReady) {
      onReady();
    } else {
      console.error('ShipPlacementBoard: onReady callback is not defined!');
    }
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
      
      <CanvasGameBoard
        size={10}
        isPlayerBoard={true}
        editable={true}
        ships={ships}
        onShipPlaced={handleShipPlaced}
        onReady={handleReady}
        isReady={isReady}
        isActive={true}
      />
    </Box>
  );
};

export default ShipPlacementBoard; 