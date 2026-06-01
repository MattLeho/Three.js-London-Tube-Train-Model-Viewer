# Central Line Tube Configurator & Simulator

A high-fidelity 3D visualization and simulation for the 1992 Stock Central Line train (London Underground). This application allows users to explore a realistic, interactive procedural 3D model of a train, run it across extensive dynamically built tracks and environments (stations, deep tube), and interact with high-detail bogies and architectural environments.


This repo also contains the seperate assets used to construct the app, including all the trackside furniture, platform furniture, straight and curved tunnel segments, and a seperate S8 Stock Metropolitan Line tube train that has not yet been integrated into the playable scene (future update!)

Check out the demo here: https://central-line-tube-26170139202.europe-west1.run.app/
I recommend reducing the carriage count to 4 before entering the scene viewer to avoid lag. It also gets very laggy if you activate the scene train on the other track at the moment sadly :(

## Features

- **Interactive 3D Configurator:** Full orbit controls to construct and examine modular trains.
- **Configurable Trainsets:** Procedurally generated cars with customizable properties. Adjust train length dynamically.
- **Dynamic Simulation Environment:** Switch into "Scene" mode to generate infinite procedurally built tracks, platforms, and curved tunnels populated with CCTV and industrial equipment.
- **AI Trains:** Toggle Scenery Trains to navigate the tracks realistically using a custom physics controller that identifies stations and automates stopping behaviors.
- **Modular Sub-Systems:**
  - Track-responsive suspension/kinematic animations on **HD Bogies**.
  - Toggle shell opacity to reveal the procedurally generated seating infrastructure.
  - Operable pneumatic doors that align dynamically to platforms.
  - Adjustable Global and Post-Processing Lighting bounds.
  - Interactive "Torch" mode array testing (Hold `SHIFT` + `LMB`).
  - 10+ internal/external cameras spanning driver, passenger, and orbit modes.

## Architecture & Codebase

The architecture uses native `three.js` to procedurally build massive environments without large arbitrary un-versioned `.glb` asset dependencies. 

- **React:** Powers the UI and orchestrates rebuild commands via hooks.
- **Three.js Core Geometry:** Functions rely on primitive generation through `ExtrudeGeometry`, custom paths (`THREE.Curve`), and modular composition chunks to form a single train out of thousands of nodes that run seamlessly.
- **World Splines:** Animation cycles use mathematically defined tracks.

Check out `DIRECTORY_MAP.md` for a comprehensive breakdown of exactly how each internal file intersects with one another to produce this application!

## Running Local

1. Install dependencies: `npm install`
2. Start the development server: `npm run dev`
3. Build for production: `npm run build`

## Latest Updates
- Fixed train collision handling to ensure cars mathematically align on tangent tracks in the scene view.
- Added mouse-look capabilities to all internal architectural cameras (Driver, Passengers, etc).
- Synced the central AI Autopilot control system with the pneumatic doors system.
- Upgraded WebGL optimizations by culling non-visible chunk lights aggressively.
- Fixed scenery train spawn direction and frustrating carriage geometry clipping behaviors.
- Restored and synced robust movement orbit controls targeting logic for scene view.
- Expanded scene's day/night graphical tone mapper bounds to reach pitch black darkness thresholds.
- Smoothed buffer indexing warnings during startup.
- Addressed culling flash bugs on off-screen dynamic scenery trains.
