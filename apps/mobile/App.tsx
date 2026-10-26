import { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  SafeAreaView,
  TouchableOpacity,
  ScrollView,
  Alert,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';

interface MobileGpuTelemetry {
  name: string;
  vramUsedGiB: number;
  vramTotalGiB: number;
  tempC: number;
  powerW: number;
  tokSec: number;
  status: 'ONLINE' | 'THROTTLED' | 'HALTED';
}

export default function App() {
  const [telemetry, setTelemetry] = useState<MobileGpuTelemetry>({
    name: 'Rig Alpha • NVIDIA RTX 4090',
    vramUsedGiB: 18.2,
    vramTotalGiB: 24.0,
    tempC: 62,
    powerW: 340,
    tokSec: 54.2,
    status: 'ONLINE',
  });
  const [isKilled, setIsKilled] = useState(false);

  useEffect(() => {
    if (isKilled) return;
    const interval = setInterval(() => {
      setTelemetry((prev) => ({
        ...prev,
        tempC: Math.min(84, Math.max(50, prev.tempC + (Math.random() * 2 - 1))),
        powerW: Math.round(Math.max(280, prev.powerW + (Math.random() * 12 - 6))),
        tokSec: Number((54.0 + (Math.random() * 4 - 2)).toFixed(1)),
      }));
    }, 1000);
    return () => clearInterval(interval);
  }, [isKilled]);

  const handleKillSwitch = () => {
    Alert.alert(
      '🚨 Confirm Emergency VRAM Purge',
      'This will immediately terminate running vLLM/llama.cpp inference processes on your physical rig and flush GPU memory.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'PURGE NOW',
          style: 'destructive',
          onPress: () => {
            setIsKilled(true);
            setTelemetry((prev) => ({
              ...prev,
              vramUsedGiB: 0.8,
              powerW: 35,
              tempC: 38,
              tokSec: 0,
              status: 'HALTED',
            }));
            Alert.alert('Success', 'Rig Alpha inference halted. 23.2 GiB VRAM reclaimed.');
          },
        },
      ]
    );
  };

  const occupancyPct = Math.round((telemetry.vramUsedGiB / telemetry.vramTotalGiB) * 100);

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="light" />
      <ScrollView contentContainerStyle={styles.scroll}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.title}>⚡ Rig Monitor</Text>
            <Text style={styles.subtitle}>{telemetry.name}</Text>
          </View>
          <View
            style={[
              styles.badge,
              { backgroundColor: isKilled ? 'rgba(239, 68, 68, 0.2)' : 'rgba(52, 211, 153, 0.2)' },
            ]}
          >
            <Text
              style={[
                styles.badgeText,
                { color: isKilled ? '#f87171' : '#34d399' },
              ]}
            >
              ● {telemetry.status}
            </Text>
          </View>
        </View>

        {/* Live Gauges Grid */}
        <View style={styles.card}>
          <Text style={styles.cardHeader}>REAL-TIME HARDWARE DIALS</Text>
          <View style={styles.grid}>
            {/* VRAM Gauge */}
            <View style={styles.dialBox}>
              <Text style={styles.dialLabel}>VRAM OCCUPANCY</Text>
              <Text style={[styles.dialValue, { color: occupancyPct > 85 ? '#f87171' : '#38bdf8' }]}>
                {telemetry.vramUsedGiB.toFixed(1)} <Text style={styles.dialUnit}>/ {telemetry.vramTotalGiB} GiB</Text>
              </Text>
              <Text style={styles.dialSub}>{occupancyPct}% Allocated</Text>
            </View>

            {/* Core Temp */}
            <View style={styles.dialBox}>
              <Text style={styles.dialLabel}>GPU TEMP</Text>
              <Text style={[styles.dialValue, { color: telemetry.tempC > 78 ? '#f87171' : '#34d399' }]}>
                {telemetry.tempC.toFixed(0)} <Text style={styles.dialUnit}>°C</Text>
              </Text>
              <Text style={styles.dialSub}>{telemetry.tempC > 78 ? 'Thermal Throttling' : 'Optimal Band'}</Text>
            </View>

            {/* Power Draw */}
            <View style={styles.dialBox}>
              <Text style={styles.dialLabel}>POWER DRAW</Text>
              <Text style={[styles.dialValue, { color: '#fbbf24' }]}>
                {telemetry.powerW} <Text style={styles.dialUnit}>W</Text>
              </Text>
              <Text style={styles.dialSub}>PCIe + 12VHPWR</Text>
            </View>

            {/* Token Speed */}
            <View style={styles.dialBox}>
              <Text style={styles.dialLabel}>THROUGHPUT</Text>
              <Text style={[styles.dialValue, { color: '#c084fc' }]}>
                {telemetry.tokSec} <Text style={styles.dialUnit}>tok/s</Text>
              </Text>
              <Text style={styles.dialSub}>DeepSeek-R1 (Q4_K_M)</Text>
            </View>
          </View>
        </View>

        {/* Remote Emergency Kill Switch */}
        <View style={styles.killCard}>
          <Text style={styles.killTitle}>Remote Emergency Controls</Text>
          <Text style={styles.killDescription}>
            Forces an immediate process termination and driver-level memory purge across WSS if a thermal spike or OOM occurs.
          </Text>
          <TouchableOpacity
            style={[styles.killButton, isKilled && styles.killButtonDisabled]}
            onPress={handleKillSwitch}
            disabled={isKilled}
          >
            <Text style={styles.killButtonText}>
              {isKilled ? 'RIG HALTED • VRAM PURGED' : '🚨 EMERGENCY KILL SWITCH'}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0b10',
  },
  scroll: {
    padding: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    marginTop: 10,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#38bdf8',
  },
  subtitle: {
    fontSize: 13,
    color: '#94a3b8',
    marginTop: 2,
  },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(52, 211, 153, 0.4)',
  },
  badgeText: {
    fontSize: 11,
    fontWeight: 'bold',
  },
  card: {
    backgroundColor: 'rgba(15, 23, 42, 0.7)',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(148, 163, 184, 0.2)',
    marginBottom: 20,
  },
  cardHeader: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#64748b',
    letterSpacing: 1,
    marginBottom: 12,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  dialBox: {
    width: '48%',
    backgroundColor: 'rgba(30, 41, 59, 0.6)',
    borderRadius: 12,
    padding: 14,
  },
  dialLabel: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#94a3b8',
    marginBottom: 4,
  },
  dialValue: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  dialUnit: {
    fontSize: 12,
    color: '#64748b',
    fontWeight: 'normal',
  },
  dialSub: {
    fontSize: 10,
    color: '#64748b',
    marginTop: 4,
  },
  killCard: {
    backgroundColor: 'rgba(30, 27, 75, 0.5)',
    borderRadius: 16,
    padding: 18,
    borderWidth: 1,
    borderColor: 'rgba(168, 85, 247, 0.3)',
  },
  killTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#f8fafc',
    marginBottom: 4,
  },
  killDescription: {
    fontSize: 12,
    color: '#cbd5e1',
    lineHeight: 18,
    marginBottom: 16,
  },
  killButton: {
    backgroundColor: '#ef4444',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#ef4444',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
  },
  killButtonDisabled: {
    backgroundColor: '#475569',
    shadowOpacity: 0,
  },
  killButtonText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
});
