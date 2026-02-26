# Diffraction Spike Simulator 

A web-based simulation and design tool for custom telescope aperture masks.

## Features

- **Parametric Mask Builder**: Design intricate masks using customizable elements including linear/sinusoidal vanes, grating sectors, and circular obstructions.
- **Real-time Previews**:
  - **2D Aperture Mask**: View your design with optional dimension annotations.
  - **3D Preview**: Visualize your mask as a 3D object before printing.
  - **Star Simulation**: See the exact diffraction pattern your mask will generate using Fast Fourier Transform simulation.
- **Supported Export Formats**:
  - **STL**: 
  - **DXF / SVG**: 
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
2. **Add Shapes**: Click " + " to insert new elements. Customize their dimensions, rotation, and type.
3. **Preview**: Watch the Star Simulation update in real-time. Toggle between the 2D Aperture Mask and 3D Preview to inspect your physical design.
4. **Export**: Click the "Export" button in the top right to download your finished mask in your preferred format.

## License

Please see the [LICENSE](LICENSE) file for more information.
