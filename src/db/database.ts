import { Platform } from 'react-native';
import * as SQLite from 'expo-sqlite';
import { PRESETS } from '../constants/presets';

const DB_NAME = 'queuebuddy.db';
let dbInstance: SQLite.SQLiteDatabase | null = null;

export async function getDatabase(): Promise<SQLite.SQLiteDatabase | null> {
  if (dbInstance) {
    return dbInstance;
  }

  try {
    const db = await SQLite.openDatabaseAsync(DB_NAME);

    // Only run WAL on native iOS/Android. On web, wa-sqlite worker does not support WAL xFileControl!
    if (Platform.OS !== 'web') {
      try {
        await db.execAsync(`
          PRAGMA journal_mode = WAL;
          PRAGMA foreign_keys = ON;
        `);
      } catch (err) {
        console.warn('Failed to set WAL pragma on native:', err);
      }
    } else {
      try {
        await db.execAsync('PRAGMA foreign_keys = ON;');
      } catch {
        // Safe fallback for web
      }
    }

    await initializeSchema(db);
    await seedInitialData(db);

    dbInstance = db;
    return dbInstance;
  } catch (err) {
    console.warn('expo-sqlite not available or worker error, using resilient fallback:', err);
    return null;
  }
}

async function initializeSchema(db: SQLite.SQLiteDatabase): Promise<void> {
  await db.execAsync(`
    -- Business Profile
    CREATE TABLE IF NOT EXISTS business_profile (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      type TEXT NOT NULL,
      tagline TEXT,
      phone TEXT,
      address TEXT,
      is_open INTEGER DEFAULT 1,
      near_turn_threshold INTEGER DEFAULT 2,
      sound_alerts_enabled INTEGER DEFAULT 1,
      haptic_alerts_enabled INTEGER DEFAULT 1
    );

    -- Services catalog
    CREATE TABLE IF NOT EXISTS services (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      category TEXT NOT NULL,
      default_duration_minutes INTEGER NOT NULL,
      price REAL NOT NULL,
      icon TEXT NOT NULL,
      color TEXT NOT NULL
    );

    -- Counters / Stations
    CREATE TABLE IF NOT EXISTS counters (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      station_type TEXT NOT NULL,
      staff_name TEXT,
      status TEXT DEFAULT 'IDLE',
      current_token_id TEXT
    );

    -- Tokens table
    CREATE TABLE IF NOT EXISTS tokens (
      id TEXT PRIMARY KEY,
      token_number TEXT NOT NULL,
      customer_name TEXT NOT NULL,
      customer_phone TEXT NOT NULL,
      service_id TEXT NOT NULL,
      service_name TEXT NOT NULL,
      status TEXT NOT NULL,
      is_priority INTEGER DEFAULT 0,
      counter_id TEXT,
      counter_name TEXT,
      created_at INTEGER NOT NULL,
      called_at INTEGER,
      served_at INTEGER,
      completed_at INTEGER,
      estimated_wait_minutes INTEGER NOT NULL,
      notes TEXT,
      notified_near INTEGER DEFAULT 0,
      notified_serving INTEGER DEFAULT 0,
      is_lobby_present INTEGER DEFAULT 0,
      snooze_count INTEGER DEFAULT 0
    );

    -- Notification logs
    CREATE TABLE IF NOT EXISTS notification_logs (
      id TEXT PRIMARY KEY,
      token_id TEXT NOT NULL,
      token_number TEXT NOT NULL,
      customer_name TEXT NOT NULL,
      customer_phone TEXT NOT NULL,
      type TEXT NOT NULL,
      channel TEXT NOT NULL,
      message TEXT NOT NULL,
      timestamp INTEGER NOT NULL,
      status TEXT DEFAULT 'SENT'
    );

    -- Indexes for real-time queue queries
    CREATE INDEX IF NOT EXISTS idx_tokens_status ON tokens(status);
    CREATE INDEX IF NOT EXISTS idx_tokens_created_at ON tokens(created_at ASC);
    CREATE INDEX IF NOT EXISTS idx_tokens_token_number ON tokens(token_number);
    CREATE INDEX IF NOT EXISTS idx_notifications_timestamp ON notification_logs(timestamp DESC);
  `);

  // Safe migration for existing SQLite databases
  try {
    await db.execAsync(`
      ALTER TABLE tokens ADD COLUMN is_lobby_present INTEGER DEFAULT 0;
    `);
  } catch {
    // Column already exists
  }
  try {
    await db.execAsync(`
      ALTER TABLE tokens ADD COLUMN snooze_count INTEGER DEFAULT 0;
    `);
  } catch {
    // Column already exists
  }
}

async function seedInitialData(db: SQLite.SQLiteDatabase): Promise<void> {
  const profileRow = await db.getFirstAsync<{ count: number }>(
    'SELECT COUNT(*) as count FROM business_profile'
  );

  if (!profileRow || profileRow.count === 0) {
    const salonPreset = PRESETS.salon;

    // Seed profile
    await db.runAsync(
      `INSERT INTO business_profile (id, name, type, tagline, phone, address, is_open, near_turn_threshold, sound_alerts_enabled, haptic_alerts_enabled)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        salonPreset.profile.id,
        salonPreset.profile.name,
        salonPreset.profile.type,
        salonPreset.profile.tagline,
        salonPreset.profile.phone,
        salonPreset.profile.address,
        salonPreset.profile.isOpen ? 1 : 0,
        salonPreset.profile.nearTurnThreshold,
        salonPreset.profile.soundAlertsEnabled ? 1 : 0,
        salonPreset.profile.hapticAlertsEnabled ? 1 : 0,
      ]
    );

    // Seed services
    for (const s of salonPreset.services) {
      await db.runAsync(
        `INSERT INTO services (id, name, category, default_duration_minutes, price, icon, color)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [s.id, s.name, s.category, s.defaultDurationMinutes, s.price, s.icon, s.color]
      );
    }

    // Seed counters
    for (const c of salonPreset.counters) {
      await db.runAsync(
        `INSERT INTO counters (id, name, station_type, staff_name, status, current_token_id)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [c.id, c.name, c.stationType, c.staffName || '', c.status, c.currentTokenId || null]
      );
    }

    // Seed initial tokens
    const now = Date.now();
    for (let i = 0; i < salonPreset.seedTokens.length; i++) {
      const t = salonPreset.seedTokens[i];
      const tokenId = `tkn_${Date.now()}_${i}`;
      await db.runAsync(
        `INSERT INTO tokens (id, token_number, customer_name, customer_phone, service_id, service_name, status, is_priority, counter_id, counter_name, created_at, called_at, served_at, completed_at, estimated_wait_minutes, notes, notified_near, notified_serving)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          tokenId,
          t.tokenNumber,
          t.customerName,
          t.customerPhone,
          t.serviceId,
          t.serviceName,
          t.status,
          t.isPriority ? 1 : 0,
          t.counterId || null,
          t.counterName || null,
          now - (40 - i * 8) * 60 * 1000,
          t.calledAt || null,
          t.servedAt || null,
          t.completedAt || null,
          t.estimatedWaitMinutes,
          t.notes || '',
          t.notifiedNear ? 1 : 0,
          t.notifiedServing ? 1 : 0,
        ]
      );

      // Link counter if serving
      if (t.status === 'SERVING' && t.counterId) {
        await db.runAsync(
          `UPDATE counters SET status = 'SERVING', current_token_id = ? WHERE id = ?`,
          [tokenId, t.counterId]
        );
      }
    }
  }
}
