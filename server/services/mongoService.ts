import { getMongoDB } from '../utils/mongoClient.js';

const PLAYERS_COLLECTION = 'players';
const LOGS_COLLECTION = 'mongo_operation_logs';
const ERROR_REPORTS_COLLECTION = 'error_reports';

export interface MongoOperationLog {
  timestamp: string;
  operation: string;
  collection: string;
  query: unknown;
  result: unknown;
  explanation: string;
}
export interface ErrorReport {
  _id?: string;
  playerId: string;
  username: string;
  category: string;
  description: string;
  status: 'Open' | 'In Progress' | 'Resolved';
  createdAt: Date;
  updatedAt: Date;
}

class MongoService {
  private async logOperation(
    operation: string,
    collection: string,
    query: unknown,
    result: unknown,
    explanation: string
  ) {
    const db = await getMongoDB();

    await db.collection<MongoOperationLog>(LOGS_COLLECTION).insertOne({
      timestamp: new Date().toISOString(),
      operation,
      collection,
      query,
      result,
      explanation,
    });
  }

  async createPlayer(player: {
    id: string;
    username: string;
    level: number;
    highScore: number;
    achievements: string[];
  }) {
    const db = await getMongoDB();

    const result = await db
      .collection(PLAYERS_COLLECTION)
      .insertOne({
        ...player,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

    await this.logOperation(
      'insertOne',
      PLAYERS_COLLECTION,
      player,
      { insertedId: result.insertedId },
      'Inserts one player document into the MongoDB players collection.'
    );

    return result;
  }

  async getPlayerById(id: string) {
    const db = await getMongoDB();

    const player = await db
      .collection(PLAYERS_COLLECTION)
      .findOne({ id });

    await this.logOperation(
      'findOne',
      PLAYERS_COLLECTION,
      { id },
      player,
      'Finds one player document using its player ID.'
    );

    return player;
  }

  async getAllPlayers() {
    const db = await getMongoDB();

    const players = await db
      .collection(PLAYERS_COLLECTION)
      .find({})
      .toArray();

    await this.logOperation(
      'find',
      PLAYERS_COLLECTION,
      {},
      { count: players.length },
      'Retrieves all player documents from the collection.'
    );

    return players;
  }

  async updatePlayer(id: string, updates: Record<string, unknown>) {
    const db = await getMongoDB();

    const result = await db
      .collection(PLAYERS_COLLECTION)
      .updateOne(
        { id },
        {
          $set: {
            ...updates,
            updatedAt: new Date(),
          },
        }
      );

    await this.logOperation(
      'updateOne',
      PLAYERS_COLLECTION,
      { id, updates },
      {
        matchedCount: result.matchedCount,
        modifiedCount: result.modifiedCount,
      },
      'Updates one player document using its player ID.'
    );

    return result;
  }

  async deletePlayer(id: string) {
    const db = await getMongoDB();

    const result = await db
      .collection(PLAYERS_COLLECTION)
      .deleteOne({ id });

    await this.logOperation(
      'deleteOne',
      PLAYERS_COLLECTION,
      { id },
      { deletedCount: result.deletedCount },
      'Deletes one player document using its player ID.'
    );

    return result;
  }
    async createErrorReport(report: {
    playerId: string;
    username: string;
    category: string;
    description: string;
  }) {
    const db = await getMongoDB();

    const now = new Date();

    const errorReport: ErrorReport = {
      ...report,
      status: 'Open',
      createdAt: now,
      updatedAt: now,
    };

    const result = await db
      .collection<ErrorReport>(ERROR_REPORTS_COLLECTION)
      .insertOne(errorReport);

    await this.logOperation(
      'insertOne',
      ERROR_REPORTS_COLLECTION,
      report,
      { insertedId: result.insertedId },
      'Creates a new player error report in MongoDB.'
    );

    return {
      ...errorReport,
      _id: result.insertedId,
    };
  }

  async getErrorReports() {
    const db = await getMongoDB();

    return await db
      .collection<ErrorReport>(ERROR_REPORTS_COLLECTION)
      .find({})
      .sort({ createdAt: -1 })
      .limit(100)
      .toArray();
  }
  async getOperationLogs() {
    const db = await getMongoDB();

    return await db
      .collection<MongoOperationLog>(LOGS_COLLECTION)
      .find({})
      .sort({ timestamp: -1 })
      .limit(100)
      .toArray();
  }
}

export const mongoService = new MongoService();
