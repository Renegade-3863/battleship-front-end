import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ThemeProvider, CssBaseline } from '@mui/material';
import theme from './theme';
import MainLayout from './components/layout/MainLayout';
import { AuthProvider } from './context/AuthContext';

// Pages
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import Profile from './pages/Profile';
import Play from './pages/Play';
import Tutorial from './pages/Tutorial';
import Game from './pages/Game';
import NotFound from './pages/NotFound';

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Router>
        <AuthProvider>
          <MainLayout>
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/profile" element={<Profile />} />
              <Route path="/play" element={<Play />} />
              <Route path="/tutorial" element={<Tutorial />} />
              <Route path="/game" element={<Game />} />
              <Route path="/game/:gameId" element={<Game />} />
              <Route path="/join/:gameId" element={<Play />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </MainLayout>
        </AuthProvider>
      </Router>
    </ThemeProvider>
  );
}

export default App;
