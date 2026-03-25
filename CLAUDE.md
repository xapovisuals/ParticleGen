# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What This Is

A Lottie JSON particle animation generator. It produces Lottie-format JSON files describing particle emitter animations (circles, squares, triangles, stars with turbulence, wind, gravity, drag) that can be imported into After Effects via Bodymovin or rendered in any Lottie player.

## Running

- **Browser UI**: Open `preview.html` in a browser. No build step or server required. The sidebar provides controls for all particle parameters with live preview and JSON download.
- **CLI generation**: `node generate_lottie.js` writes `particle_animation.json` with defaults. Accepts `--config preset.json` for custom parameters and `-o output.json` for custom output path. Run `node generate_lottie.js --help` for all options.

## Architecture

The generation logic lives in a single shared module used by both entry points:

- **`particle_engine.js`** — Pure-function engine. Exports `buildLottieJSON(config)` and `DEFAULT_CONFIG`. Works in both Node.js (`require`) and browser (`window.ParticleEngine`). All particle physics (turbulence, drag, wind, gravity) and Lottie JSON construction happens here.
- **`preview.html`** — Browser UI. Loads the engine via `<script src="particle_engine.js">`. Handles all UI: slider/input binding, presets (localStorage), undo/redo history, playback controls, keyboard shortcuts, and dynamic color management. Uses Bodymovin CDN for live preview rendering.
- **`generate_lottie.js`** — Node CLI wrapper. `require('./particle_engine')`, parses CLI args, reads optional JSON config file, calls `buildLottieJSON()`, writes output.

When adding new particle features, add them to `particle_engine.js` (the `buildLottieJSON` function and `DEFAULT_CONFIG`), then wire up UI controls in `preview.html`.

## Config Parameters

All parameters are optional (defaults in `DEFAULT_CONFIG`):

| Category | Fields |
|----------|--------|
| Emission | `particles`, `emit`, `burstMode`, `emitterShape`, `emitterShapeWidth`, `emitterShapeHeight`, `sweepx` |
| Physics | `speed`, `drag`, `turbulence`, `velrand`, `windx`, `windy`, `gravity` |
| Appearance | `particleShape` (circle/square/triangle/star), `size`, `sizeOverLifetime` (none/grow/shrink/pulse), `spinMin`, `spinMax`, `colors` |
| Canvas | `fps` (24/30/60), `canvasWidth`, `canvasHeight`, `duration`, `keyframeSample`, `loopingMode` |

Physics are normalized to a 30fps baseline — changing FPS doesn't alter the visual behavior of drag or gravity.

## Lottie JSON Structure

Each particle is a shape layer (`ty: 4`) containing one shape group with a shape item (ellipse/rect/polystar) + fill + transform. Per-particle animation uses keyframed position, scale, opacity, and optionally rotation. Position keyframes are sampled every N frames (`keyframeSample`, default 3) with linear interpolation to reduce JSON size. Scale and opacity use eased keyframes for fade-in/out behavior.

## Keyboard Shortcuts (preview.html)

Space = play/pause, Enter = regenerate, Ctrl/Cmd+S = download, Ctrl/Cmd+Z = undo, Ctrl/Cmd+Shift+Z = redo, `[`/`]` = frame step, `?` = shortcut help.

## Key Files

- `particle_engine.js` — Shared generation engine (the source of truth for particle physics)
- `preview.html` — Browser UI (self-contained except for engine + CDN dependency)
- `generate_lottie.js` — Node CLI wrapper
- `data.js` — Legacy example output (~2MB), not used by any code
