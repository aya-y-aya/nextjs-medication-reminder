import Database from "better-sqlite3";
import path from "path";
import fs from "fs";

let db: Database.Database | null = null;

export function getDb(): Database.Database {
  if (db) {
    return db;
  }

  const dataDir = path.join(process.cwd(), "data");
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }

  const dbPath = path.join(dataDir, "health-reminder.db");
  db = new Database(dbPath);

  // Enable WAL mode for better concurrent read performance
  db.pragma("journal_mode = WAL");

  // Create tables
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT NOT NULL,
      timezone TEXT NOT NULL DEFAULT 'America/New_York',
      daily_water_goal INTEGER NOT NULL DEFAULT 2000,
      water_consumed_today INTEGER NOT NULL DEFAULT 0,
      last_water_log_date TEXT
    );

    CREATE TABLE IF NOT EXISTS medications (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      name TEXT NOT NULL,
      reminder_times TEXT NOT NULL DEFAULT '[]',
      last_taken_date TEXT,
      FOREIGN KEY (user_id) REFERENCES users(id)
    );
  `);

  // Insert default demo user if no users exist
  const userCount = db.prepare("SELECT COUNT(*) as count FROM users").get() as {
    count: number;
  };

  if (userCount.count === 0) {
    db.prepare(
      `INSERT INTO users (id, email, timezone, daily_water_goal, water_consumed_today, last_water_log_date)
       VALUES (1, 'demo@example.com', 'America/New_York', 2000, 0, NULL)`
    ).run();
  }

  return db;
}
