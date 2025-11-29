import React, { useState, useRef, useEffect } from 'react'
import {
  Upload,
  Download,
  Terminal,
  Image as ImageIcon,
  Plus,
  Trash2,
  Type,
  List,
  Monitor,
  Film,
  AlertTriangle,
} from 'lucide-react'
import { processImage } from './utils/imageUtils'
import { generateWebGLGif } from './utils/gifUtils'
import { RetroTerminalWebGL, RetroTerminalWebGLRef } from './components/RetroTerminalWebGL'
import { DEFAULT_PROFILE, DEFAULT_CRT_CONFIG } from './constants'
import { TerminalProfile, TerminalLine, CRTEffectConfig } from './types'

// WebGL detection helper
const detectWebGL = (): boolean => {
  try {
    const canvas = document.createElement('canvas')
    const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl')
    return !!gl
  } catch (e) {
    return false
  }
}

const App: React.FC = () => {
  // State
  const [profile, setProfile] = useState<TerminalProfile>(DEFAULT_PROFILE)
  const [imageSrc, setImageSrc] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<'list' | 'bio'>('list')
  const [isGeneratingGif, setIsGeneratingGif] = useState(false)
  const [isProcessingImage, setIsProcessingImage] = useState(false)
  const [crtConfig, setCrtConfig] = useState<CRTEffectConfig>(DEFAULT_CRT_CONFIG)
  const [hasWebGL, setHasWebGL] = useState(true)
  const webglRef = useRef<RetroTerminalWebGLRef>(null)

  // Check WebGL support on mount
  useEffect(() => {
    setHasWebGL(detectWebGL())
  }, [])

  // Handlers
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setIsProcessingImage(true)
      try {
        const base64 = await processImage(e.target.files[0])
        setImageSrc(base64)
      } catch (err) {
        console.error(err)
        alert(`Failed to process image: ${err instanceof Error ? err.message : 'Unknown error'}`)
      } finally {
        setIsProcessingImage(false)
      }
    }
  }

  const handleDownloadPNG = () => {
    const canvas = document.getElementById('retro-webgl-output') as HTMLCanvasElement
    if (!canvas) {
      alert('Canvas not found')
      return
    }

    // Create download link
    canvas.toBlob((blob) => {
      if (!blob) {
        alert('Failed to generate image')
        return
      }
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `retro-profile-${profile.username
        .replace(/[^a-z0-9]/gi, '_')
        .toLowerCase()}.png`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)
    })
  }

  const handleDownloadGif = async () => {
    if (!webglRef.current) {
      alert('WebGL renderer not ready')
      return
    }

    setIsGeneratingGif(true)
    try {
      await generateWebGLGif(
        'retro-webgl-output',
        `retro-profile-${profile.username.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.gif`,
        webglRef.current.captureFrame,
      )
    } catch (e: any) {
      console.error(e)
      alert(`GIF Generation Failed: ${e.message || 'Unknown error'}`)
    } finally {
      setIsGeneratingGif(false)
    }
  }

  const updateCrtConfig = (key: keyof CRTEffectConfig, value: number) => {
    setCrtConfig((prev) => ({ ...prev, [key]: value }))
  }

  const updateLine = (index: number, field: keyof TerminalLine, value: string) => {
    const newLines = [...profile.lines]
    newLines[index] = { ...newLines[index], [field]: value }
    setProfile({ ...profile, lines: newLines })
  }

  const addLine = () => {
    setProfile({
      ...profile,
      lines: [...profile.lines, { label: 'NEW_KEY', value: 'Value' }],
    })
  }

  const removeLine = (index: number) => {
    const newLines = profile.lines.filter((_, i) => i !== index)
    setProfile({ ...profile, lines: newLines })
  }

  const updateUsername = (value: string) => {
    setProfile({ ...profile, username: value })
  }

  const updateBio = (value: string) => {
    setProfile({ ...profile, bio: value })
  }

  return (
    <div className="h-screen w-full bg-[#050505] text-[#33ff00] font-mono relative overflow-hidden selection:bg-[#33ff00] selection:text-black">
      {/* Background Grid Decoration */}
      <div
        className="fixed inset-0 pointer-events-none opacity-10 z-0"
        style={{
          backgroundImage:
            'linear-gradient(#33ff00 1px, transparent 1px), linear-gradient(90deg, #33ff00 1px, transparent 1px)',
          backgroundSize: '40px 40px',
        }}
      ></div>

      <div className="max-w-7xl h-full mx-auto relative z-10 flex flex-col xl:flex-row gap-4 xl:gap-8">
        {/* Left Control Panel - Scrollable */}
        <div className="w-full xl:w-1/3 flex flex-col gap-6 overflow-y-auto p-4 md:p-8 custom-scrollbar xl:h-full">
          <header className="border-b-2 border-[#33ff00] pb-4 mb-4">
            <h1 className="text-4xl font-bold uppercase tracking-widest flex items-center gap-3">
              <Terminal className="w-8 h-8" />
              Retro<span className="text-white">BIO</span>
            </h1>
            <p className="text-[#33ff00]/70 mt-2 text-sm uppercase">CRT Identity Generator v1.0</p>
          </header>

          {/* Image Input Section */}
          <section className="border border-[#33ff00]/30 bg-[#001100] p-6 rounded-sm shadow-[0_0_15px_rgba(51,255,0,0.1)] relative group">
            <div className="absolute top-0 right-0 p-2 opacity-50">
              <ImageIcon className="w-5 h-5" />
            </div>
            <h2 className="text-lg font-bold mb-4 flex items-center gap-2 uppercase tracking-wider">
              1. Source Visual
            </h2>
            <div className="relative cursor-pointer border-2 border-dashed border-[#33ff00]/40 hover:border-[#33ff00] hover:bg-[#33ff00]/5 transition-all p-8 text-center rounded bg-black/40">
              <input
                type="file"
                accept="image/*,.heic,.heif"
                onChange={handleImageUpload}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
              />
              <div className="flex flex-col items-center justify-center pointer-events-none">
                {isProcessingImage ? (
                  <div className="flex flex-col items-center">
                    <div className="w-8 h-8 border-2 border-[#33ff00] border-t-transparent rounded-full animate-spin mb-2"></div>
                    <span className="text-white font-bold mb-1">PROCESSING...</span>
                    <span className="text-xs text-[#33ff00]/70">Converting Image Format</span>
                  </div>
                ) : imageSrc ? (
                  <div className="flex flex-col items-center">
                    <span className="text-white font-bold mb-1">DATA_LOADED</span>
                    <span className="text-xs text-[#33ff00]/70">Sector 7G Image Buffer Active</span>
                  </div>
                ) : (
                  <>
                    <Upload className="w-8 h-8 mb-3 opacity-70" />
                    <span className="text-sm font-bold">DRAG OR SELECT FILE</span>
                    <span className="text-xs text-[#33ff00]/50 mt-1">
                      Supports HEIC, PNG, JPG, WebP
                    </span>
                  </>
                )}
              </div>
            </div>
          </section>

          {/* Data Editor Section */}
          <section className="border border-[#33ff00]/30 bg-[#001100] p-6 rounded-sm shadow-[0_0_15px_rgba(51,255,0,0.1)] flex-grow">
            <h2 className="text-lg font-bold mb-4 flex items-center gap-2 uppercase tracking-wider">
              2. Data Entry
            </h2>

            <div className="mb-6">
              <label className="text-[10px] uppercase opacity-60 mb-1 block tracking-widest">
                User Identity
              </label>
              <div className="relative">
                <span className="absolute left-3 top-2.5 text-[#33ff00]/50">&gt;</span>
                <input
                  type="text"
                  value={profile.username}
                  onChange={(e) => updateUsername(e.target.value)}
                  className="w-full bg-black border border-[#33ff00]/40 p-2 pl-6 text-[#33ff00] focus:outline-none focus:border-[#33ff00] focus:shadow-[0_0_10px_rgba(51,255,0,0.2)]"
                />
              </div>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-[#33ff00]/30 mb-4">
              <button
                onClick={() => setActiveTab('list')}
                className={`flex-1 py-2 text-xs uppercase font-bold tracking-wider flex items-center justify-center gap-2 transition-all ${
                  activeTab === 'list'
                    ? 'bg-[#33ff00]/20 border-b-2 border-[#33ff00] text-white'
                    : 'opacity-60 hover:opacity-100'
                }`}
              >
                <List className="w-3 h-3" /> Attributes
              </button>
              <button
                onClick={() => setActiveTab('bio')}
                className={`flex-1 py-2 text-xs uppercase font-bold tracking-wider flex items-center justify-center gap-2 transition-all ${
                  activeTab === 'bio'
                    ? 'bg-[#33ff00]/20 border-b-2 border-[#33ff00] text-white'
                    : 'opacity-60 hover:opacity-100'
                }`}
              >
                <Type className="w-3 h-3" /> Bio / Text
              </button>
            </div>

            {activeTab === 'list' && (
              <div className="space-y-3 h-64 overflow-y-auto pr-2 custom-scrollbar">
                {profile.lines.map((line, idx) => (
                  <div key={idx} className="flex gap-2 items-center group">
                    <input
                      className="w-1/3 bg-black/50 border border-[#33ff00]/20 focus:border-[#33ff00] p-1.5 text-xs text-[#33ff00] outline-none"
                      value={line.label}
                      onChange={(e) => updateLine(idx, 'label', e.target.value)}
                      placeholder="KEY"
                    />
                    <span className="text-[#33ff00]/30">:</span>
                    <input
                      className="flex-1 bg-black/50 border border-[#33ff00]/20 focus:border-[#33ff00] p-1.5 text-xs text-white outline-none"
                      value={line.value}
                      onChange={(e) => updateLine(idx, 'value', e.target.value)}
                      placeholder="VALUE"
                    />
                    <button
                      onClick={() => removeLine(idx)}
                      className="text-red-500/50 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity p-1"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
                <button
                  onClick={addLine}
                  className="w-full py-2 border border-dashed border-[#33ff00]/30 text-xs uppercase hover:bg-[#33ff00]/10 hover:border-[#33ff00] flex items-center justify-center gap-2 mt-4 transition-colors"
                >
                  <Plus className="w-3 h-3" /> Add Field
                </button>
              </div>
            )}

            {activeTab === 'bio' && (
              <div className="relative">
                <textarea
                  className="w-full h-64 bg-black/50 border border-[#33ff00]/30 p-4 text-[#33ff00] focus:border-[#33ff00] focus:shadow-[0_0_10px_rgba(51,255,0,0.1)] focus:outline-none resize-none text-sm font-mono leading-relaxed"
                  placeholder="Initialize text buffer..."
                  value={profile.bio || ''}
                  onChange={(e) => updateBio(e.target.value)}
                />
                <div className="absolute bottom-2 right-2 text-[10px] opacity-40">
                  Markdown Supported
                </div>
              </div>
            )}
          </section>

          {/* CRT Effects Control */}
          <section className="border border-[#33ff00]/30 bg-[#001100] p-6 rounded-sm shadow-[0_0_15px_rgba(51,255,0,0.1)]">
            <h2 className="text-lg font-bold mb-4 flex items-center gap-2 uppercase tracking-wider">
              3. CRT Effects
            </h2>
            <div className="space-y-3 max-h-96 overflow-y-auto pr-2 custom-scrollbar">
              {/* Screen Curve */}
              <div>
                <div className="flex justify-between mb-1">
                  <label className="text-[10px] uppercase opacity-60 tracking-widest">
                    Screen Curve
                  </label>
                  <span className="text-[10px] font-bold">
                    {crtConfig.curveIntensity.toFixed(3)}
                  </span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="0.2"
                  step="0.01"
                  value={crtConfig.curveIntensity}
                  onChange={(e) => updateCrtConfig('curveIntensity', parseFloat(e.target.value))}
                  className="w-full h-2 bg-[#33ff00]/20 rounded-lg appearance-none cursor-pointer accent-[#33ff00]"
                />
              </div>

              {/* Scanline Count */}
              <div>
                <div className="flex justify-between mb-1">
                  <label className="text-[10px] uppercase opacity-60 tracking-widest">
                    Scanlines
                  </label>
                  <span className="text-[10px] font-bold">
                    {Math.round(crtConfig.scanlineCount)}
                  </span>
                </div>
                <input
                  type="range"
                  min="50"
                  max="1000"
                  step="10"
                  value={crtConfig.scanlineCount}
                  onChange={(e) => updateCrtConfig('scanlineCount', parseFloat(e.target.value))}
                  className="w-full h-2 bg-[#33ff00]/20 rounded-lg appearance-none cursor-pointer accent-[#33ff00]"
                />
              </div>

              {/* Scanline Intensity */}
              <div>
                <div className="flex justify-between mb-1">
                  <label className="text-[10px] uppercase opacity-60 tracking-widest">
                    Scanline Depth
                  </label>
                  <span className="text-[10px] font-bold">
                    {crtConfig.scanlineIntensity.toFixed(2)}
                  </span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={crtConfig.scanlineIntensity}
                  onChange={(e) => updateCrtConfig('scanlineIntensity', parseFloat(e.target.value))}
                  className="w-full h-2 bg-[#33ff00]/20 rounded-lg appearance-none cursor-pointer accent-[#33ff00]"
                />
              </div>

              {/* RGB Shift */}
              <div>
                <div className="flex justify-between mb-1">
                  <label className="text-[10px] uppercase opacity-60 tracking-widest">
                    RGB Shift
                  </label>
                  <span className="text-[10px] font-bold">{crtConfig.rgbOffset.toFixed(4)}</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="0.02"
                  step="0.001"
                  value={crtConfig.rgbOffset}
                  onChange={(e) => updateCrtConfig('rgbOffset', parseFloat(e.target.value))}
                  className="w-full h-2 bg-[#33ff00]/20 rounded-lg appearance-none cursor-pointer accent-[#33ff00]"
                />
              </div>

              {/* Vignette Size */}
              <div>
                <div className="flex justify-between mb-1">
                  <label className="text-[10px] uppercase opacity-60 tracking-widest">
                    Vignette Size
                  </label>
                  <span className="text-[10px] font-bold">{crtConfig.vignetteSize.toFixed(2)}</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={crtConfig.vignetteSize}
                  onChange={(e) => updateCrtConfig('vignetteSize', parseFloat(e.target.value))}
                  className="w-full h-2 bg-[#33ff00]/20 rounded-lg appearance-none cursor-pointer accent-[#33ff00]"
                />
              </div>

              {/* Vignette Roundness */}
              <div>
                <div className="flex justify-between mb-1">
                  <label className="text-[10px] uppercase opacity-60 tracking-widest">
                    Vignette Smoothness
                  </label>
                  <span className="text-[10px] font-bold">
                    {crtConfig.vignetteRoundness.toFixed(2)}
                  </span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={crtConfig.vignetteRoundness}
                  onChange={(e) => updateCrtConfig('vignetteRoundness', parseFloat(e.target.value))}
                  className="w-full h-2 bg-[#33ff00]/20 rounded-lg appearance-none cursor-pointer accent-[#33ff00]"
                />
              </div>

              {/* Brightness */}
              <div>
                <div className="flex justify-between mb-1">
                  <label className="text-[10px] uppercase opacity-60 tracking-widest">
                    Brightness
                  </label>
                  <span className="text-[10px] font-bold">
                    {crtConfig.brightnessBoost.toFixed(2)}
                  </span>
                </div>
                <input
                  type="range"
                  min="0.5"
                  max="2"
                  step="0.1"
                  value={crtConfig.brightnessBoost}
                  onChange={(e) => updateCrtConfig('brightnessBoost', parseFloat(e.target.value))}
                  className="w-full h-2 bg-[#33ff00]/20 rounded-lg appearance-none cursor-pointer accent-[#33ff00]"
                />
              </div>

              {/* Noise Strength */}
              <div>
                <div className="flex justify-between mb-1">
                  <label className="text-[10px] uppercase opacity-60 tracking-widest">
                    Static Noise
                  </label>
                  <span className="text-[10px] font-bold">
                    {crtConfig.noiseStrength.toFixed(3)}
                  </span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="0.2"
                  step="0.01"
                  value={crtConfig.noiseStrength}
                  onChange={(e) => updateCrtConfig('noiseStrength', parseFloat(e.target.value))}
                  className="w-full h-2 bg-[#33ff00]/20 rounded-lg appearance-none cursor-pointer accent-[#33ff00]"
                />
              </div>

              {/* Flicker Intensity */}
              <div>
                <div className="flex justify-between mb-1">
                  <label className="text-[10px] uppercase opacity-60 tracking-widest">
                    Flicker
                  </label>
                  <span className="text-[10px] font-bold">
                    {crtConfig.flickerIntensity.toFixed(3)}
                  </span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="0.2"
                  step="0.01"
                  value={crtConfig.flickerIntensity}
                  onChange={(e) => updateCrtConfig('flickerIntensity', parseFloat(e.target.value))}
                  className="w-full h-2 bg-[#33ff00]/20 rounded-lg appearance-none cursor-pointer accent-[#33ff00]"
                />
              </div>

              {/* Grid Toggle */}
              <div>
                <div className="flex justify-between items-center">
                  <label className="text-[10px] uppercase opacity-60 tracking-widest">
                    Background Grid
                  </label>
                  <button
                    onClick={() => setCrtConfig((prev) => ({ ...prev, showGrid: !prev.showGrid }))}
                    className={`px-3 py-1 text-[10px] font-bold border transition-colors ${
                      crtConfig.showGrid
                        ? 'border-[#33ff00] bg-[#33ff00]/20 text-[#33ff00]'
                        : 'border-[#33ff00]/30 bg-transparent text-[#33ff00]/50'
                    }`}
                  >
                    {crtConfig.showGrid ? 'ON' : 'OFF'}
                  </button>
                </div>
              </div>
            </div>
          </section>

          {/* Action Buttons */}
          <div className="flex flex-col gap-3">
            <button
              onClick={handleDownloadPNG}
              disabled={!hasWebGL}
              className={`w-full border-2 border-[#33ff00] bg-[#33ff00]/5 text-[#33ff00] font-bold py-4 px-6 hover:bg-[#33ff00] hover:text-black transition-all flex items-center justify-center gap-3 uppercase tracking-wider shadow-[0_0_20px_rgba(51,255,0,0.15)] group ${
                !hasWebGL ? 'opacity-50 cursor-not-allowed' : ''
              }`}
            >
              <Download className="w-6 h-6 group-hover:animate-bounce" /> Export Image (.PNG)
            </button>

            <button
              onClick={handleDownloadGif}
              disabled={isGeneratingGif || !hasWebGL}
              className={`w-full border-2 border-[#33ff00]/50 bg-black text-[#33ff00]/80 font-bold py-3 px-6 hover:bg-[#33ff00]/10 hover:text-[#33ff00] hover:border-[#33ff00] transition-all flex items-center justify-center gap-3 uppercase tracking-wider ${
                isGeneratingGif || !hasWebGL ? 'opacity-50 cursor-not-allowed' : ''
              }`}
            >
              {isGeneratingGif ? (
                <>
                  <div className="w-4 h-4 border-2 border-[#33ff00] border-t-transparent rounded-full animate-spin"></div>
                  ENCODING FRAMES...
                </>
              ) : (
                <>
                  <Film className="w-5 h-5" /> Export Animation (.GIF)
                </>
              )}
            </button>
          </div>
        </div>

        {/* Right Preview Panel (CRT Monitor) */}
        <div className="w-full xl:w-2/3 flex flex-col xl:h-full min-h-[400px]">
          <div className="flex items-center justify-between mb-4 border-b border-[#33ff00]/30 pb-2 px-4 xl:px-0">
            <h2 className="text-lg font-bold uppercase tracking-widest flex items-center gap-2">
              <Monitor className="w-5 h-5" />
              Visual Output
            </h2>
            <div className="flex gap-4 text-[10px] uppercase font-bold text-[#33ff00]/70">
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 bg-[#33ff00] rounded-full animate-pulse"></span> 60Hz
              </span>
              <span>NTSC-J</span>
            </div>
          </div>

          {/* CRT Monitor Container */}
          <div className="crt-container flex-1 relative min-h-[400px] xl:min-h-[650px] flex items-center justify-center p-4 xl:p-8 bg-[#0a0a0a]">
            {!hasWebGL ? (
              /* WebGL Not Supported Error */
              <div className="flex flex-col items-center justify-center gap-6 p-12 border-2 border-red-500/50 bg-red-500/5 rounded">
                <AlertTriangle className="w-16 h-16 text-red-500" />
                <div className="text-center space-y-2">
                  <h3 className="text-2xl font-bold text-white uppercase">WebGL Not Supported</h3>
                  <p className="text-[#33ff00]/70 max-w-md">
                    Your browser does not support WebGL, which is required for CRT effects. Please
                    use a modern browser like Chrome, Firefox, or Safari.
                  </p>
                </div>
                <div className="flex gap-4 text-sm">
                  <a
                    href="https://www.google.com/chrome/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-4 py-2 border border-[#33ff00]/50 hover:bg-[#33ff00]/10 transition-colors"
                  >
                    Download Chrome
                  </a>
                  <a
                    href="https://www.mozilla.org/firefox/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-4 py-2 border border-[#33ff00]/50 hover:bg-[#33ff00]/10 transition-colors"
                  >
                    Download Firefox
                  </a>
                </div>
              </div>
            ) : (
              <>
                {/* Overlay Effects */}
                <div className="crt-scanline absolute inset-0 z-10 pointer-events-none"></div>
                <div className="crt-flicker absolute inset-0 z-20 pointer-events-none"></div>

                {/* Actual Content Wrapper with Turn On Animation */}
                <div className="relative z-0 w-full h-full flex items-center justify-center overflow-auto custom-scrollbar crt-turn-on">
                  <RetroTerminalWebGL
                    ref={webglRef}
                    id="retro-webgl-output"
                    imageSrc={imageSrc}
                    profile={profile}
                    crtConfig={crtConfig}
                  />
                </div>
              </>
            )}
          </div>

          <div className="mt-4 flex flex-col xl:flex-row justify-between gap-2 text-[10px] opacity-50 uppercase font-mono border-t border-[#33ff00]/10 pt-2 px-4 xl:px-0">
            <div>Output Format: WebGL / GIF (Animated)</div>
            <div>Render Engine: Three.js // Shader-Based CRT Effects</div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default App
