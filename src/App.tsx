import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';

import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';
import HomePage from './pages/HomePage';
import AboutPage from './pages/AboutPage';
import FAQsPage from './pages/FAQsPage';
import PlayerStats from './pages/LeagueStats';
import PlayerDetails from './pages/PlayerDetails';
import ComparePlayers from './pages/ComparePlayers';
import TopPlayers from './pages/TopPlayers';
import PlayerShortlist from './pages/PlayerShortlist';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/login" />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignupPage />} />
        <Route path="/home" element={<HomePage />} />
        <Route path="/about" element={<AboutPage />} />
        <Route path="/faqs" element={<FAQsPage />} />
        <Route path="/player-stats" element={<PlayerStats />} />
        <Route path="/player-stats/:id" element={<PlayerDetails />} />
        <Route path="/compare" element={<ComparePlayers />} />
        <Route path="/top-players" element={<TopPlayers />} />
        <Route path="/shortlist" element={<PlayerShortlist />} />
        <Route path="/forgot-password" element={<LoginPage />} /> {/* Placeholder */}
        <Route path="*" element={<Navigate to="/login" />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;