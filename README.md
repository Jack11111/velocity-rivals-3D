# Velocity Rivals 3D

A browser-based arcade combat racer built with Three.js.

## Included
- High-detail PBR concept-car asset used for the racing field
- Curved 3D coastal track with elevation changes
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
- Responsive HUD for desktop and mobile

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
Use a local web server because the game uses JavaScript modules and remote GLB assets.

```bash
python3 -m http.server 8080
```

Then open `http://localhost:8080`.

## Vehicle asset license
The primary high-detail vehicle uses the Khronos glTF Sample Assets **Car Concept** model, modified at runtime for this game by hiding logo/branding nodes and applying game-specific liveries.

Model and textures: © 2024 Darmstadt Graphics Group GmbH, Eric Chadwick. Licensed under **CC BY 4.0**.

Source: https://github.com/KhronosGroup/glTF-Sample-Assets/tree/main/Models/CarConcept

The model originated from a public-domain base and was optimized as a high-quality glTF showcase asset. Khronos trademarks/logos are not used as game branding.

Fallback vehicle model: Kenney Car Kit, CC0 1.0.

## Production direction
The game now uses a materially higher-quality PBR vehicle asset and a more controlled lighting/post-processing pipeline. Further visual improvements should focus on authored track/environment assets, higher-detail scenery, road textures, wheel/suspension animation, audio, garage/progression and level content rather than replacing the vehicle with procedural geometry.
