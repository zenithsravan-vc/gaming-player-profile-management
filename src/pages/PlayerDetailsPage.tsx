import { useEffect, useState, FormEvent } from 'react';
import { PlayerProfile } from '../types';
import { ArrowLeft, Award, Clock, Plus, Shield, Trash2, Trophy, User, Zap } from 'lucide-react';

interface PlayerDetailsPageProps {
  player: PlayerProfile;
  onBack: () => void;
  onBoost: (id: string) => Promise<void>;
  onAppendAchievement: (id: string, ach: string) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}

export default function PlayerDetailsPage({
  player,
  onBack,
  onBoost,
  onAppendAchievement,
  onDelete,
}: PlayerDetailsPageProps) {
  const [newAchInput, setNewAchInput] = useState('');
  const [isAppending, setIsAppending] = useState(false);
  const [isBoosting, setIsBoosting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [countdown, setCountdown] = useState<number>(player.boostTtlSeconds || 0);
  const [actionNotice, setActionNotice] = useState<{ msg: string; type: 'success' | 'info' } | null>(null);

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

  const handleGiveBoost = async () => {
    setIsBoosting(true);
    setActionNotice(null);
    try {
      await onBoost(player.id);
      setActionNotice({
        msg: `Redis SETEX executed successfully! 60-second boost key "boost:${player.id}" stored in Redis.`,
        type: 'success',
      });
    } catch (err: any) {
      setActionNotice({ msg: err.message || 'Failed to apply boost', type: 'info' });
    } finally {
      setIsBoosting(false);
    }
  };

  const handleAddAchievement = async (e: FormEvent) => {
    e.preventDefault();
    if (!newAchInput.trim()) return;

    setIsAppending(true);
    setActionNotice(null);
    try {
      await onAppendAchievement(player.id, newAchInput.trim());
      setActionNotice({
        msg: `Redis APPEND executed! Appended "${newAchInput.trim()}" directly onto key "player_data:${player.id}".`,
        type: 'success',
      });
      setNewAchInput('');
    } catch (err: any) {
      setActionNotice({ msg: err.message || 'Failed to append achievement', type: 'info' });
    } finally {
      setIsAppending(false);
    }
  };

  const handleDeletePlayer = async () => {
    if (!window.confirm(`Are you sure you want to delete player ${player.id} (${player.username}) from Redis?`)) {
      return;
    }

    setIsDeleting(true);
    try {
      await onDelete(player.id);
    } catch (err: any) {
      setActionNotice({ msg: err.message || 'Failed to delete player', type: 'info' });
      setIsDeleting(false);
    }
  };

  const hasBoost = countdown > 0;

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12">
      {/* Back Button */}
      <div className="flex items-center justify-between">
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 text-xs text-zinc-400 hover:text-zinc-200 transition-colors font-medium"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Players
        </button>

        <span className="text-xs font-mono text-emerald-400 bg-zinc-950 border border-zinc-800 px-3 py-1 rounded-full">
          Key: player_data:{player.id}
        </span>
      </div>

      {actionNotice && (
        <div
          className={`p-4 rounded-2xl text-xs font-medium border flex items-center justify-between ${
            actionNotice.type === 'success'
              ? 'bg-emerald-950/80 border-emerald-800 text-emerald-200'
              : 'bg-amber-950/80 border-amber-800 text-amber-200'
          }`}
        >
          <span>⚡ {actionNotice.msg}</span>
          <button
            onClick={() => setActionNotice(null)}
            className="text-zinc-400 hover:text-white text-xs font-bold px-2"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Main Profile Header Card */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 sm:p-8 shadow-2xl space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-zinc-800">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center text-white text-2xl font-bold shadow-lg">
              {player.username.charAt(0).toUpperCase()}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs font-bold text-emerald-400 bg-zinc-950 border border-zinc-800 px-2.5 py-0.5 rounded-md">
                  {player.id}
                </span>
                <h1 className="text-2xl font-extrabold text-zinc-100">{player.username}</h1>
              </div>
              <p className="text-xs text-zinc-400 mt-1 flex items-center gap-2">
                <span>Redis String Profile</span>
                <span>•</span>
                <span className="text-emerald-400 font-mono">GET player_data:{player.id}</span>
              </p>
            </div>
          </div>

          {/* Give Temporary Boost Action (SETEX) */}
          <div className="flex items-center gap-3">
            <button
              onClick={handleGiveBoost}
              disabled={isBoosting}
              className={`px-4 py-2.5 rounded-2xl text-xs font-bold flex items-center gap-2 shadow-md transition-all ${
                hasBoost
                  ? 'bg-amber-500 text-zinc-950 hover:bg-amber-400'
                  : 'bg-emerald-600 hover:bg-emerald-500 text-white'
              }`}
            >
              <Zap className="w-4 h-4 fill-current" />
              {isBoosting
                ? 'Executing SETEX...'
                : hasBoost
                ? `Re-Boost (Active ${countdown}s)`
                : 'Give Temporary Boost (SETEX)'}
            </button>

            <button
              onClick={handleDeletePlayer}
              disabled={isDeleting}
              className="p-2.5 rounded-2xl bg-red-950/40 border border-red-900/50 hover:bg-red-900/60 text-red-400 hover:text-red-200 transition-colors"
              title="Delete player from Redis using DEL"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-4 flex items-center gap-3">
            <div className="p-3 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold tracking-wider text-zinc-500 block">
                Player Level
              </span>
              <span className="text-lg font-extrabold text-zinc-100 font-mono">
                Level {player.level}
              </span>
            </div>
          </div>

          <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-4 flex items-center gap-3">
            <div className="p-3 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <Trophy className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold tracking-wider text-zinc-500 block">
                High Score
              </span>
              <span className="text-lg font-extrabold text-amber-300 font-mono">
                {player.highScore.toLocaleString()} pts
              </span>
            </div>
          </div>

          <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-4 flex items-center gap-3">
            <div className="p-3 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold tracking-wider text-zinc-500 block">
                Active 60s Boost
              </span>
              <span className="text-sm font-extrabold text-zinc-100 font-mono flex items-center gap-1">
                {hasBoost ? (
                  <span className="text-amber-300 flex items-center gap-1">
                    <Zap className="w-3.5 h-3.5 fill-amber-300" />
                    {countdown}s remaining
                  </span>
                ) : (
                  <span className="text-zinc-500">None Active</span>
                )}
              </span>
            </div>
          </div>
        </div>

        {/* Raw Redis Value Inspection Box */}
        <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-5 space-y-2 font-mono text-xs">
          <div className="flex items-center justify-between text-emerald-400 font-bold">
            <span className="flex items-center gap-1.5">
              <User className="w-4 h-4" />
              Raw Redis Key & String Value
            </span>
            <span className="text-[11px] text-zinc-500">Redis GET</span>
          </div>

          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-3 text-zinc-200 select-all space-y-1">
            <div className="text-zinc-500 text-[11px]">Key: player_data:{player.id}</div>
            <div className="text-emerald-300 font-bold break-all">
              {player.rawString || `${player.id}|${player.username}|${player.level}|${player.highScore}|${player.achievements.join(',')}`}
            </div>
          </div>
        </div>

        {/* Achievements Section & APPEND Form */}
        <div className="space-y-4 pt-2">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-zinc-100 flex items-center gap-2">
              <Award className="w-4 h-4 text-emerald-400" />
              Unlocked Achievements ({player.achievements.length})
            </h3>
            <span className="text-xs text-emerald-400 font-mono">APPEND Command</span>
          </div>

          <div className="flex flex-wrap gap-2">
            {player.achievements.length > 0 ? (
              player.achievements.map((ach, i) => (
                <span
                  key={i}
                  className="px-3 py-1.5 rounded-xl bg-zinc-950 border border-zinc-800 text-zinc-200 font-medium text-xs flex items-center gap-1.5"
                >
                  <Award className="w-3.5 h-3.5 text-emerald-400" />
                  {ach}
                </span>
              ))
            ) : (
              <p className="text-xs text-zinc-500 italic">No achievements unlocked yet.</p>
            )}
          </div>

          {/* Form to append achievement using APPEND */}
          <form onSubmit={handleAddAchievement} className="pt-2 flex items-center gap-2">
            <input
              type="text"
              placeholder="Enter new achievement (e.g. High Jumper)..."
              value={newAchInput}
              onChange={(e) => setNewAchInput(e.target.value)}
              className="flex-1 bg-zinc-950 border border-zinc-800 focus:border-emerald-500 rounded-xl px-4 py-2.5 text-xs text-zinc-100 placeholder-zinc-600 outline-none transition-colors"
            />
            <button
              type="submit"
              disabled={isAppending || !newAchInput.trim()}
              className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-md flex items-center gap-1.5 transition-all disabled:opacity-50"
              title="Executes Redis APPEND command to append string onto player profile key"
            >
              <Plus className="w-4 h-4" />
              {isAppending ? 'Appending...' : 'Append (APPEND)'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
