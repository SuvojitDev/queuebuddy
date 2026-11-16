import { getDatabase } from './database';
import {
  BusinessProfile,
  ServiceItem,
  CounterItem,
  TokenItem,
  TokenStatus,
  NotificationLog,
  QueueStats,
} from '../types/queue';
import { PRESETS } from '../constants/presets';

// Resilient in-memory fallback store for web environments where WebAssembly/OPFS is restricted
let fallbackProfile: BusinessProfile = { ...PRESETS.salon.profile };
let fallbackServices: ServiceItem[] = [...PRESETS.salon.services];
let fallbackCounters: CounterItem[] = [...PRESETS.salon.counters];
let fallbackTokens: TokenItem[] = PRESETS.salon.seedTokens.map((t, i) => ({
  ...t,
  id: `tkn_mem_${i}`,
  createdAt: Date.now() - (40 - i * 8) * 60 * 1000,
}));
let fallbackLogs: NotificationLog[] = [];

export const queueRepository = {
  // Business Profile
  async getBusinessProfile(): Promise<BusinessProfile | null> {
    const db = await getDatabase();
    if (!db) return fallbackProfile;

    try {
      const row = await db.getFirstAsync<any>(
        'SELECT * FROM business_profile LIMIT 1'
      );
      if (!row) return fallbackProfile;
      return {
        id: row.id,
        name: row.name,
        type: row.type,
        tagline: row.tagline || '',
        phone: row.phone || '',
        address: row.address || '',
        isOpen: Boolean(row.is_open),
        nearTurnThreshold: row.near_turn_threshold || 2,
        soundAlertsEnabled: Boolean(row.sound_alerts_enabled),
        hapticAlertsEnabled: Boolean(row.haptic_alerts_enabled),
      };
    } catch {
      return fallbackProfile;
    }
  },

  async updateBusinessProfile(profile: Partial<BusinessProfile>): Promise<void> {
    const db = await getDatabase();
    fallbackProfile = { ...fallbackProfile, ...profile };
    if (!db) return;

    try {
      const current = await this.getBusinessProfile();
      if (!current) return;

      await db.runAsync(
        `UPDATE business_profile SET
          name = COALESCE(?, name),
          type = COALESCE(?, type),
          tagline = COALESCE(?, tagline),
          phone = COALESCE(?, phone),
          address = COALESCE(?, address),
          is_open = COALESCE(?, is_open),
          near_turn_threshold = COALESCE(?, near_turn_threshold),
          sound_alerts_enabled = COALESCE(?, sound_alerts_enabled),
          haptic_alerts_enabled = COALESCE(?, haptic_alerts_enabled)
         WHERE id = ?`,
        [
          profile.name ?? null,
          profile.type ?? null,
          profile.tagline ?? null,
          profile.phone ?? null,
          profile.address ?? null,
          profile.isOpen !== undefined ? (profile.isOpen ? 1 : 0) : null,
          profile.nearTurnThreshold ?? null,
          profile.soundAlertsEnabled !== undefined ? (profile.soundAlertsEnabled ? 1 : 0) : null,
          profile.hapticAlertsEnabled !== undefined ? (profile.hapticAlertsEnabled ? 1 : 0) : null,
          current.id,
        ]
      );
    } catch {
      // Fallback updated in memory
    }
  },

  // Services
  async getServices(): Promise<ServiceItem[]> {
    const db = await getDatabase();
    if (!db) return fallbackServices;

    try {
      const rows = await db.getAllAsync<any>('SELECT * FROM services ORDER BY name ASC');
      return rows.map((r: any) => ({
        id: r.id,
        name: r.name,
        category: r.category,
        defaultDurationMinutes: r.default_duration_minutes,
        price: r.price,
        icon: r.icon,
        color: r.color,
      }));
    } catch {
      return fallbackServices;
    }
  },

  async saveService(service: ServiceItem): Promise<void> {
    const db = await getDatabase();
    const idx = fallbackServices.findIndex((s) => s.id === service.id);
    if (idx >= 0) {
      fallbackServices[idx] = service;
    } else {
      fallbackServices.push(service);
    }

    if (!db) return;
    try {
      await db.runAsync(
        `INSERT OR REPLACE INTO services (id, name, category, default_duration_minutes, price, icon, color)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
          service.id,
          service.name,
          service.category,
          service.defaultDurationMinutes,
          service.price,
          service.icon,
          service.color,
        ]
      );
    } catch {
      // safe fallback
    }
  },

  async deleteService(id: string): Promise<void> {
    fallbackServices = fallbackServices.filter((s) => s.id !== id);
    const db = await getDatabase();
    if (!db) return;
    try {
      await db.runAsync('DELETE FROM services WHERE id = ?', [id]);
    } catch {
      // safe fallback
    }
  },

  // Counters
  async getCounters(): Promise<CounterItem[]> {
    const db = await getDatabase();
    if (!db) {
      return fallbackCounters.map((c) => {
        const curToken = fallbackTokens.find((t) => t.id === c.currentTokenId);
        return {
          ...c,
          currentTokenNumber: curToken?.tokenNumber || null,
          currentCustomerName: curToken?.customerName || null,
        };
      });
    }

    try {
      const rows = await db.getAllAsync<any>(`
        SELECT c.*, t.token_number as current_token_number, t.customer_name as current_customer_name
        FROM counters c
        LEFT JOIN tokens t ON c.current_token_id = t.id
        ORDER BY c.id ASC
      `);
      return rows.map((r: any) => ({
        id: r.id,
        name: r.name,
        stationType: r.station_type,
        staffName: r.staff_name,
        status: r.status,
        currentTokenId: r.current_token_id,
        currentTokenNumber: r.current_token_number,
        currentCustomerName: r.current_customer_name,
      }));
    } catch {
      return fallbackCounters;
    }
  },

  async updateCounterStatus(
    counterId: string,
    status: 'IDLE' | 'SERVING' | 'BREAK',
    currentTokenId: string | null = null
  ): Promise<void> {
    const cIdx = fallbackCounters.findIndex((c) => c.id === counterId);
    if (cIdx >= 0) {
      fallbackCounters[cIdx].status = status;
      fallbackCounters[cIdx].currentTokenId = currentTokenId;
    }

    const db = await getDatabase();
    if (!db) return;
    try {
      await db.runAsync(
        `UPDATE counters SET status = ?, current_token_id = ? WHERE id = ?`,
        [status, currentTokenId, counterId]
      );
    } catch {
      // safe fallback
    }
  },

  // Tokens
  async getAllTokens(): Promise<TokenItem[]> {
    const db = await getDatabase();
    if (!db) return fallbackTokens;

    try {
      const rows = await db.getAllAsync<any>(
        'SELECT * FROM tokens ORDER BY created_at ASC'
      );
      return rows.map(mapTokenRow);
    } catch {
      return fallbackTokens;
    }
  },

  async getActiveTokens(): Promise<TokenItem[]> {
    const db = await getDatabase();
    if (!db) {
      return fallbackTokens
        .filter((t) => ['WAITING', 'NEAR', 'SERVING'].includes(t.status))
        .sort((a, b) => {
          if (a.status === 'SERVING' && b.status !== 'SERVING') return -1;
          if (a.status !== 'SERVING' && b.status === 'SERVING') return 1;
          if (a.isPriority && !b.isPriority) return -1;
          if (!a.isPriority && b.isPriority) return 1;
          return a.createdAt - b.createdAt;
        });
    }

    try {
      const rows = await db.getAllAsync<any>(`
        SELECT * FROM tokens 
        WHERE status IN ('WAITING', 'NEAR', 'SERVING')
        ORDER BY 
          CASE status 
            WHEN 'SERVING' THEN 1 
            WHEN 'NEAR' THEN 2 
            WHEN 'WAITING' THEN 3 
            ELSE 4 
          END ASC,
          is_priority DESC,
          created_at ASC
      `);
      return rows.map(mapTokenRow);
    } catch {
      return fallbackTokens;
    }
  },

  async getTokenById(id: string): Promise<TokenItem | null> {
    const db = await getDatabase();
    if (!db) return fallbackTokens.find((t) => t.id === id) || null;

    try {
      const row = await db.getFirstAsync<any>('SELECT * FROM tokens WHERE id = ?', [id]);
      return row ? mapTokenRow(row) : fallbackTokens.find((t) => t.id === id) || null;
    } catch {
      return fallbackTokens.find((t) => t.id === id) || null;
    }
  },

  async findTokenByQuery(query: string): Promise<TokenItem | null> {
    const cleanQuery = query.trim().toUpperCase();
    const db = await getDatabase();

    if (!db) {
      return (
        fallbackTokens.find(
          (t) =>
            t.tokenNumber.toUpperCase().includes(cleanQuery) ||
            t.customerPhone.includes(query.trim()) ||
            t.customerName.toUpperCase().includes(cleanQuery)
        ) || null
      );
    }

    try {
      const row = await db.getFirstAsync<any>(
        `SELECT * FROM tokens 
         WHERE UPPER(token_number) = ? 
            OR UPPER(token_number) LIKE ?
            OR customer_phone LIKE ? 
            OR UPPER(customer_name) LIKE ?
         ORDER BY created_at DESC LIMIT 1`,
        [cleanQuery, `%${cleanQuery}%`, `%${query.trim()}%`, `%${cleanQuery}%`]
      );
      return row ? mapTokenRow(row) : null;
    } catch {
      return (
        fallbackTokens.find(
          (t) =>
            t.tokenNumber.toUpperCase().includes(cleanQuery) ||
            t.customerPhone.includes(query.trim()) ||
            t.customerName.toUpperCase().includes(cleanQuery)
        ) || null
      );
    }
  },

  async swapTokenTimestamps(idA: string, idB: string): Promise<void> {
    const tokenA = fallbackTokens.find((t) => t.id === idA);
    const tokenB = fallbackTokens.find((t) => t.id === idB);
    if (tokenA && tokenB) {
      const temp = tokenA.createdAt;
      tokenA.createdAt = tokenB.createdAt;
      tokenB.createdAt = temp;
    }

    const db = await getDatabase();
    if (!db) return;

    try {
      const tA = await this.getTokenById(idA);
      const tB = await this.getTokenById(idB);
      if (!tA || !tB) return;

      await db.runAsync('UPDATE tokens SET created_at = ? WHERE id = ?', [tB.createdAt, tA.id]);
      await db.runAsync('UPDATE tokens SET created_at = ? WHERE id = ?', [tA.createdAt, tB.id]);
    } catch {
      // safe fallback
    }
  },

  async createToken(token: TokenItem): Promise<void> {
    fallbackTokens.push(token);
    const db = await getDatabase();
    if (!db) return;

    try {
      await db.runAsync(
        `INSERT INTO tokens (
          id, token_number, customer_name, customer_phone, service_id, service_name,
          status, is_priority, counter_id, counter_name, created_at, called_at,
          served_at, completed_at, estimated_wait_minutes, notes, notified_near, notified_serving,
          is_lobby_present, snooze_count
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          token.id,
          token.tokenNumber,
          token.customerName,
          token.customerPhone,
          token.serviceId,
          token.serviceName,
          token.status,
          token.isPriority ? 1 : 0,
          token.counterId || null,
          token.counterName || null,
          token.createdAt,
          token.calledAt || null,
          token.servedAt || null,
          token.completedAt || null,
          token.estimatedWaitMinutes,
          token.notes || '',
          token.notifiedNear ? 1 : 0,
          token.notifiedServing ? 1 : 0,
          token.isLobbyPresent ? 1 : 0,
          token.snoozeCount || 0,
        ]
      );
    } catch {
      // fallback stored in memory
    }
  },

  async updateTokenStatus(
    tokenId: string,
    status?: TokenStatus,
    updates: Partial<TokenItem> = {}
  ): Promise<void> {
    const tIdx = fallbackTokens.findIndex((t) => t.id === tokenId);
    if (tIdx >= 0) {
      fallbackTokens[tIdx] = {
        ...fallbackTokens[tIdx],
        ...updates,
        ...(status !== undefined ? { status } : {}),
      };
    }

    const db = await getDatabase();
    if (!db) return;

    try {
      const setClauses: string[] = [];
      const params: any[] = [];

      if (status !== undefined) {
        setClauses.push('status = ?');
        params.push(status);
      }

      if (updates.counterId !== undefined) {
        setClauses.push('counter_id = ?');
        params.push(updates.counterId);
      }
      if (updates.counterName !== undefined) {
        setClauses.push('counter_name = ?');
        params.push(updates.counterName);
      }
      if (updates.calledAt !== undefined) {
        setClauses.push('called_at = ?');
        params.push(updates.calledAt);
      }
      if (updates.servedAt !== undefined) {
        setClauses.push('served_at = ?');
        params.push(updates.servedAt);
      }
      if (updates.completedAt !== undefined) {
        setClauses.push('completed_at = ?');
        params.push(updates.completedAt);
      }
      if (updates.estimatedWaitMinutes !== undefined) {
        setClauses.push('estimated_wait_minutes = ?');
        params.push(updates.estimatedWaitMinutes);
      }
      if (updates.notifiedNear !== undefined) {
        setClauses.push('notified_near = ?');
        params.push(updates.notifiedNear ? 1 : 0);
      }
      if (updates.notifiedServing !== undefined) {
        setClauses.push('notified_serving = ?');
        params.push(updates.notifiedServing ? 1 : 0);
      }
      if (updates.isLobbyPresent !== undefined) {
        setClauses.push('is_lobby_present = ?');
        params.push(updates.isLobbyPresent ? 1 : 0);
      }
      if (updates.snoozeCount !== undefined) {
        setClauses.push('snooze_count = ?');
        params.push(updates.snoozeCount);
      }

      if (setClauses.length === 0) return;

      params.push(tokenId);
      await db.runAsync(
        `UPDATE tokens SET ${setClauses.join(', ')} WHERE id = ?`,
        params
      );
    } catch {
      // safe fallback
    }
  },

  async updateEstimatedWaitTimes(waitMap: Record<string, number>): Promise<void> {
    for (const [tokenId, waitMins] of Object.entries(waitMap)) {
      const t = fallbackTokens.find((item) => item.id === tokenId);
      if (t) t.estimatedWaitMinutes = waitMins;
    }

    const db = await getDatabase();
    if (!db) return;

    try {
      for (const [tokenId, waitMins] of Object.entries(waitMap)) {
        await db.runAsync(
          `UPDATE tokens SET estimated_wait_minutes = ? WHERE id = ? AND status IN ('WAITING', 'NEAR')`,
          [waitMins, tokenId]
        );
      }
    } catch {
      // safe fallback
    }
  },

  // Notification logs
  async logNotification(log: NotificationLog): Promise<void> {
    fallbackLogs.unshift(log);
    const db = await getDatabase();
    if (!db) return;

    try {
      await db.runAsync(
        `INSERT INTO notification_logs (id, token_id, token_number, customer_name, customer_phone, type, channel, message, timestamp, status)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          log.id,
          log.tokenId,
          log.tokenNumber,
          log.customerName,
          log.customerPhone,
          log.type,
          log.channel,
          log.message,
          log.timestamp,
          log.status,
        ]
      );
    } catch {
      // safe fallback
    }
  },

  async getNotificationLogs(): Promise<NotificationLog[]> {
    const db = await getDatabase();
    if (!db) return fallbackLogs;

    try {
      const rows = await db.getAllAsync<any>(
        'SELECT * FROM notification_logs ORDER BY timestamp DESC LIMIT 50'
      );
      return rows.map((r: any) => ({
        id: r.id,
        tokenId: r.token_id,
        tokenNumber: r.token_number,
        customerName: r.customer_name,
        customerPhone: r.customer_phone,
        type: r.type,
        channel: r.channel,
        message: r.message,
        timestamp: r.timestamp,
        status: r.status,
      }));
    } catch {
      return fallbackLogs;
    }
  },

  // Preset switching & Reset
  async loadPreset(presetKey: 'salon' | 'clinic' | 'repair'): Promise<void> {
    const preset = PRESETS[presetKey];
    if (!preset) return;

    fallbackProfile = { ...preset.profile };
    fallbackServices = [...preset.services];
    fallbackCounters = [...preset.counters];
    fallbackTokens = preset.seedTokens.map((t, i) => ({
      ...t,
      id: `tkn_mem_${Date.now()}_${i}`,
      createdAt: Date.now() - (40 - i * 8) * 60 * 1000,
    }));
    fallbackTokens.forEach((t) => {
      if (t.status === 'SERVING' && t.counterId) {
        const c = fallbackCounters.find((cnt) => cnt.id === t.counterId);
        if (c) {
          c.status = 'SERVING';
          c.currentTokenId = t.id;
        }
      }
    });
    fallbackLogs = [];

    const db = await getDatabase();
    if (!db) return;

    try {
      await db.runAsync('DELETE FROM notification_logs');
      await db.runAsync('DELETE FROM tokens');
      await db.runAsync('DELETE FROM counters');
      await db.runAsync('DELETE FROM services');
      await db.runAsync('DELETE FROM business_profile');

      await db.runAsync(
        `INSERT INTO business_profile (id, name, type, tagline, phone, address, is_open, near_turn_threshold, sound_alerts_enabled, haptic_alerts_enabled)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          preset.profile.id,
          preset.profile.name,
          preset.profile.type,
          preset.profile.tagline,
          preset.profile.phone,
          preset.profile.address,
          preset.profile.isOpen ? 1 : 0,
          preset.profile.nearTurnThreshold,
          preset.profile.soundAlertsEnabled ? 1 : 0,
          preset.profile.hapticAlertsEnabled ? 1 : 0,
        ]
      );

      for (const s of preset.services) {
        await db.runAsync(
          `INSERT INTO services (id, name, category, default_duration_minutes, price, icon, color)
           VALUES (?, ?, ?, ?, ?, ?, ?)`,
          [s.id, s.name, s.category, s.defaultDurationMinutes, s.price, s.icon, s.color]
        );
      }

      for (const c of preset.counters) {
        await db.runAsync(
          `INSERT INTO counters (id, name, station_type, staff_name, status, current_token_id)
           VALUES (?, ?, ?, ?, ?, ?)`,
          [c.id, c.name, c.stationType, c.staffName || '', c.status, null]
        );
      }

      const now = Date.now();
      for (let i = 0; i < preset.seedTokens.length; i++) {
        const t = preset.seedTokens[i];
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

        if (t.status === 'SERVING' && t.counterId) {
          await db.runAsync(
            `UPDATE counters SET status = 'SERVING', current_token_id = ? WHERE id = ?`,
            [tokenId, t.counterId]
          );
        }
      }
    } catch {
      // safe fallback
    }
  },

  async clearTodayQueue(): Promise<void> {
    fallbackTokens = [];
    fallbackLogs = [];
    fallbackCounters.forEach((c) => {
      c.status = 'IDLE';
      c.currentTokenId = null;
    });

    const db = await getDatabase();
    if (!db) return;

    try {
      await db.runAsync('DELETE FROM tokens');
      await db.runAsync('DELETE FROM notification_logs');
      await db.runAsync(`UPDATE counters SET status = 'IDLE', current_token_id = NULL`);
    } catch {
      // safe fallback
    }
  },

  async getQueueStats(): Promise<QueueStats> {
    const totalToday = fallbackTokens.length;
    const waitingCount = fallbackTokens.filter((t) => ['WAITING', 'NEAR'].includes(t.status)).length;
    const servingCount = fallbackTokens.filter((t) => t.status === 'SERVING').length;
    const completedCount = fallbackTokens.filter((t) => t.status === 'COMPLETED').length;

    const db = await getDatabase();
    if (!db) {
      return {
        totalToday,
        waitingCount,
        servingCount,
        completedCount,
        avgWaitMinutes: 15,
        avgServiceMinutes: 22,
      };
    }

    try {
      const totalRow = await db.getFirstAsync<{ count: number }>('SELECT COUNT(*) as count FROM tokens');
      const waitingRow = await db.getFirstAsync<{ count: number }>(
        "SELECT COUNT(*) as count FROM tokens WHERE status IN ('WAITING', 'NEAR')"
      );
      const servingRow = await db.getFirstAsync<{ count: number }>(
        "SELECT COUNT(*) as count FROM tokens WHERE status = 'SERVING'"
      );
      const completedRow = await db.getFirstAsync<{ count: number }>(
        "SELECT COUNT(*) as count FROM tokens WHERE status = 'COMPLETED'"
      );

      const avgDurationRow = await db.getFirstAsync<{ avgDuration: number | null }>(`
        SELECT AVG((completed_at - served_at) / 60000.0) as avgDuration 
        FROM tokens 
        WHERE status = 'COMPLETED' AND served_at IS NOT NULL AND completed_at IS NOT NULL
      `);

      const avgWaitRow = await db.getFirstAsync<{ avgWait: number | null }>(`
        SELECT AVG(estimated_wait_minutes) as avgWait
        FROM tokens
        WHERE status IN ('WAITING', 'NEAR')
      `);

      return {
        totalToday: totalRow?.count || totalToday,
        waitingCount: waitingRow?.count || waitingCount,
        servingCount: servingRow?.count || servingCount,
        completedCount: completedRow?.count || completedCount,
        avgWaitMinutes: Math.round(avgWaitRow?.avgWait || 15),
        avgServiceMinutes: Math.round(avgDurationRow?.avgDuration || 22),
      };
    } catch {
      return {
        totalToday,
        waitingCount,
        servingCount,
        completedCount,
        avgWaitMinutes: 15,
        avgServiceMinutes: 22,
      };
    }
  },
};

function mapTokenRow(r: any): TokenItem {
  return {
    id: r.id,
    tokenNumber: r.token_number,
    customerName: r.customer_name,
    customerPhone: r.customer_phone,
    serviceId: r.service_id,
    serviceName: r.service_name,
    status: r.status as TokenStatus,
    isPriority: Boolean(r.is_priority),
    counterId: r.counter_id,
    counterName: r.counter_name,
    createdAt: r.created_at,
    calledAt: r.called_at,
    servedAt: r.served_at,
    completedAt: r.completed_at,
    estimatedWaitMinutes: r.estimated_wait_minutes,
    notes: r.notes || '',
    notifiedNear: Boolean(r.notified_near),
    notifiedServing: Boolean(r.notified_serving),
    isLobbyPresent: Boolean(r.is_lobby_present),
    snoozeCount: r.snooze_count || 0,
  };
}
