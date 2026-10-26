use serde::{Deserialize, Serialize};
use thiserror::Error;

#[derive(Error, Debug)]
pub enum SensorError {
    #[error("NVML library not accessible or driver not installed: {0}")]
    NvmlError(String),
    #[error("Failed to query device index {0}: {1}")]
    DeviceQueryFailed(u32, String),
    #[error("Hardware sensor unsupported on this operating platform")]
    UnsupportedPlatform,
}

#[derive(Serialize, Deserialize, Clone, Debug)]
pub struct GpuTelemetry {
    pub index: u32,
    pub name: String,
    pub vram_total_bytes: u64,
    pub vram_used_bytes: u64,
    pub vram_free_bytes: u64,
    pub temperature_c: Option<u32>,
    pub power_watts: Option<u32>,
    pub utilization_gpu_pct: Option<u32>,
    pub fan_speed_pct: Option<u32>,
    pub sensor_backend: String,
    pub is_degraded: bool,
}

pub trait HardwareSensor {
    fn poll_devices(&mut self) -> Result<Vec<GpuTelemetry>, SensorError>;
}

/// Fallback simulated / generic sensor when NVML is not available
pub struct FallbackSensor {
    pub simulated_device_name: String,
    pub vram_total_bytes: u64,
}

impl FallbackSensor {
    pub fn new() -> Self {
        Self {
            simulated_device_name: "Generic / Simulated Accelerator (RTX 4090 Profile)".into(),
            vram_total_bytes: 24 * 1024 * 1024 * 1024, // 24 GiB
        }
    }
}

impl HardwareSensor for FallbackSensor {
    fn poll_devices(&mut self) -> Result<Vec<GpuTelemetry>, SensorError> {
        // Return structured baseline telemetry with explicit is_degraded: true
        Ok(vec![GpuTelemetry {
            index: 0,
            name: self.simulated_device_name.clone(),
            vram_total_bytes: self.vram_total_bytes,
            vram_used_bytes: 3 * 1024 * 1024 * 1024, // 3 GiB idle
            vram_free_bytes: 21 * 1024 * 1024 * 1024,
            temperature_c: Some(45),
            power_watts: Some(42),
            utilization_gpu_pct: Some(8),
            fan_speed_pct: Some(30),
            sensor_backend: "Fallback/Simulated".into(),
            is_degraded: true,
        }])
    }
}
