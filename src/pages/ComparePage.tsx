import { useState, useRef, useEffect } from 'react';
import { renderStar } from '../lib/starRenderer';
import { renderFFTPSF } from '../lib/fftRenderer';
import type { MaskParams } from '../App';
import type { AnyShape, ObstructionConfig } from '../types/shapes';
import { PRESETS, PRESET_ORDER } from '../lib/presets';

const defaultObs: ObstructionConfig = {
    enabled: true, style: 'filled', ringCount: 1,
    startRadius: 50, ringSpacing: 20, ringThickness: 5,
};

function makeDefaultParams(): MaskParams {
    return { apertureDiameter: 400, obstruction: defaultObs, colorStyle: 'longitudinal' };
}

function CompareCanvas({ params, shapes }: { params: MaskParams; shapes: AnyShape[] }) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        const w = canvas.width, h = canvas.height;
        const mode = params.simulationMode || 'analytical';
        if (mode === 'fft') {
            const imgData = renderFFTPSF(w, h, params, shapes);
            ctx.putImageData(imgData, 0, 0);
        } else {
            const imgData = renderStar(w, h, params, shapes);
            ctx.putImageData(imgData, 0, 0);
        }
    }, [params, shapes]);
    return <canvas ref={canvasRef} width={400} height={400} className="w-full h-auto rounded-lg" />;
}

function PresetSelector({ value, onChange }: { value: string; onChange: (id: string) => void }) {
    return (
        <div className="flex flex-wrap gap-1.5">
            {PRESET_ORDER.map(id => {
                const p = PRESETS[id];
                if (!p) return null;
                return (
                    <button key={id} onClick={() => onChange(id)}
                        className="px-2 py-1 rounded-md text-[10px] font-medium transition-all"
                        style={{
                            backgroundColor: value === id ? 'var(--bg-segment-active)' : 'var(--bg-card)',
                            border: `1px solid ${value === id ? 'var(--border-accent)' : 'var(--border-subtle)'}`,
                            color: value === id ? 'var(--text-accent)' : 'var(--text-muted)',
                        }}>
                        {p.label}
                    </button>
                );
            })}
        </div>
    );
}

function ComparePanel({ label }: { label: string }) {
    const [presetId, setPresetId] = useState('newtonian');
    const preset = PRESETS[presetId];
    const params: MaskParams = preset
        ? { apertureDiameter: 400, obstruction: preset.obstruction, colorStyle: 'longitudinal' }
        : makeDefaultParams();
    const shapes: AnyShape[] = preset ? preset.shapes : [];

    return (
        <div className="flex-1 min-w-0">
            <h3 className="text-xs font-mono uppercase tracking-wider mb-3 px-1"
                style={{ color: 'var(--text-muted)' }}>{label}</h3>
            <div className="rounded-xl overflow-hidden mb-3" style={{ backgroundColor: '#000' }}>
                <CompareCanvas params={params} shapes={shapes} />
            </div>
            <PresetSelector value={presetId} onChange={setPresetId} />
            {preset && (
                <p className="text-[10px] mt-2 px-1" style={{ color: 'var(--text-secondary)' }}>
                    {preset.description}
                </p>
            )}
        </div>
    );
}

export function ComparePage() {
    return (
        <div className="p-8 max-w-5xl mx-auto">
            <h1 className="text-2xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>
                Compare Designs
            </h1>
            <p className="text-sm mb-8" style={{ color: 'var(--text-secondary)' }}>
                View two mask designs side-by-side to compare their diffraction patterns.
            </p>

            <div className="flex gap-6">
                <ComparePanel label="Design A" />
                <div className="w-px self-stretch" style={{ backgroundColor: 'var(--border-subtle)' }} />
                <ComparePanel label="Design B" />
            </div>
        </div>
    );
}
