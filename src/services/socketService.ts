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

  // Track the last match found for retry purposes
  private lastMatchFound: string | null = null;
  private matchFoundCallback: ((gameId: string) => void) | null = null;

  // Connect to the Socket.IO server
  connect(): Promise<boolean> {
    return new Promise((resolve) => {
      if (this.socket && this.connected) {
        console.log('Socket already connected');
        resolve(true);
        return;
      }
      
      // If we have a socket but it's not connected, disconnect first
      if (this.socket) {
        this.socket.disconnect();
        this.socket = null;
      }
      
      console.log('Connecting to Socket.io server at:', SOCKET_SERVER_URL);
      this.socket = io(SOCKET_SERVER_URL, {
        transports: ['websocket', 'polling'],
        autoConnect: true,
      });

      this.socket.on('connect', () => {
        console.log('Socket connected successfully with ID:', this.socket?.id);
        this.connected = true;
        
        // Debug: Log all registered event listeners
        console.log('Current registered listeners:', Object.keys(this.listeners));
        
        // Set up event listeners that were registered before connection
        Object.entries(this.listeners).forEach(([event, callbacks]) => {
          if (this.socket) {
            console.log(`Adding ${callbacks.length} listener(s) for event: ${event}`);
            callbacks.forEach(callback => {
              this.socket?.on(event, (...args: any[]) => callback(...args));
            });
          }
        });
        
        resolve(true);
      });

      this.socket.on('connect_error', (error) => {
        console.error('Socket connection error:', error);
        resolve(false);
      });

      this.socket.on('disconnect', (reason) => {
        console.log('Socket disconnected:', reason);
        this.connected = false;
      });
      
      // Set a timeout in case connection takes too long
      setTimeout(() => {
        if (!this.connected) {
          console.error('Socket connection timeout');
          resolve(false);
        }
      }, 5000);
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
    if (!this.socket || !this.connected) {
      console.log('Socket not connected when trying to join matchmaking. Connecting first...');
      
      // Connect first, then join when connected
      this.connect().then(connected => {
        if (connected) {
          console.log('Socket now connected, joining matchmaking queue with player data:', userData);
          this.socket?.emit('join_matchmaking', userData);
        } else {
          console.error('Failed to connect socket for matchmaking');
        }
      });
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
    console.log('Current socket status:', this.connected, 'Socket ID:', this.socket?.id);
    
    // Store callback for potential retries
    this.matchFoundCallback = callback;
    
    // Remove any existing listeners first to avoid duplicates
    if (this.socket) {
      console.log('Removing existing match_found listener from socket');
      this.socket.off('match_found');
    }
    
    // Add the new listener
    this.on('match_found', (gameId) => {
      console.log('Match found event received with gameId:', gameId);
      this.lastMatchFound = gameId;
      this.processMatchFound(gameId);
    });
    
    // If we already have a match waiting, process it immediately
    if (this.lastMatchFound) {
      console.log('Processing stored match found with gameId:', this.lastMatchFound);
      this.processMatchFound(this.lastMatchFound);
    }
  }
  
  // Process match found event
  private processMatchFound(gameId: string) {
    if (!this.matchFoundCallback) {
      console.error('No match found callback registered');
      
      // Even if no callback is registered, we still need to handle the match
      console.log('No callback registered, but match found. Storing in localStorage and forcing navigation.');
      localStorage.setItem('battleshipForceNavigate', gameId);
      
      // If we're not already on the game page, redirect
      if (!window.location.pathname.includes(`/game/${gameId}`)) {
        window.location.href = `/game/${gameId}`;
      }
      
      return;
    }
    
    // Call callback with gameId
    try {
      this.matchFoundCallback(gameId);
      console.log('Successfully processed match_found for gameId:', gameId);
      
      // Also store in localStorage as a backup
      localStorage.setItem('battleshipForceNavigate', gameId);
      
      // Set a timeout to check if we've navigated
      setTimeout(() => {
        // If we're not on a game page for this game ID, force navigation
        if (!window.location.pathname.includes(`/game/${gameId}`)) {
          console.log('Navigation check failed, forcing direct navigation');
          window.location.href = `/game/${gameId}`;
        }
      }, 1000);
    } catch (err) {
      console.error('Error processing match_found:', err);
      
      // Even if the callback fails, try a direct navigation
      window.location.href = `/game/${gameId}`;
    }
  }

  // Clear last match found - call this when navigating away from the match
  clearLastMatchFound() {
    console.log('Clearing last match found');
    this.lastMatchFound = null;
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
    if (!this.socket || !this.connected) {
      console.log('Socket not connected when trying to join private game. Connecting first...');
      
      // Connect first, then join when connected
      this.connect().then(connected => {
        if (connected) {
          console.log('Socket now connected, joining private game:', gameId, 'with player data:', userData);
          this.socket?.emit('join_private_game', { gameId, userData }, (response: any) => {
            console.log('join_private_game acknowledgement received:', response);
          });
        } else {
          console.error('Failed to connect socket for private game');
        }
      });
      return;
    }
    
    console.log('Joining private game:', gameId, 'with player data:', userData);
    this.socket.emit('join_private_game', { gameId, userData }, (response: any) => {
      console.log('join_private_game acknowledgement received:', response);
    });
  }

  // Submit ship placements
  submitShips(ships: Ship[], board: CellState[][]) {
    console.log('Submitting ships to server:', ships);
    console.log('Board state type checks:');
    // Log a sample cell to verify we're using numeric values
    if (board.length > 0 && board[0].length > 0) {
      console.log('Sample empty cell value:', board[0][0], 'is type:', typeof board[0][0]);
      
      // Find a ship cell to check
      let shipCellFound = false;
      for (let row = 0; row < board.length && !shipCellFound; row++) {
        for (let col = 0; col < board[0].length && !shipCellFound; col++) {
          if (board[row][col] === CellState.SHIP) {
            console.log('Sample ship cell value:', board[row][col], 'is type:', typeof board[row][col]);
            shipCellFound = true;
          }
        }
      }
    }
    
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
    
    // Generate a unique ID for the message to prevent duplicates
    const messageId = Date.now().toString() + Math.random().toString(36).substring(2, 9);
    
    this.socket.emit('send_message', { 
      message,
      messageId 
    });
  }

  // Leave the current game
  leaveGame() {
    if (!this.socket) return;
    console.log('Leaving current game...');
    
    // Send leave event to server first
    this.socket.emit('leave_game');
    
    // Perform a complete reset of socket connection to ensure clean state
    console.log('Resetting socket connection...');
    this.disconnect();
    
    // Short delay before reconnecting to ensure server has time to process
    setTimeout(() => {
      console.log('Reconnecting socket after game leave...');
      this.connect();
    }, 500);
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
    console.log(`Registering listener for event: ${event}`);
    
    if (!this.listeners[event]) {
      this.listeners[event] = [];
    }
    
    // Check if this callback is already registered to avoid duplicates
    const isCallbackRegistered = this.listeners[event].some(
      existingCallback => existingCallback.toString() === callback.toString()
    );
    
    if (isCallbackRegistered) {
      console.log(`Listener for ${event} already registered, skipping duplicate`);
      return;
    }
    
    this.listeners[event].push(callback);
    
    // Add listener to socket if connected
    if (this.socket) {
      console.log(`Socket connected, adding listener for ${event} immediately`);
      this.socket.on(event, (...args: any[]) => {
        console.log(`Event ${event} received:`, ...args);
        
        // Handle acknowledgement callback
        if (args.length > 0 && typeof args[args.length - 1] === 'function') {
          // Last argument is the acknowledgement callback
          const ack = args.pop();
          callback(...args);
          ack('received'); // Send acknowledgement
        } else {
          callback(...args);
        }
      });
    } else {
      console.log(`Socket not connected yet, listener for ${event} will be added after connection`);
    }
  }

  // Unsubscribe from events
  off(event: string, callback: Function) {
    if (!this.listeners[event]) return;
    
    // Filter out the specific callback
    this.listeners[event] = this.listeners[event].filter(cb => cb !== callback);
    
    // If we have a socket connection, remove all listeners for this event and re-add the remaining ones
    if (this.socket) {
      // First remove all listeners for this event
      this.socket.off(event);
      
      // Re-add the remaining listeners
      if (this.listeners[event].length > 0) {
        this.listeners[event].forEach(cb => {
          this.socket?.on(event, (...args: any[]) => cb(...args));
        });
      }
    }
  }

  // Get the socket instance for direct testing
  getSocketInstance(): Socket | null {
    return this.socket;
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