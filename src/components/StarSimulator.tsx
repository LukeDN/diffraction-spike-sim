import { useRef, useEffect, useMemo, useState } from 'react';
import type { MaskParams } from '../App';
import type { AnyShape } from '../types/shapes';
import { renderStar } from '../lib/starRenderer';
import { renderFFTPSF } from '../lib/fftRenderer';

interface Props {
    params: MaskParams;
    shapes: AnyShape[];
}

// Generate static random stars once per session so they don't flicker on re-render
function useStarField(count: number, width: number, height: number) {
    return useMemo(() => {
        const stars = [];
        for (let i = 0; i < count; i++) {
            stars.push({
                x: Math.random() * width,
                y: Math.random() * height,
                radius: Math.random() * 1.5 + 0.2, // Tiny to medium faint dots
                alpha: Math.random() * 0.8 + 0.1,  // Varied opacity
                color: Math.random() > 0.8 ? '#aaccff' : Math.random() > 0.6 ? '#ffccaa' : '#ffffff', // Slight color var
            });
        }
        return stars;
    }, [count, width, height]);
}

export function StarSimulator({ params, shapes }: Props) {
    const starCanvasRef = useRef<HTMLCanvasElement>(null);
    const bgCanvasRef = useRef<HTMLCanvasElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const [containerSize, setContainerSize] = useState({ width: 1000, height: 1000 });

    // Measure the container to generate enough background stars
    useEffect(() => {
        if (!containerRef.current) return;
        const resizeObserver = new ResizeObserver(entries => {
            for (let entry of entries) {
                const { width, height } = entry.contentRect;
                if (width > 0 && height > 0) {
                    setContainerSize({ width, height });
                }
            }
        });
        resizeObserver.observe(containerRef.current);
        return () => resizeObserver.disconnect();
    }, []);

    // Generate background stars over the whole measured area (density approx 1 star per 2500 px^2)
    const starCount = Math.floor((containerSize.width * containerSize.height) / 2500);
    const backgroundStars = useStarField(starCount, containerSize.width, containerSize.height);

    // Draw Background Frame
    useEffect(() => {
        const canvas = bgCanvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d', { alpha: false });
        if (!ctx) return;

        // Match internal resolution to display size for sharp stars
        canvas.width = containerSize.width;
        canvas.height = containerSize.height;

        ctx.fillStyle = '#000000';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        for (const s of backgroundStars) {
            ctx.beginPath();
            ctx.arc(s.x, s.y, s.radius, 0, Math.PI * 2);
            ctx.fillStyle = s.color;
            ctx.globalAlpha = s.alpha;
            ctx.fill();
        }
        ctx.globalAlpha = 1.0;
    }, [backgroundStars, containerSize]);

    // Draw Main Diffracted Star (Fixed at 512x512)
    useEffect(() => {
        const canvas = starCanvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const width = canvas.width;
        const height = canvas.height;

        const mode = params.simulationMode || 'analytical';
        let imgData: ImageData;

        if (mode === 'fft') {
            imgData = renderFFTPSF(width, height, params, shapes);
        } else {
            imgData = renderStar(width, height, params, shapes);
        }

        ctx.clearRect(0, 0, width, height);
        ctx.putImageData(imgData, 0, 0);
    }, [params, shapes]);

    return (
        <div ref={containerRef} className="relative w-full h-full bg-black overflow-hidden flex items-center justify-center">
            {/* Background Canvas filling the entire frame */}
            <canvas
                ref={bgCanvasRef}
                className="absolute top-0 left-0 w-full h-full object-cover"
            />

            {/* Main Star Canvas centered (using CSS blend mode to overlay) */}
            <canvas
                ref={starCanvasRef}
                width={512}
                height={512}
                className="relative z-10 max-h-[95%] max-w-[95%] object-contain mix-blend-screen"
            />
        </div>
    );
}
