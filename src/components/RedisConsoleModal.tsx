import { useEffect, useState } from 'react';
import { RedisKeyInfo, RedisLogEntry } from '../types';
import { fetchRedisKeys, fetchRedisLogs } from '../services/api';
import { Clock, Code2, Database, Key, RefreshCw, Terminal, X, Zap } from 'lucide-react';

interface RedisConsoleModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function RedisConsoleModal({ isOpen, onClose }: RedisConsoleModalProps) {
  const [activeTab, setActiveTab] = useState<'logs' | 'keys' | 'guide'>('logs');
  const [logs, setLogs] = useState<RedisLogEntry[]>([]);
  const [keys, setKeys] = useState<RedisKeyInfo[]>([]);
  const [redisMode, setRedisMode] = useState<string>('in-memory');
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const refreshData = async () => {
    setIsLoading(true);
    try {
      const [fetchedLogs, keysData] = await Promise.all([
        fetchRedisLogs(),
        fetchRedisKeys(),
      ]);
      setLogs(fetchedLogs);
      setKeys(keysData.keys);
      setRedisMode(keysData.redisMode);
    } catch (err) {
      console.error('Failed to refresh Redis inspector data', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      refreshData();
      const interval = setInterval(refreshData, 3000);
      return () => clearInterval(interval);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/80 backdrop-blur-sm animate-fadeIn">
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-4xl h-[85vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Modal Header */}
        <div className="bg-zinc-950 px-6 py-4 border-b border-zinc-800 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <Terminal className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-zinc-100 flex items-center gap-2">
                Redis String Operations Inspector
                <span className="text-xs px-2 py-0.5 rounded-full bg-zinc-800 text-emerald-400 border border-zinc-700/80 font-mono">
                  Engine: {redisMode}
                </span>
              </h2>
              <p className="text-xs text-zinc-400">
                Live monitoring of SET, GET, MSET, SETEX, APPEND, DEL, and TTL Redis String commands.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={refreshData}
              disabled={isLoading}
              className="p-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 transition-colors"
              title="Refresh Redis Keys and Logs"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin text-emerald-400' : ''}`} />
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Navigation Tabs */}
        <div className="bg-zinc-950/60 px-6 py-2 border-b border-zinc-800/80 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab('logs')}
              className={`px-3 py-1.5 rounded-lg font-medium flex items-center gap-1.5 transition-colors ${
                activeTab === 'logs'
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <Terminal className="w-3.5 h-3.5" />
              Command Execution Stream ({logs.length})
            </button>

            <button
              onClick={() => setActiveTab('keys')}
              className={`px-3 py-1.5 rounded-lg font-medium flex items-center gap-1.5 transition-colors ${
                activeTab === 'keys'
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <Key className="w-3.5 h-3.5" />
              Active Redis Keys ({keys.length})
            </button>

            <button
              onClick={() => setActiveTab('guide')}
              className={`px-3 py-1.5 rounded-lg font-medium flex items-center gap-1.5 transition-colors ${
                activeTab === 'guide'
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <Code2 className="w-3.5 h-3.5" />
              Redis Commands Spec Guide
            </button>
          </div>

          <div className="font-mono text-[11px] text-zinc-400 hidden sm:block">
            Value Format: <span className="text-emerald-400">ID|Username|Level|Score|Achievements</span>
          </div>
        </div>

        {/* Modal Tab Contents */}
        <div className="flex-1 overflow-y-auto p-6 font-mono text-xs">
          {/* TAB 1: Command Logs */}
          {activeTab === 'logs' && (
            <div className="space-y-3">
              {logs.length === 0 ? (
                <div className="text-center py-12 text-zinc-500">
                  <Database className="w-8 h-8 mx-auto mb-2 opacity-40" />
                  No Redis command logs recorded yet. Perform player operations to see real-time Redis calls.
                </div>
              ) : (
                logs.map((log) => (
                  <div
                    key={log.id}
                    className="bg-zinc-950 border border-zinc-800/80 rounded-xl p-3.5 shadow-sm space-y-2 hover:border-zinc-700 transition-colors"
                  >
                    <div className="flex items-center justify-between text-[11px]">
                      <div className="flex items-center gap-2">
                        <span
                          className={`font-bold px-2 py-0.5 rounded text-[10px] ${
                            log.command === 'SET'
                              ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                              : log.command === 'GET'
                              ? 'bg-teal-950 text-teal-400 border border-teal-800'
                              : log.command === 'MSET'
                              ? 'bg-emerald-900/60 text-emerald-300 border border-emerald-700'
                              : log.command === 'SETEX'
                              ? 'bg-amber-950 text-amber-400 border border-amber-800'
                              : log.command === 'APPEND'
                              ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                              : log.command === 'DEL'
                              ? 'bg-red-950 text-red-400 border border-red-800'
                              : 'bg-zinc-800 text-zinc-300'
                          }`}
                        >
                          {log.command}
                        </span>
                        {log.key && (
                          <span className="text-emerald-400 font-semibold">{log.key}</span>
                        )}
                      </div>
                      <span className="text-zinc-500 text-[10px] flex items-center gap-1">
                        <Clock className="w-3 h-3 text-zinc-500" />
                        {new Date(log.timestamp).toLocaleTimeString()}
                      </span>
                    </div>

                    <div className="bg-zinc-900 rounded-lg p-2.5 text-zinc-200 text-xs border border-zinc-800">
                      <span className="text-amber-400 font-bold">$ redis-cli </span>
                      <span className="text-zinc-100 font-medium">
                        {log.command} {log.args.map((a) => `"${a}"`).join(' ')}
                      </span>
                    </div>

                    <div className="text-[11px] text-zinc-400 space-y-1">
                      <p className="text-zinc-300 italic">💡 {log.explanation}</p>
                      <p className="text-emerald-400/90 font-mono">
                        <span className="text-zinc-500 font-normal">Response:</span> {log.result}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {/* TAB 2: Active Keys */}
          {activeTab === 'keys' && (
            <div className="space-y-4">
              {keys.length === 0 ? (
                <div className="text-center py-12 text-zinc-500">
                  <Key className="w-8 h-8 mx-auto mb-2 opacity-40" />
                  No keys found in Redis database. Click "Preload Players (MSET)" to generate test keys.
                </div>
              ) : (
                keys.map((k) => (
                  <div
                    key={k.key}
                    className="bg-zinc-950 border border-zinc-800 rounded-xl p-4 shadow-sm"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <Key className="w-4 h-4 text-emerald-400" />
                        <span className="text-sm font-bold text-zinc-100">{k.key}</span>
                        <span className="text-[10px] px-2 py-0.5 rounded bg-zinc-800 text-zinc-300 border border-zinc-700">
                          TYPE: {k.type}
                        </span>
                      </div>

                      {k.ttl > 0 ? (
                        <span className="text-xs px-2.5 py-1 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 font-semibold flex items-center gap-1 animate-pulse">
                          <Zap className="w-3 h-3" />
                          TTL: {k.ttl}s
                        </span>
                      ) : (
                        <span className="text-[11px] text-zinc-500 font-mono">
                          TTL: Persistent (-1)
                        </span>
                      )}
                    </div>

                    <div className="bg-zinc-900 p-3 rounded-lg border border-zinc-800">
                      <div className="text-[10px] text-zinc-500 mb-1">RAW REDIS STRING VALUE:</div>
                      <div className="text-emerald-300 font-bold select-all break-all">
                        {k.value || '(nil)'}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {/* TAB 3: Redis Commands Guide */}
          {activeTab === 'guide' && (
            <div className="space-y-4 text-zinc-300">
              <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-4">
                <h3 className="text-sm font-bold text-emerald-400 mb-2 flex items-center gap-2">
                  1. Store a Player Profile (SET)
                </h3>
                <p className="text-xs text-zinc-400 mb-2">
                  Command: <code className="text-emerald-300 font-bold">SET player_data:P001 "P001|GamerX|15|9800|First Win,Level Master"</code>
                </p>
                <p className="text-xs leading-relaxed text-zinc-300">
                  Stores a single player profile as a pipe-delimited string value in Redis key <code className="text-emerald-400">player_data:&lt;id&gt;</code>.
                </p>
              </div>

              <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-4">
                <h3 className="text-sm font-bold text-emerald-400 mb-2 flex items-center gap-2">
                  2. Retrieve a Player Profile (GET)
                </h3>
                <p className="text-xs text-zinc-400 mb-2">
                  Command: <code className="text-emerald-300 font-bold">GET player_data:P001</code>
                </p>
                <p className="text-xs leading-relaxed text-zinc-300">
                  Fetches the player string from Redis, which is parsed into Player ID, Username, Level, High Score, and Achievements.
                </p>
              </div>

              <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-4">
                <h3 className="text-sm font-bold text-emerald-400 mb-2 flex items-center gap-2">
                  3. Store Multiple Players (MSET)
                </h3>
                <p className="text-xs text-zinc-400 mb-2">
                  Command: <code className="text-emerald-300 font-bold">MSET player_data:P001 "..." player_data:P002 "..." player_data:P003 "..."</code>
                </p>
                <p className="text-xs leading-relaxed text-zinc-300">
                  Atomically preloads all 3 default player profiles in a single network round-trip.
                </p>
              </div>

              <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-4">
                <h3 className="text-sm font-bold text-emerald-400 mb-2 flex items-center gap-2">
                  4. Temporary Boost (SETEX)
                </h3>
                <p className="text-xs text-zinc-400 mb-2">
                  Command: <code className="text-amber-300 font-bold">SETEX boost:P001 60 "SPEED_BOOST_2X"</code>
                </p>
                <p className="text-xs leading-relaxed text-zinc-300">
                  Stores a temporary boost key that automatically expires after 60 seconds using Redis TTL timers.
                </p>
              </div>

              <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-4">
                <h3 className="text-sm font-bold text-emerald-400 mb-2 flex items-center gap-2">
                  5. Append Achievement (APPEND)
                </h3>
                <p className="text-xs text-zinc-400 mb-2">
                  Command: <code className="text-emerald-300 font-bold">APPEND player_data:P001 ",Champion"</code>
                </p>
                <p className="text-xs leading-relaxed text-zinc-300">
                  Appends new achievement strings directly onto the existing Redis string without re-writing the whole object!
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="bg-zinc-950 px-6 py-3 border-t border-zinc-800 flex items-center justify-between text-xs text-zinc-400">
          <span>
            Logged Operations: <strong className="text-zinc-200">{logs.length}</strong>
          </span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-semibold rounded-lg transition-colors"
          >
            Close Inspector
          </button>
        </div>
      </div>
    </div>
  );
}
