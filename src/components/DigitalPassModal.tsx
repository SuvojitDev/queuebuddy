import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  Share,
  Alert,
} from 'react-native';
import {
  X,
  FileText,
  Clock,
  Megaphone,
  Zap,
  MapPin,
  Share2,
  MessageCircle,
  MessageSquare,
  Coffee,
  CheckCircle2,
  Hourglass,
} from 'lucide-react-native';
import { Palette } from '../constants/theme';
import { TokenItem, BusinessProfile } from '../types/queue';
import { TokenQrGraphic } from '../utils/qrCodeGenerator';
import { formatWaitTime, formatEstimatedClockTime } from '../utils/timeEstimator';
import { sendSMSNotification, sendWhatsAppNotification } from '../utils/notificationHelper';
import { useQueue } from '../context/QueueContext';

interface DigitalPassModalProps {
  visible: boolean;
  token: TokenItem | null;
  profile: BusinessProfile | null;
  positionInQueue?: number;
  onClose: () => void;
}

export const DigitalPassModal: React.FC<DigitalPassModalProps> = ({
  visible,
  token,
  profile,
  positionInQueue,
  onClose,
}) => {
  const { checkInLobby, snoozeToken } = useQueue();

  if (!token) return null;

  const isServing = token.status === 'SERVING';
  const isNear = token.status === 'NEAR';
  const isCompleted = token.status === 'COMPLETED';

  // Step indices: 0 = Issued, 1 = Waiting, 2 = Near Turn, 3 = Serving/Completed
  const currentStep = isCompleted ? 3 : isServing ? 3 : isNear ? 2 : 1;

  const getGuidance = () => {
    if (isCompleted) {
      return {
        icon: <CheckCircle2 size={18} color="#10B981" strokeWidth={2.5} />,
        color: '#10B981',
        bannerStyle: { backgroundColor: 'rgba(16, 185, 129, 0.12)', borderColor: 'rgba(16, 185, 129, 0.35)' },
        title: 'Service Completed',
        subtitle: 'Thank you for visiting! Have a wonderful day.',
      };
    }
    if (isServing) {
      return {
        icon: <Zap size={18} color={Palette.servingBright} strokeWidth={2.5} />,
        color: Palette.servingBright,
        bannerStyle: { backgroundColor: 'rgba(16, 185, 129, 0.14)', borderColor: 'rgba(16, 185, 129, 0.4)' },
        title: "You're Being Served Now!",
        subtitle: token.counterName
          ? `Please proceed directly to ${token.counterName}.`
          : 'Please proceed to your assigned station.',
      };
    }
    if (isNear) {
      return {
        icon: <Megaphone size={18} color={Palette.nearTurnBright} strokeWidth={2.5} />,
        color: Palette.nearTurnBright,
        bannerStyle: { backgroundColor: 'rgba(249, 115, 22, 0.15)', borderColor: 'rgba(249, 115, 22, 0.45)' },
        title: 'Your Turn Is Next!',
        subtitle: 'Please wait inside the lounge area so you are ready when called.',
      };
    }
    if (token.estimatedWaitMinutes > 15) {
      return {
        icon: <Coffee size={18} color={Palette.primaryBright} strokeWidth={2.2} />,
        color: Palette.primaryBright,
        bannerStyle: { backgroundColor: 'rgba(59, 130, 246, 0.12)', borderColor: 'rgba(59, 130, 246, 0.35)' },
        title: `Plenty of Time (~${token.estimatedWaitMinutes}m)`,
        subtitle: 'Feel free to grab a coffee or relax nearby. Your ticket updates live.',
      };
    }
    return {
      icon: <Clock size={18} color={Palette.waitingBright} strokeWidth={2.2} />,
      color: Palette.waitingBright,
      bannerStyle: { backgroundColor: 'rgba(245, 158, 11, 0.12)', borderColor: 'rgba(245, 158, 11, 0.35)' },
      title: `Estimated ~${token.estimatedWaitMinutes}m Left`,
      subtitle: 'Please make your way toward the waiting area and take a seat.',
    };
  };

  const guidance = getGuidance();

  const handleSharePass = async () => {
    try {
      const shareText = `🎟️ Digital Queue Pass - ${profile?.name || 'QueueBuddy'}\n\nToken: ${token.tokenNumber}\nCustomer: ${token.customerName}\nService: ${token.serviceName}\nStatus: ${token.status}\nEst. Wait: ${formatWaitTime(token.estimatedWaitMinutes)}\n\nTrack your live turn at ${profile?.name}!`;
      await Share.share({
        title: `Queue Pass #${token.tokenNumber}`,
        message: shareText,
      });
    } catch (err) {
      console.warn('Share error:', err);
    }
  };

  const handleSendToCustomerWhatsApp = () => {
    const text = `🎟️ Your Digital Queue Pass at ${profile?.name || 'QueueBuddy'}\n\nToken #${token.tokenNumber}\nService: ${token.serviceName}\nStatus: ${token.status}\nEst. Wait: ${formatWaitTime(token.estimatedWaitMinutes)}`;
    sendWhatsAppNotification(token.customerPhone, text);
  };

  const handleSendToCustomerSMS = () => {
    const text = `🎟️ Your Queue Pass at ${profile?.name || 'QueueBuddy'}: Token #${token.tokenNumber} for ${token.serviceName}. Est. Wait: ${formatWaitTime(token.estimatedWaitMinutes)}.`;
    sendSMSNotification(token.customerPhone, text);
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.modalContainer}>
          {/* Close Bar */}
          <View style={styles.modalHeader}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <View style={styles.gemDot} />
              <Text style={styles.headerTitle}>Digital Waiting Pass</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn} activeOpacity={0.7}>
              <X size={18} color={Palette.dark.textSecondary} strokeWidth={2.2} />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollBody}>
            {/* Luxury Ticket Card */}
            <View style={styles.ticketCard}>
              {/* Ticket Top Header */}
              <View style={styles.ticketHeader}>
                <Text style={styles.businessName}>{profile?.name || 'QueueBuddy'}</Text>
                <Text style={styles.businessTagline}>{profile?.tagline || 'Waiting List'}</Text>
              </View>

              {/* Large Token Banner */}
              <View
                style={[
                  styles.tokenBanner,
                  isNear
                    ? { backgroundColor: Palette.nearTurn }
                    : isServing
                    ? { backgroundColor: Palette.serving }
                    : { backgroundColor: Palette.primary },
                ]}
              >
                <Text style={styles.tokenPrefixLabel}>OFFICIAL DIGITAL TOKEN</Text>
                <Text style={styles.tokenMainNumber}>{token.tokenNumber}</Text>
                <View style={styles.statusPill}>
                  <Text style={styles.tokenStatusSubtext}>
                    {isServing
                      ? 'NOW IN SERVICE'
                      : isNear
                      ? 'YOUR TURN IS APPROACHING'
                      : isCompleted
                      ? 'SERVICE COMPLETED'
                      : 'IN WAITING LINE'}
                  </Text>
                </View>
              </View>

              {/* Notch Divider */}
              <View style={styles.notchRow}>
                <View style={styles.notchLeft} />
                <View style={styles.dashedLine} />
                <View style={styles.notchRight} />
              </View>

              {/* QR Code Section */}
              <View style={styles.qrSection}>
                <View style={styles.qrFrame}>
                  <TokenQrGraphic
                    value={`QUEUE-${token.tokenNumber}-${token.id}`}
                    size={140}
                    color={Palette.primary}
                    backgroundColor="#FFFFFF"
                  />
                </View>
                <Text style={styles.scanHint}>Scan at front desk to check in</Text>
              </View>

              {/* Dynamic Guidance Advice */}
              <View style={[styles.guidanceBanner, guidance.bannerStyle]}>
                <View style={styles.guidanceIconBox}>{guidance.icon}</View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.guidanceTitle, { color: guidance.color }]}>
                    {guidance.title}
                  </Text>
                  <Text style={styles.guidanceSubtitle}>{guidance.subtitle}</Text>
                </View>
              </View>

              {/* Progress Pipeline */}
              <View style={styles.progressSection}>
                <View style={styles.progressRow}>
                  {[
                    { label: 'Issued', icon: (c: string) => <FileText size={12} color={c} strokeWidth={2.2} /> },
                    { label: 'Waiting', icon: (c: string) => <Clock size={12} color={c} strokeWidth={2.2} /> },
                    { label: 'Near', icon: (c: string) => <Megaphone size={12} color={c} strokeWidth={2.2} /> },
                    { label: 'Serving', icon: (c: string) => <Zap size={12} color={c} strokeWidth={2.5} /> },
                  ].map((step, idx) => {
                    const isDone = idx <= currentStep;
                    const isCurrent = idx === currentStep;
                    return (
                      <React.Fragment key={step.label}>
                        <View style={styles.stepItem}>
                          <View
                            style={[
                              styles.stepDot,
                              isDone && styles.stepDotDone,
                              isCurrent && isNear && { backgroundColor: Palette.nearTurn },
                              isCurrent && isServing && { backgroundColor: Palette.serving },
                            ]}
                          >
                            {step.icon(isDone ? '#FFFFFF' : Palette.dark.textMuted)}
                          </View>
                          <Text
                            style={[
                              styles.stepLabel,
                              isDone && { color: '#FFFFFF', fontWeight: '800' },
                            ]}
                          >
                            {step.label}
                          </Text>
                        </View>
                        {idx < 3 && (
                          <View
                            style={[
                              styles.stepLine,
                              idx < currentStep && styles.stepLineDone,
                            ]}
                          />
                        )}
                      </React.Fragment>
                    );
                  })}
                </View>
              </View>

              {/* Ticket Details Grid */}
              <View style={styles.detailsGrid}>
                <View style={styles.detailItem}>
                  <Text style={styles.detailLabel}>CUSTOMER</Text>
                  <Text style={styles.detailValue}>{token.customerName}</Text>
                  <Text style={styles.detailSub}>{token.customerPhone}</Text>
                </View>

                <View style={styles.detailItem}>
                  <Text style={styles.detailLabel}>SERVICE</Text>
                  <Text style={styles.detailValue}>{token.serviceName}</Text>
                  <Text style={styles.detailSub}>
                    {token.isPriority ? '★ Priority Customer' : 'Standard Queue'}
                  </Text>
                </View>

                <View style={styles.detailItem}>
                  <Text style={styles.detailLabel}>QUEUE POSITION</Text>
                  <Text style={styles.detailValue}>
                    {isServing ? 'At Station' : positionInQueue !== undefined ? `#${positionInQueue} in line` : 'Active'}
                  </Text>
                  <Text style={styles.detailSub}>
                    {isServing ? 'Being served now' : `${Math.max(0, (positionInQueue || 1) - 1)} people ahead`}
                  </Text>
                </View>

                <View style={styles.detailItem}>
                  <Text style={styles.detailLabel}>EST. TURN TIME</Text>
                  <Text style={[styles.detailValue, { color: Palette.waitingBright }]}>
                    {isServing ? 'Now' : formatWaitTime(token.estimatedWaitMinutes)}
                  </Text>
                  <Text style={styles.detailSub}>
                    {isServing ? 'In Progress' : `approx ${formatEstimatedClockTime(token.estimatedWaitMinutes)}`}
                  </Text>
                </View>
              </View>

              {/* Station Assignment */}
              {token.counterName && (
                <View style={styles.counterBanner}>
                  <MapPin size={16} color={Palette.servingBright} strokeWidth={2.2} />
                  <Text style={styles.counterBannerText}>
                    Please proceed to: <Text style={{ fontWeight: '900', color: '#FFFFFF' }}>{token.counterName}</Text>
                  </Text>
                </View>
              )}

              {/* Customer Quick Actions: In Lobby & Need 10 Mins */}
              {!isCompleted && (
                <View style={styles.convenienceActionContainer}>
                  <TouchableOpacity
                    style={[
                      styles.lobbyToggleBtn,
                      token.isLobbyPresent && styles.lobbyToggleBtnActive,
                    ]}
                    onPress={() => checkInLobby(token.id, !token.isLobbyPresent)}
                    activeOpacity={0.8}
                  >
                    {token.isLobbyPresent ? (
                      <CheckCircle2 size={16} color="#10B981" strokeWidth={2.5} />
                    ) : (
                      <MapPin size={16} color={Palette.primaryBright} strokeWidth={2.2} />
                    )}
                    <View style={{ flex: 1, marginLeft: 8 }}>
                      <Text
                        style={[
                          styles.lobbyToggleTitle,
                          token.isLobbyPresent && { color: '#10B981' },
                        ]}
                      >
                        {token.isLobbyPresent ? '✓ In Waiting Area' : "I'm in the Waiting Area"}
                      </Text>
                      <Text style={styles.lobbyToggleSub}>
                        {token.isLobbyPresent
                          ? 'Staff can see you are seated'
                          : 'Tap to notify desk you arrived'}
                      </Text>
                    </View>
                  </TouchableOpacity>

                  {!isServing && (
                    <TouchableOpacity
                      style={styles.snoozeActionBtn}
                      onPress={() => {
                        Alert.alert(
                          'Need a Few More Minutes?',
                          'We can shift your turn back by 2 positions (~10 mins) so you don\'t lose your spot.',
                          [
                            { text: 'Keep My Turn', style: 'cancel' },
                            {
                              text: 'Delay ~10 Mins',
                              onPress: async () => {
                                await snoozeToken(token.id, 2);
                              },
                            },
                          ]
                        );
                      }}
                      activeOpacity={0.8}
                    >
                      <Hourglass size={15} color="#F59E0B" strokeWidth={2.2} />
                      <Text style={styles.snoozeActionText}>
                        {(token.snoozeCount || 0) > 0
                          ? `Delayed (${token.snoozeCount}x)`
                          : 'Need 10 More Mins'}
                      </Text>
                    </TouchableOpacity>
                  )}
                </View>
              )}
            </View>

            {/* Action Buttons */}
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.sharePassBtn}
                onPress={handleSharePass}
                activeOpacity={0.82}
              >
                <Share2 size={18} color="#FFFFFF" strokeWidth={2.2} />
                <Text style={styles.sharePassText}>Share Digital Ticket</Text>
              </TouchableOpacity>

              <View style={styles.quickNotifyRow}>
                <TouchableOpacity
                  style={styles.notifyOptionBtn}
                  onPress={handleSendToCustomerWhatsApp}
                  activeOpacity={0.75}
                >
                  <MessageCircle size={16} color="#10B981" strokeWidth={2.2} />
                  <Text style={[styles.notifyOptionText, { color: '#10B981' }]}>WhatsApp Alert</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.notifyOptionBtn}
                  onPress={handleSendToCustomerSMS}
                  activeOpacity={0.75}
                >
                  <MessageSquare size={16} color={Palette.primaryBright} strokeWidth={2.2} />
                  <Text style={[styles.notifyOptionText, { color: Palette.primaryBright }]}>Send SMS</Text>
                </TouchableOpacity>
              </View>
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(3, 7, 18, 0.88)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  modalContainer: {
    backgroundColor: '#0F1A30',
    borderRadius: 24,
    width: '100%',
    maxWidth: 440,
    maxHeight: '92%',
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    overflow: 'hidden',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.6,
    shadowRadius: 28,
    elevation: 12,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.08)',
  },
  gemDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Palette.primaryBright,
  },
  headerTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.2,
  },
  closeBtn: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  scrollBody: {
    padding: 18,
  },
  ticketCard: {
    backgroundColor: '#132240',
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    overflow: 'hidden',
    paddingBottom: 16,
  },
  ticketHeader: {
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.08)',
    backgroundColor: '#0D172C',
  },
  businessName: {
    fontSize: 16,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: 0.3,
  },
  businessTagline: {
    fontSize: 11,
    color: Palette.dark.textSecondary,
    marginTop: 2,
    fontWeight: '500',
  },
  tokenBanner: {
    alignItems: 'center',
    paddingVertical: 18,
    paddingHorizontal: 12,
  },
  tokenPrefixLabel: {
    fontSize: 10,
    fontWeight: '900',
    color: 'rgba(255, 255, 255, 0.85)',
    letterSpacing: 1.5,
  },
  tokenMainNumber: {
    fontSize: 42,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: 1.2,
    marginVertical: 4,
  },
  statusPill: {
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 8,
  },
  tokenStatusSubtext: {
    fontSize: 10,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.6,
  },
  notchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: -8,
    zIndex: 2,
  },
  notchLeft: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#0F1A30',
    marginLeft: -8,
  },
  dashedLine: {
    flex: 1,
    height: 1,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    borderStyle: 'dashed',
    marginHorizontal: 4,
  },
  notchRight: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#0F1A30',
    marginRight: -8,
  },
  qrSection: {
    alignItems: 'center',
    paddingVertical: 18,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.08)',
  },
  qrFrame: {
    padding: 8,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
  },
  scanHint: {
    fontSize: 11,
    color: Palette.dark.textSecondary,
    marginTop: 10,
    fontWeight: '500',
  },
  guidanceBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 14,
    marginTop: 12,
    marginBottom: 4,
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
    gap: 10,
  },
  guidanceIconBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: 'rgba(0, 0, 0, 0.25)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  guidanceTitle: {
    fontSize: 12,
    fontWeight: '800',
    marginBottom: 2,
  },
  guidanceSubtitle: {
    fontSize: 11,
    color: Palette.dark.textSecondary,
    lineHeight: 15,
  },
  convenienceActionContainer: {
    marginHorizontal: 14,
    marginTop: 12,
    marginBottom: 4,
    gap: 8,
  },
  lobbyToggleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 12,
  },
  lobbyToggleBtnActive: {
    backgroundColor: 'rgba(16, 185, 129, 0.14)',
    borderColor: 'rgba(16, 185, 129, 0.45)',
  },
  lobbyToggleTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  lobbyToggleSub: {
    fontSize: 10,
    color: Palette.dark.textSecondary,
    marginTop: 1,
  },
  snoozeActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(245, 158, 11, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.35)',
    paddingVertical: 9,
    paddingHorizontal: 12,
    borderRadius: 10,
    gap: 6,
  },
  snoozeActionText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#F59E0B',
  },
  progressSection: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.08)',
  },
  progressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  stepItem: {
    alignItems: 'center',
    width: 54,
  },
  stepDot: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  stepDotDone: {
    backgroundColor: Palette.primary,
    borderColor: Palette.primaryBright,
  },
  stepLabel: {
    fontSize: 10,
    color: Palette.dark.textMuted,
  },
  stepLine: {
    flex: 1,
    height: 2,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    marginBottom: 16,
  },
  stepLineDone: {
    backgroundColor: Palette.primary,
  },
  detailsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 14,
    paddingTop: 14,
  },
  detailItem: {
    width: '50%',
    padding: 6,
  },
  detailLabel: {
    fontSize: 8,
    fontWeight: '900',
    color: Palette.dark.textMuted,
    letterSpacing: 0.8,
  },
  detailValue: {
    fontSize: 13,
    fontWeight: '800',
    color: '#FFFFFF',
    marginTop: 2,
  },
  detailSub: {
    fontSize: 11,
    color: Palette.dark.textSecondary,
    marginTop: 1,
  },
  counterBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(16, 185, 129, 0.12)',
    marginHorizontal: 14,
    marginTop: 12,
    padding: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.4)',
    gap: 8,
  },
  counterBannerText: {
    fontSize: 12,
    color: Palette.dark.textPrimary,
    flex: 1,
  },
  modalActions: {
    marginTop: 16,
    gap: 10,
  },
  sharePassBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Palette.primary,
    paddingVertical: 14,
    borderRadius: 14,
    gap: 8,
    shadowColor: Palette.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
  },
  sharePassText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  quickNotifyRow: {
    flexDirection: 'row',
    gap: 10,
  },
  notifyOptionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    paddingVertical: 11,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.09)',
    gap: 6,
  },
  notifyOptionText: {
    fontSize: 12,
    fontWeight: '700',
  },
});
