import { useRef, useEffect } from 'react';
import type { MaskParams } from '../App';
import type { AnyShape } from '../types/shapes';
import { renderStar } from '../lib/starRenderer';

interface Props {
    params: MaskParams;
    shapes: AnyShape[];
}

export function StarSimulator({ params, shapes }: Props) {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const width = canvas.width;
        const height = canvas.height;

        const imgData = renderStar(width, height, params, shapes);
        ctx.putImageData(imgData, 0, 0);
    }, [params, shapes]);

    return (
        <div className="w-full h-full flex items-center justify-center bg-black">
            <canvas
                ref={canvasRef}
                width={512}
                height={512}
                className="max-h-[95%] max-w-[95%] object-contain"
            />
        </div>
    );
}
