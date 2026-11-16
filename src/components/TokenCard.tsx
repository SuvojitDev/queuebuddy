import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import {
  Star,
  Zap,
  Megaphone,
  Clock,
  CheckCircle2,
  XCircle,
  Phone,
  Tag,
  MessageSquare,
  ChevronUp,
  ChevronDown,
  MapPin,
} from 'lucide-react-native';
import { Palette } from '../constants/theme';
import { TokenItem } from '../types/queue';
import { formatWaitTime, formatEstimatedClockTime } from '../utils/timeEstimator';

interface TokenCardProps {
  token: TokenItem;
  positionInQueue?: number;
  onPressCard?: () => void;
  onAlertNearTurn?: () => void;
  onStartServing?: () => void;
  onComplete?: () => void;
  onNoShow?: () => void;
  onOpenNotifications?: () => void;
  onBump?: (direction: 'UP' | 'DOWN') => void;
}

export const TokenCard: React.FC<TokenCardProps> = ({
  token,
  positionInQueue,
  onPressCard,
  onAlertNearTurn,
  onStartServing,
  onComplete,
  onNoShow,
  onOpenNotifications,
  onBump,
}) => {
  const isNear = token.status === 'NEAR';
  const isServing = token.status === 'SERVING';
  const isWaiting = token.status === 'WAITING';
  const isCompleted = token.status === 'COMPLETED';

  const getStatusStyles = () => {
    switch (token.status) {
      case 'SERVING':
        return {
          bg: 'rgba(16, 185, 129, 0.12)',
          border: 'rgba(16, 185, 129, 0.45)',
          text: Palette.servingBright,
          label: 'IN SERVICE',
        };
      case 'NEAR':
        return {
          bg: 'rgba(249, 115, 22, 0.15)',
          border: 'rgba(249, 115, 22, 0.5)',
          text: Palette.nearTurnBright,
          label: 'TURN IS NEAR',
        };
      case 'WAITING':
        return {
          bg: 'rgba(245, 158, 11, 0.1)',
          border: 'rgba(245, 158, 11, 0.35)',
          text: Palette.waitingBright,
          label: 'WAITING',
        };
      case 'COMPLETED':
        return {
          bg: 'rgba(100, 116, 139, 0.1)',
          border: 'rgba(100, 116, 139, 0.25)',
          text: Palette.dark.textSecondary,
          label: 'COMPLETED',
        };
      default:
        return {
          bg: 'rgba(239, 68, 68, 0.1)',
          border: 'rgba(239, 68, 68, 0.3)',
          text: Palette.cancelled,
          label: token.status,
        };
    }
  };

  const renderStatusIcon = (color: string) => {
    switch (token.status) {
      case 'SERVING':
        return <Zap size={11} color={color} strokeWidth={2.5} style={{ marginRight: 4 }} />;
      case 'NEAR':
        return <Megaphone size={11} color={color} strokeWidth={2.5} style={{ marginRight: 4 }} />;
      case 'WAITING':
        return <Clock size={11} color={color} strokeWidth={2.5} style={{ marginRight: 4 }} />;
      case 'COMPLETED':
        return <CheckCircle2 size={11} color={color} strokeWidth={2.5} style={{ marginRight: 4 }} />;
      default:
        return <XCircle size={11} color={color} strokeWidth={2.5} style={{ marginRight: 4 }} />;
    }
  };

  const statusInfo = getStatusStyles();

  return (
    <TouchableOpacity
      style={[
        styles.card,
        isNear && styles.cardNearGlow,
        isServing && styles.cardServingGlow,
      ]}
      onPress={onPressCard}
      activeOpacity={0.88}
    >
      {/* Top Header Row */}
      <View style={styles.topRow}>
        <View style={styles.tokenBadgeGroup}>
          <View
            style={[
              styles.tokenNumberBadge,
              isNear
                ? { backgroundColor: Palette.nearTurn }
                : isServing
                ? { backgroundColor: Palette.serving }
                : { backgroundColor: Palette.primary },
            ]}
          >
            <Text style={styles.tokenNumberText}>{token.tokenNumber}</Text>
          </View>

          {positionInQueue !== undefined && isWaiting && (
            <View style={styles.positionBadge}>
              <Text style={styles.positionText}>#{positionInQueue} in line</Text>
            </View>
          )}

          {token.isPriority && (
            <View style={styles.priorityBadge}>
              <Star size={10} color="#FFFFFF" fill="#FFFFFF" />
              <Text style={styles.priorityText}>PRIORITY</Text>
            </View>
          )}

          {token.isLobbyPresent && (
            <View style={styles.lobbyBadge}>
              <MapPin size={10} color="#10B981" strokeWidth={2.5} />
              <Text style={styles.lobbyText}>IN LOBBY</Text>
            </View>
          )}

          {(token.snoozeCount || 0) > 0 && (
            <View style={styles.snoozeBadge}>
              <Clock size={10} color="#F59E0B" strokeWidth={2.5} />
              <Text style={styles.snoozeText}>+{token.snoozeCount! * 10}m</Text>
            </View>
          )}
        </View>

        {/* Status Pill */}
        <View
          style={[
            styles.statusPill,
            { backgroundColor: statusInfo.bg, borderColor: statusInfo.border },
          ]}
        >
          {renderStatusIcon(statusInfo.text)}
          <Text style={[styles.statusPillText, { color: statusInfo.text }]}>
            {statusInfo.label}
          </Text>
        </View>
      </View>

      {/* Middle Row: Customer Details & Estimated Wait */}
      <View style={styles.middleRow}>
        <View style={styles.customerDetails}>
          <Text style={styles.customerName}>{token.customerName}</Text>
          <View style={styles.phoneRow}>
            <Phone size={12} color={Palette.dark.textMuted} strokeWidth={2} />
            <Text style={styles.customerPhone}>{token.customerPhone}</Text>
          </View>
        </View>

        {/* Wait time box */}
        {(isWaiting || isNear) && (
          <View style={styles.waitBox}>
            <Text style={styles.waitLabel}>EST. WAIT</Text>
            <Text style={[styles.waitValue, isNear && { color: Palette.nearTurnBright }]}>
              {formatWaitTime(token.estimatedWaitMinutes)}
            </Text>
            <Text style={styles.clockTime}>
              turn ~{formatEstimatedClockTime(token.estimatedWaitMinutes)}
            </Text>
          </View>
        )}

        {isServing && (
          <View style={styles.servingCounterBox}>
            <Text style={styles.counterTitle}>AT STATION</Text>
            <Text style={styles.counterNameText} numberOfLines={1}>
              {token.counterName || 'Assigned Station'}
            </Text>
          </View>
        )}
      </View>

      {/* Service & Notes Row */}
      <View style={styles.serviceRow}>
        <View style={styles.serviceTag}>
          <Tag size={12} color={Palette.primaryBright} strokeWidth={2} />
          <Text style={styles.serviceName}>{token.serviceName}</Text>
        </View>

        {token.notes ? (
          <Text style={styles.notesText} numberOfLines={1}>
            "{token.notes}"
          </Text>
        ) : null}
      </View>

      {/* Action Strip */}
      {(isWaiting || isNear || isServing) && (
        <View style={styles.actionStrip}>
          {/* Near Turn / Alert Button */}
          {(isWaiting || isNear) && onAlertNearTurn && (
            <TouchableOpacity
              style={[
                styles.actionBtn,
                isNear ? styles.actionBtnNearActive : styles.actionBtnAlert,
              ]}
              onPress={onAlertNearTurn}
              activeOpacity={0.75}
            >
              <Megaphone
                size={13}
                color={isNear ? '#FFFFFF' : Palette.nearTurnBright}
                strokeWidth={2.2}
              />
              <Text
                style={[
                  styles.actionBtnText,
                  { color: isNear ? '#FFFFFF' : Palette.nearTurnBright },
                ]}
              >
                {isNear ? 'Alerted' : 'Alert Near'}
              </Text>
            </TouchableOpacity>
          )}

          {/* Serve / Start Button */}
          {(isWaiting || isNear) && onStartServing && (
            <TouchableOpacity
              style={[styles.actionBtn, styles.actionBtnServe]}
              onPress={onStartServing}
              activeOpacity={0.75}
            >
              <Zap size={13} color="#FFFFFF" strokeWidth={2.5} />
              <Text style={[styles.actionBtnText, { color: '#FFFFFF' }]}>Serve</Text>
            </TouchableOpacity>
          )}

          {/* Complete Button */}
          {isServing && onComplete && (
            <TouchableOpacity
              style={[styles.actionBtn, styles.actionBtnComplete]}
              onPress={onComplete}
              activeOpacity={0.75}
            >
              <CheckCircle2 size={14} color="#FFFFFF" strokeWidth={2.5} />
              <Text style={[styles.actionBtnText, { color: '#FFFFFF' }]}>Complete</Text>
            </TouchableOpacity>
          )}

          {/* WhatsApp / SMS Quick Action */}
          {onOpenNotifications && (
            <TouchableOpacity
              style={styles.actionBtnIconOnly}
              onPress={onOpenNotifications}
              activeOpacity={0.75}
            >
              <MessageSquare size={15} color="#10B981" strokeWidth={2} />
            </TouchableOpacity>
          )}

          {/* Bump Position (Up/Down) */}
          {(isWaiting || isNear) && onBump && (
            <View style={styles.bumpGroup}>
              <TouchableOpacity
                style={styles.bumpBtn}
                onPress={() => onBump('UP')}
                activeOpacity={0.7}
              >
                <ChevronUp size={14} color={Palette.dark.textSecondary} strokeWidth={2.5} />
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.bumpBtn}
                onPress={() => onBump('DOWN')}
                activeOpacity={0.7}
              >
                <ChevronDown size={14} color={Palette.dark.textSecondary} strokeWidth={2.5} />
              </TouchableOpacity>
            </View>
          )}

          {/* Cancel / No Show */}
          {(isWaiting || isNear) && onNoShow && (
            <TouchableOpacity
              style={styles.actionBtnIconOnly}
              onPress={onNoShow}
              activeOpacity={0.75}
            >
              <XCircle size={16} color={Palette.cancelled} strokeWidth={2} />
            </TouchableOpacity>
          )}
        </View>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#0F1A30',
    borderRadius: 18,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 3,
  },
  cardNearGlow: {
    borderColor: 'rgba(249, 115, 22, 0.45)',
    backgroundColor: 'rgba(249, 115, 22, 0.05)',
  },
  cardServingGlow: {
    borderColor: 'rgba(16, 185, 129, 0.45)',
    backgroundColor: 'rgba(16, 185, 129, 0.05)',
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  tokenBadgeGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    flexWrap: 'wrap',
    flex: 1,
  },
  tokenNumberBadge: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
  },
  tokenNumberText: {
    fontSize: 16,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: 0.8,
  },
  positionBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  positionText: {
    fontSize: 11,
    color: Palette.dark.textSecondary,
    fontWeight: '700',
  },
  priorityBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Palette.priority,
    paddingHorizontal: 7,
    paddingVertical: 4,
    borderRadius: 8,
    gap: 3,
  },
  priorityText: {
    fontSize: 9,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  lobbyBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.45)',
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 8,
    gap: 3,
  },
  lobbyText: {
    fontSize: 9,
    fontWeight: '900',
    color: '#10B981',
    letterSpacing: 0.5,
  },
  snoozeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.45)',
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 8,
    gap: 3,
  },
  snoozeText: {
    fontSize: 9,
    fontWeight: '900',
    color: '#F59E0B',
    letterSpacing: 0.5,
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
  },
  statusPillText: {
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  middleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  customerDetails: {
    flex: 1,
    marginRight: 10,
  },
  customerName: {
    fontSize: 16,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.2,
  },
  phoneRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 3,
  },
  customerPhone: {
    fontSize: 12,
    color: Palette.dark.textMuted,
    fontWeight: '500',
  },
  waitBox: {
    alignItems: 'flex-end',
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
  },
  waitLabel: {
    fontSize: 8,
    fontWeight: '900',
    color: Palette.dark.textMuted,
    letterSpacing: 0.8,
  },
  waitValue: {
    fontSize: 14,
    fontWeight: '900',
    color: Palette.waitingBright,
    marginTop: 1,
  },
  clockTime: {
    fontSize: 9,
    color: Palette.dark.textMuted,
    marginTop: 1,
  },
  servingCounterBox: {
    alignItems: 'flex-end',
    backgroundColor: 'rgba(16, 185, 129, 0.12)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.35)',
  },
  counterTitle: {
    fontSize: 8,
    fontWeight: '900',
    color: Palette.servingBright,
    letterSpacing: 0.8,
  },
  counterNameText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#FFFFFF',
    marginTop: 2,
  },
  serviceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.06)',
    marginBottom: 10,
  },
  serviceTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  serviceName: {
    fontSize: 12,
    fontWeight: '700',
    color: Palette.primaryBright,
  },
  notesText: {
    fontSize: 11,
    fontStyle: 'italic',
    color: Palette.dark.textMuted,
    flex: 1,
    textAlign: 'right',
    marginLeft: 8,
  },
  actionStrip: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 6,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.05)',
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 10,
    gap: 4,
  },
  actionBtnAlert: {
    backgroundColor: 'rgba(249, 115, 22, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(249, 115, 22, 0.4)',
  },
  actionBtnNearActive: {
    backgroundColor: Palette.nearTurn,
  },
  actionBtnServe: {
    backgroundColor: Palette.primary,
    flex: 1,
    justifyContent: 'center',
  },
  actionBtnComplete: {
    backgroundColor: Palette.serving,
    flex: 1,
    justifyContent: 'center',
  },
  actionBtnText: {
    fontSize: 12,
    fontWeight: '800',
  },
  actionBtnIconOnly: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  bumpGroup: {
    flexDirection: 'row',
    borderRadius: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    overflow: 'hidden',
  },
  bumpBtn: {
    paddingHorizontal: 8,
    paddingVertical: 7,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
