# Battleship Online Game Requirements

## Game Mechanics
- **Players:** 2-player traditional battleship game
- **Board Size:** 10x10 grid
- **Ships:** Traditional ship configuration (5,4,3,3,2)
- **Ship Placement:**
  - Place ships freely
  - Default placement at bottom right
  - System stores last placement configuration
  - Ships can be rotated (click to rotate) and moved (drag)
- **Time Limit:** 10 seconds per turn (configurable in config file)
- **Game Flow:** "Ready" confirmation before game starts
- **Turn Indication:** Visual indicator for current player's turn

## Matchmaking & Game Flow
- **Matchmaking:** Skill-based according to ELO score
- **Game Rooms:**
  - Public rooms for matchmaking
  - Private rooms with generated invitation links
- **Game Start:** No waiting room, game starts directly
- **Game End:** Game over/overview page after completion
- **Disconnection Handling:** 
  - Players can reconnect
  - AI takes over with random guesses during disconnection

## User Interface
- **Theme:** Black/dark style with blue accents (professional like chess.com)
- **Feedback:** 
  - Animations for hits/misses/sinking
  - Sound effects for game actions
- **Responsiveness:** Mobile-friendly design
- **Features:**
  - In-game chat between players
  - Tutorial for new players

## Authentication & User Profiles
- **Authentication Methods:** 
  - Firebase Authentication (email & Google)
  - No email verification required
  - No specific password requirements
- **User Data:**
  - Win/loss count
  - Win rate
  - ELO rating
- **Profile Pictures:**
  - Google profile image for Google-authenticated users
  - First letter of username for email-authenticated users

## Ranking System
- **ELO System:** Continuous ELO ranking
- **Score Calculation:** Winner takes 10 scores from loser, plus bonus based on rank differences

## Data Storage
- **Game Data:**
  - Ship placements (persist between sessions)
  - Shot positions
- **History:** Simple game history (winner record)

## Technical Stack
### Frontend
- React.js with TypeScript
- Material UI
- Socket.io client
- Firebase Authentication
- Vite for build system

### Backend
- Node.js
- Socket.io
- Firestore

## Deployment
- Firebase Hosting

## Project Structure
- Frontend in `battleship-front-end` repository
- Backend in `battleship-back-end` repository 