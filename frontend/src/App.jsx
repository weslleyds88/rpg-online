import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Layout from './components/Layout';
import AuthPage from './pages/AuthPage';
import Home from './pages/Home';
import CreatePlayer from './pages/CreatePlayer';
import PlayerList from './pages/PlayerList';
import PlayerDetails from './pages/PlayerDetails';
import QuestList from './pages/QuestList';
import DiceRoller from './pages/DiceRoller';
import Inventory from './pages/Inventory';
import AdminPanel from './pages/AdminPanel';
import GameRoom from './pages/GameRoom';
import RoomList from './pages/RoomList';
import './index.css';

// Componente para rotas protegidas
const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-rpg-darker flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-rpg-gold mx-auto mb-4"></div>
          <p className="text-gray-400">Carregando...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <AuthPage />;
  }

  return children;
};

// Componente principal da aplicação
const AppContent = () => {
  const { user } = useAuth();

  if (!user) {
    return <AuthPage />;
  }

  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/create-player" element={<CreatePlayer />} />
        <Route path="/players" element={<PlayerList />} />
        <Route path="/players/:id" element={<PlayerDetails />} />
        <Route path="/quests" element={<QuestList />} />
        <Route path="/dice" element={<DiceRoller />} />
        <Route path="/inventory" element={<Inventory />} />
        <Route path="/admin" element={<AdminPanel />} />
        <Route path="/rooms" element={<RoomList />} />
        <Route path="/room/:id" element={<GameRoom />} />
      </Routes>
    </Layout>
  );
};

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;