import FFT from 'fft.js';
import type { MaskParams } from '../App';
import type { AnyShape } from '../types/shapes';

/**
 * Approximate CIE 1931 color matching function.
 * Converts a wavelength in nanometers to an RGB value [0-1].
 */
function wavelengthToRGB(wavelength: number): [number, number, number] {
    let r = 0, g = 0, b = 0;
    if (wavelength >= 380 && wavelength <= 440) {
        r = -(wavelength - 440) / (440 - 380);
        g = 0.0;
        b = 1.0;
    } else if (wavelength > 440 && wavelength <= 490) {
        r = 0.0;
        g = (wavelength - 440) / (490 - 440);
        b = 1.0;
    } else if (wavelength > 490 && wavelength <= 510) {
        r = 0.0;
        g = 1.0;
        b = -(wavelength - 510) / (510 - 490);
    } else if (wavelength > 510 && wavelength <= 580) {
        r = (wavelength - 510) / (580 - 510);
        g = 1.0;
        b = 0.0;
    } else if (wavelength > 580 && wavelength <= 645) {
        r = 1.0;
        g = -(wavelength - 645) / (645 - 580);
        b = 0.0;
    } else if (wavelength > 645 && wavelength <= 780) {
        r = 1.0;
        g = 0.0;
        b = 0.0;
    }

    let factor = 0.0;
    if (wavelength >= 380 && wavelength <= 420) {
        factor = 0.3 + 0.7 * (wavelength - 380) / (420 - 380);
    } else if (wavelength > 420 && wavelength <= 700) {
        factor = 1.0;
    } else if (wavelength > 700 && wavelength <= 780) {
        factor = 0.3 + 0.7 * (780 - wavelength) / (780 - 700);
    }

    const gamma = 0.8;
    return [
        Math.pow(r * factor, gamma),
        Math.pow(g * factor, gamma),
        Math.pow(b * factor, gamma)
    ];
}

/**
 * Rasterize the mask into a binary aperture array (1=transparent, 0=blocked).
 * Uses an offscreen canvas with identical drawing logic to the preview.
 */
