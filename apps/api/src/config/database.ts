import { MongoClient, Db, GridFSBucket } from 'mongodb';

export class Database {
  private static instance: Database;
  private client: MongoClient;
  private db: Db;
  private gridFS: GridFSBucket;

  private constructor() {
    const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/invoice-manager';
    this.client = new MongoClient(uri);
  }

  public static getInstance(): Database {
    if (!Database.instance) {
      Database.instance = new Database();
    }
    return Database.instance;
  }

  public async connect(): Promise<void> {
    try {
      await this.client.connect();
      this.db = this.client.db();
      this.gridFS = new GridFSBucket(this.db, { bucketName: 'pdfs' });
      console.log('Connected to MongoDB');
    } catch (error) {
      console.error('MongoDB connection error:', error);
      throw error;
    }
  }

  public getDb(): Db {
    if (!this.db) {
      throw new Error('Database not initialized. Call connect() first.');
    }
    return this.db;
  }

  public getGridFS(): GridFSBucket {
    if (!this.gridFS) {
      throw new Error('GridFS not initialized. Call connect() first.');
    }
    return this.gridFS;
  }

  public async disconnect(): Promise<void> {
    if (this.client) {
      await this.client.close();
      console.log('Disconnected from MongoDB');
    }
  }
}