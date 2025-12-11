import { CRTEffectConfig, ExportSettings, GenerationConfig, TerminalProfile } from "./types";

export const DEFAULT_PROFILE: TerminalProfile = {
  username: "@rin",
  lines: [
    { label: "Languages", value: "Python" },
    { label: "Location", value: "Germany" },
    { label: "Skills", value: "Backend, Cloud Native" },
  ],
  bio: "Good Job!"
};

export const DEFAULT_CONFIG: GenerationConfig = {
  pixelSize: 5,
  gridWidth: 300,
  ditherThreshold: 128,
};

export const DEFAULT_CRT_CONFIG: CRTEffectConfig = {
  curveIntensity: 0.04,
  scanlineCount: 600,
  scanlineIntensity: 0.25,
  rgbOffset: 0.004,
  vignetteSize: 0.5,
  vignetteRoundness: 0.1,
  brightnessBoost: 1.1,
  noiseStrength: 0.03,
  flickerIntensity: 0.03,
  showGrid: true,
};

export const DEFAULT_EXPORT_SETTINGS: ExportSettings = {
  scale: 0.25,     // 25% resolution for optimal file size
  fps: 10,         // Balanced frame rate for retro feel
  duration: 2,     // 2 seconds total
};

// enter by user 
export const SYSTEM_INSTRUCTION = `You are a retro terminal profile generator.
Extract user information from the input text into a JSON object.

Schema:
{
  "username": "string",
  "bio": "string",
  "lines": [
    { "label": "string", "value": "string" }
  ]
}

- "username": Extract or generate a suitable username/handle.
- "bio": A summary or bio if present.
- "lines": An array of attributes (e.g. Age, Location, Job).

Output JSON only.`;