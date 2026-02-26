import { Lightbulb, Ruler, Waves, Paintbrush, Download, Share2, Box, Image as ImageIcon } from 'lucide-react';

interface ConceptCardProps {
    icon: React.ReactNode;
    title: string;
    children: React.ReactNode;
}

function ConceptCard({ icon, title, children }: ConceptCardProps) {
    return (
        <div className="rounded-xl p-5" style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-subtle)' }}>
            <div className="flex items-center gap-2 mb-3">
                <span style={{ color: 'var(--text-accent)' }}>{icon}</span>
                <h3 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>{title}</h3>
            </div>
            <div className="text-[12px] leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                {children}
            </div>
        </div>
    );
}

export function LearnPage() {
    return (
        <div className="p-8 max-w-4xl mx-auto space-y-8">
            <div>
                <h1 className="text-2xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>
                    Documentation & Capabilities
                </h1>
                <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                    A comprehensive guide to designing aperture masks, running simulations, and exporting for fabrication.
                </p>
            </div>

            <div className="grid gap-5">
                {/* Simulation Engine */}
                <ConceptCard icon={<Waves size={18} />} title="The Simulation Engine">
                    <p className="mb-4">The core of the app is its dual-mode optical simulation engine, instantly rendering the Point Spread Function (PSF) of your mask design.</p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="p-3 rounded-lg" style={{ backgroundColor: 'var(--bg-panel)' }}>
                            <h4 className="text-[11px] font-semibold mb-1.5 flex items-center gap-1" style={{ color: 'var(--text-accent)' }}>
                                <Lightbulb size={12} /> Analytical Mode (Fast)
                            </h4>
                            <p className="text-[11px] mb-2">
                                Uses high-speed geometric approximations to calculate spike intensity and angular spread. Great for quickly testing spider vane layouts.
                            </p>
                            <ul className="text-[11px] list-disc list-inside opacity-80 space-y-0.5">
                                <li>Instant, 60fps responsiveness</li>
                                <li>Simulates chromatic spectral bands</li>
                                <li>Ideal for primary layout design</li>
                            </ul>
                        </div>
                        <div className="p-3 rounded-lg" style={{ backgroundColor: 'var(--bg-panel)' }}>
                            <h4 className="text-[11px] font-semibold mb-1.5 flex items-center gap-1" style={{ color: 'var(--text-accent)' }}>
                                <Waves size={12} /> FFT Physical Mode (Accurate)
                            </h4>
                            <p className="text-[11px] mb-2">
                                Computes the true 2D Fast Fourier Transform of the aperture. It runs a <strong style={{ color: 'var(--text-primary)' }}>Polychromatic Resampling</strong> algorithm across 21 visible wavelengths.
                            </p>
                            <ul className="text-[11px] list-disc list-inside opacity-80 space-y-0.5">
                                <li>Physically perfect wave interference</li>
                                <li>True RGB rainbow chromatic dispersion</li>
                                <li>Zero-padded for high resolution</li>
                            </ul>
                        </div>
                    </div>
                </ConceptCard>

                {/* Shape Designer */}
                <ConceptCard icon={<Paintbrush size={18} />} title="Mask Designer & Shapes">
                    <p className="mb-4">Build complex masks by combining parametric geometric shapes. All parameters update the live preview instantly.</p>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div className="p-3 rounded-lg" style={{ backgroundColor: 'var(--bg-panel)' }}>
                            <h4 className="text-[11px] font-semibold mb-1" style={{ color: 'var(--text-primary)' }}>Straight Vanes</h4>
                            <p className="text-[11px] opacity-80">Standard rectangle supports. Produces sharp, brilliant diffraction spikes perpendicular to the vane angle. Thicker vanes produce brighter, wider spikes.</p>
                        </div>
                        <div className="p-3 rounded-lg" style={{ backgroundColor: 'var(--bg-panel)' }}>
                            <h4 className="text-[11px] font-semibold mb-1" style={{ color: 'var(--text-primary)' }}>Wavy/Curved Vanes</h4>
                            <p className="text-[11px] opacity-80">Curved spider vanes suppress distinct spikes by spreading the diffraction energy into a wide fan or halo. Configurable by amplitude and frequency.</p>
                        </div>
                        <div className="p-3 rounded-lg" style={{ backgroundColor: 'var(--bg-panel)' }}>
                            <h4 className="text-[11px] font-semibold mb-1" style={{ color: 'var(--text-primary)' }}>Grating Sectors</h4>
                            <p className="text-[11px] opacity-80">Used primarily for Bahtinov focus masks. Fills an angular sector with parallel slits. Parametric slit width, bar width, and central cutout radius.</p>
                        </div>
                    </div>
                    <div className="mt-4 p-3 rounded-lg border border-dashed" style={{ borderColor: 'var(--border-subtle)', backgroundColor: 'var(--bg-app)' }}>
                        <h4 className="text-[11px] font-semibold mb-1" style={{ color: 'var(--text-primary)' }}>Base Aperture & Obstructions</h4>
                        <p className="text-[11px] opacity-80">The foundation of the mask is defined by the Telescope Aperture Diameter (D). You can also add a central obstruction (secondary mirror), which can be filled or hollow (multi-ring) to support complex 3D printed hubs.</p>
                    </div>
                </ConceptCard>

                {/* Fabrication & Exporting */}
                <ConceptCard icon={<Download size={18} />} title="Exporting for Fabrication">
                    <p className="mb-4">The tool is built not just for theory, but to generate digital files you can send straight to a laser cutter or 3D printer.</p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-3">
                            <div className="p-3 border rounded-lg" style={{ borderColor: 'var(--border-subtle)' }}>
                                <h4 className="text-[11px] font-semibold mb-1 flex items-center gap-1" style={{ color: 'var(--text-primary)' }}>
                                    <Box size={14} /> 3D Printing (STL)
                                </h4>
                                <p className="text-[11px] opacity-80 mb-2">Generates a manifold 3D mesh ready for slicing. The mask is extruded to a user-defined thickness (e.g., 2mm).</p>
                                <p className="text-[10px]" style={{ color: 'var(--text-accent)' }}>Includes an interactive WebGL 3D preview in-app.</p>
                            </div>
                            <div className="p-3 border rounded-lg" style={{ borderColor: 'var(--border-subtle)' }}>
                                <h4 className="text-[11px] font-semibold mb-1 flex items-center gap-1" style={{ color: 'var(--text-primary)' }}>
                                    <Ruler size={14} /> Laser Cutting (DXF & SVG)
                                </h4>
                                <p className="text-[11px] opacity-80">Generates precise 2D vector outlines. The DXF export uses exact mm scaling for seamless imports into CAD software or laser control programs.</p>
                            </div>
                        </div>
                        <div className="p-3 bg-opacity-50 rounded-lg flex flex-col justify-center" style={{ backgroundColor: 'var(--bg-app)' }}>
                            <h4 className="text-[11px] font-semibold mb-2 flex items-center gap-1" style={{ color: 'var(--text-primary)' }}>
                                <ImageIcon size={14} /> Image Export (PNG)
                            </h4>
                            <p className="text-[11px] opacity-80">
                                Capture high-resolution, pixel-perfect PNGs of your simulated star. Perfect for astrophotography planning, presentations, or sharing the optical effects of your custom design.
                            </p>
                        </div>
                    </div>
                </ConceptCard>

                {/* Workflow Tools */}
                <ConceptCard icon={<Share2 size={18} />} title="Workflow & Productivity">
                    <p className="mb-3 text-[12px] opacity-80">The interface includes several capabilities to speed up your design process:</p>
                    <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
                        <li className="flex gap-2">
                            <span style={{ color: 'var(--text-accent)' }}>•</span>
                            <span><strong>URL Sharing:</strong> Your entire complex mask design is instantly encoded into the URL. Copy the link to share or bookmark designs.</span>
                        </li>
                        <li className="flex gap-2">
                            <span style={{ color: 'var(--text-accent)' }}>•</span>
                            <span><strong>Undo / Redo:</strong> Full history tracking (Ctrl+Z / Ctrl+Y) prevents accidental data loss when tweaking shapes.</span>
                        </li>
                        <li className="flex gap-2">
                            <span style={{ color: 'var(--text-accent)' }}>•</span>
                            <span><strong>Shape Cloning:</strong> One-click duplication of vanes helps build symmetrical arrays quickly.</span>
                        </li>
                        <li className="flex gap-2">
                            <span style={{ color: 'var(--text-accent)' }}>•</span>
                            <span><strong>Live Annotations:</strong> Toggle the ruler icon to overlay real-time mm dimensions directly on the mask layout visualization.</span>
                        </li>
                    </ul>
                </ConceptCard>

            </div>
        </div>
    );
}
