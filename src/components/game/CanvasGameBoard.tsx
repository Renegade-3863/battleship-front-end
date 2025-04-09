import React, { useRef, useState, useEffect } from "react";
import Sketch from "react-p5";
import p5Types from "p5";
import { Ship, Orientation } from '../../models/Ship';
import { CellState } from './GameBoard';

// Sound assets URLs
const SOUNDS = {
  HIT: '/sounds/explosion.mp3',
  MISS: '/sounds/splash.mp3',
  PLACE: '/sounds/ship_place.mp3',
  ROTATE: '/sounds/ship_rotate.mp3'
};

interface AnimationEffect {
  row: number;
  col: number;
  type: 'hit' | 'miss';
  startTime: number;
  duration: number;
}

interface CanvasGameBoardProps {
  size: number;
  isPlayerBoard?: boolean;
  editable?: boolean;
  boardState?: CellState[][];
  ships?: Ship[];
  onCellClick?: (row: number, col: number) => void;
  onShipPlaced?: (updatedShips: Ship[]) => void;
  onReady?: () => void;
  isReady?: boolean;
  isActive?: boolean;
  onAnimationComplete?: (row: number, col: number, type: 'hit' | 'miss') => void;
}

// Wave point interface for ocean background
interface WavePoint {
  x: number;
  y: number;
  amplitude: number;
  speed: number;
}

