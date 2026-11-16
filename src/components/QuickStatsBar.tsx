import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Clock, Zap, Timer, CheckCircle2 } from 'lucide-react-native';
import { Palette } from '../constants/theme';
import { QueueStats } from '../types/queue';

interface QuickStatsBarProps {
  stats: QueueStats;
}

export const QuickStatsBar: React.FC<QuickStatsBarProps> = ({ stats }) => {
  return (
    <View style={styles.container}>
      {/* Waiting Tile */}
      <View style={[styles.statBox, styles.statBoxWaiting]}>
        <View style={styles.iconRow}>
          <Clock size={11} color={Palette.waitingBright} strokeWidth={2.5} />
          <Text style={[styles.statLabel, { color: Palette.waitingBright }]} numberOfLines={1}>WAITING</Text>
        </View>
        <Text style={[styles.statValue, { color: '#FFFFFF' }]} numberOfLines={1}>{stats.waitingCount}</Text>
        <Text style={styles.subtext} numberOfLines={1}>in queue</Text>
      </View>

      {/* Serving Tile */}
      <View style={[styles.statBox, styles.statBoxServing]}>
        <View style={styles.iconRow}>
          <Zap size={11} color={Palette.servingBright} strokeWidth={2.5} />
          <Text style={[styles.statLabel, { color: Palette.servingBright }]} numberOfLines={1}>SERVING</Text>
        </View>
        <Text style={[styles.statValue, { color: '#FFFFFF' }]} numberOfLines={1}>{stats.servingCount}</Text>
        <Text style={styles.subtext} numberOfLines={1}>at stations</Text>
      </View>

      {/* Est. Wait Tile */}
      <View style={[styles.statBox, styles.statBoxWait]}>
        <View style={styles.iconRow}>
          <Timer size={11} color={Palette.primaryBright} strokeWidth={2.5} />
          <Text style={[styles.statLabel, { color: Palette.primaryBright }]} numberOfLines={1}>EST. WAIT</Text>
        </View>
        <Text style={[styles.statValue, { color: Palette.primaryBright }]} numberOfLines={1}>~{stats.avgWaitMinutes}m</Text>
        <Text style={styles.subtext} numberOfLines={1}>per person</Text>
      </View>

      {/* Done Tile */}
      <View style={[styles.statBox, styles.statBoxDone]}>
        <View style={styles.iconRow}>
          <CheckCircle2 size={11} color={Palette.dark.textSecondary} strokeWidth={2.5} />
          <Text style={[styles.statLabel, { color: Palette.dark.textSecondary }]} numberOfLines={1}>DONE</Text>
        </View>
        <Text style={[styles.statValue, { color: '#FFFFFF' }]} numberOfLines={1}>{stats.completedCount}</Text>
        <Text style={styles.subtext} numberOfLines={1}>completed</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    maxWidth: 680,
    width: '100%',
    alignSelf: 'center',
  },
  statBox: {
    flex: 1,
    minWidth: 0,
    paddingVertical: 12,
    paddingHorizontal: 4,
    borderRadius: 16,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0F1A30',
  },
  statBoxWaiting: {
    borderColor: 'rgba(245, 158, 11, 0.3)',
    backgroundColor: 'rgba(245, 158, 11, 0.08)',
  },
  statBoxServing: {
    borderColor: 'rgba(16, 185, 129, 0.35)',
    backgroundColor: 'rgba(16, 185, 129, 0.08)',
  },
  statBoxWait: {
    borderColor: 'rgba(56, 189, 248, 0.3)',
    backgroundColor: 'rgba(56, 189, 248, 0.08)',
  },
  statBoxDone: {
    borderColor: 'rgba(255, 255, 255, 0.09)',
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
  },
  iconRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginBottom: 4,
  },
  iconDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
  },
  statLabel: {
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 0.8,
  },
  statValue: {
    fontSize: 19,
    fontWeight: '900',
    letterSpacing: 0.5,
    fontVariant: ['tabular-nums'],
  },
  subtext: {
    fontSize: 9,
    color: Palette.dark.textMuted,
    marginTop: 2,
    fontWeight: '500',
  },
});
