# Diffraction Spike Modeler

A web-based simulation and design tool for custom telescope aperture masks and spider vanes.

Diffraction Spike Modeler allows astrophotographers and telescope builders to easily design custom aperture masks, preview the resulting diffraction spikes in real-time.

## Features

- **Parametric Mask Builder**: Design intricate masks using customizable shapes including rectangles, wavy vanes, and grating sectors.
- **Central Obstructions**: Easily configure secondary mirror obstructions with adjustable ring counts, spacing, and thickness.
- **Real-time Previews**:
  - **2D Aperture Mask**: View your design with optional dimension annotations.
  - **3D Preview**: Visualize your mask as a 3D object before printing.
  - **Star Simulation**: See the exact diffraction pattern your mask will generate using Fast Fourier Transform (FFT) simulation.
- **Multiple Export Formats**:
  - **STL**: 3D print your mask.
  - **DXF / SVG**: Laser cut or CNC router your design.
  - **PNG**: Export high-resolution (2048x2048) renders of the simulated star diffraction pattern.
- **Shareable Designs**: Instantly share your mask configurations via simple URL links.





## Getting Started

### Prerequisites
Make sure you have [Node.js](https://nodejs.org/) installed on your machine.

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/diffraction-spike-sim.git
   cd diffraction-spike-sim
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm run dev
   ```

4. Open your browser and navigate to the local URL provided by Vite (usually `http://localhost:5173`).

### Building for Production

To build the application for production, run:
```bash
npm run build
```
The optimized files will be generated in the `dist` directory.

## Usage Guide

1. **Adjust Parameters**: Use the left panel to set your telescope's aperture diameter and define the central obstruction.
2. **Add Shapes**: Click "Add Shape" to insert new vanes or struts. Customize their dimensions, rotation, and type.
3. **Preview**: Watch the Star Simulation update in real-time. Toggle between the 2D Aperture Mask and 3D Preview to inspect your physical design.
4. **Export**: Click the "Export" button in the top right to download your finished mask in your preferred format.

## License

Please see the [LICENSE](LICENSE) file for more information.
