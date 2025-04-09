# Battleship Online - Frontend

A modern, multiplayer Battleship game built with React, Material UI, and Socket.io.

## Features

- Classic 10x10 Battleship gameplay
- Skill-based matchmaking
- Private games with shareable links
- Customizable ship placement
- In-game chat
- User profiles with stats tracking
- Mobile responsive design

## Technologies Used

- **React.js** - UI framework
- **TypeScript** - Type safety
- **Material UI** - Component library
- **Socket.io** - Real-time game communication
- **Firebase Authentication** - User authentication
- **Firestore** - Data storage

## Getting Started

### Prerequisites

- Node.js 16+ and npm

### Installation

1. Clone the repository
   ```
   git clone https://github.com/yourusername/battleship-front-end.git
   cd battleship-front-end
   ```

2. Install dependencies
   ```
   npm install
   ```

3. Start the development server
   ```
   npm run dev
   ```

4. Open your browser and navigate to `http://localhost:5173`

## Project Structure

```
src/
├── assets/         # Static assets like images
├── components/     # Reusable React components
│   ├── auth/       # Authentication-related components
│   ├── game/       # Game-related components
│   ├── layout/     # Layout components
│   └── ui/         # General UI components
├── context/        # React context providers
├── hooks/          # Custom React hooks
├── models/         # TypeScript interfaces and types
├── pages/          # Page components
├── routes/         # Routing configuration
├── services/       # API services
└── utils/          # Utility functions
```

## Backend Repository

The backend code is available in the [battleship-back-end](https://github.com/yourusername/battleship-back-end) repository.

## Deployment

The application is deployed on Firebase Hosting.

## License

This project is licensed under the MIT License - see the LICENSE file for details.

# Battleship Game

A multiplayer battleship game with canvas-based rendering and real-time gameplay over Socket.IO.

## Features

- Canvas-based game board with fluid animations
- Drag-and-drop ship placement
- Animated hit and miss effects
- Ocean background with waves
- Sound effects
- Real-time multiplayer support

## Sound Effects Setup

The game uses sound effects for various actions. You need to place the following sound files in the `/public/sounds/` directory:

- `explosion.mp3` - Played when a ship is hit
- `splash.mp3` - Played when a shot misses
- `ship_place.mp3` - Played when positioning a ship
- `ship_rotate.mp3` - Played when rotating a ship

You can obtain free sound effects from resources like:
- [Freesound](https://freesound.org/)
- [OpenGameArt](https://opengameart.org/)
- [Soundsnap](https://www.soundsnap.com/)

## Package Dependencies

To support the canvas-based implementation, ensure the following packages are installed:

```bash
npm install react-p5 p5 @types/p5
```

If you also want to use the p5.js sound library, install:

```bash
npm install p5.sound
```

## Setup Instructions

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Set up sound files in the public directory
4. Start the development server:
   ```bash
   npm run dev
   ```

## Game Controls

- **Ship Placement**: Drag ships to position them on the board
- **Ship Rotation**: Click the rotation button in the center of a ship
- **Ready for Battle**: Click the "Ready to Play" button once all ships are placed
- **Attack**: Click on a cell in the opponent's grid to fire
