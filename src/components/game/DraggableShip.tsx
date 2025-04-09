import React, { useState } from 'react';
import { Box, IconButton } from '@mui/material';
import RotateRightIcon from '@mui/icons-material/RotateRight';
import { Ship, Orientation } from '../../models/Ship';

interface DraggableShipProps {
  ship: Ship;
  cellSize: number;
  onDragStart: (shipId: string) => void;
  onDragEnd: (shipId: string, row: number, col: number) => void;
  onRotate: (shipId: string) => void;
  boardRef: React.RefObject<HTMLDivElement>;
  isPlaced: boolean;
}

const DraggableShip: React.FC<DraggableShipProps> = ({
  ship,
  cellSize,
  onDragStart,
  onDragEnd,
  onRotate,
  boardRef,
  isPlaced
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0 });

  // Calculate ship width and height based on orientation
  const width = ship.orientation === Orientation.HORIZONTAL ? cellSize * ship.size : cellSize;
  const height = ship.orientation === Orientation.VERTICAL ? cellSize * ship.size : cellSize;

  // Handle drag start
  const handleDragStart = (e: React.MouseEvent) => {
    if (!isPlaced) return;
    
    e.preventDefault();
    setIsDragging(true);
    onDragStart(ship.id);
    
    // Store the initial mouse position
    setPosition({
      x: e.clientX,
      y: e.clientY
    });
  };

  // Handle mouse move during drag
  const handleMouseMove = (e: MouseEvent) => {
    if (!isDragging) return;
    
    const deltaX = e.clientX - position.x;
    const deltaY = e.clientY - position.y;
    
    setPosition({
      x: e.clientX,
      y: e.clientY
    });
    
    // Get current ship position on the board
    if (ship.position && boardRef.current) {
      const boardRect = boardRef.current.getBoundingClientRect();
      const row = Math.floor((e.clientY - boardRect.top) / cellSize);
      const col = Math.floor((e.clientX - boardRect.left) / cellSize);
      
      // Update ship position if within board bounds
      if (row >= 0 && row < 10 && col >= 0 && col < 10) {
        onDragEnd(ship.id, row, col);
      }
    }
  };

  // Handle drag end
  const handleDragEnd = () => {
    setIsDragging(false);
  };

  // Add/remove global event listeners for drag
  React.useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleDragEnd);
    } else {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleDragEnd);
    }
    
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleDragEnd);
    };
  }, [isDragging, position]);

  // Handle ship rotation
  const handleRotate = (e: React.MouseEvent) => {
    e.stopPropagation();
    onRotate(ship.id);
  };

  // Calculate position on the board if placed
  const getShipStyle = () => {
    if (!ship.position || !isPlaced) {
      return {};
    }
    
    return {
      position: 'absolute' as const,
      top: `${ship.position.row * cellSize}px`,
      left: `${ship.position.col * cellSize}px`,
      width: `${width}px`,
      height: `${height}px`,
      cursor: 'move',
      zIndex: isDragging ? 1000 : 10
    };
  };

  return (
    <Box
      sx={{
        ...getShipStyle(),
        backgroundColor: '#4285f4',
        borderRadius: '4px',
        boxShadow: isDragging 
          ? '0 0 15px rgba(66, 133, 244, 0.8)' 
          : '0 2px 5px rgba(0, 0, 0, 0.2)',
        transition: isDragging ? 'none' : 'all 0.2s ease',
        '&:hover': {
          backgroundColor: '#5c9ce6',
          boxShadow: '0 0 10px rgba(92, 156, 230, 0.6)'
        },
        display: 'flex',
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        touchAction: 'none' // Prevent touch scrolling during drag
      }}
      onMouseDown={handleDragStart}
      onTouchStart={() => {}} // Add touch support if needed
    >
      {isPlaced && (
        <IconButton
          size="small"
          onClick={handleRotate}
          sx={{
            backgroundColor: 'rgba(255, 255, 255, 0.3)',
            color: 'white',
            '&:hover': {
              backgroundColor: 'rgba(255, 255, 255, 0.5)'
            },
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            zIndex: 1001,
            width: '24px',
            height: '24px'
          }}
        >
          <RotateRightIcon fontSize="small" />
        </IconButton>
      )}
    </Box>
  );
};

export default DraggableShip; 