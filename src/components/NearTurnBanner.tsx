import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Zap, Megaphone, Volume2, ArrowRight, X } from 'lucide-react-native';
import { Palette } from '../constants/theme';
import { TokenItem } from '../types/queue';
import { playChimeSound } from '../utils/notificationHelper';

interface NearTurnBannerProps {
  alert: {
    token: TokenItem;
    title: string;
    message: string;
    type: 'NEAR' | 'SERVING';
  } | null;
  onDismiss: () => void;
  onViewPass: (token: TokenItem) => void;
}

export const NearTurnBanner: React.FC<NearTurnBannerProps> = ({
  alert,
  onDismiss,
  onViewPass,
}) => {
  if (!alert) return null;

  const isServing = alert.type === 'SERVING';

  return (
    <View
      style={[
        styles.banner,
        isServing ? styles.bannerServing : styles.bannerNear,
      ]}
    >
      <View style={styles.contentRow}>
        <View
          style={[
            styles.iconCircle,
            isServing
              ? { backgroundColor: Palette.serving }
              : { backgroundColor: Palette.nearTurn },
          ]}
        >
          {isServing ? (
            <Zap size={16} color="#FFFFFF" strokeWidth={2.5} />
          ) : (
            <Megaphone size={16} color="#FFFFFF" strokeWidth={2.2} />
          )}
        </View>

        <View style={styles.textColumn}>
          <View style={styles.titleRow}>
            <Text style={styles.titleText}>{alert.title}</Text>
            <View
              style={[
                styles.tokenBadge,
                isServing
                  ? { backgroundColor: Palette.serving }
                  : { backgroundColor: Palette.nearTurn },
              ]}
            >
              <Text style={styles.tokenBadgeText}>
                {alert.token.tokenNumber}
              </Text>
            </View>
          </View>
          <Text style={styles.messageText} numberOfLines={2}>
            {alert.message}
          </Text>
        </View>
      </View>

      {/* Action Row */}
      <View style={styles.actionRow}>
        <TouchableOpacity
          style={styles.soundButton}
          onPress={playChimeSound}
          activeOpacity={0.7}
        >
          <Volume2 size={14} color="#FFFFFF" strokeWidth={2.2} />
          <Text style={styles.soundButtonText}>Chime</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.viewPassBtn}
          onPress={() => onViewPass(alert.token)}
          activeOpacity={0.7}
        >
          <Text style={styles.viewPassText}>View Pass</Text>
          <ArrowRight size={13} color="#FFFFFF" strokeWidth={2.5} />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.dismissBtn}
          onPress={onDismiss}
          activeOpacity={0.7}
        >
          <X size={16} color="rgba(255, 255, 255, 0.8)" strokeWidth={2.5} />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  banner: {
    marginHorizontal: 16,
    marginTop: 10,
    marginBottom: 4,
    borderRadius: 14,
    padding: 12,
    borderWidth: 1.5,
    maxWidth: 680,
    width: '92%',
    alignSelf: 'center',
  },
  bannerNear: {
    backgroundColor: '#301808',
    borderColor: Palette.nearTurn,
  },
  bannerServing: {
    backgroundColor: '#06291C',
    borderColor: Palette.serving,
  },
  contentRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  iconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  textColumn: {
    flex: 1,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 2,
  },
  titleText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  tokenBadge: {
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 4,
  },
  tokenBadgeText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '900',
  },
  messageText: {
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.85)',
    lineHeight: 16,
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    marginTop: 10,
    gap: 8,
  },
  soundButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    gap: 4,
  },
  soundButtonText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '600',
  },
  viewPassBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    gap: 4,
  },
  viewPassText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
  },
  dismissBtn: {
    padding: 4,
  },
});
