import { useNavigate } from 'react-router-dom';
import {
    Sparkles, Circle, Target, Waves, Grid3x3, Plus,
    Download, Share2, Undo2, Redo2, Sun, Ruler, Rotate3d,
    Box, FileText, FileCode, Image as ImageIcon, Copy, Trash2,
    ChevronRight, Keyboard, ArrowLeft,
} from 'lucide-react';

/* ────────────────────────────────────────────
   Reusable pieces
   ──────────────────────────────────────────── */

function StepCard({ step, title, icon, children }: {
    step: number; title: string; icon: React.ReactNode; children: React.ReactNode;
}) {
    return (
        <div
            className="rounded-lg overflow-hidden"
            style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-subtle)' }}
        >
            {/* Header */}
            <div
                className="flex items-center gap-3 px-5 py-3"
                style={{ borderBottom: '1px solid var(--border-subtle)' }}
            >
                <span
                    className="flex items-center justify-center w-7 h-7 rounded-md text-xs font-bold"
                    style={{ backgroundColor: 'var(--accent-dim)', color: 'var(--text-accent)', border: '1px solid var(--border-accent)' }}
                >
                    {step}
                </span>
                <span style={{ color: 'var(--text-accent)', opacity: 0.7 }}>{icon}</span>
                <h2 className="text-[13px] font-semibold" style={{ color: 'var(--text-primary)' }}>
                    {title}
                </h2>
            </div>
            {/* Body */}
            <div className="px-5 py-4 space-y-3 text-[12px] leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                {children}
            </div>
        </div>
    );
}

function Kbd({ children }: { children: React.ReactNode }) {
    return (
        <kbd
            className="inline-block px-1.5 py-0.5 rounded text-[10px] font-mono"
            style={{
                backgroundColor: 'var(--bg-panel)',
                border: '1px solid var(--border-default)',
                color: 'var(--text-muted)',
            }}
        >
            {children}
        </kbd>
    );
}

function InlineIcon({ children }: { children: React.ReactNode }) {
    return (
        <span
            className="inline-flex items-center justify-center align-text-bottom mx-0.5"
            style={{ color: 'var(--text-accent)', opacity: 0.8 }}
        >
            {children}
        </span>
    );
}

/* ────────────────────────────────────────────
   Page
   ──────────────────────────────────────────── */

