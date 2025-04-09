import { 
  Container, 
  Typography, 
  Paper, 
  Box, 
  Button,
  Grid,
  Stepper,
  Step,
  StepLabel,
  StepContent
} from '@mui/material';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const tutorialSteps = [
  {
    label: 'Game Objective',
    description: `Battleship is a strategy type guessing game for two players. The objective is to sink all of your opponent's ships by correctly guessing their locations before your opponent sinks yours.`,
    image: '/tutorial/objective.png'
  },
  {
    label: 'Game Setup',
    description: `Each player has a 10x10 grid representing an ocean area, and each player has a fleet of ships that they place on their grid. The ships cannot overlap, and can be placed either horizontally or vertically. Ships cannot be placed diagonally.`,
    image: '/tutorial/setup.png'
  },
  {
    label: 'Ship Placement',
    description: `You have 5 ships: Carrier (5 spaces), Battleship (4 spaces), Cruiser (3 spaces), Submarine (3 spaces), and Destroyer (2 spaces). Click a ship to select it, then click again to rotate it. Drag to position it on your grid. Once you're satisfied with the layout, click "Ready".`,
    image: '/tutorial/placement.png'
  },
  {
    label: 'Taking Turns',
    description: `Players take turns calling "shots" at the other player's ships by clicking on a coordinate on the opponent's grid. The game will indicate whether the shot is a "hit" or a "miss".`,
    image: '/tutorial/shots.png'
  },
  {
    label: 'Winning the Game',
    description: `The first player to sink all of their opponent's ships wins the game. A ship is sunk when all of its squares have been hit.`,
    image: '/tutorial/winning.png'
  },
  {
    label: 'Additional Features',
    description: `Our Battleship game includes chat functionality to communicate with your opponent, ELO-based matchmaking for fair games, and the ability to create private games by sharing a link with friends.`,
    image: '/tutorial/features.png'
  },
];

const Tutorial = () => {
  const navigate = useNavigate();
  const [activeStep, setActiveStep] = useState(0);

  const handleNext = () => {
    setActiveStep((prevActiveStep) => prevActiveStep + 1);
  };

  const handleBack = () => {
    setActiveStep((prevActiveStep) => prevActiveStep - 1);
  };

  const handleReset = () => {
    setActiveStep(0);
  };

  return (
    <Container maxWidth="md">
      <Paper 
        elevation={3} 
        sx={{ 
          p: 4, 
          mt: 4,
          mb: 4,
          background: 'rgba(0, 0, 0, 0.8)',
          color: 'white'
        }}
      >
        <Typography variant="h4" component="h1" align="center" gutterBottom>
          How to Play Battleship
        </Typography>
        
        <Box sx={{ mt: 4 }}>
          <Stepper activeStep={activeStep} orientation="vertical">
            {tutorialSteps.map((step, index) => (
              <Step key={step.label}>
                <StepLabel
                  StepIconProps={{
                    sx: {
                      color: 'primary.main',
                      '&.Mui-active': { color: 'primary.main' },
                      '&.Mui-completed': { color: 'primary.main' }
                    }
                  }}
                >
                  <Typography color="white">{step.label}</Typography>
                </StepLabel>
                <StepContent>
                  <Grid container spacing={2}>
                    <Grid item xs={12} md={6}>
                      <Typography>{step.description}</Typography>
                      <Box sx={{ mt: 2 }}>
                        <div>
                          <Button
                            variant="contained"
                            onClick={handleNext}
                            sx={{ mt: 1, mr: 1 }}
                          >
                            {index === tutorialSteps.length - 1 ? 'Finish' : 'Continue'}
                          </Button>
                          <Button
                            disabled={index === 0}
                            onClick={handleBack}
                            sx={{ mt: 1, mr: 1 }}
                          >
                            Back
                          </Button>
                        </div>
                      </Box>
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <Box 
                        sx={{ 
                          width: '100%', 
                          height: 200, 
                          backgroundColor: 'rgba(0, 30, 60, 0.4)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}
                      >
                        <Typography color="rgba(255,255,255,0.5)" variant="body2">
                          [Tutorial Image Placeholder]
                        </Typography>
                      </Box>
                    </Grid>
                  </Grid>
                </StepContent>
              </Step>
            ))}
          </Stepper>
          
          {activeStep === tutorialSteps.length && (
            <Paper square elevation={0} sx={{ p: 3, backgroundColor: 'rgba(0, 30, 60, 0.4)', color: 'white' }}>
              <Typography>Tutorial completed - you&apos;re ready to play!</Typography>
              <Button onClick={handleReset} sx={{ mt: 1, mr: 1 }}>
                Restart Tutorial
              </Button>
              <Button 
                variant="contained" 
                onClick={() => navigate('/play')} 
                sx={{ mt: 1, mr: 1 }}
              >
                Play Now
              </Button>
            </Paper>
          )}
        </Box>
        
        <Box sx={{ mt: 4, textAlign: 'center' }}>
          <Button 
            variant="text" 
            color="primary"
            onClick={() => navigate('/')}
          >
            Back to Home
          </Button>
        </Box>
      </Paper>
    </Container>
  );
};

export default Tutorial; 