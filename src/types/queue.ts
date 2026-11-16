export type BusinessType = 'salon' | 'clinic' | 'repair' | 'custom';

export type TokenStatus = 'WAITING' | 'NEAR' | 'SERVING' | 'COMPLETED' | 'NO_SHOW' | 'CANCELLED';

export interface ServiceItem {
  id: string;
  name: string;
  category: string;
  defaultDurationMinutes: number;
  price: number;
  icon: string;
  color: string;
}

export interface CounterItem {
  id: string;
  name: string;
  stationType: string; // e.g. "Chair", "Doctor Desk", "Repair Bench"
  staffName?: string;
  status: 'IDLE' | 'SERVING' | 'BREAK';
  currentTokenId?: string | null;
  currentTokenNumber?: string | null;
  currentCustomerName?: string | null;
}

export interface TokenItem {
  id: string;
  tokenNumber: string;
  customerName: string;
  customerPhone: string;
  serviceId: string;
  serviceName: string;
  status: TokenStatus;
  isPriority: boolean;
  counterId?: string | null;
  counterName?: string | null;
  createdAt: number;
  calledAt?: number | null;
  servedAt?: number | null;
  completedAt?: number | null;
  estimatedWaitMinutes: number;
  notes?: string;
  notifiedNear?: boolean;
  notifiedServing?: boolean;
  isLobbyPresent?: boolean;
  snoozeCount?: number;
}

export interface BusinessProfile {
  id: string;
  name: string;
  type: BusinessType;
  tagline: string;
  phone: string;
  address: string;
  isOpen: boolean;
  nearTurnThreshold: number; // e.g. Alert when <= 2 people ahead or <= 10 min
  soundAlertsEnabled: boolean;
  hapticAlertsEnabled: boolean;
}

export interface NotificationLog {
  id: string;
  tokenId: string;
  tokenNumber: string;
  customerName: string;
  customerPhone: string;
  type: 'NEAR_TURN' | 'NOW_SERVING' | 'DELAY' | 'COMPLETED';
  channel: 'IN_APP' | 'SMS' | 'WHATSAPP';
  message: string;
  timestamp: number;
  status: 'SENT' | 'SIMULATED';
}

export interface QueueStats {
  totalToday: number;
  waitingCount: number;
  servingCount: number;
  completedCount: number;
  avgWaitMinutes: number;
  avgServiceMinutes: number;
}
