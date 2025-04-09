// Define ship types
export enum ShipType {
  CARRIER = 'carrier',
  BATTLESHIP = 'battleship',
  CRUISER = 'cruiser',
  SUBMARINE = 'submarine',
  DESTROYER = 'destroyer'
}

// Ship orientation
export enum Orientation {
  HORIZONTAL = 'horizontal',
  VERTICAL = 'vertical'
}

// Ship definition
export interface Ship {
  id: string;
  type: ShipType;
  size: number;
  position?: {
    row: number;
    col: number;
  };
  orientation: Orientation;
  hits: number;
}

// Check if ship is sunk
export const isShipSunk = (ship: Ship): boolean => {
  return ship.hits === ship.size;
};

// Get ships for a new game
export const getInitialShips = (): Ship[] => {
  return [
    {
      id: '1',
      type: ShipType.CARRIER,
      size: 5,
      orientation: Orientation.HORIZONTAL,
      hits: 0
    },
    {
      id: '2',
      type: ShipType.BATTLESHIP,
      size: 4,
      orientation: Orientation.HORIZONTAL,
      hits: 0
    },
    {
      id: '3',
      type: ShipType.CRUISER,
      size: 3,
      orientation: Orientation.HORIZONTAL,
      hits: 0
    },
    {
      id: '4',
      type: ShipType.SUBMARINE,
      size: 3,
      orientation: Orientation.HORIZONTAL,
      hits: 0
    },
    {
      id: '5',
      type: ShipType.DESTROYER,
      size: 2,
      orientation: Orientation.HORIZONTAL,
      hits: 0
    }
  ];
};

// Default ship placement at bottom right
export const getDefaultShipPlacement = (
  boardSize: number = 10
): Ship[] => {
  const ships = getInitialShips();
  
  // Place ships in a compact pattern at the bottom right
  ships[0].position = { row: boardSize - 1, col: boardSize - 5 }; // Carrier
  ships[1].position = { row: boardSize - 2, col: boardSize - 4 }; // Battleship
  ships[2].position = { row: boardSize - 3, col: boardSize - 3 }; // Cruiser
  ships[3].position = { row: boardSize - 4, col: boardSize - 3 }; // Submarine
  ships[4].position = { row: boardSize - 5, col: boardSize - 2 }; // Destroyer
  
  return ships;
}; 