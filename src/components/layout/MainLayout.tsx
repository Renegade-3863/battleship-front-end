import React, { ReactNode } from 'react';
import { Box, AppBar, Toolbar, Typography, Button, Container, Avatar } from '@mui/material';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

interface MainLayoutProps {
  children: ReactNode;
}

const MainLayout = ({ children }: MainLayoutProps) => {
  const navigate = useNavigate();
  const { currentUser, userProfile, signOut } = useAuth();
  
  const handleLogout = async () => {
    try {
      await signOut();
      navigate('/login');
    } catch (error) {
      console.error('Failed to log out', error);
    }
  };
  
  const getInitial = (name: string) => {
    return name?.charAt(0).toUpperCase() || '?';
  };

  return (
    <Box sx={{ 
      display: 'flex', 
      flexDirection: 'column', 
      minHeight: '100vh',
      backgroundColor: '#121212',
      backgroundImage: 'linear-gradient(rgba(0, 30, 60, 0.4), rgba(0, 30, 60, 0.2))'
    }}>
      <AppBar position="static" sx={{ backgroundColor: 'rgba(0, 0, 0, 0.9)' }}>
        <Toolbar>
          <Typography 
            variant="h6" 
            component={RouterLink} 
            to="/"
            sx={{ 
              flexGrow: 1, 
              textDecoration: 'none', 
              color: 'white',
              fontWeight: 'bold'
            }}
          >
            BATTLESHIP
          </Typography>
          
          {currentUser ? (
            <>
              <Button 
                color="inherit" 
                component={RouterLink} 
                to="/play"
                sx={{ mx: 1 }}
              >
                Play
              </Button>
              
              <Button 
                color="inherit" 
                component={RouterLink} 
                to="/profile"
                sx={{ mx: 1 }}
                startIcon={
                  <Avatar 
                    sx={{ 
                      width: 24, 
                      height: 24, 
                      fontSize: '0.75rem',
                      bgcolor: 'primary.main' 
                    }}
                    src={userProfile?.photoURL || undefined}
                  >
                    {!userProfile?.photoURL && getInitial(userProfile?.username || '')}
                  </Avatar>
                }
              >
                {userProfile?.username || 'Profile'}
              </Button>
              
              <Button 
                color="inherit"
                onClick={handleLogout}
                sx={{ mx: 1 }}
              >
                Logout
              </Button>
            </>
          ) : (
            <>
              <Button 
                color="inherit" 
                onClick={() => navigate('/login')}
                sx={{ mx: 1 }}
              >
                Login
              </Button>
              <Button 
                color="inherit"
                variant="outlined"
                onClick={() => navigate('/register')}
                sx={{ mx: 1 }}
              >
                Register
              </Button>
            </>
          )}
        </Toolbar>
      </AppBar>
      
      <Container component="main" sx={{ flexGrow: 1, py: 3 }}>
        {children}
      </Container>
      
      <Box 
        component="footer" 
        sx={{ 
          py: 3, 
          backgroundColor: 'rgba(0, 0, 0, 0.9)',
          color: 'rgba(255, 255, 255, 0.7)',
          mt: 'auto'
        }}
      >
        <Container maxWidth="lg">
          <Typography variant="body2" align="center">
            © {new Date().getFullYear()} Battleship Online
          </Typography>
        </Container>
      </Box>
    </Box>
  );
};

export default MainLayout; 