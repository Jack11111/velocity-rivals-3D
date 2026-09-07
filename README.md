# Velocity Rivals 3D

A browser-based arcade combat racer built with Three.js.

## Included
- Real 3D GLB vehicle models from Kenney Car Kit (CC0)
- Curved 3D track with elevation changes
- Soft shadows, fog, ACES tone mapping and environment lighting
- Six-car race field with AI opponents
- Automatic acceleration and touch/drag steering
- Homing rockets
- Turbo boosts
- Drop mines
- Item pickups
- Particle bursts and camera shake
- Responsive HUD for desktop and mobile

## Controls
- Drag left/right on touch or mouse to steer
- Arrow keys also steer
- Tap the item button or press Space to use the current pickup

## Local run
Use a local web server because the game uses JavaScript modules and remote GLB assets.

```bash
python3 -m http.server 8080
```

Then open `http://localhost:8080`.

## Asset license
Vehicle models are from Kenney Car Kit and are released under CC0 1.0:
https://kenney.nl/assets/car-kit

## Production direction
This repository is the asset-based foundation for a polished mobile/web arcade combat racer. The next production steps are bespoke car materials, authored track/environment assets, higher-end VFX/audio, wheel/suspension animation, garage/progression, and level content.
