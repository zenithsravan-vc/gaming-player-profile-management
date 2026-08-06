import { useState } from 'react';
import { PlayerProfile } from '../types';
import PlayerCard from '../components/PlayerCard';
import { Database, Plus, RefreshCw, Search, Sparkles, Terminal, Users, Zap } from 'lucide-react';

interface HomePageProps {
  players: PlayerProfile[];
  isLoading: boolean;
  onRefresh: () => void;
  onSelectPlayer: (player: PlayerProfile) => void;
  onBoostPlayer: (id: string) => void;
  onDeletePlayer: (id: string) => void;
  onPreload: () => void;
  onNavigateAdd: () => void;
  onOpenInspector: () => void;
  deletingId?: string | null;
  boostingId?: string | null;
}

export default function HomePage({
  players,
  isLoading,
  onRefresh,
  onSelectPlayer,
  onBoostPlayer,
  onDeletePlayer,
  onPreload,
  onNavigateAdd,
  onOpenInspector,
  deletingId,
  boostingId,
}: HomePageProps) {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredPlayers = players.filter((p) => {
    const term = searchTerm.toLowerCase().trim();
    if (!term) return true;
    return (
      p.id.toLowerCase().includes(term) ||
      p.username.toLowerCase().includes(term) ||
      p.achievements.some((a) => a.toLowerCase().includes(term))
    );
  });

  return (
    <div className="space-y-8 pb-12">
      {/* Hero Overview Header */}
      <div className="relative bg-zinc-900 border border-zinc-800 rounded-2xl p-6 sm:p-8 shadow-2xl overflow-hidden">
        {/* Background Decorative Accent Elements */}
        <div className="absolute right-0 top-0 translate-x-12 -translate-y-12 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute left-1/3 bottom-0 w-48 h-48 bg-teal-500/10 rounded-full blur-2xl pointer-events-none"></div>

        <div className="relative z-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
          <div className="max-w-2xl space-y-3">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-semibold">
              <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
              Redis Strings Storage Protocol
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold text-zinc-100 tracking-tight leading-tight">
              Gaming Player Profiles
            </h1>

            <p className="text-sm text-zinc-300 leading-relaxed">
              Every player profile is persisted directly inside Redis using standard String data types:
              <br />
              <code className="text-amber-300 font-mono text-xs bg-zinc-950/90 px-2.5 py-1.5 rounded-lg border border-zinc-800 inline-block mt-1.5 shadow-inner">
                Key: player_data:P001 &nbsp;|&nbsp; Value: P001|GamerX|15|9800|First Win,Level Master
              </code>
            </p>

            <div className="flex flex-wrap items-center gap-2.5 pt-2 text-xs font-mono">
              <span className="px-2.5 py-1 rounded-lg bg-zinc-950 border border-zinc-800 text-zinc-300 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                SET / GET
              </span>
              <span className="px-2.5 py-1 rounded-lg bg-zinc-950 border border-zinc-800 text-zinc-300 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-teal-400"></span>
                MSET (Preload)
              </span>
              <span className="px-2.5 py-1 rounded-lg bg-zinc-950 border border-zinc-800 text-zinc-300 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-amber-400"></span>
                SETEX (60s Boost)
              </span>
              <span className="px-2.5 py-1 rounded-lg bg-zinc-950 border border-zinc-800 text-zinc-300 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                APPEND (Achievements)
              </span>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <button
              onClick={onPreload}
              disabled={isLoading}
              className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs shadow-md flex items-center gap-2 transition-all"
            >
              <Zap className="w-4 h-4 text-amber-300" />
              Preload Default Players (MSET)
            </button>

            <button
              onClick={onOpenInspector}
              className="px-4 py-2.5 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 font-semibold text-xs flex items-center gap-2 transition-all"
            >
              <Terminal className="w-4 h-4 text-amber-400" />
              Redis Inspector
            </button>
          </div>
        </div>
      </div>

      {/* Control Bar: Search & Actions */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        {/* Search Input Filter */}
        <div className="relative w-full sm:w-96">
          <Search className="w-4 h-4 text-zinc-500 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            placeholder="Search by Player ID (P001), Username, or Achievement..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-zinc-900 border border-zinc-800 focus:border-emerald-500 rounded-xl pl-10 pr-4 py-2.5 text-xs text-zinc-100 placeholder-zinc-500 outline-none transition-colors"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-zinc-500 hover:text-zinc-300"
            >
              Clear
            </button>
          )}
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
          <button
            onClick={onRefresh}
            disabled={isLoading}
            className="p-2.5 rounded-xl bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 text-zinc-300 text-xs transition-colors flex items-center gap-1.5"
            title="Refresh player profiles from Redis"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-emerald-400' : ''}`} />
            <span className="hidden sm:inline">Refresh</span>
          </button>

          <button
            onClick={onNavigateAdd}
            className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-md flex items-center gap-1.5 transition-all"
          >
            <Plus className="w-4 h-4" />
            Add Player (SET)
          </button>
        </div>
      </div>

      {/* Players List Grid */}
      {isLoading && players.length === 0 ? (
        <div className="text-center py-16 bg-zinc-900/60 border border-zinc-800/80 rounded-2xl">
          <Database className="w-10 h-10 text-emerald-400 mx-auto mb-3 animate-pulse" />
          <p className="text-sm text-zinc-300 font-medium">Fetching Redis Player Keys...</p>
          <p className="text-xs text-zinc-500 mt-1">Executing Redis KEYS player_data:* & GET commands</p>
        </div>
      ) : filteredPlayers.length === 0 ? (
        <div className="text-center py-16 bg-zinc-900/60 border border-zinc-800/80 rounded-2xl space-y-4">
          <Users className="w-12 h-12 text-zinc-600 mx-auto" />
          <div className="space-y-1 max-w-sm mx-auto">
            <h3 className="text-base font-bold text-zinc-100">
              {searchTerm ? 'No Players Matched Your Search' : 'No Players Found in Redis'}
            </h3>
            <p className="text-xs text-zinc-400">
              {searchTerm
                ? `No profile keys matched "${searchTerm}". Try clearing the search.`
                : 'Your Redis storage is currently empty. Click below to preload default profiles.'}
            </p>
          </div>

          <div className="pt-2 flex justify-center gap-3">
            {searchTerm ? (
              <button
                onClick={() => setSearchTerm('')}
                className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 rounded-xl text-xs font-semibold"
              >
                Clear Search Filter
              </button>
            ) : (
              <button
                onClick={onPreload}
                className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-semibold shadow-md flex items-center gap-2"
              >
                <Zap className="w-4 h-4 text-amber-300" />
                Preload Default Players (MSET)
              </button>
            )}
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredPlayers.map((player) => (
            <PlayerCard
              key={player.id}
              player={player}
              onSelect={onSelectPlayer}
              onBoost={onBoostPlayer}
              onDelete={onDeletePlayer}
              isDeleting={deletingId === player.id}
              isBoosting={boostingId === player.id}
            />
          ))}
        </div>
      )}
    </div>
  );
}
