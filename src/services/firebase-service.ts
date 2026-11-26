import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getFirestore,
  collection,
  addDoc,
  setDoc,
  doc,
} from 'firebase/firestore';

/**
 * Cấu hình Firebase Project
 * Bạn có thể thay thế các giá trị này bằng thông số Firebase console của bạn
 */
export const DEFAULT_FIREBASE_CONFIG = {
  apiKey: 'AIzaSyDemoSmartParkingKey1234567890',
  authDomain: 'smart-parking-iot.firebaseapp.com',
  projectId: 'smart-parking-iot',
  storageBucket: 'smart-parking-iot.appspot.com',
  messagingSenderId: '123456789012',
  appId: '1:123456789012:web:abcdef1234567890',
};

class FirebaseService {
  private db: any = null;
  private isInitialized: boolean = false;

  public init(config = DEFAULT_FIREBASE_CONFIG) {
    try {
      const app = getApps().length === 0 ? initializeApp(config) : getApp();
      this.db = getFirestore(app);
      this.isInitialized = true;
      console.log('[Firebase] Initialized successfully with project:', config.projectId);
    } catch (error) {
      console.warn('[Firebase] Init notice (will fallback to local storage if config invalid):', error);
      this.isInitialized = false;
    }
  }

  // 1. Lưu bản tin telemetry (nhiệt độ, cảm biến khoảng cách, ultrasonic, v.v.)
  public async logTelemetry(data: any) {
    if (!this.isInitialized || !this.db) return;
    try {
      await addDoc(collection(this.db, 'telemetry'), {
        ...data,
        createdAt: new Date().toISOString(),
      });
    } catch (err) {
      console.error('[Firebase] Error logging telemetry:', err);
    }
  }

  // 2. Cập nhật trạng thái slot đỗ xe từ MQTT smartparking/status
  public async syncSlotStatus(slotId: string, status: string, details: any = {}) {
    if (!this.isInitialized || !this.db) return;
    try {
      const slotRef = doc(this.db, 'slots', slotId);
      await setDoc(slotRef, {
        status,
        ...details,
        updatedAt: new Date().toISOString(),
      }, { merge: true });
    } catch (err) {
      console.error('[Firebase] Error syncing slot status:', err);
    }
  }

  // 3. Lưu sự kiện xe ra / vào (smartparking/event)
  public async logEvent(eventType: string, payload: any) {
    if (!this.isInitialized || !this.db) return;
    try {
      await addDoc(collection(this.db, 'events'), {
        eventType,
        payload,
        timestamp: new Date().toISOString(),
      });
    } catch (err) {
      console.error('[Firebase] Error saving event:', err);
    }
  }

  // 4. Lưu cảnh báo bất thường (smartparking/alert)
  public async logAlert(alertData: any) {
    if (!this.isInitialized || !this.db) return;
    try {
      await addDoc(collection(this.db, 'alerts'), {
        ...alertData,
        timestamp: new Date().toISOString(),
        resolved: false,
      });
    } catch (err) {
      console.error('[Firebase] Error logging alert:', err);
    }
  }

  public getReady(): boolean {
    return this.isInitialized;
  }
}

export const firebaseService = new FirebaseService();
