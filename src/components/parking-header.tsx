import { router, usePathname } from 'expo-router';
import React, { useState } from 'react';
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { MoreSectionType, useParking } from '@/context/parking-context';

interface DrawerMenuItem {
  label: string;
  iconText: string;
  route: '/' | '/check-in' | '/check-out' | '/slots' | '/explore';
  moreSection?: MoreSectionType;
}

const SIDEBAR_ITEMS: DrawerMenuItem[] = [
  { label: 'Dashboard', iconText: '📊', route: '/' },
  { label: 'Check-In', iconText: '📥', route: '/check-in' },
  { label: 'Check-Out', iconText: '📤', route: '/check-out' },
  { label: 'Parking Slots', iconText: '🅿️', route: '/slots' },
  { label: 'Bookings', iconText: '📅', route: '/explore', moreSection: 'bookings' },
  { label: 'Revenue', iconText: '💲', route: '/explore', moreSection: 'revenue' },
  { label: 'Analytics', iconText: '📈', route: '/explore', moreSection: 'analytics' },
  { label: 'Users', iconText: '👥', route: '/explore', moreSection: 'users' },
  { label: 'Exceptions', iconText: '⚠️', route: '/explore', moreSection: 'exceptions' },
  { label: 'Settings', iconText: '⚙️', route: '/explore', moreSection: 'settings' },
];

