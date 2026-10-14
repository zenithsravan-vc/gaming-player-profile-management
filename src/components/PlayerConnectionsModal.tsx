
import { useEffect, useState } from 'react';
import { Network, RefreshCw, X, Users } from 'lucide-react';

interface Connection {
  id: string;
  username: string;
  relationship: string | null;
  connectedPlayerId: string | null;
  connectedUsername: string | null;
}

interface Props {
  onClose: () => void;
}

export default function PlayerConnectionsModal({ onClose }: Props) {
  const [connections, setConnections] = useState<Connection[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadConnections = async () => {
    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/player-connections');
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to load connections');
      }

      setConnections(data.connections);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to load connections'
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadConnections();
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="w-full max-w-2xl max-h-[85vh] overflow-y-auto bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl">
        <div className="sticky top-0 flex items-center justify-between p-5 bg-zinc-950 border-b border-zinc-800">
          <div className="flex items-center gap-3">
            <Network className="w-6 h-6 text-cyan-400" />
            <div>
              <h2 className="text-lg font-bold text-zinc-100">
                Player Connections
              </h2>
              <p className="text-xs text-zinc-400">
                Powered by Neo4j Graph Database
              </p>
            </div>
          </div>

          <div className="flex gap-2">
            <button
              onClick={loadConnections}
              disabled={loading}
              title="Refresh"
              className="p-2 rounded-lg bg-zinc-800 text-zinc-300 hover:bg-zinc-700"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-lg bg-zinc-800 text-zinc-300 hover:bg-zinc-700"
              aria-label="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="p-5">
          <div className="grid grid-cols-2 gap-3 mb-5">
            <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-4">
              <Users className="w-5 h-5 text-cyan-400 mb-2" />
              <p className="text-2xl font-bold text-zinc-100">
                {new Set(connections.map((c) => c.id)).size}
              </p>
              <p className="text-xs text-zinc-400">Players</p>
            </div>
            <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-4">
              <Network className="w-5 h-5 text-cyan-400 mb-2" />
              <p className="text-2xl font-bold text-zinc-100">
                {connections.filter((c) => c.relationship).length}
              </p>
              <p className="text-xs text-zinc-400">Connections</p>
            </div>
          </div>

          {loading ? (
            <p className="py-8 text-center text-zinc-400">
              Loading Neo4j connections...
            </p>
          ) : error ? (
            <div className="p-4 rounded-xl bg-red-500/10 text-red-300 text-sm">
              {error}
            </div>
          ) : (
            <div className="space-y-3">
              {connections.map((connection, index) => (
                <div
                  key={`${connection.id}-${connection.relationship}-${connection.connectedPlayerId}-${index}`}
                  className="bg-zinc-950 border border-zinc-800 rounded-xl p-4"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="font-semibold text-zinc-100">
                        {connection.username}
                      </p>
                      <p className="text-xs text-zinc-500">
                        Player ID: {connection.id}
                      </p>
                    </div>

                    {connection.relationship ? (
                      <div className="text-right">
                        <span className="text-xs px-2 py-1 rounded-lg bg-cyan-500/10 border border-cyan-500/20 text-cyan-300">
                          {connection.relationship.replaceAll('_', ' ')}
                        </span>
                        <p className="text-sm text-zinc-300 mt-2">
                          ↔ {connection.connectedUsername}
                        </p>
                        <p className="text-xs text-zinc-500">
                          {connection.connectedPlayerId}
                        </p>
                      </div>
                    ) : (
                      <span className="text-xs text-zinc-500">
                        No outgoing connections
                      </span>
                    )}
                  </div>
                </div>
              ))}

              {connections.length === 0 && (
                <p className="py-8 text-center text-zinc-500">
                  No player connections found.
                </p>
              )}
            </div>
          )}
        </div>

        <div className="px-5 py-3 border-t border-zinc-800 text-xs text-zinc-500">
          Player relationships are retrieved live from Neo4j.
        </div>
      </div>
    </div>
  );
}