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

// Generate STL blob
export function exportSTL(params: MaskParams, shapes: AnyShape[]): string {
    const outerDiameter = params.apertureDiameter + 20;
    const rOuter = outerDiameter / 2;
    const rAperture = params.apertureDiameter / 2;

    // We build the positive solid using CSG or planar shapes
    const shape = new THREE.Shape();
    // Outer rim: A circle
    shape.absarc(0, 0, rOuter, 0, Math.PI * 2, false);

    // The hole is the aperture
    const holePath = new THREE.Path();
    holePath.absarc(0, 0, rAperture, 0, Math.PI * 2, true);
    shape.holes.push(holePath);

    // We extrude this outer ring
    const extrudeSettings = { depth: 2, bevelEnabled: false }; // 2mm thick
    const geometryRing = new THREE.ExtrudeGeometry(shape, extrudeSettings);

    // Now we create the central hub and vanes as separate meshes, and merge them
    const materials = new THREE.MeshBasicMaterial();
    const ringMesh = new THREE.Mesh(geometryRing, materials);

    const scene = new THREE.Scene();
    scene.add(ringMesh);

    shapes.forEach(shape => {
        const offsetX = shape.x - 200;
        // In ThreeJS space, Y is up, but canvas Y is down. We must invert Y.
        const offsetY = -(shape.y - 200);

        if (shape.type === 'rectangle') {
            const shapeRect = new THREE.Shape();
            shapeRect.moveTo(-shape.width / 2, -shape.height / 2);
            shapeRect.lineTo(shape.width / 2, -shape.height / 2);
            shapeRect.lineTo(shape.width / 2, shape.height / 2);
            shapeRect.lineTo(-shape.width / 2, shape.height / 2);
            shapeRect.lineTo(-shape.width / 2, -shape.height / 2);

            const geometryRect = new THREE.ExtrudeGeometry(shapeRect, extrudeSettings);
            const meshRect = new THREE.Mesh(geometryRect, materials);
            meshRect.position.set(offsetX, offsetY, 0);
            // Rotation in canvas is clockwise around Z, in ThreeJS it's counter-clockwise
            meshRect.rotation.z = -shape.rotation * Math.PI / 180;
            scene.add(meshRect);

        } else if (shape.type === 'wavy') {
            // simplified to rectangle for STL as well for now
            const shapeRect = new THREE.Shape();
            shapeRect.moveTo(0, -shape.thickness / 2);
            shapeRect.lineTo(shape.length, -shape.thickness / 2);
            shapeRect.lineTo(shape.length, shape.thickness / 2);
            shapeRect.lineTo(0, shape.thickness / 2);
            shapeRect.lineTo(0, -shape.thickness / 2);
            const geometryRect = new THREE.ExtrudeGeometry(shapeRect, extrudeSettings);
            const meshRect = new THREE.Mesh(geometryRect, materials);
            meshRect.position.set(offsetX, offsetY, 0);
            meshRect.rotation.z = -shape.rotation * Math.PI / 180;
            scene.add(meshRect);

        } else if (shape.type === 'gratingSector') {
            // Generate extruded bars within sector bounds
            const gAngleRad = (shape.gratingAngle * Math.PI) / 180;
            const pitch = shape.slitWidth + shape.barWidth;
            const span = rAperture * 2 + 20;
            const numBars = Math.ceil(span / pitch) + 1;

            for (let i = -numBars; i <= numBars; i++) {
                const barOffset = i * pitch;
                const barShape = new THREE.Shape();
                barShape.moveTo(-shape.barWidth / 2, -span / 2);
                barShape.lineTo(shape.barWidth / 2, -span / 2);
                barShape.lineTo(shape.barWidth / 2, span / 2);
                barShape.lineTo(-shape.barWidth / 2, span / 2);
                barShape.lineTo(-shape.barWidth / 2, -span / 2);
                const barGeo = new THREE.ExtrudeGeometry(barShape, extrudeSettings);
                const barMesh = new THREE.Mesh(barGeo, materials);
                barMesh.position.set(
                    barOffset * Math.cos(gAngleRad),
                    barOffset * Math.sin(gAngleRad),
                    0
                );
                barMesh.rotation.z = gAngleRad;
                scene.add(barMesh);
            }
        }
    });


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