export function ParkingHeader() {
  const insets = useSafeAreaInsets();
  const pathname = usePathname();
  const {
    isDrawerOpen,
    setIsDrawerOpen,
    activeMoreSection,
    setActiveMoreSection,
    searchQuery,
    setSearchQuery,
    exceptions,
    sessions,
    bookings,
    resolveException,
    mqttConnected,
    reconnectMqtt,
  } = useParking();

  const [showSearchBar, setShowSearchBar] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showAccountMenu, setShowAccountMenu] = useState(false);
  const [supportToast, setSupportToast] = useState(false);

  const getHeaderTitle = () => {
    if (pathname === '/check-in') return 'Vehicle Check-In';
    if (pathname === '/check-out') return 'Vehicle Check-Out';
    if (pathname === '/slots') return 'Parking Slots';
    if (pathname === '/explore') {
      const found = SIDEBAR_ITEMS.find((i) => i.moreSection === activeMoreSection);
      return found ? found.label : 'Management Hub';
    }
    return 'Dashboard';
  };

  const handleNavigate = (item: DrawerMenuItem) => {
    if (item.moreSection) {
      setActiveMoreSection(item.moreSection);
    }
    setIsDrawerOpen(false);
    router.navigate(item.route as never);
  };

  const isMenuItemActive = (item: DrawerMenuItem) => {
    if (item.route === '/explore') {
      return pathname === '/explore' && activeMoreSection === item.moreSection;
    }
    return pathname === item.route;
  };

  const filteredSessions = searchQuery.trim()
    ? sessions.filter(
        (s) =>
          s.vehicle.toLowerCase().includes(searchQuery.toLowerCase()) ||
          s.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
          s.slot.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : [];

  const filteredBookings = searchQuery.trim()
    ? bookings.filter(
        (b) =>
          b.customer.toLowerCase().includes(searchQuery.toLowerCase()) ||
          b.vehicle.toLowerCase().includes(searchQuery.toLowerCase()) ||
          b.id.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : [];

  return (
    <>
      <View style={[styles.headerContainer, { paddingTop: Math.max(insets.top, 10) }]}>
        <View style={styles.topRow}>
          {/* Left: Hamburger + Brand & Page Title */}
          <View style={styles.leftRow}>
            <Pressable
              onPress={() => setIsDrawerOpen(true)}
              style={({ pressed }) => [styles.menuButton, pressed && styles.pressed]}>
              <View style={styles.hamburgerBar} />
              <View style={[styles.hamburgerBar, { width: 14 }]} />
              <View style={styles.hamburgerBar} />
            </Pressable>

            <View style={styles.brandBadge}>
              <Text style={styles.brandP}>P</Text>
            </View>

            <View>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <Text style={styles.brandSub}>ParkingPro</Text>
                <Pressable
                  onPress={() => reconnectMqtt()}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 3,
                    backgroundColor: mqttConnected ? '#dcfce7' : '#fee2e2',
                    paddingHorizontal: 6,
                    paddingVertical: 1,
                    borderRadius: 4,
                  }}>
                  <View
                    style={{
                      width: 6,
                      height: 6,
                      borderRadius: 3,
                      backgroundColor: mqttConnected ? '#16a34a' : '#ef4444',
                    }}
                  />
                  <Text
                    style={{
                      fontSize: 9,
                      fontWeight: '700',
                      color: mqttConnected ? '#15803d' : '#b91c1c',
                    }}>
                    {mqttConnected ? 'HiveMQ' : 'MQTT Off'}
                  </Text>
                </Pressable>
              </View>
              <Text style={styles.pageTitle} numberOfLines={1}>
                {getHeaderTitle()}
              </Text>
            </View>
          </View>

          {/* Right: Search, Bell w/ Badge, Profile */}
          <View style={styles.rightRow}>
            <Pressable
              onPress={() => setShowSearchBar((prev) => !prev)}
              style={[
                styles.iconBtn,
                showSearchBar && { backgroundColor: '#dbeafe' },
              ]}>
              <Text style={styles.iconText}>🔍</Text>
            </Pressable>

            <Pressable
              onPress={() => setShowNotifications(true)}
              style={styles.iconBtn}>
              <Text style={styles.iconText}>🔔</Text>
              {exceptions.length > 0 && (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>{exceptions.length}</Text>
                </View>
              )}
            </Pressable>

            <Pressable
              onPress={() => setShowAccountMenu(true)}
              style={styles.profileBtn}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>JA</Text>
              </View>
            </Pressable>
          </View>
        </View>

        {/* Expandable Search Input ("Search vehicles, bookings...") */}
        {showSearchBar && (
          <View style={styles.searchWrap}>
            <View style={styles.searchInputRow}>
              <Text style={styles.searchInlineIcon}>🔍</Text>
              <TextInput
                value={searchQuery}
                onChangeText={setSearchQuery}
                placeholder="Search vehicles, bookings..."
                placeholderTextColor="#9ca3af"
                style={styles.searchInput}
              />
              {searchQuery.length > 0 && (
                <Pressable onPress={() => setSearchQuery('')}>
                  <Text style={styles.clearBtnText}>✕</Text>
                </Pressable>
              )}
            </View>

            {searchQuery.trim().length > 0 && (
              <View style={styles.searchResultsBox}>
                <Text style={styles.searchResultHeading}>
                  Results ({filteredSessions.length + filteredBookings.length})
                </Text>
                {filteredSessions.map((s) => (
                  <Pressable
                    key={s.id}
                    onPress={() => {
                      setShowSearchBar(false);
                      router.navigate('/check-out' as never);
                    }}
                    style={styles.searchResultItem}>
                    <Text style={styles.searchResultPrimary}>
                      🚗 {s.vehicle} ({s.id})
                    </Text>
                    <Text style={styles.searchResultSecondary}>
                      Slot {s.slot} • {s.status}
                    </Text>
                  </Pressable>
                ))}
                {filteredBookings.map((b) => (
                  <Pressable
                    key={b.id}
                    onPress={() => {
                      setShowSearchBar(false);
                      setActiveMoreSection('bookings');
                      router.navigate('/explore' as never);
                    }}
                    style={styles.searchResultItem}>
                    <Text style={styles.searchResultPrimary}>
                      📅 {b.customer} — {b.vehicle}
                    </Text>
                    <Text style={styles.searchResultSecondary}>
                      {b.id} • Slot {b.slot} • {b.status}
                    </Text>
                  </Pressable>
                ))}
                {filteredSessions.length === 0 && filteredBookings.length === 0 && (
                  <Text style={styles.noResultText}>No matching vehicles or bookings</Text>
                )}
              </View>
            )}
          </View>
        )}
      </View>

      {/* ParkingPro Dark Sidebar Drawer Modal (Matches Figma `mq` Sidebar) */}
      <Modal
        visible={isDrawerOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setIsDrawerOpen(false)}>
        <View style={styles.drawerOverlay}>
          <View
            style={[
              styles.drawerPanel,
              { paddingTop: Math.max(insets.top + 8, 24), paddingBottom: Math.max(insets.bottom + 12, 20) },
            ]}>
            {/* Sidebar Header */}
            <View style={styles.drawerHeader}>
              <View style={styles.drawerBrandRow}>
                <View style={styles.drawerLogoBox}>
                  <Text style={styles.drawerLogoText}>🅿️</Text>
                </View>
                <View>
                  <Text style={styles.drawerBrandTitle}>ParkingPro</Text>
                  <Text style={styles.drawerBrandSubtitle}>Management System</Text>
                </View>
              </View>
              <Pressable
                onPress={() => setIsDrawerOpen(false)}
                style={styles.drawerCloseBtn}>
                <Text style={styles.drawerCloseText}>✕</Text>
              </Pressable>
            </View>

            {/* Navigation Items */}
            <ScrollView
              style={styles.drawerNavScroll}
              showsVerticalScrollIndicator={false}>
              {SIDEBAR_ITEMS.map((item) => {
                const active = isMenuItemActive(item);
                return (
                  <Pressable
                    key={item.label}
                    onPress={() => handleNavigate(item)}
                    style={[
                      styles.drawerNavItem,
                      active && styles.drawerNavItemActive,
                    ]}>
                    <Text style={styles.drawerNavIcon}>{item.iconText}</Text>
                    <Text
                      style={[
                        styles.drawerNavLabel,
                        active && styles.drawerNavLabelActive,
                      ]}>
                      {item.label}
                    </Text>
                    {item.label === 'Exceptions' && exceptions.length > 0 && (
                      <View style={styles.drawerExceptionPill}>
                        <Text style={styles.drawerExceptionText}>
                          {exceptions.length}
                        </Text>
                      </View>
                    )}
                  </Pressable>
                );
              })}
            </ScrollView>

            {/* Need Help Footer Card */}
            <View style={styles.drawerFooter}>
              <View style={styles.helpCard}>
                <Text style={styles.helpTitle}>Need Help?</Text>
                <Text style={styles.helpSubtitle}>Contact support team</Text>
                <Pressable
                  onPress={() => {
                    setSupportToast(true);
                    setTimeout(() => setSupportToast(false), 2500);
                  }}
                  style={styles.supportButton}>
                  <Text style={styles.supportButtonText}>
                    {supportToast ? '✓ Support Notified!' : 'Get Support'}
                  </Text>
                </Pressable>
              </View>
            </View>
          </View>

          <Pressable
            style={styles.drawerBackdropHit}
            onPress={() => setIsDrawerOpen(false)}
          />
        </View>
      </Modal>

      {/* Notifications Modal (Exception alerts) */}
      <Modal
        visible={showNotifications}
        transparent
        animationType="slide"
        onRequestClose={() => setShowNotifications(false)}>
        <View style={styles.sheetOverlay}>
          <View style={styles.sheetCard}>
            <View style={styles.sheetHeader}>
              <Text style={styles.sheetTitle}>
                Notifications ({exceptions.length} Active)
              </Text>
              <Pressable onPress={() => setShowNotifications(false)}>
                <Text style={styles.sheetClose}>Close</Text>
              </Pressable>
            </View>

            {exceptions.length === 0 ? (
              <View style={styles.emptyNotif}>
                <Text style={styles.emptyNotifText}>
                  All exception alerts have been resolved!
                </Text>
              </View>
            ) : (
              exceptions.map((ex) => (
                <View key={ex.id} style={styles.notifItem}>
                  <View style={styles.notifLeft}>
                    <View style={styles.notifTopRow}>
                      <Text style={styles.notifId}>{ex.id}</Text>
                      <View
                        style={[
                          styles.severityTag,
                          ex.severity === 'High'
                            ? { backgroundColor: '#fee2e2' }
                            : ex.severity === 'Medium'
                              ? { backgroundColor: '#ffedd5' }
                              : { backgroundColor: '#fef9c3' },
                        ]}>
                        <Text
                          style={[
                            styles.severityTagText,
                            ex.severity === 'High'
                              ? { color: '#b91c1c' }
                              : ex.severity === 'Medium'
                                ? { color: '#c2410c' }
                                : { color: '#a16207' },
                          ]}>
                          {ex.severity}
                        </Text>
                      </View>
                    </View>
                    <Text style={styles.notifType}>{ex.type}</Text>
                    <Text style={styles.notifMeta}>
                      Vehicle {ex.vehicle} • Slot {ex.slot} • {ex.time}
                    </Text>
                  </View>
                  <Pressable
                    onPress={() => resolveException(ex.id)}
                    style={styles.resolveMiniBtn}>
                    <Text style={styles.resolveMiniBtnText}>Resolve</Text>
                  </Pressable>
                </View>
              ))
            )}
          </View>
        </View>
      </Modal>

      {/* My Account Modal (John Admin / Administrator) */}
      <Modal
        visible={showAccountMenu}
        transparent
        animationType="fade"
        onRequestClose={() => setShowAccountMenu(false)}>
        <Pressable
          style={styles.sheetOverlay}
          onPress={() => setShowAccountMenu(false)}>
          <View style={styles.accountCard}>
            <View style={styles.accountUserRow}>
              <View style={styles.accountBigAvatar}>
                <Text style={styles.accountBigAvatarText}>JA</Text>
              </View>
              <View>
                <Text style={styles.accountName}>John Admin</Text>
                <Text style={styles.accountRole}>Administrator</Text>
                <Text style={styles.accountEmail}>john.admin@parkingpro.io</Text>
              </View>
            </View>

            <View style={styles.accountDivider} />
            <Text style={styles.accountSectionLabel}>My Account</Text>

            <Pressable
              onPress={() => {
                setShowAccountMenu(false);
                setActiveMoreSection('users');
                router.navigate('/explore' as never);
              }}
              style={styles.accountMenuItem}>
              <Text style={styles.accountMenuItemText}>👤 Profile</Text>
            </Pressable>

            <Pressable
              onPress={() => {
                setShowAccountMenu(false);
                setActiveMoreSection('settings');
                router.navigate('/explore' as never);
              }}
              style={styles.accountMenuItem}>
              <Text style={styles.accountMenuItemText}>⚙️ Settings</Text>
            </Pressable>

            <View style={styles.accountDivider} />

            <Pressable
              onPress={() => setShowAccountMenu(false)}
              style={styles.accountMenuItem}>
              <Text style={[styles.accountMenuItemText, { color: '#dc2626' }]}>
                🚪 Logout
              </Text>
            </Pressable>
          </View>
        </Pressable>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  headerContainer: {
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
    paddingHorizontal: 14,
    paddingBottom: 10,
    zIndex: 20,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  leftRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  menuButton: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: '#f3f4f6',
    alignItems: 'flex-start',
    justifyContent: 'center',
    paddingHorizontal: 10,
    gap: 4,
  },
  hamburgerBar: {
    width: 18,
    height: 2,
    backgroundColor: '#1f2937',
    borderRadius: 2,
  },
  brandBadge: {
    width: 34,
    height: 34,
    borderRadius: 9,
    backgroundColor: '#2563eb',
    alignItems: 'center',
    justifyContent: 'center',
  },
  brandP: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '800',
  },
  brandSub: {
    fontSize: 11,
    color: '#6b7280',
    fontWeight: '600',
  },
  pageTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
  },
  rightRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  iconBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#f3f4f6',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  iconText: {
    fontSize: 16,
  },
  badge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: '#ef4444',
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  badgeText: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: '800',
  },
  profileBtn: {
    marginLeft: 2,
  },
  avatar: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#2563eb',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: '#ffffff',
    fontWeight: '700',
    fontSize: 12,
  },
  pressed: {
    opacity: 0.75,
  },
  searchWrap: {
    marginTop: 10,
  },
  searchInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f9fafb',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 10,
    paddingHorizontal: 10,
    height: 40,
    gap: 8,
  },
  searchInlineIcon: {
    fontSize: 14,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: '#111827',
    paddingVertical: 4,
  },
  clearBtnText: {
    fontSize: 14,
    color: '#6b7280',
    paddingHorizontal: 4,
  },
  searchResultsBox: {
    marginTop: 6,
    backgroundColor: '#ffffff',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    padding: 10,
    gap: 6,
  },
  searchResultHeading: {
    fontSize: 11,
    fontWeight: '700',
    color: '#6b7280',
    textTransform: 'uppercase',
  },
  searchResultItem: {
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  searchResultPrimary: {
    fontSize: 13,
    fontWeight: '600',
    color: '#111827',
  },
  searchResultSecondary: {
    fontSize: 11,
    color: '#6b7280',
  },
  noResultText: {
    fontSize: 12,
    color: '#6b7280',
    paddingVertical: 4,
  },
  drawerOverlay: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: 'rgba(15, 23, 42, 0.55)',
  },
  drawerPanel: {
    width: 280,
    backgroundColor: '#0f172a',
    justifyContent: 'space-between',
  },
  drawerBackdropHit: {
    flex: 1,
  },
  drawerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 18,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#1e293b',
  },
  drawerBrandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  drawerLogoBox: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: '#2563eb',
    alignItems: 'center',
    justifyContent: 'center',
  },
  drawerLogoText: {
    fontSize: 20,
  },
  drawerBrandTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#ffffff',
  },
  drawerBrandSubtitle: {
    fontSize: 12,
    color: '#94a3b8',
  },
  drawerCloseBtn: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#1e293b',
    alignItems: 'center',
    justifyContent: 'center',
  },
  drawerCloseText: {
    color: '#cbd5e1',
    fontSize: 13,
    fontWeight: '700',
  },
  drawerNavScroll: {
    flex: 1,
    padding: 12,
  },
  drawerNavItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 11,
    paddingHorizontal: 14,
    borderRadius: 10,
    marginBottom: 4,
  },
  drawerNavItemActive: {
    backgroundColor: '#2563eb',
  },
  drawerNavIcon: {
    fontSize: 16,
  },
  drawerNavLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#cbd5e1',
    flex: 1,
  },
  drawerNavLabelActive: {
    color: '#ffffff',
    fontWeight: '700',
  },
  drawerExceptionPill: {
    backgroundColor: '#ef4444',
    borderRadius: 999,
    paddingHorizontal: 7,
    paddingVertical: 2,
  },
  drawerExceptionText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '700',
  },
  drawerFooter: {
    paddingHorizontal: 14,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#1e293b',
  },
  helpCard: {
    backgroundColor: '#1e293b',
    borderRadius: 12,
    padding: 14,
  },
  helpTitle: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 2,
  },
  helpSubtitle: {
    color: '#94a3b8',
    fontSize: 12,
    marginBottom: 10,
  },
  supportButton: {
    backgroundColor: '#2563eb',
    borderRadius: 8,
    paddingVertical: 9,
    alignItems: 'center',
  },
  supportButtonText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '700',
  },
  sheetOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  sheetCard: {
    width: '100%',
    maxWidth: 440,
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 18,
    gap: 12,
  },
  sheetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  sheetTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#111827',
  },
  sheetClose: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2563eb',
  },
  emptyNotif: {
    paddingVertical: 24,
    alignItems: 'center',
  },
  emptyNotifText: {
    color: '#6b7280',
    fontSize: 14,
  },
  notifItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#f9fafb',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    gap: 8,
  },
  notifLeft: {
    flex: 1,
    gap: 2,
  },
  notifTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  notifId: {
    fontSize: 12,
    fontWeight: '700',
    color: '#374151',
  },
  severityTag: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 999,
  },
  severityTagText: {
    fontSize: 10,
    fontWeight: '700',
  },
  notifType: {
    fontSize: 14,
    fontWeight: '700',
    color: '#111827',
  },
  notifMeta: {
    fontSize: 12,
    color: '#6b7280',
  },
  resolveMiniBtn: {
    backgroundColor: '#dcfce7',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  resolveMiniBtnText: {
    color: '#15803d',
    fontSize: 12,
    fontWeight: '700',
  },
  accountCard: {
    width: '100%',
    maxWidth: 340,
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 18,
  },
  accountUserRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  accountBigAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#2563eb',
    alignItems: 'center',
    justifyContent: 'center',
  },
  accountBigAvatarText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '800',
  },
  accountName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
  },
  accountRole: {
    fontSize: 13,
    color: '#6b7280',
  },
  accountEmail: {
    fontSize: 11,
    color: '#9ca3af',
  },
  accountDivider: {
    height: 1,
    backgroundColor: '#e5e7eb',
    marginVertical: 12,
  },
  accountSectionLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#6b7280',
    textTransform: 'uppercase',
    marginBottom: 6,
  },
  accountMenuItem: {
    paddingVertical: 10,
    paddingHorizontal: 6,
    borderRadius: 8,
  },
  accountMenuItemText: {
    fontSize: 15,
    fontWeight: '500',
    color: '#111827',
  },
});
