import { Linking, Platform } from 'react-native';
import * as Haptics from 'expo-haptics';
import { TokenItem, NotificationLog } from '../types/queue';

/**
 * Trigger physical haptic feedback based on urgency
 */
export async function triggerHaptic(type: 'success' | 'warning' | 'alert' = 'success'): Promise<void> {
  try {
    if (Platform.OS === 'web') return;
    if (type === 'success') {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } else if (type === 'warning') {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    } else {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    }
  } catch {
    // Graceful fallback if haptics unavailable
  }
}

/**
 * Play a clean waiting room chime sound
 * Uses Web Audio API on web, or safe fallback
 */
export function playChimeSound(): void {
  try {
    if (Platform.OS === 'web' && typeof window !== 'undefined' && (window.AudioContext || (window as any).webkitAudioContext)) {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      const ctx = new AudioCtx();

      // Pleasant dual chime tone (C5 -> G5)
      const now = ctx.currentTime;
      const osc1 = ctx.createOscillator();
      const gain1 = ctx.createGain();
      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(523.25, now); // C5
      osc1.frequency.exponentialRampToValueAtTime(783.99, now + 0.15); // G5
      gain1.gain.setValueAtTime(0.2, now);
      gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.5);

      osc1.connect(gain1);
      gain1.connect(ctx.destination);

      osc1.start(now);
      osc1.stop(now + 0.5);
    }
  } catch {
    // Safe catch if audio is blocked by user autoplay policy
  }
}

/**
 * Generate SMS and WhatsApp notification templates
 */
export function buildNearTurnMessage(
  token: TokenItem,
  businessName: string,
  counterName?: string | null
): string {
  const counterText = counterName ? ` at ${counterName}` : '';
  const waitText = token.estimatedWaitMinutes > 0 ? ` Est. wait: ~${token.estimatedWaitMinutes} mins.` : ' You are next in line!';
  return `📢 Hi ${token.customerName}! Your turn for ${token.serviceName} at ${businessName} is approaching! Your Token #${token.tokenNumber}.${counterText}${waitText} Please be ready near the waiting area.`;
}

export function buildNowServingMessage(
  token: TokenItem,
  businessName: string,
  counterName?: string | null
): string {
  const destination = counterName || 'the service desk';
  return `🎉 Token #${token.tokenNumber} (${token.customerName}), your turn is NOW! Please proceed to ${destination} for your ${token.serviceName} at ${businessName}.`;
}

/**
 * Open native SMS app with pre-filled message
 */
export async function sendSMSNotification(phone: string, message: string): Promise<boolean> {
  try {
    const cleanPhone = phone.replace(/[^0-9+]/g, '');
    const separator = Platform.OS === 'ios' ? '&' : '?';
    const url = `sms:${cleanPhone}${separator}body=${encodeURIComponent(message)}`;
    const canOpen = await Linking.canOpenURL(url);
    if (canOpen) {
      await Linking.openURL(url);
      return true;
    }
    return false;
  } catch (err) {
    console.warn('Cannot open SMS URL:', err);
    return false;
  }
}

/**
 * Open WhatsApp with pre-filled customer alert
 */
export async function sendWhatsAppNotification(phone: string, message: string): Promise<boolean> {
  try {
    const cleanPhone = phone.replace(/[^0-9]/g, '');
    const url = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;
    await Linking.openURL(url);
    return true;
  } catch (err) {
    console.warn('Cannot open WhatsApp URL:', err);
    return false;
  }
}
