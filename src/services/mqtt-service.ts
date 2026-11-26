import mqtt from 'mqtt';

export interface MQTTConfig {
  host: string;
  port: number;
  protocol: 'ws' | 'wss' | 'tcp';
  username?: string;
  password?: string;
}

export const DEFAULT_MQTT_CONFIG: MQTTConfig = {
  host: '172.20.10.2',
  port: 1883,
  // Trong môi trường React Native / Mobile / Expo, MQTT qua WebSocket (ws://) thường được broker HiveMQ mở ở port 8000/8083 hoặc 1883
  // Hỗ trợ fallback ws://172.20.10.2:8083/mqtt hoặc ws://172.20.10.2:1883
  protocol: 'ws',
};

export const MQTT_TOPICS = [
  'smartparking/telemetry',
  'smartparking/status',
  'smartparking/event',
  'smartparking/alert',
] as const;

export type MQTTTopic = (typeof MQTT_TOPICS)[number];

export interface MQTTMessagePayload {
  topic: string;
  data: any;
  timestamp: string;
}

type MessageHandler = (payload: MQTTMessagePayload) => void;
type ConnectionStatusHandler = (connected: boolean, statusText: string) => void;

class MQTTService {
  private client: mqtt.MqttClient | null = null;
  private messageListeners: MessageHandler[] = [];
  private statusListeners: ConnectionStatusHandler[] = [];
  private isConnected: boolean = false;
  private currentHost: string = DEFAULT_MQTT_CONFIG.host;
  private currentPort: number = DEFAULT_MQTT_CONFIG.port;

  public connect(config: Partial<MQTTConfig> = {}) {
    const host = config.host || this.currentHost;
    const port = config.port || this.currentPort;
    this.currentHost = host;
    this.currentPort = port;

    // Disconnect client cũ nếu có
    if (this.client) {
      try {
        this.client.end(true);
      } catch (err) {
        console.warn('Error closing existing MQTT client:', err);
      }
    }

    // Xây dựng URL kết nối
    // Nếu thiết bị chạy Expo Go trên iOS/Android, giao thức WebSocket ws:// được hỗ trợ chuẩn
    const brokerUrl = `ws://${host}:${port === 1883 ? 8083 : port}/mqtt`;

    this.notifyStatus(false, `Connecting to HiveMQ (${host}:${port})...`);

    try {
      const clientId = `smartparking_app_${Math.random().toString(16).substring(2, 8)}`;
      
      this.client = mqtt.connect(brokerUrl, {
        clientId,
        clean: true,
        connectTimeout: 5000,
        reconnectPeriod: 4000,
        username: config.username || undefined,
        password: config.password || undefined,
      });

      this.client.on('connect', () => {
        this.isConnected = true;
        this.notifyStatus(true, `Connected to ${host}:${port}`);
        console.log(`[MQTT] Connected to broker: ${brokerUrl}`);

        // Subscribe tất cả các topic yêu cầu
        MQTT_TOPICS.forEach((topic) => {
          this.client?.subscribe(topic, { qos: 0 }, (err) => {
            if (err) {
              console.error(`[MQTT] Failed to subscribe to ${topic}:`, err);
            } else {
              console.log(`[MQTT] Subscribed to topic: ${topic}`);
            }
          });
        });
      });

      this.client.on('message', (topic, message) => {
        try {
          const rawStr = message.toString();
          let parsedData: any;
          try {
            parsedData = JSON.parse(rawStr);
          } catch {
            parsedData = rawStr;
          }

          const payload: MQTTMessagePayload = {
            topic,
            data: parsedData,
            timestamp: new Date().toLocaleTimeString(),
          };

          this.messageListeners.forEach((listener) => listener(payload));
        } catch (err) {
          console.error('[MQTT] Message parsing error:', err);
        }
      });

      this.client.on('error', (err) => {
        console.warn('[MQTT] Connection error:', err.message);
        this.isConnected = false;
        this.notifyStatus(false, `Error: ${err.message}`);
      });

      this.client.on('close', () => {
        this.isConnected = false;
        this.notifyStatus(false, 'Disconnected');
      });

      this.client.on('offline', () => {
        this.isConnected = false;
        this.notifyStatus(false, 'Broker Offline');
      });
    } catch (e: any) {
      this.isConnected = false;
      this.notifyStatus(false, `Failed: ${e?.message || 'Connection error'}`);
      console.error('[MQTT] Exception starting client:', e);
    }
  }

  public publish(topic: string, message: object | string) {
    if (!this.client || !this.isConnected) {
      console.warn('[MQTT] Cannot publish, client not connected');
      return false;
    }
    const payloadStr = typeof message === 'string' ? message : JSON.stringify(message);
    this.client.publish(topic, payloadStr);
    return true;
  }

  public onMessage(handler: MessageHandler) {
    this.messageListeners.push(handler);
    return () => {
      this.messageListeners = this.messageListeners.filter((l) => l !== handler);
    };
  }

  public onStatusChange(handler: ConnectionStatusHandler) {
    this.statusListeners.push(handler);
    handler(this.isConnected, this.isConnected ? 'Connected' : 'Disconnected');
    return () => {
      this.statusListeners = this.statusListeners.filter((l) => l !== handler);
    };
  }

  private notifyStatus(connected: boolean, statusText: string) {
    this.statusListeners.forEach((listener) => listener(connected, statusText));
  }

  public getConnected(): boolean {
    return this.isConnected;
  }

  public disconnect() {
    if (this.client) {
      this.client.end(true);
      this.client = null;
      this.isConnected = false;
      this.notifyStatus(false, 'Disconnected');
    }
  }
}

export const mqttService = new MQTTService();
