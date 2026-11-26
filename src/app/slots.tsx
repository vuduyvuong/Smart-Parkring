import React, { useMemo, useState } from 'react';
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import {
  ParkingSlotItem,
  SlotStatus,
  useParking,
  VehicleType,
} from '@/context/parking-context';

const STATUS_CONFIG: Record<
  SlotStatus,
  { label: string; color: string; darkColor: string }
> = {
  available: { label: 'Available', color: '#22c55e', darkColor: '#16a34a' },
  occupied: { label: 'Occupied', color: '#ef4444', darkColor: '#dc2626' },
  reserved: { label: 'Reserved', color: '#f97316', darkColor: '#ea580c' },
  maintenance: { label: 'Maintenance', color: '#6b7280', darkColor: '#4b5563' },
  locked: { label: 'Locked', color: '#334155', darkColor: '#1e293b' },
};

const ALL_STATUSES: SlotStatus[] = [
  'available',
  'occupied',
  'reserved',
  'maintenance',
  'locked',
];

const VEHICLE_FILTERS: { value: 'all' | VehicleType; label: string }[] = [
  { value: 'all', label: 'All Types' },
  { value: 'car', label: 'Car' },
  { value: 'motorcycle', label: 'Motorcycle' },
  { value: 'truck', label: 'Truck' },
  { value: 'disabled', label: 'Disabled' },
];

