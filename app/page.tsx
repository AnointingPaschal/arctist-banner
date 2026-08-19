"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";

// ─── Banner dimensions (original image is 2857 × 952) ───────────────────────
const BANNER_W = 2857;
const BANNER_H = 952;

// Avatar bounds
const AVATAR = { cx: 395, cy: 280, r: 235 };

// Flag bounds
const FLAG_RECT = { x: 2542, y: 142, w: 295, h: 205 };

// Text alignment base
const TEXT_X = 410;
const NAME_Y = 610; 
const CHAPTER_Y = 740;

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
  const offscreenCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const bannerImgRef = useRef<HTMLImageElement | null>(null);

  // Accordion state
  const [openPanel, setOpenPanel] = useState<string>("avatar");

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

  // ── Text Settings States ────────────────────────────────────────────────
  const [nameFont, setNameFont] = useState("'Segoe UI', Arial, sans-serif");
  const [nameSize, setNameSize] = useState(52);
  const [namePan, setNamePan]   = useState({ x: 0, y: 0 });

  const [chapterFont, setChapterFont] = useState("'Segoe UI', Arial, sans-serif");
  const [chapterSize, setChapterSize] = useState(44);
  const [chapterPan, setChapterPan]   = useState({ x: 0, y: 0 });

  // ── Preload banner on mount ─────────────────────────────────────────────
  useEffect(() => {
    offscreenCanvasRef.current = document.createElement('canvas');
    offscreenCanvasRef.current.width = BANNER_W;
    offscreenCanvasRef.current.height = BANNER_H;

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
    const offscreenCanvas = offscreenCanvasRef.current;
    const bannerImg = bannerImgRef.current;
    if (!canvas || !offscreenCanvas || !bannerImg || !isReady) return;

    setIsDrawing(true);

    const mainCtx = canvas.getContext("2d");
    const ctx = offscreenCanvas.getContext("2d");
    if (!mainCtx || !ctx) return;

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

    // 4. DRAW ON TOP: Name Text with Live Transform
    if (name.trim()) {
      ctx.save();
      ctx.font = `bold ${nameSize}px ${nameFont}`;
      ctx.fillStyle = TEXT_COLOR;
      ctx.textAlign = "left";
      ctx.textBaseline = "middle";
      ctx.fillText(name.trim(), TEXT_X + namePan.x, NAME_Y + namePan.y);
      ctx.restore();
    }

    // 5. DRAW ON TOP: Chapter Text with Live Transform
    if (chapter.trim()) {
      ctx.save();
      ctx.font = `500 ${chapterSize}px ${chapterFont}`;
      ctx.fillStyle = TEXT_COLOR;
      ctx.textAlign = "left";
      ctx.textBaseline = "middle";
      ctx.fillText(chapter.trim(), TEXT_X + chapterPan.x, CHAPTER_Y + chapterPan.y);
      ctx.restore();
    }

    // Copy offscreen canvas to main canvas to prevent flickering
    mainCtx.clearRect(0, 0, BANNER_W, BANNER_H);
    mainCtx.drawImage(offscreenCanvas, 0, 0);

    setIsDrawing(false);
  }, [
    isReady, avatarSrc, flagSrc, name, chapter, avatarScale, avatarPan, 
    flagScale, flagPan, nameFont, nameSize, namePan, chapterFont, chapterSize, chapterPan
  ]);

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
    setAvatarScale(1); setAvatarPan({ x: 0, y: 0 });
    setFlagScale(1); setFlagPan({ x: 0, y: 0 });
    setNameFont("'Segoe UI', Arial, sans-serif"); setNameSize(52); setNamePan({ x: 0, y: 0 });
    setChapterFont("'Segoe UI', Arial, sans-serif"); setChapterSize(44); setChapterPan({ x: 0, y: 0 });
  };

  const togglePanel = (panel: string) => {
    setOpenPanel(openPanel === panel ? "" : panel);
  };

  return (
    <main className="min-h-screen bg-gradient-to-b from-[#f8f3ed] to-[#eee8df] py-8 px-4">
      <div className="max-w-5xl mx-auto mb-8 text-center">
        <h1 className="text-3xl font-bold text-[#0b1130] mb-2">
          Arc-tist Banner Generator
        </h1>
        <p className="text-gray-500 text-sm max-w-lg mx-auto">
          Personalize your community X/Twitter banner — adjust your images and text perfectly!
        </p>
      </div>

      <div className="max-w-5xl mx-auto space-y-6">
        
        {/* Canvas Preview & Top Actions */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-gray-600">Live Preview</span>
              {isDrawing && <span className="text-xs text-gray-400">Rendering...</span>}
            </div>
            
            <div className="flex items-center gap-2">
              <button
                onClick={handleDownload}
                disabled={!isReady}
                className="px-4 py-2 rounded-lg text-xs font-semibold bg-[#0b1130] text-white hover:bg-[#1a2456] active:scale-[0.98] transition-all disabled:opacity-40 flex items-center gap-2"
              >
                <DownloadIcon />
                Download Banner
              </button>
            </div>
          </div>
          
          <div className="p-3 bg-gray-50">
            <canvas
              ref={canvasRef}
              className="w-full rounded-lg"
              style={{ aspectRatio: `${BANNER_W}/${BANNER_H}` }}
            />
          </div>
        </div>

        {/* Accordion Controls */}
        <div className="space-y-3">
          
          {/* Avatar Accordion */}
          <AccordionItem 
            title="Profile Photo" 
            icon={<AvatarIcon />} 
            isOpen={openPanel === "avatar"} 
            onToggle={() => togglePanel("avatar")}
          >
             <ImageControls
                accept="image/*"
                preview={avatarSrc}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => { handleFileUpload(e, setAvatarSrc); setAvatarScale(1); setAvatarPan({ x: 0, y: 0 }); }}
                onClear={() => { setAvatarSrc(null); setAvatarScale(1); setAvatarPan({ x: 0, y: 0 }); }}
                scale={avatarScale} onScaleChange={setAvatarScale}
                pan={avatarPan} onPanChange={setAvatarPan}
              />
          </AccordionItem>

          {/* Flag Accordion */}
          <AccordionItem 
            title="Country / Chapter Flag" 
            icon={<FlagIcon />} 
            isOpen={openPanel === "flag"} 
            onToggle={() => togglePanel("flag")}
          >
             <ImageControls
                accept="image/*"
                preview={flagSrc}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => { handleFileUpload(e, setFlagSrc); setFlagScale(1); setFlagPan({ x: 0, y: 0 }); }}
                onClear={() => { setFlagSrc(null); setFlagScale(1); setFlagPan({ x: 0, y: 0 }); }}
                scale={flagScale} onScaleChange={setFlagScale}
                pan={flagPan} onPanChange={setFlagPan}
              />
          </AccordionItem>

          {/* Name Accordion */}
          <AccordionItem 
            title="Your Name" 
            icon={<PersonIcon />} 
            isOpen={openPanel === "name"} 
            onToggle={() => togglePanel("name")}
          >
             <TextControls
                placeholder="e.g. Pascal Anointing"
                value={name} onChange={setName} maxLength={35}
                fontFamily={nameFont} onFontChange={setNameFont}
                fontSize={nameSize} onSizeChange={setNameSize}
                pan={namePan} onPanChange={setNamePan}
             />
          </AccordionItem>

          {/* Chapter Accordion */}
          <AccordionItem 
            title="Chapter / Location" 
            icon={<GlobeIcon />} 
            isOpen={openPanel === "chapter"} 
            onToggle={() => togglePanel("chapter")}
          >
             <TextControls
                placeholder="e.g. Arc Nigeria"
                value={chapter} onChange={setChapter} maxLength={35}
                fontFamily={chapterFont} onFontChange={setChapterFont}
                fontSize={chapterSize} onSizeChange={setChapterSize}
                pan={chapterPan} onPanChange={setChapterPan}
             />
          </AccordionItem>

        </div>

        {/* Footer Reset */}
        <div className="flex justify-end pt-4">
          <button
            onClick={handleReset}
            className="px-5 py-2.5 rounded-xl text-sm font-medium text-red-500 hover:text-red-700 hover:bg-red-50 transition-colors"
          >
            Reset All Fields
          </button>
        </div>

      </div>
    </main>
  );
}

