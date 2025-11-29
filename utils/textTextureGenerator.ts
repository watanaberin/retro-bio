import * as THREE from 'three';
import { TerminalProfile } from '../types';

export class TextTextureGenerator {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;

  // Layout constants (matching RetroTerminalSvg.tsx)
  private readonly padding = 40;
  private readonly gap = 40;
  private readonly fontSize = 24;
  private readonly lineHeight = 32;
  private readonly charWidth = 14;
  private readonly imageDisplayWidth = 300;
  private readonly imageDisplayHeight = 300;

  // Colors (matching RetroTerminalSvg.tsx)
  private readonly PHOSPHOR_COLOR = "#33ff00";
  private readonly PHOSPHOR_DIM = "#1a8000";
  private readonly PHOSPHOR_BRIGHT = "#ccffcc";

  constructor() {
    this.canvas = document.createElement('canvas');
    const ctx = this.canvas.getContext('2d', {
      alpha: false,
      desynchronized: true
    });
    if (!ctx) {
      throw new Error('Failed to get 2D context');
    }
    this.ctx = ctx;
  }

  private calculateDimensions(profile: TerminalProfile, imageSrc: string | null): { width: number; height: number } {
    const textStartX = imageSrc ? (this.padding + this.imageDisplayWidth + this.gap) : this.padding;

    // Calculate max line length
    const maxLineLength = Math.max(
      profile.username.length,
      ...profile.lines.map(l => (l.label.length + l.value.length + 2)),
      ...(profile.bio ? profile.bio.split('\n').map(l => l.length) : [0])
    );

    const minTextWidth = 450;
    const calculatedTextWidth = Math.max(minTextWidth, maxLineLength * this.charWidth);
    const totalWidth = textStartX + calculatedTextWidth + this.padding;

    // Calculate height
    const headerHeight = this.lineHeight * 2;
    const linesHeight = profile.lines.length * this.lineHeight;
    const bioHeight = profile.bio ? (profile.bio.split('\n').length * this.lineHeight) + this.lineHeight : 0;
    const textContentHeight = headerHeight + linesHeight + bioHeight + 100;

    const totalHeight = Math.max(
      (imageSrc ? this.imageDisplayHeight : 0) + (this.padding * 2),
      textContentHeight + this.padding
    );

    // Force square aspect ratio
    const squareSize = Math.max(totalWidth, totalHeight);

    return { width: squareSize, height: squareSize };
  }

