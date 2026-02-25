import { useState, useRef, useEffect } from 'react';
import type { AnyShape, ShapeType, PresetId } from '../types/shapes';
import type { MaskParams } from '../App';
import { Trash2, Plus, ChevronRight, Sparkles, Circle, Target, Waves, Grid3x3, Copy } from 'lucide-react';
import { PRESETS, PRESET_ORDER } from '../lib/presets';

interface Props {
    params: MaskParams;
    onChange: (params: MaskParams) => void;
    shapes: AnyShape[];
    onShapesChange: (shapes: AnyShape[]) => void;
}

export function ParametricMaskBuilder({ params, onChange, shapes, onShapesChange }: Props) {
    const [activePreset, setActivePreset] = useState<PresetId | null>('newtonian');
    const [collapsedVanes, setCollapsedVanes] = useState<Set<string>>(new Set());

    const loadPreset = (id: PresetId) => {
        const preset = PRESETS[id];
        setActivePreset(id);
        onChange({
            apertureDiameter: preset.apertureDiameter,
            obstruction: { ...preset.obstruction },
            colorStyle: params.colorStyle,
        });
        onShapesChange(preset.shapes.map(s => ({
            ...s,
            id: Date.now().toString() + Math.random().toString(36).slice(2, 6),
        })));
        setCollapsedVanes(new Set());
    };

    const addShape = (type: ShapeType) => {
        setActivePreset(null);
        const newShape: AnyShape = {
            id: Date.now().toString() + Math.random().toString(36).slice(2, 6),
            type,
            x: 200, y: 200,
            rotation: shapes.length * 45,
            scaleX: 1, scaleY: 1,
            fill: 'black',
            ...(type === 'rectangle' ? { width: 400, height: 5 } : {}),
            ...(type === 'wavy' ? { length: 400, amplitude: 10, frequency: 4, thickness: 5 } : {}),
            ...(type === 'gratingSector' ? {
                sectorStartAngle: shapes.length * 120,
                sectorEndAngle: shapes.length * 120 + 120,
                gratingAngle: 0,
                slitWidth: 8,
                barWidth: 5,
                innerRadius: 0,
            } : {}),
        } as AnyShape;
        onShapesChange([...shapes, newShape]);
    };

    const updateShape = (id: string, updates: Partial<AnyShape>) => {
        setActivePreset(null);
        onShapesChange(shapes.map(s => s.id === id ? { ...s, ...updates } as AnyShape : s));
    };

    const removeShape = (id: string) => {
        setActivePreset(null);
        onShapesChange(shapes.filter(s => s.id !== id));
    };

    const duplicateShape = (id: string) => {
        setActivePreset(null);
        const source = shapes.find(s => s.id === id);
        if (!source) return;
        const clone = {
            ...source,
            id: Date.now().toString() + Math.random().toString(36).slice(2, 6),
            rotation: (source.rotation + 15) % 360,
        } as AnyShape;
        onShapesChange([...shapes, clone]);
    };

    const toggleCollapse = (id: string) => {
        setCollapsedVanes(prev => {
            const next = new Set(prev);
            next.has(id) ? next.delete(id) : next.add(id);
            return next;
        });
    };

    const obs = params.obstruction;
    const setObs = (updates: Partial<typeof obs>) => {
        setActivePreset(null);
        onChange({ ...params, obstruction: { ...obs, ...updates } });
    };

    return (
        <div className="flex flex-col gap-4">

            {/* ── Presets ── */}
            <Section icon={<Sparkles size={12} />} title="Design Preset">
                <div className="grid grid-cols-3 gap-1.5">
                    {PRESET_ORDER.map(id => (
                        <button
                            key={id}
                            onClick={() => loadPreset(id)}
                            title={PRESETS[id].description}
                            className="px-2 py-1.5 rounded-md text-[11px] font-medium transition-all duration-150"
                            style={{
                                backgroundColor: activePreset === id ? 'var(--bg-segment-active)' : 'var(--bg-card)',
                                border: `1px solid ${activePreset === id ? 'var(--border-accent)' : 'var(--border-subtle)'}`,
                                color: activePreset === id ? 'var(--text-accent)' : 'var(--text-muted)',
                            }}
                        >
                            {PRESETS[id].label}
                        </button>
                    ))}
                </div>
            </Section>

            {/* ── Simulation Settings ── */}
            <Section icon={<Circle size={12} />} title="Simulation">
                <div>
                    <div className="text-[10px] mb-1.5" style={{ color: 'var(--text-muted)' }}>Simulation Mode</div>
                    <SegmentedControl
                        options={[
                            { value: 'analytical', label: 'Analytical' },
                            { value: 'fft', label: 'FFT (Physical)' },
                        ]}
                        value={params.simulationMode || 'analytical'}
                        onChange={v => onChange({ ...params, simulationMode: v as 'analytical' | 'fft' })}
                    />
                </div>
                {(params.simulationMode || 'analytical') === 'analytical' && (
                    <div className="mt-3 animate-in">
                        <div className="text-[10px] mb-1.5" style={{ color: 'var(--text-muted)' }}>Color Style</div>
                        <SegmentedControl
                            options={[
                                { value: 'angular', label: 'Angular (Classic)' },
                                { value: 'longitudinal', label: 'Longitudinal (Webb)' },
                            ]}
                            value={params.colorStyle || 'longitudinal'}
                            onChange={v => onChange({ ...params, colorStyle: v as 'angular' | 'longitudinal' })}
                        />
                    </div>
                )}
            </Section>

            {/* ── Center Obstruction ── */}
            <Section
                icon={<Target size={12} />}
                title="Center Obstruction"
                trailing={
                    <TogglePill
                        active={obs.enabled}
                        onLabel="On"
                        offLabel="Off"
                        onToggle={() => setObs({ enabled: !obs.enabled })}
                    />
                }
            >
                {obs.enabled && (
                    <div className="space-y-3 animate-in">
                        <SegmentedControl
                            options={[
                                { value: 'filled', label: 'Filled' },
                                { value: 'hollow', label: 'Hollow' },
                            ]}
                            value={obs.style}
                            onChange={v => setObs({ style: v as 'filled' | 'hollow' })}
                        />

                        <SliderRow label="Start Radius" value={obs.startRadius} min={5} max={180} step={0.5} unit="mm"
                            ticks={[10, 25, 50, 75, 100, 150]}
                            onChange={v => setObs({ startRadius: v })} />

                        <SliderRow label="Ring Count" value={obs.ringCount} min={1} max={10} step={1}
                            ticks={[1, 2, 3, 4, 5, 6, 8, 10]}
                            onChange={v => setObs({ ringCount: v })} />

                        {obs.ringCount > 1 && (
                            <SliderRow label="Ring Spacing" value={obs.ringSpacing} min={2} max={60} step={0.5} unit="mm"
                                ticks={[5, 10, 15, 20, 30, 40, 60]}
                                onChange={v => setObs({ ringSpacing: v })} />
                        )}

                        {(obs.style === 'hollow' || obs.ringCount > 1) && (
                            <SliderRow label="Ring Thickness" value={obs.ringThickness} min={0.5} max={20} step={0.1} unit="mm"
                                ticks={[1, 3, 5, 10, 15, 20]}
                                onChange={v => setObs({ ringThickness: v })} />
                        )}
                    </div>
                )}
            </Section>

            {/* ── Shape Elements ── */}
            <div>
                <Section
                    icon={<Waves size={12} />}
                    title={`Elements (${shapes.length})`}
                    trailing={
                        <div className="flex gap-1">
                            <IconButton icon={<Plus size={11} />} label="Vane" onClick={() => addShape('rectangle')} />
                            <IconButton icon={<Plus size={11} />} label="Wavy" onClick={() => addShape('wavy')} />
                            <IconButton icon={<Grid3x3 size={11} />} label="Grating" onClick={() => addShape('gratingSector')} />
                        </div>
                    }
                    noPadding
                >
                    <div className="space-y-2 px-3 pb-3">
                        {shapes.map((shape, index) => {
                            const isCollapsed = collapsedVanes.has(shape.id);
                            return (
                                <div key={shape.id}
                                    className="rounded-lg overflow-hidden transition-colors"
                                    style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-subtle)' }}
                                >
                                    {/* Card Header */}
                                    <div
                                        className="flex items-center gap-2 px-3 py-2 cursor-pointer select-none"
                                        onClick={() => toggleCollapse(shape.id)}
                                    >
                                        <span className="transition-transform duration-150"
                                            style={{ color: 'var(--text-muted)', transform: isCollapsed ? 'rotate(0deg)' : 'rotate(90deg)' }}>
                                            <ChevronRight size={12} />
                                        </span>
                                        <span className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider flex-1"
                                            style={{ color: 'var(--text-secondary)' }}>
                                            <span className="inline-flex items-center justify-center w-4 h-4 rounded text-[9px] font-mono"
                                                style={{ backgroundColor: 'var(--bg-segment)', color: 'var(--text-muted)' }}>
                                                {index + 1}
                                            </span>
                                            {shape.type === 'rectangle' ? 'Straight Vane' : shape.type === 'wavy' ? 'Wavy Vane' : 'Grating Sector'}
                                        </span>
                                        <span className="text-[9px] font-mono" style={{ color: 'var(--text-muted)' }}>
                                            {shape.type === 'gratingSector'
                                                ? `${(shape as any).sectorStartAngle}°–${(shape as any).sectorEndAngle}°`
                                                : `${shape.rotation}°`}
                                        </span>
                                        <button
                                            onClick={(e) => { e.stopPropagation(); duplicateShape(shape.id); }}
                                            className="p-0.5 rounded transition-colors"
                                            style={{ color: 'var(--text-muted)' }}
                                            onMouseEnter={e => { e.currentTarget.style.color = 'var(--text-accent)'; }}
                                            onMouseLeave={e => { e.currentTarget.style.color = 'var(--text-muted)'; }}
                                            title="Duplicate"
                                        >
                                            <Copy size={11} />
                                        </button>
                                        <button
                                            onClick={(e) => { e.stopPropagation(); removeShape(shape.id); }}
                                            className="p-0.5 rounded transition-colors"
                                            style={{ color: 'var(--text-muted)' }}
                                            onMouseEnter={e => { e.currentTarget.style.color = 'var(--danger)'; }}
                                            onMouseLeave={e => { e.currentTarget.style.color = 'var(--text-muted)'; }}
                                            title="Delete"
                                        >
                                            <Trash2 size={11} />
                                        </button>
                                    </div>

                                    {/* Card Body */}
                                    {!isCollapsed && (
                                        <div className="px-3 pb-3 pt-0.5 space-y-2.5"
                                            style={{ borderTop: '1px solid var(--border-subtle)' }}>
                                            {shape.type !== 'gratingSector' && (
                                                <div className="grid grid-cols-2 gap-x-3 gap-y-2">
                                                    <SliderRow label="X Offset" value={shape.x} min={0} max={400} step={0.5}
                                                        display={`${(shape.x - 200).toFixed(1)}`} unit="mm"
                                                        ticks={[0, 100, 200, 300, 400]}
                                                        onChange={v => updateShape(shape.id, { x: v })} />
                                                    <SliderRow label="Y Offset" value={shape.y} min={0} max={400} step={0.5}
                                                        display={`${(shape.y - 200).toFixed(1)}`} unit="mm"
                                                        ticks={[0, 100, 200, 300, 400]}
                                                        onChange={v => updateShape(shape.id, { y: v })} />
                                                </div>
                                            )}

                                            {shape.type === 'rectangle' && (
                                                <>
                                                    <SliderRow label="Angle" value={shape.rotation} min={0} max={360} step={1}
                                                        display={`${shape.rotation}°`}
                                                        ticks={[0, 45, 90, 135, 180, 225, 270, 315, 360]}
                                                        onChange={v => updateShape(shape.id, { rotation: v })} />
                                                    <div className="grid grid-cols-2 gap-x-3 gap-y-2">
                                                        <SliderRow label="Length" value={shape.width} min={10} max={800} step={1} unit="mm"
                                                            ticks={[100, 200, 300, 400, 600, 800]}
                                                            onChange={v => updateShape(shape.id, { width: v })} />
                                                        <SliderRow label="Thickness" value={shape.height} min={0.1} max={50} step={0.1} unit="mm"
                                                            ticks={[1, 5, 10, 20, 30, 50]}
                                                            onChange={v => updateShape(shape.id, { height: v })} />
                                                    </div>
                                                </>
                                            )}

                                            {shape.type === 'wavy' && (
                                                <>
                                                    <SliderRow label="Angle" value={shape.rotation} min={0} max={360} step={1}
                                                        display={`${shape.rotation}°`}
                                                        ticks={[0, 45, 90, 135, 180, 225, 270, 315, 360]}
                                                        onChange={v => updateShape(shape.id, { rotation: v })} />
                                                    <div className="grid grid-cols-2 gap-x-3 gap-y-2">
                                                        <SliderRow label="Length" value={shape.length} min={50} max={800} step={1} unit="mm"
                                                            ticks={[100, 200, 300, 400, 600, 800]}
                                                            onChange={v => updateShape(shape.id, { length: v })} />
                                                        <SliderRow label="Thickness" value={shape.thickness} min={0.1} max={50} step={0.1} unit="mm"
                                                            ticks={[1, 5, 10, 20, 30, 50]}
                                                            onChange={v => updateShape(shape.id, { thickness: v })} />
                                                    </div>
                                                    <div className="grid grid-cols-2 gap-x-3 gap-y-2">
                                                        <SliderRow label="Amplitude" value={shape.amplitude} min={0} max={50} step={0.5} unit="mm"
                                                            ticks={[0, 5, 10, 20, 30, 50]}
                                                            onChange={v => updateShape(shape.id, { amplitude: v })} />
                                                        <SliderRow label="Frequency" value={shape.frequency} min={0.5} max={10} step={0.5}
                                                            ticks={[1, 2, 3, 4, 5, 8, 10]}
                                                            onChange={v => updateShape(shape.id, { frequency: v })} />
                                                    </div>
                                                </>
                                            )}

                                            {shape.type === 'gratingSector' && (
                                                <>
                                                    <div className="grid grid-cols-2 gap-x-3 gap-y-2">
                                                        <SliderRow label="Sector Start" value={shape.sectorStartAngle} min={0} max={360} step={1}
                                                            display={`${shape.sectorStartAngle}°`}
                                                            ticks={[0, 60, 90, 120, 180, 240, 270, 300, 360]}
                                                            onChange={v => updateShape(shape.id, { sectorStartAngle: v })} />
                                                        <SliderRow label="Sector End" value={shape.sectorEndAngle} min={0} max={360} step={1}
                                                            display={`${shape.sectorEndAngle}°`}
                                                            ticks={[0, 60, 90, 120, 180, 240, 270, 300, 360]}
                                                            onChange={v => updateShape(shape.id, { sectorEndAngle: v })} />
                                                    </div>
                                                    <SliderRow label="Grating Angle" value={shape.gratingAngle} min={-90} max={90} step={1}
                                                        display={`${shape.gratingAngle}°`}
                                                        ticks={[-90, -60, -45, -30, -20, 0, 20, 30, 45, 60, 90]}
                                                        onChange={v => updateShape(shape.id, { gratingAngle: v })} />
                                                    <div className="grid grid-cols-2 gap-x-3 gap-y-2">
                                                        <SliderRow label="Slit Width" value={shape.slitWidth} min={1} max={30} step={0.5} unit="mm"
                                                            ticks={[2, 5, 8, 10, 15, 20, 30]}
                                                            onChange={v => updateShape(shape.id, { slitWidth: v })} />
                                                        <SliderRow label="Bar Width" value={shape.barWidth} min={1} max={20} step={0.5} unit="mm"
                                                            ticks={[1, 3, 5, 8, 10, 15, 20]}
                                                            onChange={v => updateShape(shape.id, { barWidth: v })} />
                                                    </div>
                                                    <SliderRow label="Inner Radius" value={shape.innerRadius} min={0} max={180} step={1} unit="mm"
                                                        ticks={[0, 25, 50, 75, 100, 150, 180]}
                                                        onChange={v => updateShape(shape.id, { innerRadius: v })} />
                                                </>
                                            )}
                                        </div>
                                    )}
                                </div>
                            );
                        })}

                        {shapes.length === 0 && (
                            <div className="text-center py-8 px-4 rounded-lg text-xs"
                                style={{ border: '1px dashed var(--border-subtle)', color: 'var(--text-muted)' }}>
                                No vanes added. Use the buttons above or select a preset.
                            </div>
                        )}
                    </div>
                </Section>
            </div>
        </div>
    );
}

