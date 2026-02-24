export type ShapeType = 'rectangle' | 'wavy' | 'gratingSector';

export interface BaseShape {
    id: string;
    type: ShapeType;
    x: number;
    y: number;
    rotation: number;
    scaleX: number;
    scaleY: number;
    fill: string;
}

export interface RectShape extends BaseShape {
    type: 'rectangle';
    width: number;
    height: number;
}

export interface WavyShape extends BaseShape {
    type: 'wavy';
    length: number;
    amplitude: number;
    frequency: number;
    thickness: number;
}

/** A sector of the aperture filled with parallel grating slits */
export interface GratingSectorShape extends BaseShape {
    type: 'gratingSector';
    sectorStartAngle: number;   // sector arc start (degrees, 0=right, CCW)
    sectorEndAngle: number;     // sector arc end (degrees)
    gratingAngle: number;       // angle of slit lines within sector (degrees, 0=vertical)
    slitWidth: number;          // width of transparent slits (mm)
    barWidth: number;           // width of opaque bars (mm)
    innerRadius: number;        // inner radius cutoff (0 = extends to center)
}

export type AnyShape = RectShape | WavyShape | GratingSectorShape;

/** Center obstruction configuration (always-present, toggleable) */
export interface ObstructionConfig {
    enabled: boolean;
    style: 'filled' | 'hollow';
    ringCount: number;       // 1 = single, 2+ = concentric
    startRadius: number;     // radius of innermost ring (mm)
    ringSpacing: number;     // gap between ring centers (mm)
    ringThickness: number;   // width of each ring stroke (hollow mode)
}

/** Preset telescope configurations */
export type PresetId = 'blank' | 'newtonian' | 'jwst' | 'bahtinov' | 'tri-bahtinov' | 'carey';

export interface Preset {
    id: PresetId;
    label: string;
    description: string;
    shapes: AnyShape[];
    obstruction: ObstructionConfig;
    apertureDiameter: number;
}
