import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import {
  BusinessProfile,
  ServiceItem,
  CounterItem,
  TokenItem,
  TokenStatus,
  NotificationLog,
  QueueStats,
  BusinessType,
} from '../types/queue';
import { queueRepository } from '../db/queueRepository';
import { calculateQueueWaitTimes } from '../utils/timeEstimator';
import {
  triggerHaptic,
  playChimeSound,
  buildNearTurnMessage,
  buildNowServingMessage,
  sendSMSNotification,
  sendWhatsAppNotification,
} from '../utils/notificationHelper';
import { PRESETS } from '../constants/presets';

interface ActiveCustomerAlert {
  token: TokenItem;
  title: string;
  message: string;
  type: 'NEAR' | 'SERVING';
}

interface QueueContextType {
  profile: BusinessProfile | null;
  services: ServiceItem[];
  counters: CounterItem[];
  tokens: TokenItem[];
  activeTokens: TokenItem[];
  servingTokens: TokenItem[];
  waitingTokens: TokenItem[];
  completedTokens: TokenItem[];
  notifications: NotificationLog[];
  stats: QueueStats;
  isLoading: boolean;
  currentCustomerToken: TokenItem | null;
  activeCustomerAlert: ActiveCustomerAlert | null;

  // Actions
  generateToken: (
    customerName: string,
    customerPhone: string,
    serviceId: string,
    isPriority?: boolean,
    notes?: string
  ) => Promise<TokenItem>;
  callNextCustomer: (counterId?: string) => Promise<TokenItem | null>;
  startServingToken: (tokenId: string, counterId: string) => Promise<void>;
  completeToken: (tokenId: string) => Promise<void>;
  markNoShowOrCancel: (tokenId: string, status: 'NO_SHOW' | 'CANCELLED') => Promise<void>;
  alertCustomerNearTurn: (tokenId: string) => Promise<void>;
  bumpToken: (tokenId: string, direction: 'UP' | 'DOWN') => Promise<void>;
  checkInLobby: (tokenId: string, isPresent?: boolean) => Promise<void>;
  snoozeToken: (tokenId: string, delaySpots?: number) => Promise<void>;
  setCounterStatus: (counterId: string, status: 'IDLE' | 'SERVING' | 'BREAK') => Promise<void>;
  updateBusinessProfile: (profile: Partial<BusinessProfile>) => Promise<void>;
  switchPreset: (type: 'salon' | 'clinic' | 'repair') => Promise<void>;
  clearTodayQueue: () => Promise<void>;
  trackCustomerToken: (query: string) => Promise<TokenItem | null>;
  setCurrentCustomerToken: (token: TokenItem | null) => void;
  dismissCustomerAlert: () => void;
  sendManualCustomerNotification: (tokenId: string, channel: 'SMS' | 'WHATSAPP') => Promise<void>;
  refreshQueue: () => Promise<void>;
}

const QueueContext = createContext<QueueContextType | undefined>(undefined);

