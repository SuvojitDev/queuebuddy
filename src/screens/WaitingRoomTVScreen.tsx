import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  useWindowDimensions,
} from 'react-native';
import {
  Clock,
  Volume2,
  Coffee,
  MapPin,
  CheckCircle2,
  Info,
} from 'lucide-react-native';
import { Palette } from '../constants/theme';
import { useQueue } from '../context/QueueContext';
import { TokenQrGraphic } from '../utils/qrCodeGenerator';
import { playChimeSound } from '../utils/notificationHelper';
import { formatWaitTime } from '../utils/timeEstimator';

export const WaitingRoomTVScreen: React.FC = () => {
  const { profile, counters, servingTokens, waitingTokens } = useQueue();
  const [currentTimeStr, setCurrentTimeStr] = useState<string>('');
  const { width } = useWindowDimensions();
  const isWide = width >= 800;

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTimeStr(
        now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
      );
    };
    updateTime();
    const timer = setInterval(updateTime, 1000);
    return () => clearInterval(timer);
  }, []);

  const upNextTokens = waitingTokens.slice(0, 6);

  return (
    <View style={styles.container}>
      {/* Top TV Header Bar */}
      <View style={styles.tvHeader}>
        <View style={styles.brandGroup}>
          <View style={styles.liveIndicator}>
            <View style={styles.liveDot} />
            <Text style={styles.liveText}>LIVE PUBLIC DISPLAY</Text>
          </View>
          <Text style={styles.businessTitle}>{profile?.name || 'QueueBuddy'}</Text>
        </View>

        <View style={styles.headerRightGroup}>
          <View style={styles.clockPill}>
            <Clock size={16} color={Palette.primaryBright} strokeWidth={2.2} style={{ marginRight: 6 }} />
            <Text style={styles.clockDisplay}>{currentTimeStr}</Text>
          </View>
          <TouchableOpacity
            style={styles.chimeButton}
            onPress={playChimeSound}
            activeOpacity={0.75}
          >
            <Volume2 size={16} color="#FFFFFF" strokeWidth={2.2} />
            <Text style={styles.chimeButtonText}>Chime Test</Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Main TV Grid */}
        <View style={[styles.tvGrid, isWide && styles.tvGridWide]}>
          {/* Section 1: Now Serving */}
          <View style={[styles.nowServingSection, isWide && { flex: 1.25 }]}>
            <View style={styles.sectionTitleRow}>
              <View style={styles.glowServingDot} />
              <Text style={styles.sectionTitleServing}>NOW SERVING</Text>
            </View>

            {servingTokens.length === 0 ? (
              <View style={styles.emptyServingBox}>
                <Coffee size={40} color={Palette.dark.textMuted} strokeWidth={1.8} />
                <Text style={styles.emptyServingTitle}>All Stations Ready</Text>
                <Text style={styles.emptyServingSub}>
                  Next waiting customer will be announced shortly.
                </Text>
              </View>
            ) : (
              <View style={styles.servingCardsGrid}>
                {servingTokens.map((token) => (
                  <View key={token.id} style={styles.servingCard}>
                    <View style={styles.servingCardTop}>
                      <Text style={styles.servingTokenNumber}>
                        {token.tokenNumber}
                      </Text>
                      <View style={styles.servingStationBadge}>
                        <MapPin size={12} color="#FFFFFF" strokeWidth={2.2} />
                        <Text style={styles.servingStationText}>
                          {token.counterName || 'Station'}
                        </Text>
                      </View>
                    </View>

                    <Text style={styles.servingCustomerName} numberOfLines={1}>
                      {token.customerName}
                    </Text>
                    <Text style={styles.servingServiceName}>
                      {token.serviceName}
                    </Text>
                  </View>
                ))}
              </View>
            )}

            {/* Station Status Strip */}
            <View style={styles.stationStrip}>
              <Text style={styles.stationStripTitle}>STATIONS OVERVIEW</Text>
              <View style={styles.stationList}>
                {counters.map((c) => {
                  const isServing = c.status === 'SERVING';
                  return (
                    <View key={c.id} style={styles.stationPill}>
                      <View
                        style={[
                          styles.stationDot,
                          {
                            backgroundColor: isServing
                              ? Palette.servingBright
                              : c.status === 'BREAK'
                              ? Palette.cancelled
                              : Palette.primaryBright,
                          },
                        ]}
                      />
                      <Text style={styles.stationPillName}>{c.name}</Text>
                      <Text
                        style={[
                          styles.stationPillStatus,
                          {
                            color: isServing
                              ? Palette.servingBright
                              : c.status === 'BREAK'
                              ? Palette.cancelled
                              : Palette.primaryBright,
                          },
                        ]}
                      >
                        {isServing ? c.currentTokenNumber || 'Busy' : c.status}
                      </Text>
                    </View>
                  );
                })}
              </View>
            </View>
          </View>

          {/* Section 2: Up Next Queue */}
          <View style={[styles.upNextSection, isWide && { flex: 1 }]}>
            <View style={styles.sectionTitleRow}>
              <View style={styles.glowWaitingDot} />
              <Text style={styles.sectionTitleUpNext}>UP NEXT IN LINE</Text>
            </View>

            {upNextTokens.length === 0 ? (
              <View style={styles.emptyUpNextBox}>
                <CheckCircle2 size={36} color={Palette.dark.textMuted} strokeWidth={1.8} />
                <Text style={styles.emptyUpNextText}>Waiting queue is clear</Text>
              </View>
            ) : (
              <View style={styles.upNextList}>
                {upNextTokens.map((t, idx) => {
                  const isNear = t.status === 'NEAR' || idx === 0;
                  return (
                    <View
                      key={t.id}
                      style={[
                        styles.upNextRow,
                        isNear && styles.upNextRowNear,
                      ]}
                    >
                      <View style={styles.upNextLeft}>
                        <View
                          style={[
                            styles.queueIndexBadge,
                            isNear && { backgroundColor: Palette.nearTurn },
                          ]}
                        >
                          <Text style={styles.queueIndexText}>#{idx + 1}</Text>
                        </View>
                        <Text style={styles.upNextTokenNum}>{t.tokenNumber}</Text>
                        <Text style={styles.upNextName} numberOfLines={1}>
                          {t.customerName.split(' ')[0]}
                        </Text>
                      </View>

                      <View style={styles.upNextRight}>
                        <Text style={[styles.upNextWait, isNear && { color: Palette.nearTurnBright }]}>
                          {isNear ? "You're Next!" : formatWaitTime(t.estimatedWaitMinutes)}
                        </Text>
                      </View>
                    </View>
                  );
                })}
              </View>
            )}

            {/* Scan To Join Card */}
            <View style={styles.scanToJoinBox}>
              <View style={styles.qrFrame}>
                <TokenQrGraphic
                  value={`JOIN-QUEUE-${profile?.id || 'queuebuddy'}`}
                  size={100}
                  color={Palette.primary}
                  backgroundColor="#FFFFFF"
                />
              </View>
              <View style={styles.scanInfo}>
                <Text style={styles.scanTitle}>SCAN TO JOIN QUEUE</Text>
                <Text style={styles.scanSub}>
                  Take a digital ticket pass on your phone to track your turn in real time!
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Ticker at the bottom */}
        <View style={styles.bottomTicker}>
          <Info size={16} color={Palette.primaryBright} strokeWidth={2.2} />
          <Text style={styles.tickerText}>
            Please watch this screen or listen for the chime when your token is called. Thank you for your patience!
          </Text>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#050914',
  },
  tvHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 14,
    backgroundColor: '#0A1224',
    borderBottomWidth: 1.5,
    borderBottomColor: 'rgba(255, 255, 255, 0.08)',
    maxWidth: 1200,
    width: '100%',
    alignSelf: 'center',
  },
  brandGroup: {
    flex: 1,
  },
  liveIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  liveDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: '#EF4444',
  },
  liveText: {
    fontSize: 9,
    fontWeight: '900',
    color: '#EF4444',
    letterSpacing: 1.2,
  },
  businessTitle: {
    fontSize: 19,
    fontWeight: '900',
    color: '#FFFFFF',
    marginTop: 2,
    letterSpacing: 0.3,
  },
  headerRightGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  clockPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  clockDisplay: {
    fontSize: 15,
    fontWeight: '900',
    color: Palette.primaryBright,
    fontVariant: ['tabular-nums'],
    letterSpacing: 0.5,
  },
  chimeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    gap: 5,
  },
  chimeButtonText: {
    fontSize: 12,
    color: '#FFFFFF',
    fontWeight: '700',
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
    maxWidth: 1200,
    width: '100%',
    alignSelf: 'center',
  },
  tvGrid: {
    gap: 16,
  },
  tvGridWide: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 20,
  },
  nowServingSection: {
    backgroundColor: '#0D172C',
    borderRadius: 22,
    padding: 18,
    borderWidth: 1.5,
    borderColor: 'rgba(16, 185, 129, 0.4)',
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 14,
  },
  glowServingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Palette.servingBright,
  },
  sectionTitleServing: {
    fontSize: 13,
    fontWeight: '900',
    color: Palette.servingBright,
    letterSpacing: 1.2,
  },
  servingCardsGrid: {
    gap: 12,
  },
  servingCard: {
    backgroundColor: '#122244',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1.5,
    borderColor: 'rgba(16, 185, 129, 0.35)',
  },
  servingCardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  servingTokenNumber: {
    fontSize: 36,
    fontWeight: '900',
    color: Palette.servingBright,
    letterSpacing: 1,
  },
  servingStationBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Palette.serving,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    gap: 5,
  },
  servingStationText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '900',
  },
  servingCustomerName: {
    fontSize: 17,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  servingServiceName: {
    fontSize: 12,
    color: Palette.dark.textSecondary,
    marginTop: 2,
    fontWeight: '500',
  },
  emptyServingBox: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 26,
  },
  emptyServingTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#FFFFFF',
    marginTop: 8,
  },
  emptyServingSub: {
    fontSize: 12,
    color: Palette.dark.textMuted,
    marginTop: 3,
  },
  stationStrip: {
    marginTop: 16,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.08)',
  },
  stationStripTitle: {
    fontSize: 9,
    fontWeight: '900',
    color: Palette.dark.textMuted,
    letterSpacing: 0.8,
    marginBottom: 10,
  },
  stationList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  stationPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#091020',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
    gap: 6,
  },
  stationDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  stationPillName: {
    fontSize: 11,
    color: '#FFFFFF',
    fontWeight: '700',
  },
  stationPillStatus: {
    fontSize: 9,
    fontWeight: '800',
  },
  upNextSection: {
    backgroundColor: '#0D172C',
    borderRadius: 22,
    padding: 18,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  glowWaitingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Palette.waitingBright,
  },
  sectionTitleUpNext: {
    fontSize: 13,
    fontWeight: '900',
    color: Palette.waitingBright,
    letterSpacing: 1.2,
  },
  upNextList: {
    gap: 9,
  },
  upNextRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#122244',
    borderRadius: 14,
    padding: 12,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.06)',
  },
  upNextRowNear: {
    borderColor: 'rgba(249, 115, 22, 0.45)',
    backgroundColor: 'rgba(249, 115, 22, 0.08)',
  },
  upNextLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 10,
  },
  queueIndexBadge: {
    backgroundColor: '#080E1D',
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  queueIndexText: {
    fontSize: 10,
    fontWeight: '900',
    color: '#FFFFFF',
  },
  upNextTokenNum: {
    fontSize: 16,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  upNextName: {
    fontSize: 13,
    color: Palette.dark.textSecondary,
    flex: 1,
    fontWeight: '600',
  },
  upNextRight: {
    alignItems: 'flex-end',
  },
  upNextWait: {
    fontSize: 12,
    fontWeight: '800',
    color: Palette.waitingBright,
  },
  emptyUpNextBox: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 24,
  },
  emptyUpNextText: {
    fontSize: 13,
    color: Palette.dark.textMuted,
    marginTop: 6,
    fontWeight: '500',
  },
  scanToJoinBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#080E1E',
    borderRadius: 18,
    padding: 14,
    marginTop: 16,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  qrFrame: {
    padding: 6,
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
    marginRight: 14,
  },
  scanInfo: {
    flex: 1,
  },
  scanTitle: {
    fontSize: 13,
    fontWeight: '900',
    color: Palette.primaryBright,
    letterSpacing: 0.5,
  },
  scanSub: {
    fontSize: 11,
    color: Palette.dark.textSecondary,
    marginTop: 4,
    lineHeight: 16,
    fontWeight: '500',
  },
  bottomTicker: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0D172C',
    borderRadius: 14,
    padding: 14,
    marginTop: 18,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    gap: 8,
  },
  tickerText: {
    flex: 1,
    fontSize: 11,
    color: Palette.dark.textSecondary,
    lineHeight: 16,
    fontWeight: '500',
  },
});