/* ═══════════════════════════════════════════════
   Reusable Primitives
   ═══════════════════════════════════════════════ */

function Section({ icon, title, trailing, noPadding, children }: {
    icon?: React.ReactNode;
    title: string;
    trailing?: React.ReactNode;
    noPadding?: boolean;
    children: React.ReactNode;
}) {
    return (
        <div className="rounded-lg overflow-hidden"
            style={{ border: '1px solid var(--border-subtle)', backgroundColor: 'var(--bg-card)' }}>
            <div className="flex items-center gap-2 px-3 py-2"
                style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                {icon && <span style={{ color: 'var(--text-accent)', opacity: 0.7 }}>{icon}</span>}
                <h3 className="text-[11px] font-semibold uppercase tracking-wider flex-1"
                    style={{ color: 'var(--text-secondary)' }}>{title}</h3>
                {trailing}
            </div>
            <div className={noPadding ? '' : 'p-3'}>
                {children}
            </div>
        </div>
    );
}

function SegmentedControl({ options, value, onChange }: {
    options: { value: string; label: string }[];
    value: string;
    onChange: (v: string) => void;
}) {
    return (
        <div className="flex rounded-md p-0.5"
            style={{ backgroundColor: 'var(--bg-segment)', border: '1px solid var(--border-subtle)' }}>
            {options.map(opt => (
                <button
                    key={opt.value}
                    onClick={() => onChange(opt.value)}
                    className="flex-1 px-3 py-1 rounded text-[11px] font-medium transition-all duration-150"
                    style={{
                        backgroundColor: value === opt.value ? 'var(--bg-segment-active)' : 'transparent',
                        color: value === opt.value ? 'var(--text-accent)' : 'var(--text-muted)',
                    }}
                >
                    {opt.label}
                </button>
            ))}
        </div>
    );
}

