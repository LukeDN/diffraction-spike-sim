import type { MaskParams } from '../App';
import type { AnyShape } from '../types/shapes';

interface CompactShape {
    t: string;
    [key: string]: unknown;
}

interface CompactDesign {
    d: number;          // apertureDiameter
    c?: string;         // colorStyle
    o: {                // obstruction
        e: boolean;
        s: string;
        rc: number;
        sr: number;
        rs: number;
        rt: number;
    };
    v: CompactShape[];  // shapes (vanes)
}

function compactShape(s: AnyShape): CompactShape {
    const base: CompactShape = {
        t: s.type,
        x: s.x,
        y: s.y,
        r: s.rotation,
    };

    if (s.type === 'rectangle') {
        return { ...base, w: s.width, h: s.height };
    } else if (s.type === 'wavy') {
        return { ...base, l: s.length, a: s.amplitude, f: s.frequency, th: s.thickness };
    } else if (s.type === 'gratingSector') {
        return {
            ...base,
            ss: s.sectorStartAngle,
            se: s.sectorEndAngle,
            ga: s.gratingAngle,
            sw: s.slitWidth,
            bw: s.barWidth,
            ir: s.innerRadius,
        };
    }
    return base;
}

function expandShape(c: CompactShape): AnyShape {
    const id = Date.now().toString() + Math.random().toString(36).slice(2, 6);
    const base = {
        id,
        x: (c.x as number) || 200,
        y: (c.y as number) || 200,
        rotation: (c.r as number) || 0,
        scaleX: 1,
        scaleY: 1,
        fill: 'black',
    };

    if (c.t === 'rectangle') {
        return { ...base, type: 'rectangle', width: (c.w as number) || 400, height: (c.h as number) || 5 };
    } else if (c.t === 'wavy') {
        return {
            ...base, type: 'wavy',
            length: (c.l as number) || 400,
            amplitude: (c.a as number) || 10,
            frequency: (c.f as number) || 4,
            thickness: (c.th as number) || 5,
        };
    } else if (c.t === 'gratingSector') {
        return {
            ...base, type: 'gratingSector',
            sectorStartAngle: (c.ss as number) || 0,
            sectorEndAngle: (c.se as number) || 120,
            gratingAngle: (c.ga as number) || 0,
            slitWidth: (c.sw as number) || 8,
            barWidth: (c.bw as number) || 5,
            innerRadius: (c.ir as number) || 0,
        };
    }
    return { ...base, type: 'rectangle', width: 400, height: 5 };
}

export function encodeDesign(params: MaskParams, shapes: AnyShape[]): string {
    const compact: CompactDesign = {
        d: params.apertureDiameter,
        c: params.colorStyle,
        o: {
            e: params.obstruction.enabled,
            s: params.obstruction.style,
            rc: params.obstruction.ringCount,
            sr: params.obstruction.startRadius,
            rs: params.obstruction.ringSpacing,
            rt: params.obstruction.ringThickness,
        },
        v: shapes.map(compactShape),
    };
    return btoa(JSON.stringify(compact));
}

export function decodeDesign(encoded: string): { params: MaskParams; shapes: AnyShape[] } | null {
    try {
        const compact: CompactDesign = JSON.parse(atob(encoded));
        const params: MaskParams = {
            apertureDiameter: compact.d || 400,
            colorStyle: (compact.c as 'angular' | 'longitudinal') || 'longitudinal',
            obstruction: {
                enabled: compact.o?.e ?? false,
                style: (compact.o?.s as 'filled' | 'hollow') || 'filled',
                ringCount: compact.o?.rc ?? 1,
                startRadius: compact.o?.sr ?? 50,
                ringSpacing: compact.o?.rs ?? 20,
                ringThickness: compact.o?.rt ?? 5,
            },
        };
        const shapes = (compact.v || []).map(expandShape);
        return { params, shapes };
    } catch {
        console.warn('Failed to decode design from URL');
        return null;
    }
}
