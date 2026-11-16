import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  FlatList,
} from 'react-native';
import {
  Megaphone,
  Zap,
  MessageSquare,
  MessageCircle,
  Send,
  X,
  BellOff,
} from 'lucide-react-native';
import { Palette } from '../constants/theme';
import { NotificationLog } from '../types/queue';
import { sendSMSNotification, sendWhatsAppNotification } from '../utils/notificationHelper';

interface NotificationModalProps {
  visible: boolean;
  notifications: NotificationLog[];
  onClose: () => void;
}

export const NotificationModal: React.FC<NotificationModalProps> = ({
  visible,
  notifications,
  onClose,
}) => {
  const renderItem = ({ item }: { item: NotificationLog }) => {
    const isNear = item.type === 'NEAR_TURN';
    const isServing = item.type === 'NOW_SERVING';
    const timeFormatted = new Date(item.timestamp).toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
    });

    return (
      <View style={styles.notifCard}>
        <View style={styles.notifHeader}>
          <View style={styles.headerLeft}>
            <View
              style={[
                styles.iconBadge,
                isNear
                  ? { backgroundColor: Palette.nearTurnBg }
                  : isServing
                  ? { backgroundColor: Palette.servingBg }
                  : { backgroundColor: Palette.primaryLight },
              ]}
            >
              {isNear ? (
                <Megaphone size={14} color={Palette.nearTurn} strokeWidth={2.2} />
              ) : isServing ? (
                <Zap size={14} color={Palette.serving} strokeWidth={2.5} />
              ) : (
                <MessageSquare size={14} color={Palette.primary} strokeWidth={2} />
              )}
            </View>

            <View style={{ marginLeft: 8 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <Text style={styles.tokenNumberBadge}>{item.tokenNumber}</Text>
                <Text style={styles.customerName}>{item.customerName}</Text>
              </View>
              <Text style={styles.channelBadge}>{item.channel} Notification</Text>
            </View>
          </View>

          <Text style={styles.timeText}>{timeFormatted}</Text>
        </View>

        <Text style={styles.messageText}>{item.message}</Text>

        {/* Quick resend buttons */}
        <View style={styles.actionRow}>
          <TouchableOpacity
            style={styles.actionBtn}
            onPress={() => sendWhatsAppNotification(item.customerPhone, item.message)}
            activeOpacity={0.7}
          >
            <MessageCircle size={13} color="#10B981" strokeWidth={2.2} />
            <Text style={[styles.actionBtnText, { color: '#10B981' }]}>WhatsApp</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionBtn}
            onPress={() => sendSMSNotification(item.customerPhone, item.message)}
            activeOpacity={0.7}
          >
            <Send size={13} color="#38BDF8" strokeWidth={2.2} />
            <Text style={[styles.actionBtnText, { color: '#38BDF8' }]}>SMS App</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.container}>
          {/* Header */}
          <View style={styles.header}>
            <View>
              <Text style={styles.headerTitle}>Customer Notifications</Text>
              <Text style={styles.headerSub}>
                {notifications.length} alerts sent / queued for customer devices
              </Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn} activeOpacity={0.7}>
              <X size={20} color={Palette.dark.textPrimary} strokeWidth={2.2} />
            </TouchableOpacity>
          </View>

          {/* List */}
          {notifications.length === 0 ? (
            <View style={styles.emptyContainer}>
              <BellOff size={40} color={Palette.dark.textMuted} strokeWidth={1.8} />
              <Text style={styles.emptyTitle}>No Alerts Yet</Text>
              <Text style={styles.emptySub}>
                When customers reach near turn or are called to a counter, alert logs will appear here.
              </Text>
            </View>
          ) : (
            <FlatList
              data={notifications}
              keyExtractor={(item) => item.id}
              renderItem={renderItem}
              contentContainerStyle={styles.listContent}
              showsVerticalScrollIndicator={false}
            />
          )}
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.82)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  container: {
    backgroundColor: Palette.dark.surface,
    borderRadius: 20,
    width: '100%',
    maxWidth: 440,
    maxHeight: '82%',
    borderWidth: 1,
    borderColor: Palette.dark.surfaceBorder,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 18,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: Palette.dark.surfaceBorder,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: Palette.dark.textPrimary,
  },
  headerSub: {
    fontSize: 11,
    color: Palette.dark.textMuted,
    marginTop: 2,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Palette.dark.surfaceElevated,
    alignItems: 'center',
    justifyContent: 'center',
  },
  listContent: {
    padding: 16,
    gap: 10,
  },
  notifCard: {
    backgroundColor: Palette.dark.card,
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: Palette.dark.cardBorder,
  },
  notifHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  iconBadge: {
    width: 28,
    height: 28,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tokenNumberBadge: {
    fontSize: 12,
    fontWeight: '800',
    color: Palette.primary,
  },
  customerName: {
    fontSize: 13,
    fontWeight: '700',
    color: Palette.dark.textPrimary,
  },
  channelBadge: {
    fontSize: 10,
    color: Palette.dark.textMuted,
    marginTop: 1,
  },
  timeText: {
    fontSize: 11,
    color: Palette.dark.textMuted,
  },
  messageText: {
    fontSize: 12,
    color: Palette.dark.textSecondary,
    lineHeight: 17,
    backgroundColor: Palette.dark.surfaceElevated,
    padding: 8,
    borderRadius: 8,
    marginBottom: 8,
  },
  actionRow: {
    flexDirection: 'row',
    gap: 8,
    justifyContent: 'flex-end',
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    backgroundColor: Palette.dark.surfaceElevated,
    borderWidth: 1,
    borderColor: Palette.dark.surfaceBorder,
    gap: 4,
  },
  actionBtnText: {
    fontSize: 10,
    fontWeight: '700',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 36,
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: Palette.dark.textPrimary,
    marginTop: 12,
  },
  emptySub: {
    fontSize: 12,
    color: Palette.dark.textMuted,
    textAlign: 'center',
    marginTop: 6,
    lineHeight: 18,
  },
});
