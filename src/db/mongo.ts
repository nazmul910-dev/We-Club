
import { MongoClient, Db } from "mongodb";

const uri = process.env.MONGO_URI || "mongodb://localhost:27017";
const dbName = process.env.DB_NAME || "test";

let client: MongoClient | null = null;
let db: Db | null = null;

export async function connectToMongo(): Promise<Db> {
	if (db) return db;
	client = new MongoClient(uri);
	await client.connect();
	db = client.db(dbName);
	console.log(`Connected to MongoDB: ${uri}/${dbName}`);
	return db;
}

export function getDb(): Db {
	if (!db) throw new Error("MongoDB not connected. Call connectToMongo first.");
	return db;
}

export async function closeMongo(): Promise<void> {
	if (client) {
		await client.close();
		client = null;
		db = null;
	}
}





