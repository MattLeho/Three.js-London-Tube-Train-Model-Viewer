# Central Line Tube Simulator - Directory Map

This document provides a detailed architectural audit of the codebase, including feature names, proportions, function summaries, and key optimization strategies.

## Performance Optimization Strategy (Anti-Lag)
The simulator uses several layers of optimization to maintain 60FPS:
1. **Frustum & Distance Culling**: In `App.tsx`, we implement `RENDER_DIST_SQ = 350 * 350`. World chunks outside this radius are hidden (`chunk.visible = false`).
2. **Light Culling**: Dynamic point lights within world chunks are culled at an even tighter radius (`150 units`) to reduce the shader overhead of multiple light sources.
3. **Geometry Caching**: Train car components (First, Middle, Last) are cached in `cachedCarFirst`, etc., to avoid redundant recalculations when the carriage count is changed.
4. **Instanced Rendering**: Sleepers and detailed assets are rendered using `THREE.InstancedMesh` where possible.

## 1992 Stock Proportions & Values
All dimensions follow the "Standard Tube" gauge used on the Central Line:
- **CAR_LEN**: 16.248m (The base length of a single carriage).
- **CAR_WIDTH_EXT**: 2.620m (Exterior width).
- **HEIGHT_INT**: 1.965m (Interior ceiling height).
- **FLOOR_Y**: 0.555m (The height of the floor above the rail level).
- **GAUGE**: 1.435m (Standard rail gauge).
- **TRACK_OFFSET**: 3.0m (The distance from the tunnel center to each track's center).
- **COUPLER_GAP**: 0.330m (Distance between coupled cars).

## File Logic & Audit

### /src/App.tsx (The Central Nervous System)
**Purpose**: Handles the React UI, Three.js lifecycle, and the main animation loop.
- `initThreeJS()`: Initializes the renderer, scene, camera, and basic lighting.
- `animate()`: The 60FPS loop. Manages train physics, camera tracking, and world culling.
- `updateViewState()`: Propagates `AppState` changes to Three.js materials and visibility.
- `buildScene()`: Orchestrates the construction of the train and the procedural world.

### /src/EnvironmentGenerator.ts (World Assembly)
**Purpose**: Procedurally generates the subway environment using chunks.
- `createStation(length)`: Creates a high-detail station segment with platforms and infrastructure.
- `createCircularTunnel(length)`: Creates a standard tube tunnel chunk.
- `addDetailedInfrastructure()`: Generates benches, Oyster readers, roundels, and cabling.
- `createDoubleTrackBed()`: Builds the track assembly (rails + sleepers) centered at `±3.0m`.

### /src/TrainBuilder.ts (Precision CAD)
**Purpose**: Generates the 1992 Stock 3D model using extrusion and CSG-like logic.
- `buildCarShell()`: Creates the outer hull using `THREE.ExtrudeGeometry` based on real profiles.
- `buildInterior()`: Populates the cabin with longitudinal seating and stanchion poles.
- `createDoorEntity()`: Generates the pneumatic doors with window holes.
- `buildBogie()`: Links to high-fidelity bogie kinematics.

### /src/SceneryTrains.ts (AI & Scenery)
**Purpose**: Manages non-player trains appearing in the environment.
- `updateSceneryTrains()`: Calculates AI movement along the `trackPath`.
- **Clipping Logic**: Scenery trains are offset by `+3.5m`, while the player train is at `-3.0m`.
- **State Logic**: If `AppState.sceneryAI` is false, trains stop at stations and hold doors open.

### /src/AssetFactory.ts (Asset Library)
**Purpose**: A library of procedural geometry builders for trackside assets.
- `buildOysterReader()`: Constructing the iconic yellow touchpoint.
- `buildHeritageBench()`: Detailed station seating.
- `buildTrackSignal()`: Functional color-light signals.

## Code Audit Status
- **Redundancy Removed**: Redundant camera 'switch' statements in the `animate` loop were removed to prevent variable clobbering and performance drops.
- **Error Fix**: Added `accelData` and camera coordinate tracking to prevent `undefined` runtime errors in the simulator.
- **Clipping Fixes**: Resolved train carriage clipping in scene view caused by erroneous backward rotation logic (`rotateY(Math.PI)`), ensuring the car forward axis rigidly matches the track tangent.
- **Pre-Compilation**: Added `renderer.compile(scene, camera)` after scene setup to prevent massive lag spikes / framerate stutter when entering new track segments or sliding the scenery train count.
- **Scenery Logic Patch**: Extracted `updateSceneryCount()` to decouple UI sliders from full-world regeneration, preventing slider freezes.
- **Camera Overhaul**: Passenger camera views now use a disconnected dummy coordinate system to ensure OrbitControls retains standard mouse-panning behavior.
- **Autopilot Door Fixes**: Recalculated `atStation` checks with `trackZOffset` explicitly comparing distance against `stationsZ`, fixing autopilot door functionality in the scene view.
- **Movement Consistency**: Allowed OrbitControls camera target tracking offsets mapping logic in scene mode, letting users pan camera freely across train setups.
- **Tone Mapping Expansion**: Shifted scene day/night slider min bounds to reach true pitch black while scaling renderer exposure dynamically.
- **Index Warnings**: Optimized Three.js BufferGeometry cloning and `toNonIndexed` operations to halt repeated index generation logs, boosting performance.
- **Frustum Culling Stability**: Applied `frustumCulled = false` uniformly to detached child car geometries and couplers to halt off-screen render clipping.