// ─── Sub-components ──────────────────────────────────────────────────────────

interface AccordionItemProps {
  title: string;
  icon: React.ReactNode;
  isOpen: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}

function AccordionItem({ title, icon, isOpen, onToggle, children }: AccordionItemProps) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden transition-all duration-200">
      <button 
        onClick={onToggle} 
        className={`w-full flex items-center justify-between p-5 bg-white hover:bg-gray-50 transition-colors ${isOpen ? 'border-b border-gray-100' : ''}`}
      >
        <div className="flex items-center gap-3">
           <span className="text-[#0b1130] p-2 bg-gray-100 rounded-lg">{icon}</span>
           <span className="text-sm font-semibold text-[#0b1130]">{title}</span>
        </div>
        <span className="text-gray-400">
           {isOpen ? <ChevronUpIcon /> : <ChevronDownIcon />}
        </span>
      </button>
      {isOpen && (
        <div className="p-5 bg-gray-50/50">
           {children}
        </div>
      )}
    </div>
  )
}

interface ImageControlsProps {
  accept: string;
  preview: string | null;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onClear: () => void;
  scale: number;
  onScaleChange: (v: number) => void;
  pan: { x: number; y: number };
  onPanChange: (v: { x: number; y: number }) => void;
}

function ImageControls({ accept, preview, onChange, onClear, scale, onScaleChange, pan, onPanChange }: ImageControlsProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  
  return (
    <div className="flex flex-col gap-5 max-w-xl">
      {!preview ? (
        <button
          onClick={() => inputRef.current?.click()}
          className="w-full h-32 border-2 border-dashed border-gray-300 rounded-xl flex flex-col items-center justify-center gap-2 hover:border-[#0b1130] hover:bg-gray-50 transition-colors cursor-pointer bg-white"
        >
          <span className="text-2xl">📎</span>
          <span className="text-xs text-gray-500 font-medium">Click to upload image</span>
        </button>
      ) : (
        <div className="flex flex-col gap-5">
          <div className="flex justify-between items-center bg-white p-3 rounded-xl border border-gray-200 shadow-sm">
             <span className="text-xs text-emerald-600 font-semibold px-2 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500"></span> Image Uploaded
             </span>
             <div className="flex gap-3">
               <button onClick={() => inputRef.current?.click()} className="text-xs font-semibold text-[#0b1130] bg-gray-100 px-3 py-1.5 rounded-md hover:bg-gray-200">Change</button>
               <button onClick={onClear} className="text-xs font-semibold text-red-600 bg-red-50 px-3 py-1.5 rounded-md hover:bg-red-100">Remove</button>
             </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 bg-white p-5 rounded-xl border border-gray-100">
            <div className="space-y-2">
              <label className="text-[10px] uppercase font-bold text-gray-500 tracking-wider">Zoom</label>
              <input type="range" min="0.5" max="3" step="0.05" value={scale} onChange={(e) => onScaleChange(parseFloat(e.target.value))} className="w-full accent-[#0b1130]" />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] uppercase font-bold text-gray-500 tracking-wider">Pan Horizontal</label>
              <input type="range" min="-600" max="600" step="10" value={pan.x} onChange={(e) => onPanChange({...pan, x: parseInt(e.target.value)})} className="w-full accent-[#0b1130]" />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] uppercase font-bold text-gray-500 tracking-wider">Pan Vertical</label>
              <input type="range" min="-600" max="600" step="10" value={pan.y} onChange={(e) => onPanChange({...pan, y: parseInt(e.target.value)})} className="w-full accent-[#0b1130]" />
            </div>
          </div>
        </div>
      )}
      <input ref={inputRef} type="file" accept={accept} onChange={onChange} className="hidden" />
    </div>
  )
}