export default function ParkingSlotsScreen() {
  const { slots, updateSlotStatus, lockSlot, addNewSlot } = useParking();

  const [selectedFloor, setSelectedFloor] = useState<string>('1');
  const [selectedStatus, setSelectedStatus] = useState<'all' | SlotStatus>('all');
  const [selectedVehicleType, setSelectedVehicleType] = useState<
    'all' | VehicleType
  >('all');

  const [editingSlot, setEditingSlot] = useState<ParkingSlotItem | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);

  // Add Slot Form State
  const [newFloor, setNewFloor] = useState<number>(1);
  const [newArea, setNewArea] = useState<'A' | 'B' | 'C'>('A');
  const [newSlotNumber, setNewSlotNumber] = useState('');
  const [newVehicleType, setNewVehicleType] = useState<VehicleType>('car');

  const filteredSlots = useMemo(() => {
    return slots.filter((slot) => {
      if (selectedFloor !== 'all' && slot.floor !== parseInt(selectedFloor, 10)) {
        return false;
      }
      if (selectedStatus !== 'all' && slot.status !== selectedStatus) {
        return false;
      }
      if (
        selectedVehicleType !== 'all' &&
        slot.vehicleType !== selectedVehicleType
      ) {
        return false;
      }
      return true;
    });
  }, [slots, selectedFloor, selectedStatus, selectedVehicleType]);

  const handleAddSlotSubmit = () => {
    addNewSlot({
      floor: newFloor,
      area: newArea,
      slotNumber: newSlotNumber || `${newArea}21`,
      vehicleType: newVehicleType,
    });
    setSelectedFloor(newFloor.toString());
    setNewSlotNumber('');
    setShowAddModal(false);
  };

  return (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}>
      {/* Header Row */}
      <View style={styles.topHeaderRow}>
        <View style={{ flex: 1 }}>
          <Text style={styles.title}>Parking Slot Management</Text>
          <Text style={styles.subtitle}>
            Manage and monitor all parking slots
          </Text>
        </View>
        <Pressable
          onPress={() => setShowAddModal(true)}
          style={styles.addSlotBtn}>
          <Text style={styles.addSlotBtnText}>＋ Add New Slot</Text>
        </Pressable>
      </View>

      {/* Filters Card (Matches Figma `mae`) */}
      <View style={styles.card}>
        <View style={styles.filterHeaderRow}>
          <Text style={styles.filterTitle}>🌪️ Filters</Text>
          <Text style={styles.showingCount}>
            Showing {filteredSlots.length} of {slots.length} slots
          </Text>
        </View>

        {/* Floor Filter */}
        <View style={styles.filterGroup}>
          <Text style={styles.filterLabel}>Floor:</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.chipsScroll}>
            {['all', '1', '2', '3', '4', '5'].map((fl) => {
              const active = selectedFloor === fl;
              return (
                <Pressable
                  key={fl}
                  onPress={() => setSelectedFloor(fl)}
                  style={[styles.filterChip, active && styles.filterChipActive]}>
                  <Text
                    style={[
                      styles.filterChipText,
                      active && styles.filterChipTextActive,
                    ]}>
                    {fl === 'all' ? 'All Floors' : `Floor ${fl}`}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>
        </View>

        {/* Status Filter */}
        <View style={styles.filterGroup}>
          <Text style={styles.filterLabel}>Status:</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.chipsScroll}>
            <Pressable
              onPress={() => setSelectedStatus('all')}
              style={[
                styles.filterChip,
                selectedStatus === 'all' && styles.filterChipActive,
              ]}>
              <Text
                style={[
                  styles.filterChipText,
                  selectedStatus === 'all' && styles.filterChipTextActive,
                ]}>
                All Status
              </Text>
            </Pressable>
            {ALL_STATUSES.map((st) => {
              const active = selectedStatus === st;
              return (
                <Pressable
                  key={st}
                  onPress={() => setSelectedStatus(st)}
                  style={[styles.filterChip, active && styles.filterChipActive]}>
                  <Text
                    style={[
                      styles.filterChipText,
                      active && styles.filterChipTextActive,
                    ]}>
                    {STATUS_CONFIG[st].label}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>
        </View>

        {/* Vehicle Type Filter */}
        <View style={styles.filterGroup}>
          <Text style={styles.filterLabel}>Vehicle Type:</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.chipsScroll}>
            {VEHICLE_FILTERS.map((vf) => {
              const active = selectedVehicleType === vf.value;
              return (
                <Pressable
                  key={vf.value}
                  onPress={() => setSelectedVehicleType(vf.value)}
                  style={[styles.filterChip, active && styles.filterChipActive]}>
                  <Text
                    style={[
                      styles.filterChipText,
                      active && styles.filterChipTextActive,
                    ]}>
                    {vf.label}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>
        </View>
      </View>

      {/* 5 Status Summary Cards */}
      <View style={styles.statusSummaryGrid}>
        {ALL_STATUSES.map((st) => {
          const count = filteredSlots.filter((s) => s.status === st).length;
          const cfg = STATUS_CONFIG[st];
          return (
            <Pressable
              key={st}
              onPress={() =>
                setSelectedStatus((prev) => (prev === st ? 'all' : st))
              }
              style={[
                styles.statusSummaryCard,
                selectedStatus === st && {
                  borderColor: cfg.color,
                  borderWidth: 2,
                },
              ]}>
              <View
                style={[styles.statusDot, { backgroundColor: cfg.color }]}
              />
              <Text style={styles.statusCount}>{count}</Text>
              <Text style={styles.statusName}>{cfg.label}</Text>
            </Pressable>
          );
        })}
      </View>

      {/* Slot Grid Card */}
      <View style={styles.card}>
        <Text style={styles.sectionTitle}>
          {selectedFloor === 'all' ? 'All Floors' : `Floor ${selectedFloor}`}
        </Text>

        <View style={styles.slotsGrid}>
          {filteredSlots.map((slot) => {
            const cfg = STATUS_CONFIG[slot.status];
            return (
              <Pressable
                key={slot.id}
                onPress={() => setEditingSlot(slot)}
                style={({ pressed }) => [
                  styles.slotTile,
                  { backgroundColor: cfg.color },
                  pressed && { opacity: 0.85, transform: [{ scale: 0.97 }] },
                ]}>
                <Text style={styles.slotFloorTag}>F{slot.floor}</Text>
                <Text style={styles.slotNumberText}>{slot.slotNumber}</Text>
                <Text style={styles.slotPlateText} numberOfLines={1}>
                  {slot.licensePlate ? slot.licensePlate : cfg.label}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      {/* Edit Slot Dialog Modal */}
      <Modal
        visible={!!editingSlot}
        transparent
        animationType="fade"
        onRequestClose={() => setEditingSlot(null)}>
        <View style={styles.modalBackdrop}>
          {editingSlot && (
            <View style={styles.dialogCard}>
              <Text style={styles.dialogTitle}>
                Edit Slot {editingSlot.slotNumber}
              </Text>
              <Text style={styles.dialogSubtitle}>
                Floor {editingSlot.floor} - Area {editingSlot.area}
              </Text>

              <View style={styles.dialogBody}>
                <Text style={styles.fieldLabel}>Status</Text>
                <View style={styles.statusOptionsGrid}>
                  {ALL_STATUSES.map((st) => {
                    const currentSlot =
                      slots.find((s) => s.id === editingSlot.id) || editingSlot;
                    const isSelected = currentSlot.status === st;
                    const cfg = STATUS_CONFIG[st];
                    return (
                      <Pressable
                        key={st}
                        onPress={() => {
                          updateSlotStatus(editingSlot.id, st);
                          setEditingSlot({ ...currentSlot, status: st });
                        }}
                        style={[
                          styles.statusOptionPill,
                          isSelected && {
                            backgroundColor: cfg.color,
                            borderColor: cfg.color,
                          },
                        ]}>
                        <Text
                          style={[
                            styles.statusOptionText,
                            isSelected && { color: '#ffffff', fontWeight: '700' },
                          ]}>
                          {cfg.label}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>

                {editingSlot.licensePlate && (
                  <View style={styles.plateDisplayBox}>
                    <Text style={styles.fieldLabel}>License Plate</Text>
                    <View style={styles.disabledInputBox}>
                      <Text style={styles.disabledInputText}>
                        {editingSlot.licensePlate}
                      </Text>
                    </View>
                  </View>
                )}
              </View>

              <View style={styles.dialogFooter}>
                <Pressable
                  onPress={() => {
                    lockSlot(editingSlot.id);
                    setEditingSlot(null);
                  }}
                  style={styles.lockSlotBtn}>
                  <Text style={styles.lockSlotBtnText}>🔒 Lock Slot</Text>
                </Pressable>

                <Pressable
                  onPress={() => setEditingSlot(null)}
                  style={styles.doneBtn}>
                  <Text style={styles.doneBtnText}>Done</Text>
                </Pressable>
              </View>
            </View>
          )}
        </View>
      </Modal>

      {/* Add New Parking Slot Modal */}
      <Modal
        visible={showAddModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowAddModal(false)}>
        <View style={styles.modalBackdrop}>
          <View style={styles.dialogCard}>
            <Text style={styles.dialogTitle}>Add New Parking Slot</Text>
            <Text style={styles.dialogSubtitle}>
              Create a new parking slot in the system
            </Text>

            <View style={styles.dialogBody}>
              <Text style={styles.fieldLabel}>Floor</Text>
              <View style={styles.inlineSelectRow}>
                {[1, 2, 3, 4, 5].map((fl) => (
                  <Pressable
                    key={fl}
                    onPress={() => setNewFloor(fl)}
                    style={[
                      styles.smallChoiceBtn,
                      newFloor === fl && styles.smallChoiceBtnActive,
                    ]}>
                    <Text
                      style={[
                        styles.smallChoiceText,
                        newFloor === fl && styles.smallChoiceTextActive,
                      ]}>
                      F{fl}
                    </Text>
                  </Pressable>
                ))}
              </View>

              <Text style={styles.fieldLabel}>Area</Text>
              <View style={styles.inlineSelectRow}>
                {(['A', 'B', 'C'] as const).map((ar) => (
                  <Pressable
                    key={ar}
                    onPress={() => setNewArea(ar)}
                    style={[
                      styles.smallChoiceBtn,
                      newArea === ar && styles.smallChoiceBtnActive,
                    ]}>
                    <Text
                      style={[
                        styles.smallChoiceText,
                        newArea === ar && styles.smallChoiceTextActive,
                      ]}>
                      Area {ar}
                    </Text>
                  </Pressable>
                ))}
              </View>

              <Text style={styles.fieldLabel}>Slot Number</Text>
              <TextInput
                value={newSlotNumber}
                onChangeText={setNewSlotNumber}
                placeholder="e.g., A21"
                placeholderTextColor="#9ca3af"
                autoCapitalize="characters"
                style={styles.slotTextInput}
              />

              <Text style={styles.fieldLabel}>Vehicle Type</Text>
              <View style={styles.inlineSelectRow}>
                {(['car', 'motorcycle', 'truck', 'disabled'] as VehicleType[]).map(
                  (vt) => (
                    <Pressable
                      key={vt}
                      onPress={() => setNewVehicleType(vt)}
                      style={[
                        styles.smallChoiceBtn,
                        newVehicleType === vt && styles.smallChoiceBtnActive,
                      ]}>
                      <Text
                        style={[
                          styles.smallChoiceText,
                          newVehicleType === vt && styles.smallChoiceTextActive,
                        ]}>
                        {vt}
                      </Text>
                    </Pressable>
                  )
                )}
              </View>
            </View>

            <View style={styles.dialogFooter}>
              <Pressable
                onPress={() => setShowAddModal(false)}
                style={styles.lockSlotBtn}>
                <Text style={styles.lockSlotBtnText}>Cancel</Text>
              </Pressable>
              <Pressable onPress={handleAddSlotSubmit} style={styles.doneBtn}>
                <Text style={styles.doneBtnText}>Add Slot</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
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
  topHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: '#111827',
  },
  subtitle: {
    fontSize: 12,
    color: '#6b7280',
  },
  addSlotBtn: {
    backgroundColor: '#2563eb',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
  },
  addSlotBtnText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '700',
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    gap: 12,
  },
  filterHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  filterTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#374151',
  },
  showingCount: {
    fontSize: 12,
    color: '#6b7280',
    fontWeight: '500',
  },
  filterGroup: {
    gap: 6,
  },
  filterLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#4b5563',
  },
  chipsScroll: {
    gap: 6,
  },
  filterChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: '#f3f4f6',
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  filterChipActive: {
    backgroundColor: '#2563eb',
    borderColor: '#2563eb',
  },
  filterChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#374151',
  },
  filterChipTextActive: {
    color: '#ffffff',
  },
  statusSummaryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  statusSummaryCard: {
    width: '31%',
    flexGrow: 1,
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    gap: 4,
  },
  statusDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  statusCount: {
    fontSize: 20,
    fontWeight: '800',
    color: '#111827',
  },
  statusName: {
    fontSize: 12,
    color: '#6b7280',
    fontWeight: '500',
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#111827',
  },
  slotsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  slotTile: {
    width: '22.8%',
    flexGrow: 1,
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 8,
    minHeight: 68,
    justifyContent: 'space-between',
  },
  slotFloorTag: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: 10,
    fontWeight: '700',
  },
  slotNumberText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '800',
  },
  slotPlateText: {
    color: 'rgba(255,255,255,0.92)',
    fontSize: 9,
    fontWeight: '600',
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.5)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 18,
  },
  dialogCard: {
    width: '100%',
    maxWidth: 400,
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 20,
    gap: 12,
  },
  dialogTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#111827',
  },
  dialogSubtitle: {
    fontSize: 13,
    color: '#6b7280',
    marginTop: -6,
  },
  dialogBody: {
    gap: 10,
    paddingVertical: 6,
  },
  fieldLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#374151',
  },
  statusOptionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  statusOptionPill: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#d1d5db',
    backgroundColor: '#f9fafb',
  },
  statusOptionText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#374151',
  },
  plateDisplayBox: {
    gap: 6,
    marginTop: 4,
  },
  disabledInputBox: {
    backgroundColor: '#f3f4f6',
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  disabledInputText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#374151',
  },
  dialogFooter: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
    marginTop: 6,
  },
  lockSlotBtn: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#d1d5db',
    backgroundColor: '#ffffff',
  },
  lockSlotBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
  },
  doneBtn: {
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: '#2563eb',
  },
  doneBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#ffffff',
  },
  inlineSelectRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  smallChoiceBtn: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#d1d5db',
    backgroundColor: '#f9fafb',
  },
  smallChoiceBtnActive: {
    backgroundColor: '#2563eb',
    borderColor: '#2563eb',
  },
  smallChoiceText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#374151',
    textTransform: 'capitalize',
  },
  smallChoiceTextActive: {
    color: '#ffffff',
  },
  slotTextInput: {
    height: 44,
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    paddingHorizontal: 12,
    fontSize: 14,
    color: '#111827',
    backgroundColor: '#f9fafb',
  },
});
