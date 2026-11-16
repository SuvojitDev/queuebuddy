import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { CheckCircle2, PauseCircle, Megaphone } from 'lucide-react-native';
import { Palette } from '../constants/theme';
import { CounterItem } from '../types/queue';

interface NowServingBannerProps {
  counters: CounterItem[];
  onCompleteToken: (tokenId: string) => void;
  onCallNextToCounter: (counterId: string) => void;
}

export const NowServingBanner: React.FC<NowServingBannerProps> = ({
  counters,
  onCompleteToken,
  onCallNextToCounter,
}) => {
  return (
    <View style={styles.container}>
      <View style={styles.sectionHeader}>
        <View style={styles.titleRow}>
          <View style={styles.pulseDot} />
          <Text style={styles.sectionTitle}>ACTIVE STATIONS & COUNTERS</Text>
        </View>
        <View style={styles.counterBadge}>
          <Text style={styles.counterCountText}>{counters.length} Stations</Text>
        </View>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {counters.map((counter) => {
          const isServing = counter.status === 'SERVING' && counter.currentTokenId;
          const isBreak = counter.status === 'BREAK';

          return (
            <View
              key={counter.id}
              style={[
                styles.card,
                isServing
                  ? styles.cardServing
                  : isBreak
                  ? styles.cardBreak
                  : styles.cardIdle,
              ]}
            >
              {/* Card Top: Station Name & Status */}
              <View style={styles.cardHeader}>
                <View style={styles.stationInfo}>
                  <Text style={styles.stationName} numberOfLines={1}>
                    {counter.name}
                  </Text>
                  {counter.staffName ? (
                    <Text style={styles.staffName} numberOfLines={1}>
                      {counter.staffName}
                    </Text>
                  ) : null}
                </View>

                {/* Status Pill */}
                <View
                  style={[
                    styles.statusPill,
                    isServing
                      ? styles.pillServing
                      : isBreak
                      ? styles.pillBreak
                      : styles.pillIdle,
                  ]}
                >
                  <Text
                    style={[
                      styles.statusPillText,
                      isServing
                        ? { color: Palette.servingBright }
                        : isBreak
                        ? { color: Palette.cancelled }
                        : { color: Palette.primaryBright },
                    ]}
                  >
                    {isServing ? 'SERVING' : isBreak ? 'BREAK' : 'READY'}
                  </Text>
                </View>
              </View>

              {/* Main Body */}
              {isServing ? (
                <View style={styles.servingBody}>
                  <View style={styles.tokenHighlight}>
                    <Text style={styles.tokenNumber}>
                      {counter.currentTokenNumber || 'ACTIVE'}
                    </Text>
                    <Text style={styles.customerName} numberOfLines={1}>
                      {counter.currentCustomerName || 'In Service'}
                    </Text>
                  </View>

                  <TouchableOpacity
                    style={styles.finishButton}
                    onPress={() => counter.currentTokenId && onCompleteToken(counter.currentTokenId)}
                    activeOpacity={0.82}
                  >
                    <CheckCircle2 size={15} color="#FFFFFF" strokeWidth={2.5} />
                    <Text style={styles.finishButtonText}>Complete Turn</Text>
                  </TouchableOpacity>
                </View>
              ) : isBreak ? (
                <View style={styles.idleBody}>
                  <PauseCircle size={24} color={Palette.dark.textMuted} strokeWidth={2} />
                  <Text style={styles.idleText}>Station on Break</Text>
                </View>
              ) : (
                <View style={styles.idleBody}>
                  <Text style={styles.readyText}>Station is Open</Text>
                  <TouchableOpacity
                    style={styles.callHereButton}
                    onPress={() => onCallNextToCounter(counter.id)}
                    activeOpacity={0.82}
                  >
                    <Megaphone size={13} color="#FFFFFF" strokeWidth={2.2} />
                    <Text style={styles.callHereText}>Call Next Here</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          );
        })}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingVertical: 6,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 10,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  pulseDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: Palette.servingBright,
    marginRight: 7,
    shadowColor: Palette.servingBright,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 4,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: '900',
    color: Palette.dark.textSecondary,
    letterSpacing: 0.8,
  },
  counterBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  counterCountText: {
    fontSize: 10,
    color: Palette.dark.textSecondary,
    fontWeight: '700',
  },
  scrollContent: {
    paddingHorizontal: 16,
    gap: 12,
  },
  card: {
    width: 185,
    borderRadius: 18,
    padding: 14,
    borderWidth: 1.5,
    justifyContent: 'space-between',
    backgroundColor: '#0F1A30',
  },
  cardServing: {
    borderColor: 'rgba(16, 185, 129, 0.45)',
    backgroundColor: 'rgba(16, 185, 129, 0.06)',
  },
  cardIdle: {
    borderColor: 'rgba(56, 189, 248, 0.25)',
    backgroundColor: '#111E38',
  },
  cardBreak: {
    borderColor: 'rgba(239, 68, 68, 0.25)',
    backgroundColor: '#111E38',
    opacity: 0.65,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  stationInfo: {
    flex: 1,
    marginRight: 4,
  },
  stationName: {
    fontSize: 13,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  staffName: {
    fontSize: 10,
    color: Palette.dark.textMuted,
    marginTop: 2,
    fontWeight: '500',
  },
  statusPill: {
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 7,
    borderWidth: 1,
  },
  pillServing: {
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    borderColor: 'rgba(16, 185, 129, 0.4)',
  },
  pillIdle: {
    backgroundColor: 'rgba(56, 189, 248, 0.12)',
    borderColor: 'rgba(56, 189, 248, 0.3)',
  },
  pillBreak: {
    backgroundColor: 'rgba(239, 68, 68, 0.12)',
    borderColor: 'rgba(239, 68, 68, 0.3)',
  },
  statusPillText: {
    fontSize: 8,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  servingBody: {
    marginTop: 4,
  },
  tokenHighlight: {
    marginBottom: 10,
  },
  tokenNumber: {
    fontSize: 22,
    fontWeight: '900',
    color: Palette.servingBright,
    letterSpacing: 0.5,
  },
  customerName: {
    fontSize: 12,
    color: '#FFFFFF',
    marginTop: 2,
    fontWeight: '700',
  },
  finishButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Palette.serving,
    paddingVertical: 7,
    paddingHorizontal: 10,
    borderRadius: 10,
    gap: 5,
    shadowColor: Palette.serving,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  finishButtonText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '800',
  },
  idleBody: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 6,
  },
  readyText: {
    fontSize: 11,
    color: Palette.dark.textSecondary,
    marginBottom: 8,
    fontWeight: '600',
  },
  callHereButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Palette.primary,
    paddingVertical: 7,
    paddingHorizontal: 12,
    borderRadius: 10,
    gap: 5,
    width: '100%',
    shadowColor: Palette.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  callHereText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '800',
  },
  idleText: {
    fontSize: 11,
    color: Palette.dark.textMuted,
    marginTop: 4,
  },
});
