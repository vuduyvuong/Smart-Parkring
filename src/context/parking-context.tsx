import React, { createContext, useContext, useEffect, useState } from 'react';
import { mqttService, MQTTMessagePayload } from '@/services/mqtt-service';
import { firebaseService } from '@/services/firebase-service';

export type SlotStatus = 'available' | 'occupied' | 'reserved' | 'maintenance' | 'locked';
export type VehicleType = 'car' | 'motorcycle' | 'truck' | 'disabled';

export interface ParkingSlotItem {
  id: string;
  floor: number;
  area: 'A' | 'B' | 'C' | 'D' | 'E';
  slotNumber: string;
  status: SlotStatus;
  vehicleType: VehicleType;
  licensePlate?: string;
}

export interface FloorAvailabilitySummary {
  floor: number;
  area: 'A' | 'B' | 'C' | 'D' | 'E';
  total: number;
  available: number;
  occupied: number;
}

export interface ParkingSessionItem {
  id: string;
  ticketNumber: string;
  vehicle: string;
  vehicleType: VehicleType;
  floor: string;
  slot: string;
  entryTime: string;
  entryDate: string;
  duration: string;
  status: 'Active' | 'Completed';
  fee: number;
}

export interface BookingItem {
  id: string;
  customer: string;
  vehicle: string;
  slot: string;
  date: string;
  time: string;
  status: 'Confirmed' | 'Pending' | 'Cancelled';
}

export interface ExceptionCaseItem {
  id: string;
  type: string;
  vehicle: string;
  slot: string;
  time: string;
  severity: 'High' | 'Medium' | 'Low';
  resolved?: boolean;
}

export interface ZoneMonitoringFloor {
  floor: string;
  zones: {
    name: string;
    occupied: number;
    total: number;
    status: 'normal' | 'high' | 'critical';
  }[];
}

export type MoreSectionType =
  | 'bookings'
  | 'revenue'
  | 'analytics'
  | 'users'
  | 'exceptions'
  | 'settings';

interface ParkingContextValue {
  slots: ParkingSlotItem[];
  floorSummaries: FloorAvailabilitySummary[];
  sessions: ParkingSessionItem[];
  bookings: BookingItem[];
  exceptions: ExceptionCaseItem[];
  zoneMonitoring: ZoneMonitoringFloor[];
  revenueToday: number;
  totalVehiclesToday: number;
  lastUpdated: Date;
  isDrawerOpen: boolean;
  setIsDrawerOpen: (open: boolean) => void;
  activeMoreSection: MoreSectionType;
  setActiveMoreSection: (section: MoreSectionType) => void;
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  mqttConnected: boolean;
  mqttStatusText: string;
  lastMqttMessage: MQTTMessagePayload | null;
  publishMqtt: (topic: string, data: object | string) => boolean;
  reconnectMqtt: (host?: string, port?: number) => void;
  updateSlotStatus: (id: string, status: SlotStatus) => void;
  lockSlot: (id: string) => void;
  addNewSlot: (params: {
    floor: number;
    area: 'A' | 'B' | 'C';
    slotNumber: string;
    vehicleType: VehicleType;
  }) => void;
  autoAssignSlotForFloor: (floor: number) => ParkingSlotItem | null;
  createCheckInSession: (params: {
    licensePlate: string;
    vehicleType: VehicleType;
    floor: number;
    slot: ParkingSlotItem;
    entryTime: Date;
  }) => ParkingSessionItem;
  completeCheckOutSession: (params: {
    ticketNumber: string;
    licensePlate: string;
    totalFee: number;
    paymentMethod: 'cash' | 'qr' | 'card';
  }) => void;
  refreshAvailability: () => void;
  toggleBookingStatus: (id: string) => void;
  addBooking: (booking: Omit<BookingItem, 'id'>) => void;
  resolveException: (id: string) => void;
}

