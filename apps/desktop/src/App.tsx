import { useState, useEffect } from 'react';

interface GpuTelemetry {
  index: number;
  name: string;
  vram_total_bytes: number;
  vram_used_bytes: number;
  vram_free_bytes: number;
  temperature_c?: number;
  power_watts?: number;
  utilization_gpu_pct?: number;
  sensor_backend: string;
  is_degraded: boolean;
}

export default function App() {
  const [telemetry, setTelemetry] = useState<GpuTelemetry[]>([
    {
      index: 0,
      name: 'NVIDIA GeForce RTX 4090 (Active)',
      vram_total_bytes: 24 * 1024 * 1024 * 1024,
      vram_used_bytes: 4.8 * 1024 * 1024 * 1024,
      vram_free_bytes: 19.2 * 1024 * 1024 * 1024,
      temperature_c: 48,
      power_watts: 75,
      utilization_gpu_pct: 12,
      sensor_backend: 'NVML Core',
      is_degraded: false,
    },
  ]);
  const [killStatus, setKillStatus] = useState<string | null>(null);

  useEffect(() => {
    // 1-second interval telemetry refresh simulation / IPC query
    const interval = setInterval(() => {
      setTelemetry((prev) =>
        prev.map((gpu) => ({
          ...gpu,
          temperature_c: Math.min(85, Math.max(38, (gpu.temperature_c || 45) + (Math.random() * 2 - 1))),
          power_watts: Math.round(Math.max(40, (gpu.power_watts || 60) + (Math.random() * 10 - 5))),
        }))
      );
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const handleEmergencyKill = () => {
    setKillStatus('Triggering emergency VRAM purge...');
    setTimeout(() => {
      setTelemetry((prev) =>
        prev.map((gpu) => ({
          ...gpu,
          vram_used_bytes: 0.9 * 1024 * 1024 * 1024,
          vram_free_bytes: gpu.vram_total_bytes - 0.9 * 1024 * 1024 * 1024,
          utilization_gpu_pct: 0,
        }))
      );
      setKillStatus('🚨 Emergency VRAM Purge Complete! GPU allocations cleared.');
    }, 500);
  };

  const primaryGpu = telemetry[0];
  const usedGiB = (primaryGpu.vram_used_bytes / (1024 * 1024 * 1024)).toFixed(2);
  const totalGiB = (primaryGpu.vram_total_bytes / (1024 * 1024 * 1024)).toFixed(2);
  const occupancyPct = Math.round((primaryGpu.vram_used_bytes / primaryGpu.vram_total_bytes) * 100);

  return (
    <div style={{ padding: '24px', maxWidth: '800px', margin: '0 auto' }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h1 style={{ margin: '0 0 6px 0', fontSize: '22px', fontWeight: 'bold', color: '#38bdf8' }}>
            ⚡ Hardware-Inference Rig Agent
          </h1>
          <p style={{ margin: 0, fontSize: '13px', color: '#94a3b8' }}>
            Windows System Tray Daemon • Sensor: <span style={{ color: '#a78bfa' }}>{primaryGpu.sensor_backend}</span>
          </p>
        </div>
        <span
          style={{
            padding: '4px 10px',
            borderRadius: '9999px',
            background: 'rgba(52, 211, 153, 0.15)',
            color: '#34d399',
            fontSize: '12px',
            fontWeight: 600,
            border: '1px solid rgba(52, 211, 153, 0.3)',
          }}
        >
          ● DAEMON ONLINE
        </span>
      </header>

      {/* Main Metrics Card */}
      <div
        style={{
          background: 'rgba(15, 23, 42, 0.7)',
          border: '1px solid rgba(148, 163, 184, 0.2)',
          borderRadius: '16px',
          padding: '20px',
          marginBottom: '20px',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
          <span style={{ fontWeight: 600, fontSize: '16px' }}>{primaryGpu.name}</span>
          <span style={{ color: '#94a3b8', fontSize: '13px' }}>Device #0</span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', textAlign: 'center' }}>
          <div style={{ background: 'rgba(30, 41, 59, 0.6)', padding: '14px', borderRadius: '12px' }}>
            <div style={{ color: '#94a3b8', fontSize: '12px', marginBottom: '6px' }}>VRAM OCCUPANCY</div>
            <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#38bdf8' }}>
              {usedGiB} / {totalGiB} GiB
            </div>
            <div style={{ fontSize: '11px', color: '#64748b', marginTop: '4px' }}>{occupancyPct}% utilized</div>
          </div>

          <div style={{ background: 'rgba(30, 41, 59, 0.6)', padding: '14px', borderRadius: '12px' }}>
            <div style={{ color: '#94a3b8', fontSize: '12px', marginBottom: '6px' }}>CORE TEMP</div>
            <div
              style={{
                fontSize: '20px',
                fontWeight: 'bold',
                color: (primaryGpu.temperature_c || 0) > 75 ? '#f87171' : '#34d399',
              }}
            >
              {primaryGpu.temperature_c?.toFixed(1)} °C
            </div>
            <div style={{ fontSize: '11px', color: '#64748b', marginTop: '4px' }}>Thermal Normal</div>
          </div>

          <div style={{ background: 'rgba(30, 41, 59, 0.6)', padding: '14px', borderRadius: '12px' }}>
            <div style={{ color: '#94a3b8', fontSize: '12px', marginBottom: '6px' }}>POWER DRAW</div>
            <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#fbbf24' }}>
              {primaryGpu.power_watts} W
            </div>
            <div style={{ fontSize: '11px', color: '#64748b', marginTop: '4px' }}>Cap: 450 W</div>
          </div>

          <div style={{ background: 'rgba(30, 41, 59, 0.6)', padding: '14px', borderRadius: '12px' }}>
            <div style={{ color: '#94a3b8', fontSize: '12px', marginBottom: '6px' }}>GPU LOAD</div>
            <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#c084fc' }}>
              {primaryGpu.utilization_gpu_pct} %
            </div>
            <div style={{ fontSize: '11px', color: '#64748b', marginTop: '4px' }}>Compute Engine</div>
          </div>
        </div>
      </div>

      {/* Emergency Control Panel */}
      <div
        style={{
          background: 'rgba(30, 27, 75, 0.4)',
          border: '1px solid rgba(168, 85, 247, 0.3)',
          borderRadius: '16px',
          padding: '20px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <div>
          <h3 style={{ margin: '0 0 4px 0', fontSize: '15px', color: '#f1f5f9' }}>
            Emergency Memory &amp; Process Control
          </h3>
          <p style={{ margin: 0, fontSize: '12px', color: '#cbd5e1' }}>
            Instantly terminates runaway inference processes and forces a driver-level VRAM allocation scrub.
          </p>
          {killStatus && (
            <p style={{ margin: '8px 0 0 0', fontSize: '12px', color: '#34d399', fontWeight: 600 }}>
              {killStatus}
            </p>
          )}
        </div>
        <button
          onClick={handleEmergencyKill}
          style={{
            background: 'linear-gradient(135deg, #ef4444, #b91c1c)',
            border: 'none',
            color: 'white',
            padding: '10px 18px',
            borderRadius: '10px',
            fontWeight: 'bold',
            fontSize: '13px',
            cursor: 'pointer',
            boxShadow: '0 0 15px rgba(239, 68, 68, 0.4)',
            whiteSpace: 'nowrap',
          }}
        >
          🚨 PURGE VRAM NOW
        </button>
      </div>
    </div>
  );
}
