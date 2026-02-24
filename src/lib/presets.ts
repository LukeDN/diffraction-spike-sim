import type { AnyShape, GratingSectorShape, ObstructionConfig, Preset, PresetId } from '../types/shapes';

const defaultObstruction: ObstructionConfig = {
    enabled: true,
    style: 'filled',
    ringCount: 1,
    startRadius: 50,
    ringSpacing: 20,
    ringThickness: 5,
};

function makeVane(id: string, angle: number, length = 400, thickness = 5): AnyShape {
    return {
        id, type: 'rectangle',
        x: 200, y: 200, width: length, height: thickness,
        fill: 'black', rotation: angle, scaleX: 1, scaleY: 1,
    };
}

function makeWavy(id: string, angle: number, amp = 15, freq = 3): AnyShape {
    return {
        id, type: 'wavy',
        x: 200, y: 200, length: 400, thickness: 5,
        amplitude: amp, frequency: freq,
        fill: 'black', rotation: angle, scaleX: 1, scaleY: 1,
    };
}

function makeGratingSector(
    id: string,
    sectorStart: number,
    sectorEnd: number,
    gratingAngle: number,
    slitWidth = 8,
    barWidth = 5,
    innerRadius = 0,
): GratingSectorShape {
    return {
        id, type: 'gratingSector',
        x: 200, y: 200,
        rotation: 0, scaleX: 1, scaleY: 1, fill: 'black',
        sectorStartAngle: sectorStart,
        sectorEndAngle: sectorEnd,
        gratingAngle,
        slitWidth,
        barWidth,
        innerRadius,
    };
}

export const PRESETS: Record<PresetId, Preset> = {
    blank: {
        id: 'blank',
        label: 'Blank',
        description: 'Empty aperture — point source only',
        shapes: [],
        obstruction: { ...defaultObstruction, enabled: false },
        apertureDiameter: 400,
    },
    newtonian: {
        id: 'newtonian',
        label: 'Newtonian',
        description: '4 cross spikes (standard reflector)',
        shapes: [
            makeVane('p1', 0),
            makeVane('p2', 90),
        ],
        obstruction: { ...defaultObstruction, startRadius: 50 },
        apertureDiameter: 400,
    },
    jwst: {
        id: 'jwst',
        label: '3 Vane',
        description: '6 spikes at 60° intervals',
        shapes: [
            makeVane('p1', 0),
            makeVane('p2', 120),
            makeVane('p3', 240),
        ],
        obstruction: { ...defaultObstruction, startRadius: 35 },
        apertureDiameter: 400,
    },
    // ── Bahtinov Mask ──
    // 3 sectors: top half = vertical grating, bottom-left = +20° angled, bottom-right = -20° angled
    // Angles are in standard math convention: 0°=right, 90°=down on canvas (measured CW)
    bahtinov: {
        id: 'bahtinov',
        label: 'Bahtinov',
        description: 'Focus-aid: 3 grating sectors (vertical + ±20°)',
        shapes: [
            // Top half: vertical gratings (slit lines at 0° = vertical)
            makeGratingSector('bt', 180, 360, 0, 8, 5, 0),
            // Bottom-left: grating angled at +20°
            makeGratingSector('bl', 90, 180, 20, 8, 5, 0),
            // Bottom-right: grating angled at -20°
            makeGratingSector('br', 0, 90, -20, 8, 5, 0),
        ],
        obstruction: { ...defaultObstruction, enabled: false },
        apertureDiameter: 400,
    },

    // ── Tri-Bahtinov Mask ──
    // 6 sectors × 60°, 3 grating orientations (each used twice in opposing sectors)
    // Center hole (innerRadius ~80mm)
    'tri-bahtinov': {
        id: 'tri-bahtinov',
        label: 'Tri-Bahtinov',
        description: 'Focus-aid: 6 sectors, 3 grating angles, open center',
        shapes: [
            // 0° grating orientation — sectors at 0° and 180°
            makeGratingSector('tb-a1', 0, 60, 0, 10, 6, 75),
            makeGratingSector('tb-a2', 180, 240, 0, 10, 6, 75),
            // +30° grating — sectors at 60° and 240°
            makeGratingSector('tb-b1', 60, 120, 30, 10, 6, 75),
            makeGratingSector('tb-b2', 240, 300, 30, 10, 6, 75),
            // -30° grating — sectors at 120° and 300°
            makeGratingSector('tb-c1', 120, 180, -30, 10, 6, 75),
            makeGratingSector('tb-c2', 300, 360, -30, 10, 6, 75),
        ],
        obstruction: { ...defaultObstruction, enabled: false },
        apertureDiameter: 400,
    },

    carey: {
        id: 'carey',
        label: 'Carey (Curved)',
        description: 'Curved vanes — suppressed spikes',
        shapes: [
            makeWavy('c1', 0, 25, 2),
            makeWavy('c2', 90, 25, 2),
        ],
        obstruction: { ...defaultObstruction, startRadius: 50 },
        apertureDiameter: 400,
    },
};

export const PRESET_ORDER: PresetId[] = ['blank', 'newtonian', 'jwst', 'bahtinov', 'tri-bahtinov', 'carey'];
