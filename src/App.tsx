import { useEffect, useState } from 'react';
import { ActiveTab, PlayerProfile } from './types';
import {
  activatePlayerBoost,
  appendPlayerAchievement,
  createPlayerProfile,
  deletePlayerProfile,
  fetchAllPlayers,
  fetchPlayerById,
  preloadDefaultPlayers,
} from './services/api';
import Navbar from './components/Navbar';
import RedisConsoleModal from './components/RedisConsoleModal';
import HomePage from './pages/HomePage';
import AddPlayerPage from './pages/AddPlayerPage';
import PlayerDetailsPage from './pages/PlayerDetailsPage';

export default function App() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('home');
  const [players, setPlayers] = useState<PlayerProfile[]>([]);
  const [selectedPlayer, setSelectedPlayer] = useState<PlayerProfile | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isPreloading, setIsPreloading] = useState<boolean>(false);
  const [isInspectorOpen, setIsInspectorOpen] = useState<boolean>(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [boostingId, setBoostingId] = useState<string | null>(null);
  const [notification, setNotification] = useState<string | null>(null);

  const showNotification = (msg: string) => {
    setNotification(msg);
    setTimeout(() => {
      setNotification(null);
    }, 4000);
  };

  const loadPlayers = async () => {
    setIsLoading(true);
    try {
      const list = await fetchAllPlayers();
      setPlayers(list);

      // If database is empty on start, trigger initial preload
      if (list.length === 0) {
        const preloaded = await preloadDefaultPlayers();
        setPlayers(preloaded.players);
      }
    } catch (err) {
      console.error('Failed to load players:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadPlayers();
  }, []);

  const handlePreload = async () => {
    setIsPreloading(true);
    try {
      const res = await preloadDefaultPlayers();
      setPlayers(res.players);
      showNotification('Preloaded default 3 player profiles using Redis MSET command!');
    } catch (err: any) {
      showNotification(err.message || 'Failed to preload players');
    } finally {
      setIsPreloading(false);
    }
  };

  const handleAddPlayer = async (data: {
    id: string;
    username: string;
    level: number;
    highScore: number;
    achievements: string;
  }): Promise<PlayerProfile> => {
    const result = await createPlayerProfile(data);
    await loadPlayers();
    setActiveTab('home');
    showNotification(`Player ${result.player.id} stored in Redis using SET command!`);
    return result.player;
  };

  const handleBoostPlayer = async (id: string) => {
    setBoostingId(id);
    try {
      const res = await activatePlayerBoost(id, 'XP_MULTIPLIER_2X');
      showNotification(`Activated 60s temporary boost for ${id} using Redis SETEX command!`);

      // Update local state or refreshed player
      if (selectedPlayer && selectedPlayer.id === id) {
        setSelectedPlayer(res.player);
      }
      await loadPlayers();
    } catch (err: any) {
      showNotification(err.message || 'Failed to activate boost');
    } finally {
      setBoostingId(null);
    }
  };

  const handleAppendAchievement = async (id: string, achievement: string) => {
    const res = await appendPlayerAchievement(id, achievement);
    showNotification(`Appended achievement "${achievement}" using Redis APPEND command!`);
    setSelectedPlayer(res.player);
    await loadPlayers();
  };

  const handleDeletePlayer = async (id: string) => {
    setDeletingId(id);
    try {
      await deletePlayerProfile(id);
      showNotification(`Player ${id} deleted from Redis using DEL command!`);
      if (selectedPlayer && selectedPlayer.id === id) {
        setSelectedPlayer(null);
        setActiveTab('home');
      }
      await loadPlayers();
    } catch (err: any) {
      showNotification(err.message || 'Failed to delete player');
    } finally {
      setDeletingId(null);
    }
  };

  const handleSelectPlayer = async (p: PlayerProfile) => {
    try {
      const full = await fetchPlayerById(p.id);
      setSelectedPlayer(full);
    } catch {
      setSelectedPlayer(p);
    }
    setActiveTab('details');
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col font-sans selection:bg-emerald-500 selection:text-white">
      {/* Navbar */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onPreload={handlePreload}
        isPreloading={isPreloading}
        totalPlayersCount={players.length}
        openInspector={() => setIsInspectorOpen(true)}
      />

      {/* Floating Notification Toast */}
      {notification && (
        <div className="fixed bottom-6 right-6 z-40 bg-zinc-900 text-emerald-400 font-medium text-xs px-4 py-3 rounded-2xl shadow-2xl border border-emerald-500/40 flex items-center gap-2 animate-bounce">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
          <span>⚡ {notification}</span>
        </div>
      )}

      {/* Main View Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'home' && (
          <HomePage
            players={players}
            isLoading={isLoading}
            onRefresh={loadPlayers}
            onSelectPlayer={handleSelectPlayer}
            onBoostPlayer={handleBoostPlayer}
            onDeletePlayer={handleDeletePlayer}
            onPreload={handlePreload}
            onNavigateAdd={() => setActiveTab('add')}
            onOpenInspector={() => setIsInspectorOpen(true)}
            deletingId={deletingId}
            boostingId={boostingId}
          />
        )}

        {activeTab === 'add' && (
          <AddPlayerPage
            onAddPlayer={handleAddPlayer}
            onCancel={() => setActiveTab('home')}
          />
        )}

        {activeTab === 'details' && selectedPlayer && (
          <PlayerDetailsPage
            player={selectedPlayer}
            onBack={() => setActiveTab('home')}
            onBoost={handleBoostPlayer}
            onAppendAchievement={handleAppendAchievement}
            onDelete={handleDeletePlayer}
          />
        )}
      </main>

      {/* Redis Inspector Console Modal/Drawer */}
      <RedisConsoleModal
        isOpen={isInspectorOpen}
        onClose={() => setIsInspectorOpen(false)}
      />
    </div>
  );
}