const INITIAL_FLOOR_SUMMARIES: FloorAvailabilitySummary[] = [
  { floor: 1, area: 'A', total: 100, available: 23, occupied: 77 },
  { floor: 2, area: 'B', total: 100, available: 45, occupied: 55 },
  { floor: 3, area: 'C', total: 100, available: 67, occupied: 33 },
  { floor: 4, area: 'D', total: 100, available: 38, occupied: 62 },
  { floor: 5, area: 'E', total: 100, available: 82, occupied: 18 },
];

const SAMPLE_PLATES = [
  'ABC-1234',
  'XYZ-5678',
  'LMN-9012',
  'DEF-3456',
  'GHI-7890',
  'JKL-2468',
  'MNO-1357',
  'PQR-8642',
  'STU-9753',
  'VWX-4826',
];

function generateInitialSlots(): ParkingSlotItem[] {
  const result: ParkingSlotItem[] = [];
  const areas: ('A' | 'B' | 'C')[] = ['A', 'B', 'C'];
  const vehicleTypes: VehicleType[] = ['car', 'motorcycle', 'truck', 'disabled'];

  let seed = 42;
  const nextRand = () => {
    seed = (seed * 1664525 + 1013904223) % 4294967296;
    return seed / 4294967296;
  };

  for (let floor = 1; floor <= 5; floor++) {
    for (const area of areas) {
      for (let num = 1; num <= 20; num++) {
        const r = nextRand();
        let status: SlotStatus = 'available';
        if (r < 0.36) status = 'available';
        else if (r < 0.72) status = 'occupied';
        else if (r < 0.84) status = 'reserved';
        else if (r < 0.93) status = 'maintenance';
        else status = 'locked';

        const vt = vehicleTypes[Math.floor(nextRand() * vehicleTypes.length)];
        const plateNum = Math.floor(1000 + nextRand() * 9000);
        const prefix = SAMPLE_PLATES[Math.floor(nextRand() * SAMPLE_PLATES.length)].split('-')[0];

        result.push({
          id: `${floor}-${area}-${num}`,
          floor,
          area,
          slotNumber: `${area}${num.toString().padStart(2, '0')}`,
          status,
          vehicleType: vt,
          licensePlate: status === 'occupied' ? `${prefix}-${plateNum}` : undefined,
        });
      }
    }
  }
  return result;
}

const INITIAL_SESSIONS: ParkingSessionItem[] = [
  {
    id: 'PS-4521',
    ticketNumber: 'TKT-452108',
    vehicle: 'ABC-1234',
    vehicleType: 'car',
    floor: 'B1',
    slot: 'A-45',
    entryTime: '10:30 AM',
    entryDate: 'May 16, 2026',
    duration: '2h 15m',
    status: 'Active',
    fee: 11.5,
  },
  {
    id: 'PS-4520',
    ticketNumber: 'TKT-452019',
    vehicle: 'XYZ-5678',
    vehicleType: 'car',
    floor: 'G',
    slot: 'C-23',
    entryTime: '09:15 AM',
    entryDate: 'May 16, 2026',
    duration: '3h 45m',
    status: 'Active',
    fee: 19.5,
  },
  {
    id: 'PS-4519',
    ticketNumber: 'TKT-451932',
    vehicle: 'LMN-9012',
    vehicleType: 'motorcycle',
    floor: 'B2',
    slot: 'D-12',
    entryTime: '11:00 AM',
    entryDate: 'May 16, 2026',
    duration: '1h 30m',
    status: 'Active',
    fee: 8.0,
  },
  {
    id: 'PS-4518',
    ticketNumber: 'TKT-451804',
    vehicle: 'DEF-3456',
    vehicleType: 'car',
    floor: 'B1',
    slot: 'B-78',
    entryTime: '08:45 AM',
    entryDate: 'May 16, 2026',
    duration: '4h 15m',
    status: 'Completed',
    fee: 21.5,
  },
  {
    id: 'PS-4517',
    ticketNumber: 'TKT-451789',
    vehicle: 'GHI-7890',
    vehicleType: 'truck',
    floor: 'G',
    slot: 'E-34',
    entryTime: '10:00 AM',
    entryDate: 'May 16, 2026',
    duration: '2h 30m',
    status: 'Completed',
    fee: 13.0,
  },
];

