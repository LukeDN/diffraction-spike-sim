import { useRef, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { PRESETS, PRESET_ORDER } from '../lib/presets';
import { renderStar } from '../lib/starRenderer';
import type { MaskParams } from '../App';
import type { AnyShape, PresetId } from '../types/shapes';

function MiniCanvas({ render, size = 140 }: { render: (ctx: CanvasRenderingContext2D, w: number, h: number) => void; size?: number }) {
    const ref = useRef<HTMLCanvasElement>(null);
    useEffect(() => {
        const canvas = ref.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        render(ctx, size, size);
    }, [render, size]);
    return <canvas ref={ref} width={size} height={size} className="rounded" />;
}

export function GalleryPage() {
    const navigate = useNavigate();

    const presetEntries = useMemo(() => {
        return PRESET_ORDER.map(id => {
            const p = PRESETS[id];
            if (!p) return null;
            return { id, preset: p };
        }).filter(Boolean) as { id: PresetId; preset: typeof PRESETS[string] }[];
    }, []);

    const handleOpen = (id: PresetId) => {
        // Navigate to designer with preset ID in state
        navigate('/', { state: { presetId: id } });
    };

    return (
        <div className="p-8 max-w-6xl mx-auto">
            <h1 className="text-2xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>
                Mask Gallery
            </h1>
            <p className="text-sm mb-8" style={{ color: 'var(--text-secondary)' }}>
                Explore pre-built aperture mask designs and their resulting diffraction patterns. Click any card to open it in the designer.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {presetEntries.map(({ id, preset }) => (
                    <button
                        key={id}
                        onClick={() => handleOpen(id)}
                        className="rounded-xl p-4 text-left transition-all duration-200 group"
                        style={{
                            backgroundColor: 'var(--bg-card)',
                            border: '1px solid var(--border-subtle)',
                        }}
                        onMouseEnter={e => {
                            e.currentTarget.style.backgroundColor = 'var(--bg-card-hover)';
                            e.currentTarget.style.borderColor = 'var(--border-accent)';
                        }}
                        onMouseLeave={e => {
                            e.currentTarget.style.backgroundColor = 'var(--bg-card)';
                            e.currentTarget.style.borderColor = 'var(--border-subtle)';
                        }}
                    >
                        <div className="flex gap-3 mb-3">
                            {/* Mask thumbnail */}
                            <MiniCanvas
                                size={120}
                                render={(ctx, w, h) => {
                                    const params: MaskParams = {
                                        apertureDiameter: 400,
                                        obstruction: preset.obstruction,
                                        colorStyle: 'longitudinal',
                                    };
                                    // Draw mask outline
                                    ctx.fillStyle = '#050a14';
                                    ctx.fillRect(0, 0, w, h);
                                    const scale = w / 400;
                                    ctx.save();
                                    ctx.scale(scale, scale);
                                    // Aperture circle
                                    ctx.fillStyle = '#dce4f4';
                                    ctx.beginPath();
                                    ctx.arc(200, 200, params.apertureDiameter / 2, 0, Math.PI * 2);
                                    ctx.fill();
                                    // Draw shapes
                                    preset.shapes.forEach((s: AnyShape) => {
                                        if (s.type === 'rectangle') {
                                            ctx.save();
                                            ctx.translate(s.x, s.y);
                                            ctx.rotate((s.rotation * Math.PI) / 180);
                                            ctx.fillStyle = '#050a14';
                                            ctx.fillRect(-s.width / 2, -s.height / 2, s.width, s.height);
                                            ctx.restore();
                                        }
                                    });
                                    // Obstruction
                                    if (preset.obstruction.enabled) {
                                        ctx.fillStyle = '#050a14';
                                        ctx.beginPath();
                                        ctx.arc(200, 200, preset.obstruction.startRadius, 0, Math.PI * 2);
                                        ctx.fill();
                                    }
                                    ctx.restore();
                                }}
                            />

                            {/* Star thumbnail */}
                            <MiniCanvas
                                size={120}
                                render={(ctx, w, h) => {
                                    const params: MaskParams = {
                                        apertureDiameter: 400,
                                        obstruction: preset.obstruction,
                                        colorStyle: 'longitudinal',
                                    };
                                    const imgData = renderStar(w, h, params, preset.shapes);
                                    ctx.putImageData(imgData, 0, 0);
                                }}
                            />
                        </div>

                        <h3 className="text-sm font-semibold mb-0.5" style={{ color: 'var(--text-primary)' }}>
                            {preset.label}
                        </h3>
                        <p className="text-[11px]" style={{ color: 'var(--text-secondary)' }}>
                            {preset.description}
                        </p>
                        <span className="inline-block mt-2 text-[10px] font-medium px-2 py-0.5 rounded-full"
                            style={{ backgroundColor: 'var(--accent-dim)', color: 'var(--text-accent)', border: '1px solid var(--border-accent)' }}>
                            Open in Designer →
                        </span>
                    </button>
                ))}
            </div>
        </div>
    );
}
