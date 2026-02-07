import * as SQLite from 'expo-sqlite';

let db: SQLite.SQLiteDatabase | null = null;

export async function getDatabase(): Promise<SQLite.SQLiteDatabase> {
  if (db) return db;

  db = await SQLite.openDatabaseAsync('follo.db');
  return db;
}

export async function initDatabase(): Promise<void> {
  const database = await getDatabase();

  // Enable foreign keys
  await database.execAsync('PRAGMA foreign_keys = ON;');

  // Create all tables
  await database.execAsync(`
    -- Profiles table (multi-user support)
    CREATE TABLE IF NOT EXISTS profiles (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      avatar_uri TEXT,
      birth_date TEXT,
      is_primary INTEGER DEFAULT 0,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    -- Medications table
    CREATE TABLE IF NOT EXISTS medications (
      id TEXT PRIMARY KEY,
      profile_id TEXT NOT NULL,
      name TEXT NOT NULL,
      dosage TEXT,
      form TEXT,
      frequency_rule TEXT,
      time_of_day TEXT,
      refill_threshold INTEGER DEFAULT 7,
      current_quantity INTEGER,
      photo_uri TEXT,
      notes TEXT,
      is_active INTEGER DEFAULT 1,
      hide_name INTEGER DEFAULT 0,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      FOREIGN KEY (profile_id) REFERENCES profiles(id) ON DELETE CASCADE
    );

    -- Medication history (immutable log)
    CREATE TABLE IF NOT EXISTS medication_history (
      id TEXT PRIMARY KEY,
      profile_id TEXT NOT NULL,
      medication_id TEXT NOT NULL,
      scheduled_time TEXT NOT NULL,
      actual_time TEXT,
      status TEXT NOT NULL,
      notes TEXT,
      created_at TEXT NOT NULL,
      FOREIGN KEY (medication_id) REFERENCES medications(id) ON DELETE CASCADE,
      FOREIGN KEY (profile_id) REFERENCES profiles(id) ON DELETE CASCADE
    );

    -- Supplements table
    CREATE TABLE IF NOT EXISTS supplements (
      id TEXT PRIMARY KEY,
      profile_id TEXT NOT NULL,
      name TEXT NOT NULL,
      dosage TEXT,
      form TEXT,
      frequency_rule TEXT,
      time_of_day TEXT,
      current_quantity INTEGER,
      low_stock_threshold INTEGER DEFAULT 10,
      photo_uri TEXT,
      notes TEXT,
      is_active INTEGER DEFAULT 1,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      FOREIGN KEY (profile_id) REFERENCES profiles(id) ON DELETE CASCADE
    );

    -- Supplement history
    CREATE TABLE IF NOT EXISTS supplement_history (
      id TEXT PRIMARY KEY,
      profile_id TEXT NOT NULL,
      supplement_id TEXT NOT NULL,
      scheduled_time TEXT NOT NULL,
      actual_time TEXT,
      status TEXT NOT NULL,
      notes TEXT,
      created_at TEXT NOT NULL,
      FOREIGN KEY (supplement_id) REFERENCES supplements(id) ON DELETE CASCADE,
      FOREIGN KEY (profile_id) REFERENCES profiles(id) ON DELETE CASCADE
    );

    -- Appointments table
    CREATE TABLE IF NOT EXISTS appointments (
      id TEXT PRIMARY KEY,
      profile_id TEXT NOT NULL,
      title TEXT NOT NULL,
      doctor_name TEXT,
      specialty TEXT,
      location TEXT,
      scheduled_time TEXT NOT NULL,
      duration INTEGER DEFAULT 30,
      reason TEXT,
      checklist TEXT,
      photo_uri TEXT,
      notes TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      FOREIGN KEY (profile_id) REFERENCES profiles(id) ON DELETE CASCADE
    );

    -- Activities table
    CREATE TABLE IF NOT EXISTS activities (
      id TEXT PRIMARY KEY,
      profile_id TEXT NOT NULL,
      type TEXT NOT NULL,
      value REAL,
      unit TEXT,
      start_time TEXT NOT NULL,
      end_time TEXT,
      notes TEXT,
      created_at TEXT NOT NULL,
      FOREIGN KEY (profile_id) REFERENCES profiles(id) ON DELETE CASCADE
    );

    -- Calendar Events (SINGLE SOURCE OF TRUTH)
    CREATE TABLE IF NOT EXISTS calendar_events (
      id TEXT PRIMARY KEY,
      profile_id TEXT NOT NULL,
      event_type TEXT NOT NULL,
      source_id TEXT NOT NULL,
      title TEXT NOT NULL,
      scheduled_time TEXT NOT NULL,
      end_time TEXT,
      status TEXT DEFAULT 'pending',
      completed_time TEXT,
      metadata TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      FOREIGN KEY (profile_id) REFERENCES profiles(id) ON DELETE CASCADE
    );

    -- Emergency Data
    CREATE TABLE IF NOT EXISTS emergency_data (
      id TEXT PRIMARY KEY,
      profile_id TEXT UNIQUE NOT NULL,
      blood_type TEXT,
      allergies TEXT,
      medical_conditions TEXT,
      emergency_contacts TEXT,
      organ_donor INTEGER DEFAULT 0,
      notes TEXT,
      updated_at TEXT NOT NULL,
      FOREIGN KEY (profile_id) REFERENCES profiles(id) ON DELETE CASCADE
    );

    -- Medication Reference (pre-populated drug database)
    CREATE TABLE IF NOT EXISTS medication_reference (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      generic_name TEXT,
      brand_names TEXT,
      dosage_forms TEXT,
      common_strengths TEXT,
      interactions TEXT,
      category TEXT,
      last_updated TEXT
    );

    -- Symptoms table
    CREATE TABLE IF NOT EXISTS symptoms (
      id TEXT PRIMARY KEY,
      profile_id TEXT NOT NULL,
      name TEXT NOT NULL,
      severity INTEGER NOT NULL,
      frequency TEXT,
      notes TEXT,
      occurred_at TEXT NOT NULL,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      FOREIGN KEY (profile_id) REFERENCES profiles(id) ON DELETE CASCADE
    );

    -- Indexes for performance
    CREATE INDEX IF NOT EXISTS idx_calendar_profile_time 
      ON calendar_events(profile_id, scheduled_time);
    CREATE INDEX IF NOT EXISTS idx_calendar_source 
      ON calendar_events(source_id);
    CREATE INDEX IF NOT EXISTS idx_medication_history 
      ON medication_history(medication_id, scheduled_time DESC);
    CREATE INDEX IF NOT EXISTS idx_medications_profile 
      ON medications(profile_id);
    CREATE INDEX IF NOT EXISTS idx_appointments_profile 
      ON appointments(profile_id, scheduled_time);
    CREATE INDEX IF NOT EXISTS idx_medication_reference_name 
      ON medication_reference(name);
    CREATE INDEX IF NOT EXISTS idx_symptoms_profile_date
      ON symptoms(profile_id, occurred_at DESC);
  `);

  console.log('Database initialized successfully');
}

export async function closeDatabase(): Promise<void> {
  if (db) {
    await db.closeAsync();
    db = null;
  }
}

export async function resetDatabase(): Promise<void> {
  const database = await getDatabase();

  // Disable foreign keys to allow dropping tables
  await database.execAsync('PRAGMA foreign_keys = OFF;');

  // List of all tables
  const tables = [
    'profiles', 'medications', 'medication_history', 'appointments',
    'activities', 'supplements', 'supplement_history', 'calendar_events',
    'emergency_data', 'medication_reference', 'symptoms'
  ];

  for (const table of tables) {
    await database.execAsync(`DROP TABLE IF EXISTS ${table};`);
  }

  // Re-enable foreign keys
  await database.execAsync('PRAGMA foreign_keys = ON;');

  // Re-initialize (recreate tables)
  await initDatabase();

  console.log('Database reset successfully');
}

export { db };
