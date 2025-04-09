import { Container, Typography, Paper, Box, Button } from '@mui/material';
import { useNavigate } from 'react-router-dom';

const NotFound = () => {
  const navigate = useNavigate();

  return (
    <Container maxWidth="md">
      <Paper 
        elevation={3} 
        sx={{ 
          p: 4, 
          mt: 8, 
          textAlign: 'center',
          background: 'rgba(0, 0, 0, 0.8)',
          color: 'white'
        }}
      >
        <Typography variant="h1" component="h1" gutterBottom>
          404
        </Typography>
        <Typography variant="h4" component="h2" gutterBottom>
          Page Not Found
        </Typography>
        <Typography variant="body1" paragraph>
          The page you are looking for doesn't exist or has been moved.
        </Typography>
        
        <Box sx={{ mt: 4 }}>
          <Button 
            variant="contained" 
            color="primary"
            size="large"
            onClick={() => navigate('/')}
            sx={{ py: 1.5, px: 3 }}
          >
            Return to Home
          </Button>
        </Box>
      </Paper>
    </Container>
  );
};

export default NotFound; 