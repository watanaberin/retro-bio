import React, { useState, useRef, useEffect } from "react";
import { Upload, Download, Terminal, Image as ImageIcon, Plus, Trash2, Type, List, Monitor, Film } from "lucide-react";
import { processImage, downloadSvg } from "./utils/imageUtils";
import { generateGif } from "./utils/gifUtils";
import { RetroTerminalSvg } from "./components/RetroTerminalSvg";
import { DEFAULT_PROFILE, DEFAULT_CONFIG } from "./constants";
import { TerminalProfile, TerminalLine } from "./types";

const App: React.FC = () => {
  // State
  const [profile, setProfile] = useState<TerminalProfile>(DEFAULT_PROFILE);
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'list' | 'bio'>('list');
  const [isGeneratingGif, setIsGeneratingGif] = useState(false);
  const [blurLevel, setBlurLevel] = useState(1); // Default blur level

  // Handlers
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      try {
        const base64 = await processImage(e.target.files[0]);
        setImageSrc(base64);
      } catch (err) {
        console.error(err);
        alert("Failed to process image.");
      }
    }
  };

  const handleDownload = () => {
    downloadSvg("retro-svg-output", `retro-profile-${profile.username.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.svg`);
  };

  const handleDownloadGif = async () => {
    setIsGeneratingGif(true);
    try {
      await generateGif("retro-svg-output", `retro-profile-${profile.username.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.gif`);
    } catch (e: any) {
      console.error(e);
      alert(`GIF Generation Failed: ${e.message || "Unknown error"}`);
    } finally {
      setIsGeneratingGif(false);
    }
  };

  const updateLine = (index: number, field: keyof TerminalLine, value: string) => {
    const newLines = [...profile.lines];
    newLines[index] = { ...newLines[index], [field]: value };
    setProfile({ ...profile, lines: newLines });
  };

  const addLine = () => {
    setProfile({
      ...profile,
      lines: [...profile.lines, { label: "NEW_KEY", value: "Value" }]
    });
  };

  const removeLine = (index: number) => {
    const newLines = profile.lines.filter((_, i) => i !== index);
    setProfile({ ...profile, lines: newLines });
  };

  const updateUsername = (value: string) => {
    setProfile({ ...profile, username: value });
  };

  const updateBio = (value: string) => {
    setProfile({ ...profile, bio: value });
  };

  return (
    <div className="min-h-screen w-full bg-[#050505] text-[#33ff00] p-4 md:p-8 font-mono relative overflow-x-hidden selection:bg-[#33ff00] selection:text-black">

      {/* Background Grid Decoration */}
      <div className="fixed inset-0 pointer-events-none opacity-10 z-0"
        style={{ backgroundImage: 'linear-gradient(#33ff00 1px, transparent 1px), linear-gradient(90deg, #33ff00 1px, transparent 1px)', backgroundSize: '40px 40px' }}>
      </div>

      <div className="max-w-7xl mx-auto relative z-10 flex flex-col xl:flex-row gap-8">

        {/* Left Control Panel */}
        <div className="w-full xl:w-1/3 flex flex-col gap-6">
          <header className="border-b-2 border-[#33ff00] pb-4 mb-4">
            <h1 className="text-4xl font-bold uppercase tracking-widest flex items-center gap-3">
              <Terminal className="w-8 h-8" />
              Retro<span className="text-white">BIO</span>
            </h1>
            <p className="text-[#33ff00]/70 mt-2 text-sm uppercase">CRT Identity Generator v1.0</p>
          </header>

          {/* Image Input Section */}
          <section className="border border-[#33ff00]/30 bg-[#001100] p-6 rounded-sm shadow-[0_0_15px_rgba(51,255,0,0.1)] relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-2 opacity-50">
              <ImageIcon className="w-5 h-5" />
            </div>
            <h2 className="text-lg font-bold mb-4 flex items-center gap-2 uppercase tracking-wider">
              1. Source Visual
            </h2>
            <div className="relative cursor-pointer border-2 border-dashed border-[#33ff00]/40 hover:border-[#33ff00] hover:bg-[#33ff00]/5 transition-all p-8 text-center rounded bg-black/40">
              <input
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
              />
              <div className="flex flex-col items-center justify-center pointer-events-none">
                {imageSrc ? (
                  <div className="flex flex-col items-center">
                    <span className="text-white font-bold mb-1">DATA_LOADED</span>
                    <span className="text-xs text-[#33ff00]/70">Sector 7G Image Buffer Active</span>
                  </div>
                ) : (
                  <>
                    <Upload className="w-8 h-8 mb-3 opacity-70" />
                    <span className="text-sm font-bold">DRAG OR SELECT FILE</span>
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
              <label className="text-[10px] uppercase opacity-60 mb-1 block tracking-widest">User Identity</label>
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
                className={`flex-1 py-2 text-xs uppercase font-bold tracking-wider flex items-center justify-center gap-2 transition-all ${activeTab === 'list' ? 'bg-[#33ff00]/20 border-b-2 border-[#33ff00] text-white' : 'opacity-60 hover:opacity-100'}`}
              >
                <List className="w-3 h-3" /> Attributes
              </button>
              <button
                onClick={() => setActiveTab('bio')}
                className={`flex-1 py-2 text-xs uppercase font-bold tracking-wider flex items-center justify-center gap-2 transition-all ${activeTab === 'bio' ? 'bg-[#33ff00]/20 border-b-2 border-[#33ff00] text-white' : 'opacity-60 hover:opacity-100'}`}
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
                  value={profile.bio || ""}
                  onChange={(e) => updateBio(e.target.value)}
                />
                <div className="absolute bottom-2 right-2 text-[10px] opacity-40">Markdown Supported</div>
              </div>
            )}

          </section>

          {/* Effects Control */}
          <section className="border border-[#33ff00]/30 bg-[#001100] p-6 rounded-sm shadow-[0_0_15px_rgba(51,255,0,0.1)]">
            <h2 className="text-lg font-bold mb-4 flex items-center gap-2 uppercase tracking-wider">
              3. Signal Effects
            </h2>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between mb-2">
                  <label className="text-[10px] uppercase opacity-60 tracking-widest">Global Blur / Focus</label>
                  <span className="text-[10px] font-bold">{blurLevel.toFixed(1)}px</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="2"
                  step="0.1"
                  value={blurLevel}
                  onChange={(e) => setBlurLevel(parseFloat(e.target.value))}
                  className="w-full h-2 bg-[#33ff00]/20 rounded-lg appearance-none cursor-pointer accent-[#33ff00]"
                />
              </div>
            </div>
          </section>

          {/* Action Buttons */}
          <div className="flex flex-col gap-3">
            <button
              onClick={handleDownload}
              className="w-full border-2 border-[#33ff00] bg-[#33ff00]/5 text-[#33ff00] font-bold py-4 px-6 hover:bg-[#33ff00] hover:text-black transition-all flex items-center justify-center gap-3 uppercase tracking-wider shadow-[0_0_20px_rgba(51,255,0,0.15)] group"
            >
              <Download className="w-6 h-6 group-hover:animate-bounce" /> Export Signal (.SVG)
            </button>

            <button
              onClick={handleDownloadGif}
              disabled={isGeneratingGif}
              className={`w-full border-2 border-[#33ff00]/50 bg-black text-[#33ff00]/80 font-bold py-3 px-6 hover:bg-[#33ff00]/10 hover:text-[#33ff00] hover:border-[#33ff00] transition-all flex items-center justify-center gap-3 uppercase tracking-wider ${isGeneratingGif ? 'opacity-50 cursor-wait' : ''}`}
            >
              {isGeneratingGif ? (
                <>
                  <div className="w-4 h-4 border-2 border-[#33ff00] border-t-transparent rounded-full animate-spin"></div>
                  ENCODING SCANLINES...
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
        <div className="w-full xl:w-2/3 flex flex-col">
          <div className="flex items-center justify-between mb-4 border-b border-[#33ff00]/30 pb-2">
            <h2 className="text-lg font-bold uppercase tracking-widest flex items-center gap-2">
              <Monitor className="w-5 h-5" />
              Visual Output
            </h2>
            <div className="flex gap-4 text-[10px] uppercase font-bold text-[#33ff00]/70">
              <span className="flex items-center gap-1"><span className="w-2 h-2 bg-[#33ff00] rounded-full animate-pulse"></span> 60Hz</span>
              <span>NTSC-J</span>
            </div>
          </div>

          {/* CRT Monitor Container */}
          <div className="crt-container flex-grow relative min-h-[650px] flex items-center justify-center p-8 bg-[#0a0a0a]">
            {/* Overlay Effects */}
            <div className="crt-scanline absolute inset-0 z-10 pointer-events-none"></div>
            <div className="crt-flicker absolute inset-0 z-20 pointer-events-none"></div>

            {/* Actual Content Wrapper with Turn On Animation */}
            <div className="relative z-0 w-full h-full flex items-center justify-center overflow-auto custom-scrollbar crt-turn-on">
              <RetroTerminalSvg
                id="retro-svg-output"
                imageSrc={imageSrc}
                profile={profile}
                config={DEFAULT_CONFIG}
                blurLevel={blurLevel}
              />
            </div>
          </div>

          <div className="mt-4 flex justify-between text-[10px] opacity-50 uppercase font-mono border-t border-[#33ff00]/10 pt-2">
            <div>Output Format: SVG / GIF (Animated)</div>
            <div>Filter Engine: Floyd-Steinberg bypassed // Green-Matrix Active</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default App;