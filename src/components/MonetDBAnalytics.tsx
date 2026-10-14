
import { useEffect, useState } from 'react';
import { Database, RefreshCw, Trophy, Target, X } from 'lucide-react';

interface PlayerAnalytics {
  player_id: string;
  username: string;
  matches_played: number;
  score: number;
  wins: number;
}

interface Props {
  onClose: () => void;
}

export default function MonetDBAnalytics({ onClose }: Props) {
  const [players, setPlayers] = useState<PlayerAnalytics[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  async function loadAnalytics() {
    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/monetdb/analytics');
      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Failed to load analytics');
      }

      const data = result.analytics;

      if (!Array.isArray(data?.data)) {
        throw new Error('Unexpected analytics response format');
      }

      setPlayers(
        data.data.map((row: unknown[]) => ({
          player_id: String(row[0]),
          username: String(row[1]),
          matches_played: Number(row[2]),
          score: Number(row[3]),
          wins: Number(row[4]),
        }))
      );
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to load MonetDB analytics'
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadAnalytics();
  }, []);

  const totalMatches = players.reduce(
    (total, player) => total + player.matches_played,
    0
  );

  const totalWins = players.reduce(
    (total, player) => total + player.wins,
    0
  );

  const topPlayer = players.length
    ? [...players].sort((a, b) => b.score - a.score)[0]
    : undefined;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-2xl border border-zinc-800 bg-zinc-900 shadow-2xl">
        <div className="sticky top-0 z-10 flex items-center justify-between gap-4 border-b border-zinc-800 bg-zinc-950 p-5">
          <div className="flex items-center gap-3">
            <Database className="h-6 w-6 text-violet-400" />
            <div>
              <h2 className="text-lg font-bold text-zinc-100">
                MonetDB Analytics
              </h2>
              <p className="text-xs text-zinc-400">
                SQL-powered player performance reports
              </p>
            </div>
          </div>

          <div className="flex gap-2">
            <button
              onClick={loadAnalytics}
              disabled={loading}
              title="Refresh analytics"
              className="rounded-lg bg-zinc-800 p-2 text-zinc-300 hover:bg-zinc-700"
            >
              <RefreshCw
                className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`}
              />
            </button>

            <button
              onClick={onClose}
              aria-label="Close"
              className="rounded-lg bg-zinc-800 p-2 text-zinc-300 hover:bg-zinc-700"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        <div className="space-y-5 p-5">
          {loading ? (
            <p className="py-10 text-center text-sm text-zinc-400">
              Loading analytics from MonetDB...
            </p>
          ) : error ? (
            <div className="rounded-xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-300">
              {error}
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                <div className="rounded-xl border border-zinc-800 bg-zinc-950 p-4">
                  <Database className="mb-3 h-5 w-5 text-violet-400" />
                  <p className="text-2xl font-bold text-zinc-100">
                    {players.length}
                  </p>
                  <p className="text-xs text-zinc-400">Players Analysed</p>
                </div>

                <div className="rounded-xl border border-zinc-800 bg-zinc-950 p-4">
                  <Target className="mb-3 h-5 w-5 text-cyan-400" />
                  <p className="text-2xl font-bold text-zinc-100">
                    {totalMatches.toLocaleString()}
                  </p>
                  <p className="text-xs text-zinc-400">Total Matches</p>
                </div>

                <div className="rounded-xl border border-zinc-800 bg-zinc-950 p-4">
                  <Trophy className="mb-3 h-5 w-5 text-amber-400" />
                  <p className="text-2xl font-bold text-zinc-100">
                    {totalWins.toLocaleString()}
                  </p>
                  <p className="text-xs text-zinc-400">Total Wins</p>
                </div>
              </div>

              {topPlayer && (
                <div className="rounded-xl border border-violet-500/20 bg-violet-500/5 p-4">
                  <p className="text-xs text-violet-300">TOP SCORER</p>
                  <p className="mt-1 text-lg font-bold text-zinc-100">
                    {topPlayer.username}
                  </p>
                  <p className="text-sm text-zinc-400">
                    {topPlayer.score.toLocaleString()} points
                  </p>
                </div>
              )}

              <div className="overflow-x-auto rounded-xl border border-zinc-800">
                <table className="w-full min-w-[600px] text-left text-sm">
                  <thead className="bg-zinc-950 text-xs uppercase text-zinc-400">
                    <tr>
                      <th className="p-3">Player</th>
                      <th className="p-3">Matches</th>
                      <th className="p-3">Score</th>
                      <th className="p-3">Wins</th>
                      <th className="p-3">Win Rate</th>
                    </tr>
                  </thead>

                  <tbody>
                    {players.map((player) => (
                      <tr
                        key={player.player_id}
                        className="border-t border-zinc-800 text-zinc-300"
                      >
                        <td className="p-3">
                          <p className="font-semibold text-zinc-100">
                            {player.username}
                          </p>
                          <p className="text-xs text-zinc-500">
                            {player.player_id}
                          </p>
                        </td>
                        <td className="p-3">{player.matches_played}</td>
                        <td className="p-3 font-semibold text-violet-300">
                          {player.score.toLocaleString()}
                        </td>
                        <td className="p-3">{player.wins}</td>
                        <td className="p-3">
                          {player.matches_played > 0
                            ? `${(
                                (player.wins / player.matches_played) *
                                100
                              ).toFixed(1)}%`
                            : '—'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {players.length === 0 && (
                <p className="py-6 text-center text-sm text-zinc-500">
                  No analytics records found.
                </p>
              )}
            </>
          )}
        </div>

        <div className="border-t border-zinc-800 px-5 py-3 text-xs text-zinc-500">
          Data retrieved from MonetDB using SQL.
        </div>
      </div>
    </div>
  );
}