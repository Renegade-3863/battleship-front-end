import { io, Socket } from 'socket.io-client';
import { Ship } from '../models/Ship';
import { CellState } from '../components/game/GameBoard';

// Base URL for Socket.IO connection
const SOCKET_SERVER_URL = import.meta.env.VITE_SOCKET_SERVER_URL || 'http://localhost:3000';

// Socket.io service class
class SocketService {
  private socket: Socket | null = null;
  private listeners: Record<string, Function[]> = {};
  private connected = false;

  // Connect to the Socket.IO server
  connect() {
    if (this.socket) {
      console.log('Socket already connected');
      return;
    }
    
    console.log('Connecting to Socket.io server at:', SOCKET_SERVER_URL);
    this.socket = io(SOCKET_SERVER_URL, {
      transports: ['websocket', 'polling'],
      autoConnect: true,
    });

    this.socket.on('connect', () => {
      console.log('Socket connected successfully with ID:', this.socket?.id);
      this.connected = true;
    });

    this.socket.on('connect_error', (error) => {
      console.error('Socket connection error:', error);
    });

    this.socket.on('disconnect', (reason) => {
      console.log('Socket disconnected:', reason);
      this.connected = false;
    });
  }

  // Disconnect from the Socket.IO server
  disconnect() {
    if (this.socket) {
      console.log('Disconnecting socket');
      this.socket.disconnect();
      this.socket = null;
    }
    this.connected = false;
    this.listeners = {};
  }

  // Join the matchmaking queue
  joinMatchmaking(userData: { id: string; name: string; humanOnly?: boolean }) {
    if (!this.socket) {
      console.error('Cannot join matchmaking: Socket connection not established');
      return;
    }
    
    console.log('Joining matchmaking queue with player data:', userData);
    this.socket.emit('join_matchmaking', userData);
  }

  // Cancel matchmaking
  cancelMatchmaking() {
    if (!this.socket) return;
    this.socket.emit('cancel_matchmaking');
  }

  // Listen for match found event
  onMatchFound(callback: (gameId: string) => void) {
    console.log('Setting up match_found listener');
    // Remove any existing listeners first to avoid duplicates
    if (this.socket) {
      this.socket.off('match_found');
    }
    
    // Add the new listener
    this.on('match_found', (gameId) => {
      console.log('Match found event received with gameId:', gameId);
      callback(gameId);
    });
  }

  // Remove match found listener
  offMatchFound() {
    console.log('Removing match_found listener');
    if (!this.socket) return;
    this.socket.off('match_found');
  }

  // Listen for no players found event
  onNoPlayersFound(callback: () => void) {
    this.on('no_players_found', callback);
  }

  // Remove no players found listener
  offNoPlayersFound() {
    if (!this.socket) return;
    this.socket.off('no_players_found');
  }

  // Listen for opponent disconnected event
  onOpponentDisconnected(callback: () => void) {
    this.on('opponent_disconnected', callback);
  }

  // Remove opponent disconnected listener
  offOpponentDisconnected() {
    if (!this.socket) return;
    this.socket.off('opponent_disconnected');
  }

  // Listen for opponent reconnected event
  onOpponentReconnected(callback: () => void) {
    this.on('opponent_reconnected', callback);
  }

  // Remove opponent reconnected listener
  offOpponentReconnected() {
    if (!this.socket) return;
    this.socket.off('opponent_reconnected');
  }

  // Create a private game
  createPrivateGame(userData: { id: string; name: string }) {
    if (!this.socket) this.connect();
    this.socket?.emit('create_private_game', userData);
  }

  // Join a private game
  joinPrivateGame(gameId: string, userData: { id: string; name: string }) {
    if (!this.socket) {
      console.error('Cannot join private game: Socket connection not established');
      return;
    }
    
    console.log('Joining private game:', gameId, 'with player data:', userData);
    this.socket.emit('join_private_game', { gameId, userData });
  }

