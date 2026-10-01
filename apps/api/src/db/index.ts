import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import { migrate } from 'drizzle-orm/better-sqlite3/migrator';
import fs from 'node:fs';
import path from 'node:path';
import * as schema from './schema';

const dbPath = process.env.DB_PATH ?? './data/backoffice.db';
fs.mkdirSync(path.dirname(path.resolve(dbPath)), { recursive: true });

const sqlite = new Database(dbPath);
export const db = drizzle(sqlite, { schema });

migrate(db, { migrationsFolder: path.resolve(import.meta.dirname, '../../drizzle') });
