import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  LayoutDashboard,
  PlusCircle,
  Ticket,
  Tv,
  Settings,
} from 'lucide-react-native';
import { Palette } from '../constants/theme';
import { useQueue } from '../context/QueueContext';
import { OwnerDashboardScreen } from '../screens/OwnerDashboardScreen';
import { GenerateTokenScreen } from '../screens/GenerateTokenScreen';
import { MyTokenScreen } from '../screens/MyTokenScreen';
import { WaitingRoomTVScreen } from '../screens/WaitingRoomTVScreen';
import { ShopSettingsScreen } from '../screens/ShopSettingsScreen';

type TabKey = 'dashboard' | 'new_token' | 'my_token' | 'tv_display' | 'settings';

interface TabItem {
  key: TabKey;
  label: string;
  Icon: React.ComponentType<{ size?: number; color?: string; strokeWidth?: number }>;
}

const TABS: TabItem[] = [
  {
    key: 'dashboard',
    label: 'Dashboard',
    Icon: LayoutDashboard,
  },
  {
    key: 'new_token',
    label: 'New Token',
    Icon: PlusCircle,
  },
  {
    key: 'my_token',
    label: 'My Token',
    Icon: Ticket,
  },
  {
    key: 'tv_display',
    label: 'Waiting TV',
    Icon: Tv,
  },
  {
    key: 'settings',
    label: 'Settings',
    Icon: Settings,
  },
];

export const RootNavigator: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabKey>('dashboard');
  const { waitingTokens, currentCustomerToken } = useQueue();

  const renderActiveScreen = () => {
    switch (activeTab) {
      case 'dashboard':
        return (
          <OwnerDashboardScreen
            onOpenSettings={() => setActiveTab('settings')}
            onNavigateToKiosk={() => setActiveTab('new_token')}
          />
        );
      case 'new_token':
        return (
          <GenerateTokenScreen
            onNavigateToMyToken={() => setActiveTab('my_token')}
          />
        );
      case 'my_token':
        return (
          <MyTokenScreen
            onNavigateToIssueToken={() => setActiveTab('new_token')}
          />
        );
      case 'tv_display':
        return <WaitingRoomTVScreen />;
      case 'settings':
        return <ShopSettingsScreen />;
    }
  };

  return (
    <SafeAreaView style={styles.safeContainer} edges={['top', 'left', 'right']}>
      {/* Active Screen View */}
      <View style={styles.contentContainer}>{renderActiveScreen()}</View>

      {/* Bottom Navigation Bar */}
      <View style={styles.tabBarWrapper}>
        <View style={styles.tabBar}>
          {TABS.map((tab) => {
            const isActive = activeTab === tab.key;
            const showWaitingBadge = tab.key === 'dashboard' && waitingTokens.length > 0;
            const showMyTokenDot = tab.key === 'my_token' && Boolean(currentCustomerToken);

            return (
              <TouchableOpacity
                key={tab.key}
                style={styles.tabButton}
                onPress={() => setActiveTab(tab.key)}
                activeOpacity={0.7}
              >
                <View
                  style={[
                    styles.iconBadge,
                    isActive && {
                      backgroundColor: 'rgba(56, 189, 248, 0.15)',
                      borderColor: 'rgba(56, 189, 248, 0.3)',
                      borderWidth: 1,
                    },
                  ]}
                >
                  <tab.Icon
                    size={20}
                    color={isActive ? Palette.primaryBright : Palette.dark.textMuted}
                    strokeWidth={isActive ? 2.4 : 1.8}
                  />

                  {showWaitingBadge && (
                    <View style={styles.tabBadge}>
                      <Text style={styles.tabBadgeText}>
                        {waitingTokens.length > 9 ? '9+' : waitingTokens.length}
                      </Text>
                    </View>
                  )}

                  {showMyTokenDot && (
                    <View style={styles.greenDot} />
                  )}
                </View>

                <Text
                  style={[
                    styles.tabLabel,
                    { color: isActive ? Palette.primaryBright : Palette.dark.textMuted },
                  ]}
                >
                  {tab.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeContainer: {
    flex: 1,
    backgroundColor: Palette.dark.background,
  },
  contentContainer: {
    flex: 1,
  },
  tabBarWrapper: {
    backgroundColor: '#060A14',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.08)',
    alignItems: 'center',
    width: '100%',
  },
  tabBar: {
    flexDirection: 'row',
    maxWidth: 680,
    width: '100%',
    paddingVertical: 8,
    paddingBottom: Platform.OS === 'ios' ? 20 : 10,
    alignItems: 'center',
    justifyContent: 'space-around',
  },
  tabButton: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
  },
  iconBadge: {
    width: 44,
    height: 32,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  tabBadge: {
    position: 'absolute',
    top: -2,
    right: 0,
    backgroundColor: Palette.waiting,
    borderRadius: 7,
    minWidth: 14,
    height: 14,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 2,
  },
  tabBadgeText: {
    color: '#000000',
    fontSize: 8,
    fontWeight: '900',
  },
  greenDot: {
    position: 'absolute',
    top: 2,
    right: 2,
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: Palette.serving,
    borderWidth: 1,
    borderColor: Palette.dark.surface,
  },
  tabLabel: {
    fontSize: 10,
    fontWeight: '700',
    marginTop: 2,
  },
});