  // Submit ship placements
  submitShips(ships: Ship[], board: CellState[][]) {
    console.log('Submitting ships to server:', ships);
    if (this.socket) {
      console.log(`Socket connected: ${this.socket.connected}, Socket ID: ${this.socket.id}`);
      console.log('About to emit submit_ships event to server');
      
      // Add a retry mechanism in case of failure
      const emitWithRetry = () => {
        try {
          this.socket?.emit('submit_ships', { ships, board }, (acknowledgement: any) => {
            // Optional acknowledgement callback from server
            console.log('Server acknowledged ship submission:', acknowledgement);
          });
          console.log('Ships submitted successfully, waiting for opponent...');
        } catch (err) {
          console.error('Error submitting ships:', err);
          console.log('Retrying in 1 second...');
          setTimeout(emitWithRetry, 1000);
        }
      };
      
      emitWithRetry();
    } else {
      console.error('Cannot submit ships: Socket connection not established');
    }
  }

  // Make a move on the opponent's board
  makeMove(row: number, col: number) {
    if (!this.socket) {
      console.error('Cannot make move: Socket connection not established');
      return;
    }
    
    console.log('Making move at position:', row, col);
    
    // Add callbacks to handle results
    this.socket.emit('make_move', { row, col }, (response: any) => {
      // Log the response from the server to help with debugging
      console.log('Server response to move:', response);
      
      // Check if there was an error
      if (response && response.error) {
        console.error('Move error:', response.error);
      }
    });
  }

  // Send a chat message
  sendMessage(message: string) {
    if (!this.socket) return;
    this.socket.emit('send_message', { message });
  }

  // Reconnect to a game
  reconnectGame(gameId: string, userId: string) {
    if (!this.socket) this.connect();
    this.socket?.emit('reconnect_game', { gameId, userId });
  }

  // Listen for game_started event
  onGameStarted(callback: () => void) {
    if (!this.socket) {
      console.error('Cannot set up game_started listener: Socket connection not established');
      return;
    }
    
    console.log('Setting up dedicated game_started event listener');
    console.log(`Current socket status: connected=${this.socket.connected}, id=${this.socket.id}`);
    
    // First remove any existing listeners to prevent duplicates
    this.socket.off('game_started');
    
    this.socket.on('game_started', (data: any) => {
      console.log('GAME STARTED EVENT RECEIVED FROM SERVER!', data);
      
      // Execute the callback immediately and also with a slight delay
      // This ensures the event is processed even if there are timing issues
      try {
        callback();
        
        // Force a slight delay to ensure React state updates properly
        setTimeout(() => {
          callback();
        }, 100);
      } catch (err) {
        console.error('Error in game_started callback:', err);
      }
    });
    
    // After setting up the listener, verify it's registered
    const listeners = this.socket.listeners('game_started');
    console.log(`Number of game_started listeners: ${listeners.length}`);
  }

  // Remove game_started listener
  offGameStarted() {
    console.log('Removing game_started listener');
    if (!this.socket) return;
    this.socket.off('game_started');
  }

  // Subscribe to events
  on(event: string, callback: Function) {
    if (!this.listeners[event]) {
      this.listeners[event] = [];
    }
    
    this.listeners[event].push(callback);
    
    // Add listener to socket if connected
    if (this.socket) {
      this.socket.on(event, (...args: any[]) => callback(...args));
    }
  }

  // Unsubscribe from events
  off(event: string, callback: Function) {
    if (!this.listeners[event]) return;
    
    this.listeners[event] = this.listeners[event].filter(cb => cb !== callback);
    
    if (this.socket) {
      this.socket.off(event);
      
      // Re-add remaining listeners
      for (const cb of this.listeners[event]) {
        this.socket.on(event, (...args: any[]) => cb(...args));
      }
    }
  }

  // Check if socket is connected
  isConnected(): boolean {
    return this.connected;
  }

  // Get the socket ID
  getSocketId(): string | null {
    return this.socket?.id || null;
  }
}

// Create and export a singleton instance
const socketService = new SocketService();
export default socketService; 