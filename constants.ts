import { GenerationConfig, TerminalProfile } from "./types";

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