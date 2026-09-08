# Velocity Rivals 3D

A browser-based arcade combat racer built with Three.js.

## Included
- High-detail sports-car asset used for the racing field
- Dark asphalt track with white lane markings and red/white curbs
- Continuous glossy blue track walls
- Coastal/marina environment with water, boats, palms, skyline and mountains
- Blue banners, track lighting, portal structures and neon tunnel sections
- Higher chase camera for improved track visibility
- ACES tone mapping, environment reflections, soft shadows, restrained bloom and fog
- Six-car race field with AI opponents
- Hold-to-accelerate controls with a ~5 second ramp to top speed
- Touch/drag steering on mobile
- W / Up Arrow acceleration and A/D or Left/Right steering on desktop
- Homing rockets
- Turbo boosts
- Drop mines
- Item pickups
- Particle bursts, speed streaks and camera shake
- Responsive arcade-style HUD for desktop and mobile

## Controls
### Mobile
- Hold the screen to accelerate
- Drag left/right while holding to steer
- Release to coast
- Tap the item button to use the current pickup

### Desktop
- W or Up Arrow: accelerate
- A/D or Left/Right: steer
- S or Down Arrow: brake/coast faster
- Space: use the current pickup

## Local run
Use a local web server because the game uses JavaScript modules and remote 3D assets.

```bash
python3 -m http.server 8080
```

Then open `http://localhost:8080`.

## Vehicle asset license
The primary high-detail sports car is `SportsCar/Subdiv_Car.fbx` from **MirageYM/3DModels** by Yasutoshi Mori.

Copyright (c) 2015 Yasutoshi Mori. Licensed under the **Creative Commons Attribution 4.0 International License (CC BY 4.0)**.

Source: https://github.com/MirageYM/3DModels

License: https://github.com/MirageYM/3DModels/blob/master/LICENSE

Fallback vehicle model: Kenney Car Kit `sedan-sports.glb`, CC0 1.0.

## Visual direction
The game targets a glossy, vibrant arcade-racing presentation: sports coupes rather than open-wheel cars, dark asphalt, strong lane/curb definition, blue barriers, a sunny coastal marina, palm trees, skyline and mountains, and neon track architecture. The gameplay remains original and does not use proprietary Race Master assets, tracks, logos or branding.