const INITIAL_BOOKINGS: BookingItem[] = [
  {
    id: 'BK-1001',
    customer: 'Sarah Johnson',
    vehicle: 'BMW X5',
    slot: 'A-12',
    date: 'May 16, 2026',
    time: '2:00 PM - 5:00 PM',
    status: 'Confirmed',
  },
  {
    id: 'BK-1002',
    customer: 'Mike Chen',
    vehicle: 'Tesla Model 3',
    slot: 'C-45',
    date: 'May 16, 2026',
    time: '3:30 PM - 6:30 PM',
    status: 'Confirmed',
  },
  {
    id: 'BK-1003',
    customer: 'Emily Davis',
    vehicle: 'Honda Accord',
    slot: 'B-23',
    date: 'May 17, 2026',
    time: '9:00 AM - 12:00 PM',
    status: 'Pending',
  },
  {
    id: 'BK-1004',
    customer: 'Robert Wilson',
    vehicle: 'Audi A4',
    slot: 'D-67',
    date: 'May 17, 2026',
    time: '1:00 PM - 4:00 PM',
    status: 'Confirmed',
  },
];

const INITIAL_EXCEPTIONS: ExceptionCaseItem[] = [
  {
    id: 'EX-301',
    type: 'Overstay',
    vehicle: 'ABC-1234',
    slot: 'A-45',
    time: '2h 15m over',
    severity: 'Medium',
  },
  {
    id: 'EX-302',
    type: 'Unauthorized Entry',
    vehicle: 'XYZ-9999',
    slot: 'B-12',
    time: '15m ago',
    severity: 'High',
  },
  {
    id: 'EX-303',
    type: 'Payment Failed',
    vehicle: 'LMN-5678',
    slot: 'C-34',
    time: '30m ago',
    severity: 'Low',
  },
];

const INITIAL_ZONE_MONITORING: ZoneMonitoringFloor[] = [
  {
    floor: 'Ground Floor',
    zones: [
      { name: 'Zone A', occupied: 18, total: 25, status: 'normal' },
      { name: 'Zone B', occupied: 22, total: 25, status: 'high' },
      { name: 'Zone C', occupied: 12, total: 25, status: 'normal' },
    ],
  },
  {
    floor: 'Basement 1',
    zones: [
      { name: 'Zone A', occupied: 25, total: 30, status: 'high' },
      { name: 'Zone B', occupied: 28, total: 30, status: 'critical' },
      { name: 'Zone C', occupied: 20, total: 30, status: 'normal' },
    ],
  },
  {
    floor: 'Basement 2',
    zones: [
      { name: 'Zone A', occupied: 15, total: 30, status: 'normal' },
      { name: 'Zone B', occupied: 18, total: 30, status: 'normal' },
      { name: 'Zone C', occupied: 22, total: 30, status: 'high' },
    ],
  },
];

export const PEAK_HOUR_DATA = [
  { hour: '6 AM', vehicles: 12 },
  { hour: '7 AM', vehicles: 35 },
  { hour: '8 AM', vehicles: 78 },
  { hour: '9 AM', vehicles: 125 },
  { hour: '10 AM', vehicles: 98 },
  { hour: '11 AM', vehicles: 85 },
  { hour: '12 PM', vehicles: 105 },
  { hour: '1 PM', vehicles: 92 },
  { hour: '2 PM', vehicles: 88 },
  { hour: '3 PM', vehicles: 95 },
  { hour: '4 PM', vehicles: 115 },
  { hour: '5 PM', vehicles: 135 },
  { hour: '6 PM', vehicles: 145 },
  { hour: '7 PM', vehicles: 98 },
];

export const OCCUPANCY_PIE_DATA = [
  { name: 'Occupied', value: 342, percent: 61, color: '#3b82f6' },
  { name: 'Available', value: 158, percent: 28, color: '#10b981' },
  { name: 'Reserved', value: 45, percent: 8, color: '#f59e0b' },
  { name: 'Maintenance', value: 12, percent: 2, color: '#ef4444' },
];