export function LearnPage() {
    const navigate = useNavigate();

    return (
        <div className="p-6 pb-16 max-w-3xl mx-auto space-y-5">

            {/* ── Intro ── */}
            <div className="mb-2">
                <h1 className="text-xl font-bold mb-1.5" style={{ color: 'var(--text-primary)' }}>
                    Getting Started
                </h1>
                <p className="text-[12px] leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                    This tool lets you design telescope aperture masks and see what their
                    diffraction spike pattern looks like in real time. You can adjust the mask,
                    watch the simulated star update instantly, and then export the mask as a
                    file you can send to a laser cutter or 3D printer.
                </p>
                <p className="text-[12px] mt-2 leading-relaxed" style={{ color: 'var(--text-muted)' }}>
                    Below is a walkthrough of every part of the interface. You can read it
                    straight through or jump to whatever section you need.
                </p>
            </div>

            {/* ── Step 1: Presets ── */}
            <StepCard step={1} title="Choosing a Preset" icon={<Sparkles size={15} />}>
                <p>
                    The <strong>Design Preset</strong> section at the top of the left panel
                    gives you several starting points. Clicking one loads a complete mask
                    design — all the vanes, obstruction settings, and aperture size are set
                    for you.
                </p>
                <div
                    className="rounded-md p-3 space-y-1.5 text-[11px]"
                    style={{ backgroundColor: 'var(--bg-panel)', border: '1px solid var(--border-subtle)' }}
                >
                    <div><strong>Blank</strong> — An empty circle with no vanes. Good if you want to build from scratch.</div>
                    <div><strong>Newtonian</strong> — Two crossed vanes at 0° and 90°. This is the classic 4-spike pattern you see in most reflector telescope photos.</div>
                    <div><strong>3 Vane</strong> — Three vanes spaced 120° apart. Produces 6 spikes.</div>
                    <div><strong>Bahtinov</strong> — A focus-aid mask with three sectors of parallel gratings. Used to check if a telescope is in focus.</div>
                    <div><strong>Tri-Bahtinov</strong> — Three independent Bahtinov patterns in a single mask. Used to check both focus and collimation at the same time.</div>
                    <div><strong>Carey (Curved)</strong> — Wavy/curved vanes that spread diffraction energy into a soft halo instead of sharp spikes.</div>
                </div>
                <p style={{ color: 'var(--text-muted)' }}>
                    You can always modify any preset after loading it. Once you change a
                    slider or add/remove a shape, the preset highlight clears and the design
                    becomes fully custom.
                </p>
            </StepCard>

            {/* ── Step 2: Previews ── */}
            <StepCard step={2} title="The Preview Panels" icon={<ImageIcon size={15} />}>
                <p>
                    The right side of the screen is split into two panels stacked vertically:
                </p>
                <div
                    className="rounded-md p-3 space-y-2 text-[11px]"
                    style={{ backgroundColor: 'var(--bg-panel)', border: '1px solid var(--border-subtle)' }}
                >
                    <div>
                        <strong>Top — Aperture Mask</strong><br />
                        Shows the physical mask shape. The bright area is where light passes
                        through; the dark shapes are the vanes and obstructions that block light.
                    </div>
                    <div>
                        <strong>Bottom — Star Simulation</strong><br />
                        Shows what a point-source star would look like through your mask. The
                        spikes, rings, and colors you see here are the diffraction pattern
                        produced by your design.
                    </div>
                </div>
                <p>
                    <strong>Zooming:</strong> Scroll your mouse wheel over either panel to zoom
                    in or out. A small badge appears (e.g. "2.0×") showing the current zoom
                    level. <strong>Double-click</strong> anywhere in the panel to reset the zoom
                    back to 1×.
                </p>
                <p>
                    <strong>Resizing:</strong> The vertical divider between the left panel and
                    the previews can be dragged left or right to give more room to whichever
                    side you need.
                </p>
            </StepCard>

            {/* ── Step 3: Simulation Mode ── */}
            <StepCard step={3} title="Simulation Mode" icon={<Circle size={15} />}>
                <p>
                    Under <strong>Simulation</strong> in the left panel, you'll find a toggle
                    between two rendering modes:
                </p>
                <div
                    className="rounded-md p-3 space-y-2 text-[11px]"
                    style={{ backgroundColor: 'var(--bg-panel)', border: '1px solid var(--border-subtle)' }}
                >
                    <div>
                        <strong>Analytical</strong> — Fast. Updates at 60 fps as you drag
                        sliders. Uses geometric approximations to draw the spike pattern. This
                        is what you should use while you're designing and moving things around.
                    </div>
                    <div>
                        <strong>FFT (Physical)</strong> — Slower but more accurate. Computes the
                        actual wave interference pattern using a Fourier transform across 21
                        wavelengths of visible light. Use this when you want to see the true
                        physics of your mask, including details like secondary rings and
                        realistic color dispersion.
                    </div>
                </div>
                <p>
                    When Analytical mode is selected, a second toggle appears:
                    <strong> Color Style</strong>. "Angular" gives each spike its own color
                    based on its angle. "Longitudinal" colors the spike along its length from
                    blue (near the star) to red (further out), similar to how the James Webb
                    Space Telescope's images look.
                </p>
            </StepCard>

            {/* ── Step 4: Center Obstruction ── */}
            <StepCard step={4} title="Center Obstruction" icon={<Target size={15} />}>
                <p>
                    Most reflecting telescopes have a secondary mirror in the center of the
                    aperture that blocks some light. The <strong>Center Obstruction</strong>{' '}
                    section lets you model this.
                </p>
                <div
                    className="rounded-md p-3 space-y-1.5 text-[11px]"
                    style={{ backgroundColor: 'var(--bg-panel)', border: '1px solid var(--border-subtle)' }}
                >
                    <div><strong>On / Off</strong> — The green pill toggle in the section header enables or disables the obstruction entirely.</div>
                    <div><strong>Filled / Hollow</strong> — "Filled" draws a solid circle (like a typical secondary mirror shadow). "Hollow" draws just a ring outline, which is useful for modeling support structures or multi-ring hubs.</div>
                    <div><strong>Start Radius</strong> — How large the obstruction is, in mm.</div>
                    <div><strong>Ring Count</strong> — Set to 2 or more to add concentric rings. Extra sliders for ring spacing and ring thickness appear automatically when needed.</div>
                </div>
            </StepCard>

            {/* ── Step 5: Elements ── */}
            <StepCard step={5} title="Working with Elements" icon={<Waves size={15} />}>
                <p>
                    The <strong>Elements</strong> section is where you add and edit the
                    individual shapes that make up your mask. Each shape appears as a
                    collapsible card.
                </p>

                {/* Adding */}
                <div className="space-y-1.5">
                    <p className="font-semibold text-[11px]" style={{ color: 'var(--text-primary)' }}>Adding shapes</p>
                    <p className="text-[11px]">
                        Use the small buttons at the top right of the Elements header:
                    </p>
                    <div
                        className="rounded-md p-3 space-y-1 text-[11px]"
                        style={{ backgroundColor: 'var(--bg-panel)', border: '1px solid var(--border-subtle)' }}
                    >
                        <div>
                            <InlineIcon><Plus size={10} /></InlineIcon> <strong>Vane</strong> — Adds a straight rectangular bar. Each new vane is automatically rotated 45° from the last one.
                        </div>
                        <div>
                            <InlineIcon><Plus size={10} /></InlineIcon> <strong>Wavy</strong> — Adds a curved/sinusoidal bar. Has additional amplitude and frequency controls.
                        </div>
                        <div>
                            <InlineIcon><Grid3x3 size={10} /></InlineIcon> <strong>Grating</strong> — Adds a sector filled with parallel slits. Used mainly for Bahtinov-style focusing masks.
                        </div>
                    </div>
                </div>

                {/* Card actions */}
                <div className="space-y-1.5">
                    <p className="font-semibold text-[11px]" style={{ color: 'var(--text-primary)' }}>Shape card actions</p>
                    <p className="text-[11px]">
                        Each shape card has a header row with controls:
                    </p>
                    <div
                        className="rounded-md p-3 space-y-1 text-[11px]"
                        style={{ backgroundColor: 'var(--bg-panel)', border: '1px solid var(--border-subtle)' }}
                    >
                        <div><InlineIcon><ChevronRight size={10} /></InlineIcon> <strong>Arrow</strong> — Click the card header to collapse or expand it.</div>
                        <div><InlineIcon><Copy size={10} /></InlineIcon> <strong>Duplicate</strong> — Creates a copy of the shape, rotated 15° from the original. Useful for building symmetrical patterns quickly.</div>
                        <div><InlineIcon><Trash2 size={10} /></InlineIcon> <strong>Delete</strong> — Removes the shape.</div>
                    </div>
                </div>

                {/* Sliders */}
                <div className="space-y-1.5">
                    <p className="font-semibold text-[11px]" style={{ color: 'var(--text-primary)' }}>Editing values</p>
                    <p className="text-[11px]">
                        Each shape has sliders for its properties (angle, length, thickness,
                        etc.). Two things worth knowing:
                    </p>
                    <ul className="text-[11px] list-disc list-inside space-y-0.5" style={{ color: 'var(--text-muted)' }}>
                        <li>Sliders have small tick marks at common values — the slider snaps gently to nearby ticks as you drag past them.</li>
                        <li><strong>Click the number</strong> next to any slider label to type an exact value directly. Press <Kbd>Enter</Kbd> to confirm or <Kbd>Esc</Kbd> to cancel.</li>
                    </ul>
                </div>

                {/* Shape specifics */}
                <div className="space-y-1.5">
                    <p className="font-semibold text-[11px]" style={{ color: 'var(--text-primary)' }}>Shape types at a glance</p>
                    <div
                        className="rounded-md p-3 space-y-2 text-[11px]"
                        style={{ backgroundColor: 'var(--bg-panel)', border: '1px solid var(--border-subtle)' }}
                    >
                        <div>
                            <strong>Straight Vane</strong> — A rectangle. Controls: X/Y offset
                            (position relative to center), Angle, Length, and Thickness. Produces
                            sharp spikes perpendicular to the vane angle. Thicker vanes = brighter spikes.
                        </div>
                        <div>
                            <strong>Wavy Vane</strong> — A curved bar. Same position/angle/length/thickness
                            controls, plus Amplitude (how far the wave swings) and Frequency (how
                            many wave cycles fit in the vane length). Curved vanes spread
                            diffraction energy into a soft halo rather than sharp spikes.
                        </div>
                        <div>
                            <strong>Grating Sector</strong> — Fills an angular wedge of the
                            aperture with parallel bars and slits. Controls: Sector Start/End
                            angles (what wedge to fill), Grating Angle (orientation of the bars),
                            Slit Width, Bar Width, and Inner Radius (to leave a hole in the center).
                        </div>
                    </div>
                </div>
            </StepCard>

            {/* ── Step 6: Toolbar ── */}
            <StepCard step={6} title="The Toolbar" icon={<Share2 size={15} />}>
                <p>
                    The header bar across the top of the screen has several buttons. Left to right:
                </p>
                <div
                    className="rounded-md p-3 space-y-1.5 text-[11px]"
                    style={{ backgroundColor: 'var(--bg-panel)', border: '1px solid var(--border-subtle)' }}
                >
                    <div>
                        <InlineIcon><Undo2 size={10} /></InlineIcon> <InlineIcon><Redo2 size={10} /></InlineIcon>{' '}
                        <strong>Undo / Redo</strong> — Steps backward or forward through your
                        edit history. Also works with <Kbd>⌘Z</Kbd> / <Kbd>⌘⇧Z</Kbd> (or Ctrl on Windows/Linux).
                    </div>
                    <div>
                        <InlineIcon><Share2 size={10} /></InlineIcon>{' '}
                        <strong>Share</strong> — Copies a URL to your clipboard that encodes
                        your entire mask design. Anyone who opens that link will see exactly
                        what you're seeing. Good for saving designs or sending them to someone.
                    </div>
                    <div>
                        <InlineIcon><Sun size={10} /></InlineIcon>{' '}
                        <strong>Theme</strong> — Switches between dark and light mode. Your
                        preference is saved in the browser.
                    </div>
                    <div>
                        <InlineIcon><Download size={10} /></InlineIcon>{' '}
                        <strong>Export</strong> — Opens the export dropdown (see next step).
                    </div>
                </div>
            </StepCard>

            {/* ── Step 7: Exporting ── */}
            <StepCard step={7} title="Exporting Your Design" icon={<Download size={15} />}>
                <p>
                    Click the <strong>Export</strong> button in the toolbar to open the export
                    menu. At the top of the menu are two settings that apply to vector/mesh exports:
                </p>
                <div
                    className="rounded-md p-3 space-y-1 text-[11px]"
                    style={{ backgroundColor: 'var(--bg-panel)', border: '1px solid var(--border-subtle)' }}
                >
                    <div><strong>Aperture Diameter</strong> — The real-world size (in mm) of the mask you want to produce. The design preview always works at a fixed internal size, but when you export, it scales everything to this diameter.</div>
                    <div><strong>STL Thickness</strong> — How thick the mask should be when extruded into a 3D model. Only affects the STL export.</div>
                </div>
                <p>Below the settings are four export formats:</p>
                <div
                    className="rounded-md p-3 space-y-1.5 text-[11px]"
                    style={{ backgroundColor: 'var(--bg-panel)', border: '1px solid var(--border-subtle)' }}
                >
                    <div>
                        <InlineIcon><ImageIcon size={10} /></InlineIcon>{' '}
                        <strong>Star PNG</strong> — A 2048×2048 pixel image of the simulated star. Good for sharing or presentations.
                    </div>
                    <div>
                        <InlineIcon><FileText size={10} /></InlineIcon>{' '}
                        <strong>Mask SVG</strong> — A 2D vector file of the mask outline. Can be opened in any vector editor (Inkscape, Illustrator, etc.) or sent to a laser cutter.
                    </div>
                    <div>
                        <InlineIcon><Box size={10} /></InlineIcon>{' '}
                        <strong>Mask STL</strong> — A 3D mesh file ready for 3D printing. The mask shape is extruded to the thickness you set above.
                    </div>
                    <div>
                        <InlineIcon><FileCode size={10} /></InlineIcon>{' '}
                        <strong>Mask DXF</strong> — A 2D vector file with exact mm dimensions. Common format for CNC machines and CAD programs.
                    </div>
                </div>
            </StepCard>

            {/* ── Step 8: 3D & Annotations ── */}
            <StepCard step={8} title="3D Preview & Annotations" icon={<Rotate3d size={15} />}>
                <p>
                    In the top-left corner of the Aperture Mask preview panel, there are two
                    small toggle buttons:
                </p>
                <div
                    className="rounded-md p-3 space-y-1.5 text-[11px]"
                    style={{ backgroundColor: 'var(--bg-panel)', border: '1px solid var(--border-subtle)' }}
                >
                    <div>
                        <InlineIcon><Ruler size={10} /></InlineIcon>{' '}
                        <strong>Annotations</strong> — Overlays dimension lines on the mask,
                        showing the aperture diameter, vane lengths, and obstruction radius in
                        mm. Useful for checking that your proportions are right before exporting.
                    </div>
                    <div>
                        <InlineIcon><Rotate3d size={10} /></InlineIcon>{' '}
                        <strong>3D Preview</strong> — Replaces the flat mask view with a rotatable
                        3D model of the mask at the current STL thickness. You can click and
                        drag to rotate it. This is the same geometry that the STL export produces.
                    </div>
                </div>
            </StepCard>

            {/* ── Keyboard shortcuts ── */}
            <div
                className="rounded-lg overflow-hidden"
                style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-subtle)' }}
            >
                <div
                    className="flex items-center gap-2 px-5 py-3"
                    style={{ borderBottom: '1px solid var(--border-subtle)' }}
                >
                    <span style={{ color: 'var(--text-accent)', opacity: 0.7 }}><Keyboard size={15} /></span>
                    <h2 className="text-[13px] font-semibold" style={{ color: 'var(--text-primary)' }}>
                        Keyboard Shortcuts
                    </h2>
                </div>
                <div className="px-5 py-4">
                    <table className="w-full text-[11px]" style={{ color: 'var(--text-secondary)' }}>
                        <tbody>
                            {[
                                ['⌘ Z  /  Ctrl+Z', 'Undo'],
                                ['⌘ ⇧ Z  /  Ctrl+Shift+Z', 'Redo'],
                                ['Scroll wheel (over preview)', 'Zoom in / out'],
                                ['Double-click (on preview)', 'Reset zoom to 1×'],
                            ].map(([shortcut, action]) => (
                                <tr key={shortcut} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                                    <td className="py-2 pr-4 align-top font-mono whitespace-nowrap" style={{ color: 'var(--text-muted)' }}>
                                        {shortcut}
                                    </td>
                                    <td className="py-2">{action}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* ── Back to Designer ── */}
            <button
                onClick={() => navigate('/')}
                className="flex items-center gap-2 px-4 py-2.5 rounded-md text-[12px] font-medium transition-all duration-150 mx-auto"
                style={{
                    backgroundColor: 'var(--accent-dim)',
                    color: 'var(--text-accent)',
                    border: '1px solid var(--border-accent)',
                }}
            >
                <ArrowLeft size={13} />
                Back to Designer
            </button>
        </div>
    );
}
