import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, ScrollView } from 'react-native';
import {
  Scissors,
  Stethoscope,
  Wrench,
  ChevronDown,
  Bell,
  X,
  Check,
} from 'lucide-react-native';
import { Palette } from '../constants/theme';
import { useQueue } from '../context/QueueContext';

interface HeaderProps {
  onOpenNotifications: () => void;
  onOpenBusinessPicker?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  onOpenNotifications,
  onOpenBusinessPicker,
}) => {
  const { profile, notifications, updateBusinessProfile, switchPreset } = useQueue();
  const [isPickerVisible, setIsPickerVisible] = useState(false);

  const renderBusinessIcon = (type?: string, size = 18, color = '#FFFFFF') => {
    switch (type) {
      case 'clinic':
        return <Stethoscope size={size} color={color} strokeWidth={2} />;
      case 'repair':
        return <Wrench size={size} color={color} strokeWidth={2} />;
      case 'salon':
      default:
        return <Scissors size={size} color={color} strokeWidth={2} />;
    }
  };

  const getBusinessThemeColor = () => {
    switch (profile?.type) {
      case 'clinic':
        return '#EC4899';
      case 'repair':
        return '#F59E0B';
      case 'salon':
      default:
        return '#38BDF8';
    }
  };

  const toggleOpenStatus = () => {
    if (profile) {
      updateBusinessProfile({ isOpen: !profile.isOpen });
    }
  };

  const handleSelectPreset = async (presetType: 'salon' | 'clinic' | 'repair') => {
    setIsPickerVisible(false);
    await switchPreset(presetType);
  };

  const unreadNotifsCount = notifications.length;
  const themeColor = getBusinessThemeColor();

  return (
    <View style={styles.container}>
      {/* Brand & Shop Info */}
      <View style={styles.brandRow}>
        <TouchableOpacity
          style={[styles.logoBadge, { borderColor: `${themeColor}50`, shadowColor: themeColor }]}
          onPress={() => setIsPickerVisible(true)}
          activeOpacity={0.8}
        >
          {renderBusinessIcon(profile?.type, 20, '#FFFFFF')}
        </TouchableOpacity>

        <View style={styles.titleColumn}>
          <TouchableOpacity
            onPress={() => setIsPickerVisible(true)}
            activeOpacity={0.7}
            style={styles.nameRow}
          >
            <Text style={styles.shopName} numberOfLines={1}>
              {profile?.name || 'QueueBuddy'}
            </Text>
            <View style={styles.chevronPill}>
              <ChevronDown
                size={13}
                color={Palette.primaryBright}
                strokeWidth={2.5}
              />
            </View>
          </TouchableOpacity>
          <Text style={styles.tagline} numberOfLines={1}>
            {profile?.tagline || 'Digital Waiting List'}
          </Text>
        </View>

        {/* Right Action Icons */}
        <View style={styles.rightActions}>
          {/* Status Pill */}
          <TouchableOpacity
            style={[
              styles.statusPill,
              profile?.isOpen ? styles.statusOpen : styles.statusClosed,
            ]}
            onPress={toggleOpenStatus}
            activeOpacity={0.8}
          >
            <View
              style={[
                styles.statusDot,
                { backgroundColor: profile?.isOpen ? Palette.servingBright : Palette.cancelled },
              ]}
            />
            <Text
              style={[
                styles.statusText,
                { color: profile?.isOpen ? Palette.servingBright : Palette.cancelled },
              ]}
            >
              {profile?.isOpen ? 'OPEN' : 'PAUSED'}
            </Text>
          </TouchableOpacity>

          {/* Notification Bell */}
          <TouchableOpacity
            style={styles.bellButton}
            onPress={onOpenNotifications}
            activeOpacity={0.7}
          >
            <Bell size={18} color={Palette.dark.textPrimary} strokeWidth={2} />
            {unreadNotifsCount > 0 && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>
                  {unreadNotifsCount > 99 ? '99+' : unreadNotifsCount}
                </Text>
              </View>
            )}
          </TouchableOpacity>
        </View>
      </View>

      {/* Luxury Quick Business Switcher Modal */}
      <Modal
        visible={isPickerVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setIsPickerVisible(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setIsPickerVisible(false)}
        >
          <View style={styles.modalContent} onStartShouldSetResponder={() => true}>
            {/* Modal Top Header with Glow */}
            <View style={styles.modalHeader}>
              <View style={{ flex: 1, marginRight: 10 }}>
                <View style={styles.modalPreHeader}>
                  <View style={styles.gemDot} />
                  <Text style={styles.modalPreHeaderText}>MULTI-INDUSTRY SYSTEM</Text>
                </View>
                <Text style={styles.modalTitle}>Switch Business Mode</Text>
                <Text style={styles.modalSub}>
                  Instantly switch live queue, stations & service catalog
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => setIsPickerVisible(false)}
                style={styles.closeBtn}
                activeOpacity={0.7}
              >
                <X size={16} color={Palette.dark.textSecondary} strokeWidth={2.5} />
              </TouchableOpacity>
            </View>

            {/* Presets List Scrollable */}
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.presetsList}>
              {[
                {
                  type: 'salon' as const,
                  name: 'Salon & Barbershop',
                  shopName: 'StyleCrafters Salon & Spa',
                  prefix: 'Token: S-01, S-02...',
                  desc: 'Haircuts, Beard trim, Styling • 3 Stylist Chairs',
                  icon: (color: string) => <Scissors size={22} color={color} strokeWidth={2} />,
                  color: '#38BDF8',
                  gradientSub: 'rgba(56, 189, 248, 0.12)',
                },
                {
                  type: 'clinic' as const,
                  name: 'Clinic & Healthcare',
                  shopName: 'CityCare Family Clinic',
                  prefix: 'Token: C-01, C-02...',
                  desc: 'Consultations, Pediatrics, Lab • 3 Care Rooms',
                  icon: (color: string) => <Stethoscope size={22} color={color} strokeWidth={2} />,
                  color: '#EC4899',
                  gradientSub: 'rgba(236, 72, 153, 0.12)',
                },
                {
                  type: 'repair' as const,
                  name: 'Repair & Tech Lab',
                  shopName: 'QuickFix Tech Lab',
                  prefix: 'Token: R-01, R-02...',
                  desc: 'Screen repair, Batteries, Diagnostic • 3 Benches',
                  icon: (color: string) => <Wrench size={22} color={color} strokeWidth={2} />,
                  color: '#F59E0B',
                  gradientSub: 'rgba(245, 158, 11, 0.12)',
                },
              ].map((item) => {
                const isCurrent = profile?.type === item.type;
                return (
                  <TouchableOpacity
                    key={item.type}
                    style={[
                      styles.presetCard,
                      isCurrent && [
                        styles.presetCardActive,
                        { borderColor: item.color, backgroundColor: item.gradientSub },
                      ],
                    ]}
                    onPress={() => handleSelectPreset(item.type)}
                    activeOpacity={0.82}
                  >
                    {/* Icon Squircle */}
                    <View
                      style={[
                        styles.presetIconBox,
                        {
                          backgroundColor: isCurrent ? item.color : `${item.color}18`,
                          borderColor: `${item.color}40`,
                        },
                      ]}
                    >
                      {item.icon(isCurrent ? '#FFFFFF' : item.color)}
                    </View>

                    {/* Text Details */}
                    <View style={styles.presetTextBox}>
                      <View style={styles.presetCardTopRow}>
                        <Text style={styles.presetCategoryName}>{item.name}</Text>
                        <View style={[styles.prefixPill, { borderColor: `${item.color}40`, backgroundColor: `${item.color}15` }]}>
                          <Text style={[styles.presetPrefixBadge, { color: item.color }]}>
                            {item.prefix}
                          </Text>
                        </View>
                      </View>
                      <Text style={[styles.presetShopName, isCurrent && { color: '#FFFFFF' }]}>
                        {item.shopName}
                      </Text>
                      <Text style={styles.presetDesc}>{item.desc}</Text>
                    </View>

                    {/* Active check pill or Inactive Radio */}
                    {isCurrent ? (
                      <View style={[styles.activeCheckCircle, { backgroundColor: item.color }]}>
                        <Check size={14} color="#FFFFFF" strokeWidth={2.8} />
                      </View>
                    ) : (
                      <View style={styles.inactiveRadioCircle} />
                    )}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 14,
    backgroundColor: Palette.dark.background,
    borderBottomWidth: 1,
    borderBottomColor: Palette.dark.surfaceBorder,
    alignItems: 'center',
    width: '100%',
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    maxWidth: 680,
    width: '100%',
  },
  logoBadge: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: Palette.dark.surfaceElevated,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
    borderWidth: 1.5,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.35,
    shadowRadius: 6,
    elevation: 4,
  },
  titleColumn: {
    flex: 1,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  shopName: {
    fontSize: 16,
    fontWeight: '800',
    color: Palette.dark.textPrimary,
    letterSpacing: 0.3,
  },
  chevronPill: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: Palette.dark.surfaceElevated,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 6,
    borderWidth: 1,
    borderColor: Palette.dark.surfaceBorder,
  },
  tagline: {
    fontSize: 11,
    color: Palette.dark.textSecondary,
    marginTop: 2,
    fontWeight: '500',
  },
  rightActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    borderWidth: 1,
  },
  statusOpen: {
    backgroundColor: Palette.servingBg,
    borderColor: Palette.servingBorder,
  },
  statusClosed: {
    backgroundColor: Palette.cancelledBg,
    borderColor: Palette.cancelledBorder,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 6,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  bellButton: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: Palette.dark.surfaceElevated,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Palette.dark.surfaceBorderHighlight,
    position: 'relative',
  },
  badge: {
    position: 'absolute',
    top: -3,
    right: -3,
    backgroundColor: Palette.nearTurn,
    minWidth: 17,
    height: 17,
    borderRadius: 8.5,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
    borderWidth: 1.5,
    borderColor: Palette.dark.background,
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '900',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(3, 7, 18, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 18,
  },
  modalContent: {
    backgroundColor: '#0F1A30',
    borderRadius: 24,
    width: '100%',
    maxWidth: 440,
    maxHeight: '90%',
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    padding: 20,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.6,
    shadowRadius: 24,
    elevation: 10,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 18,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.08)',
  },
  modalPreHeader: {
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
  modalPreHeaderText: {
    fontSize: 9,
    fontWeight: '900',
    color: Palette.primaryBright,
    letterSpacing: 1.2,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: 0.3,
  },
  modalSub: {
    fontSize: 12,
    color: Palette.dark.textSecondary,
    marginTop: 3,
    lineHeight: 16,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  presetsList: {
    gap: 12,
  },
  presetCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#14223E',
    borderRadius: 18,
    padding: 14,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  presetCardActive: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  presetIconBox: {
    width: 48,
    height: 48,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    borderWidth: 1,
  },
  presetTextBox: {
    flex: 1,
  },
  presetCardTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 2,
  },
  presetCategoryName: {
    fontSize: 14,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.2,
  },
  prefixPill: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
  },
  presetPrefixBadge: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.4,
  },
  presetShopName: {
    fontSize: 12,
    fontWeight: '600',
    color: Palette.primaryBright,
    marginTop: 1,
  },
  presetDesc: {
    fontSize: 11,
    color: Palette.dark.textSecondary,
    marginTop: 3,
    lineHeight: 15,
  },
  activeCheckCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  inactiveRadioCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.16)',
    marginLeft: 10,
  },
});
