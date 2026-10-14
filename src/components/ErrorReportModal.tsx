import { FormEvent, useState } from 'react';
import { Bug, X } from 'lucide-react';
import { createErrorReport } from '../services/api';

interface ErrorReportModalProps {
  onClose: () => void;
}

export default function ErrorReportModal({
  onClose,
}: ErrorReportModalProps) {
  const [playerId, setPlayerId] = useState('');
  const [username, setUsername] = useState('');
  const [category, setCategory] = useState('Gameplay');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState('');

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (!playerId.trim()) {
      setMessage('Please enter the Player ID.');
      return;
    }

    if (!username.trim()) {
      setMessage('Please enter the username.');
      return;
    }

    if (!description.trim()) {
      setMessage('Please describe the error.');
      return;
    }

    setIsSubmitting(true);
    setMessage('');

    try {
      await createErrorReport({
        playerId: playerId.trim(),
        username: username.trim(),
        category,
        description: description.trim(),
      });

      setMessage('Error report submitted successfully!');

      setPlayerId('');
      setUsername('');
      setDescription('');

      setTimeout(() => {
        onClose();
      }, 1000);
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : 'Failed to submit error report'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="w-full max-w-lg bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl">

        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-zinc-800">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-red-500/10 border border-red-500/20">
              <Bug className="w-5 h-5 text-red-400" />
            </div>

            <div>
              <h2 className="text-lg font-bold text-zinc-100">
                Report an Error
              </h2>
              <p className="text-xs text-zinc-500">
                Help us improve the gaming experience
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-lg text-zinc-500 hover:text-zinc-200 hover:bg-zinc-800 transition-colors"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-5 space-y-5">

          {/* Player ID */}
          <div>
            <label className="block text-xs font-semibold text-zinc-300 mb-2">
              Player ID
            </label>

            <input
              type="text"
              value={playerId}
              onChange={(e) => setPlayerId(e.target.value)}
              placeholder="Example: P001"
              className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2.5 text-sm text-zinc-100 placeholder-zinc-600 outline-none focus:border-emerald-500"
            />
          </div>

          {/* Username */}
          <div>
            <label className="block text-xs font-semibold text-zinc-300 mb-2">
              Username
            </label>

            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Example: GamerX"
              className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2.5 text-sm text-zinc-100 placeholder-zinc-600 outline-none focus:border-emerald-500"
            />
          </div>

          {/* Category */}
          <div>
            <label className="block text-xs font-semibold text-zinc-300 mb-2">
              Error Category
            </label>

            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2.5 text-sm text-zinc-100 outline-none focus:border-emerald-500"
            >
              <option value="Gameplay">Gameplay</option>
              <option value="Player Profile">Player Profile</option>
              <option value="Redis">Redis</option>
              <option value="MongoDB">MongoDB</option>
              <option value="UI">UI / Interface</option>
              <option value="Other">Other</option>
            </select>
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-semibold text-zinc-300 mb-2">
              Describe the Error
            </label>

            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe what went wrong..."
              rows={5}
              className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2.5 text-sm text-zinc-100 placeholder-zinc-600 outline-none focus:border-emerald-500 resize-none"
            />
          </div>

          {/* Message */}
          {message && (
            <div
              className={`rounded-xl px-3 py-2.5 text-xs ${
                message.includes('successfully')
                  ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-300'
                  : 'bg-red-500/10 border border-red-500/20 text-red-300'
              }`}
            >
              {message}
            </div>
          )}

          {/* Buttons */}
          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-semibold transition-colors"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 disabled:opacity-50 text-white text-xs font-semibold transition-colors flex items-center gap-2"
            >
              <Bug className="w-4 h-4" />
              {isSubmitting ? 'Submitting...' : 'Submit Report'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}