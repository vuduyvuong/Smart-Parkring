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

import { useParking } from '@/context/parking-context';

interface CheckoutSessionDetails {
  ticketNumber: string;
  licensePlate: string;
  slotNumber: string;
  floor: number;
  entryTime: Date;
  exitTime: Date;
  duration: string;
  totalFee: number;
}

export default function CheckOutScreen() {
  const { sessions, completeCheckOutSession } = useParking();

  const [searchInput, setSearchInput] = useState('');
  const [session, setSession] = useState<CheckoutSessionDetails | null>(null);
  const [selectedPayment, setSelectedPayment] = useState<'cash' | 'qr' | 'card' | null>(
    null
  );
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [receiptToast, setReceiptToast] = useState<string | null>(null);

  const activeSessions = sessions.filter((s) => s.status === 'Active');

  const buildSessionFromQuery = (queryStr: string) => {
    const clean = queryStr.trim().toUpperCase();
    const matched = sessions.find(
      (s) =>
        s.vehicle.toUpperCase() === clean ||
        s.ticketNumber.toUpperCase() === clean ||
        s.id.toUpperCase() === clean
    );

    const entry = new Date();
    const hoursAgo = matched ? 3 : Math.floor(2 + Math.random() * 5);
    const minsAgo = matched ? 15 : Math.floor(10 + Math.random() * 45);
    entry.setHours(entry.getHours() - hoursAgo);
    entry.setMinutes(entry.getMinutes() - minsAgo);
    const exit = new Date();

    const hours = Math.floor(
      (exit.getTime() - entry.getTime()) / (1000 * 60 * 60)
    );
    const minutes = Math.floor(
      ((exit.getTime() - entry.getTime()) % (1000 * 60 * 60)) / (1000 * 60)
    );

    setSession({
      ticketNumber:
        matched?.ticketNumber ||
        (clean.startsWith('TKT-')
          ? clean
          : `TKT-${Math.floor(100000 + Math.random() * 900000)}`),
      licensePlate:
        matched?.vehicle ||
        (!clean.startsWith('TKT-') && clean
          ? clean
          : `ABC-${Math.floor(1000 + Math.random() * 9000)}`),
      slotNumber:
        matched?.slot.replace('-', '') ||
        `A${Math.floor(1 + Math.random() * 20)
          .toString()
          .padStart(2, '0')}`,
      floor: matched
        ? parseInt(matched.floor.replace(/\D/g, ''), 10) || 1
        : Math.floor(1 + Math.random() * 5),
      entryTime: entry,
      exitTime: exit,
      duration: matched?.duration || `${hours}h ${minutes}m`,
      totalFee:
        matched?.fee || parseFloat((hours * 5 + minutes * 0.1).toFixed(2)),
    });
    setSelectedPayment(null);
    setReceiptToast(null);
  };

  const handleSearch = () => {
    buildSessionFromQuery(searchInput);
  };

  const handleScanTicket = () => {
    const generatedTicket = `TKT-${Math.floor(100000 + Math.random() * 900000)}`;
    setSearchInput(generatedTicket);
    buildSessionFromQuery(generatedTicket);
  };

  const handleSelectPayment = (method: 'cash' | 'qr' | 'card') => {
    setSelectedPayment(method);
  };

  const handleProcessExit = (methodOverride?: 'cash' | 'qr' | 'card') => {
    const method = methodOverride || selectedPayment;
    if (!session || !method) return;
    setSelectedPayment(method);

    completeCheckOutSession({
      ticketNumber: session.ticketNumber,
      licensePlate: session.licensePlate,
      totalFee: session.totalFee,
      paymentMethod: method,
    });

    setShowSuccessModal(true);
    setTimeout(() => {
      setShowSuccessModal(false);
      setSession(null);
      setSearchInput('');
      setSelectedPayment(null);
      setReceiptToast(null);
    }, 2400);
  };

  const formatTime = (date: Date) =>
    date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });

  const formatDate = (date: Date) =>
    date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });

  return (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}>
      {/* Title */}
      <View style={styles.headerBlock}>
        <Text style={styles.title}>Vehicle Check-Out</Text>
        <Text style={styles.subtitle}>Process payment and exit management</Text>
      </View>

      {/* Find Parking Session Card (Matches Figma `Qce`) */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Find Parking Session</Text>

        <View style={styles.fieldGroup}>
          <Text style={styles.label}>Ticket Number or License Plate</Text>
          <View style={styles.searchBarRow}>
            <TextInput
              value={searchInput}
              onChangeText={(txt) => setSearchInput(txt.toUpperCase())}
              placeholder="Enter ticket # or plate"
              placeholderTextColor="#9ca3af"
              autoCapitalize="characters"
              onSubmitEditing={handleSearch}
              style={styles.searchInput}
            />
            <Pressable onPress={handleSearch} style={styles.searchBtn}>
              <Text style={styles.searchBtnIcon}>🔍</Text>
            </Pressable>
          </View>
        </View>

        {/* Quick-select Active Vehicles */}
        {activeSessions.length > 0 && (
          <View style={styles.quickSessionsWrap}>
            <Text style={styles.quickSessionsLabel}>Active vehicles:</Text>
            <View style={styles.quickChipsRow}>
              {activeSessions.map((s) => (
                <Pressable
                  key={s.id}
                  onPress={() => {
                    setSearchInput(s.vehicle);
                    buildSessionFromQuery(s.vehicle);
                  }}
                  style={[
                    styles.quickSessionChip,
                    session?.licensePlate === s.vehicle &&
                      styles.quickSessionChipActive,
                  ]}>
                  <Text
                    style={[
                      styles.quickSessionChipText,
                      session?.licensePlate === s.vehicle &&
                        styles.quickSessionChipTextActive,
                    ]}>
                    {s.vehicle} ({s.slot})
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>
        )}

        <Pressable onPress={handleScanTicket} style={styles.scanTicketBtn}>
          <Text style={styles.scanTicketBtnText}>📷 Scan Parking Ticket</Text>
        </Pressable>
      </View>

      {/* Parking Session Details Card */}
      {session && (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Parking Session Details</Text>

          <View style={styles.topTicketRow}>
            <View>
              <Text style={styles.metaSmall}>Ticket Number</Text>
              <Text style={styles.ticketNumberVal}>{session.ticketNumber}</Text>
            </View>
            <View style={{ alignItems: 'flex-end' }}>
              <Text style={styles.metaSmall}>License Plate</Text>
              <Text style={styles.plateNumberVal}>{session.licensePlate}</Text>
            </View>
          </View>

          <View style={styles.divider} />

          <View style={styles.twoColGrid}>
            <View style={styles.miniDetailBox}>
              <View style={[styles.miniIconBox, { backgroundColor: '#dcfce7' }]}>
                <Text style={styles.miniIcon}>📍</Text>
              </View>
              <View>
                <Text style={styles.metaSmall}>Parking Slot</Text>
                <Text style={styles.detailPrimaryVal}>{session.slotNumber}</Text>
                <Text style={styles.metaTiny}>Floor {session.floor}</Text>
              </View>
            </View>

            <View style={styles.miniDetailBox}>
              <View style={[styles.miniIconBox, { backgroundColor: '#dbeafe' }]}>
                <Text style={styles.miniIcon}>🕒</Text>
              </View>
              <View>
                <Text style={styles.metaSmall}>Duration</Text>
                <Text style={styles.detailPrimaryVal}>{session.duration}</Text>
                <Text style={styles.metaTiny}>Standard Rate</Text>
              </View>
            </View>
          </View>

          <View style={styles.divider} />

          <View style={styles.timestampsStack}>
            <View style={styles.timestampRow}>
              <Text style={styles.timestampLabel}>Entry Time:</Text>
              <Text style={styles.timestampVal}>
                {formatTime(session.entryTime)} - {formatDate(session.entryTime)}
              </Text>
            </View>
            <View style={styles.timestampRow}>
              <Text style={styles.timestampLabel}>Exit Time:</Text>
              <Text style={styles.timestampVal}>
                {formatTime(session.exitTime)} - {formatDate(session.exitTime)}
              </Text>
            </View>
          </View>

          <View style={styles.divider} />

          <View style={styles.totalAmountBanner}>
            <View style={styles.totalAmountLeft}>
              <Text style={styles.dollarCircle}>💲</Text>
              <Text style={styles.totalAmountLabel}>Total Amount</Text>
            </View>
            <Text style={styles.totalAmountValue}>
              ${session.totalFee.toFixed(2)}
            </Text>
          </View>
        </View>
      )}

      {/* Payment Method Card */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Payment Method</Text>

        {session ? (
          <View style={styles.paymentStack}>
            {/* Cash Payment */}
            <Pressable
              onPress={() => handleSelectPayment('cash')}
              style={[
                styles.paymentOptionCard,
                selectedPayment === 'cash' && styles.paymentCashActive,
              ]}>
              <View style={[styles.payIconBox, { backgroundColor: '#dcfce7' }]}>
                <Text style={styles.payIconText}>💵</Text>
              </View>
              <View style={styles.payTextCol}>
                <Text style={styles.payTitle}>Cash Payment</Text>
                <Text style={styles.paySub}>Pay with cash at counter</Text>
              </View>
              {selectedPayment === 'cash' && (
                <Text style={[styles.payCheck, { color: '#16a34a' }]}>✓</Text>
              )}
            </Pressable>

            {/* QR Payment */}
            <Pressable
              onPress={() => handleSelectPayment('qr')}
              style={[
                styles.paymentOptionCard,
                selectedPayment === 'qr' && styles.paymentQrActive,
              ]}>
              <View style={[styles.payIconBox, { backgroundColor: '#f3e8ff' }]}>
                <Text style={styles.payIconText}>📱</Text>
              </View>
              <View style={styles.payTextCol}>
                <Text style={styles.payTitle}>QR Payment</Text>
                <Text style={styles.paySub}>Scan QR code to pay</Text>
              </View>
              {selectedPayment === 'qr' && (
                <Text style={[styles.payCheck, { color: '#9333ea' }]}>✓</Text>
              )}
            </Pressable>

            {/* Credit Card */}
            <Pressable
              onPress={() => handleSelectPayment('card')}
              style={[
                styles.paymentOptionCard,
                selectedPayment === 'card' && styles.paymentCardActive,
              ]}>
              <View style={[styles.payIconBox, { backgroundColor: '#dbeafe' }]}>
                <Text style={styles.payIconText}>💳</Text>
              </View>
              <View style={styles.payTextCol}>
                <Text style={styles.payTitle}>Credit Card</Text>
                <Text style={styles.paySub}>Pay with credit/debit card</Text>
              </View>
              {selectedPayment === 'card' && (
                <Text style={[styles.payCheck, { color: '#2563eb' }]}>✓</Text>
              )}
            </Pressable>

            <View style={styles.divider} />

            {receiptToast && (
              <View style={styles.receiptToastBox}>
                <Text style={styles.receiptToastText}>{receiptToast}</Text>
              </View>
            )}

            <Pressable
              onPress={() =>
                setReceiptToast(
                  `🧾 Receipt printed for ${session.ticketNumber} ($${session.totalFee.toFixed(2)})`
                )
              }
              style={styles.printReceiptBtn}>
              <Text style={styles.printReceiptText}>🖨️ Print Receipt</Text>
            </Pressable>

            <Pressable
              onPress={() => handleProcessExit()}
              disabled={!selectedPayment}
              style={[
                styles.openExitGateBtn,
                !selectedPayment && styles.openExitGateBtnDisabled,
              ]}>
              <Text style={styles.openExitGateText}>🚧 Open Exit Gate</Text>
            </Pressable>
          </View>
        ) : (
          <View style={styles.emptySessionBox}>
            <View style={styles.emptyIconCircle}>
              <Text style={styles.emptyIconText}>🔍</Text>
            </View>
            <Text style={styles.emptyTitle}>No Session Selected</Text>
            <Text style={styles.emptySub}>
              Search for a parking session to process payment
            </Text>
          </View>
        )}
      </View>

      {/* Payment Successful Modal */}
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
            <Text style={styles.modalTitle}>Payment Successful!</Text>
            <Text style={styles.modalSub}>Thank you for parking with us</Text>
            <Text style={styles.modalExitText}>Exit gate opening...</Text>
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
    color: '#374151',
  },
  searchBarRow: {
    flexDirection: 'row',
    gap: 8,
  },
  searchInput: {
    flex: 1,
    height: 50,
    borderWidth: 1.5,
    borderColor: '#d1d5db',
    borderRadius: 10,
    paddingHorizontal: 14,
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    backgroundColor: '#f9fafb',
  },
  searchBtn: {
    width: 54,
    height: 50,
    backgroundColor: '#2563eb',
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchBtnIcon: {
    fontSize: 18,
  },
  quickSessionsWrap: {
    gap: 6,
  },
  quickSessionsLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6b7280',
  },
  quickChipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  quickSessionChip: {
    backgroundColor: '#f3f4f6',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  quickSessionChipActive: {
    backgroundColor: '#dbeafe',
    borderColor: '#3b82f6',
  },
  quickSessionChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#374151',
  },
  quickSessionChipTextActive: {
    color: '#1d4ed8',
    fontWeight: '700',
  },
  scanTicketBtn: {
    height: 50,
    borderWidth: 1.5,
    borderColor: '#d1d5db',
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ffffff',
  },
  scanTicketBtnText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#111827',
  },
  topTicketRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  metaSmall: {
    fontSize: 12,
    color: '#6b7280',
    marginBottom: 2,
  },
  metaTiny: {
    fontSize: 11,
    color: '#6b7280',
  },
  ticketNumberVal: {
    fontSize: 17,
    fontWeight: '700',
    color: '#111827',
  },
  plateNumberVal: {
    fontSize: 18,
    fontWeight: '800',
    color: '#2563eb',
    letterSpacing: 1,
  },
  divider: {
    height: 1,
    backgroundColor: '#e5e7eb',
  },
  twoColGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  miniDetailBox: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  miniIconBox: {
    width: 38,
    height: 38,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  miniIcon: {
    fontSize: 16,
  },
  detailPrimaryVal: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
  },
  timestampsStack: {
    gap: 8,
  },
  timestampRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  timestampLabel: {
    fontSize: 13,
    color: '#6b7280',
  },
  timestampVal: {
    fontSize: 13,
    fontWeight: '600',
    color: '#111827',
  },
  totalAmountBanner: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#eff6ff',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: '#bfdbfe',
  },
  totalAmountLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  dollarCircle: {
    fontSize: 20,
  },
  totalAmountLabel: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
  },
  totalAmountValue: {
    fontSize: 26,
    fontWeight: '800',
    color: '#2563eb',
  },
  paymentStack: {
    gap: 12,
  },
  paymentOptionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#e5e7eb',
    backgroundColor: '#ffffff',
    gap: 14,
  },
  paymentCashActive: {
    borderColor: '#22c55e',
    backgroundColor: '#f0fdf4',
  },
  paymentQrActive: {
    borderColor: '#a855f7',
    backgroundColor: '#faf5ff',
  },
  paymentCardActive: {
    borderColor: '#3b82f6',
    backgroundColor: '#eff6ff',
  },
  payIconBox: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  payIconText: {
    fontSize: 22,
  },
  payTextCol: {
    flex: 1,
    gap: 2,
  },
  payTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
  },
  paySub: {
    fontSize: 12,
    color: '#6b7280',
  },
  payCheck: {
    fontSize: 22,
    fontWeight: '800',
  },
  receiptToastBox: {
    backgroundColor: '#f0fdf4',
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#bbf7d0',
  },
  receiptToastText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#15803d',
    textAlign: 'center',
  },
  printReceiptBtn: {
    height: 50,
    borderWidth: 1.5,
    borderColor: '#d1d5db',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  printReceiptText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#111827',
  },
  openExitGateBtn: {
    height: 54,
    backgroundColor: '#16a34a',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  openExitGateBtnDisabled: {
    backgroundColor: '#86efac',
  },
  openExitGateText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
  },
  emptySessionBox: {
    paddingVertical: 40,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  emptyIconCircle: {
    width: 76,
    height: 76,
    borderRadius: 38,
    backgroundColor: '#f3f4f6',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  emptyIconText: {
    fontSize: 32,
  },
  emptyTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#111827',
  },
  emptySub: {
    fontSize: 13,
    color: '#6b7280',
    textAlign: 'center',
    maxWidth: 260,
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
    marginBottom: 10,
  },
  modalExitText: {
    fontSize: 20,
    fontWeight: '800',
    color: '#16a34a',
  },
});
