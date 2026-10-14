import { useEffect, useState } from 'react';
import { ErrorReport, MongoLogEntry, MongoPlayer } from '../types';
import {
  fetchErrorReports,
  fetchMongoLogs,
  fetchMongoPlayers,
} from '../services/api';
import {
  Bug,
  Clock,
  Code2,
  Database,
  FileJson,
  RefreshCw,
  Terminal,
  X,
} from 'lucide-react';

interface MongoConsoleModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function MongoConsoleModal({
  isOpen,
  onClose,
}: MongoConsoleModalProps) {
  const [activeTab, setActiveTab] = useState<
    'logs' | 'players' | 'errors' | 'guide'
  >('logs');

  const [logs, setLogs] = useState<MongoLogEntry[]>([]);
  const [players, setPlayers] = useState<MongoPlayer[]>([]);
  const [errorReports, setErrorReports] = useState<ErrorReport[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const refreshData = async () => {
    setIsLoading(true);

    try {
      const [fetchedLogs, fetchedPlayers, fetchedErrorReports] =
        await Promise.all([
          fetchMongoLogs(),
          fetchMongoPlayers(),
          fetchErrorReports(),
        ]);

      setLogs(fetchedLogs);
      setPlayers(fetchedPlayers);
      setErrorReports(fetchedErrorReports);
    } catch (error) {
      console.error('Failed to refresh MongoDB inspector data:', error);
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
        {/* Header */}
        <div className="bg-zinc-950 px-6 py-4 border-b border-zinc-800 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-lg bg-green-500/10 text-green-400 border border-green-500/20">
              <Database className="w-5 h-5" />
            </div>

            <div>
              <h2 className="text-lg font-bold text-zinc-100 flex items-center gap-2">
                MongoDB Operations Inspector
                <span className="text-xs px-2 py-0.5 rounded-full bg-zinc-800 text-green-400 border border-zinc-700/80 font-mono">
                  Database: gaming_player_db
                </span>
              </h2>

              <p className="text-xs text-zinc-400">
                Live monitoring of MongoDB document operations and results.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={refreshData}
              disabled={isLoading}
              className="p-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 transition-colors"
              title="Refresh MongoDB data"
            >
              <RefreshCw
                className={`w-4 h-4 ${
                  isLoading ? 'animate-spin text-green-400' : ''
                }`}
              />
            </button>

            <button
              onClick={onClose}
              className="p-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-zinc-950/60 px-6 py-2 border-b border-zinc-800/80 flex items-center gap-2 text-xs">
          <button
            onClick={() => setActiveTab('logs')}
            className={`px-3 py-1.5 rounded-lg font-medium flex items-center gap-1.5 transition-colors ${
              activeTab === 'logs'
                ? 'bg-green-500/20 text-green-300 border border-green-500/40'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Terminal className="w-3.5 h-3.5" />
            Operation Logs ({logs.length})
          </button>

          <button
            onClick={() => setActiveTab('players')}
            className={`px-3 py-1.5 rounded-lg font-medium flex items-center gap-1.5 transition-colors ${
              activeTab === 'players'
                ? 'bg-green-500/20 text-green-300 border border-green-500/40'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <FileJson className="w-3.5 h-3.5" />
            MongoDB Documents ({players.length})
          </button>

          <button
            onClick={() => setActiveTab('errors')}
            className={`px-3 py-1.5 rounded-lg font-medium flex items-center gap-1.5 transition-colors ${
              activeTab === 'errors'
                ? 'bg-red-500/20 text-red-300 border border-red-500/40'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Bug className="w-3.5 h-3.5" />
            Error Reports ({errorReports.length})
          </button>

          <button
            onClick={() => setActiveTab('guide')}
            className={`px-3 py-1.5 rounded-lg font-medium flex items-center gap-1.5 transition-colors ${
              activeTab === 'guide'
                ? 'bg-green-500/20 text-green-300 border border-green-500/40'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Code2 className="w-3.5 h-3.5" />
            MongoDB Guide
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 font-mono text-xs">
          {/* Logs */}
          {activeTab === 'logs' && (
            <div className="space-y-3">
              {logs.length === 0 ? (
                <div className="text-center py-12 text-zinc-500">
                  <Database className="w-8 h-8 mx-auto mb-2 opacity-40" />
                  No MongoDB operations recorded yet.
                </div>
              ) : (
                logs.map((log) => (
                  <div
                    key={log._id || `${log.timestamp}-${log.operation}`}
                    className="bg-zinc-950 border border-zinc-800/80 rounded-xl p-3.5 shadow-sm space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-bold px-2 py-0.5 rounded text-[10px] bg-green-950 text-green-400 border border-green-800">
                          {log.operation}
                        </span>

                        <span className="text-green-400 font-semibold">
                          {log.collection}
                        </span>
                      </div>

                      <span className="text-zinc-500 text-[10px] flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {new Date(log.timestamp).toLocaleTimeString()}
                      </span>
                    </div>

                    <div className="bg-zinc-900 rounded-lg p-3 border border-zinc-800">
                      <div className="text-[10px] text-zinc-500 mb-1">
                        QUERY / DATA
                      </div>

                      <pre className="text-green-300 whitespace-pre-wrap break-all">
                        {JSON.stringify(log.query, null, 2)}
                      </pre>
                    </div>

                    <div className="text-zinc-400 space-y-2">
                      <p className="text-zinc-300 italic">
                        💡 {log.explanation}
                      </p>

                      <div>
                        <span className="text-zinc-500">Result:</span>
                        <pre className="text-green-400 whitespace-pre-wrap break-all mt-1">
                          {JSON.stringify(log.result, null, 2)}
                        </pre>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {/* Players */}
          {activeTab === 'players' && (
            <div className="space-y-3">
              {players.length === 0 ? (
                <div className="text-center py-12 text-zinc-500">
                  <FileJson className="w-8 h-8 mx-auto mb-2 opacity-40" />
                  No player documents found in MongoDB.
                </div>
              ) : (
                players.map((player) => (
                  <div
                    key={player._id || player.id}
                    className="bg-zinc-950 border border-zinc-800 rounded-xl p-4"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-sm font-bold text-green-400">
                        {player.id}
                      </span>

                      <span className="text-zinc-500">
                        {player.username}
                      </span>
                    </div>

                    <pre className="bg-zinc-900 rounded-lg p-3 text-green-300 whitespace-pre-wrap break-all">
                      {JSON.stringify(player, null, 2)}
                    </pre>
                  </div>
                ))
              )}
            </div>
          )}

          {/* Error Reports */}
          {activeTab === 'errors' && (
            <div className="space-y-3">
              {errorReports.length === 0 ? (
                <div className="text-center py-12 text-zinc-500">
                  <Bug className="w-8 h-8 mx-auto mb-2 opacity-40" />
                  No error reports found.
                </div>
              ) : (
                errorReports.map((report) => (
                  <div
                    key={report._id || `${report.playerId}-${report.createdAt}`}
                    className="bg-zinc-950 border border-zinc-800 rounded-xl p-4"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <Bug className="w-4 h-4 text-red-400" />

                        <span className="font-bold text-red-300">
                          {report.category}
                        </span>
                      </div>

                      <span
                        className={`px-2 py-1 rounded-lg text-[10px] font-semibold ${
                          report.status === 'Open'
                            ? 'bg-red-500/10 text-red-300 border border-red-500/20'
                            : report.status === 'In Progress'
                            ? 'bg-yellow-500/10 text-yellow-300 border border-yellow-500/20'
                            : 'bg-green-500/10 text-green-300 border border-green-500/20'
                        }`}
                      >
                        {report.status}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-3 mb-3 text-xs">
                      <div>
                        <span className="text-zinc-500">Player ID</span>
                        <p className="text-zinc-200 mt-1">
                          {report.playerId}
                        </p>
                      </div>

                      <div>
                        <span className="text-zinc-500">Username</span>
                        <p className="text-zinc-200 mt-1">
                          {report.username}
                        </p>
                      </div>
                    </div>

                    <div className="bg-zinc-900 rounded-lg p-3 border border-zinc-800">
                      <div className="text-[10px] text-zinc-500 mb-1">
                        DESCRIPTION
                      </div>

                      <p className="text-zinc-300 whitespace-pre-wrap break-words">
                        {report.description}
                      </p>
                    </div>

                    <div className="mt-3 flex items-center gap-1 text-[10px] text-zinc-500">
                      <Clock className="w-3 h-3" />
                      {new Date(report.createdAt).toLocaleString()}
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {/* Guide */}
          {activeTab === 'guide' && (
            <div className="space-y-4 text-zinc-300">
              {[
                {
                  title: '1. Insert a Document',
                  command: 'db.players.insertOne({...})',
                  explanation:
                    'Inserts one player document into the MongoDB players collection.',
                },
                {
                  title: '2. Find One Document',
                  command: 'db.players.findOne({ id: "P001" })',
                  explanation:
                    'Retrieves one player document using the player ID.',
                },
                {
                  title: '3. Find Multiple Documents',
                  command: 'db.players.find({})',
                  explanation:
                    'Retrieves multiple player documents from the collection.',
                },
                {
                  title: '4. Update a Document',
                  command:
                    'db.players.updateOne({ id: "P001" }, { $set: {...} })',
                  explanation:
                    'Updates selected fields in a player document.',
                },
                {
                  title: '5. Delete a Document',
                  command: 'db.players.deleteOne({ id: "P001" })',
                  explanation:
                    'Deletes a player document using its player ID.',
                },
              ].map((item) => (
                <div
                  key={item.title}
                  className="bg-zinc-950 border border-zinc-800 rounded-xl p-4"
                >
                  <h3 className="text-sm font-bold text-green-400 mb-2">
                    {item.title}
                  </h3>

                  <p className="text-green-300 mb-2 break-all">
                    Command: {item.command}
                  </p>

                  <p className="text-xs leading-relaxed text-zinc-300">
                    {item.explanation}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-zinc-950 px-6 py-3 border-t border-zinc-800 flex items-center justify-between text-xs text-zinc-400">
          <span>
            Logged Operations:{' '}
            <strong className="text-zinc-200">{logs.length}</strong>
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