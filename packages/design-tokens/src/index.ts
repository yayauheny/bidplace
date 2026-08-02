// The modern token map is the only source of truth for the runtime system.
// Keep the package entry point intentionally small so new consumers cannot
// accidentally choose a conflicting legacy palette or geometry scale.
export * from './modern';
