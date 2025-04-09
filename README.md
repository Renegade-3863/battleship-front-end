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
