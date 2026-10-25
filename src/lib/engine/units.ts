/**
 * Standard unit constants
 * Binary Gibibytes (GiB) = 1024^3 bytes
 * Decimal Gigabytes (GB) = 10^9 bytes
 */
export const BYTES_PER_GIB = 1024 * 1024 * 1024 // 1,073,741,824 bytes
export const BYTES_PER_GB = 1_000_000_000 // 1,000,000,000 bytes
export const BYTES_PER_MIB = 1024 * 1024 // 1,048,576 bytes
export const BYTES_PER_MB = 1_000_000 // 1,000,000 bytes

export function bytesToGiB(bytes: number, precision: number = 2): number {
  return parseFloat((bytes / BYTES_PER_GIB).toFixed(precision))
}

export function bytesToGB(bytes: number, precision: number = 2): number {
  return parseFloat((bytes / BYTES_PER_GB).toFixed(precision))
}

export function gibToBytes(gib: number): number {
  return gib * BYTES_PER_GIB
}

export function gbToBytes(gb: number): number {
  return gb * BYTES_PER_GB
}

export function gibToGB(gib: number, precision: number = 2): number {
  return parseFloat(((gib * BYTES_PER_GIB) / BYTES_PER_GB).toFixed(precision))
}

export function gbToGiB(gb: number, precision: number = 2): number {
  return parseFloat(((gb * BYTES_PER_GB) / BYTES_PER_GIB).toFixed(precision))
}

export function formatVRAM(gib: number, showBoth: boolean = false): string {
  if (gib < 1) {
    const mib = Math.round(gib * 1024)
    return `${mib} MiB`
  }
  if (showBoth) {
    const gb = gibToGB(gib)
    return `${gib.toFixed(2)} GiB (${gb.toFixed(2)} GB)`
  }
  return `${gib.toFixed(2)} GiB`
}
