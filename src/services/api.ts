import { PlayerProfile, RedisKeyInfo, RedisLogEntry } from '../types';

const API_BASE = '';

export async function fetchAllPlayers(): Promise<PlayerProfile[]> {
  const res = await fetch(`${API_BASE}/players`);
  if (!res.ok) throw new Error('Failed to fetch players list');
  const data = await res.json();
  return data.players || [];
}

export async function fetchPlayerById(id: string): Promise<PlayerProfile> {
  const res = await fetch(`${API_BASE}/player/${encodeURIComponent(id)}`);
  if (!res.ok) {
    const errData = await res.json().catch(() => ({}));
    throw new Error(errData.error || `Player ${id} not found`);
  }
  const data = await res.json();
  return data.player;
}

export async function createPlayerProfile(playerData: {
  id: string;
  username: string;
  level: number;
  highScore: number;
  achievements: string | string[];
}): Promise<{ player: PlayerProfile; redisKey: string; redisValue: string }> {
  const res = await fetch(`${API_BASE}/player`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(playerData),
  });
  if (!res.ok) {
    const errData = await res.json().catch(() => ({}));
    throw new Error(errData.error || 'Failed to store player profile in Redis');
  }
  return await res.json();
}

export async function preloadDefaultPlayers(): Promise<{ count: number; players: PlayerProfile[] }> {
  const res = await fetch(`${API_BASE}/players/preload`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
  });
  if (!res.ok) throw new Error('Failed to preload players');
  return await res.json();
}

export async function activatePlayerBoost(
  id: string,
  boostType: string = 'XP_MULTIPLIER_2X'
): Promise<{ player: PlayerProfile; ttlSeconds: number; boostValue: string }> {
  const res = await fetch(`${API_BASE}/player/${encodeURIComponent(id)}/boost`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ boostType }),
  });
  if (!res.ok) {
    const errData = await res.json().catch(() => ({}));
    throw new Error(errData.error || 'Failed to activate temporary boost');
  }
  return await res.json();
}

export async function appendPlayerAchievement(
  id: string,
  achievement: string
): Promise<{ player: PlayerProfile; appendedString: string; newStringLength: number }> {
  const res = await fetch(`${API_BASE}/player/${encodeURIComponent(id)}/achievement`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ achievement }),
  });
  if (!res.ok) {
    const errData = await res.json().catch(() => ({}));
    throw new Error(errData.error || 'Failed to append achievement');
  }
  return await res.json();
}

export async function deletePlayerProfile(id: string): Promise<boolean> {
  const res = await fetch(`${API_BASE}/player/${encodeURIComponent(id)}`, {
    method: 'DELETE',
  });
  if (!res.ok) {
    const errData = await res.json().catch(() => ({}));
    throw new Error(errData.error || 'Failed to delete player profile');
  }
  return true;
}

export async function fetchRedisLogs(): Promise<RedisLogEntry[]> {
  const res = await fetch(`${API_BASE}/api/redis/logs`);
  if (!res.ok) return [];
  const data = await res.json();
  return data.logs || [];
}

export async function fetchRedisKeys(): Promise<{ totalKeys: number; redisMode: string; keys: RedisKeyInfo[] }> {
  const res = await fetch(`${API_BASE}/api/redis/keys`);
  if (!res.ok) return { totalKeys: 0, redisMode: 'unknown', keys: [] };
  return await res.json();
}
