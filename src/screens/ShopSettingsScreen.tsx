import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
  TextInput,
} from 'react-native';
import {
  Scissors,
  Stethoscope,
  Wrench,
  Trash2,
  RefreshCw,
} from 'lucide-react-native';
import { Palette } from '../constants/theme';
import { useQueue } from '../context/QueueContext';
import { BusinessType } from '../types/queue';
import { playChimeSound, triggerHaptic } from '../utils/notificationHelper';

export const ShopSettingsScreen: React.FC = () => {
  const {
    profile,
    counters,
    switchPreset,
    clearTodayQueue,
    updateBusinessProfile,
    setCounterStatus,
  } = useQueue();

  const [isEditingName, setIsEditingName] = useState(false);
  const [shopNameInput, setShopNameInput] = useState(profile?.name || '');

  const handlePresetSwitch = (type: BusinessType) => {
    if (type === 'custom') return;
    Alert.alert(
      'Switch Business Mode',
      `Switch to the ${type.toUpperCase()} preset? This will load industry-specific services, stations, and demo tokens.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Switch Preset',
          onPress: async () => {
            await switchPreset(type as 'salon' | 'clinic' | 'repair');
            setShopNameInput(
              type === 'salon'
                ? 'StyleCrafters Salon & Spa'
                : type === 'clinic'
                ? 'CityCare Family Clinic'
                : 'QuickFix Tech & Gadget Lab'
            );
          },
        },
      ]
    );
  };

  const handleClearQueue = () => {
    Alert.alert(
      'Reset Queue for Today',
      'Are you sure you want to clear all active and completed tokens for today?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear Queue',
          style: 'destructive',
          onPress: async () => {
            await clearTodayQueue();
          },
        },
      ]
    );
  };

  const handleSaveShopName = () => {
    if (shopNameInput.trim()) {
      updateBusinessProfile({ name: shopNameInput.trim() });
      setIsEditingName(false);
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.preHeaderRow}>
            <View style={styles.gemDot} />
            <Text style={styles.preHeaderText}>CONTROL CENTER</Text>
          </View>
          <Text style={styles.headerTitle}>Shop Configuration</Text>
          <Text style={styles.headerSub}>
            Configure your queue system, stations, and notification preferences
          </Text>
        </View>

        {/* Section 1: Business Presets */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>1. BUSINESS INDUSTRY PRESET</Text>
          <Text style={styles.sectionDesc}>
            Choose your business type to automatically configure services, stations, and ticket prefixes.
          </Text>

          <View style={styles.presetsGrid}>
            {[
              {
                type: 'salon' as const,
                title: 'Salon & Barber',
                icon: (c: string) => <Scissors size={22} color={c} strokeWidth={2} />,
                prefix: 'S-01, S-02...',
                color: '#38BDF8',
              },
              {
                type: 'clinic' as const,
                title: 'Clinic & Health',
                icon: (c: string) => <Stethoscope size={22} color={c} strokeWidth={2} />,
                prefix: 'C-01, C-02...',
                color: '#EC4899',
              },
              {
                type: 'repair' as const,
                title: 'Repair & Tech',
                icon: (c: string) => <Wrench size={22} color={c} strokeWidth={2} />,
                prefix: 'R-01, R-02...',
                color: '#F59E0B',
              },
            ].map((p) => {
              const isSelected = profile?.type === p.type;
              return (
                <TouchableOpacity
                  key={p.type}
                  style={[
                    styles.presetOption,
                    isSelected && [styles.presetOptionSelected, { borderColor: p.color }],
                  ]}
                  onPress={() => handlePresetSwitch(p.type)}
                  activeOpacity={0.82}
                >
                  <View
                    style={[
                      styles.presetIconWrap,
                      {
                        backgroundColor: isSelected ? p.color : `${p.color}18`,
                        borderColor: `${p.color}40`,
                      },
                    ]}
                  >
                    {p.icon(isSelected ? '#FFFFFF' : p.color)}
                  </View>
                  <Text
                    style={[
                      styles.presetTitle,
                      isSelected && { color: '#FFFFFF', fontWeight: '800' },
                    ]}
                  >
                    {p.title}
                  </Text>
                  <Text style={styles.presetPrefix}>{p.prefix}</Text>
                  {isSelected && (
                    <View style={[styles.activePill, { backgroundColor: p.color }]}>
                      <Text style={styles.activePillText}>ACTIVE</Text>
                    </View>
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Section 2: Shop Details */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>2. BUSINESS PROFILE</Text>

          {/* Shop Name */}
          <View style={styles.fieldRow}>
            <View style={{ flex: 1, marginRight: 8 }}>
              <Text style={styles.fieldLabel}>Shop / Clinic Name</Text>
              {isEditingName ? (
                <TextInput
                  style={styles.nameInput}
                  value={shopNameInput}
                  onChangeText={setShopNameInput}
                  autoFocus
                />
              ) : (
                <Text style={styles.fieldValue}>{profile?.name || 'QueueBuddy'}</Text>
              )}
            </View>
            <TouchableOpacity
              style={styles.editBtn}
              onPress={() => {
                if (isEditingName) {
                  handleSaveShopName();
                } else {
                  setIsEditingName(true);
                }
              }}
              activeOpacity={0.7}
            >
              <Text style={styles.editBtnText}>{isEditingName ? 'Save' : 'Edit'}</Text>
            </TouchableOpacity>
          </View>

          {/* Open / Closed Toggle */}
          <View style={styles.toggleRow}>
            <View style={{ flex: 1, marginRight: 10 }}>
              <Text style={styles.toggleTitle}>Accepting Walk-ins</Text>
              <Text style={styles.toggleDesc}>
                When paused, new customers cannot generate tickets
              </Text>
            </View>
            <Switch
              value={profile?.isOpen ?? true}
              onValueChange={(val) => updateBusinessProfile({ isOpen: val })}
              trackColor={{ false: 'rgba(255, 255, 255, 0.1)', true: Palette.serving }}
              thumbColor="#FFFFFF"
            />
          </View>
        </View>

        {/* Section 3: Station / Counter Management */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>3. ACTIVE COUNTERS & CHAIRS</Text>
          <Text style={styles.sectionDesc}>
            Manage staff availability. Stations on break are automatically excluded from wait-time calculations.
          </Text>

          <View style={styles.stationsList}>
            {counters.map((c) => {
              const isBreak = c.status === 'BREAK';
              return (
                <View key={c.id} style={styles.stationManageRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.stationRowName}>{c.name}</Text>
                    <Text style={styles.stationRowStaff}>
                      {c.staffName || c.stationType}
                    </Text>
                  </View>

                  <View style={styles.stationActions}>
                    <TouchableOpacity
                      style={[
                        styles.stationStatusBtn,
                        c.status === 'IDLE' && styles.statusBtnActive,
                      ]}
                      onPress={() => setCounterStatus(c.id, 'IDLE')}
                      activeOpacity={0.75}
                    >
                      <Text style={styles.stationStatusText}>Ready</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[
                        styles.stationStatusBtn,
                        c.status === 'BREAK' && styles.statusBtnBreak,
                      ]}
                      onPress={() => setCounterStatus(c.id, isBreak ? 'IDLE' : 'BREAK')}
                      activeOpacity={0.75}
                    >
                      <Text style={styles.stationStatusText}>Break</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              );
            })}
          </View>
        </View>

        {/* Section 4: Notification Preferences */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>4. NOTIFICATIONS & ALERTS</Text>

          {/* Near Turn Threshold */}
          <View style={styles.thresholdRow}>
            <View style={{ flex: 1, marginRight: 10 }}>
              <Text style={styles.toggleTitle}>Near-Turn Alert Threshold</Text>
              <Text style={styles.toggleDesc}>
                Trigger alert when customer reaches this position in line
              </Text>
            </View>

            <View style={styles.thresholdOptions}>
              {[1, 2, 3].map((num) => {
                const isSelected = (profile?.nearTurnThreshold ?? 2) === num;
                return (
                  <TouchableOpacity
                    key={num}
                    style={[
                      styles.thresholdBtn,
                      isSelected && styles.thresholdBtnSelected,
                    ]}
                    onPress={() => updateBusinessProfile({ nearTurnThreshold: num })}
                    activeOpacity={0.75}
                  >
                    <Text
                      style={[
                        styles.thresholdBtnText,
                        isSelected && { color: '#FFFFFF', fontWeight: '800' },
                      ]}
                    >
                      {num} ahead
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* Sound Chimes */}
          <View style={styles.toggleRow}>
            <View style={{ flex: 1, marginRight: 10 }}>
              <Text style={styles.toggleTitle}>Audio Chimes</Text>
              <Text style={styles.toggleDesc}>
                Play pleasant ding-dong audio when calling next customer
              </Text>
            </View>
            <Switch
              value={profile?.soundAlertsEnabled ?? true}
              onValueChange={(val) => {
                updateBusinessProfile({ soundAlertsEnabled: val });
                if (val) playChimeSound();
              }}
              trackColor={{ false: 'rgba(255, 255, 255, 0.1)', true: Palette.primary }}
              thumbColor="#FFFFFF"
            />
          </View>

          {/* Haptic Vibration */}
          <View style={styles.toggleRow}>
            <View style={{ flex: 1, marginRight: 10 }}>
              <Text style={styles.toggleTitle}>Vibration & Haptics</Text>
              <Text style={styles.toggleDesc}>
                Vibrate device when issuing or advancing tokens
              </Text>
            </View>
            <Switch
              value={profile?.hapticAlertsEnabled ?? true}
              onValueChange={(val) => {
                updateBusinessProfile({ hapticAlertsEnabled: val });
                if (val) triggerHaptic('success');
              }}
              trackColor={{ false: 'rgba(255, 255, 255, 0.1)', true: Palette.primary }}
              thumbColor="#FFFFFF"
            />
          </View>
        </View>

        {/* Section 5: Reset & Maintenance */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>5. QUEUE MAINTENANCE</Text>

          <TouchableOpacity
            style={styles.clearQueueBtn}
            onPress={handleClearQueue}
            activeOpacity={0.82}
          >
            <Trash2 size={17} color={Palette.cancelled} strokeWidth={2} />
            <Text style={styles.clearQueueText}>Clear & Reset Today's Queue</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.reloadDemoBtn}
            onPress={() => handlePresetSwitch(profile?.type || 'salon')}
            activeOpacity={0.82}
          >
            <RefreshCw size={17} color={Palette.primaryBright} strokeWidth={2.2} />
            <Text style={styles.reloadDemoText}>Reload Demo Data</Text>
          </TouchableOpacity>
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
  scrollContent: {
    padding: 16,
    paddingBottom: 44,
    maxWidth: 680,
    width: '100%',
    alignSelf: 'center',
  },
  header: {
    marginBottom: 18,
  },
  preHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  gemDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Palette.primaryBright,
  },
  preHeaderText: {
    fontSize: 9,
    fontWeight: '900',
    color: Palette.primaryBright,
    letterSpacing: 1.2,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: 0.2,
  },
  headerSub: {
    fontSize: 12,
    color: Palette.dark.textSecondary,
    marginTop: 4,
    fontWeight: '500',
  },
  sectionCard: {
    backgroundColor: '#0F1A30',
    borderRadius: 20,
    padding: 18,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: '900',
    color: Palette.dark.textSecondary,
    letterSpacing: 0.8,
    marginBottom: 4,
  },
  sectionDesc: {
    fontSize: 11,
    color: Palette.dark.textMuted,
    lineHeight: 16,
    marginBottom: 14,
    fontWeight: '500',
  },
  presetsGrid: {
    flexDirection: 'row',
    gap: 10,
  },
  presetOption: {
    flex: 1,
    backgroundColor: '#14223E',
    borderRadius: 16,
    padding: 12,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  presetOptionSelected: {
    backgroundColor: 'rgba(2, 132, 199, 0.12)',
  },
  presetIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
    borderWidth: 1,
  },
  presetTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FFFFFF',
    textAlign: 'center',
  },
  presetPrefix: {
    fontSize: 9,
    color: Palette.dark.textMuted,
    marginTop: 3,
    fontWeight: '600',
  },
  activePill: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 5,
    marginTop: 6,
  },
  activePillText: {
    fontSize: 8,
    fontWeight: '900',
    color: '#FFFFFF',
  },
  fieldRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.06)',
  },
  fieldLabel: {
    fontSize: 11,
    color: Palette.dark.textMuted,
    fontWeight: '600',
  },
  fieldValue: {
    fontSize: 14,
    fontWeight: '800',
    color: '#FFFFFF',
    marginTop: 2,
  },
  nameInput: {
    backgroundColor: '#14223E',
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    marginTop: 3,
    borderWidth: 1.5,
    borderColor: Palette.primaryBright,
  },
  editBtn: {
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  editBtnText: {
    fontSize: 12,
    fontWeight: '800',
    color: Palette.primaryBright,
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
  },
  toggleTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  toggleDesc: {
    fontSize: 11,
    color: Palette.dark.textMuted,
    marginTop: 2,
    fontWeight: '500',
  },
  stationsList: {
    gap: 8,
  },
  stationManageRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#14223E',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.06)',
  },
  stationRowName: {
    fontSize: 13,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  stationRowStaff: {
    fontSize: 11,
    color: Palette.dark.textMuted,
    marginTop: 1,
  },
  stationActions: {
    flexDirection: 'row',
    gap: 6,
  },
  stationStatusBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  statusBtnActive: {
    backgroundColor: Palette.primary,
    borderColor: Palette.primaryBright,
  },
  statusBtnBreak: {
    backgroundColor: Palette.cancelled,
    borderColor: Palette.cancelled,
  },
  stationStatusText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  thresholdRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.06)',
  },
  thresholdOptions: {
    flexDirection: 'row',
    gap: 6,
  },
  thresholdBtn: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  thresholdBtnSelected: {
    backgroundColor: Palette.primary,
    borderColor: Palette.primaryBright,
  },
  thresholdBtnText: {
    fontSize: 10,
    color: Palette.dark.textSecondary,
    fontWeight: '700',
  },
  clearQueueBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Palette.cancelledBg,
    borderRadius: 14,
    paddingVertical: 13,
    borderWidth: 1.5,
    borderColor: Palette.cancelledBorder,
    gap: 6,
    marginBottom: 10,
  },
  clearQueueText: {
    fontSize: 13,
    fontWeight: '800',
    color: Palette.cancelled,
  },
  reloadDemoBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderRadius: 14,
    paddingVertical: 13,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    gap: 6,
  },
  reloadDemoText: {
    fontSize: 13,
    fontWeight: '800',
    color: Palette.primaryBright,
  },
});
