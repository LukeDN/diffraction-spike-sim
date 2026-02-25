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

function makeHalfVane(id: string, angle: number, innerR: number, outerR = 200, thickness = 3): AnyShape {
    const length = outerR - innerR;
    const midR = innerR + length / 2;
    const rad = angle * Math.PI / 180;
    const cx = 200 + midR * Math.cos(rad);
    const cy = 200 + midR * Math.sin(rad);
    return {
        id, type: 'rectangle',
        x: cx, y: cy, width: length, height: thickness,
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

export const PRESETS: Record<string, Preset> = {
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
    // 3 sectors: top half = vertical grating, bottom-left = +20°, bottom-right = -20°
    // Structural ribs at sector boundaries prevent floating pieces
    bahtinov: {
        id: 'bahtinov',
        label: 'Bahtinov',
        description: 'Focus-aid: 3 grating sectors (vertical + ±20°)',
        shapes: [
            // Top half: vertical gratings
            makeGratingSector('bt', 180, 360, 0, 8, 5, 0),
            // Bottom-left: grating angled at +20°
            makeGratingSector('bl', 90, 180, 20, 8, 5, 0),
            // Bottom-right: grating angled at -20°
            makeGratingSector('br', 0, 90, -20, 8, 5, 0),
            // Structural rib: horizontal bar separating top/bottom halves
            makeVane('bh', 0, 400, 3),
            // Structural rib: vertical half-bar separating bottom-left/bottom-right
            makeHalfVane('bv', 90, 0, 200, 3),
        ],
        obstruction: { ...defaultObstruction, enabled: false },
        apertureDiameter: 400,
    },

    // ── Tri-Bahtinov Mask ──
    // 3 complete independent Bahtinov patterns, each taking up a 120° wedge.
    // Each wedge has 3 sectors (one straight, two angled) just like a normal Bahtinov.
    // Radial ribs at every sector boundary + inner support ring form the structure.
    'tri-bahtinov': {
        id: 'tri-bahtinov',
        label: 'Tri-Bahtinov',
        description: 'Focus & collimation aid: 3 independent Bahtinovs at 120°',
        shapes: [
            // Wedge 1 (30° to 150°, symmetry axis 90°)
            makeGratingSector('tb-w1-s', 30, 90, 0, 6, 4, 75),     // Straight half
            makeGratingSector('tb-w1-a1', 90, 120, 20, 6, 4, 75),  // Angled +20
            makeGratingSector('tb-w1-a2', 120, 150, -20, 6, 4, 75), // Angled -20

            // Wedge 2 (150° to 270°, symmetry axis 210°) -> rotate W1 by +120°
            makeGratingSector('tb-w2-s', 150, 210, 120, 6, 4, 75),
            makeGratingSector('tb-w2-a1', 210, 240, 140, 6, 4, 75),
            makeGratingSector('tb-w2-a2', 240, 270, 100, 6, 4, 75),

            // Wedge 3 (270° to 30°, symmetry axis 330°) -> rotate W1 by +240°
            makeGratingSector('tb-w3-s', 270, 330, 240, 6, 4, 75),
            makeGratingSector('tb-w3-a1', 330, 360, 260, 6, 4, 75),
            makeGratingSector('tb-w3-a2', 0, 30, 220, 6, 4, 75),

            // Structural Radial Ribs (9 total at every sector boundary)
            makeHalfVane('tb-r1', 0, 75, 200, 3),
            makeHalfVane('tb-r2', 30, 75, 200, 3),
            makeHalfVane('tb-r3', 90, 75, 200, 3),
            makeHalfVane('tb-r4', 120, 75, 200, 3),
            makeHalfVane('tb-r5', 150, 75, 200, 3),
            makeHalfVane('tb-r6', 210, 75, 200, 3),
            makeHalfVane('tb-r7', 240, 75, 200, 3),
            makeHalfVane('tb-r8', 270, 75, 200, 3),
            makeHalfVane('tb-r9', 330, 75, 200, 3),
        ],
        // Inner support ring at 75mm holds the radial ribs together
        obstruction: {
            enabled: true, style: 'hollow' as const, ringCount: 1,
            startRadius: 75, ringSpacing: 20, ringThickness: 3,
        },
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
