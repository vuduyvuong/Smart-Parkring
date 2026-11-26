import { router } from 'expo-router';
import React from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import {
  FloorComparisonChartCard,
  OccupancyRateChartCard,
  PeakHourChartCard,
  RevenueAnalyticsChartCard,
} from '@/components/parking-charts';
import {
  AI_METRICS_DATA,
  AI_RECENT_ALLOCATIONS,
  useParking,
} from '@/context/parking-context';

export default function DashboardScreen() {
  const {
    sessions,
    bookings,
    exceptions,
    zoneMonitoring,
    revenueToday,
    totalVehiclesToday,
    toggleBookingStatus,
    resolveException,
  } = useParking();

  const kpiCards = [
    {
      title: 'Total Vehicles',
      value: totalVehiclesToday.toString(),
      icon: '🚗',
      iconBg: '#dbeafe',
      trend: { value: 12, isPositive: true },
    },
    {
      title: 'Available Slots',
      value: '158',
      icon: '✅',
      iconBg: '#dcfce7',
    },
    {
      title: 'Occupied Slots',
      value: '342',
      icon: '🅿️',
      iconBg: '#fee2e2',
      trend: { value: 8, isPositive: true },
    },
    {
      title: 'Reserved Slots',
      value: '45',
      icon: '🕒',
      iconBg: '#ffedd5',
    },
    {
      title: 'Revenue Today',
      value: `$${revenueToday.toLocaleString()}`,
      icon: '💲',
      iconBg: '#d1fae5',
      trend: { value: 15, isPositive: true },
    },
    {
      title: 'Occupancy Rate',
      value: '68.4%',
      icon: '📈',
      iconBg: '#f3e8ff',
      trend: { value: 5, isPositive: true },
    },
  ];

  const getZoneStyle = (status: 'normal' | 'high' | 'critical') => {
    switch (status) {
      case 'critical':
        return {
          bg: '#fef2f2',
          border: '#fecaca',
          text: '#b91c1c',
          bar: '#ef4444',
        };
      case 'high':
        return {
          bg: '#fff7ed',
          border: '#fed7aa',
          text: '#c2410c',
          bar: '#f97316',
        };
      default:
        return {
          bg: '#f0fdf4',
          border: '#bbf7d0',
          text: '#15803d',
          bar: '#3b82f6',
        };
    }
  };

  return (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}>
      {/* Quick Action Shortcuts for Mobile Operators */}
      <View style={styles.quickActionsRow}>
        <Pressable
          onPress={() => router.navigate('/check-in' as never)}
          style={[styles.quickBtn, { backgroundColor: '#2563eb' }]}>
          <Text style={styles.quickBtnIcon}>📥</Text>
          <Text style={styles.quickBtnText}>Check-In</Text>
        </Pressable>
        <Pressable
          onPress={() => router.navigate('/check-out' as never)}
          style={[styles.quickBtn, { backgroundColor: '#16a34a' }]}>
          <Text style={styles.quickBtnIcon}>📤</Text>
          <Text style={styles.quickBtnText}>Check-Out</Text>
        </Pressable>
        <Pressable
          onPress={() => router.navigate('/slots' as never)}
          style={[styles.quickBtn, { backgroundColor: '#0f172a' }]}>
          <Text style={styles.quickBtnIcon}>🅿️</Text>
          <Text style={styles.quickBtnText}>Slot Grid</Text>
        </Pressable>
      </View>

      {/* 6 KPI Stat Cards (Matches Figma `Aa` cards) */}
      <View style={styles.kpiGrid}>
        {kpiCards.map((item) => (
          <View key={item.title} style={styles.kpiCard}>
            <View style={styles.kpiHeader}>
              <Text style={styles.kpiTitle} numberOfLines={1}>
                {item.title}
              </Text>
              <View style={[styles.kpiIconBox, { backgroundColor: item.iconBg }]}>
                <Text style={styles.kpiIcon}>{item.icon}</Text>
              </View>
            </View>
            <Text style={styles.kpiValue}>{item.value}</Text>
            {item.trend ? (
              <Text
                style={[
                  styles.kpiTrend,
                  { color: item.trend.isPositive ? '#16a34a' : '#dc2626' },
                ]}>
                {item.trend.isPositive ? '+' : ''}
                {item.trend.value}% from yesterday
              </Text>
            ) : (
              <Text style={styles.kpiTrendMuted}>Real-time live count</Text>
            )}
          </View>
        ))}
      </View>

      {/* 4 Analytics Charts (Matches Figma `xne`, `wne`, `Pne`, `One`) */}
      <PeakHourChartCard />
      <OccupancyRateChartCard />
      <FloorComparisonChartCard />
      <RevenueAnalyticsChartCard />

      {/* Smart AI Slot Allocation (`qne`) */}
      <View style={[styles.card, styles.aiCard]}>
        <View style={styles.sectionHeaderRow}>
          <View style={styles.sectionTitleGroup}>
            <Text style={styles.sectionIcon}>🤖</Text>
            <Text style={styles.sectionTitle}>Smart AI Slot Allocation</Text>
          </View>
          <View style={[styles.pillBadge, { backgroundColor: '#dcfce7' }]}>
            <Text style={[styles.pillBadgeText, { color: '#15803d' }]}>
              ● Active
            </Text>
          </View>
        </View>

        <View style={styles.aiMetricsWrap}>
          {AI_METRICS_DATA.map((metric) => (
            <View key={metric.label} style={styles.aiMetricItem}>
              <View style={styles.aiMetricTop}>
                <Text style={styles.aiMetricLabel}>{metric.label}</Text>
                <Text style={[styles.aiMetricVal, { color: metric.color }]}>
                  {metric.value}%
                </Text>
              </View>
              <View style={styles.progressTrack}>
                <View
                  style={[
                    styles.progressFill,
                    { width: `${metric.value}%`, backgroundColor: metric.color },
                  ]}
                />
              </View>
            </View>
          ))}
        </View>

        <Text style={styles.subHeading}>Recent Allocations</Text>
        <View style={styles.allocationsList}>
          {AI_RECENT_ALLOCATIONS.map((alloc) => (
            <View key={alloc.vehicle} style={styles.allocationCard}>
              <View style={styles.allocationTop}>
                <Text style={styles.allocationPlate}>{alloc.vehicle}</Text>
                <View style={styles.matchBadge}>
                  <Text style={styles.matchBadgeText}>
                    {alloc.confidence}% match
                  </Text>
                </View>
              </View>
              <View style={styles.allocationBottom}>
                <Text style={styles.allocationMeta}>Slot: {alloc.slot}</Text>
                <Text style={styles.allocationMeta}>{alloc.time}</Text>
              </View>
            </View>
          ))}
        </View>

        <View style={styles.aiStatusBanner}>
          <Text style={styles.aiStatusText}>
            <Text style={{ fontWeight: '700' }}>AI Status: </Text>
            System is analyzing traffic patterns and optimizing slot allocation
            for maximum efficiency.
          </Text>
        </View>
      </View>

      {/* Real-time Slot Monitoring (`lie`) */}
      <View style={styles.card}>
        <View style={styles.sectionHeaderRow}>
          <View style={styles.sectionTitleGroup}>
            <Text style={styles.sectionIcon}>📡</Text>
            <Text style={styles.sectionTitle}>Real-time Slot Monitoring</Text>
          </View>
          <View style={[styles.pillBadge, { backgroundColor: '#dbeafe' }]}>
            <Text style={[styles.pillBadgeText, { color: '#1d4ed8' }]}>
              ● Live
            </Text>
          </View>
        </View>

        <View style={styles.zonesWrapper}>
          {zoneMonitoring.map((floorObj) => (
            <View key={floorObj.floor} style={styles.floorZoneSection}>
              <Text style={styles.floorZoneTitle}>{floorObj.floor}</Text>
              {floorObj.zones.map((zone) => {
                const zStyle = getZoneStyle(zone.status);
                const pct = Math.round((zone.occupied / zone.total) * 100);
                const filledSegs = Math.floor((zone.occupied / zone.total) * 15);
                return (
                  <View
                    key={`${floorObj.floor}-${zone.name}`}
                    style={[
                      styles.zoneCard,
                      {
                        backgroundColor: zStyle.bg,
                        borderColor: zStyle.border,
                      },
                    ]}>
                    <View style={styles.zoneCardTop}>
                      <Text style={[styles.zoneName, { color: zStyle.text }]}>
                        {zone.name}
                      </Text>
                      <View style={styles.zonePctPill}>
                        <Text style={styles.zonePctText}>{pct}%</Text>
                      </View>
                    </View>
                    <View style={styles.zoneCardMid}>
                      <Text style={[styles.zoneMeta, { color: zStyle.text }]}>
                        {zone.occupied} / {zone.total} occupied
                      </Text>
                      <Text
                        style={[
                          styles.zoneAvailText,
                          { color: zStyle.text },
                        ]}>
                        {zone.total - zone.occupied} available
                      </Text>
                    </View>
                    <View style={styles.segmentsRow}>
                      {Array.from({ length: 15 }).map((_, segIdx) => (
                        <View
                          key={segIdx}
                          style={[
                            styles.segmentBlock,
                            {
                              backgroundColor:
                                segIdx < filledSegs ? zStyle.bar : '#d1d5db',
                            },
                          ]}
                        />
                      ))}
                    </View>
                  </View>
                );
              })}
            </View>
          ))}
        </View>
      </View>

      {/* Recent Parking Sessions (`Tne`) */}
      <View style={styles.card}>
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitle}>Recent Parking Sessions</Text>
          <Text style={styles.countText}>{sessions.length} total</Text>
        </View>

        <View style={styles.listStack}>
          {sessions.slice(0, 6).map((session) => {
            const isActive = session.status === 'Active';
            return (
              <View key={session.id} style={styles.rowCard}>
                <View style={styles.rowCardTop}>
                  <View style={styles.rowIdGroup}>
                    <Text style={styles.rowPrimaryId}>{session.id}</Text>
                    <Text style={styles.rowPlateBadge}>{session.vehicle}</Text>
                  </View>
                  <View
                    style={[
                      styles.statusBadge,
                      {
                        backgroundColor: isActive ? '#dcfce7' : '#f3f4f6',
                      },
                    ]}>
                    <Text
                      style={[
                        styles.statusBadgeText,
                        { color: isActive ? '#15803d' : '#4b5563' },
                      ]}>
                      {session.status}
                    </Text>
                  </View>
                </View>

                <View style={styles.rowCardDetails}>
                  <Text style={styles.rowMetaItem}>
                    Floor: <Text style={styles.rowMetaBold}>{session.floor}</Text>
                  </Text>
                  <Text style={styles.rowMetaItem}>
                    Slot: <Text style={styles.rowMetaBold}>{session.slot}</Text>
                  </Text>
                  <Text style={styles.rowMetaItem}>
                    In: <Text style={styles.rowMetaBold}>{session.entryTime}</Text>
                  </Text>
                  <Text style={styles.rowMetaItem}>
                    ⏱ <Text style={styles.rowMetaBold}>{session.duration}</Text>
                  </Text>
                </View>
              </View>
            );
          })}
        </View>
      </View>

      {/* Active Bookings (`Cne`) */}
      <View style={styles.card}>
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitle}>Active Bookings</Text>
          <Text style={styles.countText}>{bookings.length} bookings</Text>
        </View>

        <View style={styles.listStack}>
          {bookings.map((bk) => {
            const isConfirmed = bk.status === 'Confirmed';
            return (
              <View key={bk.id} style={styles.rowCard}>
                <View style={styles.rowCardTop}>
                  <View>
                    <Text style={styles.rowPrimaryId}>
                      {bk.id} • {bk.customer}
                    </Text>
                    <Text style={styles.bookingVehicleText}>
                      {bk.vehicle} • Slot <Text style={styles.rowMetaBold}>{bk.slot}</Text>
                    </Text>
                  </View>
                  <Pressable
                    onPress={() => toggleBookingStatus(bk.id)}
                    style={[
                      styles.statusBadge,
                      {
                        backgroundColor: isConfirmed ? '#dbeafe' : '#fef9c3',
                      },
                    ]}>
                    <Text
                      style={[
                        styles.statusBadgeText,
                        { color: isConfirmed ? '#1d4ed8' : '#a16207' },
                      ]}>
                      {bk.status}
                    </Text>
                  </Pressable>
                </View>
                <View style={styles.rowCardDetails}>
                  <Text style={styles.rowMetaItem}>📅 {bk.date}</Text>
                  <Text style={styles.rowMetaItem}>🕒 {bk.time}</Text>
                </View>
              </View>
            );
          })}
        </View>
      </View>

      {/* Exception Cases (`Mne`) */}
      <View style={styles.card}>
        <View style={styles.sectionHeaderRow}>
          <View style={styles.sectionTitleGroup}>
            <Text style={styles.sectionIcon}>⚠️</Text>
            <Text style={styles.sectionTitle}>Exception Cases</Text>
          </View>
          <View style={[styles.pillBadge, { backgroundColor: '#fee2e2' }]}>
            <Text style={[styles.pillBadgeText, { color: '#b91c1c' }]}>
              {exceptions.length} Active
            </Text>
          </View>
        </View>

        {exceptions.length === 0 ? (
          <View style={styles.emptyExceptions}>
            <Text style={styles.emptyExceptionsText}>
              No active exception cases 🎉
            </Text>
          </View>
        ) : (
          <View style={styles.listStack}>
            {exceptions.map((ex) => {
              const sevColors =
                ex.severity === 'High'
                  ? { bg: '#fee2e2', text: '#b91c1c' }
                  : ex.severity === 'Medium'
                    ? { bg: '#ffedd5', text: '#c2410c' }
                    : { bg: '#fef9c3', text: '#a16207' };

              return (
                <View key={ex.id} style={styles.rowCard}>
                  <View style={styles.rowCardTop}>
                    <View style={styles.rowIdGroup}>
                      <Text style={styles.rowPrimaryId}>{ex.id}</Text>
                      <Text style={styles.exceptionType}>{ex.type}</Text>
                    </View>
                    <View
                      style={[
                        styles.statusBadge,
                        { backgroundColor: sevColors.bg },
                      ]}>
                      <Text
                        style={[
                          styles.statusBadgeText,
                          { color: sevColors.text },
                        ]}>
                        {ex.severity}
                      </Text>
                    </View>
                  </View>
                  <View style={styles.exceptionBottomRow}>
                    <Text style={styles.rowMetaItem}>
                      Vehicle <Text style={styles.rowMetaBold}>{ex.vehicle}</Text> • Slot{' '}
                      <Text style={styles.rowMetaBold}>{ex.slot}</Text> • {ex.time}
                    </Text>
                    <Pressable
                      onPress={() => resolveException(ex.id)}
                      style={styles.resolveActionBtn}>
                      <Text style={styles.resolveActionText}>Resolve</Text>
                    </Pressable>
                  </View>
                </View>
              );
            })}
          </View>
        )}
      </View>
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
  quickActionsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  quickBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 11,
    borderRadius: 12,
  },
  quickBtnIcon: {
    fontSize: 15,
  },
  quickBtnText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '700',
  },
  kpiGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  kpiCard: {
    width: '48.3%',
    flexGrow: 1,
    backgroundColor: '#ffffff',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    gap: 6,
  },
  kpiHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 6,
  },
  kpiTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6b7280',
    flex: 1,
  },
  kpiIconBox: {
    width: 30,
    height: 30,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  kpiIcon: {
    fontSize: 14,
  },
  kpiValue: {
    fontSize: 22,
    fontWeight: '800',
    color: '#111827',
  },
  kpiTrend: {
    fontSize: 11,
    fontWeight: '600',
  },
  kpiTrendMuted: {
    fontSize: 11,
    color: '#9ca3af',
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    gap: 14,
  },
  aiCard: {
    borderColor: '#bfdbfe',
    backgroundColor: '#f8fbff',
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sectionTitleGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sectionIcon: {
    fontSize: 18,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
  },
  countText: {
    fontSize: 12,
    color: '#6b7280',
    fontWeight: '500',
  },
  pillBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
  },
  pillBadgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  aiMetricsWrap: {
    gap: 12,
  },
  aiMetricItem: {
    gap: 6,
  },
  aiMetricTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  aiMetricLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#374151',
  },
  aiMetricVal: {
    fontSize: 13,
    fontWeight: '800',
  },
  progressTrack: {
    height: 8,
    backgroundColor: '#dbeafe',
    borderRadius: 999,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 999,
  },
  subHeading: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1f2937',
  },
  allocationsList: {
    gap: 8,
  },
  allocationCard: {
    backgroundColor: '#ffffff',
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    gap: 4,
  },
  allocationTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  allocationPlate: {
    fontSize: 14,
    fontWeight: '700',
    color: '#111827',
  },
  matchBadge: {
    backgroundColor: '#f1f5f9',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  matchBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#334155',
  },
  allocationBottom: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  allocationMeta: {
    fontSize: 12,
    color: '#6b7280',
  },
  aiStatusBanner: {
    backgroundColor: '#dbeafe',
    borderColor: '#bfdbfe',
    borderWidth: 1,
    borderRadius: 10,
    padding: 12,
  },
  aiStatusText: {
    fontSize: 12,
    color: '#1e40af',
    lineHeight: 17,
  },
  zonesWrapper: {
    gap: 14,
  },
  floorZoneSection: {
    gap: 8,
  },
  floorZoneTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#334155',
  },
  zoneCard: {
    borderWidth: 1,
    borderRadius: 10,
    padding: 12,
    gap: 6,
  },
  zoneCardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  zoneName: {
    fontSize: 14,
    fontWeight: '700',
  },
  zonePctPill: {
    backgroundColor: 'rgba(255,255,255,0.85)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  zonePctText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#1f2937',
  },
  zoneCardMid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  zoneMeta: {
    fontSize: 12,
  },
  zoneAvailText: {
    fontSize: 12,
    fontWeight: '700',
  },
  segmentsRow: {
    flexDirection: 'row',
    gap: 3,
    marginTop: 2,
  },
  segmentBlock: {
    flex: 1,
    height: 7,
    borderRadius: 2,
  },
  listStack: {
    gap: 10,
  },
  rowCard: {
    backgroundColor: '#f9fafb',
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    gap: 8,
  },
  rowCardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  rowIdGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  rowPrimaryId: {
    fontSize: 13,
    fontWeight: '700',
    color: '#111827',
  },
  rowPlateBadge: {
    fontSize: 13,
    fontWeight: '800',
    color: '#2563eb',
    backgroundColor: '#eff6ff',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
  },
  statusBadgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  rowCardDetails: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  rowMetaItem: {
    fontSize: 12,
    color: '#6b7280',
  },
  rowMetaBold: {
    fontWeight: '700',
    color: '#1f2937',
  },
  bookingVehicleText: {
    fontSize: 12,
    color: '#4b5563',
    marginTop: 2,
  },
  exceptionType: {
    fontSize: 13,
    fontWeight: '700',
    color: '#b91c1c',
  },
  exceptionBottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 8,
  },
  resolveActionBtn: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#d1d5db',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
  },
  resolveActionText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#16a34a',
  },
  emptyExceptions: {
    paddingVertical: 16,
    alignItems: 'center',
  },
  emptyExceptionsText: {
    fontSize: 13,
    color: '#16a34a',
    fontWeight: '600',
  },
});
