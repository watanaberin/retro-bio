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
