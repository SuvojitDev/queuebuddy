import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Switch,
  Alert,
} from 'react-native';
import { User, Phone, Sparkles, Star, Ticket } from 'lucide-react-native';
import { Palette } from '../constants/theme';
import { useQueue } from '../context/QueueContext';
import { TokenItem } from '../types/queue';
import { DigitalPassModal } from '../components/DigitalPassModal';
import { formatWaitTime } from '../utils/timeEstimator';

export const GenerateTokenScreen: React.FC<{
  onNavigateToMyToken: () => void;
}> = ({ onNavigateToMyToken }) => {
  const { profile, services, waitingTokens, generateToken } = useQueue();

  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [selectedServiceId, setSelectedServiceId] = useState<string>(
    services[0]?.id || ''
  );
  const [isPriority, setIsPriority] = useState(false);
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [generatedToken, setGeneratedToken] = useState<TokenItem | null>(null);

  React.useEffect(() => {
    if (!selectedServiceId && services.length > 0) {
      setSelectedServiceId(services[0].id);
    }
  }, [services, selectedServiceId]);

  const selectedService = services.find((s) => s.id === selectedServiceId) || services[0];
  const waitingAheadCount = waitingTokens.length;
  const projectedWaitMinutes = isPriority
    ? 4
    : Math.max(5, (waitingAheadCount + 1) * Math.min(15, selectedService?.defaultDurationMinutes || 15));

  const handleJoinQueue = async () => {
    if (!customerName.trim()) {
      Alert.alert('Required', 'Please enter your name.');
      return;
    }
    if (!customerPhone.trim()) {
      Alert.alert('Required', 'Please enter your phone number to receive alerts.');
      return;
    }

    try {
      setIsSubmitting(true);
      const token = await generateToken(
        customerName.trim(),
        customerPhone.trim(),
        selectedServiceId || services[0].id,
        isPriority,
        notes.trim()
      );
      setGeneratedToken(token);
    } catch (err) {
      console.error('Failed to generate token:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Luxury Hero Banner */}
        <View style={styles.heroBox}>
          <View style={styles.heroPreRow}>
            <View style={styles.gemDot} />
            <Text style={styles.heroPreText}>SELF-SERVICE WAITING PASS</Text>
          </View>
          <Text style={styles.heroTitle}>Get Your Digital Token</Text>
          <Text style={styles.heroSub}>
            Take your waiting ticket for {profile?.name || 'QueueBuddy'}
          </Text>

          {/* Real-time Wait Info Banner */}
          <View style={styles.waitBadgeRow}>
            <View style={styles.waitBadge}>
              <View style={[styles.badgeDot, { backgroundColor: Palette.waitingBright }]} />
              <View style={{ marginLeft: 8 }}>
                <Text style={styles.waitBadgeLabel}>CURRENT EST. WAIT</Text>
                <Text style={[styles.waitBadgeValue, { color: Palette.waitingBright }]}>
                  {formatWaitTime(projectedWaitMinutes)}
                </Text>
              </View>
            </View>

            <View style={styles.waitBadge}>
              <View style={[styles.badgeDot, { backgroundColor: Palette.primaryBright }]} />
              <View style={{ marginLeft: 8 }}>
                <Text style={styles.waitBadgeLabel}>PEOPLE AHEAD</Text>
                <Text style={[styles.waitBadgeValue, { color: '#FFFFFF' }]}>
                  {waitingAheadCount} {waitingAheadCount === 1 ? 'person' : 'people'}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Section 1: Customer Details */}
        <View style={styles.formSection}>
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionHeader}>1. Customer Information</Text>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Full Name *</Text>
            <View style={styles.inputWrapper}>
              <User size={17} color={Palette.dark.textMuted} strokeWidth={2} />
              <TextInput
                style={styles.textInput}
                placeholder="e.g. Alex Morgan, Sarah Jenkins"
                placeholderTextColor={Palette.dark.textMuted}
                value={customerName}
                onChangeText={setCustomerName}
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Mobile / WhatsApp Number *</Text>
            <View style={styles.inputWrapper}>
              <Phone size={17} color={Palette.dark.textMuted} strokeWidth={2} />
              <TextInput
                style={styles.textInput}
                placeholder="+1 (555) 000-0000"
                placeholderTextColor={Palette.dark.textMuted}
                value={customerPhone}
                onChangeText={setCustomerPhone}
                keyboardType="phone-pad"
              />
            </View>
            <Text style={styles.inputTip}>
              We will send you a prompt notification when only 1-2 people are ahead of you!
            </Text>
          </View>
        </View>

        {/* Section 2: Choose Service */}
        <View style={styles.formSection}>
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionHeader}>2. Select Required Service</Text>
          </View>

          <View style={styles.serviceCardsContainer}>
            {services.map((srv) => {
              const isSelected = (selectedServiceId || services[0]?.id) === srv.id;
              return (
                <TouchableOpacity
                  key={srv.id}
                  style={[
                    styles.serviceOptionCard,
                    isSelected && styles.serviceOptionSelected,
                  ]}
                  onPress={() => setSelectedServiceId(srv.id)}
                  activeOpacity={0.82}
                >
                  <View
                    style={[
                      styles.serviceIconCircle,
                      isSelected && { backgroundColor: Palette.primary, borderColor: Palette.primaryBright },
                    ]}
                  >
                    <Sparkles
                      size={18}
                      color={isSelected ? '#FFFFFF' : Palette.primaryBright}
                      strokeWidth={2}
                    />
                  </View>

                  <View style={styles.serviceOptionBody}>
                    <Text
                      style={[
                        styles.serviceOptionTitle,
                        isSelected && { color: '#FFFFFF' },
                      ]}
                    >
                      {srv.name}
                    </Text>
                    <View style={styles.serviceOptionMeta}>
                      <Text style={styles.serviceMetaText}>
                        ⏱ ~{srv.defaultDurationMinutes} mins
                      </Text>
                      <Text style={[styles.servicePriceText, isSelected && { color: '#34D399' }]}>
                        ${srv.price}
                      </Text>
                    </View>
                  </View>

                  <View
                    style={[
                      styles.radioCircle,
                      isSelected && styles.radioCircleSelected,
                    ]}
                  >
                    {isSelected && <View style={styles.radioDot} />}
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Section 3: Priority & Notes */}
        <View style={styles.formSection}>
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionHeader}>3. Preferences</Text>
          </View>

          <View style={styles.priorityBox}>
            <View style={{ flex: 1, marginRight: 10 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <Star size={16} color={Palette.priorityBright} fill={Palette.priorityBright} />
                <Text style={styles.priorityTitle}>Priority / Fast-Track</Text>
              </View>
              <Text style={styles.priorityDesc}>
                Check if you have an appointment or urgent requirement
              </Text>
            </View>
            <Switch
              value={isPriority}
              onValueChange={setIsPriority}
              trackColor={{ false: 'rgba(255, 255, 255, 0.1)', true: Palette.priority }}
              thumbColor="#FFFFFF"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Additional Notes (Optional)</Text>
            <TextInput
              style={[styles.inputWrapper, styles.notesInput]}
              placeholder="Any specific requests or instructions?"
              placeholderTextColor={Palette.dark.textMuted}
              value={notes}
              onChangeText={setNotes}
              multiline
              numberOfLines={2}
            />
          </View>
        </View>

        {/* Submit Button */}
        <TouchableOpacity
          style={[styles.joinButton, isSubmitting && { opacity: 0.7 }]}
          onPress={handleJoinQueue}
          disabled={isSubmitting}
          activeOpacity={0.82}
        >
          <Ticket size={20} color="#FFFFFF" strokeWidth={2.2} />
          <Text style={styles.joinButtonText}>
            {isSubmitting ? 'Issuing Ticket...' : 'Get My Digital Token Pass'}
          </Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Digital Pass Modal upon generation */}
      <DigitalPassModal
        visible={Boolean(generatedToken)}
        token={generatedToken}
        profile={profile}
        positionInQueue={waitingAheadCount + 1}
        onClose={() => {
          setGeneratedToken(null);
          onNavigateToMyToken();
        }}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Palette.dark.background,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
    maxWidth: 680,
    width: '100%',
    alignSelf: 'center',
  },
  heroBox: {
    backgroundColor: '#0F1A30',
    borderRadius: 24,
    padding: 20,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
  },
  heroPreRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 6,
  },
  gemDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Palette.primaryBright,
  },
  heroPreText: {
    fontSize: 9,
    fontWeight: '900',
    color: Palette.primaryBright,
    letterSpacing: 1.2,
  },
  heroTitle: {
    fontSize: 22,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: 0.2,
  },
  heroSub: {
    fontSize: 12,
    color: Palette.dark.textSecondary,
    marginTop: 4,
    fontWeight: '500',
  },
  waitBadgeRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 18,
  },
  waitBadge: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#14223E',
    padding: 12,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  badgeDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
  },
  waitBadgeLabel: {
    fontSize: 8,
    fontWeight: '900',
    color: Palette.dark.textMuted,
    letterSpacing: 0.8,
  },
  waitBadgeValue: {
    fontSize: 14,
    fontWeight: '900',
    marginTop: 2,
    fontVariant: ['tabular-nums'],
  },
  formSection: {
    backgroundColor: '#0F1A30',
    borderRadius: 20,
    padding: 18,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    marginBottom: 16,
  },
  sectionHeaderRow: {
    marginBottom: 14,
  },
  sectionHeader: {
    fontSize: 14,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: 0.2,
  },
  inputGroup: {
    marginBottom: 14,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: Palette.dark.textSecondary,
    marginBottom: 6,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#14223E',
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    paddingHorizontal: 14,
    height: 48,
  },
  textInput: {
    flex: 1,
    color: '#FFFFFF',
    fontSize: 14,
    marginLeft: 8,
  },
  inputTip: {
    fontSize: 11,
    color: Palette.dark.textMuted,
    marginTop: 5,
    marginLeft: 4,
    fontWeight: '500',
  },
  serviceCardsContainer: {
    gap: 10,
  },
  serviceOptionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#14223E',
    borderRadius: 16,
    padding: 12,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  serviceOptionSelected: {
    borderColor: Palette.primaryBright,
    backgroundColor: 'rgba(2, 132, 199, 0.15)',
  },
  serviceIconCircle: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  serviceOptionBody: {
    flex: 1,
    marginLeft: 12,
  },
  serviceOptionTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  serviceOptionMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 3,
  },
  serviceMetaText: {
    fontSize: 11,
    color: Palette.dark.textSecondary,
  },
  servicePriceText: {
    fontSize: 12,
    fontWeight: '900',
    color: Palette.servingBright,
  },
  radioCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.25)',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },
  radioCircleSelected: {
    borderColor: Palette.primaryBright,
  },
  radioDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: Palette.primaryBright,
  },
  priorityBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#14223E',
    borderRadius: 14,
    padding: 12,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    marginBottom: 14,
  },
  priorityTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  priorityDesc: {
    fontSize: 11,
    color: Palette.dark.textMuted,
    marginTop: 2,
    fontWeight: '500',
  },
  notesInput: {
    height: 64,
    alignItems: 'flex-start',
    paddingVertical: 10,
  },
  joinButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Palette.primary,
    paddingVertical: 16,
    borderRadius: 16,
    gap: 8,
    shadowColor: Palette.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.45,
    shadowRadius: 12,
    elevation: 4,
  },
  joinButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '900',
    letterSpacing: 0.4,
  },
});