function TogglePill({ active, onLabel, offLabel, onToggle }: {
    active: boolean; onLabel: string; offLabel: string; onToggle: () => void;
}) {
    return (
        <button
            onClick={onToggle}
            className="relative flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium transition-all duration-200"
            style={{
                backgroundColor: active ? 'var(--success-dim)' : 'var(--bg-segment)',
                border: `1px solid ${active ? 'var(--success-border)' : 'var(--border-subtle)'}`,
                color: active ? 'var(--success)' : 'var(--text-muted)',
            }}
        >
            <span className="w-1.5 h-1.5 rounded-full transition-colors duration-200"
                style={{ backgroundColor: active ? 'var(--success)' : 'var(--text-muted)' }} />
            {active ? onLabel : offLabel}
        </button>
    );
}

function IconButton({ icon, label, onClick }: {
    icon: React.ReactNode; label: string; onClick: () => void;
}) {
    return (
        <button
            onClick={onClick}
            className="flex items-center gap-1 px-2 py-1 rounded-md text-[10px] transition-all duration-150"
            style={{
                backgroundColor: 'var(--bg-segment)',
                border: '1px solid var(--border-subtle)',
                color: 'var(--text-muted)',
            }}
        >
            {icon} {label}
        </button>
    );
}

function SliderRow({ label, value, min, max, step, display, unit, ticks, onChange }: {
    label: string; value: number; min: number; max: number;
    step?: number; display?: string | number; unit?: string;
    ticks?: number[]; onChange: (v: number) => void;
}) {
    const [editing, setEditing] = useState(false);
    const [editValue, setEditValue] = useState('');
    const inputRef = useRef<HTMLInputElement>(null);
    const effectiveStep = step ?? 1;

    useEffect(() => {
        if (editing && inputRef.current) {
            inputRef.current.focus();
            inputRef.current.select();
        }
    }, [editing]);

    const commitEdit = () => {
        setEditing(false);
        const parsed = parseFloat(editValue);
        if (!isNaN(parsed)) {
            const clamped = Math.max(min, Math.min(max, parsed));
            // Round to step
            const rounded = Math.round(clamped / effectiveStep) * effectiveStep;
            onChange(parseFloat(rounded.toFixed(4)));
        }
    };

    const handleSliderChange = (rawValue: number) => {
        if (ticks && ticks.length > 0) {
            const range = max - min;
            const snapThreshold = range * 0.03;
            for (const tick of ticks) {
                if (Math.abs(rawValue - tick) < snapThreshold) {
                    onChange(tick);
                    return;
                }
            }
        }
        onChange(rawValue);
    };

    // Format display value with appropriate precision
    const formatValue = (v: number) => {
        if (effectiveStep < 1) {
            const decimals = effectiveStep >= 0.1 ? 1 : 2;
            return v.toFixed(decimals);
        }
        return String(v);
    };

    const displayValue = display !== undefined
        ? display
        : (unit ? `${formatValue(value)} ${unit}` : formatValue(value));

    const tickPositions = ticks?.map(t => ({
        value: t,
        pct: ((t - min) / (max - min)) * 100,
    }));

    return (
        <div className="group">
            <div className="flex justify-between text-[10px] mb-1">
                <span style={{ color: 'var(--text-muted)' }}>{label}</span>
                {editing ? (
                    <input
                        ref={inputRef}
                        type="number"
                        min={min} max={max} step={effectiveStep}
                        value={editValue}
                        onChange={e => setEditValue(e.target.value)}
                        onBlur={commitEdit}
                        onKeyDown={e => { if (e.key === 'Enter') commitEdit(); if (e.key === 'Escape') setEditing(false); }}
                        className="w-16 text-[10px] px-1.5 py-0.5 rounded text-right outline-none"
                        style={{
                            backgroundColor: 'var(--bg-input)',
                            color: 'var(--text-accent)',
                            border: '1px solid var(--border-accent)',
                        }}
                    />
                ) : (
                    <span
                        onClick={() => { setEditing(true); setEditValue(String(value)); }}
                        className="cursor-pointer transition-colors tabular-nums font-mono text-[10px]"
                        style={{ color: 'var(--text-secondary)' }}
                        title="Click to edit"
                    >
                        {displayValue}
                    </span>
                )}
            </div>
            <div className="relative h-4 flex items-center">
                <input type="range" min={min} max={max} step={effectiveStep} value={value}
                    onChange={e => handleSliderChange(Number(e.target.value))}
                    className="slider-track w-full rounded-full appearance-none cursor-pointer relative z-10" />
                {tickPositions && (
                    <div className="absolute top-[14px] left-0 right-0 flex pointer-events-none">
                        {tickPositions.map(({ value: tv, pct }) => (
                            <div
                                key={tv}
                                className="absolute w-px h-1 rounded-full"
                                style={{ left: `${pct}%`, backgroundColor: 'var(--tick-color)' }}
                            />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
