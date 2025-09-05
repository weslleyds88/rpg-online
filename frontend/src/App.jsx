import { Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Home from './pages/Home';
import CreatePlayer from './pages/CreatePlayer';
import PlayerList from './pages/PlayerList';
import PlayerDetails from './pages/PlayerDetails';
import QuestList from './pages/QuestList';
import Inventory from './pages/Inventory';
import AdminPanel from './pages/AdminPanel';
import DiceRoller from './pages/DiceRoller';
import RoomList from './pages/RoomList';
import GameRoom from './pages/GameRoom';

function App() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/create-player" element={<CreatePlayer />} />
        <Route path="/players" element={<PlayerList />} />
        <Route path="/players/:id" element={<PlayerDetails />} />
        <Route path="/quests" element={<QuestList />} />
        <Route path="/inventory/:playerId" element={<Inventory />} />
        <Route path="/admin" element={<AdminPanel />} />
        <Route path="/dice" element={<DiceRoller />} />
        <Route path="/rooms" element={<RoomList />} />
        <Route path="/room/:roomId" element={<GameRoom />} />
      </Routes>
    </Layout>
  );
}

export default App;
