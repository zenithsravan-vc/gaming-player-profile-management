import { ActiveTab } from '../types';
import {
  Database,
  Gamepad2,
  Plus,
  Terminal,
  Users,
  Zap,
} from 'lucide-react';

interface NavbarProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  onPreload: () => void;
  isPreloading: boolean;
  totalPlayersCount: number;
  openInspector: () => void;
  openMongoInspector: () => void;
}

export default function Navbar({
  activeTab,
  setActiveTab,
  onPreload,
  isPreloading,
  totalPlayersCount,
  openInspector,
openMongoInspector,
}: NavbarProps) {
  return (
    <header className="bg-zinc-900/90 backdrop-blur-md border-b border-zinc-800 text-zinc-100 sticky top-0 z-30 shadow-xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Brand Name */}
          <div
            className="flex items-center space-x-3 cursor-pointer group"
            onClick={() => setActiveTab('home')}
          >
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 via-teal-500 to-emerald-400 p-0.5 shadow-lg group-hover:scale-105 transition-transform">
              <div className="w-full h-full bg-zinc-950 rounded-[10px] flex items-center justify-center">
                <Gamepad2 className="w-5 h-5 text-emerald-400" />
              </div>
            </div>
            <div>
              <h1 className="text-base font-bold text-zinc-100 leading-tight tracking-tight">
                Gaming Player Profiles
              </h1>
              <p className="text-xs text-emerald-400 font-mono flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                Redis Strings Engine
              </p>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="hidden md:flex items-center space-x-1.5">
            <button
              onClick={() => setActiveTab('home')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all ${
                activeTab === 'home' || activeTab === 'details'
                  ? 'bg-zinc-800 text-emerald-400 border border-zinc-700/80 shadow-sm'
                  : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50'
              }`}
            >
              <Users className="w-4 h-4" />
              Players
              <span className="ml-1 px-2 py-0.5 text-[11px] rounded-full bg-zinc-950/80 text-emerald-400 border border-zinc-800 font-mono">
                {totalPlayersCount}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('add')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all ${
                activeTab === 'add'
                  ? 'bg-zinc-800 text-emerald-400 border border-zinc-700/80 shadow-sm'
                  : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50'
              }`}
            >
              <Plus className="w-4 h-4 text-emerald-400" />
              Add Player
            </button>

            <button
              onClick={openInspector}
              className="flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold text-amber-300 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 transition-all"
            >
              <Terminal className="w-4 h-4 text-amber-400" />
              Redis Inspector
            </button>
	    <button
              onClick={openMongoInspector}
              className="flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold text-green-300 bg-green-500/10 hover:bg-green-500/20 border border-green-500/30 transition-all"
            >
              <Database className="w-4 h-4 text-green-400" />
              MongoDB Inspector
            </button>
          </nav>

          {/* Action Buttons */}
          <div className="flex items-center gap-2">
            <button
              onClick={onPreload}
              disabled={isPreloading}
              className="flex items-center gap-1.5 text-xs font-semibold px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white shadow-md transition-all disabled:opacity-50"
              title="Executes Redis MSET to store default player profiles"
            >
              <Zap className="w-3.5 h-3.5 text-amber-300" />
              {isPreloading ? 'MSET Preloading...' : 'Preload Players (MSET)'}
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
