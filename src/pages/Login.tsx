import React, { useState, useEffect } from 'react';
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
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

// Firebase authentication will be implemented later

const Login = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { currentUser, signInWithEmail, signInWithGoogle } = useAuth();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  
  // Redirect if already logged in
  useEffect(() => {
    if (currentUser) {
      navigate('/');
    }
  }, [currentUser, navigate]);
  
  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    
    if (!email || !password) {
      setError('Please enter both email and password');
      return;
    }
    
    try {
      setLoading(true);
      await signInWithEmail(email, password);
      // The redirect will be handled by the AuthRedirectWrapper
    } catch (err: any) {
      setError(err.message || 'Failed to sign in. Please check your credentials.');
      console.error(err);
      setLoading(false);
    }
  };
  
  const handleGoogleLogin = async () => {
    try {
      setLoading(true);
      setError(null);
      await signInWithGoogle();
      navigate('/');
    } catch (err: any) {
      setError(err.message || 'Failed to sign in with Google.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Handle redirect notifications
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const errorMessage = params.get('error');
    
    if (errorMessage) {
      setError(decodeURIComponent(errorMessage));
    }
  }, [location]);

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
          Sign In
        </Typography>
        
        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}
        
        <Box component="form" onSubmit={handleEmailLogin} sx={{ mt: 3 }}>
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
            {loading ? <CircularProgress size={24} color="inherit" /> : 'Sign In'}
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
          onClick={handleGoogleLogin}
          disabled={loading}
          sx={{ py: 1.5 }}
        >
          Sign In with Google
        </Button>
        
        <Box sx={{ mt: 3, textAlign: 'center' }}>
          <Button
            variant="text"
            color="primary"
            onClick={() => navigate('/register')}
            disabled={loading}
          >
            Don't have an account? Sign Up
          </Button>
        </Box>
      </Paper>
    </Container>
  );
};

export default Login; 