export const FLOOR_COMPARISON_DATA = [
  { floor: 'Ground', occupied: 85, available: 35, capacity: 120 },
  { floor: 'B1', occupied: 98, available: 22, capacity: 120 },
  { floor: 'B2', occupied: 75, available: 45, capacity: 120 },
  { floor: 'B3', occupied: 84, available: 36, capacity: 120 },
  { floor: 'Reserved', occupied: 45, available: 20, capacity: 65 },
];

export const WEEKLY_REVENUE_DATA = [
  { day: 'Mon', revenue: 4500, target: 5000 },
  { day: 'Tue', revenue: 5200, target: 5000 },
  { day: 'Wed', revenue: 4800, target: 5000 },
  { day: 'Thu', revenue: 6100, target: 5000 },
  { day: 'Fri', revenue: 7200, target: 5000 },
  { day: 'Sat', revenue: 8500, target: 5000 },
  { day: 'Sun', revenue: 6800, target: 5000 },
];

export const AI_METRICS_DATA = [
  { label: 'AI Efficiency', value: 94, color: '#2563eb' },
  { label: 'Optimization Rate', value: 87, color: '#16a34a' },
  { label: 'Response Time', value: 98, color: '#9333ea' },
];

export const AI_RECENT_ALLOCATIONS = [
  { vehicle: 'ABC-1234', slot: 'B1-A45', confidence: 98, time: 'Just now' },
  { vehicle: 'XYZ-5678', slot: 'G-C23', confidence: 95, time: '2 min ago' },
  { vehicle: 'LMN-9012', slot: 'B2-D12', confidence: 92, time: '5 min ago' },
];

const ParkingContext = createContext<ParkingContextValue | null>(null);

