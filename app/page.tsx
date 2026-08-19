"use client";

import { useCallback, useEffect, useRef, useState } from "react";

// ─── Banner dimensions (original image is 2857 × 952) ───────────────────────
const BANNER_W = 2857;
const BANNER_H = 952;

// Avatar bounds (We draw a large square behind the transparent hole)
const AVATAR = { cx: 395, cy: 280, r: 235 };

// Flag bounds (We draw behind the rectangular transparent hole)
const FLAG_RECT = { x: 2542, y: 142, w: 295, h: 205 };

// Text alignment (Precisely mapped to the white area of the pills)
const TEXT_X = 390;
const NAME_Y = 614;     // Exact vertical center of top pill
const CHAPTER_Y = 744;  // Exact vertical center of bottom pill
const MAX_TEXT_WIDTH = 280;

// ─── Font settings ──────────────────────────────────────────────────────────
const NAME_FONT = "bold 44px 'Inter', 'Segoe UI', system-ui, sans-serif";
const CHAPTER_FONT = "500 38px 'Inter', 'Segoe UI', system-ui, sans-serif";
const TEXT_COLOR = "#0f172a"; // Deep slate blue for high readability

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

  // ── Preload banner on mount ─────────────────────────────────────────────
  useEffect(() => {
    loadImage("/banner.png") // IMPORTANT: Make sure this is a .png to support transparency!
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

    // Clear canvas completely before drawing
    ctx.clearRect(0, 0, BANNER_W, BANNER_H);

    // 1. DRAW BEHIND: Avatar
    if (avatarSrc) {
      try {
        const avatarImg = await loadImage(avatarSrc);
        ctx.save();
        
        // Cover-fit logic for the avatar behind the circular hole
        const sz = AVATAR.r * 2;
        const imgAspect = avatarImg.width / avatarImg.height;
        let sw = sz, sh = sz;
        
        // Expand to fill the square bounds behind the circle
        if (imgAspect > 1) { sw = sh * imgAspect; }
        else               { sh = sw / imgAspect; }
        
        ctx.drawImage(
          avatarImg,
          AVATAR.cx - sw / 2,
          AVATAR.cy - sh / 2,
          sw, sh
        );
        ctx.restore();
      } catch (e) {
        console.error("Avatar load error", e);
      }
    }

    // 2. DRAW BEHIND: Flag
    if (flagSrc) {
      try {
        const flagImg = await loadImage(flagSrc);
        const { x, y, w, h } = FLAG_RECT;
        
        ctx.save();
        const fAspect = flagImg.width / flagImg.height;
        const rectAspect = w / h;
        let fw = w, fh = h, fx = x, fy = y;
        
        // Cover-fit the flag behind the rectangular hole
        if (fAspect > rectAspect) {
          fw = h * fAspect;
          fx = x - (fw - w) / 2;
        } else {
          fh = w / fAspect;
          fy = y - (fh - h) / 2;
        }
        
        ctx.drawImage(flagImg, fx, fy, fw, fh);
        ctx.restore();
      } catch (e) {
        console.error("Flag load error", e);
      }
    }

    // 3. DRAW ON TOP: Main Banner (Overlays the photos naturally)
    ctx.drawImage(bannerImg, 0, 0, BANNER_W, BANNER_H);

    // 4. DRAW ON TOP: Name Text
    if (name.trim()) {
      ctx.save();
      ctx.font = NAME_FONT;
      ctx.fillStyle = TEXT_COLOR;
      ctx.textAlign = "left";
      ctx.textBaseline = "middle";
      ctx.fillText(name.trim(), TEXT_X, NAME_Y, MAX_TEXT_WIDTH);
      ctx.restore();
    }

    // 5. DRAW ON TOP: Chapter Text
    if (chapter.trim()) {
      ctx.save();
      ctx.font = CHAPTER_FONT;
      ctx.fillStyle = TEXT_COLOR;
      ctx.textAlign = "left";
      ctx.textBaseline = "middle";
      ctx.fillText(chapter.trim(), TEXT_X, CHAPTER_Y, MAX_TEXT_WIDTH);
      ctx.restore();
    }

    setIsDrawing(false);
  }, [isReady, avatarSrc, flagSrc, name, chapter]);

  useEffect(() => {
    redraw();
  }, [redraw]);

  // ── File upload helpers ────────────────────────────────────────────────
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

  // ── Download ───────────────────────────────────────────────────────────
  const handleDownload = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const link = document.createElement("a");
    link.download = "arc-community-banner.png";
    link.href = canvas.toDataURL("image/png");
    link.click();
  };

  // ── Reset ──────────────────────────────────────────────────────────────
  const handleReset = () => {
    setAvatarSrc(null);
    setFlagSrc(null);
    setName("");
    setChapter("");
  };

  return (
    <main className="min-h-screen bg-gradient-to-b from-[#f8f3ed] to-[#eee8df] py-8 px-4">
      {/* Header */}
      <div className="max-w-5xl mx-auto mb-8 text-center">
        <div className="inline-flex items-center gap-2 bg-[#0b1130] text-white text-xs font-semibold px-3 py-1 rounded-full mb-4 tracking-wider uppercase">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          Arc Community Contest
        </div>
        <h1 className="text-3xl font-bold text-[#0b1130] mb-2">
          Arc-tist Banner Generator
        </h1>
        <p className="text-gray-500 text-sm max-w-lg mx-auto">
          Personalize your community X/Twitter banner — add your photo, flag,
          name, and chapter, then download your ready-to-use 1:1 banner.
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

          {/* Upload: Avatar */}
          <UploadCard
            label="Profile Photo"
            description="Fits into the circular frame on the left"
            icon={<AvatarIcon />}
            accept="image/*"
            preview={avatarSrc}
            previewType="circle"
            onChange={(e) => handleFileUpload(e, setAvatarSrc)}
            onClear={() => setAvatarSrc(null)}
          />

          {/* Upload: Flag */}
          <UploadCard
            label="Country / Chapter Flag"
            description="Fits into the rectangular sign on the right"
            icon={<FlagIcon />}
            accept="image/*"
            preview={flagSrc}
            previewType="rect"
            onChange={(e) => handleFileUpload(e, setFlagSrc)}
            onClear={() => setFlagSrc(null)}
          />

          {/* Name input */}
          <TextCard
            label="Your Name"
            placeholder="e.g. Pascal Anointing"
            icon={<PersonIcon />}
            value={name}
            onChange={setName}
            maxLength={25}
            hint="Shown in the top white pill"
          />

          {/* Chapter input */}
          <TextCard
            label="Chapter / Location"
            placeholder="e.g. Arc Nigeria · Lagos"
            icon={<GlobeIcon />}
            value={chapter}
            onChange={setChapter}
            maxLength={30}
            hint="Shown in the bottom white pill"
          />
        </div>

        {/* Action bar */}
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
            className="px-6 py-2.5 rounded-xl text-sm font-semibold bg-[#0b1130] text-white 
                       hover:bg-[#1a2456] active:scale-[0.98] transition-all 
                       disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2"
          >
            <DownloadIcon />
            Download Banner
          </button>
        </div>

        {/* Footer tip */}
        <p className="text-center text-xs text-gray-400 pb-4">
          Your banner is generated locally — no data is uploaded to any server. 
          Output is full-resolution PNG (2857 × 952 px).
        </p>
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
  previewType: "circle" | "rect";
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onClear: () => void;
}

function UploadCard({
  label, description, icon, accept,
  preview, previewType, onChange, onClear
}: UploadCardProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
      <div className="flex items-center gap-2 mb-1">
        <span className="text-[#0b1130]">{icon}</span>
        <span className="text-sm font-semibold text-[#0b1130]">{label}</span>
      </div>
      <p className="text-xs text-gray-400 mb-4">{description}</p>

      {preview ? (
        <div className="flex items-center gap-4">
          {previewType === "circle" ? (
            <img
              src={preview}
              alt="Preview"
              className="w-16 h-16 rounded-full object-cover border-2 border-gray-100"
            />
          ) : (
            <img
              src={preview}
              alt="Preview"
              className="w-16 h-10 rounded-md object-cover border border-gray-100"
            />
          )}
          <div className="flex gap-2">
            <button
              onClick={() => inputRef.current?.click()}
              className="text-xs text-[#0b1130] underline underline-offset-2"
            >
              Change
            </button>
            <button
              onClick={onClear}
              className="text-xs text-red-400 underline underline-offset-2"
            >
              Remove
            </button>
          </div>
        </div>
      ) : (
        <button
          onClick={() => inputRef.current?.click()}
          className="w-full border-2 border-dashed border-gray-200 rounded-xl py-6 
                     flex flex-col items-center gap-2 hover:border-[#0b1130] 
                     hover:bg-gray-50 transition-colors group cursor-pointer"
        >
          <span className="text-2xl">📎</span>
          <span className="text-xs text-gray-400 group-hover:text-gray-600 transition-colors">
            Click to upload image
          </span>
          <span className="text-xs text-gray-300">PNG, JPG, WEBP</span>
        </button>
      )}

      <input
        ref={inputRef}
        type="file"
        accept={accept}
        onChange={onChange}
        className="hidden"
      />
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
function AvatarIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/>
    </svg>
  );
}

function FlagIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"/>
      <line x1="4" y1="22" x2="4" y2="15"/>
    </svg>
  );
}

function PersonIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/>
    </svg>
  );
}

function GlobeIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="10"/>
      <line x1="2" y1="12" x2="22" y2="12"/>
      <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
    </svg>
  );
}

function DownloadIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
      <polyline points="7 10 12 15 17 10"/>
      <line x1="12" y1="15" x2="12" y2="3"/>
    </svg>
  );
}
