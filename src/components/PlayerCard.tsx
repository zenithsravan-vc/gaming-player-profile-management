import { useEffect, useState } from 'react';
import { PlayerProfile } from '../types';
import { Award, Shield, Trash2, Trophy, Zap } from 'lucide-react';

interface PlayerCardProps {
  key?: string;
  player: PlayerProfile;
  onSelect: (player: PlayerProfile) => void;
  onBoost: (id: string) => void;
  onDelete: (id: string) => void;
  isDeleting?: boolean;
  isBoosting?: boolean;
}

export default function PlayerCard({
  player,
  onSelect,
  onBoost,
  onDelete,
  isDeleting,
  isBoosting,
}: PlayerCardProps) {
  const [countdown, setCountdown] = useState<number>(player.boostTtlSeconds || 0);

  useEffect(() => {
    setCountdown(player.boostTtlSeconds || 0);
  }, [player.boostTtlSeconds]);

  useEffect(() => {
    if (countdown <= 0) return;
    const interval = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [countdown]);

  const hasBoost = countdown > 0;

  return (
    <div className="bg-zinc-900 border border-zinc-800 hover:border-emerald-500/50 rounded-2xl p-5 shadow-xl transition-all duration-200 flex flex-col justify-between group relative overflow-hidden">
      {/* Background Subtle Accent Glow */}
      <div className="absolute -right-10 -top-10 w-28 h-28 bg-emerald-500/5 rounded-full blur-2xl group-hover:bg-emerald-500/15 transition-all pointer-events-none"></div>

      <div>
        {/* Top Header: ID, Username & Boost Badge */}
        <div className="flex items-start justify-between gap-2 mb-3">
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs font-bold text-emerald-400 bg-zinc-950 border border-zinc-800 px-2.5 py-1 rounded-md">
              {player.id}
            </span>
            <h3 className="text-lg font-bold text-zinc-100 tracking-tight truncate max-w-[160px]">
              {player.username}
            </h3>
          </div>

          {/* Temporary Boost Badge (SETEX 60s) */}
          {hasBoost ? (
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-300 text-xs font-semibold animate-pulse shadow-sm">
              <Zap className="w-3.5 h-3.5 fill-amber-300 text-amber-400" />
              <span>Boosted ({countdown}s)</span>
            </div>
          ) : (
            <span className="text-[11px] text-zinc-500 font-mono">SETEX Available</span>
          )}
        </div>

        {/* Level and High Score Grid */}
        <div className="grid grid-cols-2 gap-2 mb-4">
          <div className="bg-zinc-950/80 border border-zinc-800/80 rounded-xl p-2.5 flex items-center gap-2">
            <Shield className="w-4 h-4 text-emerald-400 shrink-0" />
            <div>
              <span className="text-[10px] uppercase font-bold tracking-wider text-zinc-500 block">
                Level
              </span>
              <span className="text-sm font-extrabold text-zinc-100 font-mono">
                Lvl {player.level}
              </span>
            </div>
          </div>

          <div className="bg-zinc-950/80 border border-zinc-800/80 rounded-xl p-2.5 flex items-center gap-2">
            <Trophy className="w-4 h-4 text-amber-400 shrink-0" />
            <div>
              <span className="text-[10px] uppercase font-bold tracking-wider text-zinc-500 block">
                High Score
              </span>
              <span className="text-sm font-extrabold text-amber-300 font-mono">
                {player.highScore.toLocaleString()}
              </span>
            </div>
          </div>
        </div>

        {/* Achievements Tags */}
        <div className="mb-4">
          <div className="flex items-center justify-between text-xs text-zinc-400 mb-1.5">
            <span className="flex items-center gap-1 text-[11px] font-semibold uppercase tracking-wider text-zinc-400">
              <Award className="w-3 h-3 text-emerald-400" />
              Achievements ({player.achievements.length})
            </span>
            <span className="text-[10px] font-mono text-emerald-400/80">APPEND API</span>
          </div>

          {player.achievements.length > 0 ? (
            <div className="flex flex-wrap gap-1.5 max-h-20 overflow-y-auto pr-1">
              {player.achievements.map((ach, idx) => (
                <span
                  key={idx}
                  className="px-2 py-0.5 rounded-md text-xs bg-zinc-950 border border-zinc-800 text-zinc-300 font-medium truncate max-w-[150px]"
                >
                  {ach}
                </span>
              ))}
            </div>
          ) : (
            <p className="text-xs text-zinc-500 italic">No achievements unlocked yet.</p>
          )}
        </div>

        {/* Raw Redis String Value Box */}
        <div className="bg-zinc-950 border border-zinc-800/90 rounded-xl p-2.5 mb-4 text-xs font-mono">
          <div className="flex items-center justify-between text-[10px] text-zinc-400 mb-1">
            <span className="text-emerald-400 font-bold">Key: player_data:{player.id}</span>
            <span className="text-zinc-500 font-semibold">Redis String</span>
          </div>
          <div className="text-zinc-300 truncate select-all bg-zinc-900/90 px-2 py-1 rounded border border-zinc-800">
            {player.rawString || `${player.id}|${player.username}|${player.level}|${player.highScore}|${player.achievements.join(',')}`}
          </div>
        </div>
      </div>

      {/* Action Footer Buttons */}
      <div className="pt-2 border-t border-zinc-800/80 flex items-center justify-between gap-2">
        <button
          onClick={() => onSelect(player)}
          className="flex-1 py-2 px-3 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 rounded-xl text-xs font-semibold transition-colors"
        >
          View Details
        </button>

        <button
          onClick={() => onBoost(player.id)}
          disabled={isBoosting}
          className={`py-2 px-3 rounded-xl text-xs font-semibold flex items-center gap-1 border transition-colors ${
            hasBoost
              ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 hover:bg-amber-500/30'
              : 'bg-zinc-800 text-amber-300 border-zinc-700 hover:bg-zinc-700/80'
          }`}
          title="Applies temporary 60-second boost using Redis SETEX"
        >
          <Zap className="w-3.5 h-3.5" />
          {hasBoost ? 'Re-Boost' : 'Boost (SETEX)'}
        </button>

        <button
          onClick={() => onDelete(player.id)}
          disabled={isDeleting}
          className="p-2 text-zinc-500 hover:text-red-400 hover:bg-red-950/40 border border-transparent hover:border-red-900/50 rounded-xl transition-colors"
          title="Deletes player profile using Redis DEL"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
