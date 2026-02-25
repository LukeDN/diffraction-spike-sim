import React, { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import { Download, Sun, Moon, Image, FileText, Box, FileCode, Undo2, Redo2, Share2, Ruler, Rotate3d, Menu, Paintbrush, BookOpen } from 'lucide-react';
import { exportSVG, exportSTL, exportDXF, exportPNG, downloadFile } from './lib/exportUtils';
import { StarSimulator } from './components/StarSimulator';
import { ParametricMaskBuilder } from './components/ParametricMaskBuilder';
import type { AnyShape, ObstructionConfig } from './types/shapes';
import { PRESETS } from './lib/presets';
import { useHistory } from './lib/useHistory';
import { encodeDesign, decodeDesign } from './lib/serialization';
import { STLPreview } from './components/STLPreview';
import { LearnPage } from './pages/LearnPage';

export interface MaskParams {
  apertureDiameter: number;
  obstruction: ObstructionConfig;
  colorStyle?: 'angular' | 'longitudinal';
  simulationMode?: 'analytical' | 'fft';
}

const MIN_PANEL_WIDTH = 320;
const MAX_PANEL_WIDTH = 700;

function App() {
  const defaultPreset = PRESETS.newtonian;

  // Check URL hash for shared design
  const initialState = useMemo(() => {
    const hash = window.location.hash.slice(1);
    if (hash) {
      const decoded = decodeDesign(hash);
      if (decoded) return { params: decoded.params, shapes: decoded.shapes };
    }
    return {
      params: {
        apertureDiameter: defaultPreset.apertureDiameter,
        obstruction: { ...defaultPreset.obstruction },
        colorStyle: 'longitudinal' as const,
      },
      shapes: defaultPreset.shapes.map(s => ({ ...s, id: Date.now().toString() + s.id })),
    };
  }, []);

  // Undo/redo history wrapping combined state
  const {
    state: designState,
    setState: setDesignState,
    undo, redo, canUndo, canRedo,
  } = useHistory(initialState);

  const params = designState.params;
  const shapes = designState.shapes;

  const setParams = useCallback((p: MaskParams) => {
    setDesignState(prev => ({ ...prev, params: p }));
  }, [setDesignState]);

  const setShapes = useCallback((s: AnyShape[]) => {
    setDesignState(prev => ({ ...prev, shapes: s }));
  }, [setDesignState]);

  const [panelWidth, setPanelWidth] = useState(440);
  const [isDragging, setIsDragging] = useState(false);
  const [stlThickness, setStlThickness] = useState(2);
  const [exportDiameter, setExportDiameter] = useState(200);
  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    return (localStorage.getItem('dsm-theme') as 'dark' | 'light') || 'dark';
  });
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [shareToast, setShareToast] = useState(false);
  const [showAnnotations, setShowAnnotations] = useState(false);
  const [show3D, setShow3D] = useState(false);
  const [maskZoom, setMaskZoom] = useState(1);
  const [starZoom, setStarZoom] = useState(1);
  const [showNavMenu, setShowNavMenu] = useState(false);
  const navMenuRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const location = useLocation();
  const containerRef = useRef<HTMLDivElement>(null);
  const exportMenuRef = useRef<HTMLDivElement>(null);

  // Apply theme
  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    localStorage.setItem('dsm-theme', theme);
  }, [theme]);

  // Close export menu on outside click
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (exportMenuRef.current && !exportMenuRef.current.contains(e.target as Node)) {
        setShowExportMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  // Keyboard shortcuts for undo/redo
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'z') {
        e.preventDefault();
        if (e.shiftKey) redo();
        else undo();
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [undo, redo]);

  const handleShare = useCallback(() => {
    const encoded = encodeDesign(params, shapes);
    const url = `${window.location.origin}${window.location.pathname}#${encoded}`;
    navigator.clipboard.writeText(url).then(() => {
      setShareToast(true);
      setTimeout(() => setShareToast(false), 2000);
    });
  }, [params, shapes]);

  const handleZoom = useCallback((setter: React.Dispatch<React.SetStateAction<number>>) => {
    return (e: React.WheelEvent) => {
      e.preventDefault();
      setter(prev => {
        const delta = e.deltaY > 0 ? 0.9 : 1.1;
        return Math.min(8, Math.max(0.5, prev * delta));
      });
    };
  }, []);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);

    const handleMouseMove = (e: MouseEvent) => {
      if (!containerRef.current) return;
      const containerRect = containerRef.current.getBoundingClientRect();
      const newWidth = e.clientX - containerRect.left;
      setPanelWidth(Math.max(MIN_PANEL_WIDTH, Math.min(MAX_PANEL_WIDTH, newWidth)));
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };

    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  }, []);

  const handleExportSVG = () => {
    const exportParams = { ...params, apertureDiameter: exportDiameter };
    const svg = exportSVG(exportParams, shapes);
    downloadFile(svg, 'aperture-mask.svg', 'image/svg+xml');
    setShowExportMenu(false);
  };

  const handleExportSTL = () => {
    const exportParams = { ...params, apertureDiameter: exportDiameter };
    const stl = exportSTL(exportParams, shapes, stlThickness);
    downloadFile(stl, 'aperture-mask.stl', 'application/sla');
    setShowExportMenu(false);
  };

  const handleExportDXF = () => {
    const exportParams = { ...params, apertureDiameter: exportDiameter };
    const dxf = exportDXF(exportParams, shapes);
    downloadFile(dxf, 'aperture-mask.dxf', 'application/dxf');
    setShowExportMenu(false);
  };

  const handleExportPNG = async () => {
    const blob = await exportPNG(params, shapes, 2048);
    downloadFile(blob, 'diffraction-star.png');
    setShowExportMenu(false);
  };

  return (
    <div className="flex flex-col h-screen w-full overflow-hidden font-sans"
      style={{ backgroundColor: 'var(--bg-app)', color: 'var(--text-primary)' }}>

      {/* ── Header ── */}
      <header className="h-11 flex items-center justify-between px-5 shrink-0"
        style={{ borderBottom: '1px solid var(--border-subtle)', backgroundColor: 'var(--bg-panel)' }}>
        <div className="flex items-center gap-3">
          {/* Nav menu */}
          <div className="relative" ref={navMenuRef}>
            <button
              onClick={() => setShowNavMenu(v => !v)}
              className="p-1.5 rounded-md transition-all duration-150"
              style={{ backgroundColor: showNavMenu ? 'var(--accent-dim)' : 'transparent', color: 'var(--text-secondary)', border: '1px solid transparent' }}
            >
              <Menu size={14} />
            </button>
            {showNavMenu && (
              <div className="absolute left-0 top-full mt-1 w-48 rounded-lg overflow-hidden shadow-xl z-50 animate-in"
                style={{ backgroundColor: 'var(--bg-panel)', border: '1px solid var(--border-default)' }}>
                {[
                  { path: '/', icon: <Paintbrush size={13} />, label: 'Designer', desc: 'Build masks' },
                  { path: '/learn', icon: <BookOpen size={13} />, label: 'Learn', desc: 'Diffraction physics' },
                ].map(item => (
                  <button key={item.path}
                    onClick={() => { navigate(item.path); setShowNavMenu(false); }}
                    className="w-full flex items-center gap-2.5 px-3 py-2.5 text-left transition-colors duration-100"
                    style={{
                      backgroundColor: location.pathname === item.path ? 'var(--accent-dim)' : 'transparent',
                      color: location.pathname === item.path ? 'var(--text-accent)' : 'var(--text-secondary)',
                    }}
                    onMouseEnter={e => { if (location.pathname !== item.path) e.currentTarget.style.backgroundColor = 'var(--bg-card)'; }}
                    onMouseLeave={e => { if (location.pathname !== item.path) e.currentTarget.style.backgroundColor = 'transparent'; }}
                  >
                    <span style={{ opacity: 0.8 }}>{item.icon}</span>
                    <div className="flex-1">
                      <div className="text-[11px] font-medium">{item.label}</div>
                      <div className="text-[9px]" style={{ color: 'var(--text-muted)' }}>{item.desc}</div>
                    </div>
                    {location.pathname === item.path && (
                      <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: 'var(--accent)' }} />
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>
          <h1 className="text-sm font-bold tracking-tight cursor-pointer"
            style={{ color: 'var(--text-accent)' }}
            onClick={() => navigate('/')}>
            Diffraction Spike Modeler
          </h1>
        </div>
        <div className="flex items-center gap-2">
          {/* Undo/Redo */}
          <div className="flex items-center gap-0.5">
            <button
              onClick={undo}
              disabled={!canUndo}
              className="p-1.5 rounded-md transition-all duration-150"
              style={{
                backgroundColor: 'var(--bg-card)',
                border: '1px solid var(--border-subtle)',
                color: canUndo ? 'var(--text-secondary)' : 'var(--text-muted)',
                opacity: canUndo ? 1 : 0.4,
              }}
              title="Undo (Ctrl+Z)"
            >
              <Undo2 size={13} />
            </button>
            <button
              onClick={redo}
              disabled={!canRedo}
              className="p-1.5 rounded-md transition-all duration-150"
              style={{
                backgroundColor: 'var(--bg-card)',
                border: '1px solid var(--border-subtle)',
                color: canRedo ? 'var(--text-secondary)' : 'var(--text-muted)',
                opacity: canRedo ? 1 : 0.4,
              }}
              title="Redo (Ctrl+Shift+Z)"
            >
              <Redo2 size={13} />
            </button>
          </div>

          {/* Share */}
          <div className="relative">
            <button
              onClick={handleShare}
              className="p-1.5 rounded-md transition-all duration-150"
              style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-subtle)', color: 'var(--text-secondary)' }}
              title="Copy share link"
            >
              <Share2 size={13} />
            </button>
            {shareToast && (
              <div className="absolute right-0 top-full mt-1 px-2.5 py-1 rounded-md text-[10px] font-medium whitespace-nowrap animate-in z-50"
                style={{ backgroundColor: 'var(--success-dim)', border: '1px solid var(--success-border)', color: 'var(--success)' }}>
                Link copied!
              </div>
            )}
          </div>

          {/* Theme toggle */}
          <button
            onClick={() => setTheme(t => t === 'dark' ? 'light' : 'dark')}
            className="p-1.5 rounded-md transition-all duration-150"
            style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-subtle)', color: 'var(--text-secondary)' }}
            title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
          >
            {theme === 'dark' ? <Sun size={13} /> : <Moon size={13} />}
          </button>

          {/* Export dropdown */}
          <div className="relative" ref={exportMenuRef}>
            <button
              onClick={() => setShowExportMenu(v => !v)}
              className="flex items-center gap-1.5 px-3 py-1 rounded-md transition-all duration-150 text-[11px] font-medium"
              style={{ backgroundColor: 'var(--accent-dim)', color: 'var(--text-accent)', border: '1px solid var(--border-accent)' }}
            >
              <Download size={11} /> Export
            </button>

            {showExportMenu && (
              <div
                className="absolute right-0 top-full mt-1 w-56 rounded-lg overflow-hidden shadow-xl z-50 animate-in"
                style={{ backgroundColor: 'var(--bg-panel)', border: '1px solid var(--border-default)' }}
              >
                {/* Export dimensions */}
                <div className="px-3 py-2" style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-[10px]" style={{ color: 'var(--text-muted)' }}>Aperture Diameter</span>
                    <span className="text-[10px] font-mono" style={{ color: 'var(--text-secondary)' }}>{exportDiameter}mm</span>
                  </div>
                  <input type="range" min={50} max={500} step={5} value={exportDiameter}
                    onChange={e => setExportDiameter(Number(e.target.value))}
                    className="slider-track w-full" />
                </div>

                {/* Thickness control */}
                <div className="px-3 py-2" style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-[10px]" style={{ color: 'var(--text-muted)' }}>STL Thickness</span>
                    <span className="text-[10px] font-mono" style={{ color: 'var(--text-secondary)' }}>{stlThickness}mm</span>
                  </div>
                  <input type="range" min={0.5} max={10} step={0.5} value={stlThickness}
                    onChange={e => setStlThickness(Number(e.target.value))}
                    className="slider-track w-full" />
                </div>

                {/* Export options */}
                <div className="py-1">
                  <ExportMenuItem icon={<Image size={12} />} label="Star PNG" sub="2048×2048" onClick={handleExportPNG} />
                  <ExportMenuItem icon={<FileText size={12} />} label="Mask SVG" sub={`${exportDiameter}mm`} onClick={handleExportSVG} />
                  <ExportMenuItem icon={<Box size={12} />} label="Mask STL" sub={`${exportDiameter}mm · ${stlThickness}mm`} onClick={handleExportSTL} />
                  <ExportMenuItem icon={<FileCode size={12} />} label="Mask DXF" sub={`${exportDiameter}mm`} onClick={handleExportDXF} />
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* ── Page Content ── */}
      <Routes>
        <Route path="/" element={
          /* ── Designer Layout ── */
          <div className="flex-1 flex min-h-0" ref={containerRef}>

            {/* LEFT: Configuration Panel */}
            <aside
              className="shrink-0 flex flex-col min-h-0"
              style={{
                width: `${panelWidth}px`,
                borderRight: '1px solid var(--border-subtle)',
                backgroundColor: 'var(--bg-panel)',
              }}
            >
              <div className="flex-1 overflow-y-auto p-4 scrollbar-thin">
                <ParametricMaskBuilder
                  params={params}
                  onChange={setParams}
                  shapes={shapes}
                  onShapesChange={setShapes}
                />
              </div>
            </aside>

            {/* DIVIDER */}
            <div
              className="divider-handle"
              onMouseDown={handleMouseDown}
              style={{ opacity: isDragging ? 1 : undefined }}
            >
              <div className="divider-grip" />
            </div>

            {/* RIGHT: Previews */}
            <div className="flex-1 flex flex-col min-h-0 min-w-0">

              {/* Top: Mask Preview */}
              <div className="h-1/2 flex items-center justify-center p-5 relative overflow-hidden"
                style={{ borderBottom: '1px solid var(--border-subtle)', backgroundColor: 'var(--bg-canvas)' }}
                onWheel={handleZoom(setMaskZoom)}
                onDoubleClick={() => setMaskZoom(1)}
              >
                <div className="absolute top-3 left-4 z-10 flex items-center gap-2">
                  <span className="text-[9px] font-mono uppercase tracking-[0.15em]"
                    style={{ color: 'var(--text-muted)' }}>{show3D ? '3D Preview' : 'Aperture Mask'}</span>
                  {!show3D && (
                    <button
                      onClick={() => setShowAnnotations(v => !v)}
                      className="p-1 rounded transition-all duration-150"
                      style={{
                        backgroundColor: showAnnotations ? 'var(--accent-dim)' : 'transparent',
                        border: `1px solid ${showAnnotations ? 'var(--border-accent)' : 'var(--border-subtle)'}`,
                        color: showAnnotations ? 'var(--text-accent)' : 'var(--text-muted)',
                      }}
                      title="Toggle dimension annotations"
                    >
                      <Ruler size={10} />
                    </button>
                  )}
                  <button
                    onClick={() => setShow3D(v => !v)}
                    className="p-1 rounded transition-all duration-150"
                    style={{
                      backgroundColor: show3D ? 'var(--accent-dim)' : 'transparent',
                      border: `1px solid ${show3D ? 'var(--border-accent)' : 'var(--border-subtle)'}`,
                      color: show3D ? 'var(--text-accent)' : 'var(--text-muted)',
                    }}
                    title="Toggle 3D preview"
                  >
                    <Rotate3d size={10} />
                  </button>
                  {maskZoom !== 1 && (
                    <span className="text-[9px] font-mono px-1.5 py-0.5 rounded"
                      style={{ backgroundColor: 'var(--accent-dim)', color: 'var(--text-accent)', border: '1px solid var(--border-accent)' }}>
                      {maskZoom.toFixed(1)}×
                    </span>
                  )}
                </div>
                <div style={{ transform: `scale(${maskZoom})`, transition: 'transform 0.1s ease-out' }}>
                  {show3D ? (
                    <STLPreview params={params} shapes={shapes} thickness={stlThickness} />
                  ) : (
                    <MaskPreviewCanvas params={params} shapes={shapes} showAnnotations={showAnnotations} />
                  )}
                </div>
              </div>

              {/* Bottom: Star Simulation */}
              <div className="h-1/2 flex items-center justify-center relative overflow-hidden"
                style={{ backgroundColor: 'var(--bg-star)' }}
                onWheel={handleZoom(setStarZoom)}
                onDoubleClick={() => setStarZoom(1)}
              >
                <div className="absolute top-3 left-4 z-10 flex items-center gap-2">
                  <span className="text-[9px] font-mono uppercase tracking-[0.15em]"
                    style={{ color: 'var(--text-muted)' }}>Star Simulation</span>
                  {starZoom !== 1 && (
                    <span className="text-[9px] font-mono px-1.5 py-0.5 rounded"
                      style={{ backgroundColor: 'var(--accent-dim)', color: 'var(--text-accent)', border: '1px solid var(--border-accent)' }}>
                      {starZoom.toFixed(1)}×
                    </span>
                  )}
                </div>
                <div style={{ transform: `scale(${starZoom})`, transition: 'transform 0.1s ease-out' }}>
                  <StarSimulator params={params} shapes={shapes} />
                </div>
              </div>

            </div>
          </div>
        } />
        <Route path="/learn" element={
          <div className="flex-1 overflow-y-auto" style={{ backgroundColor: 'var(--bg-app)' }}><LearnPage /></div>
        } />
      </Routes>
    </div>
  );
}

/** Mask preview canvas */
function MaskPreviewCanvas({ params, shapes, showAnnotations }: { params: MaskParams; shapes: AnyShape[]; showAnnotations: boolean }) {
  const canvasRef = React.useRef<HTMLCanvasElement>(null);

  React.useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const style = getComputedStyle(document.documentElement);
    const bgColor = style.getPropertyValue('--bg-canvas').trim() || '#060c18';
    const fillColor = style.getPropertyValue('--mask-fill').trim() || '#d8e0f0';
    const obsColor = style.getPropertyValue('--mask-obstruction').trim() || '#0a1025';
    const borderColor = style.getPropertyValue('--mask-border').trim() || '#607098';

    ctx.fillStyle = bgColor;
    ctx.fillRect(0, 0, 400, 400);

    ctx.fillStyle = fillColor;
    ctx.beginPath();
    ctx.arc(200, 200, params.apertureDiameter / 2, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = borderColor;
    ctx.lineWidth = 0.5;
    ctx.stroke();

    ctx.fillStyle = obsColor;
    shapes.forEach(shape => {
      ctx.save();
      ctx.translate(shape.x, shape.y);
      ctx.rotate(shape.rotation * Math.PI / 180);

      if (shape.type === 'rectangle') {
        ctx.fillRect(-shape.width / 2, -shape.height / 2, shape.width, shape.height);
      } else if (shape.type === 'wavy') {
        ctx.beginPath();
        const W = shape.length;
        const A = shape.amplitude;
        const F = shape.frequency;
        const T = shape.thickness;
        for (let i = 0; i <= W; i++) {
          const yOffset = Math.sin((i / W) * Math.PI * 2 * F) * A;
          if (i === 0) ctx.moveTo(-W / 2 + i, yOffset - T / 2);
          else ctx.lineTo(-W / 2 + i, yOffset - T / 2);
        }
        for (let i = W; i >= 0; i--) {
          const yOffset = Math.sin((i / W) * Math.PI * 2 * F) * A;
          ctx.lineTo(-W / 2 + i, yOffset + T / 2);
        }
        ctx.closePath();
        ctx.fill();
      } else if (shape.type === 'gratingSector') {
        // Render grating sector: clip to sector arc, draw parallel bars
        ctx.restore(); // undo the translate/rotate from generic handler
        ctx.save();

        const cx = 200, cy = 200;
        const outerR = params.apertureDiameter / 2;
        const innerR = shape.innerRadius;
        const startRad = (shape.sectorStartAngle * Math.PI) / 180;
        const endRad = (shape.sectorEndAngle * Math.PI) / 180;

        // Create sector clipping path (pie wedge with optional inner hole)
        ctx.beginPath();
        if (innerR > 0) {
          ctx.arc(cx, cy, outerR, startRad, endRad, false);
          ctx.arc(cx, cy, innerR, endRad, startRad, true);
          ctx.closePath();
        } else {
          ctx.moveTo(cx, cy);
          ctx.arc(cx, cy, outerR, startRad, endRad, false);
          ctx.closePath();
        }
        ctx.clip();

        // Draw parallel bars at gratingAngle
        const gAngleRad = (shape.gratingAngle * Math.PI) / 180;
        const pitch = shape.slitWidth + shape.barWidth;
        const span = params.apertureDiameter + 20; // generous overshoot
        const numBars = Math.ceil(span / pitch) + 1;

        ctx.fillStyle = obsColor;
        for (let i = -numBars; i <= numBars; i++) {
          const offset = i * pitch;
          ctx.save();
          ctx.translate(cx, cy);
          ctx.rotate(gAngleRad);
          ctx.fillRect(offset - shape.barWidth / 2, -span / 2, shape.barWidth, span);
          ctx.restore();
        }
      }
      ctx.restore();
    });

    const obs = params.obstruction;
    if (obs.enabled) {
      ctx.fillStyle = obsColor;
      ctx.strokeStyle = obsColor;

      for (let ring = 0; ring < obs.ringCount; ring++) {
        const r = obs.startRadius + ring * obs.ringSpacing;
        if (obs.style === 'filled' && ring === 0) {
          ctx.beginPath();
          ctx.arc(200, 200, r, 0, Math.PI * 2);
          ctx.fill();
        } else {
          ctx.lineWidth = obs.ringThickness;
          ctx.beginPath();
          ctx.arc(200, 200, r, 0, Math.PI * 2);
          ctx.stroke();
        }
      }
    }

    // Dimension annotations
    if (showAnnotations) {
      const accentColor = getComputedStyle(document.documentElement).getPropertyValue('--text-accent').trim() || '#7b93e8';
      const dimColor = 'rgba(255,255,255,0.7)';
      ctx.font = '9px monospace';

      // Helper: draw dimension line with label
      const drawDim = (x1: number, y1: number, x2: number, y2: number, label: string, offset = 0) => {
        const mx = (x1 + x2) / 2;
        const my = (y1 + y2) / 2;
        ctx.strokeStyle = accentColor;
        ctx.lineWidth = 0.8;
        ctx.setLineDash([3, 2]);
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.stroke();
        ctx.setLineDash([]);

        // Label background pill
        const tw = ctx.measureText(label).width + 6;
        ctx.fillStyle = 'rgba(0,0,0,0.65)';
        ctx.beginPath();
        ctx.roundRect(mx - tw / 2, my - 6 + offset, tw, 12, 3);
        ctx.fill();
        ctx.fillStyle = dimColor;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(label, mx, my + offset);
      };

      // Aperture diameter
      const r = params.apertureDiameter / 2;
      drawDim(200 - r, 200, 200 + r, 200, `⌀${params.apertureDiameter}mm`, -r - 12);

      // Vane lengths
      shapes.forEach(s => {
        if (s.type === 'rectangle' || s.type === 'wavy') {
          const len = s.type === 'rectangle' ? s.width : s.length;
          const angleRad = s.rotation * Math.PI / 180;
          const halfLen = len / 2;
          const x1 = s.x - halfLen * Math.cos(angleRad);
          const y1 = s.y - halfLen * Math.sin(angleRad);
          const x2 = s.x + halfLen * Math.cos(angleRad);
          const y2 = s.y + halfLen * Math.sin(angleRad);
          drawDim(x1, y1, x2, y2, `${len}mm`, 12);
        }
      });

      // Obstruction radius
      if (params.obstruction.enabled) {
        drawDim(200, 200, 200 + params.obstruction.startRadius, 200, `r${params.obstruction.startRadius}mm`, 10);
      }
    }
  }, [params, shapes, showAnnotations]);

  return (
    <canvas
      ref={canvasRef}
      width={400}
      height={400}
      className="max-h-full max-w-full object-contain rounded-lg"
      style={{ border: '1px solid var(--border-subtle)', boxShadow: '0 10px 25px rgba(0,0,0,0.3)' }}
    />
  );
}

/** Export menu item */
function ExportMenuItem({ icon, label, sub, onClick }: {
  icon: React.ReactNode; label: string; sub: string; onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="w-full flex items-center gap-2.5 px-3 py-2 text-left transition-colors duration-100"
      style={{ color: 'var(--text-secondary)' }}
      onMouseEnter={e => { e.currentTarget.style.backgroundColor = 'var(--bg-card)'; }}
      onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'transparent'; }}
    >
      <span style={{ color: 'var(--text-accent)', opacity: 0.7 }}>{icon}</span>
      <span className="text-[11px] font-medium flex-1">{label}</span>
      <span className="text-[9px] font-mono" style={{ color: 'var(--text-muted)' }}>{sub}</span>
    </button>
  );
}

export default App;
