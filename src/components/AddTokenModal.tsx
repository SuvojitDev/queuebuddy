import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Switch,
  Alert,
} from 'react-native';
import {
  X,
  Timer,
  User,
  Phone,
  CheckCircle2,
  Sparkles,
  Star,
  Ticket,
} from 'lucide-react-native';
import { Palette } from '../constants/theme';
import { ServiceItem, TokenItem } from '../types/queue';
import { formatWaitTime } from '../utils/timeEstimator';

interface AddTokenModalProps {
  visible: boolean;
  services: ServiceItem[];
  waitingCount: number;
  avgWaitMinutes: number;
  onClose: () => void;
  onSubmit: (
    customerName: string,
    customerPhone: string,
    serviceId: string,
    isPriority: boolean,
    notes: string
  ) => Promise<TokenItem>;
  onTokenGenerated: (token: TokenItem) => void;
}

export const AddTokenModal: React.FC<AddTokenModalProps> = ({
  visible,
  services,
  waitingCount,
  avgWaitMinutes,
  onClose,
  onSubmit,
  onTokenGenerated,
}) => {
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [selectedServiceId, setSelectedServiceId] = useState<string>(
    services[0]?.id || ''
  );
  const [isPriority, setIsPriority] = useState(false);
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Update selectedServiceId when services change or on mount
  React.useEffect(() => {
    if (!selectedServiceId && services.length > 0) {
      setSelectedServiceId(services[0].id);
    }
  }, [services, selectedServiceId]);

  const selectedService = services.find((s) => s.id === selectedServiceId) || services[0];
  const projectedWait = isPriority
    ? 5
    : Math.max(5, (waitingCount + 1) * Math.min(15, selectedService?.defaultDurationMinutes || 15));

  const handleGenerate = async () => {
    if (!customerName.trim()) {
      Alert.alert('Required Field', 'Please enter the customer name.');
      return;
    }
    if (!customerPhone.trim()) {
      Alert.alert('Required Field', 'Please enter the customer phone number.');
      return;
    }

    try {
      setIsSubmitting(true);
      const newToken = await onSubmit(
        customerName.trim(),
        customerPhone.trim(),
        selectedServiceId || services[0].id,
        isPriority,
        notes.trim()
      );

      // Reset fields
      setCustomerName('');
      setCustomerPhone('');
      setNotes('');
      setIsPriority(false);
      onClose();
      onTokenGenerated(newToken);
    } catch (err) {
      console.error('Error generating token:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.container}>
          {/* Header */}
          <View style={styles.header}>
            <View>
              <Text style={styles.headerTitle}>Generate Digital Token</Text>
              <Text style={styles.headerSub}>Issue a waiting pass for walk-in customer</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn} activeOpacity={0.7}>
              <X size={20} color={Palette.dark.textPrimary} strokeWidth={2.2} />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.body}>
            {/* Projected Wait Banner */}
            <View style={styles.estimateBanner}>
              <View style={styles.estimateLeft}>
                <Timer size={20} color={Palette.primaryBright} strokeWidth={2.2} />
                <View style={{ marginLeft: 8 }}>
                  <Text style={styles.estimateTitle}>ESTIMATED WAIT TIME</Text>
                  <Text style={styles.estimateValue}>{formatWaitTime(projectedWait)}</Text>
                </View>
              </View>
              <View style={styles.estimateBadge}>
                <Text style={styles.estimateBadgeText}>
                  {waitingCount} {waitingCount === 1 ? 'person' : 'people'} ahead
                </Text>
              </View>
            </View>

            {/* Input: Customer Name */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Customer Name *</Text>
              <View style={styles.inputWrapper}>
                <User size={18} color={Palette.dark.textMuted} strokeWidth={2} />
                <TextInput
                  style={styles.input}
                  placeholder="e.g. John Doe, Emily Watson"
                  placeholderTextColor={Palette.dark.textMuted}
                  value={customerName}
                  onChangeText={setCustomerName}
                />
              </View>
            </View>

            {/* Input: Customer Phone */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Mobile / WhatsApp Number *</Text>
              <View style={styles.inputWrapper}>
                <Phone size={18} color={Palette.dark.textMuted} strokeWidth={2} />
                <TextInput
                  style={styles.input}
                  placeholder="+1 (555) 000-0000"
                  placeholderTextColor={Palette.dark.textMuted}
                  value={customerPhone}
                  onChangeText={setCustomerPhone}
                  keyboardType="phone-pad"
                />
              </View>
              <Text style={styles.inputHelper}>Used to send SMS / WhatsApp alerts when turn is near</Text>
            </View>

            {/* Select Service */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Select Service *</Text>
              <View style={styles.serviceList}>
                {services.map((srv) => {
                  const isSelected = (selectedServiceId || services[0]?.id) === srv.id;
                  return (
                    <TouchableOpacity
                      key={srv.id}
                      style={[
                        styles.serviceChip,
                        isSelected && styles.serviceChipSelected,
                      ]}
                      onPress={() => setSelectedServiceId(srv.id)}
                      activeOpacity={0.7}
                    >
                      <View style={styles.serviceChipLeft}>
                        <Sparkles
                          size={16}
                          color={isSelected ? '#FFFFFF' : Palette.primaryBright}
                          strokeWidth={2}
                        />
                        <View style={{ marginLeft: 8 }}>
                          <Text
                            style={[
                              styles.serviceChipName,
                              isSelected && { color: '#FFFFFF' },
                            ]}
                          >
                            {srv.name}
                          </Text>
                          <Text
                            style={[
                              styles.serviceChipMeta,
                              isSelected && { color: 'rgba(255, 255, 255, 0.8)' },
                            ]}
                          >
                            ~{srv.defaultDurationMinutes} mins • ${srv.price}
                          </Text>
                        </View>
                      </View>
                      {isSelected && (
                        <CheckCircle2 size={18} color="#FFFFFF" strokeWidth={2.5} />
                      )}
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* Priority Switch */}
            <View style={styles.switchRow}>
              <View style={styles.switchInfo}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <Star size={16} color={Palette.priorityBright} fill={Palette.priorityBright} />
                  <Text style={styles.switchTitle}>Priority / Fast-Track</Text>
                </View>
                <Text style={styles.switchDesc}>
                  Bump to front of line (Emergency, Appointment, VIP)
                </Text>
              </View>
              <Switch
                value={isPriority}
                onValueChange={setIsPriority}
                trackColor={{ false: Palette.dark.surfaceBorder, true: Palette.priority }}
                thumbColor="#FFFFFF"
              />
            </View>

            {/* Notes / Issue Description */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Special Notes / Requests (Optional)</Text>
              <TextInput
                style={[styles.inputWrapper, styles.textArea]}
                placeholder="e.g. Low skin fade, Battery check, Toothache since yesterday"
                placeholderTextColor={Palette.dark.textMuted}
                value={notes}
                onChangeText={setNotes}
                multiline
                numberOfLines={2}
              />
            </View>

            {/* Action Buttons */}
            <TouchableOpacity
              style={[styles.generateButton, isSubmitting && { opacity: 0.6 }]}
              onPress={handleGenerate}
              disabled={isSubmitting}
              activeOpacity={0.8}
            >
              <Ticket size={20} color="#FFFFFF" strokeWidth={2.2} />
              <Text style={styles.generateButtonText}>
                {isSubmitting ? 'Generating Token...' : 'Issue Digital Token Pass'}
              </Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    justifyContent: 'flex-end',
  },
  container: {
    backgroundColor: Palette.dark.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '90%',
    maxWidth: 520,
    width: '100%',
    alignSelf: 'center',
    borderWidth: 1,
    borderColor: Palette.dark.surfaceBorder,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: Palette.dark.surfaceBorder,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: Palette.dark.textPrimary,
  },
  headerSub: {
    fontSize: 12,
    color: Palette.dark.textSecondary,
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
  body: {
    padding: 20,
    paddingBottom: 36,
  },
  estimateBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(2, 132, 199, 0.12)',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(2, 132, 199, 0.3)',
    marginBottom: 16,
  },
  estimateLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  estimateTitle: {
    fontSize: 9,
    fontWeight: '800',
    color: Palette.primary,
    letterSpacing: 0.5,
  },
  estimateValue: {
    fontSize: 15,
    fontWeight: '800',
    color: Palette.dark.textPrimary,
    marginTop: 1,
  },
  estimateBadge: {
    backgroundColor: Palette.dark.surfaceElevated,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  estimateBadgeText: {
    fontSize: 11,
    color: Palette.dark.textSecondary,
    fontWeight: '600',
  },
  inputGroup: {
    marginBottom: 14,
  },
  label: {
    fontSize: 12,
    fontWeight: '700',
    color: Palette.dark.textSecondary,
    marginBottom: 6,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Palette.dark.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Palette.dark.cardBorder,
    paddingHorizontal: 12,
    height: 46,
  },
  input: {
    flex: 1,
    color: Palette.dark.textPrimary,
    fontSize: 14,
    marginLeft: 8,
  },
  textArea: {
    height: 64,
    paddingVertical: 8,
    alignItems: 'flex-start',
  },
  inputHelper: {
    fontSize: 10,
    color: Palette.dark.textMuted,
    marginTop: 4,
    marginLeft: 4,
  },
  serviceList: {
    gap: 8,
  },
  serviceChip: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Palette.dark.card,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Palette.dark.cardBorder,
  },
  serviceChipSelected: {
    backgroundColor: Palette.primaryDark,
    borderColor: Palette.primary,
  },
  serviceChipLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  serviceChipName: {
    fontSize: 13,
    fontWeight: '700',
    color: Palette.dark.textPrimary,
  },
  serviceChipMeta: {
    fontSize: 11,
    color: Palette.dark.textMuted,
    marginTop: 2,
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Palette.dark.surfaceElevated,
    padding: 12,
    borderRadius: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: Palette.dark.surfaceBorder,
  },
  switchInfo: {
    flex: 1,
    marginRight: 10,
  },
  switchTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: Palette.dark.textPrimary,
  },
  switchDesc: {
    fontSize: 11,
    color: Palette.dark.textMuted,
    marginTop: 2,
  },
  generateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Palette.primary,
    paddingVertical: 14,
    borderRadius: 14,
    marginTop: 10,
    gap: 8,
  },
  generateButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
  },
});
