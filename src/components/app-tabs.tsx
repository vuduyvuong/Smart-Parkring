import {
  TabList,
  TabListProps,
  Tabs,
  TabSlot,
  TabTrigger,
  TabTriggerSlotProps,
} from 'expo-router/ui';
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ParkingHeader } from './parking-header';

export default function AppTabs() {
  return (
    <Tabs style={styles.root}>
      <ParkingHeader />
      <View style={styles.slotWrapper}>
        <TabSlot style={styles.slot} />
      </View>
      <TabList asChild>
        <CustomBottomBar>
          <TabTrigger name="index" href="/" asChild>
            <BottomTabButton icon="📊" label="Dashboard" />
          </TabTrigger>
          <TabTrigger name="check-in" href={'/check-in' as never} asChild>
            <BottomTabButton icon="📥" label="Check-In" />
          </TabTrigger>
          <TabTrigger name="check-out" href={'/check-out' as never} asChild>
            <BottomTabButton icon="📤" label="Check-Out" />
          </TabTrigger>
          <TabTrigger name="slots" href={'/slots' as never} asChild>
            <BottomTabButton icon="🅿️" label="Slots" />
          </TabTrigger>
          <TabTrigger name="explore" href="/explore" asChild>
            <BottomTabButton icon="☰" label="More" />
          </TabTrigger>
        </CustomBottomBar>
      </TabList>
    </Tabs>
  );
}

type BottomTabButtonProps = Omit<TabTriggerSlotProps, 'ref'> & {
  icon: string;
  label: string;
};

function BottomTabButton({
  icon,
  label,
  isFocused,
  ...props
}: BottomTabButtonProps) {
  return (
    <Pressable
      {...props}
      style={({ pressed }) => [
        styles.tabButton,
        pressed && styles.tabPressed,
      ]}>
      <View style={[styles.iconPill, isFocused && styles.iconPillActive]}>
        <Text style={[styles.tabIcon, isFocused && styles.tabIconActive]}>
          {icon}
        </Text>
      </View>
      <Text style={[styles.tabLabel, isFocused && styles.tabLabelActive]}>
        {label}
      </Text>
    </Pressable>
  );
}

function CustomBottomBar(props: TabListProps) {
  const insets = useSafeAreaInsets();
  return (
    <View
      {...props}
      style={[
        styles.bottomBar,
        { paddingBottom: Math.max(insets.bottom, 8) },
      ]}>
      {props.children}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  slotWrapper: {
    flex: 1,
  },
  slot: {
    flex: 1,
  },
  bottomBar: {
    flexDirection: 'row',
    backgroundColor: '#ffffff',
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    paddingTop: 8,
    paddingHorizontal: 6,
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  tabButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 3,
  },
  tabPressed: {
    opacity: 0.7,
  },
  iconPill: {
    paddingHorizontal: 14,
    paddingVertical: 4,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconPillActive: {
    backgroundColor: '#dbeafe',
  },
  tabIcon: {
    fontSize: 16,
  },
  tabIconActive: {
    transform: [{ scale: 1.05 }],
  },
  tabLabel: {
    fontSize: 11,
    fontWeight: '500',
    color: '#6b7280',
  },
  tabLabelActive: {
    color: '#2563eb',
    fontWeight: '700',
  },
});