const CanvasGameBoard: React.FC<CanvasGameBoardProps> = ({
  size = 10,
  isPlayerBoard = true,
  editable = false,
  boardState: externalBoardState,
  ships: initialShips = [],
  onCellClick,
  onShipPlaced,
  onReady,
  isReady = false,
  isActive = true,
  onAnimationComplete
}) => {
  // State
  const [ships, setShips] = useState<Ship[]>(initialShips);
  const [boardState, setBoardState] = useState<CellState[][]>(
    externalBoardState || Array(size).fill(null).map(() => Array(size).fill(CellState.EMPTY))
  );
  const [prevBoardState, setPrevBoardState] = useState<CellState[][]>(
    externalBoardState || Array(size).fill(null).map(() => Array(size).fill(CellState.EMPTY))
  );
  const [draggingShipId, setDraggingShipId] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [cellSize, setCellSize] = useState(0);
  const [canvasWidth, setCanvasWidth] = useState(0);
  const [canvasHeight, setCanvasHeight] = useState(0);
  const [hoverCell, setHoverCell] = useState<{ row: number; col: number } | null>(null);
  const [activeAnimations, setActiveAnimations] = useState<AnimationEffect[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);
  const p5Ref = useRef<p5Types | null>(null);
  const wavePointsRef = useRef<WavePoint[]>([]);
  const timeRef = useRef<number>(0);
  const compassImageRef = useRef<p5Types.Image | null>(null);
  
  // Sound effect references
  const soundsRef = useRef<{
    hit?: p5Types.SoundFile;
    miss?: p5Types.SoundFile;
    place?: p5Types.SoundFile;
    rotate?: p5Types.SoundFile;
  }>({});

  // Calculate board dimensions based on container size
  useEffect(() => {
    if (containerRef.current) {
      const updateSize = () => {
        const width = containerRef.current?.clientWidth || 500;
        // Increase the cell size for a larger game board
        // Use different sizing for setup vs play modes
        const baseSize = editable ? 48 : 60; // Larger cells for playing mode
        
        // Calculate cell size based on container width, but with a minimum
        const cellSizeValue = Math.max(
          Math.floor((width - 60) / size),
          baseSize
        );
        
        const canvasW = cellSizeValue * size + 60; // 60px for row/column headers
        const canvasH = cellSizeValue * size + 60;
        
        setCellSize(cellSizeValue);
        setCanvasWidth(canvasW);
        setCanvasHeight(canvasH);
        
        // Initialize wave points for ocean background
        initWavePoints(canvasW);
      };
      
      updateSize();
      window.addEventListener('resize', updateSize);
      
      return () => {
        window.removeEventListener('resize', updateSize);
      };
    }
  }, [size, editable]);
  
  // Initialize wave points for ocean background
  const initWavePoints = (width: number) => {
    const points: WavePoint[] = [];
    const numPoints = 12; // Number of control points
    
    for (let i = 0; i < numPoints; i++) {
      points.push({
        x: (i / (numPoints - 1)) * width,
        y: 0,
        amplitude: Math.random() * 5 + 3,
        speed: Math.random() * 0.02 + 0.01
      });
    }
    
    wavePointsRef.current = points;
  };
  
  // Update board state from ships
  useEffect(() => {
    if (editable && isPlayerBoard) {
      updateBoardState();
    }
  }, [ships, editable, isPlayerBoard]);
  
  // Track board state changes to trigger animations
  useEffect(() => {
    if (externalBoardState && p5Ref.current) {
      // Compare previous and current board state to find new hits/misses
      for (let row = 0; row < size; row++) {
        for (let col = 0; col < size; col++) {
          const prevState = prevBoardState[row][col];
          const newState = externalBoardState[row][col];
          
          // If cell state changed to hit or miss, add an animation
          if ((prevState === CellState.EMPTY || prevState === CellState.SHIP) && 
              (newState === CellState.HIT || newState === CellState.MISS)) {
            const newAnimation: AnimationEffect = {
              row,
              col,
              type: newState === CellState.HIT ? 'hit' : 'miss',
              startTime: p5Ref.current.millis(),
              duration: 1000 // 1 second animation
            };
            
            setActiveAnimations(prev => [...prev, newAnimation]);
            
            // Play sound effect
            if (newState === CellState.HIT && soundsRef.current.hit) {
              soundsRef.current.hit.play();
            } else if (newState === CellState.MISS && soundsRef.current.miss) {
              soundsRef.current.miss.play();
            }
          }
        }
      }
      
      setPrevBoardState(externalBoardState);
    }
  }, [externalBoardState]);
  
  // Update board state based on ship positions
  const updateBoardState = () => {
    const newBoardState = Array(size)
      .fill(null)
      .map(() => Array(size).fill(CellState.EMPTY));
    
    ships.forEach(ship => {
      if (ship.position) {
        const { row, col } = ship.position;
        const { orientation, size: shipSize } = ship;
        
        for (let i = 0; i < shipSize; i++) {
          if (orientation === Orientation.HORIZONTAL) {
            if (col + i < size) {
              newBoardState[row][col + i] = CellState.SHIP;
            }
          } else {
            if (row + i < size) {
              newBoardState[row + i][col] = CellState.SHIP;
            }
          }
        }
      }
    });
    
    setBoardState(newBoardState);
    
    // Notify parent component
    if (onShipPlaced) {
      onShipPlaced(ships);
    }
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
      if (col + ship.size > size) return false;
    } else {
      if (row + ship.size > size) return false;
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
        
        const { position, orientation: otherOrientation, size: otherSize } = otherShip;
        
        for (let j = 0; j < otherSize; j++) {
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
  
  // Rotate a ship
  const rotateShip = (shipId: string) => {
    if (!editable || isReady) return;
    
    setShips(prevShips => {
      const updatedShips = prevShips.map(ship => {
        if (ship.id === shipId) {
          const newOrientation = ship.orientation === Orientation.HORIZONTAL
            ? Orientation.VERTICAL
            : Orientation.HORIZONTAL;
          
          // Check if rotation is valid
          if (ship.position && isValidPosition(ship, ship.position.row, ship.position.col, newOrientation)) {
            // Play rotation sound
            if (soundsRef.current.rotate) {
              soundsRef.current.rotate.play();
            }
            
            return {
              ...ship,
              orientation: newOrientation
            };
          }
        }
        return ship;
      });
      
      return updatedShips;
    });
  };
  
  // P5.js setup function
  const setup = (p5: p5Types, canvasParentRef: Element) => {
    p5.createCanvas(canvasWidth, canvasHeight).parent(canvasParentRef);
    p5.textAlign(p5.CENTER, p5.CENTER);
    p5Ref.current = p5;
    
    // Generate compass rose
    generateCompassRose(p5);
    
    // Load sound effects
    try {
      if (p5.soundFormats) {
        p5.soundFormats('mp3');
        soundsRef.current = {
          hit: p5.loadSound(SOUNDS.HIT),
          miss: p5.loadSound(SOUNDS.MISS),
          place: p5.loadSound(SOUNDS.PLACE),
          rotate: p5.loadSound(SOUNDS.ROTATE)
        };
      }
    } catch (error) {
      console.warn('Failed to load sounds:', error);
    }
  };
  
  // Generate compass rose procedurally
  const generateCompassRose = (p5: p5Types) => {
    // Create an off-screen graphics buffer to draw the compass
    const size = 250;
    const buffer = p5.createGraphics(size, size);
    buffer.clear();
    
    // Draw compass rose
    buffer.translate(size/2, size/2);
    buffer.noStroke();
    
    // Outer rim
    buffer.fill(60, 120, 190, 30);
    buffer.ellipse(0, 0, size * 0.95);
    
    // Inner disk
    buffer.fill(60, 120, 190, 10);
    buffer.ellipse(0, 0, size * 0.85);
    
    // Draw the main compass points
    buffer.stroke(200, 220, 255, 100);
    buffer.strokeWeight(1.5);
    
    // N, E, S, W markers
    const directions = ["N", "E", "S", "W"];
    const mainLength = size * 0.4;
    buffer.textSize(16);
    buffer.textAlign(buffer.CENTER, buffer.CENTER);
    buffer.noStroke();
    buffer.fill(200, 220, 255, 160);
    
    for (let i = 0; i < 4; i++) {
      const angle = i * p5.PI / 2;
      
      // Draw line
      buffer.stroke(200, 220, 255, 100);
      buffer.line(0, 0, mainLength * p5.cos(angle), mainLength * p5.sin(angle));
      
      // Draw direction label
      buffer.noStroke();
      const textX = (mainLength + 20) * p5.cos(angle);
      const textY = (mainLength + 20) * p5.sin(angle);
      buffer.text(directions[i], textX, textY);
    }
    
    // Intercardinal directions (NE, SE, SW, NW)
    const intercardinal = ["NE", "SE", "SW", "NW"];
    const interLength = size * 0.35;
    buffer.textSize(12);
    
    for (let i = 0; i < 4; i++) {
      const angle = i * p5.PI / 2 + p5.PI / 4;
      
      // Draw line
      buffer.stroke(200, 220, 255, 70);
      buffer.strokeWeight(1);
      buffer.line(0, 0, interLength * p5.cos(angle), interLength * p5.sin(angle));
      
      // Draw direction label
      buffer.noStroke();
      const textX = (interLength + 15) * p5.cos(angle);
      const textY = (interLength + 15) * p5.sin(angle);
      buffer.text(intercardinal[i], textX, textY);
    }
    
    // Draw minor ticks
    buffer.stroke(200, 220, 255, 50);
    buffer.strokeWeight(0.5);
    const minorLength = size * 0.3;
    
    for (let i = 0; i < 16; i++) {
      const angle = i * p5.PI / 8;
      // Skip the main and intercardinal directions
      if (i % 2 === 0) continue;
      
      buffer.line(0, 0, minorLength * p5.cos(angle), minorLength * p5.sin(angle));
    }
    
    // Decorative inner circle
    buffer.noFill();
    buffer.stroke(200, 220, 255, 40);
    buffer.ellipse(0, 0, size * 0.6);
    buffer.ellipse(0, 0, size * 0.4);
    buffer.ellipse(0, 0, size * 0.2);
    
    // Central dot
    buffer.fill(200, 220, 255, 60);
    buffer.noStroke();
    buffer.ellipse(0, 0, 6);
    
    // Store the compass as an image
    compassImageRef.current = buffer;
  };
  
  // P5.js draw function
  const draw = (p5: p5Types) => {
    // Update time reference (for animations)
    timeRef.current += 0.01;
    
    // Background
    p5.background(0, 10, 30);
    
    // Draw animated ocean background
    drawOceanBackground(p5);
    
    // Draw compass rose
    drawCompassRose(p5);
    
    // Draw board
    drawBoard(p5);
    
    // Draw ships if player board
    if (isPlayerBoard) {
      drawShips(p5);
    }
    
    // Draw animations
    drawAnimations(p5);
    
    // Draw grid overlay
    drawGrid(p5);
    
    // Draw targeting cursor
    drawTargetingCursor(p5);
    
    // Draw column headers (A-J)
    drawColumnHeaders(p5);
    
    // Draw row headers (1-10)
    drawRowHeaders(p5);
  };
  
  // Draw compass rose overlay
  const drawCompassRose = (p5: p5Types) => {
    if (!compassImageRef.current) return;
    
    // Position compass in the corner
    const gridStartX = 40; // Start after row headers
    const gridStartY = 40; // Start after column headers
    const gridSize = cellSize * size;
    const compassSize = gridSize * 0.35;
    
    p5.push();
    p5.translate(gridStartX + gridSize - compassSize * 0.4, gridStartY + gridSize - compassSize * 0.4);
    p5.rotate(timeRef.current * 0.1); // Slowly rotate the compass
    p5.imageMode(p5.CENTER);
    p5.image(compassImageRef.current, 0, 0, compassSize, compassSize);
    p5.pop();
  };
  
  // Draw animated ocean background
  const drawOceanBackground = (p5: p5Types) => {
    const gridStartX = 40; // Start after row headers
    const gridStartY = 40; // Start after column headers
    const gridWidth = cellSize * size;
    const gridHeight = cellSize * size;
    
    // Update wave point positions
    wavePointsRef.current.forEach(point => {
      point.y = Math.sin(timeRef.current * point.speed * 10 + point.x * 0.1) * point.amplitude;
    });
    
    // Draw ocean
    const deepBlue = p5.color(0, 40, 80, 180);
    const lightBlue = p5.color(30, 100, 180, 100);
    
    // Draw multiple wave layers
    for (let layer = 0; layer < 3; layer++) {
      const layerOffset = layer * 20;
      const alpha = 255 - layer * 40;
      const waveColor = p5.color(0, 70 + layer * 20, 140 - layer * 20, alpha);
      
      p5.noStroke();
      p5.fill(waveColor);
      
      // Draw each wave
      p5.beginShape();
      
      // Start at bottom left
      p5.vertex(gridStartX, gridStartY + gridHeight);
      
      // Bottom right corner
      p5.vertex(gridStartX + gridWidth, gridStartY + gridHeight);
      
      // Top right corner with offset for wave effect
      p5.vertex(gridStartX + gridWidth, gridStartY + layerOffset);
      
      // Connect wave points for the wave effect
      for (let i = wavePointsRef.current.length - 1; i >= 0; i--) {
        const point = wavePointsRef.current[i];
        const x = point.x;
        const y = gridStartY + point.y + layerOffset;
        p5.curveVertex(x, y);
      }
      
      // Top left with offset for wave effect
      p5.vertex(gridStartX, gridStartY + layerOffset);
      
      p5.endShape(p5.CLOSE);
    }
    
    // Create some bubbles
    const bubbleCount = 5;
    p5.fill(255, 255, 255, 80);
    p5.noStroke();
    
    for (let i = 0; i < bubbleCount; i++) {
      const bubbleX = gridStartX + (Math.sin(timeRef.current * 0.5 + i) * 0.5 + 0.5) * gridWidth;
      const bubbleY = gridStartY + gridHeight - ((timeRef.current * 20 + i * 100) % gridHeight);
      const bubbleSize = 4 + Math.sin(timeRef.current * 2 + i) * 2;
      
      p5.ellipse(bubbleX, bubbleY, bubbleSize);
    }
    
    // Apply a semi-transparent overlay to ensure board visibility
    p5.fill(0, 10, 30, 160);
    p5.rect(gridStartX, gridStartY, gridWidth, gridHeight);
  };
  
  // Draw the game board
  const drawBoard = (p5: p5Types) => {
    const gridStartX = 40; // Start after row headers
    const gridStartY = 40; // Start after column headers
    
    for (let row = 0; row < size; row++) {
      for (let col = 0; col < size; col++) {
        const x = gridStartX + col * cellSize;
        const y = gridStartY + row * cellSize;
        const cellState = externalBoardState ? externalBoardState[row][col] : boardState[row][col];
        
        // Cell background
        p5.fill(0, 20, 40, 200);
        p5.stroke(72, 145, 255, 64);
        p5.rect(x, y, cellSize, cellSize);
        
        // Cell content based on state
        switch (cellState) {
          case CellState.SHIP:
            if (isPlayerBoard) {
              p5.fill(66, 133, 244);
              p5.noStroke();
              p5.rect(x + 2, y + 2, cellSize - 4, cellSize - 4, 2);
            }
            break;
          case CellState.HIT:
            // Basic hit marker without animation
            p5.fill(211, 47, 47);
            p5.noStroke();
            p5.ellipse(x + cellSize / 2, y + cellSize / 2, cellSize * 0.7);
            break;
          case CellState.MISS:
            // Basic miss marker without animation
            p5.fill(224, 224, 224);
            p5.noStroke();
            p5.ellipse(x + cellSize / 2, y + cellSize / 2, cellSize * 0.7);
            break;
          case CellState.SUNK:
            p5.fill(62, 39, 35);
            p5.noStroke();
            p5.rect(x + 2, y + 2, cellSize - 4, cellSize - 4);
            
            // Diagonal lines
            p5.stroke(93, 64, 55);
            p5.strokeWeight(2);
            p5.line(x + 5, y + 5, x + cellSize - 5, y + cellSize - 5);
            p5.line(x + cellSize - 5, y + 5, x + 5, y + cellSize - 5);
            p5.strokeWeight(1);
            break;
        }
        
        // Hover effect
        if (hoverCell && hoverCell.row === row && hoverCell.col === col && isActive && (!isPlayerBoard || editable)) {
          p5.fill(72, 145, 255, 100);
          p5.noStroke();
          p5.rect(x, y, cellSize, cellSize);
        }
      }
    }
  };
  
  // Draw animations for hits and misses
  const drawAnimations = (p5: p5Types) => {
    const gridStartX = 40; // Start after row headers
    const gridStartY = 40; // Start after column headers
    const currentTime = p5.millis();
    
    // Filter out completed animations
    const activeAnims = activeAnimations.filter(anim => 
      currentTime - anim.startTime < anim.duration
    );
    
    // Update state if animations were removed
    if (activeAnims.length < activeAnimations.length) {
      setActiveAnimations(activeAnims);
    }
    
    // Draw each active animation
    activeAnims.forEach(anim => {
      const x = gridStartX + anim.col * cellSize + cellSize / 2;
      const y = gridStartY + anim.row * cellSize + cellSize / 2;
      const progress = (currentTime - anim.startTime) / anim.duration;
      
      if (anim.type === 'hit') {
        // Explosion animation for hits - now longer duration
        const maxRadius = cellSize * 1.5; // Larger explosion
        const innerRadius = maxRadius * progress;
        const outerRadius = innerRadius * 0.7;
        
        // Glow effect gets stronger in the middle of the animation
        const glowIntensity = progress < 0.5 ? progress * 2 : (1 - progress) * 2;
        p5.drawingContext.shadowBlur = 20 * glowIntensity;
        p5.drawingContext.shadowColor = 'rgba(255, 0, 0, 0.8)';
        
        // Outer explosion ring
        p5.noFill();
        p5.stroke(255, 100, 100, 255 * (1 - progress));
        p5.strokeWeight(3);
        p5.ellipse(x, y, innerRadius);
        
        // Inner explosion
        p5.fill(255, 0, 0, 255 * (1 - progress));
        p5.noStroke();
        p5.ellipse(x, y, outerRadius);
        
        // Add reveal effect in the second half of the animation
        if (progress > 0.5) {
          const revealProgress = (progress - 0.5) * 2; // 0 to 1 during second half
          p5.fill(211, 47, 47, 255 * revealProgress);
          p5.ellipse(x, y, cellSize * 0.7);
        }
        
        // Explosion particles
        const particleCount = 12; // More particles
        const particleSize = cellSize * 0.15;
        p5.fill(255, 200, 0, 255 * (1 - progress));
        
        for (let i = 0; i < particleCount; i++) {
          const angle = (i / particleCount) * p5.TWO_PI;
          const distance = innerRadius * 0.6 * progress;
          const particleX = x + p5.cos(angle) * distance;
          const particleY = y + p5.sin(angle) * distance;
          p5.ellipse(particleX, particleY, particleSize * (1 - progress));
        }
        
        p5.drawingContext.shadowBlur = 0;
      } else {
        // Splash animation for misses - now longer duration
        const maxRadius = cellSize * 1.2; // Larger splash
        const splashRadius = maxRadius * progress;
        
        // Splash effect gets stronger in the middle of the animation
        const splashIntensity = progress < 0.5 ? progress * 2 : (1 - progress) * 2;
        
        // Main splash circle
        p5.noFill();
        p5.stroke(255, 255, 255, 255 * splashIntensity);
        p5.strokeWeight(2);
        p5.ellipse(x, y, splashRadius);
        
        // Inner splash circles
        p5.stroke(200, 225, 255, 200 * splashIntensity);
        p5.ellipse(x, y, splashRadius * 0.7);
        p5.ellipse(x, y, splashRadius * 0.4);
        
        // Add reveal effect in the second half of the animation
        if (progress > 0.5) {
          const revealProgress = (progress - 0.5) * 2; // 0 to 1 during second half
          p5.fill(224, 224, 224, 255 * revealProgress);
          p5.noStroke();
          p5.ellipse(x, y, cellSize * 0.7);
        }
        
        // Water droplets with more upward motion
        const dropletCount = 8; // More droplets
        p5.fill(200, 225, 255, 200 * splashIntensity);
        
        for (let i = 0; i < dropletCount; i++) {
          const angle = (i / dropletCount) * p5.TWO_PI;
          const distance = splashRadius * 0.6;
          const dropletX = x + p5.cos(angle) * distance;
          const dropletY = y + p5.sin(angle) * distance - (cellSize * 0.5 * progress); // More vertical movement
          p5.ellipse(dropletX, dropletY, cellSize * 0.15 * (1 - progress));
        }
      }
    });
  };
  
  // Draw the ships for dragging
  const drawShips = (p5: p5Types) => {
    if (!editable || isReady) return;
    
    const gridStartX = 40; // Start after row headers
    const gridStartY = 40; // Start after column headers
    
    ships.forEach(ship => {
      if (ship.position) {
        const { row, col } = ship.position;
        const { orientation, size: shipSize } = ship;
        
        const x = gridStartX + col * cellSize;
        const y = gridStartY + row * cellSize;
        
        // Determine ship dimensions
        const width = orientation === Orientation.HORIZONTAL ? cellSize * shipSize : cellSize;
        const height = orientation === Orientation.VERTICAL ? cellSize * shipSize : cellSize;
        
        // Don't draw the ship on the grid again if we're currently dragging it
        if (draggingShipId === ship.id && isDragging) return;
        
        // Ship background with floating effect
        const floatOffset = Math.sin(timeRef.current * 2 + ship.id.charCodeAt(0) * 0.1) * 2;
        
        // Ship shadow
        p5.fill(0, 0, 0, 80);
        p5.noStroke();
        p5.rect(x + 3, y + 3 + floatOffset, width, height, 4);
        
        // Ship body
        p5.fill(66, 133, 244);
        p5.stroke(92, 156, 230);
        p5.rect(x, y + floatOffset, width, height, 4);
        
        // Rotation button
        const btnX = x + width / 2;
        const btnY = y + height / 2 + floatOffset;
        const btnSize = Math.min(cellSize * 0.4, 24);
        
        p5.fill(255, 255, 255, 80);
        p5.ellipse(btnX, btnY, btnSize);
        
        // Rotation icon (simple arrow)
        p5.push();
        p5.translate(btnX, btnY);
        p5.rotate(p5.PI / 4);
        p5.noFill();
        p5.stroke(255);
        p5.strokeWeight(2);
        p5.arc(0, 0, btnSize * 0.7, btnSize * 0.7, 0, p5.PI * 1.5);
        p5.line(btnSize * 0.35, 0, btnSize * 0.35, -btnSize * 0.2);
        p5.line(btnSize * 0.35, 0, btnSize * 0.15, 0);
        p5.strokeWeight(1);
        p5.pop();
      }
    });
    
    // Draw currently dragging ship
    if (isDragging && draggingShipId) {
      const ship = ships.find(s => s.id === draggingShipId);
      if (ship && ship.position) {
        const mouseX = p5.mouseX;
        const mouseY = p5.mouseY;
        
        // Determine ship dimensions
        const width = ship.orientation === Orientation.HORIZONTAL ? cellSize * ship.size : cellSize;
        const height = ship.orientation === Orientation.VERTICAL ? cellSize * ship.size : cellSize;
        
        // Ship background with glow effect
        p5.fill(66, 133, 244, 220);
        p5.drawingContext.shadowBlur = 15;
        p5.drawingContext.shadowColor = 'rgba(66, 133, 244, 0.8)';
        p5.rect(mouseX - dragOffset.x, mouseY - dragOffset.y, width, height, 4);
        p5.drawingContext.shadowBlur = 0;
        
        // Calculate grid position
        const gridX = Math.floor((mouseX - 40) / cellSize);
        const gridY = Math.floor((mouseY - 40) / cellSize);
        
        // Preview placement (show in red if invalid)
        if (gridX >= 0 && gridX < size && gridY >= 0 && gridY < size) {
          const isValid = isValidPosition(ship, gridY, gridX);
          p5.fill(isValid ? p5.color(76, 175, 80, 100) : p5.color(244, 67, 54, 100));
          p5.noStroke();
          
          if (ship.orientation === Orientation.HORIZONTAL) {
            for (let i = 0; i < ship.size && gridX + i < size; i++) {
              p5.rect(40 + (gridX + i) * cellSize, 40 + gridY * cellSize, cellSize, cellSize);
            }
          } else {
            for (let i = 0; i < ship.size && gridY + i < size; i++) {
              p5.rect(40 + gridX * cellSize, 40 + (gridY + i) * cellSize, cellSize, cellSize);
            }
          }
        }
      }
    }
  };
  
  // Draw grid overlay
  const drawGrid = (p5: p5Types) => {
    const gridStartX = 40; // Start after row headers
    const gridStartY = 40; // Start after column headers
    
    p5.stroke(72, 145, 255, 64);
    p5.strokeWeight(1);
    
    // Draw the grid lines
    for (let i = 0; i <= size; i++) {
      // Vertical lines
      p5.line(
        gridStartX + i * cellSize, 
        gridStartY, 
        gridStartX + i * cellSize, 
        gridStartY + size * cellSize
      );
      
      // Horizontal lines
      p5.line(
        gridStartX, 
        gridStartY + i * cellSize, 
        gridStartX + size * cellSize,

        gridStartY + i * cellSize
      );
    }
  };
  
  // Draw targeting cursor
  const drawTargetingCursor = (p5: p5Types) => {
    if (!isPlayerBoard && isActive && hoverCell) {
      const { row, col } = hoverCell;
      const cellState = externalBoardState?.[row]?.[col] || CellState.EMPTY;
      const hasActiveAnimation = activeAnimations.some(
        anim => anim.row === row && anim.col === col
      );
      
      // Only show targeting cursor for empty cells with no active animations
      if (cellState === CellState.EMPTY && !hasActiveAnimation) {
        const x = 40 + col * cellSize + cellSize / 2;
        const y = 40 + row * cellSize + cellSize / 2;
        
        // Draw a targeting crosshair
        p5.push();
        p5.stroke(255, 0, 0, 150);
        p5.strokeWeight(1.5);
        
        // Crosshair lines
        const size = cellSize * 0.3;
        p5.line(x - size, y, x + size, y);
        p5.line(x, y - size, x, y + size);
        
        // Crosshair circle
        p5.noFill();
        p5.ellipse(x, y, size * 1.5);
        p5.pop();
      }
    }
  };
  
  // Draw column headers (A-J)
  const drawColumnHeaders = (p5: p5Types) => {
    const gridStartX = 40; // Start after row headers
    
    p5.fill(255);
    p5.noStroke();
    p5.textSize(14);
    p5.textAlign(p5.CENTER, p5.CENTER);
    
    for (let col = 0; col < size; col++) {
      const x = gridStartX + col * cellSize + cellSize / 2;
      const y = 20;
      p5.text(String.fromCharCode(65 + col), x, y);
    }
  };
  
  // Draw row headers (1-10)
  const drawRowHeaders = (p5: p5Types) => {
    const gridStartY = 40; // Start after column headers
    
    p5.fill(255);
    p5.noStroke();
    p5.textSize(14);
    p5.textAlign(p5.CENTER, p5.CENTER);
    
    for (let row = 0; row < size; row++) {
      const x = 20;
      const y = gridStartY + row * cellSize + cellSize / 2;
      p5.text(String(row + 1), x, y);
    }
  };
  
  // Add a new animation effect when player fires
  const addShotAnimation = (row: number, col: number, type: 'hit' | 'miss') => {
    if (p5Ref.current) {
      const animationDuration = 2000; // Increase to 2 seconds
      
      const newAnimation: AnimationEffect = {
        row,
        col,
        type,
        startTime: p5Ref.current.millis(),
        duration: animationDuration
      };
      
      setActiveAnimations(prev => [...prev, newAnimation]);
      
      // If we have an animation complete callback, call it after the animation duration
      if (onAnimationComplete) {
        setTimeout(() => {
          onAnimationComplete(row, col, type);
        }, animationDuration);
      }
    }
  };
  
  // Mouse pressed handler
  const mousePressed = (p5: p5Types) => {
    if (!isActive) return;
    
    const mouseX = p5.mouseX;
    const mouseY = p5.mouseY;
    
    // Check if click is within grid bounds
    if (mouseX >= 40 && mouseX < 40 + size * cellSize && 
        mouseY >= 40 && mouseY < 40 + size * cellSize) {
      const gridX = Math.floor((mouseX - 40) / cellSize);
      const gridY = Math.floor((mouseY - 40) / cellSize);
      
      // Handle cell click
      if (isPlayerBoard && editable && !isReady) {
        // Check for ship rotation button click
        const clickedShip = findShipByPosition(gridX, gridY);
        if (clickedShip) {
          const shipX = 40 + clickedShip.position!.col * cellSize;
          const shipY = 40 + clickedShip.position!.row * cellSize;
          const width = clickedShip.orientation === Orientation.HORIZONTAL ? cellSize * clickedShip.size : cellSize;
          const height = clickedShip.orientation === Orientation.VERTICAL ? cellSize * clickedShip.size : cellSize;
          
          const btnX = shipX + width / 2;
          const btnY = shipY + height / 2;
          const btnSize = Math.min(cellSize * 0.4, 24);
          
          // Check if click is on rotation button
          const distance = Math.sqrt(Math.pow(mouseX - btnX, 2) + Math.pow(mouseY - btnY, 2));
          if (distance <= btnSize / 2) {
            rotateShip(clickedShip.id);
            return;
          }
          
          // Start dragging the ship
          setDraggingShipId(clickedShip.id);
          setIsDragging(true);
          setDragOffset({
            x: mouseX - shipX,
            y: mouseY - shipY
          });
        }
      } else if (!isPlayerBoard && onCellClick) {
        // Don't fire if cell already has a state or an animation is active
        const cellState = externalBoardState?.[gridY]?.[gridX] || CellState.EMPTY;
        const hasActiveAnimation = activeAnimations.some(
          anim => anim.row === gridY && anim.col === gridX
        );
        
        if (cellState === CellState.EMPTY && !hasActiveAnimation) {
          // Create a "pending" animation that will be confirmed by game state
          addShotAnimation(gridY, gridX, 'miss'); // Default to miss, will be updated by board state change
          onCellClick(gridY, gridX);
        }
      }
    }
  };
  
  // Mouse released handler
  const mouseReleased = (p5: p5Types) => {
    if (isDragging && draggingShipId) {
      const mouseX = p5.mouseX;
      const mouseY = p5.mouseY;
      
      // Calculate grid position
      const gridX = Math.floor((mouseX - 40) / cellSize);
      const gridY = Math.floor((mouseY - 40) / cellSize);
      
      // Update ship position if valid
      if (gridX >= 0 && gridX < size && gridY >= 0 && gridY < size) {
        setShips(prevShips => {
          return prevShips.map(ship => {
            if (ship.id === draggingShipId) {
              if (isValidPosition(ship, gridY, gridX)) {
                // Play ship placement sound
                if (soundsRef.current.place) {
                  soundsRef.current.place.play();
                }
                
                return {
                  ...ship,
                  position: { row: gridY, col: gridX }
                };
              }
            }
            return ship;
          });
        });
      }
      
      // End dragging
      setIsDragging(false);
      setDraggingShipId(null);
    }
  };
  
  // Mouse moved handler
  const mouseMoved = (p5: p5Types) => {
    if (!isActive) return;
    
    const mouseX = p5.mouseX;
    const mouseY = p5.mouseY;
    
    // Check if mouse is within grid bounds
    if (mouseX >= 40 && mouseX < 40 + size * cellSize && 
        mouseY >= 40 && mouseY < 40 + size * cellSize) {
      const gridX = Math.floor((mouseX - 40) / cellSize);
      const gridY = Math.floor((mouseY - 40) / cellSize);
      
      setHoverCell({ row: gridY, col: gridX });
    } else {
      setHoverCell(null);
    }
  };
  
  // Helper to find a ship by grid position
  const findShipByPosition = (col: number, row: number): Ship | undefined => {
    return ships.find(ship => {
      if (!ship.position) return false;
      
      const { position, orientation, size: shipSize } = ship;
      
      if (orientation === Orientation.HORIZONTAL) {
        return (
          row === position.row && 
          col >= position.col && 
          col < position.col + shipSize
        );
      } else {
        return (
          col === position.col && 
          row >= position.row && 
          row < position.row + shipSize
        );
      }
    });
  };
  
  // Check if all ships are placed
  const areAllShipsPlaced = (): boolean => {
    const allPlaced = ships.every(ship => ship.position !== undefined);
    return allPlaced;
  };
  
  // Handle ready button click
  const handleReadyClick = () => {
    console.log('Ready button clicked in CanvasGameBoard');
    console.log('All ships placed:', areAllShipsPlaced());
    console.log('Current isReady state:', isReady);
    console.log('onReady callback exists:', !!onReady);
    
    if (onReady && areAllShipsPlaced() && !isReady) {
      console.log('Calling onReady callback');
      onReady();
    } else {
      console.log('Not calling onReady callback due to conditions not met');
    }
  };
  
  return (
    <div ref={containerRef} style={{ width: '100%', maxWidth: '100%' }}>
      <div style={{ textAlign: 'center', marginBottom: '16px' }}>
        <h2 style={{ 
          fontWeight: 'bold', 
          color: '#4285f4',
          textShadow: '0 0 10px rgba(64, 128, 255, 0.4)',
          margin: '0 0 8px 0',
          fontSize: editable ? '1.5rem' : '2rem' // Larger title in game mode
        }}>
          {isPlayerBoard ? 'Your Board' : 'Opponent\'s Board'}
        </h2>
        
        {isPlayerBoard && editable && (
          <p style={{ fontSize: '14px', margin: '0 0 16px 0' }}>
            Drag to position ships. Click the button to rotate.
          </p>
        )}
      </div>
      
      <div style={{ 
        border: isActive ? '2px solid rgba(72, 145, 255, 0.6)' : '2px solid transparent',
        borderRadius: '8px',
        boxShadow: isActive 
          ? '0 4px 20px rgba(0, 30, 60, 0.6), inset 0 0 20px rgba(0, 20, 40, 0.6), 0 0 8px rgba(72, 145, 255, 0.4)'
          : '0 4px 20px rgba(0, 30, 60, 0.4), inset 0 0 20px rgba(0, 20, 40, 0.4)',
        overflow: 'hidden',
        backgroundColor: 'rgba(0, 10, 30, 0.9)',
        opacity: isActive ? 1 : 0.7,
        transition: 'opacity 0.3s ease',
        margin: '0 auto',
        maxWidth: '100%'
      }}>
        {canvasWidth > 0 && (
          <Sketch
            setup={setup}
            draw={draw}
            mousePressed={mousePressed}
            mouseReleased={mouseReleased}
            mouseMoved={mouseMoved}
          />
        )}
      </div>
      
      {isPlayerBoard && editable && !isReady && (
        <div style={{ 
          textAlign: 'center', 
          marginTop: '16px',
          position: 'relative',
          zIndex: 10  // Ensure button is above canvas
        }}>
          <button
            onClick={handleReadyClick}
            disabled={!areAllShipsPlaced() || isReady}
            style={{
              backgroundColor: areAllShipsPlaced() && !isReady ? '#4285f4' : '#999',
              color: 'white',
              border: 'none',
              padding: '12px 24px',
              borderRadius: '4px',
              fontWeight: 'bold',
              cursor: areAllShipsPlaced() && !isReady ? 'pointer' : 'not-allowed',
              boxShadow: '0 2px 4px rgba(0, 0, 0, 0.2)',
              transition: 'all 0.2s ease'
            }}
          >
            {isReady ? 'Waiting for opponent...' : 'Ready to Play'}
          </button>
        </div>
      )}
    </div>
  );
};

export default CanvasGameBoard; 