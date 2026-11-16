import { TokenItem, CounterItem, ServiceItem } from '../types/queue';

/**
 * Calculates dynamic estimated wait times for all waiting/near tokens in the queue.
 * Simulates a multi-server queue dispatch (M/M/c queueing approximation)
 * based on active counters, actual elapsed serving times, and each token's requested service duration.
 */
export function calculateQueueWaitTimes(
  waitingTokens: TokenItem[],
  activeCounters: CounterItem[],
  services: ServiceItem[],
  servingTokens: TokenItem[] = []
): Record<string, number> {
  const result: Record<string, number> = {};
  if (waitingTokens.length === 0) return result;

  // Map service ID to duration
  const serviceDurationMap = new Map<string, number>();
  for (const s of services) {
    serviceDurationMap.set(s.id, s.defaultDurationMinutes);
  }

  // Active serving counters (excluding counters explicitly on break)
  const availableCounters = activeCounters.filter((c) => c.status !== 'BREAK');
  const effectiveCounters = availableCounters.length > 0 ? availableCounters : [activeCounters[0] || { id: 'c1', name: 'Desk 1', stationType: 'Station', status: 'IDLE' }];

  // Array representing the next available minute offset for each counter
  const counterFreeAtMinutes: number[] = [];
  for (const counter of effectiveCounters) {
    if (counter.status === 'SERVING') {
      const activeServingToken = servingTokens.find(
        (t) => t.id === counter.currentTokenId || t.counterId === counter.id
      );
      if (activeServingToken && activeServingToken.servedAt) {
        const expectedDuration = serviceDurationMap.get(activeServingToken.serviceId) || 20;
        const elapsedMinutes = Math.floor((Date.now() - activeServingToken.servedAt) / 60000);
        const remaining = Math.max(1, expectedDuration - elapsedMinutes);
        counterFreeAtMinutes.push(remaining);
      } else {
        counterFreeAtMinutes.push(8); // default fallback remaining minutes
      }
    } else {
      counterFreeAtMinutes.push(0); // counter is idle and ready immediately
    }
  }

  // Sort tokens by priority first, then status (NEAR first), then arrival time
  const sortedQueue = [...waitingTokens].sort((a, b) => {
    if (a.isPriority && !b.isPriority) return -1;
    if (!a.isPriority && b.isPriority) return 1;
    if (a.status === 'NEAR' && b.status !== 'NEAR') return -1;
    if (a.status !== 'NEAR' && b.status === 'NEAR') return 1;
    return a.createdAt - b.createdAt;
  });

  // Dispatch each token to the counter that frees up earliest
  for (const token of sortedQueue) {
    // Find counter that frees earliest
    let earliestIndex = 0;
    let minTime = counterFreeAtMinutes[0];
    for (let i = 1; i < counterFreeAtMinutes.length; i++) {
      if (counterFreeAtMinutes[i] < minTime) {
        minTime = counterFreeAtMinutes[i];
        earliestIndex = i;
      }
    }

    const waitMinutes = Math.max(0, Math.round(minTime));
    result[token.id] = waitMinutes;

    // Service duration for this token
    const duration = serviceDurationMap.get(token.serviceId) || 20;
    // Advance counter's next free time
    counterFreeAtMinutes[earliestIndex] += duration;
  }

  return result;
}

export function formatWaitTime(minutes: number): string {
  if (minutes <= 1) {
    return "You're next! (~1 min)";
  }
  if (minutes < 60) {
    return `~${minutes} mins`;
  }
  const hours = Math.floor(minutes / 60);
  const remainingMins = minutes % 60;
  return remainingMins > 0 ? `${hours}h ${remainingMins}m` : `${hours} hour${hours > 1 ? 's' : ''}`;
}

export function formatEstimatedClockTime(minutesFromNow: number): string {
  const target = new Date(Date.now() + minutesFromNow * 60 * 1000);
  let hours = target.getHours();
  const minutes = target.getMinutes();
  const ampm = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12;
  hours = hours ? hours : 12; // hour '0' should be '12'
  const minutesFormatted = minutes < 10 ? '0' + minutes : minutes;
  return `${hours}:${minutesFormatted} ${ampm}`;
}

export function formatElapsedMinutes(startTimeMs?: number | null): string {
  if (!startTimeMs) return '0 min';
  const elapsed = Math.max(0, Math.floor((Date.now() - startTimeMs) / 60000));
  return `${elapsed} min`;
}
