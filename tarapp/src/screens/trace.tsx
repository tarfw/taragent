import React, { useEffect, useState, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, Animated, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const LIVE_WS_URL = "wss://taragent.wetarteam.workers.dev/api/live/shop:main";

interface LiveEvent {
  opcode: number;
  delta: number;
  streamid: string;
  status: string;
  timestamp: string;
}

export default function LiveTracking() {
  const [events, setEvents] = useState<LiveEvent[]>([]);
  const [status, setStatus] = useState('Connecting...');
  const ws = useRef<WebSocket | null>(null);

  // Animation value for the pulsing live dot
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    connectWebSocket();
    startPulse();
    return () => {
      if (ws.current) ws.current.close();
    };
  }, []);

  const startPulse = () => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 0.4, duration: 800, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 800, useNativeDriver: true })
      ])
    ).start();
  };

  const connectWebSocket = () => {
    setStatus('Connecting...');
    ws.current = new WebSocket(LIVE_WS_URL);

    ws.current.onopen = () => {
      setStatus('Connected');
    };

    ws.current.onmessage = (e) => {
      try {
        const data = JSON.parse(e.data);
        const newEvent: LiveEvent = {
          ...data,
          timestamp: new Date().toLocaleTimeString(),
        };
        
        setEvents((prev) => [newEvent, ...prev].slice(0, 50));
      } catch (err) {
        console.error("Failed to parse live event", err);
      }
    };

    ws.current.onerror = (e) => {
      setStatus('Error');
    };

    ws.current.onclose = () => {
      setStatus('Reconnecting...');
      setTimeout(connectWebSocket, 3000);
    };
  };

  const renderIconForOpcode = (opcode: number) => {
    switch(opcode) {
      case 102: return <Ionicons name="cart" size={24} color="#FF3B30" />;
      case 103: return <Ionicons name="bicycle" size={24} color="#007AFF" />;
      case 101: return <Ionicons name="download" size={24} color="#34C759" />;
      default: return <Ionicons name="flash" size={24} color="#FF9500" />;
    }
  };

  const renderTextForOpcode = (opcode: number) => {
    switch(opcode) {
      case 102: return 'STOCK OUT (SALE)';
      case 103: return 'DRIVER UPDATE';
      case 101: return 'STOCK IN';
      default: return `OPCODE ${opcode}`;
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <Text style={styles.title}>Trace</Text>
          <View style={styles.statusBadge}>
            <Animated.View 
              style={[
                styles.statusDot, 
                { 
                  backgroundColor: status === 'Connected' ? '#34C759' : '#FF3B30',
                  opacity: status === 'Connected' ? pulseAnim : 1
                }
              ]} 
            />
            <Text style={styles.statusText}>{status}</Text>
          </View>
        </View>
        <Text style={styles.subtitle}>Real-time commerce events from Cloudflare</Text>
      </View>

      <ScrollView contentContainerStyle={styles.list}>
        {events.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="radio-outline" size={64} color="#C7C7CC" />
            <Text style={styles.emptyText}>Waiting for live events...</Text>
            <Text style={styles.emptySubText}>Create a sale or driver update to see it here instantly.</Text>
          </View>
        ) : (
          events.map((ev, index) => (
            <View key={index} style={styles.card}>
              <View style={styles.cardIconBox}>
                {renderIconForOpcode(ev.opcode)}
              </View>
              <View style={styles.cardContent}>
                <View style={styles.cardHeader}>
                  <Text style={styles.streamId}>{ev.streamid}</Text>
                  <Text style={styles.time}>{ev.timestamp}</Text>
                </View>
                <View style={styles.cardBody}>
                  <Text style={styles.opcodeText}>{renderTextForOpcode(ev.opcode)}</Text>
                  <Text style={[
                      styles.delta, 
                      { color: ev.delta < 0 ? '#FF3B30' : (ev.delta > 0 ? '#34C759' : '#8E8E93') }
                    ]}>
                    {ev.delta > 0 ? '+' : ''}{ev.delta} units
                  </Text>
                </View>
              </View>
            </View>
          ))
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 15,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
    zIndex: 10,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: '#1C1C1E',
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 14,
    color: '#8E8E93',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F2F2F7',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#3A3A3C',
  },
  list: {
    padding: 16,
    flexGrow: 1,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 60,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#8E8E93',
    marginTop: 16,
  },
  emptySubText: {
    fontSize: 14,
    color: '#C7C7CC',
    marginTop: 8,
    textAlign: 'center',
    paddingHorizontal: 40,
  },
  card: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E5E5EA',
    alignItems: 'center',
  },
  cardIconBox: {
    width: 50,
    height: 50,
    borderRadius: 12,
    backgroundColor: '#F2F2F7',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  cardContent: {
    flex: 1,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  streamId: {
    fontWeight: '700',
    fontSize: 16,
    color: '#1C1C1E',
  },
  time: {
    fontSize: 12,
    color: '#8E8E93',
    fontWeight: '500',
  },
  cardBody: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  opcodeText: {
    fontSize: 13,
    color: '#8E8E93',
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  delta: {
    fontSize: 16,
    fontWeight: '800',
  }
});
