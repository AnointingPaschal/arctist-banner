"use client";

import { useCallback, useEffect, useRef, useState } from "react";

// ─── Banner dimensions (original image is 2857 × 952) ───────────────────────
const BANNER_W = 2857;
const BANNER_H = 952;

// Avatar bounds
const AVATAR = { cx: 395, cy: 280, r: 235 };

// Flag bounds
const FLAG_RECT = { x: 2542, y: 142, w: 295, h: 205 };

// Text alignment
const TEXT_X = 410; // Shifted right for better padding next to the icon
const NAME_Y = 610; 
const CHAPTER_Y = 740;

// ─── Font settings ──────────────────────────────────────────────────────────
const NAME_FONT = "bold 52px 'Segoe UI', Arial, sans-serif";
const CHAPTER_FONT = "500 44px 'Segoe UI', Arial, sans-serif";
const TEXT_COLOR = "#0f172a"; 

// ─────────────────────────────────────────────────────────────────────────────

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

export default function BannerGenerator() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const bannerImgRef = useRef<HTMLImageElement | null>(null);

  const [avatarSrc, setAvatarSrc] = useState<string | null>(null);
  const [flagSrc,   setFlagSrc]   = useState<string | null>(null);
  const [name,      setName]      = useState("");
  const [chapter,   setChapter]   = useState("");
  const [isReady,   setIsReady]   = useState(false);
  const [isDrawing, setIsDrawing] = useState(false);

  // ── Image Transform States ──────────────────────────────────────────────
  const [avatarScale, setAvatarScale] = useState(1);
  const [avatarPan, setAvatarPan]     = useState({ x: 0, y: 0 });
  const [flagScale, setFlagScale]     = useState(1);
  const [flagPan, setFlagPan]         = useState({ x: 0, y: 0 });

  // ── Preload banner on mount ─────────────────────────────────────────────
  useEffect(() => {
    loadImage("/banner.png") 
      .then((img) => {
        bannerImgRef.current = img;
        setIsReady(true);
      })
      .catch(console.error);
  }, []);

  // ── Redraw whenever any input changes ──────────────────────────────────
  const redraw = useCallback(async () => {
    const canvas = canvasRef.current;
    const bannerImg = bannerImgRef.current;
    if (!canvas || !bannerImg || !isReady) return;

    setIsDrawing(true);

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    canvas.width  = BANNER_W;
    canvas.height = BANNER_H;

    ctx.clearRect(0, 0, BANNER_W, BANNER_H);

    // 1. DRAW BEHIND: Avatar with Live Transform
    if (avatarSrc) {
      try {
        const avatarImg = await loadImage(avatarSrc);
        ctx.save();
        
        const sz = AVATAR.r * 2;
        const imgAspect = avatarImg.width / avatarImg.height;
        let baseW = sz, baseH = sz;
        
        if (imgAspect > 1) { baseW = baseH * imgAspect; }
        else               { baseH = baseW / imgAspect; }
        
        const finalW = baseW * avatarScale;
        const finalH = baseH * avatarScale;
        const drawX = AVATAR.cx - finalW / 2 + avatarPan.x;
        const drawY = AVATAR.cy - finalH / 2 + avatarPan.y;

        ctx.drawImage(avatarImg, drawX, drawY, finalW, finalH);
        ctx.restore();
      } catch (e) {
        console.error("Avatar load error", e);
      }
    }

    // 2. DRAW BEHIND: Flag with Live Transform
    if (flagSrc) {
      try {
        const flagImg = await loadImage(flagSrc);
        const { x, y, w, h } = FLAG_RECT;
        
        ctx.save();
        const fAspect = flagImg.width / flagImg.height;
        const rectAspect = w / h;
        let baseW = w, baseH = h;
        
        if (fAspect > rectAspect) { baseW = h * fAspect; }
        else                      { baseH = w / fAspect; }
        
        const finalW = baseW * flagScale;
        const finalH = baseH * flagScale;
        const drawX = (x + w / 2) - finalW / 2 + flagPan.x;
        const drawY = (y + h / 2) - finalH / 2 + flagPan.y;
        
        ctx.drawImage(flagImg, drawX, drawY, finalW, finalH);
        ctx.restore();
      } catch (e) {
        console.error("Flag load error", e);
      }
    }

    // 3. DRAW ON TOP: Main Banner
    ctx.drawImage(bannerImg, 0, 0, BANNER_W, BANNER_H);

    // 4. DRAW ON TOP: Name Text
    if (name.trim()) {
      ctx.save();
      ctx.font = NAME_FONT;
      ctx.fillStyle = TEXT_COLOR;
      ctx.textAlign = "left";
      ctx.textBaseline = "middle";
      // Removed max-width constraint to stop text squishing
      ctx.fillText(name.trim(), TEXT_X, NAME_Y);
      ctx.restore();
    }

    // 5. DRAW ON TOP: Chapter Text
    if (chapter.trim()) {
      ctx.save();
      ctx.font = CHAPTER_FONT;
      ctx.fillStyle = TEXT_COLOR;
      ctx.textAlign = "left";
      ctx.textBaseline = "middle";
      ctx.fillText(chapter.trim(), TEXT_X, CHAPTER_Y);
      ctx.restore();
    }

    setIsDrawing(false);
  }, [isReady, avatarSrc, flagSrc, name, chapter, avatarScale, avatarPan, flagScale, flagPan]);

  useEffect(() => {
    redraw();
  }, [redraw]);

  const handleFileUpload = (
    e: React.ChangeEvent<HTMLInputElement>,
    setter: (src: string) => void
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      if (ev.target?.result) setter(ev.target.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleDownload = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const link = document.createElement("a");
    link.download = "arc-community-banner.png";
    link.href = canvas.toDataURL("image/png");
    link.click();
  };

  const handleReset = () => {
    setAvatarSrc(null);
    setFlagSrc(null);
    setName("");
    setChapter("");
    setAvatarScale(1);
    setAvatarPan({ x: 0, y: 0 });
    setFlagScale(1);
    setFlagPan({ x: 0, y: 0 });
  };

  return (
    <main className="min-h-screen bg-gradient-to-b from-[#f8f3ed] to-[#eee8df] py-8 px-4">
      <div className="max-w-5xl mx-auto mb-8 text-center">
        <div className="inline-flex items-center gap-2 bg-[#0b1130] text-white text-xs font-semibold px-3 py-1 rounded-full mb-4 tracking-wider uppercase">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          Arc Community Contest
        </div>
        <h1 className="text-3xl font-bold text-[#0b1130] mb-2">
          Arc-tist Banner Generator
        </h1>
        <p className="text-gray-500 text-sm max-w-lg mx-auto">
          Personalize your community X/Twitter banner — adjust your images perfectly!
        </p>
      </div>

      <div className="max-w-5xl mx-auto space-y-6">
        {/* Canvas Preview */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
            <span className="text-sm font-medium text-gray-600">Live Preview</span>
            {isDrawing && (
              <span className="text-xs text-gray-400 animate-pulse">Updating…</span>
            )}
          </div>
          <div className="p-3 bg-gray-50">
            <canvas
              ref={canvasRef}
              className="w-full rounded-lg"
              style={{ aspectRatio: `${BANNER_W}/${BANNER_H}` }}
            />
          </div>
        </div>

        {/* Controls */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          
          <UploadCard
            label="Profile Photo"
            description="Fits into the circular frame on the left"
            icon={<AvatarIcon />}
            accept="image/*"
            preview={avatarSrc}
            onChange={(e) => {
              handleFileUpload(e, setAvatarSrc);
              setAvatarScale(1); setAvatarPan({ x: 0, y: 0 });
            }}
            onClear={() => {
              setAvatarSrc(null);
              setAvatarScale(1); setAvatarPan({ x: 0, y: 0 });
            }}
            scale={avatarScale}
            onScaleChange={setAvatarScale}
            pan={avatarPan}
            onPanChange={setAvatarPan}
          />

          <UploadCard
            label="Country / Chapter Flag"
            description="Fits into the rectangular sign on the right"
            icon={<FlagIcon />}
            accept="image/*"
            preview={flagSrc}
            onChange={(e) => {
              handleFileUpload(e, setFlagSrc);
              setFlagScale(1); setFlagPan({ x: 0, y: 0 });
            }}
            onClear={() => {
              setFlagSrc(null);
              setFlagScale(1); setFlagPan({ x: 0, y: 0 });
            }}
            scale={flagScale}
            onScaleChange={setFlagScale}
            pan={flagPan}
            onPanChange={setFlagPan}
          />

          <TextCard
            label="Your Name"
            placeholder="e.g. Pascal Anointing"
            icon={<PersonIcon />}
            value={name}
            onChange={setName}
            maxLength={35}
            hint="Shown in the top white pill"
          />

          <TextCard
            label="Chapter / Location"
            placeholder="e.g. Arc Nigeria"
            icon={<GlobeIcon />}
            value={chapter}
            onChange={setChapter}
            maxLength={35}
            hint="Shown in the bottom white pill"
          />
        </div>

        <div className="flex items-center gap-3 justify-end">
          <button
            onClick={handleReset}
            className="px-5 py-2.5 rounded-xl text-sm font-medium text-gray-500 hover:text-gray-700 hover:bg-gray-100 transition-colors"
          >
            Reset
          </button>
          <button
            onClick={handleDownload}
            disabled={!isReady}
            className="px-6 py-2.5 rounded-xl text-sm font-semibold bg-[#0b1130] text-white hover:bg-[#1a2456] active:scale-[0.98] transition-all disabled:opacity-40 flex items-center gap-2"
          >
            <DownloadIcon />
            Download Banner
          </button>
        </div>
      </div>
    </main>
  );
}

// ─── Sub-components ──────────────────────────────────────────────────────────

interface UploadCardProps {
  label: string;
  description: string;
  icon: React.ReactNode;
  accept: string;
  preview: string | null;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onClear: () => void;
  scale: number;
  onScaleChange: (v: number) => void;
  pan: { x: number; y: number };
  onPanChange: (v: { x: number; y: number }) => void;
}

function UploadCard({
  label, description, icon, accept, preview, onChange, onClear,
  scale, onScaleChange, pan, onPanChange
}: UploadCardProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex flex-col h-full">
      <div className="flex items-center gap-2 mb-1">
        <span className="text-[#0b1130]">{icon}</span>
        <span className="text-sm font-semibold text-[#0b1130]">{label}</span>
      </div>
      <p className="text-xs text-gray-400 mb-4">{description}</p>

      {!preview ? (
        <button
          onClick={() => inputRef.current?.click()}
          className="w-full h-full min-h-[120px] border-2 border-dashed border-gray-200 rounded-xl py-6 flex flex-col items-center justify-center gap-2 hover:border-[#0b1130] hover:bg-gray-50 transition-colors group cursor-pointer"
        >
          <span className="text-2xl">📎</span>
          <span className="text-xs text-gray-400 group-hover:text-gray-600 transition-colors">
            Click to upload image
          </span>
        </button>
      ) : (
        <div className="flex flex-col gap-4">
          <div className="flex justify-between items-center bg-gray-50 p-2 rounded-lg border border-gray-100">
             <span className="text-xs text-emerald-600 font-medium px-2">Image Uploaded</span>
             <div className="flex gap-3">
               <button onClick={() => inputRef.current?.click()} className="text-xs font-medium text-[#0b1130] hover:underline">Change</button>
               <button onClick={onClear} className="text-xs font-medium text-red-500 hover:underline">Remove</button>
             </div>
          </div>
          
          <div className="space-y-3">
            <div className="space-y-1">
              <label className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">Zoom</label>
              <input type="range" min="0.5" max="3" step="0.05" value={scale} onChange={(e) => onScaleChange(parseFloat(e.target.value))} className="w-full accent-[#0b1130]" />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">Pan Horizontal</label>
              <input type="range" min="-400" max="400" step="10" value={pan.x} onChange={(e) => onPanChange({...pan, x: parseInt(e.target.value)})} className="w-full accent-[#0b1130]" />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">Pan Vertical</label>
              <input type="range" min="-400" max="400" step="10" value={pan.y} onChange={(e) => onPanChange({...pan, y: parseInt(e.target.value)})} className="w-full accent-[#0b1130]" />
            </div>
          </div>
        </div>
      )}

      <input ref={inputRef} type="file" accept={accept} onChange={onChange} className="hidden" />
    </div>
  );
}

interface TextCardProps {
  label: string;
  placeholder: string;
  icon: React.ReactNode;
  value: string;
  onChange: (v: string) => void;
  maxLength: number;
  hint: string;
}

function TextCard({ label, placeholder, icon, value, onChange, maxLength, hint }: TextCardProps) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
      <div className="flex items-center gap-2 mb-1">
        <span className="text-[#0b1130]">{icon}</span>
        <span className="text-sm font-semibold text-[#0b1130]">{label}</span>
      </div>
      <p className="text-xs text-gray-400 mb-4">{hint}</p>
      <div className="relative">
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          maxLength={maxLength}
          className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm
                     text-[#0b1130] placeholder-gray-300 focus:outline-none 
                     focus:border-[#0b1130] focus:ring-1 focus:ring-[#0b1130] transition"
        />
        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-300">
          {value.length}/{maxLength}
        </span>
      </div>
    </div>
  );
}

// ─── Icons ───────────────────────────────────────────────────────────────────
function AvatarIcon() { return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/></svg>; }
function FlagIcon() { return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"/><line x1="4" y1="22" x2="4" y2="15"/></svg>; }
function PersonIcon() { return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/></svg>; }
function GlobeIcon() { return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>; }
function DownloadIcon() { return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>; }
