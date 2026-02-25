import type { AnyShape, ObstructionConfig } from '../types/shapes';
import type { MaskParams } from '../App';

export interface SpikeInfo {
    angle: number;
    brightness: number;
    width: number;
    spread: number;
    offsetFromCenter: number;
}

/**
 * Compute what fraction of a line segment lies inside a circle.
 * Samples N points along the segment and returns [0..1].
 */
function segmentOverlapFraction(
    x1: number, y1: number, x2: number, y2: number,
    cx: number, cy: number, radius: number,
): number {
    const SAMPLES = 32;
    let inside = 0;
    for (let i = 0; i <= SAMPLES; i++) {
        const t = i / SAMPLES;
        const px = x1 + (x2 - x1) * t;
        const py = y1 + (y2 - y1) * t;
        const dx = px - cx;
        const dy = py - cy;
        if (dx * dx + dy * dy <= radius * radius) inside++;
    }
    return inside / (SAMPLES + 1);
}

/**
 * Analyze mask shapes to determine spike directions.
 * Only portions of vanes within the aperture produce diffraction.
 */
export function analyzeSpikes(shapes: AnyShape[], apertureDiameter: number): SpikeInfo[] {
    const spikes: SpikeInfo[] = [];
    const apertureRadius = apertureDiameter / 2;
    const acx = 200, acy = 200; // aperture center

    for (const shape of shapes) {
        if (shape.type === 'rectangle') {
            const angleRad = (shape.rotation * Math.PI) / 180;
            const cosA = Math.cos(angleRad);
            const sinA = Math.sin(angleRad);
            const halfLen = shape.width / 2;

            // Vane endpoints along its central axis
            const x1 = shape.x - halfLen * cosA;
            const y1 = shape.y - halfLen * sinA;
            const x2 = shape.x + halfLen * cosA;
            const y2 = shape.y + halfLen * sinA;

            const overlapFrac = segmentOverlapFraction(x1, y1, x2, y2, acx, acy, apertureRadius);
            if (overlapFrac < 0.001) continue; // entirely outside aperture

            const perpAngle1 = angleRad + Math.PI / 2;
            const perpAngle2 = angleRad - Math.PI / 2;

            const thicknessFactor = Math.min(1, shape.height / 5);
            const lengthFactor = Math.min(1, shape.width / 200);
            const brightness = thicknessFactor * (0.3 + 0.7 * lengthFactor) * overlapFrac;
            const spikeWidth = Math.max(0.8, shape.height * 0.6);

            const dx = shape.x - acx;
            const dy = shape.y - acy;
            const offsetFromCenter = Math.sqrt(dx * dx + dy * dy);

            spikes.push({ angle: perpAngle1, brightness, width: spikeWidth, spread: 0, offsetFromCenter });
            spikes.push({ angle: perpAngle2, brightness, width: spikeWidth, spread: 0, offsetFromCenter });

        } else if (shape.type === 'wavy') {
            const angleRad = (shape.rotation * Math.PI) / 180;
            const cosA = Math.cos(angleRad);
            const sinA = Math.sin(angleRad);
            const halfLen = shape.length / 2;

            const x1 = shape.x - halfLen * cosA;
            const y1 = shape.y - halfLen * sinA;
            const x2 = shape.x + halfLen * cosA;
            const y2 = shape.y + halfLen * sinA;

            const overlapFrac = segmentOverlapFraction(x1, y1, x2, y2, acx, acy, apertureRadius);
            if (overlapFrac < 0.001) continue;

            const perpAngle1 = angleRad + Math.PI / 2;
            const perpAngle2 = angleRad - Math.PI / 2;

            const thicknessFactor = Math.min(1, shape.thickness / 5);
            const lengthFactor = Math.min(1, shape.length / 200);
            const brightness = thicknessFactor * (0.3 + 0.7 * lengthFactor) * 0.8 * overlapFrac;
            const spikeWidth = Math.max(0.8, shape.thickness * 0.6);

            const spreadAngle = Math.atan2(shape.amplitude * 2, shape.length / Math.max(shape.frequency, 0.5));

            const dx = shape.x - acx;
            const dy = shape.y - acy;
            const offsetFromCenter = Math.sqrt(dx * dx + dy * dy);

            spikes.push({ angle: perpAngle1, brightness, width: spikeWidth, spread: spreadAngle, offsetFromCenter });
            spikes.push({ angle: perpAngle2, brightness, width: spikeWidth, spread: spreadAngle, offsetFromCenter });

        } else if (shape.type === 'gratingSector') {
            // Grating sectors produce spikes perpendicular to grating lines
            const gratingRad = (shape.gratingAngle * Math.PI) / 180;
            const perpAngle1 = gratingRad + Math.PI / 2;
            const perpAngle2 = gratingRad - Math.PI / 2;

            // Brightness proportional to sector coverage and grating fill ratio
            const sectorSpan = Math.abs(shape.sectorEndAngle - shape.sectorStartAngle);
            const sectorFrac = sectorSpan / 360;
            const pitch = shape.slitWidth + shape.barWidth;
            const fillRatio = shape.barWidth / Math.max(pitch, 0.1);

            const brightness = sectorFrac * fillRatio * 1.2;
            const spikeWidth = Math.max(0.5, shape.barWidth * 0.4);

            spikes.push({ angle: perpAngle1, brightness, width: spikeWidth, spread: 0, offsetFromCenter: 0 });
            spikes.push({ angle: perpAngle2, brightness, width: spikeWidth, spread: 0, offsetFromCenter: 0 });
        }
    }

    return spikes;
}

