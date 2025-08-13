# AutoCAD-style 2D CAD Canvas

A professional AutoCAD-style 2D CAD canvas application built with React, Vite, and react-konva. Features a modular architecture with advanced viewport management, drawing tools, snapping, and a command system.

## Features

### ✅ Implemented (MVP Ready)
- **Viewport System**: Pan/zoom with cursor-centered zooming, infinite canvas feel
- **Grid & Axes**: Adaptive grid system with major/minor lines, X/Y axes
- **Entity System**: Zustand store with spatial indexing (rbush) for performance
- **Command System**: AutoCAD-style command bus with input handling
- **Drawing Tools**: Line tool with preview and rubber-band feedback
- **UI Components**: Professional toolbar, command bar, status bar
- **Keyboard Shortcuts**: F8 (Ortho), F10 (Polar), F3 (Snap), ESC (Cancel)
- **Entity Rendering**: Lines and circles with layer support
- **Selection Feedback**: Visual highlighting of selected entities

### 🚧 In Progress / TODO
- **More Drawing Tools**: Circle, Arc, Rectangle, Polyline commands
- **Snapping System**: Endpoint, midpoint, intersection, perpendicular snaps
- **Selection System**: Click, window, crossing selection with hit testing
- **Modify Tools**: Move, Copy, Rotate, Scale, Mirror, Trim, Extend, Offset
- **Dimensions**: Linear, aligned, angular with associative updates
- **Layers Panel**: Layer management, visibility, locking
- **Properties Panel**: Entity property editing
- **File I/O**: JSON save/load, SVG export, DXF export
- **Advanced Features**: Ortho/polar tracking, linetypes, hatching

## Architecture

### Key Technologies
- **React + Vite**: Modern build tooling and component framework
- **react-konva**: High-performance 2D canvas rendering
- **Zustand**: Lightweight state management with Immer for immutability
- **rbush**: Spatial indexing for fast hit testing and snapping
- **uuid**: Entity ID generation
- **Tailwind CSS**: Utility-first styling (via CDN)

### Project Structure
```
src/
├── app/                 # Global state and command system
│   ├── store.js         # Main Zustand store
│   ├── commandBus.js    # Command pattern implementation
│   └── DrawLineCommand.js # Line drawing command
├── canvas/              # Viewport and rendering
│   ├── CadCanvas.jsx    # Main canvas component
│   ├── useViewport.js   # Pan/zoom logic
│   ├── Grid.jsx         # Grid rendering
│   └── RenderEntities.jsx # Entity rendering
├── core/                # CAD core functionality
│   └── entities/        # Entity classes (Line, Circle, etc.)
├── ui/                  # UI components
│   ├── Toolbar.jsx      # Drawing tools toolbar
│   ├── CommandBar.jsx   # AutoCAD-style command line
│   └── StatusBar.jsx    # Status indicators
├── io/                  # File import/export (TODO)
└── modify/              # Transform operations (TODO)
```

## Getting Started

### Prerequisites
- Node.js 18+ 
- npm or yarn

### Installation
```bash
# Clone the repository
git clone <repo-url>
cd cad-canvas

# Install dependencies
npm install

# Start development server
npm run dev
```

### Usage

#### Basic Controls
- **Pan**: Middle mouse button drag or Shift+Left click drag
- **Zoom**: Mouse wheel (zooms to cursor position)
- **Draw Line**: Click "Line" button or type "line" in command bar
- **Cancel**: Press ESC to cancel current command
- **Repeat**: Press Enter to repeat last command

#### Command Line Input
- **Coordinates**: `100,200` (absolute) or `@50,25` (relative)
- **Distance**: `150` (for distance-based commands)
- **Angle**: `<45` (angle in degrees)
- **Commands**: Type command names like `line`, `circle`, etc.

#### Keyboard Shortcuts
- **F3**: Toggle snap on/off
- **F8**: Toggle ortho mode
- **F10**: Toggle polar tracking
- **ESC**: Cancel current command
- **Enter**: Repeat last command

## Technical Details

### Coordinate System
- **World Space**: Double precision coordinates for CAD accuracy
- **Screen Space**: Pixel coordinates, converted at render time
- **EPS**: 1e-9 for floating point comparisons
- **Viewport**: Maintains scale and offset for world↔screen conversion

### Performance Optimizations
- **Spatial Indexing**: rbush R-tree for fast spatial queries
- **Viewport Culling**: Only render visible entities (TODO)
- **Immutable Updates**: Immer for efficient state changes
- **Throttled Operations**: Animation frame throttling for expensive ops (TODO)

### CAD Conventions
- **Layer 0**: Default layer (cannot be deleted)
- **Selection Colors**: Yellow highlight for selected entities
- **Line Weights**: Screen-correct rendering (minimum 1px)
- **Grid Adaptation**: Powers-of-10 spacing based on zoom level

## Development

### Adding New Drawing Tools
1. Create command class extending `BaseCommand`
2. Implement `execute()`, `handleInput()`, and `cancel()` methods
3. Register command in `App.jsx`: `commandBus.register('toolname', ToolCommand)`
4. Add UI button in `Toolbar.jsx`

### Adding New Entity Types
1. Create entity class in `src/core/entities/`
2. Implement bounds calculation in store's `getEntityBounds()`
3. Add rendering case in `RenderEntities.jsx`
4. Add snapping candidates (when snapping system is implemented)

### Code Style Guidelines
- Use functional React components with hooks
- Include JSDoc for complex geometry functions
- Add TODO comments for future enhancements
- Follow CAD industry conventions for coordinate systems
- Keep world coordinates in doubles, convert to screen at render time

## Roadmap

### Phase 1: Core Drawing (Current)
- ✅ Viewport and grid system
- ✅ Basic entity rendering
- ✅ Line drawing tool
- 🚧 Circle, Arc, Rectangle tools
- 🚧 Polyline tool

### Phase 2: Professional Features
- Snapping system (endpoint, midpoint, intersection, etc.)
- Selection system (click, window, crossing)
- Modify tools (move, copy, rotate, scale, mirror)
- Layers and properties management

### Phase 3: Advanced CAD
- Dimensions with associativity
- Trim/Extend operations
- Offset tool with join styles
- Linetypes and hatching
- File I/O (JSON, SVG, DXF)

### Phase 4: Performance & Polish
- Viewport culling for large drawings
- Web workers for heavy geometry operations
- Advanced snapping with tolerances
- Professional theme and UX polish

## Contributing

This is a learning/demo project showcasing modern CAD application architecture. The codebase demonstrates:
- Clean separation of concerns
- Professional CAD UX patterns
- High-performance 2D rendering
- Extensible command system
- Industry-standard coordinate handling

## License

MIT License - see LICENSE file for details.+ Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Babel](https://babeljs.io/) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## Expanding the ESLint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and [`typescript-eslint`](https://typescript-eslint.io) in your project.
