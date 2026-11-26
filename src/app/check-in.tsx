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

import {
  ParkingSlotItem,
  useParking,
  VehicleType,
} from '@/context/parking-context';

const VEHICLE_TYPES: { value: VehicleType; label: string; icon: string }[] = [
  { value: 'car', label: 'Car', icon: '🚗' },
  { value: 'motorcycle', label: 'Motorcycle', icon: '🏍️' },
  { value: 'truck', label: 'Truck / Van', icon: '🚚' },
];

const QUICK_PLATES = ['29A-888.99', '51H-678.90', '30K-123.45', 'ABC-9081'];

export default function CheckInScreen() {
  const {
    floorSummaries,
    lastUpdated,
    autoAssignSlotForFloor,
    createCheckInSession,
    refreshAvailability,
  } = useParking();

  const [licensePlate, setLicensePlate] = useState('');
  const [vehicleType, setVehicleType] = useState<VehicleType | ''>('');
  const [selectedFloor, setSelectedFloor] = useState<string>('');
  const [assignedSlot, setAssignedSlot] = useState<ParkingSlotItem | null>(null);
  const [entryTime, setEntryTime] = useState<Date | null>(null);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [ticketToast, setTicketToast] = useState<string | null>(null);

  const totalAvailable = floorSummaries.reduce((acc, f) => acc + f.available, 0);
  const totalSlots = floorSummaries.reduce((acc, f) => acc + f.total, 0);

  const canAssign =
    licensePlate.trim().length > 0 &&
    vehicleType !== '' &&
    selectedFloor !== '';

  const handleAutoAssign = () => {
    if (!canAssign) return;
    const floorNum = parseInt(selectedFloor, 10);
    const slot = autoAssignSlotForFloor(floorNum);
    if (slot) {
      setAssignedSlot(slot);
      setEntryTime(new Date());
    }
  };

  const handleCreateSession = () => {
    if (!assignedSlot || !vehicleType || !selectedFloor || !entryTime) return;
    createCheckInSession({
      licensePlate: licensePlate.trim().toUpperCase(),
      vehicleType,
      floor: parseInt(selectedFloor, 10),
      slot: assignedSlot,
      entryTime,
    });
    setShowSuccessModal(true);
    setTimeout(() => {
      setShowSuccessModal(false);
    }, 2200);
  };

  const handleOpenGateOnly = () => {
    setShowSuccessModal(true);
    setTimeout(() => {
      setShowSuccessModal(false);
    }, 2000);
  };

  const handleReset = () => {
    setLicensePlate('');
    setVehicleType('');
    setSelectedFloor('');
    setAssignedSlot(null);
    setEntryTime(null);
    setTicketToast(null);
  };

  return (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}>
      {/* Page Title */}
      <View style={styles.headerBlock}>
        <Text style={styles.title}>Vehicle Check-In</Text>
        <Text style={styles.subtitle}>
          Manual vehicle entry and parking slot assignment
        </Text>
      </View>

      {/* Vehicle Information Form Card (Matches Figma `Gce`) */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Vehicle Information</Text>

        {/* License Plate Number */}
        <View style={styles.fieldGroup}>
          <Text style={styles.label}>License Plate Number</Text>
          <TextInput
            value={licensePlate}
            onChangeText={(txt) => setLicensePlate(txt.toUpperCase())}
            placeholder="ENTER LICENSE PLATE"
            placeholderTextColor="#9ca3af"
            autoCapitalize="characters"
            style={styles.plateInput}
          />
          <View style={styles.quickPlatesRow}>
            {QUICK_PLATES.map((plate) => (
              <Pressable
                key={plate}
                onPress={() => setLicensePlate(plate)}
                style={[
                  styles.quickPlateChip,
                  licensePlate === plate && styles.quickPlateChipActive,
                ]}>
                <Text
                  style={[
                    styles.quickPlateText,
                    licensePlate === plate && styles.quickPlateTextActive,
                  ]}>
                  {plate}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>

        {/* Vehicle Type Selector */}
        <View style={styles.fieldGroup}>
          <Text style={styles.label}>Vehicle Type</Text>
          <View style={styles.vehicleTypeRow}>
            {VEHICLE_TYPES.map((vt) => {
              const selected = vehicleType === vt.value;
              return (
                <Pressable
                  key={vt.value}
                  onPress={() => setVehicleType(vt.value)}
                  style={[
                    styles.vehicleTypeCard,
                    selected && styles.vehicleTypeCardSelected,
                  ]}>
                  <Text style={styles.vehicleTypeIcon}>{vt.icon}</Text>
                  <Text
                    style={[
                      styles.vehicleTypeLabel,
                      selected && styles.vehicleTypeLabelSelected,
                    ]}>
                    {vt.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        {/* Parking Floor Selector */}
        <View style={styles.fieldGroup}>
          <Text style={styles.label}>Parking Floor</Text>
          <View style={styles.floorGrid}>
            {floorSummaries.map((f) => {
              const selected = selectedFloor === f.floor.toString();
              return (
                <Pressable
                  key={f.floor}
                  onPress={() => setSelectedFloor(f.floor.toString())}
                  style={[
                    styles.floorOptionBtn,
                    selected && styles.floorOptionBtnSelected,
                  ]}>
                  <Text
                    style={[
                      styles.floorOptionTitle,
                      selected && styles.floorOptionTitleSelected,
                    ]}>
                    Floor {f.floor}
                  </Text>
                  <Text
                    style={[
                      styles.floorOptionAvail,
                      selected && styles.floorOptionAvailSelected,
                    ]}>
                    {f.available} available
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        {/* Auto Assign Parking Slot Button */}
        <Pressable
          onPress={handleAutoAssign}
          disabled={!canAssign}
          style={[
            styles.assignButton,
            !canAssign && styles.assignButtonDisabled,
          ]}>
          <Text style={styles.assignButtonText}>
            📍 Auto Assign Parking Slot
          </Text>
        </Pressable>
      </View>

      {/* Session Information Card (Appears after Auto Assign) */}
      {assignedSlot && (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Session Information</Text>

          <View style={styles.sessionInfoList}>
            <View style={[styles.infoRow, styles.infoRowBlue]}>
              <Text style={styles.infoLabel}>Vehicle Plate</Text>
              <Text style={styles.infoPlateValue}>{licensePlate}</Text>
            </View>

            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Vehicle Type</Text>
              <Text style={styles.infoValueCap}>{vehicleType}</Text>
            </View>

            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Entry Time</Text>
              <Text style={styles.infoValue}>
                {entryTime?.toLocaleTimeString('en-US', {
                  hour: '2-digit',
                  minute: '2-digit',
                  second: '2-digit',
                })}
              </Text>
            </View>

            <View style={[styles.infoRow, styles.infoRowGreen]}>
              <Text style={styles.infoLabel}>Assigned Slot</Text>
              <Text style={styles.infoSlotValue}>{assignedSlot.slotNumber}</Text>
            </View>

            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Parking Area</Text>
              <Text style={styles.infoValue}>
                Floor {selectedFloor} - Area {assignedSlot.area}
              </Text>
            </View>

            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Slot Status</Text>
              <View style={styles.assignedBadge}>
                <Text style={styles.assignedBadgeText}>Assigned</Text>
              </View>
            </View>
          </View>

          {ticketToast && (
            <View style={styles.toastBox}>
              <Text style={styles.toastText}>{ticketToast}</Text>
            </View>
          )}

          {/* Action Buttons */}
          <View style={styles.actionStack}>
            <Pressable
              onPress={handleCreateSession}
              style={styles.createSessionBtn}>
              <Text style={styles.createSessionBtnText}>
                ✓ Create Parking Session
              </Text>
            </Pressable>

            <View style={styles.dualActionRow}>
              <Pressable
                onPress={() =>
                  setTicketToast(
                    `🖨️ Ticket printed for ${licensePlate} (Slot ${assignedSlot.slotNumber})`
                  )
                }
                style={styles.outlineActionBtn}>
                <Text style={styles.outlineActionText}>🖨️ Print Ticket</Text>
              </Pressable>

              <Pressable
                onPress={handleOpenGateOnly}
                style={styles.outlineActionBtn}>
                <Text style={styles.outlineActionText}>🚧 Open Gate</Text>
              </Pressable>
            </View>

            <Pressable onPress={handleReset} style={styles.resetGhostBtn}>
              <Text style={styles.resetGhostText}>↻ Reset Form</Text>
            </Pressable>
          </View>
        </View>
      )}

      {/* Parking Slot Availability Card */}
      <View style={styles.card}>
        <View style={styles.availabilityHeader}>
          <Text style={styles.cardTitle}>Parking Slot Availability</Text>
          <Pressable
            onPress={refreshAvailability}
            style={styles.refreshBtn}>
            <Text style={styles.refreshBtnText}>↻ Refresh</Text>
          </Pressable>
        </View>

        {/* Big Blue Total Available Banner */}
        <View style={styles.blueBanner}>
          <Text style={styles.blueBannerLabel}>Total Available Slots</Text>
          <Text style={styles.blueBannerNumber}>{totalAvailable}</Text>
          <Text style={styles.blueBannerSub}>of {totalSlots} slots</Text>
        </View>

        {/* Floor Table */}
        <View style={styles.tableContainer}>
          <View style={styles.tableHeaderRow}>
            <Text style={[styles.th, { flex: 1.3, textAlign: 'left' }]}>
              Floor
            </Text>
            <Text style={styles.th}>Total</Text>
            <Text style={styles.th}>Avail</Text>
            <Text style={styles.th}>Occ</Text>
            <Text style={[styles.th, { flex: 1.5 }]}>Status</Text>
          </View>

          {floorSummaries.map((f) => {
            const pct = Math.round((f.available / f.total) * 100);
            const barColor =
              pct > 50 ? '#22c55e' : pct > 20 ? '#f97316' : '#ef4444';
            const isSelectedFloor = selectedFloor === f.floor.toString();

            return (
              <Pressable
                key={f.floor}
                onPress={() => setSelectedFloor(f.floor.toString())}
                style={[
                  styles.tableRow,
                  isSelectedFloor && styles.tableRowHighlight,
                ]}>
                <Text style={[styles.tdFloor, { flex: 1.3 }]}>
                  📍 Floor {f.floor}
                </Text>
                <Text style={styles.td}>{f.total}</Text>
                <Text style={styles.tdAvail}>{f.available}</Text>
                <Text style={styles.td}>{f.occupied}</Text>
                <View style={[styles.tdStatusCell, { flex: 1.5 }]}>
                  <View style={styles.miniProgressTrack}>
                    <View
                      style={[
                        styles.miniProgressFill,
                        { width: `${pct}%`, backgroundColor: barColor },
                      ]}
                    />
                  </View>
                  <Text style={styles.tdPctText}>{pct}%</Text>
                </View>
              </Pressable>
            );
          })}
        </View>

        {/* Status Legend */}
        <View style={styles.legendBox}>
          <Text style={styles.legendTitle}>Status Legend</Text>
          <View style={styles.legendRow}>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: '#22c55e' }]} />
              <Text style={styles.legendText}>Good (&gt;50%)</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: '#f97316' }]} />
              <Text style={styles.legendText}>Low (20-50%)</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: '#ef4444' }]} />
              <Text style={styles.legendText}>Critical (&lt;20%)</Text>
            </View>
          </View>
        </View>

        <Text style={styles.lastUpdatedText}>
          🕒 Last updated: {lastUpdated.toLocaleTimeString()}
        </Text>
      </View>

      {/* Session Created Success Overlay Modal */}
      <Modal
        visible={showSuccessModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowSuccessModal(false)}>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <View style={styles.successCircle}>
              <Text style={styles.successCheck}>✓</Text>
            </View>
            <Text style={styles.modalTitle}>Session Created!</Text>
            <Text style={styles.modalSub}>Parking ticket ready</Text>
            <Text style={styles.modalGateText}>Opening gate...</Text>
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
    padding: 16,
    paddingBottom: 32,
    gap: 16,
  },
  headerBlock: {
    gap: 2,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: '#111827',
  },
  subtitle: {
    fontSize: 13,
    color: '#6b7280',
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    gap: 14,
  },
  cardTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#111827',
  },
  fieldGroup: {
    gap: 8,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1f2937',
  },
  plateInput: {
    height: 58,
    borderWidth: 2,
    borderColor: '#d1d5db',
    borderRadius: 12,
    fontSize: 22,
    fontWeight: '800',
    textAlign: 'center',
    letterSpacing: 3,
    color: '#111827',
    backgroundColor: '#f9fafb',
  },
  quickPlatesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  quickPlateChip: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    backgroundColor: '#f3f4f6',
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  quickPlateChipActive: {
    backgroundColor: '#dbeafe',
    borderColor: '#3b82f6',
  },
  quickPlateText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#4b5563',
  },
  quickPlateTextActive: {
    color: '#1d4ed8',
    fontWeight: '700',
  },
  vehicleTypeRow: {
    flexDirection: 'row',
    gap: 8,
  },
  vehicleTypeCard: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#e5e7eb',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#ffffff',
  },
  vehicleTypeCardSelected: {
    borderColor: '#2563eb',
    backgroundColor: '#eff6ff',
  },
  vehicleTypeIcon: {
    fontSize: 22,
  },
  vehicleTypeLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#374151',
    textAlign: 'center',
  },
  vehicleTypeLabelSelected: {
    color: '#1d4ed8',
    fontWeight: '700',
  },
  floorGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  floorOptionBtn: {
    width: '31%',
    flexGrow: 1,
    paddingVertical: 10,
    paddingHorizontal: 10,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#e5e7eb',
    backgroundColor: '#ffffff',
    alignItems: 'center',
  },
  floorOptionBtnSelected: {
    borderColor: '#2563eb',
    backgroundColor: '#eff6ff',
  },
  floorOptionTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#111827',
  },
  floorOptionTitleSelected: {
    color: '#1d4ed8',
  },
  floorOptionAvail: {
    fontSize: 11,
    color: '#6b7280',
    marginTop: 2,
  },
  floorOptionAvailSelected: {
    color: '#2563eb',
    fontWeight: '600',
  },
  assignButton: {
    height: 54,
    backgroundColor: '#2563eb',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
  },
  assignButtonDisabled: {
    backgroundColor: '#93c5fd',
  },
  assignButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
  },
  sessionInfoList: {
    gap: 8,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#f9fafb',
    borderRadius: 10,
  },
  infoRowBlue: {
    backgroundColor: '#eff6ff',
    borderWidth: 1,
    borderColor: '#bfdbfe',
  },
  infoRowGreen: {
    backgroundColor: '#f0fdf4',
    borderWidth: 1,
    borderColor: '#bbf7d0',
  },
  infoLabel: {
    fontSize: 13,
    fontWeight: '500',
    color: '#374151',
  },
  infoPlateValue: {
    fontSize: 18,
    fontWeight: '800',
    color: '#111827',
    letterSpacing: 1.5,
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
  },
  infoValueCap: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
    textTransform: 'capitalize',
  },
  infoSlotValue: {
    fontSize: 22,
    fontWeight: '800',
    color: '#16a34a',
  },
  assignedBadge: {
    backgroundColor: '#dcfce7',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 999,
  },
  assignedBadgeText: {
    color: '#15803d',
    fontSize: 12,
    fontWeight: '700',
  },
  toastBox: {
    backgroundColor: '#eff6ff',
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#bfdbfe',
  },
  toastText: {
    fontSize: 12,
    color: '#1e40af',
    fontWeight: '600',
    textAlign: 'center',
  },
  actionStack: {
    gap: 10,
    marginTop: 4,
  },
  createSessionBtn: {
    height: 54,
    backgroundColor: '#16a34a',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  createSessionBtnText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
  },
  dualActionRow: {
    flexDirection: 'row',
    gap: 10,
  },
  outlineActionBtn: {
    flex: 1,
    height: 48,
    borderWidth: 2,
    borderColor: '#e5e7eb',
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ffffff',
  },
  outlineActionText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
  },
  resetGhostBtn: {
    height: 42,
    alignItems: 'center',
    justifyContent: 'center',
  },
  resetGhostText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6b7280',
  },
  availabilityHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  refreshBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  refreshBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#374151',
  },
  blueBanner: {
    backgroundColor: '#2563eb',
    borderRadius: 14,
    paddingVertical: 20,
    paddingHorizontal: 16,
    alignItems: 'center',
  },
  blueBannerLabel: {
    color: 'rgba(255,255,255,0.9)',
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 4,
  },
  blueBannerNumber: {
    color: '#ffffff',
    fontSize: 48,
    fontWeight: '800',
    lineHeight: 54,
  },
  blueBannerSub: {
    color: 'rgba(255,255,255,0.9)',
    fontSize: 16,
    fontWeight: '500',
    marginTop: 2,
  },
  tableContainer: {
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 10,
    overflow: 'hidden',
  },
  tableHeaderRow: {
    flexDirection: 'row',
    backgroundColor: '#f3f4f6',
    paddingVertical: 10,
    paddingHorizontal: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  th: {
    flex: 1,
    fontSize: 12,
    fontWeight: '700',
    color: '#374151',
    textAlign: 'center',
  },
  tableRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  tableRowHighlight: {
    backgroundColor: '#eff6ff',
  },
  tdFloor: {
    fontSize: 13,
    fontWeight: '700',
    color: '#111827',
  },
  td: {
    flex: 1,
    fontSize: 13,
    color: '#4b5563',
    textAlign: 'center',
    fontWeight: '500',
  },
  tdAvail: {
    flex: 1,
    fontSize: 15,
    fontWeight: '800',
    color: '#16a34a',
    textAlign: 'center',
  },
  tdStatusCell: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  miniProgressTrack: {
    flex: 1,
    height: 7,
    backgroundColor: '#e5e7eb',
    borderRadius: 999,
    overflow: 'hidden',
  },
  miniProgressFill: {
    height: '100%',
    borderRadius: 999,
  },
  tdPctText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#4b5563',
    width: 30,
    textAlign: 'right',
  },
  legendBox: {
    backgroundColor: '#f9fafb',
    borderRadius: 10,
    padding: 12,
    gap: 8,
  },
  legendTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#374151',
  },
  legendRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 8,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  legendDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  legendText: {
    fontSize: 12,
    color: '#4b5563',
  },
  lastUpdatedText: {
    fontSize: 12,
    color: '#6b7280',
    textAlign: 'center',
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  modalCard: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 32,
    alignItems: 'center',
    width: '100%',
    maxWidth: 360,
  },
  successCircle: {
    width: 84,
    height: 84,
    borderRadius: 42,
    backgroundColor: '#dcfce7',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  successCheck: {
    fontSize: 44,
    color: '#16a34a',
    fontWeight: '800',
  },
  modalTitle: {
    fontSize: 26,
    fontWeight: '800',
    color: '#111827',
    marginBottom: 6,
  },
  modalSub: {
    fontSize: 16,
    color: '#6b7280',
    marginBottom: 8,
  },
  modalGateText: {
    fontSize: 20,
    fontWeight: '800',
    color: '#2563eb',
  },
});
