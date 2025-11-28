import React, { useMemo } from "react";
import { TerminalProfile, GenerationConfig } from "../types";

interface RetroTerminalSvgProps {
  id: string;
  imageSrc: string | null;
  profile: TerminalProfile;
  config: GenerationConfig;
  blurLevel: number;
}

export const RetroTerminalSvg: React.FC<RetroTerminalSvgProps> = ({
  id,
  imageSrc,
  profile,
  config,
  blurLevel,
}) => {
  // Config
  const padding = 40;
  const gap = 40;
  const fontSize = 24;
  const lineHeight = 32;
  const charWidth = 14;

  // Image Dimensions
  const imageDisplayWidth = 300;
  const imageDisplayHeight = 300;

  const textStartX = imageSrc ? (padding + imageDisplayWidth + gap) : padding;
  const textStartY = padding + 20;

  // Text Dimensions
  const maxLineLength = Math.max(
    profile.username.length,
    ...profile.lines.map(l => (l.label.length + l.value.length + 2)),
    ...(profile.bio ? profile.bio.split('\n').map(l => l.length) : [0])
  );

  const minTextWidth = 450;
  const calculatedTextWidth = Math.max(minTextWidth, maxLineLength * charWidth);
  const totalWidth = textStartX + calculatedTextWidth + padding;

  // Calculate Height
  const headerHeight = lineHeight * 2;
  const linesHeight = profile.lines.length * lineHeight;
  const bioHeight = profile.bio ? (profile.bio.split('\n').length * lineHeight) + lineHeight : 0;
  const textContentHeight = headerHeight + linesHeight + bioHeight + 100;

  const totalHeight = Math.max(
    (imageSrc ? imageDisplayHeight : 0) + (padding * 2),
    textContentHeight + padding
  );

  // Constants for colors
  const PHOSPHOR_COLOR = "#33ff00"; // Classic Terminal Green
  const PHOSPHOR_DIM = "#1a8000";
  const PHOSPHOR_BRIGHT = "#ccffcc";

  // Render List Lines
  const textLines = useMemo(() => {
    return profile.lines.map((line, index) => {
      const yPos = textStartY + headerHeight + (lineHeight * index);
      return (
        <text key={index} x={textStartX} y={yPos} fill={PHOSPHOR_COLOR} fontSize={fontSize} fontFamily="'VT323', monospace" textRendering="optimizeSpeed">
          <tspan fontWeight="bold" fill={PHOSPHOR_COLOR} filter="url(#text-glow)">{line.label}:</tspan> <tspan fill={PHOSPHOR_BRIGHT}>{line.value}</tspan>
        </text>
      )
    })
  }, [profile.lines, textStartX, textStartY, lineHeight, fontSize, headerHeight]);

  // Render Bio
  const bioLines = useMemo(() => {
    if (!profile.bio) return null;
    const lines = profile.bio.split('\n');
    const startY = textStartY + headerHeight + (profile.lines.length * lineHeight) + lineHeight;

    return lines.map((line, i) => (
      <text key={`bio-${i}`} x={textStartX} y={startY + (i * lineHeight)} fill={PHOSPHOR_COLOR} fontSize={fontSize} fontFamily="'VT323', monospace" opacity={0.9} textRendering="optimizeSpeed">
        {line}
      </text>
    ));
  }, [profile.bio, profile.lines.length, textStartX, textStartY, lineHeight, fontSize, headerHeight]);

  // Decoration
  const paletteRects = useMemo(() => {
    const colors = ["#ff3333", "#ffff33", "#33ff33", "#33ffff", "#3333ff", "#ff33ff"];
    const yPos = totalHeight - 40;
    return colors.map((c, i) => (
      <g key={c}>
        <rect x={textStartX + (i * 35)} y={yPos} width={35} height={15} fill={c} opacity={0.8} filter="url(#glow)" />
      </g>
    ));
  }, [textStartX, totalHeight]);

  return (
    <div className="w-full h-full flex items-center justify-center">
      <svg
        id={id}
        viewBox={`0 0 ${totalWidth} ${totalHeight}`}
        xmlns="http://www.w3.org/2000/svg"
        xmlnsXlink="http://www.w3.org/1999/xlink"
        className="max-w-full max-h-full block"
        style={{ backgroundColor: "#0a0a0a", fontFamily: "'VT323', monospace" }}
      >
        <defs>
          {/* 1. Heavy Bloom Glow - Increased for visual impact */}
          <filter id="glow" x="-40%" y="-40%" width="180%" height="180%">
            <feGaussianBlur stdDeviation="4.5" result="coloredBlur" />
            <feMerge>
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="coloredBlur" /> {/* Double bloom for intensity */}
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>

          {/* 2. Text Specific Glow (tighter and sharper) */}
          <filter id="text-glow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="0.8" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>

          {/* 3. Scanline Pattern - Finer and sharper */}
          <pattern id="scanlines" patternUnits="userSpaceOnUse" width="1" height="4">
            <rect x="0" y="0" width="1" height="2" fill="black" opacity="0.6" />
            <rect x="0" y="2" width="1" height="2" fill="transparent" opacity="0" />
          </pattern>

          {/* 4. Monitor Green Tint + Luminance Map */}
          <filter id="monitor-green">
            <feColorMatrix
              type="matrix"
              values="0 0 0 0 0
                        0 1 0 0 0
                        0 0 0 0 0
                        0 0 0 1 0"
              result="greenonly"
            />
            <feGaussianBlur stdDeviation="0.8" result="slightBlur" />
            <feMerge>
              <feMergeNode in="slightBlur" />
              <feMergeNode in="greenonly" />
            </feMerge>
          </filter>

          {/* 5. Signal Noise / Grain */}
          <filter id="noise">
            <feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="3" stitchTiles="stitch" result="noise" />
            <feColorMatrix type="matrix" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 0.15 0" in="noise" result="coloredNoise" />
          </filter>

          {/* 6. Vignette Gradient */}
          <radialGradient id="vignette" cx="50%" cy="50%" r="75%" fx="50%" fy="50%">
            <stop offset="60%" stopColor="#000" stopOpacity="0" />
            <stop offset="100%" stopColor="#000" stopOpacity="0.8" />
          </radialGradient>

          {/* 7. Adjustable Global Blur */}
          <filter id="global-blur">
            <feGaussianBlur stdDeviation={blurLevel} />
          </filter>
        </defs>

        {/* Background Dark Phosphor */}
        <rect width="100%" height="100%" fill="#020802" />

        {/* Analog Noise Background */}
        <rect width="100%" height="100%" filter="url(#noise)" opacity="0.4" />

        {/* Main Content Group - Removed global glow for clarity, added adjustable blur */}
        <g filter="url(#global-blur)">

          {/* Image Section - Optional: Add glow here if desired, or keep clean */}
          {imageSrc && (
            <g transform={`translate(${padding}, ${padding})`} filter="url(#glow)">
              {/* Dotted border for raw look */}
              <rect x="-5" y="-5" width={imageDisplayWidth + 10} height={imageDisplayHeight + 10} fill="none" stroke={PHOSPHOR_COLOR} strokeWidth="1" strokeDasharray="2,4" opacity="0.5" />

              {/* The Image with Green Filter */}
              <image
                href={imageSrc}
                width={imageDisplayWidth}
                height={imageDisplayHeight}
                preserveAspectRatio="xMidYMid slice"
                filter="url(#monitor-green)"
                opacity="0.9"
              />

              {/* Local scanlines for image to make it look like a screen within a screen */}
              <rect width={imageDisplayWidth} height={imageDisplayHeight} fill="url(#scanlines)" opacity="0.2" pointerEvents="none" />
            </g>
          )}

          {/* Header */}
          <text x={textStartX} y={textStartY} fill={PHOSPHOR_COLOR} fontSize={fontSize * 1.5} fontWeight="bold" filter="url(#text-glow)" textRendering="optimizeSpeed">
            {profile.username}
          </text>

          {/* Dashed Separator */}
          <line
            x1={textStartX}
            y1={textStartY + 15}
            x2={totalWidth - padding}
            y2={textStartY + 15}
            stroke={PHOSPHOR_COLOR}
            strokeWidth="2"
            strokeDasharray="8,8"
            opacity="0.7"
          />

          {/* Dynamic Lines */}
          {textLines}

          {/* Bio Section */}
          {bioLines}

          {/* Decoration */}
          {paletteRects}

          {/* Command Prompt */}
          <text x={padding} y={totalHeight - 15} fill={PHOSPHOR_COLOR} fontSize={fontSize} textRendering="optimizeSpeed">
            <tspan opacity="0.7">root@system:</tspan> ~ $ <tspan className="animate-pulse" fontWeight="bold">_</tspan>
          </text>
        </g>

        {/* Global CRT Overlay Layers (Scanlines + Vignette) */}

        {/* Scanlines: High opacity for that defined look */}
        <rect width="100%" height="100%" fill="url(#scanlines)" pointerEvents="none" opacity="0.25" />

        {/* Vignette: Dark corners */}
        <rect width="100%" height="100%" fill="url(#vignette)" pointerEvents="none" />

        {/* CRT Bezel Inner Glow (simulated with stroke) */}
        <rect x="2" y="2" width={totalWidth - 4} height={totalHeight - 4} fill="none" stroke={PHOSPHOR_COLOR} strokeWidth="4" opacity="0.1" rx="10" />

      </svg>
    </div>
  );
};