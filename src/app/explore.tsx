import React, { useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from 'react-native';

import {
  FloorComparisonChartCard,
  OccupancyRateChartCard,
  PeakHourChartCard,
  RevenueAnalyticsChartCard,
} from '@/components/parking-charts';
import {
  MoreSectionType,
  useParking,
  WEEKLY_REVENUE_DATA,
} from '@/context/parking-context';

const SECTIONS: { key: MoreSectionType; label: string; icon: string }[] = [
  { key: 'bookings', label: 'Bookings', icon: '📅' },
  { key: 'revenue', label: 'Revenue', icon: '💲' },
  { key: 'analytics', label: 'Analytics', icon: '📈' },
  { key: 'users', label: 'Users', icon: '👥' },
  { key: 'exceptions', label: 'Exceptions', icon: '⚠️' },
  { key: 'settings', label: 'Settings', icon: '⚙️' },
];

const STAFF_USERS = [
  {
    name: 'John Admin',
    role: 'Administrator',
    email: 'john.admin@parkingpro.io',
    shift: 'All Access',
    status: 'Online',
  },
  {
    name: 'Sarah Nguyen',
    role: 'Gate Supervisor',
    email: 'sarah.n@parkingpro.io',
    shift: 'Morning (06:00 - 14:00)',
    status: 'Online',
  },
  {
    name: 'David Tran',
    role: 'Cashier & Check-Out',
    email: 'david.t@parkingpro.io',
    shift: 'Afternoon (14:00 - 22:00)',
    status: 'Active',
  },
  {
    name: 'Alex Le',
    role: 'Security Patrol',
    email: 'alex.le@parkingpro.io',
    shift: 'Night (22:00 - 06:00)',
    status: 'Offline',
  },
];

export default function ManagementHubScreen() {
  const {
    activeMoreSection,
    setActiveMoreSection,
    bookings,
    toggleBookingStatus,
    addBooking,
    exceptions,
    resolveException,
    revenueToday,
    sessions,
    mqttConnected,
    mqttStatusText,
    lastMqttMessage,
    reconnectMqtt,
    publishMqtt,
  } = useParking();

  // MQTT Config State
  const [mqttHost, setMqttHost] = useState('172.20.10.2');
  const [mqttPort, setMqttPort] = useState('1883');
  const [testTopic, setTestTopic] = useState('smartparking/telemetry');
  const [testPayload, setTestPayload] = useState('{"temperature": 28.5, "sensor_status": "OK"}');
  const [publishFeedback, setPublishFeedback] = useState<string | null>(null);

  // Quick Add Booking Form
  const [customerName, setCustomerName] = useState('');
  const [vehicleModel, setVehicleModel] = useState('');
  const [bookingSlot, setBookingSlot] = useState('A-18');

  // Settings Toggles
  const [autoGateOpen, setAutoGateOpen] = useState(true);
  const [aiAllocationEnabled, setAiAllocationEnabled] = useState(true);
  const [overstayAlerts, setOverstayAlerts] = useState(true);
  const [hourlyRate, setHourlyRate] = useState('5.00');

  const handleAddBooking = () => {
    if (!customerName.trim() || !vehicleModel.trim()) return;
    addBooking({
      customer: customerName.trim(),
      vehicle: vehicleModel.trim(),
      slot: bookingSlot.trim().toUpperCase() || 'A-18',
      date: 'May 18, 2026',
      time: '10:00 AM - 1:00 PM',
      status: 'Confirmed',
    });
    setCustomerName('');
    setVehicleModel('');
  };

  return (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}>
      {/* Horizontal Section Tabs (Matches Figma Sidebar `pq` items) */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.tabsRow}>
        {SECTIONS.map((sec) => {
          const active = activeMoreSection === sec.key;
          return (
            <Pressable
              key={sec.key}
              onPress={() => setActiveMoreSection(sec.key)}
              style={[styles.sectionTab, active && styles.sectionTabActive]}>
              <Text style={styles.sectionTabIcon}>{sec.icon}</Text>
              <Text
                style={[
                  styles.sectionTabText,
                  active && styles.sectionTabTextActive,
                ]}>
                {sec.label}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>

      {/* 1. BOOKINGS SECTION */}
      {activeMoreSection === 'bookings' && (
        <View style={styles.sectionWrap}>
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Create Reservation</Text>
            <View style={styles.formRow}>
              <TextInput
                value={customerName}
                onChangeText={setCustomerName}
                placeholder="Customer Name"
                placeholderTextColor="#9ca3af"
                style={styles.input}
              />
              <TextInput
                value={vehicleModel}
                onChangeText={setVehicleModel}
                placeholder="Vehicle (e.g. Mazda CX-5)"
                placeholderTextColor="#9ca3af"
                style={styles.input}
              />
              <View style={styles.inlineAddRow}>
                <TextInput
                  value={bookingSlot}
                  onChangeText={setBookingSlot}
                  placeholder="Slot (A-18)"
                  placeholderTextColor="#9ca3af"
                  style={[styles.input, { flex: 1 }]}
                />
                <Pressable onPress={handleAddBooking} style={styles.primaryBtn}>
                  <Text style={styles.primaryBtnText}>＋ Add Booking</Text>
                </Pressable>
              </View>
            </View>
          </View>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>
              Active Bookings ({bookings.length})
            </Text>
            {bookings.map((bk) => {
              const confirmed = bk.status === 'Confirmed';
              return (
                <View key={bk.id} style={styles.itemCard}>
                  <View style={styles.itemTopRow}>
                    <View>
                      <Text style={styles.itemTitle}>
                        {bk.id} • {bk.customer}
                      </Text>
                      <Text style={styles.itemSub}>
                        {bk.vehicle} • Slot {bk.slot}
                      </Text>
                    </View>
                    <Pressable
                      onPress={() => toggleBookingStatus(bk.id)}
                      style={[
                        styles.badge,
                        {
                          backgroundColor: confirmed ? '#dbeafe' : '#fef9c3',
                        },
                      ]}>
                      <Text
                        style={[
                          styles.badgeText,
                          { color: confirmed ? '#1d4ed8' : '#a16207' },
                        ]}>
                        {bk.status}
                      </Text>
                    </Pressable>
                  </View>
                  <Text style={styles.itemMeta}>
                    📅 {bk.date} • 🕒 {bk.time}
                  </Text>
                </View>
              );
            })}
          </View>
        </View>
      )}

      {/* 2. REVENUE SECTION */}
      {activeMoreSection === 'revenue' && (
        <View style={styles.sectionWrap}>
          <View style={styles.revenueHero}>
            <Text style={styles.revenueHeroLabel}>Total Revenue Today</Text>
            <Text style={styles.revenueHeroVal}>
              ${revenueToday.toLocaleString()}
            </Text>
            <Text style={styles.revenueHeroTrend}>
              +15% vs yesterday • Weekly Total: $43,100
            </Text>
          </View>

          <RevenueAnalyticsChartCard />

          <View style={styles.card}>
            <Text style={styles.cardTitle}>Weekly Revenue Breakdown</Text>
            {WEEKLY_REVENUE_DATA.map((d) => (
              <View key={d.day} style={styles.revRow}>
                <Text style={styles.revDay}>{d.day}</Text>
                <Text style={styles.revTarget}>Target: ${d.target}</Text>
                <Text style={styles.revAmount}>
                  ${d.revenue.toLocaleString()}
                </Text>
              </View>
            ))}
          </View>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>Recent Transactions</Text>
            {sessions.map((s) => (
              <View key={s.id} style={styles.revRow}>
                <View>
                  <Text style={styles.itemTitle}>{s.vehicle}</Text>
                  <Text style={styles.itemMeta}>
                    {s.ticketNumber} • {s.duration}
                  </Text>
                </View>
                <Text style={styles.revAmount}>${s.fee.toFixed(2)}</Text>
              </View>
            ))}
          </View>
        </View>
      )}

      {/* 3. ANALYTICS SECTION */}
      {activeMoreSection === 'analytics' && (
        <View style={styles.sectionWrap}>
          <PeakHourChartCard />
          <OccupancyRateChartCard />
          <FloorComparisonChartCard />
        </View>
      )}

      {/* 4. USERS SECTION */}
      {activeMoreSection === 'users' && (
        <View style={styles.sectionWrap}>
          <View style={styles.card}>
            <Text style={styles.cardTitle}>System Operators & Staff</Text>
            {STAFF_USERS.map((u) => (
              <View key={u.email} style={styles.itemCard}>
                <View style={styles.itemTopRow}>
                  <View>
                    <Text style={styles.itemTitle}>{u.name}</Text>
                    <Text style={styles.itemSub}>{u.role}</Text>
                  </View>
                  <View
                    style={[
                      styles.badge,
                      {
                        backgroundColor:
                          u.status === 'Online' ? '#dcfce7' : '#f3f4f6',
                      },
                    ]}>
                    <Text
                      style={[
                        styles.badgeText,
                        {
                          color:
                            u.status === 'Online' ? '#15803d' : '#4b5563',
                        },
                      ]}>
                      {u.status}
                    </Text>
                  </View>
                </View>
                <Text style={styles.itemMeta}>
                  ✉️ {u.email} • 🕒 {u.shift}
                </Text>
              </View>
            ))}
          </View>
        </View>
      )}

      {/* 5. EXCEPTIONS SECTION */}
      {activeMoreSection === 'exceptions' && (
        <View style={styles.sectionWrap}>
          <View style={styles.card}>
            <Text style={styles.cardTitle}>
              Exception Cases ({exceptions.length} Active)
            </Text>
            {exceptions.length === 0 ? (
              <Text style={styles.itemMeta}>
                All exception alerts have been resolved!
              </Text>
            ) : (
              exceptions.map((ex) => (
                <View key={ex.id} style={styles.itemCard}>
                  <View style={styles.itemTopRow}>
                    <Text style={styles.itemTitle}>
                      {ex.id} • {ex.type}
                    </Text>
                    <Pressable
                      onPress={() => resolveException(ex.id)}
                      style={styles.resolveBtn}>
                      <Text style={styles.resolveBtnText}>✓ Mark Resolved</Text>
                    </Pressable>
                  </View>
                  <Text style={styles.itemMeta}>
                    Vehicle {ex.vehicle} • Slot {ex.slot} • {ex.time} ({ex.severity}{' '}
                    Severity)
                  </Text>
                </View>
              ))
            )}
          </View>
        </View>
      )}

      {/* 6. SETTINGS SECTION */}
      {activeMoreSection === 'settings' && (
        <View style={styles.sectionWrap}>
          <View style={styles.card}>
            <Text style={styles.cardTitle}>ParkingPro System Settings</Text>

            <View style={styles.settingRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.itemTitle}>Smart AI Slot Allocation</Text>
                <Text style={styles.itemMeta}>
                  Automatically assign optimal slots on vehicle check-in
                </Text>
              </View>
              <Switch
                value={aiAllocationEnabled}
                onValueChange={setAiAllocationEnabled}
              />
            </View>

            <View style={styles.settingRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.itemTitle}>Automatic Barrier Gate</Text>
                <Text style={styles.itemMeta}>
                  Open exit gate automatically after confirmed payment
                </Text>
              </View>
              <Switch value={autoGateOpen} onValueChange={setAutoGateOpen} />
            </View>

            <View style={styles.settingRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.itemTitle}>Overstay Exception Alerts</Text>
                <Text style={styles.itemMeta}>
                  Notify administrators when a session exceeds reserved window
                </Text>
              </View>
              <Switch
                value={overstayAlerts}
                onValueChange={setOverstayAlerts}
              />
            </View>

            <View style={styles.rateBox}>
              <Text style={styles.itemTitle}>Standard Hourly Rate ($/hr)</Text>
              <TextInput
                value={hourlyRate}
                onChangeText={setHourlyRate}
                keyboardType="decimal-pad"
                style={styles.input}
              />
            </View>
          </View>

          {/* MQTT & Firebase IoT Broker Card */}
          <View style={styles.card}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <View>
                <Text style={styles.cardTitle}>MQTT Broker (HiveMQ)</Text>
                <Text style={styles.itemMeta}>Protocol: MQTT TCP / WS • Data sync: Firebase</Text>
              </View>
              <View
                style={[
                  styles.badge,
                  { backgroundColor: mqttConnected ? '#dcfce7' : '#fee2e2' },
                ]}>
                <Text
                  style={[
                    styles.badgeText,
                    { color: mqttConnected ? '#15803d' : '#b91c1c' },
                  ]}>
                  {mqttConnected ? 'Connected' : 'Offline'}
                </Text>
              </View>
            </View>

            <View style={{ gap: 8, marginTop: 4 }}>
              <Text style={{ fontSize: 12, color: '#4b5563' }}>Status: {mqttStatusText}</Text>
              
              <View style={{ flexDirection: 'row', gap: 8 }}>
                <View style={{ flex: 2 }}>
                  <Text style={styles.itemMeta}>Host IP</Text>
                  <TextInput
                    value={mqttHost}
                    onChangeText={setMqttHost}
                    placeholder="172.20.10.2"
                    placeholderTextColor="#9ca3af"
                    style={styles.input}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.itemMeta}>Port</Text>
                  <TextInput
                    value={mqttPort}
                    onChangeText={setMqttPort}
                    placeholder="1883"
                    placeholderTextColor="#9ca3af"
                    keyboardType="numeric"
                    style={styles.input}
                  />
                </View>
              </View>

              <Pressable
                onPress={() => reconnectMqtt(mqttHost, parseInt(mqttPort, 10) || 1883)}
                style={[styles.primaryBtn, { paddingVertical: 10, marginTop: 4 }]}>
                <Text style={styles.primaryBtnText}>🔄 Reconnect HiveMQ</Text>
              </Pressable>

              {/* Subscribed Topics List */}
              <View style={{ backgroundColor: '#f9fafb', padding: 10, borderRadius: 8, gap: 4, marginTop: 4 }}>
                <Text style={{ fontSize: 12, fontWeight: '700', color: '#374151' }}>Subscribed Topics:</Text>
                <Text style={{ fontSize: 11, color: '#4b5563' }}>• smartparking/telemetry (Sync to Firebase)</Text>
                <Text style={{ fontSize: 11, color: '#4b5563' }}>• smartparking/status (Slot Live State)</Text>
                <Text style={{ fontSize: 11, color: '#4b5563' }}>• smartparking/event (Entry/Exit Gate)</Text>
                <Text style={{ fontSize: 11, color: '#4b5563' }}>• smartparking/alert (Emergency Alerts)</Text>
              </View>

              {/* Last MQTT Message */}
              {lastMqttMessage && (
                <View style={{ backgroundColor: '#eff6ff', padding: 10, borderRadius: 8, borderWidth: 1, borderColor: '#bfdbfe', gap: 2 }}>
                  <Text style={{ fontSize: 11, fontWeight: '700', color: '#1d4ed8' }}>
                    Last Message ({lastMqttMessage.timestamp}):
                  </Text>
                  <Text style={{ fontSize: 11, color: '#1e40af' }}>Topic: {lastMqttMessage.topic}</Text>
                  <Text style={{ fontSize: 11, color: '#1e40af' }} numberOfLines={2}>
                    Data: {JSON.stringify(lastMqttMessage.data)}
                  </Text>
                </View>
              )}

              {/* Test Publish Section */}
              <View style={{ marginTop: 8, gap: 6 }}>
                <Text style={{ fontSize: 12, fontWeight: '700', color: '#374151' }}>Test Publish:</Text>
                <TextInput
                  value={testTopic}
                  onChangeText={setTestTopic}
                  placeholder="smartparking/telemetry"
                  placeholderTextColor="#9ca3af"
                  style={styles.input}
                />
                <TextInput
                  value={testPayload}
                  onChangeText={setTestPayload}
                  placeholder='{"status": "ok"}'
                  placeholderTextColor="#9ca3af"
                  style={styles.input}
                />
                <Pressable
                  onPress={() => {
                    const ok = publishMqtt(testTopic, testPayload);
                    setPublishFeedback(ok ? '✓ Published successfully!' : '✗ Publish failed: broker not connected');
                    setTimeout(() => setPublishFeedback(null), 3000);
                  }}
                  style={[styles.primaryBtn, { backgroundColor: '#16a34a', paddingVertical: 10 }]}>
                  <Text style={styles.primaryBtnText}>📤 Publish to Topic</Text>
                </Pressable>
                {publishFeedback && (
                  <Text style={{ fontSize: 12, textAlign: 'center', color: publishFeedback.startsWith('✓') ? '#16a34a' : '#dc2626', fontWeight: '600' }}>
                    {publishFeedback}
                  </Text>
                )}
              </View>
            </View>
          </View>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  content: {
    padding: 14,
    paddingBottom: 32,
    gap: 14,
  },
  tabsRow: {
    gap: 8,
    paddingBottom: 2,
  },
  sectionTab: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  sectionTabActive: {
    backgroundColor: '#2563eb',
    borderColor: '#2563eb',
  },
  sectionTabIcon: {
    fontSize: 14,
  },
  sectionTabText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#374151',
  },
  sectionTabTextActive: {
    color: '#ffffff',
    fontWeight: '700',
  },
  sectionWrap: {
    gap: 14,
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    gap: 12,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
  },
  formRow: {
    gap: 8,
  },
  input: {
    height: 44,
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 10,
    paddingHorizontal: 12,
    fontSize: 14,
    color: '#111827',
    backgroundColor: '#f9fafb',
  },
  inlineAddRow: {
    flexDirection: 'row',
    gap: 8,
  },
  primaryBtn: {
    backgroundColor: '#2563eb',
    paddingHorizontal: 16,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryBtnText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '700',
  },
  itemCard: {
    backgroundColor: '#f9fafb',
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    gap: 6,
  },
  itemTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  itemTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#111827',
  },
  itemSub: {
    fontSize: 12,
    color: '#4b5563',
    marginTop: 2,
  },
  itemMeta: {
    fontSize: 12,
    color: '#6b7280',
  },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  revenueHero: {
    backgroundColor: '#2563eb',
    borderRadius: 14,
    padding: 20,
    alignItems: 'center',
    gap: 4,
  },
  revenueHeroLabel: {
    color: 'rgba(255,255,255,0.9)',
    fontSize: 13,
    fontWeight: '600',
  },
  revenueHeroVal: {
    color: '#ffffff',
    fontSize: 40,
    fontWeight: '800',
  },
  revenueHeroTrend: {
    color: '#bfdbfe',
    fontSize: 12,
    fontWeight: '600',
  },
  revRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  revDay: {
    fontSize: 14,
    fontWeight: '700',
    color: '#111827',
    width: 50,
  },
  revTarget: {
    fontSize: 12,
    color: '#6b7280',
  },
  revAmount: {
    fontSize: 15,
    fontWeight: '800',
    color: '#16a34a',
  },
  resolveBtn: {
    backgroundColor: '#dcfce7',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  resolveBtnText: {
    color: '#15803d',
    fontSize: 12,
    fontWeight: '700',
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
    gap: 12,
  },
  rateBox: {
    gap: 8,
    paddingTop: 6,
  },
});
