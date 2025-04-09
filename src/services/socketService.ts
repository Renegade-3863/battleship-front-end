import { io, Socket } from 'socket.io-client';
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
    if (this.socket) return;

    this.socket = io(SOCKET_SERVER_URL, {
      transports: ['websocket', 'polling'],
      autoConnect: true,
    });

    this.socket.on('connect', () => {
      console.log('Connected to game server');
      this.connected = true;
    });

    this.socket.on('disconnect', () => {
      console.log('Disconnected from game server');
      this.connected = false;
    });

    this.socket.on('error', (error: any) => {
      console.error('Socket error:', error);
    });
  }

  // Disconnect from the Socket.IO server
  disconnect() {
    if (!this.socket) return;
    
    this.socket.disconnect();
    this.socket = null;
    this.connected = false;
    this.listeners = {};
  }

  // Join the matchmaking queue
  joinMatchmaking(userData: { id: string; name: string; humanOnly?: boolean }) {
    if (!this.socket) this.connect();
    this.socket?.emit('join_matchmaking', userData);
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
    if (!this.socket) this.connect();
    this.socket?.emit('join_private_game', { gameId, userData });
  }

  // Submit ship placements
  submitShips(ships: any[], board: CellState[][]) {
    if (!this.socket) return;
    this.socket.emit('submit_ships', { ships, board });
  }

  // Make a move (attack)
  makeMove(row: number, col: number) {
    if (!this.socket) return;
    this.socket.emit('make_move', { row, col });
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
    console.log('Setting up game_started listener');
    if (this.socket) {
      this.socket.off('game_started');
    }
    this.on('game_started', () => {
      console.log('Game started event received');
      callback();
    });
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