/**
 * Analyze center obstruction for halo effects.
 */
function computeObstructionEffect(obs: ObstructionConfig, apertureDiameter: number): {
    haloMultiplier: number;
    coreReduction: number;
} {
    if (!obs.enabled) {
        return { haloMultiplier: 1, coreReduction: 1 };
    }

    const apertureRadius = apertureDiameter / 2;
    const apertureArea = Math.PI * apertureRadius * apertureRadius;

    // Calculate total area blocked by obstruction
    let blockedArea = 0;
    if (obs.style === 'filled') {
        blockedArea = Math.PI * obs.startRadius * obs.startRadius;
    }
    // Additional rings
    for (let ring = (obs.style === 'filled' ? 1 : 0); ring < obs.ringCount; ring++) {
        const r = obs.startRadius + ring * obs.ringSpacing;
        // Annular ring area ≈ 2πr × thickness
        blockedArea += 2 * Math.PI * r * obs.ringThickness;
    }

    const ratio = Math.min(0.8, blockedArea / apertureArea);

    return {
        haloMultiplier: 1 + ratio * 3.0,
        coreReduction: 1 - ratio * 0.3,
    };
}

/**
 * Render a photorealistic star image with diffraction spikes.
 */
export function renderStar(
    width: number,
    height: number,
    params: MaskParams,
    shapes: AnyShape[],
): ImageData {
    const spikes = analyzeSpikes(shapes, params.apertureDiameter);
    const obsEffect = computeObstructionEffect(params.obstruction, params.apertureDiameter);
    const imgData = new ImageData(width, height);
    const cx = width / 2;
    const cy = height / 2;

    const apertureScale = 400 / Math.max(params.apertureDiameter, 50);

    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
            const dx = x - cx;
            const dy = y - cy;
            const r = Math.sqrt(dx * dx + dy * dy);
            const pixelAngle = Math.atan2(dy, dx);

            // Core glow
            const coreR = 10 * apertureScale;
            const coreIntensity = obsEffect.coreReduction * Math.exp(-(r * r) / (2 * coreR * coreR));

            // Halo
            const haloR = 30 * apertureScale;
            const haloIntensity = obsEffect.haloMultiplier * 0.15 * Math.exp(-(r * r) / (2 * haloR * haloR));

            // Wide glow
            const glowR = 70 * apertureScale;
            const glowIntensity = obsEffect.haloMultiplier * 0.04 * Math.exp(-(r * r) / (2 * glowR * glowR));

            // Diffraction spikes per R/G/B channel
            let spikeRed = 0, spikeGreen = 0, spikeBlue = 0;

            const style = params.colorStyle || 'longitudinal';

            for (const spike of spikes) {
                const offsetPenalty = 1 / (1 + spike.offsetFromCenter * 0.01);

                if (style === 'angular') {
                    const chromaticSpread = 0.018;
                    const channels = [
                        { shift: -chromaticSpread, ch: 0 },
                        { shift: 0, ch: 1 },
                        { shift: chromaticSpread, ch: 2 },
                    ];

                    for (const { shift, ch } of channels) {
                        const spikeAngle = spike.angle + shift;
                        let angleDiff = pixelAngle - spikeAngle;
                        while (angleDiff > Math.PI) angleDiff -= 2 * Math.PI;
                        while (angleDiff < -Math.PI) angleDiff += 2 * Math.PI;

                        let angularIntensity: number;

                        if (spike.spread > 0.01) {
                            const halfSpread = spike.spread;
                            const angularWidth = (spike.width / Math.max(r, 1)) * 1.0;

                            // Smooth Gaussian-like transition for the edges of the spread fan
                            const excess = Math.max(0, Math.abs(angleDiff) - halfSpread * 0.7);
                            const transitionWidth = halfSpread * 0.3 + angularWidth;
                            angularIntensity = Math.exp(-(excess * excess) / (2 * transitionWidth * transitionWidth));

                            // Dim the intensity because the energy is spread over a wide area
                            angularIntensity *= 1 / (1 + halfSpread * 6);
                        } else {
                            const angularWidth = (spike.width / Math.max(r, 1)) * 1.0;
                            angularIntensity = Math.exp(-(angleDiff * angleDiff) / (2 * angularWidth * angularWidth));
                        }

                        const radialFalloff = r > 5 ? Math.pow(5 / r, 0.6) : 1;
                        const spikeVal = spike.brightness * offsetPenalty * angularIntensity * radialFalloff * 1.5;

                        if (ch === 0) spikeRed += spikeVal;
                        else if (ch === 1) spikeGreen += spikeVal;
                        else spikeBlue += spikeVal;
                    }
                } else {
                    // Use relative wavelengths: Red ~ 0.65, Green ~ 0.53, Blue ~ 0.45
                    const channels = [
                        { wl: 0.65, ch: 0 },
                        { wl: 0.53, ch: 1 },
                        { wl: 0.45, ch: 2 },
                    ];

                    for (const { wl, ch } of channels) {
                        const spikeAngle = spike.angle;
                        let angleDiff = pixelAngle - spikeAngle;
                        while (angleDiff > Math.PI) angleDiff -= 2 * Math.PI;
                        while (angleDiff < -Math.PI) angleDiff += 2 * Math.PI;

                        let angularIntensity: number;

                        if (spike.spread > 0.01) {
                            const halfSpread = spike.spread;
                            const angularWidth = (spike.width / Math.max(r, 1)) * (wl / 0.53);

                            // Smooth Gaussian-like transition for the spread fan
                            const excess = Math.max(0, Math.abs(angleDiff) - halfSpread * 0.7);
                            const transitionWidth = halfSpread * 0.3 + angularWidth;
                            angularIntensity = Math.exp(-(excess * excess) / (2 * transitionWidth * transitionWidth));

                            angularIntensity *= 1 / (1 + halfSpread * 6);
                        } else {
                            // The angular width scales softly with wavelength
                            const angularWidth = (spike.width / Math.max(r, 1)) * (wl / 0.53);
                            angularIntensity = Math.exp(-(angleDiff * angleDiff) / (2 * angularWidth * angularWidth));
                        }

                        const radialFalloff = r > 5 ? Math.pow(5 / r, 0.6) : 1;

                        // Modulate intensity longitudinally to create spectral bands (rainbow patterns)
                        const spectralDistance = r * 0.05;
                        const phase = (Math.PI * spectralDistance) / wl;
                        const bandModulation = 0.2 + 0.8 * Math.pow(Math.cos(phase), 2);

                        const spikeVal = spike.brightness * offsetPenalty * angularIntensity * radialFalloff * bandModulation * 1.5;

                        if (ch === 0) spikeRed += spikeVal;
                        else if (ch === 1) spikeGreen += spikeVal;
                        else spikeBlue += spikeVal;
                    }
                }
            }

            // Combine
            const baseWhite = coreIntensity + haloIntensity + glowIntensity;

            let finalR = baseWhite * 1.05 + spikeRed;
            let finalG = baseWhite * 1.0 + spikeGreen;
            let finalB = baseWhite * 0.92 + spikeBlue;

            finalR = Math.min(1, finalR);
            finalG = Math.min(1, finalG);
            finalB = Math.min(1, finalB);

            // Remove the 0.006 hard cutoff so spikes softly fade out into the background
            // finalR = Math.max(0, finalR); etc. handled by clamping and floor


            const idx = (y * width + x) * 4;
            imgData.data[idx] = Math.floor(finalR * 255);
            imgData.data[idx + 1] = Math.floor(finalG * 255);
            imgData.data[idx + 2] = Math.floor(finalB * 255);
            imgData.data[idx + 3] = 255;
        }
    }

    return imgData;
}