interface TextControlsProps {
  placeholder: string;
  value: string;
  onChange: (v: string) => void;
  maxLength: number;
  fontFamily: string;
  onFontChange: (v: string) => void;
  fontSize: number;
  onSizeChange: (v: number) => void;
  pan: { x: number; y: number };
  onPanChange: (v: { x: number; y: number }) => void;
}

function TextControls({ placeholder, value, onChange, maxLength, fontFamily, onFontChange, fontSize, onSizeChange, pan, onPanChange }: TextControlsProps) {
  return (
    <div className="flex flex-col gap-5 max-w-xl">
      <div className="relative">
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          maxLength={maxLength}
          className="w-full border border-gray-300 rounded-xl px-4 py-3.5 text-sm font-medium text-[#0b1130] placeholder-gray-400 focus:outline-none focus:border-[#0b1130] focus:ring-1 focus:ring-[#0b1130] transition bg-white shadow-sm"
        />
        <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-semibold text-gray-400 bg-white pl-2">
          {value.length}/{maxLength}
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 bg-white p-5 rounded-xl border border-gray-100 shadow-sm">
         <div className="space-y-2">
             <label className="text-[10px] uppercase font-bold text-gray-500 tracking-wider block">Font Family</label>
             <select 
               value={fontFamily} 
               onChange={(e) => onFontChange(e.target.value)}
               className="w-full border border-gray-200 rounded-lg p-2.5 text-sm font-medium text-[#0b1130] focus:outline-none focus:border-[#0b1130] bg-gray-50 hover:bg-gray-100 cursor-pointer"
             >
               <option value="'Segoe UI', Arial, sans-serif">Segoe UI (Default)</option>
               <option value="Arial, sans-serif">Arial</option>
               <option value="'Times New Roman', Times, serif">Times New Roman</option>
               <option value="'Courier New', Courier, monospace">Courier New</option>
               <option value="'Georgia', serif">Georgia</option>
               <option value="'Trebuchet MS', sans-serif">Trebuchet MS</option>
               <option value="'Verdana', sans-serif">Verdana</option>
             </select>
         </div>
         <div className="space-y-2">
             <label className="text-[10px] uppercase font-bold text-gray-500 tracking-wider flex justify-between">
               <span>Font Size</span>
               <span className="text-[#0b1130]">{fontSize}px</span>
             </label>
             <input type="range" min="20" max="120" step="1" value={fontSize} onChange={(e) => onSizeChange(parseInt(e.target.value))} className="w-full accent-[#0b1130] mt-2" />
         </div>
         <div className="space-y-2">
             <label className="text-[10px] uppercase font-bold text-gray-500 tracking-wider">Pan Horizontal</label>
             <input type="range" min="-200" max="200" step="5" value={pan.x} onChange={(e) => onPanChange({...pan, x: parseInt(e.target.value)})} className="w-full accent-[#0b1130]" />
         </div>
         <div className="space-y-2">
             <label className="text-[10px] uppercase font-bold text-gray-500 tracking-wider">Pan Vertical</label>
             <input type="range" min="-100" max="100" step="5" value={pan.y} onChange={(e) => onPanChange({...pan, y: parseInt(e.target.value)})} className="w-full accent-[#0b1130]" />
         </div>
      </div>
    </div>
  )
}

// ─── Icons ───────────────────────────────────────────────────────────────────
function AvatarIcon() { return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/></svg>; }
function FlagIcon() { return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"/><line x1="4" y1="22" x2="4" y2="15"/></svg>; }
function PersonIcon() { return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>; }
function GlobeIcon() { return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>; }
function DownloadIcon() { return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>; }
function ChevronDownIcon() { return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="6 9 12 15 18 9"/></svg>; }
function ChevronUpIcon() { return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="18 15 12 9 6 15"/></svg>; }
