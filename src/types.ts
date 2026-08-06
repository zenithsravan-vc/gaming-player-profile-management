export interface PlayerProfile {
  id: string; // e.g. P001
  username: string; // e.g. GamerX
  level: number; // e.g. 15
  highScore: number; // e.g. 9800
  achievements: string[]; // e.g. ["First Win", "Level Master"]
  rawString?: string; // P001|GamerX|15|9800|First Win,Level Master
  hasActiveBoost?: boolean;
  boostTtlSeconds?: number;
  boostDetails?: string | null;
}

export interface RedisLogEntry {
  id: string;
  timestamp: string;
  command: string;
  key?: string;
  args: string[];
  explanation: string;
  result: string;
}

export interface RedisKeyInfo {
  key: string;
  type: string;
  value: string | null;
  ttl: number;
  isBoostKey: boolean;
  isPlayerKey: boolean;
}

export type ActiveTab = 'home' | 'add' | 'details' | 'inspector';
