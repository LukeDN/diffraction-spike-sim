import React, { useState, useRef, useCallback } from 'react';
import { Download } from 'lucide-react';
import { exportSVG, exportSTL, downloadFile } from './lib/exportUtils';
import { StarSimulator } from './components/StarSimulator';
import { ParametricMaskBuilder } from './components/ParametricMaskBuilder';
import type { AnyShape, ObstructionConfig } from './types/shapes';
import { PRESETS } from './lib/presets';

export interface MaskParams {
  apertureDiameter: number;
  obstruction: ObstructionConfig;
  colorStyle?: 'angular' | 'longitudinal';
}

const MIN_PANEL_WIDTH = 320;
const MAX_PANEL_WIDTH = 700;

function App() {
  const defaultPreset = PRESETS.newtonian;

  const [params, setParams] = useState<MaskParams>({
    apertureDiameter: defaultPreset.apertureDiameter,
    obstruction: { ...defaultPreset.obstruction },
    colorStyle: 'longitudinal',
  });

  const [shapes, setShapes] = useState<AnyShape[]>(
    defaultPreset.shapes.map(s => ({ ...s, id: Date.now().toString() + s.id }))
  );

  const [panelWidth, setPanelWidth] = useState(440);
  const [isDragging, setIsDragging] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

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
    const svg = exportSVG(params, shapes);
    downloadFile(svg, 'aperture-mask.svg', 'image/svg+xml');
  };

  const handleExportSTL = () => {
    const stl = exportSTL(params, shapes);
    downloadFile(stl, 'aperture-mask.stl', 'application/sla');
  };

  return (
    <div className="flex flex-col h-screen w-full overflow-hidden font-sans"
      style={{ backgroundColor: 'var(--bg-app)', color: 'var(--text-primary)' }}>

      {/* ── Header ── */}
      <header className="h-11 flex items-center justify-between px-5 shrink-0"
        style={{ borderBottom: '1px solid var(--border-subtle)', backgroundColor: 'var(--bg-panel)' }}>
        <h1 className="text-sm font-bold tracking-tight"
          style={{ color: 'var(--text-accent)' }}>
          Diffraction Mask Simulator
        </h1>
        <div className="flex items-center gap-2">
          <button onClick={handleExportSVG}
            className="flex items-center gap-1.5 px-3 py-1 rounded-md transition-all duration-150 text-[11px] font-medium"
            style={{ backgroundColor: 'var(--accent-dim)', color: 'var(--text-accent)', border: '1px solid var(--border-accent)' }}>
            <Download size={11} /> SVG
          </button>
          <button onClick={handleExportSTL}
            className="flex items-center gap-1.5 px-3 py-1 rounded-md transition-all duration-150 text-[11px] font-medium"
            style={{ backgroundColor: 'var(--bg-card)', color: 'var(--text-secondary)', border: '1px solid var(--border-subtle)' }}>
            <Download size={11} /> STL
          </button>
        </div>
      </header>

      {/* ── Main Layout ── */}
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
          <div className="h-1/2 flex items-center justify-center p-5 relative"
            style={{ borderBottom: '1px solid var(--border-subtle)', backgroundColor: 'var(--bg-canvas)' }}>
            <div className="absolute top-3 left-4 z-10">
              <span className="text-[9px] font-mono uppercase tracking-[0.15em]"
                style={{ color: 'var(--text-muted)' }}>Aperture Mask</span>
            </div>
            <MaskPreviewCanvas params={params} shapes={shapes} />
          </div>

          {/* Bottom: Star Simulation */}
          <div className="h-1/2 flex items-center justify-center relative"
            style={{ backgroundColor: 'var(--bg-star)' }}>
            <div className="absolute top-3 left-4 z-10">
              <span className="text-[9px] font-mono uppercase tracking-[0.15em]"
                style={{ color: 'var(--text-muted)' }}>Star Simulation</span>
            </div>
            <StarSimulator params={params} shapes={shapes} />
          </div>

        </div>
      </div>
    </div>
  );
}

/** Mask preview canvas */
function MaskPreviewCanvas({ params, shapes }: { params: MaskParams; shapes: AnyShape[] }) {
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
  }, [params, shapes]);

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

export default App;
