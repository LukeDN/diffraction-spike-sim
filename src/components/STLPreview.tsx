import { useRef, useEffect } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import type { MaskParams } from '../App';
import type { AnyShape } from '../types/shapes';
import { buildMaskScene } from '../lib/exportUtils';

interface Props {
    params: MaskParams;
    shapes: AnyShape[];
    thickness?: number;
}

export function STLPreview({ params, shapes, thickness = 2 }: Props) {
    const containerRef = useRef<HTMLDivElement>(null);
    const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
    const controlsRef = useRef<OrbitControls | null>(null);
    const frameRef = useRef<number>(0);

    useEffect(() => {
        const container = containerRef.current;
        if (!container) return;

        // Setup renderer
        const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
        renderer.setPixelRatio(window.devicePixelRatio);
        renderer.setClearColor(0x000000, 0);
        container.appendChild(renderer.domElement);
        rendererRef.current = renderer;

        // Camera
        const camera = new THREE.PerspectiveCamera(35, 1, 1, 2000);
        camera.position.set(0, 0, 500);
        camera.lookAt(0, 0, 0);

        // Controls
        const controls = new OrbitControls(camera, renderer.domElement);
        controls.enableDamping = true;
        controls.dampingFactor = 0.08;
        controls.minDistance = 100;
        controls.maxDistance = 1200;
        controlsRef.current = controls;

        // Resize handling
        const resize = () => {
            const w = container.clientWidth;
            const h = container.clientHeight;
            camera.aspect = w / h;
            camera.updateProjectionMatrix();
            renderer.setSize(w, h);
        };
        const ro = new ResizeObserver(resize);
        ro.observe(container);
        resize();

        // Build scene
        const scene = buildMaskScene(params, shapes, thickness);

        // Add lights
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
        scene.add(ambientLight);
        const dirLight = new THREE.DirectionalLight(0xffffff, 0.8);
        dirLight.position.set(200, 300, 400);
        scene.add(dirLight);
        const dirLight2 = new THREE.DirectionalLight(0x8899cc, 0.3);
        dirLight2.position.set(-200, -100, 300);
        scene.add(dirLight2);

        // Animation loop
        const animate = () => {
            frameRef.current = requestAnimationFrame(animate);
            controls.update();
            renderer.render(scene, camera);
        };
        animate();

        return () => {
            cancelAnimationFrame(frameRef.current);
            controls.dispose();
            renderer.dispose();
            ro.disconnect();
            if (container.contains(renderer.domElement)) {
                container.removeChild(renderer.domElement);
            }
        };
    }, [params, shapes, thickness]);

    return (
        <div
            ref={containerRef}
            className="w-full h-full"
            style={{ cursor: 'grab' }}
        />
    );
}