function rasterizeMask(size: number, params: MaskParams, shapes: AnyShape[]): Float64Array {
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d')!;

    // Fill the entire canvas black first
    ctx.fillStyle = 'black';
    ctx.fillRect(0, 0, size, size);

    // Zero-padding: draw the aperture smaller in the center of the grid.
    // This physically enlarges the resulting diffraction pattern (increases frequency resolution).
    const paddingFactor = 3.5; // Pattern will be 3.5x larger with true detail
    const scale = (size / paddingFactor) / 400;

    ctx.translate(size / 2, size / 2);
    ctx.scale(scale, scale);
    ctx.translate(-200, -200);

    // Draw explicitly over the 400x400 mask area
    ctx.fillStyle = 'black';
    ctx.fillRect(0, 0, 400, 400);

    // Draw aperture (white = transparent)
    ctx.fillStyle = 'white';
    ctx.beginPath();
    ctx.arc(200, 200, params.apertureDiameter / 2, 0, Math.PI * 2);
    ctx.fill();

    // Draw shapes as black (blocking)
    ctx.fillStyle = 'black';
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
            ctx.restore();
            ctx.save();

            const cx = 200, cy = 200;
            const outerR = params.apertureDiameter / 2;
            const innerR = shape.innerRadius;
            const startRad = (shape.sectorStartAngle * Math.PI) / 180;
            const endRad = (shape.sectorEndAngle * Math.PI) / 180;

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

            const gAngleRad = (shape.gratingAngle * Math.PI) / 180;
            const pitch = shape.slitWidth + shape.barWidth;
            const span = params.apertureDiameter + 20;
            const numBars = Math.ceil(span / pitch) + 1;

            ctx.fillStyle = 'black';
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

    // Draw obstruction
    const obs = params.obstruction;
    if (obs.enabled) {
        ctx.fillStyle = 'black';
        ctx.strokeStyle = 'black';

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

    // Extract binary mask from canvas
    const imgData = ctx.getImageData(0, 0, size, size);
    const mask = new Float64Array(size * size);
    for (let i = 0; i < size * size; i++) {
        // White = transparent = 1, Black = blocked = 0
        mask[i] = imgData.data[i * 4] / 255;
    }
    return mask;
}

/**
 * Perform 2D FFT and compute the PSF (power spectrum).
 * Returns ImageData ready to display.
 */
export function renderFFTPSF(
    width: number,
    _height: number,
    params: MaskParams,
    shapes: AnyShape[],
): ImageData {
    // Use power-of-2 size for FFT
    const size = width; // Assume it's already power of 2 or close

    // Round to nearest power of 2
    const fftSize = Math.pow(2, Math.round(Math.log2(size)));

    // Rasterize mask
    const mask = rasterizeMask(fftSize, params, shapes);

    // Perform 2D FFT via row-then-column approach
    const fft = new FFT(fftSize);

    // Row-wise FFT
    const rowResult = new Float64Array(fftSize * fftSize * 2); // complex array
    const rowIn = fft.createComplexArray();
    const rowOut = fft.createComplexArray();

    for (let y = 0; y < fftSize; y++) {
        // Fill complex input for this row
        for (let x = 0; x < fftSize; x++) {
            rowIn[x * 2] = mask[y * fftSize + x];
            rowIn[x * 2 + 1] = 0;
        }
        fft.transform(rowOut, rowIn);
        // Store result
        for (let x = 0; x < fftSize; x++) {
            rowResult[(y * fftSize + x) * 2] = rowOut[x * 2];
            rowResult[(y * fftSize + x) * 2 + 1] = rowOut[x * 2 + 1];
        }
    }

    // Column-wise FFT
    const power = new Float64Array(fftSize * fftSize);
    const colIn = fft.createComplexArray();
    const colOut = fft.createComplexArray();

    for (let x = 0; x < fftSize; x++) {
        for (let y = 0; y < fftSize; y++) {
            colIn[y * 2] = rowResult[(y * fftSize + x) * 2];
            colIn[y * 2 + 1] = rowResult[(y * fftSize + x) * 2 + 1];
        }
        fft.transform(colOut, colIn);
        for (let y = 0; y < fftSize; y++) {
            const re = colOut[y * 2];
            const im = colOut[y * 2 + 1];
            power[y * fftSize + x] = re * re + im * im;
        }
    }

    // FFT-shift: swap quadrants so DC is in center
    const shifted = new Float64Array(fftSize * fftSize);
    const half = fftSize >> 1;
    for (let y = 0; y < fftSize; y++) {
        for (let x = 0; x < fftSize; x++) {
            const sy = (y + half) % fftSize;
            const sx = (x + half) % fftSize;
            shifted[y * fftSize + x] = power[sy * fftSize + sx];
        }
    }

    // Polychromatic Spatial Resampling
    // We sample the base FFT at different scales to represent different wavelengths
    const rgbBuffer = new Float32Array(fftSize * fftSize * 3);
    const LAMBDA_REF = 550; // Reference wavelength (Greenish-yellow)
    const MIN_LAMBDA = 400; // Deep blue/violet
    const MAX_LAMBDA = 700; // Deep red
    const LAMBDA_STEPS = 21; // Enough to cover spectrum smoothly
    const LAMBDA_STEP = (MAX_LAMBDA - MIN_LAMBDA) / (LAMBDA_STEPS - 1);

    const cx = half;
    const cy = half;

    // Optical zoom multiplier to crop into the center of the high-res FFT
    const ZOOM = 1.5;

    function sampleBilinear(xRef: number, yRef: number): number {
        if (xRef < 0 || xRef >= fftSize - 1 || yRef < 0 || yRef >= fftSize - 1) return 0;
        const x0 = Math.floor(xRef);
        const y0 = Math.floor(yRef);
        const dx = xRef - x0;
        const dy = yRef - y0;

        const v00 = shifted[y0 * fftSize + x0];
        const v10 = shifted[y0 * fftSize + x0 + 1];
        const v01 = shifted[(y0 + 1) * fftSize + x0];
        const v11 = shifted[(y0 + 1) * fftSize + x0 + 1];

        return v00 * (1 - dx) * (1 - dy) +
            v10 * dx * (1 - dy) +
            v01 * (1 - dx) * dy +
            v11 * dx * dy;
    }

    for (let step = 0; step < LAMBDA_STEPS; step++) {
        const lambda = MIN_LAMBDA + step * LAMBDA_STEP;
        const [r, g, b] = wavelengthToRGB(lambda);

        // Diffraction spread scales linearly with wavelength, combined with our zoom
        const scale = (lambda / LAMBDA_REF) * ZOOM;

        for (let y = 0; y < fftSize; y++) {
            const dy = y - cy;
            const yRef = cy + dy / scale;

            for (let x = 0; x < fftSize; x++) {
                const dx = x - cx;
                const xRef = cx + dx / scale;

                const val = sampleBilinear(xRef, yRef);
                const idx = (y * fftSize + x) * 3;
                rgbBuffer[idx] += val * r;
                rgbBuffer[idx + 1] += val * g;
                rgbBuffer[idx + 2] += val * b;
            }
        }
    }

    // Find max value in rgbBuffer for normalization (which will be at the DC center pixel)
    let maxVal = 0;
    for (let i = 0; i < rgbBuffer.length; i++) {
        if (rgbBuffer[i] > maxVal) maxVal = rgbBuffer[i];
    }
    if (maxVal === 0) maxVal = 1;

    // Log-scale and map to RGB image data
    const imgData = new ImageData(fftSize, fftSize);
    const dynamicRange = 10000; // High dynamic range for faint spike visibility

    for (let i = 0; i < fftSize * fftSize; i++) {
        const idx3 = i * 3;
        const idx4 = i * 4;

        let rNorm = rgbBuffer[idx3] / maxVal;
        let gNorm = rgbBuffer[idx3 + 1] / maxVal;
        let bNorm = rgbBuffer[idx3 + 2] / maxVal;

        // Preserve hue while compressing massive dynamic range
        // Using the max of RGB as the luminance value for the log scaling
        const lumNorm = Math.max(rNorm, gNorm, bNorm);
        if (lumNorm > 0) {
            const logLum = Math.log(1 + dynamicRange * lumNorm) / Math.log(1 + dynamicRange);
            const scale = logLum / lumNorm;

            // Multiply by 1.2 to slightly boost saturation of faint spikes
            rNorm = Math.min(1, rNorm * scale * 1.2);
            gNorm = Math.min(1, gNorm * scale * 1.2);
            bNorm = Math.min(1, bNorm * scale * 1.2);
        }

        imgData.data[idx4] = Math.floor(Math.min(1, rNorm) * 255);
        imgData.data[idx4 + 1] = Math.floor(Math.min(1, gNorm) * 255);
        imgData.data[idx4 + 2] = Math.floor(Math.min(1, bNorm) * 255);
        imgData.data[idx4 + 3] = 255;
    }

    // If fftSize != width, we'd need to resize, but for now assume they match
    return imgData;
}
