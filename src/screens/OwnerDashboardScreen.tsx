import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  RefreshControl,
} from 'react-native';
import {
  Megaphone,
  ArrowRight,
  PlusCircle,
  Search,
  XCircle,
  Ticket,
  Plus,
} from 'lucide-react-native';
import { Palette } from '../constants/theme';
import { useQueue } from '../context/QueueContext';
import { TokenItem } from '../types/queue';
import { Header } from '../components/Header';
import { QuickStatsBar } from '../components/QuickStatsBar';
import { NowServingBanner } from '../components/NowServingBanner';
import { TokenCard } from '../components/TokenCard';
import { AddTokenModal } from '../components/AddTokenModal';
import { DigitalPassModal } from '../components/DigitalPassModal';
import { NotificationModal } from '../components/NotificationModal';
import { NearTurnBanner } from '../components/NearTurnBanner';

type FilterTab = 'all' | 'waiting' | 'serving' | 'completed';

export const OwnerDashboardScreen: React.FC<{
  onOpenSettings: () => void;
  onNavigateToKiosk: () => void;
}> = ({ onOpenSettings, onNavigateToKiosk }) => {
  const {
    profile,
    services,
    counters,
    tokens,
    activeTokens,
    servingTokens,
    waitingTokens,
    completedTokens,
    notifications,
    stats,
    isLoading,
    activeCustomerAlert,
    generateToken,
    callNextCustomer,
    startServingToken,
    completeToken,
    markNoShowOrCancel,
    alertCustomerNearTurn,
    bumpToken,
    dismissCustomerAlert,
    sendManualCustomerNotification,
    refreshQueue,
  } = useQueue();

  const [activeTab, setActiveTab] = useState<FilterTab>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedPassToken, setSelectedPassToken] = useState<TokenItem | null>(null);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isCallingNext, setIsCallingNext] = useState(false);

  // Filter list
  const getFilteredTokens = () => {
    let list: TokenItem[] = [];
    switch (activeTab) {
      case 'waiting':
        list = waitingTokens;
        break;
      case 'serving':
        list = servingTokens;
        break;
      case 'completed':
        list = completedTokens;
        break;
      case 'all':
      default:
        list = [...servingTokens, ...waitingTokens];
        break;
    }

    if (!searchQuery.trim()) return list;

    const query = searchQuery.trim().toLowerCase();
    return list.filter(
      (t) =>
        t.tokenNumber.toLowerCase().includes(query) ||
        t.customerName.toLowerCase().includes(query) ||
        t.customerPhone.toLowerCase().includes(query) ||
        t.serviceName.toLowerCase().includes(query)
    );
  };

  const handleCallNext = async (counterId?: string) => {
    try {
      setIsCallingNext(true);
      const called = await callNextCustomer(counterId);
      if (called) {
        setSelectedPassToken(called);
      }
    } finally {
      setIsCallingNext(false);
    }
  };

  const filteredTokens = getFilteredTokens();

  return (
    <View style={styles.container}>
      {/* App Header */}
      <Header
        onOpenNotifications={() => setIsNotificationsOpen(true)}
        onOpenBusinessPicker={onOpenSettings}
      />

      {/* Near Turn / Now Serving Live Banner */}
      <NearTurnBanner
        alert={activeCustomerAlert}
        onDismiss={dismissCustomerAlert}
        onViewPass={(tkn) => setSelectedPassToken(tkn)}
      />

      <FlatList
        data={filteredTokens}
        keyExtractor={(item) => item.id}
        refreshControl={
          <RefreshControl
            refreshing={isLoading}
            onRefresh={refreshQueue}
            tintColor={Palette.primary}
          />
        }
        ListHeaderComponent={
          <View>
            {/* Quick Stats Bar */}
            <QuickStatsBar stats={stats} />

            {/* Quick Action Hero Bar */}
            <View style={styles.heroActionRow}>
              {/* Call Next Button */}
              <TouchableOpacity
                style={[
                  styles.callNextHeroBtn,
                  waitingTokens.length === 0 && styles.callNextDisabled,
                ]}
                onPress={() => handleCallNext()}
                disabled={waitingTokens.length === 0 || isCallingNext}
                activeOpacity={0.82}
              >
                <View style={styles.callNextIconWrap}>
                  <Megaphone size={18} color="#FFFFFF" strokeWidth={2.2} />
                </View>
                <View style={{ marginLeft: 10, flex: 1 }}>
                  <Text style={styles.callNextHeroTitle}>
                    {isCallingNext ? 'Calling Customer...' : 'Call Next Customer'}
                  </Text>
                  <Text style={styles.callNextHeroSub} numberOfLines={1}>
                    {waitingTokens.length > 0
                      ? `${waitingTokens[0].tokenNumber} (${waitingTokens[0].customerName}) is next`
                      : 'All waiting customers served'}
                  </Text>
                </View>
                <ArrowRight size={16} color="rgba(255, 255, 255, 0.7)" strokeWidth={2.5} />
              </TouchableOpacity>

              {/* Issue Walk-in Token Button */}
              <TouchableOpacity
                style={styles.addWalkInBtn}
                onPress={() => setIsAddModalOpen(true)}
                activeOpacity={0.82}
              >
                <PlusCircle size={20} color={Palette.primaryBright} strokeWidth={2.2} />
                <Text style={styles.addWalkInText}>New Ticket</Text>
              </TouchableOpacity>
            </View>

            {/* Now Serving Counters Carousel */}
            <NowServingBanner
              counters={counters}
              onCompleteToken={completeToken}
              onCallNextToCounter={(counterId) => handleCallNext(counterId)}
            />

            {/* Queue Management Section Header */}
            <View style={styles.queueHeader}>
              <View style={styles.queueTitleRow}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <View style={styles.gemDot} />
                  <Text style={styles.queueSectionTitle}>LIVE QUEUE LEDGER</Text>
                </View>
                <View style={styles.countBadge}>
                  <Text style={styles.queueCountBadge}>
                    {filteredTokens.length} {filteredTokens.length === 1 ? 'ticket' : 'tickets'}
                  </Text>
                </View>
              </View>

              {/* Search Bar */}
              <View style={styles.searchContainer}>
                <Search size={16} color={Palette.dark.textMuted} strokeWidth={2.2} />
                <TextInput
                  style={styles.searchInput}
                  placeholder="Search token #, customer, phone..."
                  placeholderTextColor={Palette.dark.textMuted}
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                />
                {searchQuery.length > 0 && (
                  <TouchableOpacity onPress={() => setSearchQuery('')}>
                    <XCircle size={16} color={Palette.dark.textMuted} strokeWidth={2} />
                  </TouchableOpacity>
                )}
              </View>

              {/* Filter Tabs */}
              <View style={styles.tabBar}>
                {(
                  [
                    { key: 'all', label: 'All Active', count: activeTokens.length },
                    { key: 'waiting', label: 'Waiting', count: waitingTokens.length },
                    { key: 'serving', label: 'In Service', count: servingTokens.length },
                    { key: 'completed', label: 'Done', count: completedTokens.length },
                  ] as const
                ).map((tab) => {
                  const isSelected = activeTab === tab.key;
                  return (
                    <TouchableOpacity
                      key={tab.key}
                      style={[styles.tabButton, isSelected && styles.tabButtonActive]}
                      onPress={() => setActiveTab(tab.key)}
                      activeOpacity={0.7}
                    >
                      <Text
                        style={[styles.tabLabel, isSelected && styles.tabLabelActive]}
                      >
                        {tab.label} ({tab.count})
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          </View>
        }
        renderItem={({ item }) => {
          const waitingIndex = waitingTokens.findIndex((t) => t.id === item.id);
          const queuePosition = waitingIndex >= 0 ? waitingIndex + 1 : undefined;

          return (
            <View style={styles.cardWrapper}>
              <TokenCard
                token={item}
                positionInQueue={queuePosition}
                onPressCard={() => setSelectedPassToken(item)}
                onAlertNearTurn={() => alertCustomerNearTurn(item.id)}
                onStartServing={() => {
                  const idleCounter = counters.find((c) => c.status === 'IDLE') || counters[0];
                  if (idleCounter) {
                    startServingToken(item.id, idleCounter.id);
                  }
                }}
                onComplete={() => completeToken(item.id)}
                onNoShow={() => markNoShowOrCancel(item.id, 'NO_SHOW')}
                onOpenNotifications={() => sendManualCustomerNotification(item.id, 'WHATSAPP')}
                onBump={(dir) => bumpToken(item.id, dir)}
              />
            </View>
          );
        }}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ticket size={48} color={Palette.dark.textMuted} strokeWidth={1.5} />
            <Text style={styles.emptyTitle}>
              {searchQuery ? 'No matching tickets found' : 'Queue is Clear'}
            </Text>
            <Text style={styles.emptySubtitle}>
              {searchQuery
                ? 'Try checking the token number or customer phone'
                : 'Tap "New Ticket" to issue a walk-in digital pass'}
            </Text>
            {!searchQuery && (
              <TouchableOpacity
                style={styles.emptyAddBtn}
                onPress={() => setIsAddModalOpen(true)}
                activeOpacity={0.82}
              >
                <Plus size={18} color="#FFFFFF" strokeWidth={2.5} />
                <Text style={styles.emptyAddBtnText}>Issue First Token</Text>
              </TouchableOpacity>
            )}
          </View>
        }
        contentContainerStyle={styles.listContent}
      />

      {/* Add Walk-in Token Modal */}
      <AddTokenModal
        visible={isAddModalOpen}
        services={services}
        waitingCount={waitingTokens.length}
        avgWaitMinutes={stats.avgWaitMinutes}
        onClose={() => setIsAddModalOpen(false)}
        onSubmit={generateToken}
        onTokenGenerated={(token) => setSelectedPassToken(token)}
      />

      {/* Digital Pass / Ticket Modal */}
      <DigitalPassModal
        visible={Boolean(selectedPassToken)}
        token={selectedPassToken}
        profile={profile}
        positionInQueue={
          selectedPassToken
            ? waitingTokens.findIndex((t) => t.id === selectedPassToken.id) + 1 || undefined
            : undefined
        }
        onClose={() => setSelectedPassToken(null)}
      />

      {/* Notification Logs Drawer */}
      <NotificationModal
        visible={isNotificationsOpen}
        notifications={notifications}
        onClose={() => setIsNotificationsOpen(false)}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Palette.dark.background,
  },
  listContent: {
    paddingBottom: 28,
    maxWidth: 680,
    width: '100%',
    alignSelf: 'center',
  },
  heroActionRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    gap: 10,
    marginBottom: 10,
  },
  callNextHeroBtn: {
    flex: 2,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0284C7',
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: 'rgba(56, 189, 248, 0.4)',
    shadowColor: '#0EA5E9',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 4,
  },
  callNextDisabled: {
    backgroundColor: '#111E38',
    borderColor: 'rgba(255, 255, 255, 0.08)',
    opacity: 0.6,
    elevation: 0,
    shadowOpacity: 0,
  },
  callNextIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  callNextHeroTitle: {
    fontSize: 14,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: 0.2,
  },
  callNextHeroSub: {
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.85)',
    marginTop: 1,
    fontWeight: '500',
  },
  addWalkInBtn: {
    flex: 1.1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#111E38',
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    paddingVertical: 12,
    paddingHorizontal: 10,
    borderRadius: 16,
    gap: 6,
  },
  addWalkInText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  queueHeader: {
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 10,
  },
  queueTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  gemDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Palette.primaryBright,
  },
  queueSectionTitle: {
    fontSize: 11,
    fontWeight: '900',
    color: Palette.dark.textSecondary,
    letterSpacing: 0.8,
  },
  countBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  queueCountBadge: {
    fontSize: 10,
    color: Palette.dark.textSecondary,
    fontWeight: '700',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0F1A30',
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    paddingHorizontal: 12,
    height: 42,
    marginBottom: 12,
  },
  searchInput: {
    flex: 1,
    color: '#FFFFFF',
    fontSize: 13,
    marginLeft: 8,
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: '#0B1324',
    borderRadius: 14,
    padding: 4,
    gap: 4,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
  },
  tabButton: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 10,
  },
  tabButtonActive: {
    backgroundColor: Palette.primary,
    shadowColor: Palette.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.35,
    shadowRadius: 4,
  },
  tabLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: Palette.dark.textMuted,
  },
  tabLabelActive: {
    color: '#FFFFFF',
    fontWeight: '800',
  },
  cardWrapper: {
    paddingHorizontal: 16,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 44,
    paddingHorizontal: 20,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#FFFFFF',
    marginTop: 12,
  },
  emptySubtitle: {
    fontSize: 12,
    color: Palette.dark.textMuted,
    textAlign: 'center',
    marginTop: 4,
    marginBottom: 18,
  },
  emptyAddBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Palette.primary,
    paddingVertical: 12,
    paddingHorizontal: 18,
    borderRadius: 12,
    gap: 6,
  },
  emptyAddBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
  },
});
