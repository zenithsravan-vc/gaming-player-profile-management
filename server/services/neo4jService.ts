
import neo4j from 'neo4j-driver';

const driver = neo4j.driver(
  'bolt://localhost:7687',
  neo4j.auth.basic('neo4j', 'ZenithNeo4j2026')
);

export async function getPlayerConnections() {
  const session = driver.session();

  try {
    await session.run(`
      MERGE (a:Player {id: 'P001'})
      SET a.username = 'GamerX'
      MERGE (b:Player {id: 'P002'})
      SET b.username = 'ProPlayer'
      MERGE (c:Player {id: 'P003'})
      SET c.username = 'Shadow'
      MERGE (a)-[:FRIEND]->(b)
      MERGE (b)-[:TEAMMATE]->(c)
      MERGE (a)-[:PLAYS_WITH]->(c)
    `);

    const result = await session.run(`
      MATCH (p:Player)
      OPTIONAL MATCH (p)-[r]->(other:Player)
      RETURN p.id AS id,
             p.username AS username,
             type(r) AS relationship,
             other.id AS connectedPlayerId,
             other.username AS connectedUsername
      ORDER BY p.id
    `);

    return result.records.map((record) => ({
      id: record.get('id'),
      username: record.get('username'),
      relationship: record.get('relationship'),
      connectedPlayerId: record.get('connectedPlayerId'),
      connectedUsername: record.get('connectedUsername'),
    }));
  } finally {
    await session.close();
  }
}