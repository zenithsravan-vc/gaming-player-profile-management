import { useState, FormEvent } from 'react';
import { PlayerProfile } from '../types';
import { ArrowLeft, Award, CheckCircle2, Shield, Sparkles, Trophy, User } from 'lucide-react';

interface AddPlayerPageProps {
  onAddPlayer: (data: {
    id: string;
    username: string;
    level: number;
    highScore: number;
    achievements: string;
  }) => Promise<PlayerProfile>;
  onCancel: () => void;
}

export default function AddPlayerPage({ onAddPlayer, onCancel }: AddPlayerPageProps) {
  const [id, setId] = useState('P004');
  const [username, setUsername] = useState('VortexGamer');
  const [level, setLevel] = useState<number>(12);
  const [highScore, setHighScore] = useState<number>(8900);
  const [achievements, setAchievements] = useState('Quick Learner, First Win');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Live calculation of Redis String payload
  const cleanId = id.trim().toUpperCase() || 'P00X';
  const cleanUsername = username.trim() || 'Username';
  const cleanAchs = achievements
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)
    .join(',');

  const liveRedisKey = `player_data:${cleanId}`;
  const liveRedisValue = `${cleanId}|${cleanUsername}|${level || 1}|${highScore || 0}|${cleanAchs}`;
  const liveRedisCommand = `SET ${liveRedisKey} "${liveRedisValue}"`;

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!id.trim()) {
      setErrorMsg('Player ID is required (e.g., P004).');
      return;
    }
    if (!username.trim()) {
      setErrorMsg('Username is required.');
      return;
    }

    setIsSubmitting(true);
    try {
      await onAddPlayer({
        id: id.trim().toUpperCase(),
        username: username.trim(),
        level: Number(level) || 1,
        highScore: Number(highScore) || 0,
        achievements,
      });
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to create player profile in Redis');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6 pb-12">
      {/* Top Header */}
      <div className="flex items-center justify-between">
        <button
          onClick={onCancel}
          className="flex items-center gap-1.5 text-xs text-zinc-400 hover:text-zinc-200 transition-colors font-medium"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Players
        </button>

        <div className="text-xs text-emerald-400 font-mono flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
          Redis Operation: SET
        </div>
      </div>

      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 sm:p-8 shadow-2xl space-y-6">
        <div>
          <h2 className="text-xl font-extrabold text-zinc-100 tracking-tight">
            Add New Player Profile
          </h2>
          <p className="text-xs text-zinc-400 mt-1">
            Fills out profile parameters and stores them into Redis as a pipe-delimited String via <code className="text-amber-300 font-mono">SET</code>.
          </p>
        </div>

        {errorMsg && (
          <div className="p-3.5 rounded-xl bg-red-950/60 border border-red-800/80 text-red-200 text-xs font-medium">
            ⚠️ {errorMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Player ID Field */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-zinc-300 flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-emerald-400" />
                Player ID <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                value={id}
                onChange={(e) => setId(e.target.value)}
                placeholder="e.g. P004"
                required
                className="w-full bg-zinc-950 border border-zinc-800 focus:border-emerald-500 rounded-xl px-3.5 py-2.5 text-xs text-zinc-100 font-mono placeholder-zinc-600 outline-none transition-colors"
              />
              <p className="text-[10px] text-zinc-500">Used for Redis key: player_data:&lt;ID&gt;</p>
            </div>

            {/* Username Field */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-zinc-300 flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-emerald-400" />
                Username <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="e.g. VortexGamer"
                required
                className="w-full bg-zinc-950 border border-zinc-800 focus:border-emerald-500 rounded-xl px-3.5 py-2.5 text-xs text-zinc-100 placeholder-zinc-600 outline-none transition-colors"
              />
            </div>

            {/* Level Field */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-zinc-300 flex items-center gap-1.5">
                <Shield className="w-3.5 h-3.5 text-emerald-400" />
                Level
              </label>
              <input
                type="number"
                min="1"
                max="999"
                value={level}
                onChange={(e) => setLevel(parseInt(e.target.value, 10) || 1)}
                className="w-full bg-zinc-950 border border-zinc-800 focus:border-emerald-500 rounded-xl px-3.5 py-2.5 text-xs text-zinc-100 font-mono outline-none transition-colors"
              />
            </div>

            {/* High Score Field */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-zinc-300 flex items-center gap-1.5">
                <Trophy className="w-3.5 h-3.5 text-amber-400" />
                High Score
              </label>
              <input
                type="number"
                min="0"
                value={highScore}
                onChange={(e) => setHighScore(parseInt(e.target.value, 10) || 0)}
                className="w-full bg-zinc-950 border border-zinc-800 focus:border-emerald-500 rounded-xl px-3.5 py-2.5 text-xs text-zinc-100 font-mono outline-none transition-colors"
              />
            </div>
          </div>

          {/* Achievements Field */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-zinc-300 flex items-center gap-1.5">
              <Award className="w-3.5 h-3.5 text-emerald-400" />
              Achievements (Comma Separated)
            </label>
            <input
              type="text"
              value={achievements}
              onChange={(e) => setAchievements(e.target.value)}
              placeholder="e.g. First Win, Level Master, Quick Learner"
              className="w-full bg-zinc-950 border border-zinc-800 focus:border-emerald-500 rounded-xl px-3.5 py-2.5 text-xs text-zinc-100 placeholder-zinc-600 outline-none transition-colors"
            />
            <p className="text-[10px] text-zinc-500">
              Multiple achievements will be separated by commas inside the Redis String.
            </p>
          </div>

          {/* Live Redis String Preview Card */}
          <div className="bg-zinc-950 border border-emerald-500/30 rounded-2xl p-4 space-y-2 font-mono text-xs shadow-inner">
            <div className="flex items-center justify-between text-[11px] text-amber-400 font-bold">
              <span>⚡ Redis SET Command Payload Preview</span>
              <span>String Spec</span>
            </div>

            <div className="p-3 bg-zinc-900 rounded-xl border border-zinc-800 text-zinc-200 space-y-1">
              <div>
                <span className="text-zinc-500">Key: </span>
                <span className="text-emerald-400 font-bold">{liveRedisKey}</span>
              </div>
              <div className="break-all">
                <span className="text-zinc-500">Value: </span>
                <span className="text-emerald-300">{liveRedisValue}</span>
              </div>
            </div>

            <div className="text-[10px] text-amber-300/80 italic">
              Raw Command: <code className="text-zinc-100">{liveRedisCommand}</code>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="pt-2 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onCancel}
              className="px-5 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-semibold transition-colors"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-md flex items-center gap-2 transition-all disabled:opacity-50"
            >
              <CheckCircle2 className="w-4 h-4" />
              {isSubmitting ? 'Storing in Redis (SET)...' : 'Store Player Profile (SET)'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
