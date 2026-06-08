import { Routes, Route } from 'react-router-dom'
import { useState, useEffect } from 'react'
import UserContext from './contexts/UserContext'
import HomePage from './pages/HomePage'
import LoginPage from './pages/LoginPage'
import GamePage from './pages/GamePage'
import LeaderboardPage from './pages/LeaderboardPage'
import Navbar from './components/Navbar'
import ProtectedRoute from './components/ProtectedRoute'
import { getCurrentUser } from './api/api'

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getCurrentUser()
      .then(u => setUser(u))
      .catch(() => setUser(null))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return null;

  return (
    <UserContext.Provider value={{ user, setUser }}>
      <Navbar />
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/play" element={
          <ProtectedRoute>
            <GamePage />
          </ProtectedRoute>
        } />
        <Route path="/leaderboard" element={
          <ProtectedRoute>
            <LeaderboardPage />
          </ProtectedRoute>
        } />
      </Routes>
    </UserContext.Provider>
  );
}

export default App;