export const QueueProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [profile, setProfile] = useState<BusinessProfile | null>(null);
  const [services, setServices] = useState<ServiceItem[]>([]);
  const [counters, setCounters] = useState<CounterItem[]>([]);
  const [tokens, setTokens] = useState<TokenItem[]>([]);
  const [notifications, setNotifications] = useState<NotificationLog[]>([]);
  const [stats, setStats] = useState<QueueStats>({
    totalToday: 0,
    waitingCount: 0,
    servingCount: 0,
    completedCount: 0,
    avgWaitMinutes: 0,
    avgServiceMinutes: 0,
  });
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [currentCustomerToken, setCurrentCustomerToken] = useState<TokenItem | null>(null);
  const [activeCustomerAlert, setActiveCustomerAlert] = useState<ActiveCustomerAlert | null>(null);

  // Load all data
  const loadData = useCallback(async () => {
    try {
      const [prof, srvs, ctrs, tkns, notifs, st] = await Promise.all([
        queueRepository.getBusinessProfile(),
        queueRepository.getServices(),
        queueRepository.getCounters(),
        queueRepository.getAllTokens(),
        queueRepository.getNotificationLogs(),
        queueRepository.getQueueStats(),
      ]);

      setProfile(prof);
      setServices(srvs);
      setCounters(ctrs);
      setTokens(tkns);
      setNotifications(notifs);
      setStats(st);

      // If customer is tracking a token, refresh its status
      if (currentCustomerToken) {
        const updated = tkns.find((t) => t.id === currentCustomerToken.id);
        if (updated) {
          setCurrentCustomerToken(updated);
        }
      }
    } catch (err) {
      console.error('Failed to load queue data:', err);
    } finally {
      setIsLoading(false);
    }
  }, [currentCustomerToken]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Derived token subsets
  const activeTokens = tokens.filter((t) =>
    ['WAITING', 'NEAR', 'SERVING'].includes(t.status)
  );
  const servingTokens = tokens.filter((t) => t.status === 'SERVING');
  const waitingTokens = tokens.filter((t) =>
    ['WAITING', 'NEAR'].includes(t.status)
  );
  const completedTokens = tokens.filter((t) =>
    ['COMPLETED', 'NO_SHOW', 'CANCELLED'].includes(t.status)
  );

  // Recalculate dynamic wait times whenever queue changes
  const recalculateWaitTimes = useCallback(
    async (
      currentWaitings: TokenItem[],
      currentCounters: CounterItem[],
      currentServices: ServiceItem[],
      currentServings: TokenItem[] = []
    ) => {
      const waitMap = calculateQueueWaitTimes(
        currentWaitings,
        currentCounters,
        currentServices,
        currentServings
      );
      await queueRepository.updateEstimatedWaitTimes(waitMap);
    },
    []
  );

  // Auto near-turn promotion
  const checkAutoNearTurn = async (
    currentWaitings: TokenItem[],
    currentProfile: BusinessProfile | null
  ) => {
    if (!currentProfile) return;
    const threshold = currentProfile.nearTurnThreshold || 2;
    const candidates = currentWaitings.slice(0, threshold);

    for (const token of candidates) {
      if (token.status === 'WAITING' && !token.notifiedNear) {
        await queueRepository.updateTokenStatus(token.id, 'NEAR', {
          notifiedNear: true,
          estimatedWaitMinutes: Math.min(token.estimatedWaitMinutes, 5),
        });

        const alertMsg = buildNearTurnMessage(
          token,
          currentProfile.name,
          token.counterName
        );
        const log: NotificationLog = {
          id: `notif_${Date.now()}_${token.id}`,
          tokenId: token.id,
          tokenNumber: token.tokenNumber,
          customerName: token.customerName,
          customerPhone: token.customerPhone,
          type: 'NEAR_TURN',
          channel: 'IN_APP',
          message: alertMsg,
          timestamp: Date.now(),
          status: 'SENT',
        };
        await queueRepository.logNotification(log);

        if (currentProfile.soundAlertsEnabled) playChimeSound();
        if (currentProfile.hapticAlertsEnabled) await triggerHaptic('warning');

        setActiveCustomerAlert({
          token: { ...token, status: 'NEAR' },
          title: 'Turn is Approaching!',
          message: alertMsg,
          type: 'NEAR',
        });
      }
    }
  };

  // Generate Digital Token
  const generateToken = async (
    customerName: string,
    customerPhone: string,
    serviceId: string,
    isPriority: boolean = false,
    notes: string = ''
  ): Promise<TokenItem> => {
    const selectedService = services.find((s) => s.id === serviceId) || services[0];
    const prefix = profile?.type === 'clinic' ? 'C' : profile?.type === 'repair' ? 'R' : 'S';

    // Calculate next token number sequence by finding highest existing number
    let highestNum = 0;
    for (const t of tokens) {
      const match = t.tokenNumber.match(/\d+$/);
      if (match) {
        const num = parseInt(match[0], 10);
        if (num > highestNum) highestNum = num;
      }
    }
    const nextNum = Math.max(tokens.length + 1, highestNum + 1);
    const seqStr = nextNum < 10 ? `0${nextNum}` : `${nextNum}`;
    const tokenNumber = `${prefix}-${seqStr}`;

    // Calculate wait time
    const waitMap = calculateQueueWaitTimes(
      [...waitingTokens],
      counters,
      services,
      servingTokens
    );
    const estimatedWait = waitMap['temp'] ?? Math.max(5, waitingTokens.length * 15);

    const newToken: TokenItem = {
      id: `tkn_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      tokenNumber,
      customerName: customerName.trim(),
      customerPhone: customerPhone.trim(),
      serviceId: selectedService.id,
      serviceName: selectedService.name,
      status: 'WAITING',
      isPriority,
      createdAt: Date.now(),
      estimatedWaitMinutes: estimatedWait,
      notes,
      notifiedNear: false,
      notifiedServing: false,
    };

    await queueRepository.createToken(newToken);
    await recalculateWaitTimes(
      [...waitingTokens, newToken],
      counters,
      services,
      servingTokens
    );

    if (profile?.hapticAlertsEnabled) {
      await triggerHaptic('success');
    }

    // Set as customer's active token for live tracking
    setCurrentCustomerToken(newToken);

    await loadData();
    return newToken;
  };

  // Call Next Customer
  const callNextCustomer = async (counterId?: string): Promise<TokenItem | null> => {
    // Find next candidate in queue (prioritizing priority tokens and NEAR tokens first)
    const nextInLine = waitingTokens[0];
    if (!nextInLine) return null;

    // Determine counter to assign
    let targetCounter = counters.find((c) => c.id === counterId);
    if (!targetCounter) {
      targetCounter = counters.find((c) => c.status === 'IDLE') || counters[0];
    }

    // Update token status to NEAR
    await queueRepository.updateTokenStatus(nextInLine.id, 'NEAR', {
      counterId: targetCounter?.id,
      counterName: targetCounter ? `${targetCounter.name} (${targetCounter.staffName || ''})` : 'Next Available',
      calledAt: Date.now(),
      notifiedNear: true,
      estimatedWaitMinutes: 2,
    });

    if (targetCounter) {
      await queueRepository.updateCounterStatus(targetCounter.id, 'IDLE', nextInLine.id);
    }

    const remainingWaitings = waitingTokens.filter((t) => t.id !== nextInLine.id);
    await recalculateWaitTimes(remainingWaitings, counters, services, servingTokens);

    // Sound chime and haptic
    if (profile?.soundAlertsEnabled) playChimeSound();
    if (profile?.hapticAlertsEnabled) await triggerHaptic('warning');

    // Create Notification Log
    const alertMsg = buildNearTurnMessage(
      nextInLine,
      profile?.name || 'QueueBuddy',
      targetCounter?.name
    );
    const log: NotificationLog = {
      id: `notif_${Date.now()}`,
      tokenId: nextInLine.id,
      tokenNumber: nextInLine.tokenNumber,
      customerName: nextInLine.customerName,
      customerPhone: nextInLine.customerPhone,
      type: 'NEAR_TURN',
      channel: 'IN_APP',
      message: alertMsg,
      timestamp: Date.now(),
      status: 'SENT',
    };
    await queueRepository.logNotification(log);

    // Trigger in-app alert banner
    setActiveCustomerAlert({
      token: { ...nextInLine, counterName: targetCounter?.name },
      title: 'Turn is Approaching!',
      message: alertMsg,
      type: 'NEAR',
    });

    await loadData();
    return nextInLine;
  };

  // Start Serving Token
  const startServingToken = async (tokenId: string, counterId: string): Promise<void> => {
    const targetToken = tokens.find((t) => t.id === tokenId);
    const targetCounter = counters.find((c) => c.id === counterId);
    if (!targetToken) return;

    await queueRepository.updateTokenStatus(tokenId, 'SERVING', {
      counterId: targetCounter?.id,
      counterName: targetCounter ? `${targetCounter.name} (${targetCounter.staffName || ''})` : undefined,
      servedAt: Date.now(),
      notifiedServing: true,
      estimatedWaitMinutes: 0,
    });

    if (targetCounter) {
      await queueRepository.updateCounterStatus(targetCounter.id, 'SERVING', tokenId);
    }

    // Play chime and haptics
    if (profile?.soundAlertsEnabled) playChimeSound();
    if (profile?.hapticAlertsEnabled) await triggerHaptic('success');

    // Notification
    const serveMsg = buildNowServingMessage(
      targetToken,
      profile?.name || 'QueueBuddy',
      targetCounter?.name
    );
    const log: NotificationLog = {
      id: `notif_${Date.now()}`,
      tokenId: targetToken.id,
      tokenNumber: targetToken.tokenNumber,
      customerName: targetToken.customerName,
      customerPhone: targetToken.customerPhone,
      type: 'NOW_SERVING',
      channel: 'IN_APP',
      message: serveMsg,
      timestamp: Date.now(),
      status: 'SENT',
    };
    await queueRepository.logNotification(log);

    setActiveCustomerAlert({
      token: { ...targetToken, counterName: targetCounter?.name },
      title: 'Now Serving!',
      message: serveMsg,
      type: 'SERVING',
    });

    await loadData();
  };

  // Complete Token
  const completeToken = async (tokenId: string): Promise<void> => {
    const targetToken = tokens.find((t) => t.id === tokenId);
    if (!targetToken) return;

    await queueRepository.updateTokenStatus(tokenId, 'COMPLETED', {
      completedAt: Date.now(),
    });

    // Free any counter assigned to this token
    const relatedCounters = counters.filter(
      (c) => c.currentTokenId === tokenId || c.id === targetToken.counterId
    );
    for (const c of relatedCounters) {
      await queueRepository.updateCounterStatus(c.id, 'IDLE', null);
    }

    if (profile?.hapticAlertsEnabled) await triggerHaptic('success');

    // Recalculate remaining wait times and trigger near-turn alert for upcoming customer
    const remainingWaitings = waitingTokens.filter((t) => t.id !== tokenId);
    const remainingServings = servingTokens.filter((t) => t.id !== tokenId);
    await recalculateWaitTimes(remainingWaitings, counters, services, remainingServings);
    await checkAutoNearTurn(remainingWaitings, profile);

    await loadData();
  };

  // No-Show or Cancel
  const markNoShowOrCancel = async (tokenId: string, status: 'NO_SHOW' | 'CANCELLED'): Promise<void> => {
    const targetToken = tokens.find((t) => t.id === tokenId);
    if (!targetToken) return;

    await queueRepository.updateTokenStatus(tokenId, status, {
      completedAt: Date.now(),
    });

    const relatedCounters = counters.filter(
      (c) => c.currentTokenId === tokenId || c.id === targetToken.counterId
    );
    for (const c of relatedCounters) {
      await queueRepository.updateCounterStatus(c.id, 'IDLE', null);
    }

    const remainingWaitings = waitingTokens.filter((t) => t.id !== tokenId);
    const remainingServings = servingTokens.filter((t) => t.id !== tokenId);
    await recalculateWaitTimes(remainingWaitings, counters, services, remainingServings);
    await checkAutoNearTurn(remainingWaitings, profile);

    await loadData();
  };

  // Alert Customer Near Turn
  const alertCustomerNearTurn = async (tokenId: string): Promise<void> => {
    const targetToken = tokens.find((t) => t.id === tokenId);
    if (!targetToken) return;

    await queueRepository.updateTokenStatus(tokenId, 'NEAR', {
      notifiedNear: true,
      estimatedWaitMinutes: Math.min(targetToken.estimatedWaitMinutes, 5),
    });

    if (profile?.soundAlertsEnabled) playChimeSound();
    if (profile?.hapticAlertsEnabled) await triggerHaptic('warning');

    const alertMsg = buildNearTurnMessage(
      targetToken,
      profile?.name || 'QueueBuddy',
      targetToken.counterName
    );
    const log: NotificationLog = {
      id: `notif_${Date.now()}`,
      tokenId: targetToken.id,
      tokenNumber: targetToken.tokenNumber,
      customerName: targetToken.customerName,
      customerPhone: targetToken.customerPhone,
      type: 'NEAR_TURN',
      channel: 'IN_APP',
      message: alertMsg,
      timestamp: Date.now(),
      status: 'SENT',
    };
    await queueRepository.logNotification(log);

    setActiveCustomerAlert({
      token: targetToken,
      title: 'Turn is Near!',
      message: alertMsg,
      type: 'NEAR',
    });

    await loadData();
  };

  // Bump Token (reorder)
  const bumpToken = async (tokenId: string, direction: 'UP' | 'DOWN'): Promise<void> => {
    const index = waitingTokens.findIndex((t) => t.id === tokenId);
    if (index === -1) return;

    const target = waitingTokens[index];
    const swapIndex = direction === 'UP' ? index - 1 : index + 1;
    if (swapIndex < 0 || swapIndex >= waitingTokens.length) return;

    const swapTarget = waitingTokens[swapIndex];

    // Swap created_at timestamps to swap queue position in database
    await queueRepository.swapTokenTimestamps(target.id, swapTarget.id);

    if (profile?.hapticAlertsEnabled) await triggerHaptic('success');
    await loadData();
  };

  // Customer Lobby Arrival Check-in
  const checkInLobby = async (tokenId: string, isPresent = true): Promise<void> => {
    await queueRepository.updateTokenStatus(tokenId, undefined, { isLobbyPresent: isPresent });
    if (currentCustomerToken?.id === tokenId) {
      setCurrentCustomerToken((prev) => (prev ? { ...prev, isLobbyPresent: isPresent } : null));
    }
    if (profile?.hapticAlertsEnabled) await triggerHaptic('success');
    await loadData();
  };

  // Customer Delay / Snooze Spot
  const snoozeToken = async (tokenId: string, delaySpots = 2): Promise<void> => {
    const index = waitingTokens.findIndex((t) => t.id === tokenId);
    if (index === -1) return;

    const target = waitingTokens[index];
    const targetIndex = Math.min(waitingTokens.length - 1, index + delaySpots);
    if (targetIndex > index) {
      const swapTarget = waitingTokens[targetIndex];
      await queueRepository.swapTokenTimestamps(target.id, swapTarget.id);
    }

    const newSnoozeCount = (target.snoozeCount || 0) + 1;
    await queueRepository.updateTokenStatus(tokenId, undefined, {
      snoozeCount: newSnoozeCount,
    });

    if (currentCustomerToken?.id === tokenId) {
      setCurrentCustomerToken((prev) => (prev ? { ...prev, snoozeCount: newSnoozeCount } : null));
    }

    if (profile?.hapticAlertsEnabled) await triggerHaptic('warning');
    await loadData();
  };

  // Counter status
  const setCounterStatus = async (
    counterId: string,
    status: 'IDLE' | 'SERVING' | 'BREAK'
  ): Promise<void> => {
    await queueRepository.updateCounterStatus(counterId, status);
    await loadData();
  };

  // Update Profile
  const updateBusinessProfile = async (updates: Partial<BusinessProfile>): Promise<void> => {
    await queueRepository.updateBusinessProfile(updates);
    await loadData();
  };

  // Switch Preset
  const switchPreset = async (presetType: 'salon' | 'clinic' | 'repair'): Promise<void> => {
    setIsLoading(true);
    await queueRepository.loadPreset(presetType);
    setCurrentCustomerToken(null);
    setActiveCustomerAlert(null);
    await loadData();
  };

  // Clear Today's Queue
  const clearTodayQueue = async (): Promise<void> => {
    await queueRepository.clearTodayQueue();
    setCurrentCustomerToken(null);
    setActiveCustomerAlert(null);
    await loadData();
  };

  // Track customer token
  const trackCustomerToken = async (query: string): Promise<TokenItem | null> => {
    const found = await queueRepository.findTokenByQuery(query);
    if (found) {
      setCurrentCustomerToken(found);
    }
    return found;
  };

  // Dismiss customer alert banner
  const dismissCustomerAlert = () => {
    setActiveCustomerAlert(null);
  };

  // Send manual SMS or WhatsApp notification
  const sendManualCustomerNotification = async (
    tokenId: string,
    channel: 'SMS' | 'WHATSAPP'
  ): Promise<void> => {
    const targetToken = tokens.find((t) => t.id === tokenId);
    if (!targetToken) return;

    const message =
      targetToken.status === 'SERVING'
        ? buildNowServingMessage(targetToken, profile?.name || 'QueueBuddy', targetToken.counterName)
        : buildNearTurnMessage(targetToken, profile?.name || 'QueueBuddy', targetToken.counterName);

    if (channel === 'SMS') {
      await sendSMSNotification(targetToken.customerPhone, message);
    } else {
      await sendWhatsAppNotification(targetToken.customerPhone, message);
    }

    const log: NotificationLog = {
      id: `notif_${Date.now()}`,
      tokenId: targetToken.id,
      tokenNumber: targetToken.tokenNumber,
      customerName: targetToken.customerName,
      customerPhone: targetToken.customerPhone,
      type: targetToken.status === 'SERVING' ? 'NOW_SERVING' : 'NEAR_TURN',
      channel,
      message,
      timestamp: Date.now(),
      status: 'SENT',
    };
    await queueRepository.logNotification(log);
    await loadData();
  };

  return (
    <QueueContext.Provider
      value={{
        profile,
        services,
        counters,
        tokens,
        activeTokens,
        servingTokens,
        waitingTokens,
        completedTokens,
        notifications,
        stats,
        isLoading,
        currentCustomerToken,
        activeCustomerAlert,

        generateToken,
        callNextCustomer,
        startServingToken,
        completeToken,
        markNoShowOrCancel,
        alertCustomerNearTurn,
        bumpToken,
        checkInLobby,
        snoozeToken,
        setCounterStatus,
        updateBusinessProfile,
        switchPreset,
        clearTodayQueue,
        trackCustomerToken,
        setCurrentCustomerToken,
        dismissCustomerAlert,
        sendManualCustomerNotification,
        refreshQueue: loadData,
      }}
    >
      {children}
    </QueueContext.Provider>
  );
};

export const useQueue = (): QueueContextType => {
  const context = useContext(QueueContext);
  if (!context) {
    throw new Error('useQueue must be used within a QueueProvider');
  }
  return context;
};