  async generateTexture(profile: TerminalProfile, imageSrc: string | null, showGrid: boolean = true): Promise<THREE.Texture> {
    const { width, height } = this.calculateDimensions(profile, imageSrc);

    // Set canvas size (use 2x resolution for better quality)
    const scale = 2;
    this.canvas.width = width * scale;
    this.canvas.height = height * scale;

    // Scale context for high DPI
    this.ctx.scale(scale, scale);

    // Clear and fill background
    this.ctx.fillStyle = '#0a0a0a';
    this.ctx.fillRect(0, 0, width, height);

    // Calculate centering offsets
    const textStartX = imageSrc ? (this.padding + this.imageDisplayWidth + this.gap) : this.padding;
    const textStartY = this.padding + 20;

    const maxLineLength = Math.max(
      profile.username.length,
      ...profile.lines.map(l => (l.label.length + l.value.length + 2)),
      ...(profile.bio ? profile.bio.split('\n').map(l => l.length) : [0])
    );
    const minTextWidth = 450;
    const calculatedTextWidth = Math.max(minTextWidth, maxLineLength * this.charWidth);
    const totalWidth = textStartX + calculatedTextWidth + this.padding;

    const headerHeight = this.lineHeight * 2;
    const linesHeight = profile.lines.length * this.lineHeight;
    const bioHeight = profile.bio ? (profile.bio.split('\n').length * this.lineHeight) + this.lineHeight : 0;
    const textContentHeight = headerHeight + linesHeight + bioHeight + 100;

    const totalHeight = Math.max(
      (imageSrc ? this.imageDisplayHeight : 0) + (this.padding * 2),
      textContentHeight + this.padding
    );

    const offsetX = (width - totalWidth) / 2;
    const offsetY = (height - totalHeight) / 2;

    // Draw image if present
    if (imageSrc) {
      await this.drawImage(imageSrc, offsetX, offsetY);
    }

    // Setup text rendering
    this.ctx.textBaseline = 'top';
    this.ctx.font = `${this.fontSize}px 'VT323', monospace`;

    // Draw username header
    this.ctx.fillStyle = this.PHOSPHOR_BRIGHT;
    this.ctx.shadowColor = this.PHOSPHOR_COLOR;
    this.ctx.shadowBlur = 8;
    this.ctx.fillText(profile.username, textStartX + offsetX, textStartY + offsetY);
    this.ctx.shadowBlur = 0;

    // Draw underline
    const underlineY = textStartY + this.lineHeight + offsetY;
    this.ctx.strokeStyle = this.PHOSPHOR_DIM;
    this.ctx.lineWidth = 2;
    this.ctx.beginPath();
    this.ctx.moveTo(textStartX + offsetX, underlineY);
    this.ctx.lineTo(textStartX + calculatedTextWidth + offsetX, underlineY);
    this.ctx.stroke();

    // Draw profile lines
    profile.lines.forEach((line, index) => {
      const yPos = textStartY + headerHeight + (this.lineHeight * index) + offsetY;

      // Draw label with glow
      this.ctx.fillStyle = this.PHOSPHOR_COLOR;
      this.ctx.shadowColor = this.PHOSPHOR_COLOR;
      this.ctx.shadowBlur = 4;
      this.ctx.fillText(`${line.label}:`, textStartX + offsetX, yPos);
      this.ctx.shadowBlur = 0;

      // Draw value
      const labelWidth = this.ctx.measureText(`${line.label}: `).width;
      this.ctx.fillStyle = this.PHOSPHOR_BRIGHT;
      this.ctx.fillText(line.value, textStartX + offsetX + labelWidth, yPos);
    });

    // Draw bio
    if (profile.bio) {
      const lines = profile.bio.split('\n');
      const startY = textStartY + headerHeight + (profile.lines.length * this.lineHeight) + this.lineHeight + offsetY;

      this.ctx.fillStyle = this.PHOSPHOR_COLOR;
      this.ctx.globalAlpha = 0.9;
      lines.forEach((line, i) => {
        this.ctx.fillText(line, textStartX + offsetX, startY + (i * this.lineHeight));
      });
      this.ctx.globalAlpha = 1.0;
    }

    // Draw background grid pattern (matching SVG bg-grid) - optional
    if (showGrid) {
      this.ctx.strokeStyle = this.PHOSPHOR_COLOR;
      this.ctx.globalAlpha = 0.15;
      this.ctx.lineWidth = 0.5;
      for (let x = 0; x <= width; x += 40) {
        this.ctx.beginPath();
        this.ctx.moveTo(x, 0);
        this.ctx.lineTo(x, height);
        this.ctx.stroke();
      }
      for (let y = 0; y <= height; y += 40) {
        this.ctx.beginPath();
        this.ctx.moveTo(0, y);
        this.ctx.lineTo(width, y);
        this.ctx.stroke();
      }
      this.ctx.globalAlpha = 1.0;
    }

    // Draw decoration (palette rects) - positioned at bottom with more spacing
    const colors = ["#ff3333", "#ffff33", "#33ff33", "#33ffff", "#3333ff", "#ff33ff"];
    const paletteY = width - 60; // Move up to avoid cutoff
    colors.forEach((color, i) => {
      this.ctx.fillStyle = color;
      this.ctx.globalAlpha = 0.8;
      this.ctx.fillRect(textStartX + (i * 35) + offsetX, paletteY, 35, 15);
    });
    this.ctx.globalAlpha = 1.0;

    // Draw command prompt at bottom with more spacing
    const promptY = width - 40; // Move up to avoid cutoff
    this.ctx.fillStyle = this.PHOSPHOR_COLOR;
    this.ctx.globalAlpha = 0.7;
    this.ctx.fillText('root@system:', this.padding + offsetX, promptY);
    this.ctx.globalAlpha = 1.0;
    const rootWidth = this.ctx.measureText('root@system: ').width;
    this.ctx.fillText('~ $ _', this.padding + offsetX + rootWidth, promptY);

    // Draw CRT bezel inner glow (border)
    this.ctx.strokeStyle = this.PHOSPHOR_COLOR;
    this.ctx.globalAlpha = 0.1;
    this.ctx.lineWidth = 4;
    this.ctx.strokeRect(2, 2, width - 4, height - 4);

    // Create and return THREE.Texture
    const texture = new THREE.CanvasTexture(this.canvas);
    texture.minFilter = THREE.LinearFilter;
    texture.magFilter = THREE.LinearFilter;
    texture.needsUpdate = true;

    return texture;
  }

  private async drawImage(imageSrc: string, offsetX: number, offsetY: number): Promise<void> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';

      img.onload = () => {
        const x = this.padding + offsetX;
        const y = this.padding + offsetY;

        // Draw image
        this.ctx.drawImage(img, x, y, this.imageDisplayWidth, this.imageDisplayHeight);

        // Apply green tint
        this.ctx.globalCompositeOperation = 'multiply';
        this.ctx.fillStyle = this.PHOSPHOR_COLOR;
        this.ctx.fillRect(x, y, this.imageDisplayWidth, this.imageDisplayHeight);
        this.ctx.globalCompositeOperation = 'source-over';

        // Add brightness back
        this.ctx.globalCompositeOperation = 'screen';
        this.ctx.globalAlpha = 0.3;
        this.ctx.fillStyle = this.PHOSPHOR_COLOR;
        this.ctx.fillRect(x, y, this.imageDisplayWidth, this.imageDisplayHeight);
        this.ctx.globalAlpha = 1.0;
        this.ctx.globalCompositeOperation = 'source-over';

        resolve();
      };

      img.onerror = () => {
        console.warn('Failed to load image, continuing without it');
        resolve();
      };

      img.src = imageSrc;
    });
  }

  getCanvas(): HTMLCanvasElement {
    return this.canvas;
  }

  getDimensions(): { width: number; height: number } {
    return {
      width: this.canvas.width,
      height: this.canvas.height
    };
  }
}
