export interface TerminalLine {
  label: string;
  value: string;
}

export interface TerminalProfile {
  username: string;
  lines: TerminalLine[];
  bio?: string; // Added for long text support
}

export interface GenerationConfig {
  pixelSize?: number; // Kept for compatibility but might be unused in filter mode
  gridWidth: number;
  ditherThreshold: number;
}

export interface CRTEffectConfig {
  curveIntensity: number;      // 0.0 - 0.2, default: 0.04
  scanlineCount: number;        // 50 - 1000, default: 600
  scanlineIntensity: number;    // 0.0 - 1.0, default: 0.25
  rgbOffset: number;            // 0.0 - 0.02, default: 0.004
  vignetteSize: number;         // 0.0 - 1.0, default: 0.25
  vignetteRoundness: number;    // 0.0 - 1.0, default: 0.1
  brightnessBoost: number;      // 0.5 - 2.0, default: 1.1
  noiseStrength: number;        // 0.0 - 0.2, default: 0.03
  flickerIntensity: number;     // 0.0 - 0.2, default: 0.03
  showGrid: boolean;            // default: true
}
