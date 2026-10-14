
import { Connection } from 'monetdb';

const connection = new Connection({
  host: '127.0.0.1',
  port: 50000,
  database: 'monetdb',
  username: 'monetdb',
  password:'monetdb123',
});

export async function getPlayerAnalytics() {
  await connection.connect();

  try {
    const result = await connection.execute(`
      SELECT player_id, username, matches_played, score, wins
      FROM player_analytics
      ORDER BY score DESC
    `);

    return result;
  } finally {
    await connection.close();
  }
}