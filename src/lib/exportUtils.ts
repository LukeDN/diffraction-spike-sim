import * as THREE from 'three';
import { STLExporter } from 'three/examples/jsm/exporters/STLExporter.js';
import type { MaskParams } from '../App';
import type { AnyShape } from '../types/shapes';

// Generate raw SVG string
export function exportSVG(params: MaskParams, shapes: AnyShape[]): string {
    const outerDiameter = params.apertureDiameter + 20; // 10mm outer rim
    const rOuter = outerDiameter / 2;
    const rAperture = params.apertureDiameter / 2;

    // Add custom shapes as black (they block light)
    // Our SVG mask uses WHITE to let light through and BLACK to block it.
    // Wait, in the SVG:
    // Mask background is white (lets light through everywhere)
    // Central aperture hole is cut out using black?
    // Actually, let's rebuild the SVG mask logic to match the simulator perfectly:
    // 1. Black background (blocks everywhere)
    // 2. White circle (Aperture, lets light through)
    // 3. Black shapes (Obstructions, blocks light)

    let svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="-${rOuter} -${rOuter} ${outerDiameter} ${outerDiameter}" width="${outerDiameter}mm" height="${outerDiameter}mm">\n`;
    svg += `<defs><mask id="apertureMask">\n`;
    svg += `<rect x="-${rOuter}" y="-${rOuter}" width="${outerDiameter}" height="${outerDiameter}" fill="black" />\n`;
    svg += `<circle cx="0" cy="0" r="${rAperture}" fill="white" />\n`;

    shapes.forEach((shape, index) => {
        const offsetX = shape.x - 200; // Map 400x400 canvas to -200..200 origin
        const offsetY = shape.y - 200;

        if (shape.type === 'rectangle') {
            svg += `<g transform="translate(${offsetX}, ${offsetY}) rotate(${shape.rotation})">
                    <rect x="${-shape.width / 2}" y="${-shape.height / 2}" width="${shape.width}" height="${shape.height}" fill="black" />
                  </g>\n`;
        } else if (shape.type === 'wavy') {
            // Wavy export... for now just a thick line
            svg += `<g transform="translate(${offsetX}, ${offsetY}) rotate(${shape.rotation})">
                    <rect x="0" y="${-shape.thickness / 2}" width="${shape.length}" height="${shape.thickness}" fill="black" />
                  </g>\n`;
        } else if (shape.type === 'gratingSector') {
            const clipId = `grating-clip-${index}`;
            const outerR = rAperture;
            const innerR = shape.innerRadius;
            const startRad = (shape.sectorStartAngle * Math.PI) / 180;
            const endRad = (shape.sectorEndAngle * Math.PI) / 180;

            // Build sector arc path
            const x1o = Math.cos(startRad) * outerR;
            const y1o = Math.sin(startRad) * outerR;
            const x2o = Math.cos(endRad) * outerR;
            const y2o = Math.sin(endRad) * outerR;
            const largeArc = (shape.sectorEndAngle - shape.sectorStartAngle) > 180 ? 1 : 0;

            let sectorPath: string;
            if (innerR > 0) {
                const x1i = Math.cos(endRad) * innerR;
                const y1i = Math.sin(endRad) * innerR;
                const x2i = Math.cos(startRad) * innerR;
                const y2i = Math.sin(startRad) * innerR;
                sectorPath = `M ${x1o} ${y1o} A ${outerR} ${outerR} 0 ${largeArc} 1 ${x2o} ${y2o} L ${x1i} ${y1i} A ${innerR} ${innerR} 0 ${largeArc} 0 ${x2i} ${y2i} Z`;
            } else {
                sectorPath = `M 0 0 L ${x1o} ${y1o} A ${outerR} ${outerR} 0 ${largeArc} 1 ${x2o} ${y2o} Z`;
            }

            svg += `<defs><clipPath id="${clipId}"><path d="${sectorPath}" /></clipPath></defs>\n`;
            svg += `<g clip-path="url(#${clipId})">\n`;

            // Draw bars
            const gAngleRad = (shape.gratingAngle * Math.PI) / 180;
            const pitch = shape.slitWidth + shape.barWidth;
            const span = rAperture * 2 + 20;
            const numBars = Math.ceil(span / pitch) + 1;
            const cosG = Math.cos(gAngleRad);
            const sinG = Math.sin(gAngleRad);

            for (let i = -numBars; i <= numBars; i++) {
                const barOffset = i * pitch;
                const cx = barOffset * cosG;
                const cy = barOffset * sinG;
                svg += `<g transform="translate(${cx}, ${cy}) rotate(${shape.gratingAngle})">
                    <rect x="${-shape.barWidth / 2}" y="${-span / 2}" width="${shape.barWidth}" height="${span}" fill="black" />
                  </g>\n`;
            }
            svg += `</g>\n`;
        }
    });

    // Obstruction
    const obs = params.obstruction;
    if (obs && obs.enabled) {
        if (obs.style === 'filled') {
            svg += `<circle cx="0" cy="0" r="${obs.startRadius}" fill="black" />\n`;
        }
        for (let ring = (obs.style === 'filled' ? 1 : 0); ring < obs.ringCount; ring++) {
            const r = obs.startRadius + ring * obs.ringSpacing;
            svg += `<circle cx="0" cy="0" r="${r}" fill="none" stroke="black" stroke-width="${obs.ringThickness}" />\n`;
        }
    }

    svg += `</mask></defs>\n`;
    svg += `<circle cx="0" cy="0" r="${rOuter}" fill="black" mask="url(#apertureMask)" />\n`;
    svg += `</svg>`;

    return svg;
}

/**
 * Build a sector arc path as an array of 2D points [x,y].
 * Center at (0,0), from startAngle to endAngle (radians), with optional inner radius.
 */
function buildSectorPoints(
    outerR: number,
    innerR: number,
    startRad: number,
    endRad: number,
    arcSegments = 64,
): [number, number][] {
    const pts: [number, number][] = [];
    const sweep = endRad - startRad;

    if (innerR > 0) {
        // Outer arc
        for (let i = 0; i <= arcSegments; i++) {
            const a = startRad + (i / arcSegments) * sweep;
            pts.push([Math.cos(a) * outerR, Math.sin(a) * outerR]);
        }
        // Inner arc (reverse)
        for (let i = arcSegments; i >= 0; i--) {
            const a = startRad + (i / arcSegments) * sweep;
            pts.push([Math.cos(a) * innerR, Math.sin(a) * innerR]);
        }
    } else {
        pts.push([0, 0]);
        for (let i = 0; i <= arcSegments; i++) {
            const a = startRad + (i / arcSegments) * sweep;
            pts.push([Math.cos(a) * outerR, Math.sin(a) * outerR]);
        }
    }
    return pts;
}

/**
 * Sutherland–Hodgman polygon clipping.
 * Clips `subjectPoly` against the convex-ish polygon `clipPoly`.
 * For our sector arcs (which aren't strictly convex when >180°), we approximate.
 * Both polygons are arrays of [x, y].
 */
function clipPolygon(subjectPoly: [number, number][], clipPoly: [number, number][]): [number, number][] {
    let output = [...subjectPoly];

    for (let i = 0; i < clipPoly.length; i++) {
        if (output.length === 0) return [];
        const edgeStart = clipPoly[i];
        const edgeEnd = clipPoly[(i + 1) % clipPoly.length];
        const input = output;
        output = [];

        for (let j = 0; j < input.length; j++) {
            const current = input[j];
            const prev = input[(j + input.length - 1) % input.length];
            const currInside = isInside(current, edgeStart, edgeEnd);
            const prevInside = isInside(prev, edgeStart, edgeEnd);

            if (currInside) {
                if (!prevInside) {
                    const inter = lineIntersect(prev, current, edgeStart, edgeEnd);
                    if (inter) output.push(inter);
                }
                output.push(current);
            } else if (prevInside) {
                const inter = lineIntersect(prev, current, edgeStart, edgeEnd);
                if (inter) output.push(inter);
            }
        }
    }
    return output;
}

function isInside(pt: [number, number], edgeA: [number, number], edgeB: [number, number]): boolean {
    return (edgeB[0] - edgeA[0]) * (pt[1] - edgeA[1]) - (edgeB[1] - edgeA[1]) * (pt[0] - edgeA[0]) >= 0;
}

function lineIntersect(
    p1: [number, number], p2: [number, number],
    p3: [number, number], p4: [number, number],
): [number, number] | null {
    const d1x = p2[0] - p1[0], d1y = p2[1] - p1[1];
    const d2x = p4[0] - p3[0], d2y = p4[1] - p3[1];
    const denom = d1x * d2y - d1y * d2x;
    if (Math.abs(denom) < 1e-10) return null;
    const t = ((p3[0] - p1[0]) * d2y - (p3[1] - p1[1]) * d2x) / denom;
    return [p1[0] + t * d1x, p1[1] + t * d1y];
}

/**
 * Clip a rectangular bar polygon to a circular boundary (approximate with polygon).
 * Returns the clipped polygon points, or empty array if no overlap.
 */
function clipToCircle(rectPts: [number, number][], radius: number, circleSegments = 64): [number, number][] {
    // Approximate circle as polygon
    const circlePoly: [number, number][] = [];
    for (let i = 0; i < circleSegments; i++) {
        const a = (i / circleSegments) * Math.PI * 2;
        circlePoly.push([Math.cos(a) * radius, Math.sin(a) * radius]);
    }
    return clipPolygon(rectPts, circlePoly);
}

// Generate STL blob
export function exportSTL(params: MaskParams, shapes: AnyShape[]): string {
    const outerDiameter = params.apertureDiameter + 20;
    const rOuter = outerDiameter / 2;
    const rAperture = params.apertureDiameter / 2;

    // Scale factor: canvas is always 400px, map to physical mm
    const scale = params.apertureDiameter / 400;

    // Outer rim ring
    const rimShape = new THREE.Shape();
    rimShape.absarc(0, 0, rOuter, 0, Math.PI * 2, false);
    const holePath = new THREE.Path();
    holePath.absarc(0, 0, rAperture, 0, Math.PI * 2, true);
    rimShape.holes.push(holePath);

    const extrudeSettings = { depth: 2, bevelEnabled: false }; // 2mm thick
    const materials = new THREE.MeshBasicMaterial();
    const scene = new THREE.Scene();

    const ringMesh = new THREE.Mesh(new THREE.ExtrudeGeometry(rimShape, extrudeSettings), materials);
    scene.add(ringMesh);

    shapes.forEach(s => {
        // FIX #1: Scale positions from canvas-pixel space (0-400, center 200) to mm space
        const offsetX = (s.x - 200) * scale;
        const offsetY = -(s.y - 200) * scale; // Y inverted for ThreeJS

        if (s.type === 'rectangle') {
            // FIX #1: Scale dimensions too
            const w = s.width * scale;
            const h = s.height * scale;

            const rectShape = new THREE.Shape();
            rectShape.moveTo(-w / 2, -h / 2);
            rectShape.lineTo(w / 2, -h / 2);
            rectShape.lineTo(w / 2, h / 2);
            rectShape.lineTo(-w / 2, h / 2);
            rectShape.lineTo(-w / 2, -h / 2);

            const mesh = new THREE.Mesh(new THREE.ExtrudeGeometry(rectShape, extrudeSettings), materials);
            mesh.position.set(offsetX, offsetY, 0);
            mesh.rotation.z = -s.rotation * Math.PI / 180;
            scene.add(mesh);

        } else if (s.type === 'wavy') {
            // FIX #5: Generate actual sinusoidal wavy shape instead of flat rectangle
            const W = s.length * scale;
            const A = s.amplitude * scale;
            const F = s.frequency;
            const T = s.thickness * scale;
            const steps = Math.max(100, Math.ceil(W));

            const wavyShape = new THREE.Shape();

            // Top edge (left to right)
            for (let i = 0; i <= steps; i++) {
                const xPos = -W / 2 + (i / steps) * W;
                const yOffset = Math.sin((i / steps) * Math.PI * 2 * F) * A;
                if (i === 0) wavyShape.moveTo(xPos, yOffset - T / 2);
                else wavyShape.lineTo(xPos, yOffset - T / 2);
            }
            // Bottom edge (right to left)
            for (let i = steps; i >= 0; i--) {
                const xPos = -W / 2 + (i / steps) * W;
                const yOffset = Math.sin((i / steps) * Math.PI * 2 * F) * A;
                wavyShape.lineTo(xPos, yOffset + T / 2);
            }
            wavyShape.closePath();

            const mesh = new THREE.Mesh(new THREE.ExtrudeGeometry(wavyShape, extrudeSettings), materials);
            mesh.position.set(offsetX, offsetY, 0);
            mesh.rotation.z = -s.rotation * Math.PI / 180;
            scene.add(mesh);

        } else if (s.type === 'gratingSector') {
            // FIX #3 & #4: Clip bars to sector arc shape & fix offset axis
            const gAngleRad = (s.gratingAngle * Math.PI) / 180;
            const pitch = s.slitWidth + s.barWidth;
            const span = rAperture * 2 + 20;
            const numBars = Math.ceil(span / pitch) + 1;

            const startRad = (s.sectorStartAngle * Math.PI) / 180;
            const endRad = (s.sectorEndAngle * Math.PI) / 180;

            // Build sector polygon for clipping (in aperture mm space, centered at 0,0)
            const sectorPts = buildSectorPoints(rAperture, s.innerRadius, startRad, endRad);

            // FIX #4: perpendicular to grating angle for bar spacing
            const perpX = -Math.sin(gAngleRad);
            const perpY = Math.cos(gAngleRad);
            // Along grating angle for bar length direction
            const alongX = Math.cos(gAngleRad);
            const alongY = Math.sin(gAngleRad);

            for (let i = -numBars; i <= numBars; i++) {
                const barOffset = i * pitch;
                // Bar center position: offset perpendicular to grating angle
                const cx = barOffset * perpX;
                const cy = barOffset * perpY;

                // Build bar rectangle corners in world space
                const hw = s.barWidth / 2;
                const hl = span / 2;
                const barRect: [number, number][] = [
                    [cx - alongX * hl - perpX * hw, cy - alongY * hl - perpY * hw],
                    [cx + alongX * hl - perpX * hw, cy + alongY * hl - perpY * hw],
                    [cx + alongX * hl + perpX * hw, cy + alongY * hl + perpY * hw],
                    [cx - alongX * hl + perpX * hw, cy - alongY * hl + perpY * hw],
                ];

                // FIX #3: Clip bar to sector boundary
                let clipped = clipPolygon(barRect, sectorPts);
                if (clipped.length < 3) continue;

                // Also clip to aperture circle
                clipped = clipToCircle(clipped, rAperture);
                if (clipped.length < 3) continue;

                // Build THREE.Shape from clipped polygon
                const barShape = new THREE.Shape();
                barShape.moveTo(clipped[0][0], clipped[0][1]);
                for (let j = 1; j < clipped.length; j++) {
                    barShape.lineTo(clipped[j][0], clipped[j][1]);
                }
                barShape.closePath();

                const barGeo = new THREE.ExtrudeGeometry(barShape, extrudeSettings);
                const barMesh = new THREE.Mesh(barGeo, materials);
                scene.add(barMesh);
            }
        }
    });

    // FIX #2: Export obstruction geometry
    const obs = params.obstruction;
    if (obs.enabled) {
        if (obs.style === 'filled') {
            // Filled central disk
            const diskShape = new THREE.Shape();
            diskShape.absarc(0, 0, obs.startRadius, 0, Math.PI * 2, false);
            const diskMesh = new THREE.Mesh(new THREE.ExtrudeGeometry(diskShape, extrudeSettings), materials);
            scene.add(diskMesh);
        }

        // Additional rings (annuli)
        for (let ring = (obs.style === 'filled' ? 1 : 0); ring < obs.ringCount; ring++) {
            const r = obs.startRadius + ring * obs.ringSpacing;
            const ringOuter = r + obs.ringThickness / 2;
            const ringInner = Math.max(0, r - obs.ringThickness / 2);

            const annulusShape = new THREE.Shape();
            annulusShape.absarc(0, 0, ringOuter, 0, Math.PI * 2, false);
            const innerHole = new THREE.Path();
            innerHole.absarc(0, 0, ringInner, 0, Math.PI * 2, true);
            annulusShape.holes.push(innerHole);

            const annulusMesh = new THREE.Mesh(new THREE.ExtrudeGeometry(annulusShape, extrudeSettings), materials);
            scene.add(annulusMesh);
        }
    }

    const exporter = new STLExporter();
    const stlString = exporter.parse(scene);
    return stlString;
}

export function downloadFile(content: string, filename: string, mimeType: string) {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}
