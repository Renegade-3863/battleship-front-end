import React, { useState, useEffect, useRef } from 'react';
import { 
  Paper, 
  Typography, 
  Box, 
  TextField, 
  IconButton,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Avatar,
  Divider
} from '@mui/material';
import SendIcon from '@mui/icons-material/Send';
import ChatIcon from '@mui/icons-material/Chat';
import socketService from '../../services/socketService';

// Message interface
interface Message {
  id: string;
  sender: 'player' | 'opponent';
  text: string;
  timestamp: Date;
}

interface GameChatProps {
  opponentName?: string;
}

const GameChat = ({ opponentName = 'Opponent' }: GameChatProps) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [currentOpponentName, setCurrentOpponentName] = useState(opponentName);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  // Update local state when prop changes
  useEffect(() => {
    console.log('GameChat: opponentName prop changed from', currentOpponentName, 'to', opponentName);
    setCurrentOpponentName(opponentName);
  }, [opponentName, currentOpponentName]);
  
  // Initialize socket connection for chat
  useEffect(() => {
    // Listen for incoming messages
    const handleReceiveMessage = (data: { 
      text: string; 
      timestamp: string; 
      senderId: string;
      msgId: string;
    }) => {
      const newMsg: Message = {
        id: data.msgId,
        sender: 'opponent',
        text: data.text,
        timestamp: new Date(data.timestamp)
      };
      
      setMessages(prevMessages => [...prevMessages, newMsg]);
    };

    // Register the event listener
    socketService.on('receive_message', handleReceiveMessage);
    
    // Cleanup
    return () => {
      socketService.off('receive_message', handleReceiveMessage);
    };
  }, []);
  
  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);
  
  // Debug log when rendering
  console.log('GameChat rendering with opponentName:', opponentName, 'and currentOpponentName:', currentOpponentName);
  
  // Send message
  const handleSendMessage = () => {
    if (!newMessage.trim()) return;
    
    const msgId = Date.now().toString();
    const timestamp = new Date();
    
    const newMsg: Message = {
      id: msgId,
      sender: 'player',
      text: newMessage,
      timestamp
    };
    
    // Add message to local state
    setMessages([...messages, newMsg]);
    setNewMessage('');
    
    // Send message through socket
    socketService.sendMessage(newMessage);
  };
  
  // Handle Enter key press
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };
  
  // Format timestamp
  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };
  
  // Get initials for avatar
  const getInitials = (name: string) => {
    return name.charAt(0).toUpperCase();
  };

  return (
    <Paper 
      elevation={3} 
      sx={{ 
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        backgroundColor: 'rgba(0, 10, 30, 0.85)',
        color: 'white',
        borderRadius: '8px',
        overflow: 'hidden',
        border: '1px solid rgba(72, 145, 255, 0.3)'
      }}
    >
      <Box sx={{ 
        p: 2, 
        borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
        backgroundColor: 'rgba(0, 0, 0, 0.4)',
        display: 'flex',
        alignItems: 'center',
        gap: 1
      }}>
        <ChatIcon sx={{ color: 'primary.main' }} />
        <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
          Chat
        </Typography>
      </Box>
      
      <List
        sx={{ 
          flexGrow: 1, 
          overflow: 'auto',
          p: 2,
          maxHeight: { xs: 300, md: 400 },
          minHeight: { xs: 200, md: 300 },
          '&::-webkit-scrollbar': {
            width: '8px',
          },
          '&::-webkit-scrollbar-track': {
            background: 'rgba(0, 0, 0, 0.1)',
          },
          '&::-webkit-scrollbar-thumb': {
            background: 'rgba(72, 145, 255, 0.5)',
            borderRadius: '4px',
          }
        }}
      >
        {messages.length === 0 && (
          <Box sx={{ 
            height: '100%', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            flexDirection: 'column',
            opacity: 0.7
          }}>
            <ChatIcon sx={{ fontSize: 48, mb: 1, color: 'rgba(255, 255, 255, 0.5)' }} />
            <Typography variant="body2" color="text.secondary">
              No messages yet
            </Typography>
          </Box>
        )}
        
        {messages.map((message, index) => (
          <React.Fragment key={message.id}>
            {index > 0 && messages[index-1].sender !== message.sender && (
              <Divider 
                variant="middle" 
                sx={{ 
                  my: 1.5, 
                  borderColor: 'rgba(255, 255, 255, 0.05)'
                }}
              />
            )}
            <ListItem 
              alignItems="flex-start"
              sx={{ 
                p: 1,
                backgroundColor: message.sender === 'player' 
                  ? 'rgba(25, 118, 210, 0.1)' 
                  : 'rgba(0, 0, 0, 0.2)',
                borderRadius: 2,
                mb: 1,
                transition: 'background-color 0.2s ease',
                '&:hover': {
                  backgroundColor: message.sender === 'player' 
                    ? 'rgba(25, 118, 210, 0.2)' 
                    : 'rgba(0, 0, 0, 0.3)'
                }
              }}
            >
              <ListItemAvatar>
                <Avatar 
                  sx={{ 
                    bgcolor: message.sender === 'player' ? 'primary.main' : 'secondary.main',
                    width: 32,
                    height: 32,
                    boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
                  }}
                >
                  {getInitials(message.sender === 'player' ? 'You' : currentOpponentName)}
                </Avatar>
              </ListItemAvatar>
              <ListItemText 
                primary={
                  <Box component="span" sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="body2" fontWeight="bold">
                      {message.sender === 'player' ? 'You' : currentOpponentName}
                    </Typography>
                    <Typography variant="caption" color="text.secondary" sx={{ opacity: 0.7 }}>
                      {formatTime(message.timestamp)}
                    </Typography>
                  </Box>
                }
                secondary={
                  <Typography 
                    variant="body2" 
                    color="rgba(255, 255, 255, 0.9)"
                    sx={{ mt: 0.5 }}
                  >
                    {message.text}
                  </Typography>
                }
              />
            </ListItem>
          </React.Fragment>
        ))}
        <div ref={messagesEndRef} />
      </List>
      
      <Box sx={{ 
        p: 2, 
        borderTop: '1px solid rgba(255, 255, 255, 0.1)',
        backgroundColor: 'rgba(0, 0, 0, 0.4)',
        display: 'flex'
      }}>
        <TextField
          placeholder="Type a message..."
          variant="outlined"
          fullWidth
          size="small"
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          onKeyPress={handleKeyPress}
          sx={{
            '& .MuiOutlinedInput-root': {
              borderRadius: '20px',
              backgroundColor: 'rgba(0, 20, 40, 0.3)',
              '&:hover': {
                '& fieldset': {
                  borderColor: 'rgba(72, 145, 255, 0.6)',
                },
              },
              '& fieldset': {
                borderColor: 'rgba(255, 255, 255, 0.2)',
                transition: 'border-color 0.2s ease',
              },
              '&.Mui-focused fieldset': {
                borderColor: 'primary.main',
              }
            },
            '& .MuiInputBase-input': {
              color: 'white',
              pl: 2,
            },
          }}
        />
        <IconButton 
          color="primary" 
          onClick={handleSendMessage}
          sx={{ 
            ml: 1, 
            backgroundColor: 'rgba(25, 118, 210, 0.2)',
            '&:hover': {
              backgroundColor: 'rgba(25, 118, 210, 0.3)'
            }
          }}
        >
          <SendIcon />
        </IconButton>
      </Box>
    </Paper>
  );
};

export default GameChat; 