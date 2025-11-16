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
import SetPieceSpecialists from './pages/SetPieceSpecialists';
import AdminPanel from './pages/AdminPanel';
import ProtectedRoute from './components/common/ProtectedRoute';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/login" />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignupPage />} />
        <Route path="/home" element={<ProtectedRoute><HomePage /></ProtectedRoute>} />
        <Route path="/about" element={<ProtectedRoute><AboutPage /></ProtectedRoute>} />
        <Route path="/faqs" element={<ProtectedRoute><FAQsPage /></ProtectedRoute>} />
        <Route path="/player-stats" element={<ProtectedRoute><PlayerStats /></ProtectedRoute>} />
        <Route path="/player-stats/:id" element={<ProtectedRoute><PlayerDetails /></ProtectedRoute>} />
        <Route path="/compare" element={<ProtectedRoute><ComparePlayers /></ProtectedRoute>} />
        <Route path="/top-players" element={<ProtectedRoute><TopPlayers /></ProtectedRoute>} />
        <Route path="/shortlist" element={<ProtectedRoute><PlayerShortlist /></ProtectedRoute>} />
        <Route path="/set-piece-specialists" element={<ProtectedRoute><SetPieceSpecialists /></ProtectedRoute>} />
        <Route path="/admin" element={<AdminPanel />} />
        <Route path="/forgot-password" element={<LoginPage />} /> {/* Placeholder */}
        <Route path="*" element={<Navigate to="/login" />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;