import React, { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import {
  FLOOR_COMPARISON_DATA,
  OCCUPANCY_PIE_DATA,
  PEAK_HOUR_DATA,
  WEEKLY_REVENUE_DATA,
} from '@/context/parking-context';

export function PeakHourChartCard() {
  const [selectedIndex, setSelectedIndex] = useState<number>(12); // 6 PM (145 vehicles)
  const maxVehicles = 160;
  const selectedItem = PEAK_HOUR_DATA[selectedIndex] ?? PEAK_HOUR_DATA[12];

  return (
    <View style={styles.card}>
      <View style={styles.cardHeaderRow}>
        <View>
          <Text style={styles.cardTitle}>Peak Hour Analysis</Text>
          <Text style={styles.cardSub}>Hourly vehicle traffic (6 AM - 7 PM)</Text>
        </View>
        <View style={styles.tooltipPill}>
          <Text style={styles.tooltipHour}>{selectedItem.hour}: </Text>
          <Text style={styles.tooltipValue}>{selectedItem.vehicles} vehicles</Text>
        </View>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.chartScroll}>
        <View style={styles.areaChartContainer}>
          <View style={styles.yAxisColumn}>
            <Text style={styles.axisLabel}>160</Text>
            <Text style={styles.axisLabel}>120</Text>
            <Text style={styles.axisLabel}>80</Text>
            <Text style={styles.axisLabel}>40</Text>
            <Text style={styles.axisLabel}>0</Text>
          </View>
          <View style={styles.barsArea}>
            {[0, 1, 2, 3, 4].map((line) => (
              <View
                key={line}
                style={[styles.gridLine, { top: `${line * 25}%` }]}
              />
            ))}
            <View style={styles.barsRow}>
              {PEAK_HOUR_DATA.map((item, idx) => {
                const heightPct = Math.max(8, (item.vehicles / maxVehicles) * 100);
                const isSelected = idx === selectedIndex;
                return (
                  <Pressable
                    key={item.hour}
                    onPress={() => setSelectedIndex(idx)}
                    style={styles.barColumn}>
                    <View style={styles.barTrack}>
                      <View
                        style={[
                          styles.areaBarFill,
                          {
                            height: `${heightPct}%`,
                            backgroundColor: isSelected ? '#2563eb' : '#60a5fa',
                            opacity: isSelected ? 1 : 0.78,
                          },
                        ]}>
                        <View
                          style={[
                            styles.areaDot,
                            isSelected && styles.areaDotActive,
                          ]}
                        />
                      </View>
                    </View>
                    <Text
                      style={[
                        styles.xAxisLabel,
                        isSelected && styles.xAxisLabelActive,
                      ]}>
                      {item.hour.replace(' ', '\n')}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

export function OccupancyRateChartCard() {
  const totalSlots = OCCUPANCY_PIE_DATA.reduce((sum, item) => sum + item.value, 0);

  return (
    <View style={styles.card}>
      <Text style={styles.cardTitle}>Parking Occupancy Rate</Text>
      <Text style={styles.cardSub}>Distribution across {totalSlots} total slots</Text>

      {/* Multi-segment visual bar + ring summary */}
      <View style={styles.donutSummaryContainer}>
        <View style={styles.donutCircle}>
          <View style={styles.donutInner}>
            <Text style={styles.donutBigValue}>68.4%</Text>
            <Text style={styles.donutLabel}>Occupied</Text>
          </View>
        </View>

        <View style={styles.legendColumn}>
          {OCCUPANCY_PIE_DATA.map((item) => (
            <View key={item.name} style={styles.legendItemRow}>
              <View style={[styles.legendDot, { backgroundColor: item.color }]} />
              <View style={styles.legendTextWrap}>
                <View style={styles.legendTopLine}>
                  <Text style={styles.legendName}>{item.name}</Text>
                  <Text style={[styles.legendPercent, { color: item.color }]}>
                    {item.percent}%
                  </Text>
                </View>
                <Text style={styles.legendCount}>{item.value} slots</Text>
              </View>
            </View>
          ))}
        </View>
      </View>

      {/* Stacked proportion bar */}
      <View style={styles.stackedBar}>
        {OCCUPANCY_PIE_DATA.map((item) => (
          <View
            key={item.name}
            style={{
              flex: item.value,
              backgroundColor: item.color,
              height: 12,
            }}
          />
        ))}
      </View>
    </View>
  );
}

export function FloorComparisonChartCard() {
  const maxVal = 120;

  return (
    <View style={styles.card}>
      <View style={styles.cardHeaderRow}>
        <View>
          <Text style={styles.cardTitle}>Floor Occupancy Comparison</Text>
          <Text style={styles.cardSub}>Occupied vs Available slots per floor</Text>
        </View>
        <View style={styles.inlineLegend}>
          <View style={styles.inlineLegendItem}>
            <View style={[styles.smallSquare, { backgroundColor: '#3b82f6' }]} />
            <Text style={styles.inlineLegendText}>Occupied</Text>
          </View>
          <View style={styles.inlineLegendItem}>
            <View style={[styles.smallSquare, { backgroundColor: '#10b981' }]} />
            <Text style={styles.inlineLegendText}>Available</Text>
          </View>
        </View>
      </View>

      <View style={styles.groupedChartWrap}>
        {FLOOR_COMPARISON_DATA.map((item) => {
          const occHeight = Math.round((item.occupied / maxVal) * 130);
          const availHeight = Math.round((item.available / maxVal) * 130);
          return (
            <View key={item.floor} style={styles.floorGroupCol}>
              <View style={styles.dualBarPair}>
                <View style={styles.singleBarCol}>
                  <Text style={styles.barMiniValue}>{item.occupied}</Text>
                  <View
                    style={[
                      styles.groupedBar,
                      { height: occHeight, backgroundColor: '#3b82f6' },
                    ]}
                  />
                </View>
                <View style={styles.singleBarCol}>
                  <Text style={[styles.barMiniValue, { color: '#10b981' }]}>
                    {item.available}
                  </Text>
                  <View
                    style={[
                      styles.groupedBar,
                      { height: availHeight, backgroundColor: '#10b981' },
                    ]}
                  />
                </View>
              </View>
              <Text style={styles.floorGroupLabel}>{item.floor}</Text>
            </View>
          );
        })}
      </View>
    </View>
  );
}

export function RevenueAnalyticsChartCard() {
  const [selectedDayIdx, setSelectedDayIdx] = useState<number>(5); // Sat ($8,500)
  const maxRev = 10000;
  const targetPct = (5000 / maxRev) * 100;
  const selected = WEEKLY_REVENUE_DATA[selectedDayIdx] ?? WEEKLY_REVENUE_DATA[5];

  return (
    <View style={styles.card}>
      <View style={styles.cardHeaderRow}>
        <View>
          <Text style={styles.cardTitle}>Revenue Analytics (This Week)</Text>
          <Text style={styles.cardSub}>Daily revenue vs $5,000 target</Text>
        </View>
        <View style={[styles.tooltipPill, { backgroundColor: '#eff6ff' }]}>
          <Text style={styles.tooltipHour}>{selected.day}: </Text>
          <Text style={styles.tooltipValue}>
            ${selected.revenue.toLocaleString()}
          </Text>
        </View>
      </View>

      <View style={styles.revenueChartArea}>
        {/* Target $5,000 dashed line */}
        <View style={[styles.targetLine, { bottom: `${targetPct}%` }]}>
          <Text style={styles.targetLineTag}>Target $5,000</Text>
        </View>

        <View style={styles.revenueBarsRow}>
          {WEEKLY_REVENUE_DATA.map((item, idx) => {
            const heightPct = Math.round((item.revenue / maxRev) * 100);
            const isSelected = idx === selectedDayIdx;
            const aboveTarget = item.revenue >= item.target;
            return (
              <Pressable
                key={item.day}
                onPress={() => setSelectedDayIdx(idx)}
                style={styles.revCol}>
                <View style={styles.revTrack}>
                  <View
                    style={[
                      styles.revBar,
                      {
                        height: `${heightPct}%`,
                        backgroundColor: isSelected
                          ? '#1d4ed8'
                          : aboveTarget
                            ? '#3b82f6'
                            : '#93c5fd',
                      },
                    ]}
                  />
                </View>
                <Text
                  style={[
                    styles.revDayLabel,
                    isSelected && styles.xAxisLabelActive,
                  ]}>
                  {item.day}
                </Text>
                <Text style={styles.revAmountMini}>
                  ${(item.revenue / 1000).toFixed(1)}k
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    gap: 12,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 8,
    flexWrap: 'wrap',
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
  },
  cardSub: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 2,
  },
  tooltipPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#dbeafe',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
  },
  tooltipHour: {
    fontSize: 12,
    color: '#1e40af',
    fontWeight: '600',
  },
  tooltipValue: {
    fontSize: 12,
    color: '#1d4ed8',
    fontWeight: '800',
  },
  chartScroll: {
    paddingTop: 6,
    paddingBottom: 4,
  },
  areaChartContainer: {
    flexDirection: 'row',
    height: 185,
    alignItems: 'stretch',
  },
  yAxisColumn: {
    justifyContent: 'space-between',
    paddingRight: 8,
    paddingBottom: 28,
  },
  axisLabel: {
    fontSize: 10,
    color: '#9ca3af',
    textAlign: 'right',
  },
  barsArea: {
    position: 'relative',
    height: 155,
    justifyContent: 'flex-end',
  },
  gridLine: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: '#f3f4f6',
  },
  barsRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    height: '100%',
    gap: 8,
  },
  barColumn: {
    alignItems: 'center',
    width: 32,
  },
  barTrack: {
    height: 135,
    width: 18,
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  areaBarFill: {
    width: 16,
    borderTopLeftRadius: 6,
    borderTopRightRadius: 6,
    alignItems: 'center',
  },
  areaDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#1d4ed8',
    marginTop: -3,
  },
  areaDotActive: {
    width: 9,
    height: 9,
    borderRadius: 5,
    backgroundColor: '#1e3a8a',
    borderWidth: 1.5,
    borderColor: '#ffffff',
  },
  xAxisLabel: {
    fontSize: 10,
    color: '#6b7280',
    textAlign: 'center',
    marginTop: 6,
    lineHeight: 12,
  },
  xAxisLabelActive: {
    color: '#2563eb',
    fontWeight: '700',
  },
  donutSummaryContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 16,
    paddingVertical: 6,
  },
  donutCircle: {
    width: 124,
    height: 124,
    borderRadius: 62,
    borderWidth: 14,
    borderColor: '#3b82f6',
    borderRightColor: '#10b981',
    borderBottomColor: '#f59e0b',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f8fafc',
  },
  donutInner: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  donutBigValue: {
    fontSize: 20,
    fontWeight: '800',
    color: '#111827',
  },
  donutLabel: {
    fontSize: 11,
    color: '#6b7280',
    fontWeight: '500',
  },
  legendColumn: {
    flex: 1,
    gap: 10,
  },
  legendItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  legendDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  legendTextWrap: {
    flex: 1,
  },
  legendTopLine: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  legendName: {
    fontSize: 13,
    fontWeight: '600',
    color: '#374151',
  },
  legendPercent: {
    fontSize: 13,
    fontWeight: '700',
  },
  legendCount: {
    fontSize: 11,
    color: '#6b7280',
  },
  stackedBar: {
    flexDirection: 'row',
    borderRadius: 999,
    overflow: 'hidden',
    height: 12,
    backgroundColor: '#e5e7eb',
  },
  inlineLegend: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'center',
  },
  inlineLegendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  smallSquare: {
    width: 10,
    height: 10,
    borderRadius: 3,
  },
  inlineLegendText: {
    fontSize: 11,
    color: '#4b5563',
    fontWeight: '500',
  },
  groupedChartWrap: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'flex-end',
    paddingTop: 14,
    paddingBottom: 4,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  floorGroupCol: {
    alignItems: 'center',
    gap: 6,
  },
  dualBarPair: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 4,
    height: 148,
  },
  singleBarCol: {
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  barMiniValue: {
    fontSize: 10,
    fontWeight: '700',
    color: '#3b82f6',
    marginBottom: 2,
  },
  groupedBar: {
    width: 16,
    borderTopLeftRadius: 4,
    borderTopRightRadius: 4,
  },
  floorGroupLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#4b5563',
    marginBottom: 6,
  },
  revenueChartArea: {
    height: 180,
    position: 'relative',
    justifyContent: 'flex-end',
    paddingTop: 12,
  },
  targetLine: {
    position: 'absolute',
    left: 0,
    right: 0,
    borderTopWidth: 1.5,
    borderColor: '#94a3b8',
    borderStyle: 'dashed',
    zIndex: 2,
  },
  targetLineTag: {
    position: 'absolute',
    right: 0,
    top: -16,
    fontSize: 10,
    fontWeight: '600',
    color: '#64748b',
    backgroundColor: '#f1f5f9',
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 4,
  },
  revenueBarsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    height: '100%',
    paddingHorizontal: 4,
  },
  revCol: {
    alignItems: 'center',
    flex: 1,
  },
  revTrack: {
    height: 125,
    width: 22,
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  revBar: {
    width: 18,
    borderTopLeftRadius: 5,
    borderTopRightRadius: 5,
  },
  revDayLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#4b5563',
    marginTop: 6,
  },
  revAmountMini: {
    fontSize: 10,
    color: '#9ca3af',
  },
});
