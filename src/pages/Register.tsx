import React, { useState } from 'react';
import { 
  Container, 
  Typography, 
  TextField, 
  Button, 
  Paper, 
  Box, 
  Divider,
  Alert,
  CircularProgress
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

// Firebase authentication will be implemented later

const Register = () => {
  const navigate = useNavigate();
  const { signUpWithEmail, signInWithGoogle } = useAuth();
  
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    
    if (!username.trim()) {
      setError('Username is required');
      return;
    }
    
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    
    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }
    
    try {
      setLoading(true);
      await signUpWithEmail(email, password, username);
      navigate('/');
    } catch (err: any) {
      setError(err.message || 'Failed to create an account. Please try again.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };
  
  const handleGoogleSignUp = async () => {
    try {
      setLoading(true);
      await signInWithGoogle();
      navigate('/');
    } catch (err: any) {
      setError(err.message || 'Failed to sign up with Google.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container maxWidth="sm">
      <Paper 
        elevation={3} 
        sx={{ 
          p: 4, 
          mt: 8,
          background: 'rgba(0, 0, 0, 0.8)',
          color: 'white'
        }}
      >
        <Typography variant="h4" component="h1" align="center" gutterBottom>
          Create Account
        </Typography>
        
        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}
        
        <Box component="form" onSubmit={handleRegister} sx={{ mt: 3 }}>
          <TextField
            label="Username"
            fullWidth
            margin="normal"
            variant="outlined"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
            disabled={loading}
            sx={{ 
              mb: 2,
              '& .MuiOutlinedInput-root': {
                '& fieldset': {
                  borderColor: 'rgba(255, 255, 255, 0.3)',
                },
              },
              '& .MuiInputLabel-root': {
                color: 'rgba(255, 255, 255, 0.7)',
              },
              '& .MuiOutlinedInput-input': {
                color: 'white',
              },
            }}
          />
          
          <TextField
            label="Email"
            type="email"
            fullWidth
            margin="normal"
            variant="outlined"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            disabled={loading}
            sx={{ 
              mb: 2,
              '& .MuiOutlinedInput-root': {
                '& fieldset': {
                  borderColor: 'rgba(255, 255, 255, 0.3)',
                },
              },
              '& .MuiInputLabel-root': {
                color: 'rgba(255, 255, 255, 0.7)',
              },
              '& .MuiOutlinedInput-input': {
                color: 'white',
              },
            }}
          />
          
          <TextField
            label="Password"
            type="password"
            fullWidth
            margin="normal"
            variant="outlined"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            disabled={loading}
            sx={{ 
              mb: 2,
              '& .MuiOutlinedInput-root': {
                '& fieldset': {
                  borderColor: 'rgba(255, 255, 255, 0.3)',
                },
              },
              '& .MuiInputLabel-root': {
                color: 'rgba(255, 255, 255, 0.7)',
              },
              '& .MuiOutlinedInput-input': {
                color: 'white',
              },
            }}
          />
          
          <TextField
            label="Confirm Password"
            type="password"
            fullWidth
            margin="normal"
            variant="outlined"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
            disabled={loading}
            sx={{ 
              mb: 3,
              '& .MuiOutlinedInput-root': {
                '& fieldset': {
                  borderColor: 'rgba(255, 255, 255, 0.3)',
                },
              },
              '& .MuiInputLabel-root': {
                color: 'rgba(255, 255, 255, 0.7)',
              },
              '& .MuiOutlinedInput-input': {
                color: 'white',
              },
            }}
          />
          
          <Button
            type="submit"
            fullWidth
            variant="contained"
            color="primary"
            size="large"
            disabled={loading}
            sx={{ py: 1.5 }}
          >
            {loading ? <CircularProgress size={24} color="inherit" /> : 'Create Account'}
          </Button>
        </Box>
        
        <Divider sx={{ my: 3, bgcolor: 'rgba(255, 255, 255, 0.3)' }}>
          <Typography color="rgba(255, 255, 255, 0.7)">OR</Typography>
        </Divider>
        
        <Button
          fullWidth
          variant="outlined"
          color="primary"
          size="large"
          onClick={handleGoogleSignUp}
          disabled={loading}
          sx={{ py: 1.5 }}
        >
          Sign Up with Google
        </Button>
        
        <Box sx={{ mt: 3, textAlign: 'center' }}>
          <Button
            variant="text"
            color="primary"
            onClick={() => navigate('/login')}
            disabled={loading}
          >
            Already have an account? Sign In
          </Button>
        </Box>
      </Paper>
    </Container>
  );
};

export default Register; 