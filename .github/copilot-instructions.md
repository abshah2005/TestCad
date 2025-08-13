# Copilot Instructions for AutoCAD-style 2D CAD Canvas

<!-- Use this file to provide workspace-specific custom instructions to Copilot. For more details, visit https://code.visualstudio.com/docs/copilot/copilot-customization#_use-a-githubcopilotinstructionsmd-file -->

## Project Overview
This is a professional AutoCAD-style 2D CAD canvas application built with React, Vite, and react-konva. The project follows a modular architecture with clear separation of concerns.

## Architecture Guidelines
- Use functional React components with hooks
- State management with Zustand
- Immutable updates with Immer
- Canvas rendering with react-konva
- Spatial indexing with rbush for performance
- All coordinates in double precision for accuracy

## Code Style Guidelines
- Use JavaScript (not TypeScript)
- Follow CAD industry conventions for coordinate systems and transformations
- Keep world coordinates in doubles, convert to screen at render time
- Use EPS = 1e-9 for floating point comparisons
- Include JSDoc comments for complex geometry functions
- Add TODO comments for future enhancements

## Key Concepts
- World space vs Screen space coordinate conversion
- Viewport management (pan/zoom to cursor)
- Entity-based drawing model with layers
- Command pattern for drawing tools
- Spatial indexing for snapping and selection
- AutoCAD-like keyboard shortcuts and UX patterns

## File Organization
- `src/app/` - Global state and command system
- `src/canvas/` - Viewport and rendering
- `src/core/` - Entity models, geometry, snapping, selection
- `src/ui/` - UI components (toolbar, panels, command bar)
- `src/io/` - File import/export
- `src/modify/` - Transform and modify operations

## Performance Considerations
- Use viewport culling for large drawings
- Implement spatial indexing for hit testing
- Throttle expensive operations to animation frames
- Consider web workers for heavy geometry calculations