export function ParkingProvider({ children }: { children: React.ReactNode }) {
  const [slots, setSlots] = useState<ParkingSlotItem[]>(() => generateInitialSlots());
  const [floorSummaries, setFloorSummaries] =
    useState<FloorAvailabilitySummary[]>(INITIAL_FLOOR_SUMMARIES);
  const [sessions, setSessions] = useState<ParkingSessionItem[]>(INITIAL_SESSIONS);
  const [bookings, setBookings] = useState<BookingItem[]>(INITIAL_BOOKINGS);
  const [exceptions, setExceptions] = useState<ExceptionCaseItem[]>(INITIAL_EXCEPTIONS);
  const [zoneMonitoring] = useState<ZoneMonitoringFloor[]>(INITIAL_ZONE_MONITORING);
  const [revenueToday, setRevenueToday] = useState<number>(8542);
  const [totalVehiclesToday, setTotalVehiclesToday] = useState<number>(342);
  const [lastUpdated, setLastUpdated] = useState<Date>(() => new Date());
  const [isDrawerOpen, setIsDrawerOpen] = useState<boolean>(false);
  const [activeMoreSection, setActiveMoreSection] = useState<MoreSectionType>('bookings');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [mqttConnected, setMqttConnected] = useState<boolean>(false);
  const [mqttStatusText, setMqttStatusText] = useState<string>('Initializing MQTT...');
  const [lastMqttMessage, setLastMqttMessage] = useState<MQTTMessagePayload | null>(null);

  // Khởi tạo MQTT kết nối tới HiveMQ và Firebase
  useEffect(() => {
    firebaseService.init();

    const unsubStatus = mqttService.onStatusChange((connected, text) => {
      setMqttConnected(connected);
      setMqttStatusText(text);
    });

    const unsubMsg = mqttService.onMessage((payload) => {
      setLastMqttMessage(payload);

      // Xử lý các topic và đồng bộ Firebase
      switch (payload.topic) {
        case 'smartparking/telemetry':
          // Lưu dữ liệu telemetry lên Firebase
          firebaseService.logTelemetry(payload.data);
          break;

        case 'smartparking/status':
          // Cập nhật slot đỗ xe từ cảm biến / thiết bị IoT
          if (payload.data && typeof payload.data === 'object') {
            const { slotId, status, licensePlate } = payload.data;
            if (slotId && status) {
              setSlots((prev) =>
                prev.map((s) =>
                  s.id === slotId || s.slotNumber.toUpperCase() === String(slotId).toUpperCase()
                    ? {
                        ...s,
                        status: status as SlotStatus,
                        licensePlate: status === 'occupied' ? licensePlate || s.licensePlate : undefined,
                      }
                    : s
                )
              );
              firebaseService.syncSlotStatus(slotId, status, payload.data);
            }
          }
          break;

        case 'smartparking/event':
          // Sự kiện xe qua cổng, quẹt thẻ...
          firebaseService.logEvent('GATE_EVENT', payload.data);
          break;

        case 'smartparking/alert':
          // Cảnh báo đỗ sai chỗ, quá giờ...
          if (payload.data) {
            const newEx: ExceptionCaseItem = {
              id: `EX-${Math.floor(300 + Math.random() * 699)}`,
              type: payload.data.type || 'Sensor Alert',
              vehicle: payload.data.vehicle || 'Unknown',
              slot: payload.data.slot || 'N/A',
              time: 'Just now',
              severity: payload.data.severity || 'Medium',
            };
            setExceptions((prev) => [newEx, ...prev]);
            firebaseService.logAlert(newEx);
          }
          break;
      }
    });

    // Kết nối tới HiveMQ broker
    mqttService.connect({
      host: '172.20.10.2',
      port: 1883,
    });

    return () => {
      unsubStatus();
      unsubMsg();
    };
  }, []);

  const publishMqtt = (topic: string, data: object | string) => {
    return mqttService.publish(topic, data);
  };

  const reconnectMqtt = (host?: string, port?: number) => {
    mqttService.connect({ host, port });
  };

  const updateSlotStatus = (id: string, status: SlotStatus) => {
    setSlots((prev) =>
      prev.map((slot) =>
        slot.id === id
          ? {
              ...slot,
              status,
              licensePlate:
                status === 'occupied' ? slot.licensePlate || 'NEW-1024' : undefined,
            }
          : slot
      )
    );
    setLastUpdated(new Date());
  };

  const lockSlot = (id: string) => {
    updateSlotStatus(id, 'locked');
  };

  const addNewSlot = ({
    floor,
    area,
    slotNumber,
    vehicleType,
  }: {
    floor: number;
    area: 'A' | 'B' | 'C';
    slotNumber: string;
    vehicleType: VehicleType;
  }) => {
    const cleanSlotNumber = slotNumber.trim().toUpperCase() || `${area}21`;
    const newSlot: ParkingSlotItem = {
      id: `${floor}-${area}-${Date.now()}`,
      floor,
      area,
      slotNumber: cleanSlotNumber,
      status: 'available',
      vehicleType,
    };
    setSlots((prev) => [newSlot, ...prev]);
    setFloorSummaries((prev) =>
      prev.map((f) =>
        f.floor === floor
          ? { ...f, total: f.total + 1, available: f.available + 1 }
          : f
      )
    );
    setLastUpdated(new Date());
  };

  const autoAssignSlotForFloor = (floor: number): ParkingSlotItem | null => {
    const availableInGrid = slots.filter(
      (s) => s.floor === floor && s.status === 'available'
    );
    if (availableInGrid.length > 0) {
      return availableInGrid[Math.floor(Math.random() * availableInGrid.length)];
    }
    const areaMap: Record<number, 'A' | 'B' | 'C' | 'D' | 'E'> = {
      1: 'A',
      2: 'B',
      3: 'C',
      4: 'D',
      5: 'E',
    };
    const area = areaMap[floor] || 'A';
    const num = Math.floor(1 + Math.random() * 99)
      .toString()
      .padStart(2, '0');
    return {
      id: `${floor}-${area}-${num}`,
      floor,
      area,
      slotNumber: `${area}${num}`,
      status: 'available',
      vehicleType: 'car',
    };
  };

  const createCheckInSession = ({
    licensePlate,
    vehicleType,
    floor,
    slot,
    entryTime,
  }: {
    licensePlate: string;
    vehicleType: VehicleType;
    floor: number;
    slot: ParkingSlotItem;
    entryTime: Date;
  }): ParkingSessionItem => {
    const nextNum = 4522 + sessions.length;
    const newSession: ParkingSessionItem = {
      id: `PS-${nextNum}`,
      ticketNumber: `TKT-${Math.floor(100000 + Math.random() * 900000)}`,
      vehicle: licensePlate.toUpperCase(),
      vehicleType,
      floor: `F${floor}`,
      slot: slot.slotNumber,
      entryTime: entryTime.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
      }),
      entryDate: entryTime.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      }),
      duration: '0h 01m',
      status: 'Active',
      fee: 5.0,
    };

    setSessions((prev) => [newSession, ...prev]);
    setSlots((prev) =>
      prev.map((s) =>
        s.id === slot.id
          ? {
              ...s,
              status: 'occupied',
              licensePlate: licensePlate.toUpperCase(),
              vehicleType,
            }
          : s
      )
    );
    setFloorSummaries((prev) =>
      prev.map((f) =>
        f.floor === floor && f.available > 0
          ? { ...f, available: f.available - 1, occupied: f.occupied + 1 }
          : f
      )
    );
    setTotalVehiclesToday((prev) => prev + 1);
    setLastUpdated(new Date());
    return newSession;
  };

  const completeCheckOutSession = ({
    ticketNumber,
    licensePlate,
    totalFee,
  }: {
    ticketNumber: string;
    licensePlate: string;
    totalFee: number;
    paymentMethod: 'cash' | 'qr' | 'card';
  }) => {
    setSessions((prev) =>
      prev.map((s) =>
        s.ticketNumber.toUpperCase() === ticketNumber.toUpperCase() ||
        s.vehicle.toUpperCase() === licensePlate.toUpperCase()
          ? { ...s, status: 'Completed', fee: totalFee }
          : s
      )
    );
    setSlots((prev) =>
      prev.map((s) =>
        s.licensePlate?.toUpperCase() === licensePlate.toUpperCase()
          ? { ...s, status: 'available', licensePlate: undefined }
          : s
      )
    );
    setRevenueToday((prev) => Math.round((prev + totalFee) * 100) / 100);
    setLastUpdated(new Date());
  };

  const refreshAvailability = () => {
    setLastUpdated(new Date());
  };

  const toggleBookingStatus = (id: string) => {
    setBookings((prev) =>
      prev.map((b) =>
        b.id === id
          ? {
              ...b,
              status: b.status === 'Confirmed' ? 'Pending' : 'Confirmed',
            }
          : b
      )
    );
  };

  const addBooking = (booking: Omit<BookingItem, 'id'>) => {
    const nextId = `BK-${1005 + bookings.length}`;
    setBookings((prev) => [{ id: nextId, ...booking }, ...prev]);
  };

  const resolveException = (id: string) => {
    setExceptions((prev) => prev.filter((item) => item.id !== id));
  };

  const value: ParkingContextValue = {
    slots,
    floorSummaries,
    sessions,
    bookings,
    exceptions,
    zoneMonitoring,
    revenueToday,
    totalVehiclesToday,
    lastUpdated,
    isDrawerOpen,
    setIsDrawerOpen,
    activeMoreSection,
    setActiveMoreSection,
    searchQuery,
    setSearchQuery,
    mqttConnected,
    mqttStatusText,
    lastMqttMessage,
    publishMqtt,
    reconnectMqtt,
    updateSlotStatus,
    lockSlot,
    addNewSlot,
    autoAssignSlotForFloor,
    createCheckInSession,
    completeCheckOutSession,
    refreshAvailability,
    toggleBookingStatus,
    addBooking,
    resolveException,
  };

  return <ParkingContext.Provider value={value}>{children}</ParkingContext.Provider>;
}

export function useParking() {
  const ctx = useContext(ParkingContext);
  if (!ctx) {
    throw new Error('useParking must be used within a ParkingProvider');
  }
  return ctx;
}
