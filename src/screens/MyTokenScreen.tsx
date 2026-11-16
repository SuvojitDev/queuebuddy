import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
  Share,
} from 'react-native';
import {
  Search,
  XCircle,
  Zap,
  Megaphone,
  Volume2,
  MapPin,
  Share2,
  MessageCircle,
  Ticket,
  Plus,
  Coffee,
  Hourglass,
  CheckCircle2,
} from 'lucide-react-native';
import { Palette } from '../constants/theme';
import { useQueue } from '../context/QueueContext';
import { TokenItem } from '../types/queue';
import { TokenQrGraphic } from '../utils/qrCodeGenerator';
import { formatWaitTime, formatEstimatedClockTime } from '../utils/timeEstimator';
import {
  sendWhatsAppNotification,
  playChimeSound,
} from '../utils/notificationHelper';

export const MyTokenScreen: React.FC<{
  onNavigateToIssueToken: () => void;
}> = ({ onNavigateToIssueToken }) => {
  const {
    profile,
    waitingTokens,
    servingTokens,
    currentCustomerToken,
    setCurrentCustomerToken,
    trackCustomerToken,
    markNoShowOrCancel,
    checkInLobby,
    snoozeToken,
  } = useQueue();

  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);

  const activeToken: TokenItem | null =
    currentCustomerToken ||
    (waitingTokens.length > 0 ? waitingTokens[0] : null);

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      Alert.alert('Search', 'Please enter a token number (e.g. S-03) or phone number.');
      return;
    }
    setIsSearching(true);
    const found = await trackCustomerToken(searchQuery.trim());
    setIsSearching(false);
    if (!found) {
      Alert.alert('Not Found', `No active ticket found for "${searchQuery}". Please check the number.`);
    }
  };

  const handleCancelMySpot = () => {
    if (!activeToken) return;
    Alert.alert(
      'Cancel Spot',
      `Are you sure you want to cancel your waiting spot for Token #${activeToken.tokenNumber}?`,
      [
        { text: 'No, Keep Spot', style: 'cancel' },
        {
          text: 'Yes, Cancel',
          style: 'destructive',
          onPress: async () => {
            await markNoShowOrCancel(activeToken.id, 'CANCELLED');
            setCurrentCustomerToken(null);
          },
        },
      ]
    );
  };

  const handleShare = async () => {
    if (!activeToken) return;
    try {
      await Share.share({
        message: `🎟️ My Queue Pass at ${profile?.name || 'QueueBuddy'}\nToken #${activeToken.tokenNumber} for ${activeToken.serviceName}\nStatus: ${activeToken.status}\nEst. Wait: ${formatWaitTime(activeToken.estimatedWaitMinutes)}`,
      });
    } catch {
      // safe fallback
    }
  };

  const waitingIndex = activeToken
    ? waitingTokens.findIndex((t) => t.id === activeToken.id)
    : -1;
  const positionInLine = waitingIndex >= 0 ? waitingIndex + 1 : undefined;
  const peopleAhead = waitingIndex >= 0 ? waitingIndex : 0;

  const isNear = activeToken?.status === 'NEAR';
  const isServing = activeToken?.status === 'SERVING';
  const isCompleted = activeToken?.status === 'COMPLETED';

  const getGuidance = () => {
    if (!activeToken) return null;
    if (isCompleted) {
      return {
        icon: <CheckCircle2 size={18} color="#10B981" strokeWidth={2.5} />,
        color: '#10B981',
        style: { backgroundColor: 'rgba(16, 185, 129, 0.12)', borderColor: 'rgba(16, 185, 129, 0.35)' },
        title: 'Service Completed',
        body: 'Thank you for choosing us! Hope to see you again soon.',
      };
    }
    if (isServing) {
      return {
        icon: <Zap size={18} color={Palette.servingBright} strokeWidth={2.5} />,
        color: Palette.servingBright,
        style: { backgroundColor: 'rgba(16, 185, 129, 0.14)', borderColor: 'rgba(16, 185, 129, 0.4)' },
        title: "You're Up Now!",
        body: activeToken.counterName
          ? `Please head to ${activeToken.counterName}. Staff is ready.`
          : 'Please proceed to your assigned station.',
      };
    }
    if (isNear) {
      return {
        icon: <Megaphone size={18} color={Palette.nearTurnBright} strokeWidth={2.5} />,
        color: Palette.nearTurnBright,
        style: { backgroundColor: 'rgba(249, 115, 22, 0.15)', borderColor: 'rgba(249, 115, 22, 0.45)' },
        title: 'Turn Approaching (~5m)',
        body: "Please make your way into the waiting area so you don't miss your call.",
      };
    }
    if (activeToken.estimatedWaitMinutes > 15) {
      return {
        icon: <Coffee size={18} color={Palette.primaryBright} strokeWidth={2.2} />,
        color: Palette.primaryBright,
        style: { backgroundColor: 'rgba(59, 130, 246, 0.12)', borderColor: 'rgba(59, 130, 246, 0.35)' },
        title: `Plenty of Time (~${activeToken.estimatedWaitMinutes}m)`,
        body: 'Relax nearby or grab a quick coffee. Your live turn time updates automatically.',
      };
    }
    return {
      icon: <Hourglass size={18} color={Palette.waitingBright} strokeWidth={2.2} />,
      color: Palette.waitingBright,
      style: { backgroundColor: 'rgba(245, 158, 11, 0.12)', borderColor: 'rgba(245, 158, 11, 0.35)' },
      title: `Estimated ~${activeToken.estimatedWaitMinutes}m Left`,
      body: 'Good time to head into the waiting lounge and take a comfortable seat.',
    };
  };

  const guidance = getGuidance();

  return (
    <View style={styles.container}>
      {/* Search Header */}
      <View style={styles.searchBarWrapper}>
        <View style={styles.searchBarContainer}>
          <View style={styles.searchInputWrapper}>
            <Search size={16} color={Palette.dark.textMuted} strokeWidth={2.2} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search token # (e.g. S-03) or phone..."
              placeholderTextColor={Palette.dark.textMuted}
              value={searchQuery}
              onChangeText={setSearchQuery}
              onSubmitEditing={handleSearch}
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery('')}>
                <XCircle size={16} color={Palette.dark.textMuted} strokeWidth={2} />
              </TouchableOpacity>
            )}
          </View>

          <TouchableOpacity
            style={styles.searchBtn}
            onPress={handleSearch}
            activeOpacity={0.82}
          >
            <Text style={styles.searchBtnText}>Track</Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {activeToken ? (
          <View style={styles.tokenContainer}>
            {/* Status Hero Card */}
            <View
              style={[
                styles.heroCard,
                isNear
                  ? styles.heroCardNear
                  : isServing
                  ? styles.heroCardServing
                  : styles.heroCardWaiting,
              ]}
            >
              {/* Alert Notice for Near Turn or Serving */}
              {(isNear || isServing) && (
                <View
                  style={[
                    styles.pulseNoticeBar,
                    isServing ? { backgroundColor: Palette.serving } : { backgroundColor: Palette.nearTurn },
                  ]}
                >
                  {isServing ? (
                    <Zap size={16} color="#FFFFFF" strokeWidth={2.5} />
                  ) : (
                    <Megaphone size={16} color="#FFFFFF" strokeWidth={2.2} />
                  )}
                  <Text style={styles.pulseNoticeText}>
                    {isServing
                      ? 'NOW SERVING! Please proceed to your station'
                      : 'YOUR TURN IS APPROACHING! Please be ready nearby'}
                  </Text>
                  <TouchableOpacity onPress={playChimeSound} style={styles.chimeIconBtn}>
                    <Volume2 size={15} color="#FFFFFF" strokeWidth={2.2} />
                  </TouchableOpacity>
                </View>
              )}

              {/* Token Number Display */}
              <View style={styles.tokenHeader}>
                <Text style={styles.ticketShopName}>{profile?.name || 'QueueBuddy'}</Text>
                <Text style={styles.tokenNumberBig}>{activeToken.tokenNumber}</Text>
                <View
                  style={[
                    styles.statusPillLarge,
                    isServing
                      ? { borderColor: 'rgba(16, 185, 129, 0.4)', backgroundColor: 'rgba(16, 185, 129, 0.12)' }
                      : isNear
                      ? { borderColor: 'rgba(249, 115, 22, 0.4)', backgroundColor: 'rgba(249, 115, 22, 0.12)' }
                      : null,
                  ]}
                >
                  <Text
                    style={[
                      styles.statusPillLargeText,
                      isServing
                        ? { color: Palette.servingBright }
                        : isNear
                        ? { color: Palette.nearTurnBright }
                        : null,
                    ]}
                  >
                    {isServing
                      ? '● NOW SERVING'
                      : isNear
                      ? '● TURN IS NEAR'
                      : isCompleted
                      ? '● COMPLETED'
                      : '● IN WAITING QUEUE'}
                  </Text>
                </View>
              </View>

              {/* Station Assignment Banner */}
              {activeToken.counterName && (
                <View style={styles.assignedCounterBanner}>
                  <MapPin size={18} color={Palette.servingBright} strokeWidth={2.2} />
                  <View style={{ marginLeft: 8 }}>
                    <Text style={styles.counterTitleSmall}>ASSIGNED STATION</Text>
                    <Text style={styles.counterNameBig}>{activeToken.counterName}</Text>
                  </View>
                </View>
              )}

              {/* Queue Position & Wait Time */}
              {!isServing && !isCompleted && (
                <View style={styles.waitRow}>
                  <View style={styles.waitMetric}>
                    <Text style={styles.waitMetricLabel}>YOUR SPOT</Text>
                    <Text style={styles.waitMetricValue}>
                      {positionInLine ? `#${positionInLine}` : '1st'}
                    </Text>
                    <Text style={styles.waitMetricSub}>
                      {peopleAhead === 0 ? 'You are next in line' : `${peopleAhead} people ahead`}
                    </Text>
                  </View>

                  <View style={styles.dividerVertical} />

                  <View style={styles.waitMetric}>
                    <Text style={styles.waitMetricLabel}>ESTIMATED WAIT</Text>
                    <Text style={[styles.waitMetricValue, { color: Palette.waitingBright }]}>
                      {formatWaitTime(activeToken.estimatedWaitMinutes)}
                    </Text>
                    <Text style={styles.waitMetricSub}>
                      turn ~{formatEstimatedClockTime(activeToken.estimatedWaitMinutes)}
                    </Text>
                  </View>
                </View>
              )}

              {/* Dynamic Guidance Advice */}
              {guidance && (
                <View style={[styles.guidanceNotice, guidance.style]}>
                  <View style={styles.guidanceIconCircle}>{guidance.icon}</View>
                  <View style={{ flex: 1, marginLeft: 10 }}>
                    <Text style={[styles.guidanceTitle, { color: guidance.color }]}>
                      {guidance.title}
                    </Text>
                    <Text style={styles.guidanceBody}>{guidance.body}</Text>
                  </View>
                </View>
              )}

              {/* Customer Convenience Actions: In Lobby & Need 10 Mins */}
              {!isCompleted && (
                <View style={styles.customerActionCard}>
                  <TouchableOpacity
                    style={[
                      styles.lobbyBtn,
                      activeToken.isLobbyPresent && styles.lobbyBtnActive,
                    ]}
                    onPress={() => checkInLobby(activeToken.id, !activeToken.isLobbyPresent)}
                    activeOpacity={0.8}
                  >
                    {activeToken.isLobbyPresent ? (
                      <CheckCircle2 size={18} color="#10B981" strokeWidth={2.5} />
                    ) : (
                      <MapPin size={18} color={Palette.primaryBright} strokeWidth={2.2} />
                    )}
                    <View style={{ flex: 1, marginLeft: 10 }}>
                      <Text
                        style={[
                          styles.lobbyBtnTitle,
                          activeToken.isLobbyPresent && { color: '#10B981' },
                        ]}
                      >
                        {activeToken.isLobbyPresent
                          ? '✓ In Waiting Area (Staff Notified)'
                          : "I'm in the Waiting Area"}
                      </Text>
                      <Text style={styles.lobbyBtnSub}>
                        {activeToken.isLobbyPresent
                          ? 'Front desk knows you are seated'
                          : 'Tap when you arrive so staff knows you are here'}
                      </Text>
                    </View>
                  </TouchableOpacity>

                  {!isServing && (
                    <TouchableOpacity
                      style={styles.delaySpotBtn}
                      onPress={() => {
                        Alert.alert(
                          'Need More Time?',
                          "Delay your spot by 2 positions (~10 minutes) so you don't lose your place?",
                          [
                            { text: 'Keep Spot', style: 'cancel' },
                            {
                              text: 'Delay ~10 Mins',
                              onPress: async () => {
                                await snoozeToken(activeToken.id, 2);
                              },
                            },
                          ]
                        );
                      }}
                      activeOpacity={0.8}
                    >
                      <Hourglass size={15} color="#F59E0B" strokeWidth={2.2} />
                      <Text style={styles.delaySpotText}>
                        {(activeToken.snoozeCount || 0) > 0
                          ? `Delayed +${activeToken.snoozeCount! * 10}m (${activeToken.snoozeCount}x)`
                          : 'Need 5-10 More Mins (Delay Spot)'}
                      </Text>
                    </TouchableOpacity>
                  )}
                </View>
              )}

              {/* Digital QR Pass */}
              <View style={styles.qrContainer}>
                <View style={styles.qrFrame}>
                  <TokenQrGraphic
                    value={`PASS-${activeToken.tokenNumber}-${activeToken.id}`}
                    size={140}
                    color={Palette.primary}
                    backgroundColor="#FFFFFF"
                  />
                </View>
                <Text style={styles.qrHint}>Show this QR pass when arriving at counter</Text>
              </View>

              {/* Ticket Details Table */}
              <View style={styles.detailsTable}>
                <View style={styles.tableRow}>
                  <Text style={styles.tableLabel}>Customer</Text>
                  <Text style={styles.tableValue}>{activeToken.customerName}</Text>
                </View>

                <View style={styles.tableRow}>
                  <Text style={styles.tableLabel}>Phone</Text>
                  <Text style={styles.tableValue}>{activeToken.customerPhone}</Text>
                </View>

                <View style={styles.tableRow}>
                  <Text style={styles.tableLabel}>Service</Text>
                  <Text style={styles.tableValue}>{activeToken.serviceName}</Text>
                </View>

                {activeToken.notes ? (
                  <View style={styles.tableRow}>
                    <Text style={styles.tableLabel}>Notes</Text>
                    <Text style={styles.tableValue}>{activeToken.notes}</Text>
                  </View>
                ) : null}
              </View>

              {/* Action Buttons */}
              <View style={styles.actionsBar}>
                <TouchableOpacity
                  style={styles.actionBtnPrimary}
                  onPress={handleShare}
                  activeOpacity={0.82}
                >
                  <Share2 size={16} color="#FFFFFF" strokeWidth={2.2} />
                  <Text style={styles.actionBtnPrimaryText}>Share Ticket</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.actionBtnOutline}
                  onPress={() => {
                    const text = `🎟️ Queue pass #${activeToken.tokenNumber} for ${profile?.name}. Current status: ${activeToken.status}.`;
                    sendWhatsAppNotification(activeToken.customerPhone, text);
                  }}
                  activeOpacity={0.75}
                >
                  <MessageCircle size={16} color="#10B981" strokeWidth={2.2} />
                  <Text style={[styles.actionBtnOutlineText, { color: '#10B981' }]}>WhatsApp</Text>
                </TouchableOpacity>
              </View>

              {/* Cancel Button */}
              {!isServing && !isCompleted && (
                <TouchableOpacity
                  style={styles.cancelBtn}
                  onPress={handleCancelMySpot}
                  activeOpacity={0.7}
                >
                  <XCircle size={14} color={Palette.cancelled} strokeWidth={2} />
                  <Text style={styles.cancelBtnText}>I can't make it - Leave Queue</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        ) : (
          <View style={styles.emptyCard}>
            <Ticket size={54} color={Palette.dark.textMuted} strokeWidth={1.5} />
            <Text style={styles.emptyTitle}>No Active Ticket Selected</Text>
            <Text style={styles.emptySub}>
              Enter your token number or phone number above to track your live waiting status, or issue a new ticket.
            </Text>

            <TouchableOpacity
              style={styles.issueNewBtn}
              onPress={onNavigateToIssueToken}
              activeOpacity={0.82}
            >
              <Plus size={18} color="#FFFFFF" strokeWidth={2.5} />
              <Text style={styles.issueNewText}>Get a New Token</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Quick List of Active Tokens to Switch Between */}
        <View style={styles.otherTokensSection}>
          <Text style={styles.otherTokensTitle}>ACTIVE TICKETS IN QUEUE</Text>
          <View style={styles.tokensPillScroll}>
            {[...servingTokens, ...waitingTokens].map((tkn) => {
              const isSelected = activeToken?.id === tkn.id;
              return (
                <TouchableOpacity
                  key={tkn.id}
                  style={[
                    styles.tokenPillItem,
                    isSelected && styles.tokenPillItemSelected,
                  ]}
                  onPress={() => setCurrentCustomerToken(tkn)}
                  activeOpacity={0.75}
                >
                  <Text
                    style={[
                      styles.tokenPillNumber,
                      isSelected && { color: '#FFFFFF' },
                    ]}
                  >
                    {tkn.tokenNumber}
                  </Text>
                  <Text
                    style={[
                      styles.tokenPillName,
                      isSelected && { color: 'rgba(255, 255, 255, 0.85)' },
                    ]}
                    numberOfLines={1}
                  >
                    {tkn.customerName.split(' ')[0]}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Palette.dark.background,
  },
  searchBarWrapper: {
    backgroundColor: '#0F1A30',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.08)',
    alignItems: 'center',
    width: '100%',
  },
  searchBarContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 10,
    maxWidth: 680,
    width: '100%',
    gap: 8,
  },
  searchInputWrapper: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#14223E',
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 42,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  searchInput: {
    flex: 1,
    color: '#FFFFFF',
    fontSize: 13,
    marginLeft: 8,
  },
  searchBtn: {
    backgroundColor: Palette.primary,
    paddingHorizontal: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: Palette.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.35,
    shadowRadius: 4,
  },
  searchBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
    maxWidth: 680,
    width: '100%',
    alignSelf: 'center',
  },
  tokenContainer: {
    marginBottom: 20,
  },
  heroCard: {
    backgroundColor: '#0F1A30',
    borderRadius: 24,
    padding: 18,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 6,
  },
  heroCardNear: {
    borderColor: 'rgba(249, 115, 22, 0.5)',
    backgroundColor: 'rgba(249, 115, 22, 0.05)',
  },
  heroCardServing: {
    borderColor: 'rgba(16, 185, 129, 0.5)',
    backgroundColor: 'rgba(16, 185, 129, 0.05)',
  },
  heroCardWaiting: {
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  pulseNoticeBar: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: -18,
    marginTop: -18,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 16,
    gap: 8,
  },
  pulseNoticeText: {
    flex: 1,
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 0.2,
  },
  chimeIconBtn: {
    padding: 4,
  },
  tokenHeader: {
    alignItems: 'center',
    marginBottom: 16,
  },
  ticketShopName: {
    fontSize: 12,
    fontWeight: '800',
    color: Palette.dark.textSecondary,
    letterSpacing: 0.8,
  },
  tokenNumberBig: {
    fontSize: 52,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: 1.5,
    marginVertical: 4,
  },
  statusPillLarge: {
    backgroundColor: '#14223E',
    paddingHorizontal: 14,
    paddingVertical: 5,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  statusPillLargeText: {
    fontSize: 11,
    fontWeight: '900',
    color: Palette.primaryBright,
    letterSpacing: 0.8,
  },
  assignedCounterBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(16, 185, 129, 0.12)',
    borderRadius: 14,
    padding: 12,
    marginBottom: 16,
    borderWidth: 1.5,
    borderColor: 'rgba(16, 185, 129, 0.4)',
  },
  counterTitleSmall: {
    fontSize: 9,
    fontWeight: '900',
    color: Palette.servingBright,
    letterSpacing: 0.8,
  },
  counterNameBig: {
    fontSize: 14,
    fontWeight: '900',
    color: '#FFFFFF',
    marginTop: 2,
  },
  waitRow: {
    flexDirection: 'row',
    backgroundColor: '#14223E',
    borderRadius: 16,
    paddingVertical: 14,
    marginBottom: 16,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  waitMetric: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: 8,
  },
  waitMetricLabel: {
    fontSize: 9,
    fontWeight: '900',
    color: Palette.dark.textMuted,
    letterSpacing: 0.8,
  },
  waitMetricValue: {
    fontSize: 22,
    fontWeight: '900',
    color: '#FFFFFF',
    marginVertical: 2,
    fontVariant: ['tabular-nums'],
  },
  waitMetricSub: {
    fontSize: 11,
    color: Palette.dark.textSecondary,
    fontWeight: '500',
  },
  dividerVertical: {
    width: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
  },
  guidanceNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 16,
  },
  guidanceIconCircle: {
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
  guidanceBody: {
    fontSize: 11,
    color: Palette.dark.textSecondary,
    lineHeight: 15,
  },
  customerActionCard: {
    gap: 8,
    marginBottom: 16,
  },
  lobbyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 14,
  },
  lobbyBtnActive: {
    backgroundColor: 'rgba(16, 185, 129, 0.14)',
    borderColor: 'rgba(16, 185, 129, 0.45)',
  },
  lobbyBtnTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  lobbyBtnSub: {
    fontSize: 10,
    color: Palette.dark.textSecondary,
    marginTop: 2,
  },
  delaySpotBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(245, 158, 11, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.35)',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 12,
    gap: 6,
  },
  delaySpotText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#F59E0B',
  },
  qrContainer: {
    alignItems: 'center',
    paddingVertical: 16,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    marginBottom: 16,
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
  qrHint: {
    fontSize: 11,
    color: Palette.dark.textSecondary,
    marginTop: 10,
    fontWeight: '500',
  },
  detailsTable: {
    gap: 8,
    marginBottom: 16,
  },
  tableRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 5,
  },
  tableLabel: {
    fontSize: 12,
    color: Palette.dark.textMuted,
    fontWeight: '600',
  },
  tableValue: {
    fontSize: 13,
    color: '#FFFFFF',
    fontWeight: '700',
  },
  actionsBar: {
    flexDirection: 'row',
    gap: 10,
  },
  actionBtnPrimary: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Palette.primary,
    paddingVertical: 13,
    borderRadius: 14,
    gap: 6,
    shadowColor: Palette.primary,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.35,
    shadowRadius: 6,
  },
  actionBtnPrimaryText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
  },
  actionBtnOutline: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#14223E',
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    paddingVertical: 13,
    borderRadius: 14,
    gap: 6,
  },
  actionBtnOutlineText: {
    fontSize: 13,
    fontWeight: '800',
  },
  cancelBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 14,
    paddingVertical: 6,
    gap: 4,
  },
  cancelBtnText: {
    color: Palette.cancelled,
    fontSize: 11,
    fontWeight: '700',
  },
  emptyCard: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0F1A30',
    borderRadius: 24,
    padding: 34,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    marginBottom: 20,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: '#FFFFFF',
    marginTop: 14,
  },
  emptySub: {
    fontSize: 12,
    color: Palette.dark.textSecondary,
    textAlign: 'center',
    marginTop: 6,
    lineHeight: 18,
    marginBottom: 18,
  },
  issueNewBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Palette.primary,
    paddingVertical: 12,
    paddingHorizontal: 22,
    borderRadius: 14,
    gap: 6,
    shadowColor: Palette.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
  },
  issueNewText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
  },
  otherTokensSection: {
    marginTop: 10,
  },
  otherTokensTitle: {
    fontSize: 11,
    fontWeight: '900',
    color: Palette.dark.textSecondary,
    marginBottom: 10,
    letterSpacing: 0.8,
  },
  tokensPillScroll: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  tokenPillItem: {
    backgroundColor: '#0F1A30',
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    alignItems: 'center',
    minWidth: 72,
  },
  tokenPillItemSelected: {
    backgroundColor: Palette.primary,
    borderColor: Palette.primaryBright,
  },
  tokenPillNumber: {
    fontSize: 14,
    fontWeight: '900',
    color: '#FFFFFF',
  },
  tokenPillName: {
    fontSize: 10,
    color: Palette.dark.textMuted,
    marginTop: 2,
    fontWeight: '600',
  },
});
