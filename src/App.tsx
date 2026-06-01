import { updateSceneryTrains } from './SceneryTrains';
import { buildCarShell, buildUnderbody, buildBogie, buildInterior, getShellMaterial } from './TrainBuilder';
import React, { useEffect, useRef, useState, useLayoutEffect } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";
import { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer.js";
import { RenderPass } from "three/examples/jsm/postprocessing/RenderPass.js";
import { UnrealBloomPass } from "three/examples/jsm/postprocessing/UnrealBloomPass.js";
import { GLTFExporter } from "three/examples/jsm/exporters/GLTFExporter.js";
import { OBJExporter } from "three/examples/jsm/exporters/OBJExporter.js";
import {
  Camera,
  CarFront,
  ChevronLeft,
  Zap,
  FastForward,
  Eye,
  Play,
  Rewind,
  CloudRain,
  Sun,
  LayoutDashboard,
} from "lucide-react";
import { EnvironmentGenerator } from "./EnvironmentGenerator";

// --- Global Variables (Decouples Three.js from React) ---
let dirLight: THREE.DirectionalLight;
let ambientLight: THREE.AmbientLight;
let scene: THREE.Scene;
let camera: THREE.PerspectiveCamera;
let renderer: THREE.WebGLRenderer;
let composer: EffectComposer;
let controls: OrbitControls;
let trainGroup: THREE.Group;
let worldGroup: THREE.Group;

(window as any)._numSceneryTrains = 0;
(window as any)._pAutoState = "cruising";
(window as any)._pAutoTimer = 0;

// Globally Bound State Matrix
export const AppState = {
  viewMode: "config" as "config" | "scene",
  throttle: 0,
  speed: 0,
  direction: 1, // 1 for forward, -1 for reverse
  cameraMode: "orbit" as
    | "orbit"
    | "driver"
    | "passengerL"
    | "passengerR"
    | "passengerFront"
    | "passengerBack"
    | "thirdPersonFront"
    | "thirdPersonRear"
    | "trackLevel"
    | "sideFollow"
    | "fixed",
  biome: "subway" as "subway" | "deep_tube" | "surface",
  hdBogies: false,
  shellOpaque: false,
  doorsOpen: false,
  bloomEnabled: false,
  bloomStrength: 0.8,
  bloomThreshold: 0.1,
  inspectionMode: false,
  wireframeMode: false,
  torchActive: false,
  autoStop: false,
  sceneryAI: false,
  sceneLive: false,
  driverDoorsOpen: false,
  sceneLighting: 50,
  interiorLightingLevel: 100,
  cabLightingLevel: 0,
  headlightLevel: 100,
  taillightLevel: 100,
  destinationSignLevel: 100,
};

let doorControls: any[] = [];
let interiorLights: any[] = [];
let inspectionLights: any[] = [];
let cabLights: any[] = [];
let externalLights: any[] = [];
let particles: any[] = [];
let rainParticles: THREE.Points | null = null;
let sparksGroup: THREE.Group | null = null;
let globalLightPool: THREE.PointLight[] = [];

let raycaster = new THREE.Raycaster();
export let mats: Record<string, THREE.Material & any>;
let mouse = new THREE.Vector2();
let torchLight: THREE.SpotLight;
let animId: number;
let isInitialized = false;
let activeKinematics: any[] = [];
let cachedCarFirst: THREE.Group | null = null;
let cachedCarMiddle: THREE.Group | null = null;
let cachedCarLast: THREE.Group | null = null;

// --- 1992 STOCK CENTRAL LINE CONSTANTS ---
const M = 1000;
export const CAR_LEN = 16248 / M;
export const CAR_WIDTH_INT = 2512 / M;
const CAR_WIDTH_EXT = 2620 / M;
const HEIGHT_TARE = 2869 / M;
export const HEIGHT_INT = 1965 / M;
export const FLOOR_Y = 555 / M;
export const BOGIE_CEN = 10000 / M;
export const COUPLER_GAP = 330 / M;

const DOOR_W = 1664 / M;
const DOOR_H = 1812 / M;
const WIN_W = 1679 / M;
const WIN_H = 893 / M;
const SILL_Y = 920 / M;
export const CAR_TOTAL_LEN = CAR_LEN + COUPLER_GAP;

const sharedShellMat = getShellMaterial();
const sharedShellSolidMat = getShellMaterial(true);


export function initThreeJS(container: HTMLDivElement, numCars: number) {
  if (isInitialized) return;

  // Scene
  scene = new THREE.Scene();
  scene.background = new THREE.Color(0x050505);
  scene.fog = new THREE.Fog(0x050505, 20, 400);

  const grid = new THREE.GridHelper(500, 100, 0x222222, 0x0a0a0a);
  grid.position.y = -1.002;
  scene.add(grid);

  trainGroup = new THREE.Group();
  worldGroup = new THREE.Group();
  scene.add(trainGroup);
  scene.add(worldGroup);

  // Camera
  camera = new THREE.PerspectiveCamera(
    40,
    window.innerWidth / window.innerHeight,
    0.1,
    1000,
  );
  camera.position.set(0, 12, 50);

  // Renderer
  renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.domElement.style.outline = "none";
  renderer.domElement.style.touchAction = "none";
  renderer.domElement.addEventListener("contextmenu", (e) =>
    e.preventDefault(),
  );

  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFShadowMap;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.0;

  // Post-processing for Dramatic Lighting (Bloom)
  const renderPass = new RenderPass(scene, camera);
  const bloomPass = new UnrealBloomPass(
    new THREE.Vector2(window.innerWidth, window.innerHeight),
    AppState.bloomStrength,
    0.5,
    AppState.bloomThreshold,
  );
  bloomPass.radius = 0.5;

  composer = new EffectComposer(renderer);
  composer.addPass(renderPass);
  composer.addPass(bloomPass);

  const pmremGenerator = new THREE.PMREMGenerator(renderer);
  pmremGenerator.compileEquirectangularShader();
  scene.environment = pmremGenerator.fromScene(
    new RoomEnvironment(),
    0.04,
  ).texture;

  container.appendChild(renderer.domElement);

  // Controls
  controls = new OrbitControls(camera, renderer.domElement);
  controls.mouseButtons = {
    LEFT: THREE.MOUSE.ROTATE,
    MIDDLE: THREE.MOUSE.DOLLY,
    RIGHT: THREE.MOUSE.PAN
  };
  controls.enableDamping = true;
  controls.dampingFactor = 0.05;
  controls.maxDistance = 500;
  controls.minDistance = 0.1;
  controls.panSpeed = 1.5;
  controls.zoomSpeed = 1.2;
  controls.keyPanSpeed = 20.0;
  controls.listenToKeyEvents(window);

  // Lights
  ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
  scene.add(ambientLight);
  dirLight = new THREE.DirectionalLight(0xffffff, 2.0);
  dirLight.position.set(20, 50, 30);
  dirLight.castShadow = true;
  dirLight.shadow.camera.top = 20;
  dirLight.shadow.camera.bottom = -20;
  dirLight.shadow.camera.left = -20;
  dirLight.shadow.camera.right = 20;
  dirLight.shadow.bias = -0.001;
  dirLight.shadow.mapSize.width = 2048;
  dirLight.shadow.mapSize.height = 2048;
  scene.add(dirLight);

  const inspectDir = new THREE.DirectionalLight(0xffffff, 0.0);
  inspectDir.position.set(0, -20, 0);
  scene.add(inspectDir);
  const inspectAmbient = new THREE.AmbientLight(0xffffff, 0.0);
  scene.add(inspectAmbient);
  inspectionLights.push(inspectDir, inspectAmbient);

  torchLight = new THREE.SpotLight(0xffffff, 0.0, 80, 0.3, 0.5, 1.5);
  torchLight.castShadow = true;
  scene.add(torchLight);
  scene.add(torchLight.target);

  globalLightPool = Array.from({length: 16}, () => {
    const l = new THREE.PointLight(0xff6600, 0.0, 25);
    scene.add(l);
    return l;
  });

  // Initialize Materials
  mats = {
    shell: sharedShellMat,
    shellSolid: sharedShellSolidMat,
    whiteDoor: new THREE.MeshPhysicalMaterial({
      color: 0xdde2e5,
      metalness: 0.1,
      roughness: 0.7,
      clearcoat: 0.0,
    }),
    blueBand: new THREE.MeshPhysicalMaterial({
      color: 0x111e7a,
      metalness: 0.05,
      roughness: 0.7,
      side: THREE.DoubleSide,
    }),
    frontFaceWhite: new THREE.MeshPhysicalMaterial({
      color: 0xdde2e5,
      metalness: 0.1,
      roughness: 0.7,
      clearcoat: 0.0,
    }),
    roof: new THREE.MeshPhysicalMaterial({
      color: 0x555555,
      metalness: 0.1,
      roughness: 0.8,
      transparent: true,
      opacity: 0.15,
    }),
    floor: new THREE.MeshStandardMaterial({ color: 0x444444, roughness: 0.9 }),
    seat: new THREE.MeshStandardMaterial({ color: 0x2b45a0, roughness: 0.8 }),
    redPole: new THREE.MeshStandardMaterial({
      color: 0xc92424,
      metalness: 0.1,
      roughness: 0.2,
    }),
    yellowPole: new THREE.MeshStandardMaterial({
      color: 0xeab308,
      metalness: 0.6,
      roughness: 0.3,
    }),
    pole: new THREE.MeshStandardMaterial({
      color: 0xeab308,
      metalness: 0.6,
      roughness: 0.3,
    }),
    frame: new THREE.MeshStandardMaterial({
      color: 0x5a5a5a,
      metalness: 0.5,
      roughness: 0.7,
    }),
    glass: new THREE.MeshPhysicalMaterial({
      color: 0x999999,
      metalness: 0.2,
      roughness: 0.05,
      transmission: 0.0,
      transparent: true,
      opacity: 0.4,
      side: THREE.DoubleSide,
    }),
    redDoor: new THREE.MeshPhysicalMaterial({
      color: 0xc92424,
      metalness: 0.1,
      roughness: 0.7,
      clearcoat: 0.0,
    }),
    indicatorOff: new THREE.MeshBasicMaterial({ color: 0x220500 }),
    indicatorOn: new THREE.MeshStandardMaterial({
      color: 0xffaa00,
      emissive: 0xffaa00,
      emissiveIntensity: 2.0,
    }),
  };

  // Events
  window.addEventListener("resize", onResize);
  window.addEventListener("mousemove", onMouseMove);
  window.addEventListener("mousedown", (e) => {
    if (e.shiftKey && e.button === 0) AppState.torchActive = true;
  });
  window.addEventListener("mouseup", () => {
    AppState.torchActive = false;
  });

  isInitialized = true;
  buildScene(numCars);
  animate();
}


function onMouseMove(e: MouseEvent) {
  mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
  mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;
}

function onResize() {
  if (!isInitialized) return;
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
  if (composer) composer.setSize(window.innerWidth, window.innerHeight);
}

// 1992 Stock Geometry Builders

let activeChunks: {
  group: THREE.Group;
  type: string;
  zPos: number;
  userData: any;
}[] = [];
let trackZOffset = 0; // World scrolling accumulator

// A list of high definition models required from the user to fully flesh this out.
export const REQUIRED_MODELS = [
  {
    id: "city_building_1",
    desc: "High-poly modern glass skyscraper",
    type: "City",
  },
  {
    id: "city_building_2",
    desc: "Medium height brick residential building",
    type: "City",
  },
  {
    id: "tree_pine",
    desc: "High definition pine tree for forests",
    type: "Forest",
  },
  {
    id: "tree_oak",
    desc: "High definition oak tree for forests",
    type: "Forest",
  },
  {
    id: "mountain_rock",
    desc: "Large rock formation for mountains",
    type: "Mountain",
  },
  {
    id: "tunnel_segment",
    desc: "10m long concrete tunnel tube with cables and lights",
    type: "Tunnel",
  },
  {
    id: "third_rail_contact",
    desc: "Detailed third rail and insulator",
    type: "Track",
  },
  {
    id: "track_bed",
    desc: "High-res ballast and sleeper texture/mesh",
    type: "Track",
  },
];

function buildTrackSegment(length: number) {
  const trackGroup = new THREE.Group();
  const numSleepers = Math.floor(length / 1.0);

  // Simplistic placeholder materials
  const ballastGeom = new THREE.BoxGeometry(3.6, 0.2, length);
  const ballastMat = new THREE.MeshStandardMaterial({
    color: 0x333333,
    roughness: 1.0,
  });
  const ballast = new THREE.Mesh(ballastGeom, ballastMat);
  ballast.position.set(0, -0.275, 0);
  trackGroup.add(ballast);

  const sleeperGeom = new THREE.BoxGeometry(2.6, 0.1, 0.24);
  const sleeperMat = new THREE.MeshStandardMaterial({
    color: 0x666666,
    roughness: 0.9,
  });

  // Instanced mesh for sleepers to save draw calls
  const instancedSleepers = new THREE.InstancedMesh(
    sleeperGeom,
    sleeperMat,
    numSleepers,
  );
  const dummy = new THREE.Object3D();
  for (let i = 0; i < numSleepers; i++) {
    dummy.position.set(0, -0.125, length / 2 - i * 1.0);
    dummy.updateMatrix();
    instancedSleepers.setMatrixAt(i, dummy.matrix);
  }
  trackGroup.add(instancedSleepers);

  const railGeom = new THREE.BoxGeometry(0.1, 0.15, length);
  const railMat = new THREE.MeshStandardMaterial({
    color: 0xaaaaaa,
    metalness: 0.8,
    roughness: 0.2,
  });
  const railL = new THREE.Mesh(railGeom, railMat);
  railL.position.set(-0.75, -0.075, 0);
  const railR = new THREE.Mesh(railGeom, railMat);
  railR.position.set(0.75, -0.075, 0);

  // Third rail placeholder
  const thirdRail = new THREE.Mesh(
    new THREE.BoxGeometry(0.15, 0.1, length),
    new THREE.MeshStandardMaterial({ color: 0x442211 }),
  );
  thirdRail.position.set(-1.2, -0.075, 0);
  trackGroup.add(railL, railR, thirdRail);

  return trackGroup;
}

function createChunk(type: string, length: number): THREE.Group {
  const group = new THREE.Group();
  group.add(buildTrackSegment(length));

  const createBox = (
    w: number,
    h: number,
    d: number,
    color: number,
    x: number,
    y: number,
    z: number,
  ) => {
    const m = new THREE.Mesh(
      new THREE.BoxGeometry(w, h, d),
      new THREE.MeshStandardMaterial({ color }),
    );
    m.position.set(x, y, z);
    return m;
  };

  // Procedural Placeholders
  if (type === "city") {
    for (let i = 0; i < 20; i++) {
      const z = (Math.random() - 0.5) * length;
      const xOffset = 5 + Math.random() * 10;
      const h = 10 + Math.random() * 40;
      group.add(createBox(3, h, 3, 0x111122, xOffset, h / 2, z));
      group.add(createBox(3, h, 3, 0x111122, -xOffset, h / 2, z));
    }
  } else if (type === "forest") {
    const trunkMat = new THREE.MeshStandardMaterial({ color: 0x3d2817 });
    const leafMat = new THREE.MeshStandardMaterial({ color: 0x184a1c });
    for (let i = 0; i < 60; i++) {
      const z = (Math.random() - 0.5) * length;
      const xOffset = 4 + Math.random() * 15;
      const isRight = Math.random() > 0.5;
      const sign = isRight ? 1 : -1;

      const trunk = new THREE.Mesh(
        new THREE.CylinderGeometry(0.2, 0.3, 2),
        trunkMat,
      );
      trunk.position.set(sign * xOffset, 1, z);
      const leaves = new THREE.Mesh(new THREE.ConeGeometry(1.5, 4), leafMat);
      leaves.position.set(sign * xOffset, 3, z);
      group.add(trunk, leaves);
    }
  } else if (type === "tunnel") {
    const tunnelMat = new THREE.MeshStandardMaterial({
      color: 0x222222,
      side: THREE.BackSide,
      roughness: 0.9,
    });
    const tunnel = new THREE.Mesh(
      new THREE.CylinderGeometry(3.5, 3.5, length, 16),
      tunnelMat,
    );
    tunnel.rotation.x = Math.PI / 2;
    tunnel.position.y = 1.0;
    group.add(tunnel);

    // Tunnel lights
    for (let z = -length / 2; z < length / 2; z += 20) {
      const l = new THREE.PointLight(0xffaa00, 1.0, 10);
      l.position.set(0, 3.5, z);
      const bulb = new THREE.Mesh(
        new THREE.BoxGeometry(0.2, 0.1, 0.4),
        new THREE.MeshBasicMaterial({ color: 0xffaa00 }),
      );
      bulb.position.set(0, 4.4, z);
      group.add(l, bulb);
    }
  } else if (type === "mountains") {
    for (let i = 0; i < 8; i++) {
      const z = (Math.random() - 0.5) * length;
      const xOffset = 10 + Math.random() * 20;
      const h = 20 + Math.random() * 40;
      group.add(createBox(15, h, 20, 0x444444, xOffset, h / 2 - 5, z));
      group.add(createBox(15, h, 20, 0x444444, -xOffset, h / 2 - 5, z));
    }
  }

  return group;
}

function getChunkLen() {
  const numCars = (window as any)._lastNumCars || 8;
  return Math.floor(Math.max(100, numCars * CAR_TOTAL_LEN + 40));
}

class CustomCurve extends THREE.Curve<THREE.Vector3> {
  startPos: THREE.Vector3;
  startRot: number;
  r: number;
  constructor(startPos: THREE.Vector3, startRot: number, r: number) {
    super();
    this.startPos = startPos.clone();
    this.startRot = startRot;
    this.r = r;
  }
  getPoint(t: number, optionalTarget = new THREE.Vector3()) {
    const theta = t * (Math.PI / 2); // 90 degrees right turn
    const lx = this.r - this.r * Math.cos(theta);
    const lz = -this.r * Math.sin(theta);
    const cos = Math.cos(this.startRot);
    const sin = Math.sin(this.startRot);
    const wx = lx * cos + lz * sin;
    const wz = -lx * sin + lz * cos;
    return optionalTarget.set(
      this.startPos.x + wx,
      this.startPos.y,
      this.startPos.z + wz,
    );
  }
}

export let trackPath: THREE.CurvePath<THREE.Vector3> | null = null;
export let trackLength = 0;
export const stationsZ: number[] = [];
export const trackAnalytics: any[] = [];

export function getAnalyticalPointAndDir(s: number): { pos: THREE.Vector3, dir: THREE.Vector3 } {
  while(s < 0) s += trackLength;
  s = s % trackLength;
  let seg = trackAnalytics.find(x => s >= x.startZ && s < x.endZ);
  if (!seg) seg = trackAnalytics[trackAnalytics.length - 1]; // fallback

  const sLocal = s - seg.startZ;

  if (seg.type === "straight" || seg.type === "station") {
      const dir = new THREE.Vector3(-Math.sin(seg.startRot), 0, -Math.cos(seg.startRot)).normalize();
      const pos = seg.startPos.clone().add(dir.clone().multiplyScalar(sLocal));
      return { pos, dir };
  } else if (seg.type === "curve") {
      const r = seg.radius!;
      const theta = (sLocal / ((Math.PI * r) / 2)) * (Math.PI / 2); // angle into the curve
      const lx = r - r * Math.cos(theta);
      const lz = -r * Math.sin(theta);
      const cos = Math.cos(seg.startRot);
      const sin = Math.sin(seg.startRot);
      const wx = lx * cos + lz * sin;
      const wz = -lx * sin + lz * cos;
      const pos = new THREE.Vector3(seg.startPos.x + wx, seg.startPos.y, seg.startPos.z + wz);
      
      const currentRot = seg.startRot - theta;
      const dir = new THREE.Vector3(-Math.sin(currentRot), 0, -Math.cos(currentRot)).normalize();
      return { pos, dir };
  }
  return { pos: new THREE.Vector3(), dir: new THREE.Vector3(0,0,-1) };
}

function buildWorldChunks() {
  while (worldGroup.children.length > 0) {
    worldGroup.remove(worldGroup.children[0]);
  }
  activeChunks = [];
  EnvironmentGenerator.reset();
  stationsZ.length = 0;
  trackAnalytics.length = 0;
  trackLength = 0;

  trackPath = new THREE.CurvePath();
  const segments = [
    { type: "station", length: 160 },
    { type: "straight", length: 100 },
    { type: "curve", radius: 120 },
    { type: "straight", length: 50 },
    { type: "curve", radius: 120 },
    { type: "station", length: 160 },
    { type: "straight", length: 100 },
    { type: "curve", radius: 120 },
    { type: "straight", length: 50 },
    { type: "curve", radius: 120 },
  ];

  let currentPos = new THREE.Vector3(0, 0, 0);
  let currentRot = 0; // 0 means facing -Z

  // Function to get direction vector
  const getDir = (rot: number) =>
    new THREE.Vector3(-Math.sin(rot), 0, -Math.cos(rot)).normalize();

  segments.forEach((seg) => {
    let chunkGrp = new THREE.Group();
    chunkGrp.position.copy(currentPos);
    chunkGrp.rotation.y = currentRot;

    if (seg.type === "station") {
      let geoGrp = new THREE.Group();
      if (AppState.biome === "subway") {
        geoGrp.add(EnvironmentGenerator.createStation(seg.length));
      } else {
        geoGrp.add(EnvironmentGenerator.createCircularTunnel(seg.length));
      }
      geoGrp.position.z = -seg.length / 2;
      chunkGrp.add(geoGrp);
      worldGroup.add(chunkGrp);

      const dir = getDir(currentRot);
      const nextPos = currentPos.clone().add(dir.multiplyScalar(seg.length));
      trackPath!.add(new THREE.LineCurve3(currentPos.clone(), nextPos));

      trackAnalytics.push({
        type: "station",
        startZ: trackLength,
        endZ: trackLength + seg.length,
        startPos: currentPos.clone(),
        startRot: currentRot,
        length: seg.length
      });

      // Station is centered at mid point
      stationsZ.push(trackLength + seg.length / 2);

      currentPos = nextPos;
      trackLength += seg.length;
    } else if (seg.type === "straight") {
      let geoGrp = new THREE.Group();
      if (AppState.biome === "surface") {
        geoGrp.add(EnvironmentGenerator.createDoubleTrackBed(seg.length));
      } else {
        geoGrp.add(EnvironmentGenerator.createCircularTunnel(seg.length));
      }
      geoGrp.position.z = -seg.length / 2;
      chunkGrp.add(geoGrp);
      worldGroup.add(chunkGrp);

      const dir = getDir(currentRot);
      const nextPos = currentPos.clone().add(dir.multiplyScalar(seg.length));
      trackPath!.add(new THREE.LineCurve3(currentPos.clone(), nextPos));

      trackAnalytics.push({
        type: "straight",
        startZ: trackLength,
        endZ: trackLength + seg.length,
        startPos: currentPos.clone(),
        startRot: currentRot,
        length: seg.length
      });

      currentPos = nextPos;
      trackLength += seg.length;
    } else if (seg.type === "curve") {
      chunkGrp.add(EnvironmentGenerator.createCurvedTunnel(seg.radius));
      worldGroup.add(chunkGrp);

      const curve = new CustomCurve(currentPos.clone(), currentRot, seg.radius);
      trackPath!.add(curve);

      const arcLen = (Math.PI * seg.radius) / 2;

      trackAnalytics.push({
        type: "curve",
        startZ: trackLength,
        endZ: trackLength + arcLen,
        startPos: currentPos.clone(),
        startRot: currentRot,
        radius: seg.radius
      });

      currentPos = curve.getPoint(1.0); // End of curve
      currentRot -= Math.PI / 2; // Right turn (rotating clockwise around Y)

      trackLength += arcLen; // Arc length
    }
  });
}

import { buildHDBogie, buildUndercarriage } from "./HD_Bogies";


export function updateSceneryCount() {
  const numScenery = AppState.viewMode === "scene" ? ((window as any)._numSceneryTrains ?? 0) : 0;
  if ((window as any)._sceneryTrains) {
    (window as any)._sceneryTrains.forEach((t: any) => scene.remove(t));
  }
  (window as any)._sceneryTrains = [];

  for (let s = 0; s < numScenery; s++) {
    const t2 = trainGroup.clone();
    t2.traverse((c: any) => {
      if (c.isMesh && c.material) {
        if (
          c.userData.isLamp ||
          c.userData.isDestinationSign ||
          c.userData.isExternalLight ||
          c.name === "ind" ||
          c.userData.isDoorControl
        ) {
          c.material = c.material.clone();
        }
      }
    });
    t2.userData.trackZ = (trackLength / (numScenery || 1)) * s;
    t2.visible = true;
    scene.add(t2);
    (window as any)._sceneryTrains.push(t2);
  }
}

export function buildScene(numCars: number = -1) {
  if (!isInitialized) return;

  // Default scenery trains to zero if not set
  if ((window as any)._numSceneryTrains === undefined) {
    (window as any)._numSceneryTrains = 0;
  }
  if ((window as any)._pAutoState === undefined) {
    (window as any)._pAutoState = false;
  }

  // Clear geometry caches so HD Bogies can be toggled without preserving stale chunks
  cachedCarFirst = null;
  cachedCarMiddle = null;
  cachedCarLast = null;

  // Default to the correct current UI length
  if (numCars === -1)
    numCars =
      (window as any)._lastNumCars ||
      Math.ceil(trainGroup.children.length / 2) ||
      8;
  (window as any)._lastNumCars = numCars;

  while (trainGroup.children.length > 0)
    trainGroup.remove(trainGroup.children[0]);
  while (worldGroup.children.length > 0)
    worldGroup.remove(worldGroup.children[0]);

  if ((window as any)._sceneryTrain) {
    scene.remove((window as any)._sceneryTrain);
  }
  doorControls = [];
  activeKinematics = [];
  particles = [];
  rainParticles = null;
  sparksGroup = null;
  trackZOffset = 0;
  interiorLights = [];
  cabLights = [];
  externalLights = [];

  // Tracks and Biome Base are in worldGroup now
  buildWorldChunks();
  
  if (stationsZ.length > 0) {
    const trainLengthOffset = (numCars * CAR_TOTAL_LEN) / 2;
    trackZOffset = stationsZ[0] + trainLengthOffset;
  }

  let currentZ = 0;
  for (let i = 0; i < numCars; i++) {
    const isFirst = i === numCars - 1; // Front of the train (most negative Z)
    const isLast = i === 0;            // Rear of the train (Z = 0)

    let targetCache = isFirst
      ? cachedCarFirst
      : isLast
        ? cachedCarLast
        : cachedCarMiddle;

    if (!targetCache) {
      targetCache = new THREE.Group();
      const BOGIE_Z = AppState.hdBogies ? 5.5 : BOGIE_CEN / 2;
      targetCache.add(buildBogie(-BOGIE_Z, activeKinematics));
      targetCache.add(buildBogie(BOGIE_Z, activeKinematics));

      const bodyGroup = new THREE.Group();
      if (AppState.hdBogies) {
        bodyGroup.add(buildUndercarriage(activeKinematics));
      } else {
        bodyGroup.add(buildUnderbody());
      }
      bodyGroup.add(buildInterior(isFirst, isLast));
      bodyGroup.add(buildCarShell(isFirst, isLast));
      bodyGroup.position.y = 0.545; // RAISE THE HULL AND FLOOR TO MATCH PLATFORM (1.1m)
      targetCache.add(bodyGroup);

      if (isFirst) cachedCarFirst = targetCache;
      else if (isLast) cachedCarLast = targetCache;
      else cachedCarMiddle = targetCache;
    }

    const carGroup = targetCache.clone();

    // Regenerate dynamically populated lists since clone() doesn't push to arrays
    carGroup.traverse((child: any) => {
      if (child.userData.kinematic) {
        activeKinematics.push({ mesh: child, ...child.userData.kinematic });
      } else if (child.userData.kinematicType) {
        // Fallback for old kinematics
        activeKinematics.push({
          mesh: child,
          type: child.userData.kinematicType,
          ratio: child.userData.ratio || 1,
        });
      }
      if (child.userData.isDoorControl) {
        doorControls.push(child);
      }
      if (child.userData.isInteriorLight) {
        interiorLights.push(child);
      }
      if (child.userData.isCabLight) {
        cabLights.push(child);
      }
      if (child.userData.isExternalLight) {
        externalLights.push(child);
      }
    });

    carGroup.userData.isCar = true;
    const maxZ = (numCars - 1) * CAR_TOTAL_LEN;
    carGroup.userData.offsetZ = currentZ;
    carGroup.position.z = -currentZ;

    // Fix frustum culling issue when cars move far from group center
    carGroup.traverse((child: any) => {
      child.frustumCulled = false;
    });

    trainGroup.add(carGroup);

    if (i < numCars - 1) {
      const coupler = new THREE.Mesh(
        new THREE.BoxGeometry(0.1, 0.1, COUPLER_GAP),
        mats.frame,
      );
      const couplerZ = currentZ + CAR_LEN / 2 + COUPLER_GAP / 2;
      coupler.userData.offsetZ = couplerZ;
      coupler.position.set(0, FLOOR_Y, -couplerZ);
      coupler.frustumCulled = false;
      trainGroup.add(coupler);
    }
    currentZ += CAR_TOTAL_LEN;
  }

  if (AppState.viewMode === "config") {
    // Center the train for orbit controls
    const numCars = (window as any)._lastNumCars || parseInt((document.getElementById("num-cars") as HTMLInputElement)?.value || "8");
    trainGroup.position.set(0, 0, ((numCars - 1) * CAR_TOTAL_LEN) / 2);
  } else {
    trainGroup.position.set(0, 0, 0);
  }

  updateSceneryCount();

  worldGroup.position.set(0, 0, 0);

  trainGroup.traverse((c) => {
    if (c instanceof THREE.Mesh) {
      c.castShadow = true;
      c.receiveShadow = true;
    }
  });

  updateViewState();
}

function updateViewState() {
  if (!isInitialized) return;

  // Update shell material
  if (mats.shell) {
    mats.shell.transparent = !AppState.shellOpaque;
    mats.shell.opacity = AppState.shellOpaque ? 1.0 : 0.15;
    mats.shell.wireframe = AppState.wireframeMode;
    mats.shell.needsUpdate = true;
  }

  // Update roof material
  if (mats.roof) {
    mats.roof.transparent = !AppState.shellOpaque;
    mats.roof.opacity = AppState.shellOpaque ? 1.0 : 0.15;
    mats.roof.wireframe = AppState.wireframeMode;
    mats.roof.needsUpdate = true;
  }

  if (mats.shellSolid) {
    mats.shellSolid.transparent = !AppState.shellOpaque;
    mats.shellSolid.opacity = AppState.shellOpaque ? 1.0 : 0.15;
    mats.shellSolid.wireframe = AppState.wireframeMode;
    mats.shellSolid.needsUpdate = true;
  }

  if (mats.glass) {
    if (AppState.wireframeMode) {
      // Transparent windows in wireframe mode
      mats.glass.transmission = 0.9;
      mats.glass.opacity = 0.4;
      mats.glass.color.setHex(0xaaccff);
      mats.glass.wireframe = true;
    } else {
      if (AppState.shellOpaque) {
        // In opaque shell mode, requested window opacity is 20%
        mats.glass.transmission = 0.0;
        mats.glass.opacity = 0.2;
        mats.glass.color.setHex(0xaaaaaa);
      } else {
        // In transparent shell mode, windows should probably be even more faint
        mats.glass.transmission = 0.0;
        mats.glass.opacity = 0.1;
        mats.glass.color.setHex(0xaaaaaa);
      }
      mats.glass.wireframe = false;
    }
    mats.glass.transparent = true;
    mats.glass.needsUpdate = true;
  }

  // Wireframe overrides
  if (mats.redDoor) {
    mats.redDoor.wireframe = AppState.wireframeMode;
    mats.redDoor.needsUpdate = true;
  }
  if (mats.whiteDoor) {
    mats.whiteDoor.wireframe = AppState.wireframeMode;
    mats.whiteDoor.needsUpdate = true;
  }

  if (composer && composer.passes[1]) {
    (composer.passes[1] as UnrealBloomPass).strength = AppState.bloomStrength;
    (composer.passes[1] as UnrealBloomPass).threshold = AppState.bloomThreshold;
  }

  if (mats.blueBand) {
    mats.blueBand.transparent = !AppState.shellOpaque;
    mats.blueBand.opacity = AppState.shellOpaque ? 1.0 : 0.0;
    mats.blueBand.needsUpdate = true;
  }

  trainGroup.traverse((c: any) => {
    if (c.type === "LineSegments") {
      if (c.name === "CAD_Edge") {
        c.visible = AppState.wireframeMode;
      } else {
        c.visible = AppState.shellOpaque || AppState.wireframeMode;
      }
    }

    // Also apply wireframe to HD bogie materials if we want, or just rely on CAD edges
    if (c.isMesh && c.material && !c.userData.isParticle) {
      // We only forcefully override some if it's wireframe mode
      // Actually, simply relying on CAD_Edge for HD parts is enough.
      // But let's apply it if the user really wants full wireframe
    }
  });

  // Explicitly toggle wireframe on HD Bogie materials
  if (AppState.hdBogies) {
    trainGroup.traverse((c: any) => {
      if (c.isMesh && c.material && c.parent?.name !== "CAD_Edge") {
        // Only apply if it's from HD Bogies (we can detect by checking if it's inside activeKinematics)
        // But wait, it's easier to just traverse activeKinematics
      }
    });
    activeKinematics.forEach((part) => {
      if (part.mesh) {
        part.mesh.traverse((m: any) => {
          if (m.isMesh && m.material && m.name !== "CAD_Edge") {
            m.material.wireframe = AppState.wireframeMode;
            m.material.needsUpdate = true;
          }
        });
      }
    });
  }

  if (mats.floor) mats.floor.wireframe = AppState.wireframeMode;
  if (mats.seat) mats.seat.wireframe = AppState.wireframeMode;
  if (mats.pole) mats.pole.wireframe = AppState.wireframeMode;
  if (mats.frame) mats.frame.wireframe = AppState.wireframeMode;

  interiorLights.forEach((l) => {
    const iLevel = AppState.interiorLightingLevel / 100;
    if (l.isPointLight) l.intensity = iLevel * 1.0;
    else if (l.isMesh) l.material.emissiveIntensity = iLevel * 1.5;
  });

  cabLights.forEach((l) => {
    l.intensity = Math.pow(AppState.cabLightingLevel / 100, 2) * 2.0;
  });

  // Smarter External Lights Logic
  if (trainGroup && trainGroup.children.length > 0) {
    externalLights.forEach((l) => {
      if (l.userData.isDestinationSign) {
        l.material.emissiveIntensity =
          (AppState.destinationSignLevel / 100) * 2.0;
        return;
      }

      if (l.userData.isLamp) {
        const isFrontOfTrain = l.userData.isFrontOfTrain;
        const isRed = l.userData.isRed;
        let shouldBeOn = false;

        if (isFrontOfTrain && !isRed) shouldBeOn = true; // Front -> White
        if (!isFrontOfTrain && isRed) shouldBeOn = true; // Rear -> Red

        const level = isRed
          ? AppState.taillightLevel / 100
          : AppState.headlightLevel / 100;

        if (shouldBeOn && level > 0) {
          l.material.emissiveIntensity = level * (isRed ? 20.0 : 8.0);
          if (l.userData.light) {
            l.userData.light.intensity = level * (isRed ? 6.0 : 8.0);
            l.userData.light.distance = isRed ? 25 : 80;
          }
        } else {
          l.material.emissiveIntensity = 0.0;
          if (l.userData.light) l.userData.light.intensity = 0.0;
        }
      }
    });
  }

  if (ambientLight) {
    const lightRatio = Math.max(0, AppState.sceneLighting / 50);
    ambientLight.intensity = Math.pow(lightRatio, 2) * 0.4;
    // Dramatic range boost for dark/bright levels
    if (AppState.sceneLighting < 5) ambientLight.intensity = 0;
    if (AppState.sceneLighting > 150) ambientLight.intensity *= 1.5;
    if (AppState.sceneLighting > 220) ambientLight.intensity *= 2.0;
  }
  if (dirLight) {
    const lightRatio = Math.max(0, AppState.sceneLighting / 50);
    dirLight.intensity = Math.pow(lightRatio, 2) * 1.5;
    if (AppState.sceneLighting < 5) dirLight.intensity = 0;
    if (AppState.sceneLighting > 150) dirLight.intensity *= 1.5;
    if (AppState.sceneLighting > 220) dirLight.intensity *= 2.0;
  }
  if (renderer) {
    const exposure = Math.max(0.0, (AppState.sceneLighting + 20) / 70); // Shift so -20 is true pitch black
    renderer.toneMappingExposure = AppState.inspectionMode ? 1.0 : exposure;
  }

  const fogBase = AppState.inspectionMode ? 0x222222 : 0x030303;
  const fogColor = new THREE.Color(fogBase);
  if (!AppState.inspectionMode) {
    const fogRatio = Math.max(0, AppState.sceneLighting / 50);
    fogColor.multiplyScalar(fogRatio);
  }
  scene.fog!.color.copy(fogColor);
  scene.background = fogColor;

  inspectionLights.forEach((l) => {
    if (l.isDirectionalLight) l.intensity = AppState.inspectionMode ? 1.5 : 0.0;
    if (l.isAmbientLight) l.intensity = AppState.inspectionMode ? 1.5 : 0.0;
  });

  if (renderer && scene && camera) {
    renderer.compile(scene, camera);
  }
}

let lastTime = 0;
// Define reusable spark geometry and material outside animate loop
const globalSparkGeo = new THREE.BoxGeometry(0.05, 0.05, 0.2);
const globalSparkMat = new THREE.MeshStandardMaterial({
  color: 0x333333,
  roughness: 0.8,
  metalness: 0.5,
  emissive: new THREE.Color(0xffaa00),
  emissiveIntensity: 5.0
});

function animate(time: number = 0) {
  const delta = Math.min((time - lastTime) / 1000, 0.1); // max 100ms
  lastTime = time;

  animId = requestAnimationFrame(animate);

  if (AppState.viewMode === "scene") {
    worldGroup.visible = true;
    EnvironmentGenerator.update();

    updateSceneryTrains(delta, trackLength, stationsZ);

    const RENDER_DIST_SQ = 350 * 350;
    const globalLightNodes: any[] = [];

    worldGroup.children.forEach(chunk => {
      // Chunk-based frustum culling for optimization
      const d2 = chunk.position.distanceToSquared(camera.position);
      chunk.visible = d2 < RENDER_DIST_SQ;
      
      // Secondary visibility check for objects within distance
      if (chunk.visible) {
        if (!chunk.userData.cachedLightNodes) {
          chunk.userData.cachedLightNodes = [];
          
          chunk.traverse((obj: any) => {
            if (obj.userData && obj.userData.wantsLight) {
              const pos = new THREE.Vector3();
              obj.getWorldPosition(pos);
              chunk.userData.cachedLightNodes.push({ pos, color: obj.userData.isStationLight ? 0xfff5e6 : 0xff6600, dist: obj.userData.isStationLight ? 30 : 25 });
            }
          });
        }
        chunk.userData.cachedLightNodes.forEach((node: any) => {
           const distSq = node.pos.distanceToSquared(camera.position);
           if (distSq < 40 * 40) {
             globalLightNodes.push({ distSq, node });
           }
        });
      }
    });

    globalLightNodes.sort((a, b) => a.distSq - b.distSq);
    for (let i = 0; i < globalLightPool.length; i++) {
        if (i < globalLightNodes.length) {
            const n = globalLightNodes[i].node;
            globalLightPool[i].position.copy(n.pos);
            globalLightPool[i].color.setHex(n.color);
            globalLightPool[i].distance = n.dist;
            globalLightPool[i].intensity = Math.max(0, Math.pow(AppState.sceneLighting / 50, 2) * 1.5);
        } else {
            globalLightPool[i].intensity = 0.0;
        }
    }

    const maxSpeed = 50.0;
    const brakeData = 15.0;
    const accelDataVal = 8.0; 
    let dirSign = AppState.direction * -1; // 1 -> -1 (Forward means negative trackZ)
    let targetSpeed = AppState.throttle * maxSpeed * dirSign;

    if (AppState.autoStop) {
      const trainLengthOffset = (((window as any)._lastNumCars || 8) * 16.748) / 2;
      
      let bestDist = Infinity;
      let targetZOffset = 0;
      stationsZ.forEach((z) => {
        const targetPos = (z + trainLengthOffset) % trackLength;
        let diff = targetPos - trackZOffset;
        if (diff < -trackLength / 2) diff += trackLength;
        if (diff > trackLength / 2) diff -= trackLength;

        let dist = diff * dirSign; 
        if (dist <= 0.1) dist += trackLength; // Use 0.1 to ignore the station we are already at

        if (dist > 0.1 && dist < bestDist) {
          bestDist = dist;
          targetZOffset = targetPos;
        }
      });

      const distToStation = bestDist;
      const reqBrake =
        (AppState.speed * AppState.speed) / (2 * brakeData) + 15;

      let pState = (window as any)._pAutoState;

      if (pState === "cruising") {
        targetSpeed = maxSpeed * dirSign;
        if (distToStation < reqBrake) {
          pState = "braking";
        }
      } else if (pState === "braking") {
        const idealV = Math.sqrt(
          2 * brakeData * Math.max(0, distToStation - 1.0),
        );
        targetSpeed = idealV * dirSign;

        if (distToStation <= 1.0 || (idealV < 1.0 && distToStation < 2.0)) {
          pState = "stopped";
          (window as any)._pAutoTimer = 5.0; // Wait 3s open + 2s close
          AppState.speed = 0;
          AppState.doorsOpen = true; // Auto open doors
          targetSpeed = 0;
          trackZOffset = targetZOffset; // Snap to station
        }
      } else if (pState === "stopped") {
        targetSpeed = 0;
        AppState.speed = 0;
        (window as any)._pAutoTimer -= delta;
        if ((window as any)._pAutoTimer <= 2.0) {
          AppState.doorsOpen = false; // Close warning
        }
        if ((window as any)._pAutoTimer <= 0) {
          pState = "accelerating";
        }
      } else if (pState === "accelerating") {
        targetSpeed = maxSpeed * dirSign;
        if (distToStation > 50) {
          pState = "cruising";
        }
      }

      (window as any)._pAutoState = pState;
    }

    let currentAccel = accelDataVal;
    if (
      Math.abs(targetSpeed) < Math.abs(AppState.speed) ||
      Math.sign(targetSpeed) !== Math.sign(AppState.speed)
    ) {
      currentAccel = brakeData; // Braking or reversing direction
    }

    if (Math.abs(targetSpeed - AppState.speed) < currentAccel * delta) {
      AppState.speed = targetSpeed;
    } else {
      AppState.speed +=
        Math.sign(targetSpeed - AppState.speed) * currentAccel * delta;
    }

    trackZOffset += AppState.speed * delta;

    // Normalize trackZOffset loop
    if (trackLength > 0) {
      while (trackZOffset < 0) trackZOffset += trackLength;
      trackZOffset %= trackLength;
    }

    // Evaluate track path and position cars
    if (trackAnalytics.length > 0 && trackLength > 0) {
      trainGroup.children.forEach((car) => {
        if (car.userData.offsetZ !== undefined) {
          const UP = new THREE.Vector3(0, 1, 0);

          if (car.userData.isCar) {
            // Car logic based on bogie wheelbases
            const BOGIE_OFFSET = 5.5; 
            
            const sFront = trackZOffset - car.userData.offsetZ + BOGIE_OFFSET;
            const sRear = trackZOffset - car.userData.offsetZ - BOGIE_OFFSET;

            const pFront = getAnalyticalPointAndDir(sFront);
            const pRear = getAnalyticalPointAndDir(sRear);

            const rightDirFront = pFront.dir.clone().cross(UP).normalize();
            const rightDirRear = pRear.dir.clone().cross(UP).normalize();

            const trackOffset = -3.0; // Same as Environment config track offset
            const carFrontPos = pFront.pos.clone().add(rightDirFront.multiplyScalar(trackOffset));
            const carRearPos = pRear.pos.clone().add(rightDirRear.multiplyScalar(trackOffset));

            const carPos = carFrontPos.clone().lerp(carRearPos, 0.5);
            carPos.y = 0;

            const dir = carFrontPos.clone().sub(carRearPos).normalize();
            const target = carPos.clone().add(dir);

            car.position.copy(carPos);
            car.lookAt(target);
          } else {
            // Coupler logic (just match track at its midpoint)
            const s = trackZOffset - car.userData.offsetZ;
            const p = getAnalyticalPointAndDir(s);
            
            const rightDir = p.dir.clone().cross(UP).normalize();
            const trackOffset = -3.0;
            
            const carPos = p.pos.clone().add(rightDir.multiplyScalar(trackOffset));
            car.position.copy(carPos);
            car.position.y = 0;
            
            const target = carPos.clone().add(p.dir);
            target.y = 0;
            car.lookAt(target);
          }
        }
      });
      // Train group itself stays at origin natively, cars move around!
      trainGroup.position.set(0, 0, 0);
      trainGroup.rotation.set(0, 0, 0);
    }

    // Bogie spark effects!
    if (Math.abs(AppState.speed) > 5) {
      if (!sparksGroup) {
        sparksGroup = new THREE.Group();
        trainGroup.add(sparksGroup);
      }
      // Do bogie kinematics animation
      if (AppState.hdBogies) {
        const timeSec = time / 1000;
        const trackShock =
          Math.sin(timeSec * 12) * 0.02 * (AppState.speed / 40);
        const frameSway =
          Math.sin(timeSec * 2.5) * 0.006 * (AppState.speed / 40);
        const chassisSway =
          Math.sin(timeSec * 0.5) * 0.001 * (AppState.speed / 40);
        const rotSpeed = AppState.speed * 0.1;
        activeKinematics.forEach((part) => {
          if (part.type === "wheel") part.mesh.rotation.x += rotSpeed;
          if (part.type === "gear")
            part.mesh.rotation.x += rotSpeed * (part.ratio || 1.0);
          if (part.type === "fan")
            part.mesh.rotation.x -= rotSpeed * (part.ratio || 1.0);
          if (part.type === "unsprung")
            part.mesh.position.y = (part.baseY || 0.4) + trackShock;
          if (part.type === "frame")
            part.mesh.position.y = (part.baseY || 0.65) + frameSway;
          if (part.type === "primarySpring")
            part.mesh.scale.y = 1.0 + (frameSway - trackShock) * 4.0;
          if (part.type === "secondarySpring")
            part.mesh.scale.y = 1.0 + (chassisSway - frameSway) * 6.0;
        });
      }

      if (Math.random() < 0.3) {
        if (sparksGroup && sparksGroup.parent !== worldGroup) {
          trainGroup.remove(sparksGroup);
          worldGroup.add(sparksGroup);
        }

        const spark = new THREE.Mesh(globalSparkGeo, globalSparkMat);
        // Pick a car and a bogie
        const actualCars = trainGroup.children.filter(
          (c) => c.userData.isCar,
        );
        if (actualCars.length > 0) {
          const car = actualCars[Math.floor(Math.random() * actualCars.length)];
          const bogieSign = Math.random() < 0.5 ? 1 : -1;
          const BOGIE_GAP = 11.25;
          const sparkZLocal =
            bogieSign * (BOGIE_GAP / 2) +
            (Math.random() - 0.5) * 0.5;

          spark.rotation.set(Math.random(), Math.random(), Math.random());
          if (AppState.viewMode === "scene") {
            const localPos = new THREE.Vector3(-1.2, 0.15, sparkZLocal);
            spark.position.copy(localPos.applyMatrix4(car.matrixWorld));
          } else {
            spark.position.set(-1.2, 0.15, car.position.z + sparkZLocal);
          }
          sparksGroup.add(spark);
          particles.push({
            mesh: spark,
            life: 1.0,
            vx: (Math.random() - 0.5) * 2,
            vy: 1 + Math.random() * 3,
            vz: (Math.random() - 0.5) * 2,
          });
        }
      }
    }

    if (rainParticles) rainParticles.visible = false;
  }

  // Update particles
  for (let i = particles.length - 1; i >= 0; i--) {
    const p = particles[i];
    p.life -= delta * 2;
    if (p.life <= 0) {
      if (p.mesh.parent) p.mesh.parent.remove(p.mesh);
      particles.splice(i, 1);
    } else {
      p.mesh.position.x += p.vx * delta;
      p.mesh.position.y += p.vy * delta;
      p.mesh.position.z += p.vz * delta;
      p.vy -= 9.8 * delta; // gravity
      if (p.mesh.material && (p.mesh.material as any).opacity !== undefined) {
        (p.mesh.material as THREE.MeshBasicMaterial).opacity = p.life;
      }
    }
  }

  if (AppState.viewMode === "scene") {
    const cars = trainGroup.children.filter(
      (c) => c.userData.offsetZ !== undefined && !c.userData.isCoupler,
    );
    if (cars.length > 0) {
      const isFwd = AppState.direction === 1;
      const frontCar = isFwd ? cars[0] : cars[cars.length - 1];
      const rearCar = isFwd ? cars[cars.length - 1] : cars[0];
      const midCar = cars[Math.floor(cars.length / 2)];
      const lookDir = isFwd ? -1 : 1; // -1 means look towards local -Z (forward)

      // Reset camera quaternion for safe local translation if needed
      const dummyCam = new THREE.Object3D();
      const applyCarBase = (car: THREE.Object3D) => {
        dummyCam.position.copy(car.position);
        dummyCam.quaternion.copy(car.quaternion);
      };

      let attachedCar = frontCar;

      switch (AppState.cameraMode) {
        case "driver":
          attachedCar = frontCar;
          applyCarBase(frontCar);
          dummyCam.translateX(-0.4); // Driver sits slightly left of center
          dummyCam.translateY(2.0);
          dummyCam.translateZ(lookDir * 6.9); // Move forward to desk
          if (!isFwd) dummyCam.rotateY(Math.PI);
          break;
        case "passengerL":
          attachedCar = midCar;
          applyCarBase(midCar);
          dummyCam.translateX(-1.0);
          dummyCam.translateY(1.6);
          // Look left
          dummyCam.rotateY(Math.PI / 2);
          break;
        case "passengerR":
          attachedCar = midCar;
          applyCarBase(midCar);
          dummyCam.translateX(1.0);
          dummyCam.translateY(1.6);
          // Look right
          dummyCam.rotateY(-Math.PI / 2);
          break;
        case "passengerFront":
          attachedCar = frontCar;
          applyCarBase(frontCar);
          dummyCam.translateX(0.0);
          dummyCam.translateY(1.6);
          dummyCam.translateZ(lookDir * 4.0); // Inside passenger cabin looking forward
          if (!isFwd) dummyCam.rotateY(Math.PI);
          break;
        case "passengerBack":
          attachedCar = rearCar;
          applyCarBase(rearCar);
          dummyCam.translateX(0.0);
          dummyCam.translateY(1.6);
          dummyCam.translateZ(lookDir * -4.0); // Inside rear passenger cabin looking backward
          if (isFwd) dummyCam.rotateY(Math.PI);
          break;
        case "thirdPersonFront":
          attachedCar = frontCar;
          applyCarBase(frontCar);
          dummyCam.translateX(3.5);
          dummyCam.translateY(4.0);
          dummyCam.translateZ(lookDir * -15.0); // Wait: if lookDir is -1 (fwd), we want local +15 (in front). So lookDir * -15.
          if (!isFwd) dummyCam.rotateY(Math.PI);
          dummyCam.lookAt(
            frontCar.position.clone().add(new THREE.Vector3(0, 1.0, 0)),
          );
          break;
        case "thirdPersonRear":
          attachedCar = rearCar;
          applyCarBase(rearCar);
          dummyCam.translateX(-3.5);
          dummyCam.translateY(4.0);
          dummyCam.translateZ(lookDir * 15.0); // Behind
          if (!isFwd) dummyCam.rotateY(Math.PI);
          dummyCam.lookAt(
            rearCar.position.clone().add(new THREE.Vector3(0, 1.0, 0)),
          );
          break;
        case "trackLevel":
          applyCarBase(frontCar);
          dummyCam.translateX(0.0);
          dummyCam.translateY(0.4);
          dummyCam.translateZ(lookDir * -20.0);
          if (!isFwd) dummyCam.rotateY(Math.PI);
          dummyCam.lookAt(
            frontCar.position.clone().add(new THREE.Vector3(0, 1.0, 0)),
          );
          break;
        case "sideFollow":
          applyCarBase(midCar);
          dummyCam.translateX(6.0);
          dummyCam.translateY(2.0);
          dummyCam.lookAt(
            midCar.position.clone().add(new THREE.Vector3(0, 1.0, 0)),
          );
          break;
        case "free":
          // Do nothing, let OrbitControls handle everything disconnected from train
          break;
        case "orbit":
          // The center of the orbit should follow the midCar smoothly while allowing pan
          if (controls) {
            const prevMidCarPos = (window as any)._prevMidCarPos;
            if (prevMidCarPos) {
              const deltaMidCar = midCar.position.clone().sub(prevMidCarPos);
              controls.target.add(deltaMidCar);
              camera.position.add(deltaMidCar);
            }
            (window as any)._prevMidCarPos = midCar.position.clone();
          }
          break;
        case "fixed": {
          // Find the nearest station using stationsZ
          let bestStationZ = 0;
          let bestDist = Infinity;
          if (trackAnalytics.length > 0 && trackLength > 0) {
            stationsZ.forEach((z) => {
              const p = getAnalyticalPointAndDir(z);
              const d = p.pos.distanceTo(midCar.position);
              if (d < bestDist) {
                bestDist = d;
                bestStationZ = z;
              }
            });
            const p = getAnalyticalPointAndDir(bestStationZ);
            const UP = new THREE.Vector3(0, 1, 0);
            const right = p.dir.clone().cross(UP).normalize();
            // Stand on the platform (left track is at -3.0 from center, platform is further left e.g. -8.5 from center)
            camera.position
              .copy(p.pos)
              .add(right.multiplyScalar(-8.5))
              .add(new THREE.Vector3(0, 3.0, 0));
            camera.lookAt(
              midCar.position.clone().add(new THREE.Vector3(0, 1.5, 0)),
            );
          }
          break;
        }
      }

      // Apply OrbitControls constraints for First-Person modes to allow mouse panning from a fixed point
      if (AppState.cameraMode !== "orbit" && AppState.cameraMode !== "fixed" && AppState.cameraMode !== "free") {
        camera.position.copy(dummyCam.position);
        
        if ((window as any)._lastCameraMode !== AppState.cameraMode) {
          camera.quaternion.copy(dummyCam.quaternion);
          // Initialize look direction constraints
          const camDir = new THREE.Vector3();
          camera.getWorldDirection(camDir);
          controls.target.copy(camera.position).add(camDir.multiplyScalar(0.01));

          controls.minDistance = 0.01;
          controls.maxDistance = 0.01;
          controls.enablePan = false;
          controls.enableZoom = false; // Prevent zooming inside passenger views
          controls.enableDamping = false;
          (window as any)._lastCameraMode = AppState.cameraMode;
          (window as any)._lastCameraPos = camera.position.clone();
          (window as any)._lastCarQuat = attachedCar.quaternion.clone();
        }
        
        if ((window as any)._lastCameraPos) {
          const deltaPos = new THREE.Vector3().subVectors(
            camera.position,
            (window as any)._lastCameraPos,
          );
          controls.target.add(deltaPos);
        }

        if ((window as any)._lastCarQuat) {
          const currentCarQuat = attachedCar.quaternion.clone();
          const deltaQuat = currentCarQuat.clone().multiply((window as any)._lastCarQuat.clone().invert());
          const targetOffset = new THREE.Vector3().subVectors(controls.target, camera.position);
          targetOffset.applyQuaternion(deltaQuat);
          controls.target.copy(camera.position).add(targetOffset);
          (window as any)._lastCarQuat = currentCarQuat;
        }

        (window as any)._lastCameraPos = camera.position.clone();

        controls.update();
      } else if (AppState.cameraMode === "orbit" || AppState.cameraMode === "free") {
        if ((window as any)._lastCameraMode !== AppState.cameraMode) {
          controls.minDistance = 0.1;
          controls.maxDistance = 500;
          controls.enablePan = true;
          controls.enableZoom = true;
          controls.enableDamping = true;
          (window as any)._lastCameraMode = AppState.cameraMode;
        }
      }
    }
  } else {
    worldGroup.visible = false;
  }

  if (controls && AppState.cameraMode === "orbit") controls.update();

  let anyMoving = false;
  let atStation = false;
  if (AppState.viewMode === "scene" && stationsZ.length > 0) {
    const currentTrainOffset = (((window as any)._lastNumCars || 8) * 16.748) / 2;
    for(let z of stationsZ) {
      let diff = (z + currentTrainOffset) - trackZOffset;
      if (diff < -trackLength / 2) diff += trackLength;
      if (diff > trackLength / 2) diff -= trackLength;
      if (Math.abs(diff) < 25.0) {
        atStation = true;
        break;
      }
    }
  }

  doorControls.forEach((door) => {
    let shouldOpen = false;

    if (door.userData.isDriver) {
      shouldOpen = AppState.driverDoorsOpen;
    } else if (AppState.doorsOpen) {
      if (AppState.viewMode === "scene") {
        if (atStation && door.userData.isRightSide) {
          shouldOpen = true;
        }
      } else {
        shouldOpen = true;
      }
    }

    const left = door.children.find((c: any) => c.name === "lL");
    const right = door.children.find((c: any) => c.name === "rL");
    const ind = door.children.find((c: any) => c.name === "ind");

    if (!left) return;

    const targetL = shouldOpen ? door.userData.openL : door.userData.closedL;
    const diffL = targetL - left.position.z;
    left.position.z += diffL * 0.08;

    let targetR = 0;
    let diffR = 0;
    if (door.userData.isDouble && right) {
      targetR = shouldOpen ? door.userData.openR : door.userData.closedR;
      diffR = targetR - right.position.z;
      right.position.z += diffR * 0.08;
    }

    const isMoving =
      Math.abs(diffL) > 0.01 ||
      (door.userData.isDouble && Math.abs(diffR) > 0.01);
    if (isMoving) anyMoving = true;

    // Pop-out plug door effect to prevent clipping into seats and walls
    const progL =
      Math.abs(left.position.z - door.userData.closedL) /
      Math.abs(door.userData.openL - door.userData.closedL);
    const popOutAmount = Math.min(progL * 5, 1.0) * 0.12;
    const sign = door.userData.isRightSide ? 1 : -1;

    left.position.x = sign * popOutAmount;
    if (door.userData.isDouble && right) {
      right.position.x = sign * popOutAmount;
    }

    if (ind) ind.material = anyMoving ? mats.indicatorOn : mats.indicatorOff;
  });

  if (AppState.torchActive) {
    torchLight.intensity = 8.0;
    raycaster.setFromCamera(mouse, camera);
    const intersects = raycaster.intersectObjects(trainGroup.children, true);
    if (intersects.length > 0) {
      torchLight.position.copy(camera.position);
      torchLight.target.position.copy(intersects[0].point);
      torchLight.target.updateMatrixWorld();
    }
  } else {
    torchLight.intensity = 0.0;
  }

  if (AppState.bloomEnabled && composer) {
    composer.render();
  } else {
    renderer.render(scene, camera);
  }
}

// --- MAIN REACT COMPONENT ---
export default function App() {
  const mountRef = useRef<HTMLDivElement>(null);
  const [renderTick, setRenderTick] = useState(0); // Force UI updates

  // Initialize Three.js ONCE
  useLayoutEffect(() => {
    if (mountRef.current && !isInitialized) {
      initThreeJS(mountRef.current, 8);
    }
  }, []);

  // Action Handlers
  const handleSetCarCount = (n: number) => {
    buildScene(n);
    setRenderTick((t) => t + 1);
  };

  const toggleShell = () => {
    AppState.shellOpaque = !AppState.shellOpaque;
    updateViewState();
    setRenderTick((t) => t + 1);
  };
  const toggleDoors = () => {
    AppState.doorsOpen = !AppState.doorsOpen;
    setRenderTick((t) => t + 1);
  };
  const toggleInspectMode = () => {
    AppState.inspectionMode = !AppState.inspectionMode;
    updateViewState();
    setRenderTick((t) => t + 1);
  };

  const handleDownloadGLB = () => {
    const exporter = new GLTFExporter();
    exporter.parse(
      trainGroup,
      (buffer) => {
        const blob = new Blob([buffer as ArrayBuffer], {
          type: "application/octet-stream",
        });
        const link = document.createElement("a");
        link.href = URL.createObjectURL(blob);
        link.download = "1992_train_model.glb";
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      },
      (err) => console.error(err),
      { binary: true },
    );
  };

  const handleDownloadOBJ = () => {
    const exporter = new OBJExporter();
    const result = exporter.parse(trainGroup);
    const blob = new Blob([result as string], { type: "text/plain" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "1992_train_model.obj";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleDownloadHTML = () => {
    const exporter = new GLTFExporter();
    exporter.parse(
      trainGroup,
      (buffer) => {
        const blob = new Blob([buffer as ArrayBuffer], {
          type: "application/octet-stream",
        });
        const reader = new FileReader();
        reader.readAsDataURL(blob);
        reader.onloadend = () => {
          const base64GLB = reader.result as string; // Data URI Format
          const htmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Train Model Viewer</title>
    <style>body { margin: 0; overflow: hidden; background: #050505; }</style>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/dat-gui/0.7.9/dat.gui.min.js"></script>
    <script type="importmap">
    {
        "imports": {
            "three": "https://unpkg.com/three@0.160.0/build/three.module.js",
            "three/addons/": "https://unpkg.com/three@0.160.0/examples/jsm/"
        }
    }
    </script>
</head>
<body>
    <script type="module">
        import * as THREE from 'three';
        import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
        import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
        import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
        import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
        import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';

        const scene = new THREE.Scene();
        scene.fog = new THREE.Fog(0x030303, 10, 80);
        scene.background = new THREE.Color(0x050505);
        const camera = new THREE.PerspectiveCamera(40, window.innerWidth / window.innerHeight, 0.1, 1000);
        camera.position.set(0, 12, 50);

        const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: "high-performance" });
        renderer.setSize(window.innerWidth, window.innerHeight);
        renderer.shadowMap.enabled = true;
        renderer.toneMapping = THREE.ACESFilmicToneMapping;
        renderer.toneMappingExposure = 0.6;
        document.body.appendChild(renderer.domElement);

        const controls = new OrbitControls(camera, renderer.domElement);
        controls.enableDamping = true;

        const ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
        scene.add(ambientLight);
        const dirLight = new THREE.DirectionalLight(0xffffff, 0.75);
        dirLight.position.set(20, 50, 30);
        scene.add(dirLight);

        // Add Post-processing Bloom
        const renderPass = new RenderPass(scene, camera);
        const bloomPass = new UnrealBloomPass(new THREE.Vector2(window.innerWidth, window.innerHeight), 1.0, 0.5, 1.5);
        
        const composer = new EffectComposer(renderer);
        composer.addPass(renderPass);
        composer.addPass(bloomPass);

        // GUI setup
        const params = {
            sceneLighting: 50,
            bloomEnabled: true,
            bloomStrength: 1.0,
            bloomThreshold: 1.5,
            wireframe: false
        };
        
        let loadedScene = null;

        const gui = new dat.GUI();
        gui.add(params, 'sceneLighting', 0, 100).name('Scene Lighting').onChange(v => {
            ambientLight.intensity = (v / 100) * 0.8;
            dirLight.intensity = (v / 100) * 1.5;
            renderer.toneMappingExposure = 0.2 + (v / 100) * 0.8;
        });
        gui.add(params, 'bloomEnabled').name('Post-Processing');
        const bloomFolder = gui.addFolder('Bloom Settings');
        bloomFolder.add(params, 'bloomStrength', 0, 3).onChange(v => bloomPass.strength = v).name('Strength');
        bloomFolder.add(params, 'bloomThreshold', 0, 2).onChange(v => bloomPass.threshold = v).name('Threshold');
        
        gui.add(params, 'wireframe').name('Wireframe mode').onChange((val) => {
             if(loadedScene) {
                 loadedScene.traverse((child) => {
                     if(child.isMesh && child.material) child.material.wireframe = val;
                 });
             }
        });

        const loader = new GLTFLoader();
        loader.load("${base64GLB}", (gltf) => {
            loadedScene = gltf.scene;
            
            // Re-apply emissive values because GLTF exporter sometimes loses high intensity precision
            loadedScene.traverse((child) => {
                if (child.isMesh && child.material) {
                    if (child.material.name === "indicatorOn") {
                        child.material.emissiveIntensity = 2.0;
                    }
                }
            });
            
            scene.add(loadedScene);
        });

        window.addEventListener('resize', () => {
            camera.aspect = window.innerWidth / window.innerHeight;
            camera.updateProjectionMatrix();
            renderer.setSize(window.innerWidth, window.innerHeight);
            composer.setSize(window.innerWidth, window.innerHeight);
        });

        function animate() {
            requestAnimationFrame(animate);
            controls.update();
            if (params.bloomEnabled) composer.render();
            else renderer.render(scene, camera);
        }
        animate();
    </script>
</body>
</html>`;
          const outBlob = new Blob([htmlContent], { type: "text/html" });
          const link = document.createElement("a");
          link.href = URL.createObjectURL(outBlob);
          link.download = "train_viewer.html";
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
        };
      },
      (err) => console.error(err),
      { binary: true },
    );
  };

  const handleReset = () => {
    if (controls && camera) {
      controls.reset();
      camera.position.set(0, 12, 50);
      controls.target.set(0, 0, 0);
    }
  };

  const handleSetViewMode = (m: "config" | "scene") => {
    AppState.viewMode = m;
    // Reset camera positions depending on mode
    if (m === "config") {
      AppState.cameraMode = "orbit";
      camera.position.set(0, 12, 50);
      controls.target.set(0, 0, 0);
      if (scene.fog) (scene.fog as THREE.Fog).far = 400; // Let them see the whole train
    } else {
      AppState.direction = 1;
      if (scene.fog) (scene.fog as THREE.Fog).far = 150; // Constrain view distance in scene
      if (AppState.cameraMode === "orbit") {
        camera.position.set(6, 4, trainGroup.position.z + 10);
        controls.target.set(0, 1.5, trainGroup.position.z);
        controls.update();
      }
    }
    setRenderTick((t) => t + 1);
  };

  return (
    <div
      className="m-0 overflow-hidden text-[#eee] w-full h-screen relative"
      style={{
        fontFamily: "'Inter', monospace",
        backgroundColor: AppState.inspectionMode ? "#222" : "#030303",
        transition: "background-color 0.5s",
      }}
    >
      <div ref={mountRef} className="absolute inset-0 z-0" />

      {/* UI Overlay Layer */}
      <div
        className="absolute inset-0 z-10 pointer-events-none flex flex-col justify-between"
        style={{ padding: "25px", boxSizing: "border-box" }}
      >
        <div className="flex justify-between items-start">
          {AppState.viewMode === "config" ? (
            <div className="pointer-events-auto bg-[#080808F2] border border-[#333] p-5 w-80 shadow-[0_4px_30px_rgba(0,0,0,0.8)] backdrop-blur-md border-l-[3px] border-l-[#dc2626] overflow-y-auto max-h-[85vh]">
              <span className="text-[9px] text-[#777] uppercase tracking-[2px] mb-2 block">
                1992 Tube Stock | Precision Telemetry
              </span>
              <h1 className="text-xl font-black mb-[15px] tracking-tight">
                TRAIN CONFIGURATOR
              </h1>

              <div className="grid grid-cols-2 gap-[8px] mb-[15px] border-b border-[#222] pb-[15px]">
                <div className="text-[10px]">
                  <span className="text-[#666] block text-[8px] uppercase tracking-[1px]">
                    Active Layout
                  </span>
                  Variable Trainset
                </div>
                <div className="text-[10px]">
                  <span className="text-[#666] block text-[8px] uppercase tracking-[1px]">
                    Topology
                  </span>
                  Central Line '92
                </div>
                <div className="text-[10px]">
                  <span className="text-[#666] block text-[8px] uppercase tracking-[1px]">
                    Furnishings
                  </span>
                  Longitudinal Seating
                </div>
                <div className="text-[10px]">
                  <span className="text-[#666] block text-[8px] uppercase tracking-[1px]">
                    Lighting
                  </span>
                  Actuation Indicators
                </div>
              </div>

              <button
                className="cursor-pointer px-[14px] py-[12px] border border-[#dc2626] hover:bg-[#dc2626] bg-[#220000] text-white text-[12px] font-bold uppercase tracking-[1.5px] transition-[0.15s] w-full flex justify-center items-center mb-[15px]"
                onClick={() => handleSetViewMode("scene")}
              >
                <LayoutDashboard className="w-4 h-4 mr-2" /> VIEW IN SCENE
              </button>

                <div className="mb-[15px] border-b border-[#222] pb-[15px]">
                  <span className="text-[9px] text-[#777] uppercase tracking-[2px] mb-[2px] block">
                    Carriage Count [Unidades]
                  </span>
                  <div className="flex justify-between items-center">
                    <input
                      type="range"
                      min="1"
                      max="8"
                      defaultValue="8"
                      onChange={(e) =>
                        handleSetCarCount(parseInt(e.target.value))
                      }
                      className="w-full mt-[5px] accent-[#dc2626]"
                    />
                    <span className="ml-4 font-bold text-lg text-red-500">
                      {isInitialized
                        ? Math.ceil(trainGroup.children.length / 2)
                        : 8}
                    </span>
                  </div>
                </div>

              <div>
                <button
                  className="cursor-pointer px-[14px] py-[10px] border border-[#444] hover:bg-[#dc2626] hover:border-[#ff0000] bg-[#111] text-white text-[10px] font-bold uppercase tracking-[1.5px] transition-[0.15s] w-full text-left flex justify-between items-center mb-[8px]"
                  onClick={toggleShell}
                >
                  Shell Opacity{" "}
                  <span
                    className={
                      AppState.shellOpaque
                        ? "font-normal text-green-500"
                        : "font-normal text-red-500"
                    }
                  >
                    {AppState.shellOpaque ? "OPAQUE" : "TRANSPARENT"}
                  </span>
                </button>
                <button
                  className="cursor-pointer px-[14px] py-[10px] border border-[#444] hover:bg-[#dc2626] hover:border-[#ff0000] bg-[#111] text-white text-[10px] font-bold uppercase tracking-[1.5px] transition-[0.15s] w-full text-left flex justify-between items-center mb-[8px]"
                  onClick={toggleDoors}
                >
                  Pneumatic Doors{" "}
                  <span
                    className={
                      AppState.doorsOpen
                        ? "font-normal text-green-500"
                        : "font-normal text-[#888]"
                    }
                  >
                    {AppState.doorsOpen ? "OPEN" : "CLOSED"}
                  </span>
                </button>

                <button
                  className="cursor-pointer px-[14px] py-[10px] border border-[#444] hover:bg-[#dc2626] hover:border-[#ff0000] bg-[#111] text-white text-[10px] font-bold uppercase tracking-[1.5px] transition-[0.15s] w-full text-left flex justify-between items-center mb-[8px]"
                  onClick={() => {
                    AppState.hdBogies = !AppState.hdBogies;
                    buildScene();
                    setRenderTick((t) => t + 1);
                  }}
                >
                  HD Bogies{" "}
                  <span
                    className={
                      AppState.hdBogies
                        ? "font-normal text-green-500"
                        : "font-normal text-[#888]"
                    }
                  >
                    {AppState.hdBogies ? "ON" : "OFF"}
                  </span>
                </button>

                <button
                  className="cursor-pointer px-[14px] py-[10px] border border-[#444] hover:bg-[#dc2626] hover:border-[#ff0000] bg-[#111] text-white text-[10px] font-bold uppercase tracking-[1.5px] transition-[0.15s] w-full text-left flex justify-between items-center mb-[8px]"
                  onClick={() => {
                    AppState.bloomEnabled = !AppState.bloomEnabled;
                    setRenderTick((t) => t + 1);
                  }}
                >
                  Post-Processing{" "}
                  <span
                    className={
                      AppState.bloomEnabled
                        ? "font-normal text-green-500"
                        : "font-normal text-[#888]"
                    }
                  >
                    {AppState.bloomEnabled ? "ON" : "OFF"}
                  </span>
                </button>
                {AppState.bloomEnabled && (
                  <div className="px-[14px] py-[10px] border border-[#333] bg-[#0a0a0a] mb-[8px] space-y-3">
                    <div>
                      <div className="flex justify-between text-[9px] text-[#777] uppercase tracking-[1px] mb-1">
                        <span>Bloom Strength</span>
                        <span>{AppState.bloomStrength.toFixed(2)}</span>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="3"
                        step="0.05"
                        value={AppState.bloomStrength}
                        onChange={(e) => {
                          AppState.bloomStrength = parseFloat(e.target.value);
                          updateViewState();
                          setRenderTick((t) => t + 1);
                        }}
                        className="w-full h-1 bg-[#444] accent-[#dc2626]"
                      />
                    </div>
                    <div>
                      <div className="flex justify-between text-[9px] text-[#777] uppercase tracking-[1px] mb-1">
                        <span>Bloom Threshold</span>
                        <span>{AppState.bloomThreshold.toFixed(2)}</span>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="2"
                        step="0.05"
                        value={AppState.bloomThreshold}
                        onChange={(e) => {
                          AppState.bloomThreshold = parseFloat(e.target.value);
                          updateViewState();
                          setRenderTick((t) => t + 1);
                        }}
                        className="w-full h-1 bg-[#444] accent-[#dc2626]"
                      />
                    </div>
                  </div>
                )}

                <div className="w-full mb-[8px]">
                  <div className="flex justify-between items-center mb-1">
                    <label className="text-white text-[9px] font-bold uppercase tracking-[1.5px]">
                      Scene Day/Night
                    </label>
                    <span className="text-[9px] font-bold text-gray-400">
                      {AppState.sceneLighting}%
                    </span>
                  </div>
                  <input
                    type="range"
                    min="-50"
                    max="250"
                    value={AppState.sceneLighting}
                    onChange={(e) => {
                      AppState.sceneLighting = parseInt(e.target.value);
                      updateViewState();
                      setRenderTick((t) => t + 1);
                    }}
                    className="w-full h-1 bg-[#444] rounded-lg appearance-none cursor-pointer"
                  />
                </div>

                <div className="w-full mb-[8px]">
                  <div className="flex justify-between items-center mb-1">
                    <label className="text-white text-[9px] font-bold uppercase tracking-[1.5px]">
                      Cabin Illumination
                    </label>
                    <span className="text-[9px] font-bold text-gray-400">
                      {AppState.interiorLightingLevel}%
                    </span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={AppState.interiorLightingLevel}
                    onChange={(e) => {
                      AppState.interiorLightingLevel = parseInt(e.target.value);
                      updateViewState();
                      setRenderTick((t) => t + 1);
                    }}
                    className="w-full h-1 bg-[#444] rounded-lg appearance-none cursor-pointer accent-blue-500"
                  />
                </div>

                <div className="w-full mb-[8px]">
                  <div className="flex justify-between items-center mb-1">
                    <label className="text-white text-[9px] font-bold uppercase tracking-[1.5px]">
                      Driver Light
                    </label>
                    <span className="text-[9px] font-bold text-gray-400">
                      {AppState.cabLightingLevel}%
                    </span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={AppState.cabLightingLevel}
                    onChange={(e) => {
                      AppState.cabLightingLevel = parseInt(e.target.value);
                      updateViewState();
                      setRenderTick((t) => t + 1);
                    }}
                    className="w-full h-1 bg-[#444] rounded-lg appearance-none cursor-pointer accent-yellow-500"
                  />
                </div>

                <div className="w-full mb-[8px]">
                  <div className="flex justify-between items-center mb-1">
                    <label className="text-white text-[9px] font-bold uppercase tracking-[1.5px]">
                      Headlights
                    </label>
                    <span className="text-[9px] font-bold text-gray-400">
                      {AppState.headlightLevel}%
                    </span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={AppState.headlightLevel}
                    onChange={(e) => {
                      AppState.headlightLevel = parseInt(e.target.value);
                      updateViewState();
                      setRenderTick((t) => t + 1);
                    }}
                    className="w-full h-1 bg-[#444] rounded-lg appearance-none cursor-pointer accent-gray-100"
                  />
                </div>

                <div className="w-full mb-[8px]">
                  <div className="flex justify-between items-center mb-1">
                    <label className="text-white text-[9px] font-bold uppercase tracking-[1.5px]">
                      Tail Lights
                    </label>
                    <span className="text-[9px] font-bold text-gray-400">
                      {AppState.taillightLevel}%
                    </span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={AppState.taillightLevel}
                    onChange={(e) => {
                      AppState.taillightLevel = parseInt(e.target.value);
                      updateViewState();
                      setRenderTick((t) => t + 1);
                    }}
                    className="w-full h-1 bg-[#444] rounded-lg appearance-none cursor-pointer accent-red-500"
                  />
                </div>

                <div className="w-full mb-[8px]">
                  <div className="flex justify-between items-center mb-1">
                    <label className="text-white text-[9px] font-bold uppercase tracking-[1.5px]">
                      Dest. Sign
                    </label>
                    <span className="text-[9px] font-bold text-gray-400">
                      {AppState.destinationSignLevel}%
                    </span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={AppState.destinationSignLevel}
                    onChange={(e) => {
                      AppState.destinationSignLevel = parseInt(e.target.value);
                      updateViewState();
                      setRenderTick((t) => t + 1);
                    }}
                    className="w-full h-1 bg-[#444] rounded-lg appearance-none cursor-pointer accent-orange-500"
                  />
                </div>

                <button
                  className="cursor-pointer px-[14px] py-[10px] border border-[#444] hover:bg-[#dc2626] hover:border-[#ff0000] bg-[#111] text-white text-[10px] font-bold uppercase tracking-[1.5px] transition-[0.15s] w-full text-left flex justify-between items-center mb-[8px]"
                  onClick={() => {
                    AppState.wireframeMode = !AppState.wireframeMode;
                    updateViewState();
                    setRenderTick((t) => t + 1);
                  }}
                >
                  Wireframe Mode{" "}
                  <span
                    className={
                      AppState.wireframeMode
                        ? "font-normal text-green-500"
                        : "font-normal text-[#888]"
                    }
                  >
                    {AppState.wireframeMode ? "ON" : "OFF"}
                  </span>
                </button>

                <div className="grid grid-cols-3 gap-[4px] mt-[10px]">
                  <button
                    className="cursor-pointer px-[8px] py-[8px] border border-[#555] hover:bg-[#333] hover:border-[#fff] bg-[#222] text-white text-[9px] font-bold uppercase tracking-[1.5px] transition-[0.15s] flex justify-center items-center"
                    onClick={handleDownloadGLB}
                  >
                    GLB
                  </button>
                  <button
                    className="cursor-pointer px-[8px] py-[8px] border border-[#555] hover:bg-[#333] hover:border-[#fff] bg-[#222] text-white text-[9px] font-bold uppercase tracking-[1.5px] transition-[0.15s] flex justify-center items-center"
                    onClick={handleDownloadOBJ}
                  >
                    OBJ
                  </button>
                  <button
                    className="cursor-pointer px-[8px] py-[8px] border border-[#555] hover:bg-[#1e40af] hover:border-[#60a5fa] bg-[#1d4ed8] text-white text-[9px] font-bold uppercase tracking-[1.5px] transition-[0.15s] flex justify-center items-center"
                    onClick={handleDownloadHTML}
                  >
                    HTML
                  </button>
                </div>

                <button
                  className="cursor-pointer px-[14px] py-[10px] border border-[#444] hover:bg-[#dc2626] hover:border-[#ff0000] bg-[#222] text-white text-[10px] font-bold uppercase tracking-[1.5px] transition-[0.15s] w-full mt-[10px] flex justify-center items-center"
                  onClick={handleReset}
                >
                  RESET VIEWPORT
                </button>
              </div>
            </div>
          ) : (
            <div className="pointer-events-auto bg-[#080808F2] border border-[#333] p-5 w-80 shadow-[0_4px_30px_rgba(0,0,0,0.8)] backdrop-blur-md border-l-[3px] border-l-[#3b82f6] overflow-y-auto max-h-[90vh]">
              <button
                className="cursor-pointer px-[10px] py-[8px] border border-[#444] hover:bg-[#222] bg-[#111] text-white text-[10px] font-bold uppercase tracking-[1.5px] transition-[0.15s] w-full flex items-center mb-[15px]"
                onClick={() => handleSetViewMode("config")}
              >
                <ChevronLeft className="w-4 h-4 mr-2" /> BACK TO CONFIG
              </button>

              <h1 className="text-xl font-black mb-[10px] tracking-tight">
                DYNAMIC SCENE
              </h1>

              <div className="mb-[15px] border-b border-[#222] pb-[15px]">
                <div className="flex justify-between text-[9px] text-[#777] uppercase tracking-[2px] mb-[2px]">
                  <span>Scenery AI Trains</span>
                  <span>{(window as any)._numSceneryTrains ?? 0}</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="8"
                  value={(window as any)._numSceneryTrains ?? 0}
                  onChange={(e) => {
                    (window as any)._numSceneryTrains = parseInt(e.target.value);
                    updateSceneryCount();
                    setRenderTick(t => t + 1);
                  }}
                  className="w-full h-1 mb-2 bg-[#333] appearance-none rounded-full outline-none [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:bg-[#00f0ff] [&::-webkit-slider-thumb]:rounded-full cursor-pointer"
                />
                <button
                  onClick={() => {
                    AppState.sceneryAI = !AppState.sceneryAI;
                    setRenderTick(t => t + 1);
                  }}
                  className={`w-full py-1 text-[10px] uppercase tracking-[1px] rounded transition-all duration-300 ${AppState.sceneryAI ? 'bg-[#00f0ff] text-black font-bold' : 'bg-[#111] text-[#777] hover:bg-[#222]'}`}
                >
                  {AppState.sceneryAI ? 'Scenery AI Driving: ON' : 'Scenery AI Driving: OFF'}
                </button>
              </div>

              <div className="mb-[15px] p-3 border border-[#333] bg-[#111] rounded-md">
                <span className="text-[9px] text-[#777] uppercase tracking-[2px] mb-[5px] block">
                  Train Controls
                </span>
                <div className="flex gap-2 mb-3">
                  <button
                    onClick={() => {
                      AppState.direction = 1;
                      setRenderTick((t) => t + 1);
                    }}
                    className={`flex-1 py-2 text-[10px] font-bold border ${AppState.direction === 1 ? "border-blue-500 bg-blue-900/30 text-blue-400" : "border-[#444] bg-[#222] text-gray-400"}`}
                  >
                    FORWARD
                  </button>
                  <button
                    onClick={() => {
                      AppState.direction = -1;
                      setRenderTick((t) => t + 1);
                    }}
                    className={`flex-1 py-2 text-[10px] font-bold border ${AppState.direction === -1 ? "border-red-500 bg-red-900/30 text-red-400" : "border-[#444] bg-[#222] text-gray-400"}`}
                  >
                    REVERSE
                  </button>
                </div>

                <div className="w-full">
                  <div className="flex justify-between items-center mb-1">
                    <label className="text-white text-[9px] font-bold uppercase tracking-[1.5px]">
                      Throttle
                    </label>
                    <span className="text-[9px] font-bold text-gray-400">
                      {Math.round(AppState.throttle * 100)}%
                    </span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={AppState.throttle * 100}
                    onChange={(e) => {
                      AppState.throttle = parseInt(e.target.value) / 100;
                      setRenderTick((t) => t + 1);
                    }}
                    className="w-full h-2 bg-[#444] rounded-lg appearance-none cursor-pointer accent-blue-500"
                  />
                </div>

                <div className="mt-3 pt-3 border-t border-[#333]">
                   <button
                    onClick={() => {
                      AppState.autoStop = !AppState.autoStop;
                      setRenderTick(t => t + 1);
                    }}
                    className={`w-full py-1 text-[10px] uppercase tracking-[1px] rounded transition-all duration-300 ${AppState.autoStop ? 'bg-blue-600 text-white font-bold ring-2 ring-blue-400' : 'bg-[#111] text-[#777] border border-[#333]'}`}
                  >
                    Auto Pilot / Auto Stop: {AppState.autoStop ? 'ON' : 'OFF'}
                  </button>
                </div>
              </div>

              <div className="mb-[15px] border-b border-[#222] pb-[15px]">
                <span className="text-[9px] text-[#777] uppercase tracking-[2px] mb-[5px] block">
                  Cameras
                </span>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => {
                      AppState.cameraMode = "free";
                      setRenderTick((t) => t + 1);
                    }}
                    className={`p-2 text-[9px] border ${AppState.cameraMode === "free" ? "border-blue-500 bg-blue-900/40 text-blue-300" : "border-[#333] bg-[#111] text-gray-400"} flex items-center justify-center`}
                  >
                    Free View
                  </button>
                  <button
                    onClick={() => {
                      AppState.cameraMode = "orbit";
                      setRenderTick((t) => t + 1);
                    }}
                    className={`p-2 text-[9px] border ${AppState.cameraMode === "orbit" ? "border-blue-500 bg-blue-900/40 text-blue-300" : "border-[#333] bg-[#111] text-gray-400"} flex items-center justify-center`}
                  >
                    <Eye className="w-3 h-3 mr-1" /> Orbit
                  </button>
                  <button
                    onClick={() => {
                      AppState.cameraMode = "driver";
                      setRenderTick((t) => t + 1);
                    }}
                    className={`p-2 text-[9px] border ${AppState.cameraMode === "driver" ? "border-blue-500 bg-blue-900/40 text-blue-300" : "border-[#333] bg-[#111] text-gray-400"} flex items-center justify-center`}
                  >
                    <CarFront className="w-3 h-3 mr-1" /> Driver
                  </button>
                  <button
                    onClick={() => {
                      AppState.cameraMode = "passengerL";
                      setRenderTick((t) => t + 1);
                    }}
                    className={`p-2 text-[9px] border ${AppState.cameraMode === "passengerL" ? "border-blue-500 bg-blue-900/40 text-blue-300" : "border-[#333] bg-[#111] text-gray-400"} flex items-center justify-center`}
                  >
                    Pass L
                  </button>
                  <button
                    onClick={() => {
                      AppState.cameraMode = "passengerR";
                      setRenderTick((t) => t + 1);
                    }}
                    className={`p-2 text-[9px] border ${AppState.cameraMode === "passengerR" ? "border-blue-500 bg-blue-900/40 text-blue-300" : "border-[#333] bg-[#111] text-gray-400"} flex items-center justify-center`}
                  >
                    Pass R
                  </button>
                  <button
                    onClick={() => {
                      AppState.cameraMode = "passengerFront";
                      setRenderTick((t) => t + 1);
                    }}
                    className={`p-2 text-[9px] border ${AppState.cameraMode === "passengerFront" ? "border-blue-500 bg-blue-900/40 text-blue-300" : "border-[#333] bg-[#111] text-gray-400"} flex items-center justify-center`}
                  >
                    Pass Front
                  </button>
                  <button
                    onClick={() => {
                      AppState.cameraMode = "passengerBack";
                      setRenderTick((t) => t + 1);
                    }}
                    className={`p-2 text-[9px] border ${AppState.cameraMode === "passengerBack" ? "border-blue-500 bg-blue-900/40 text-blue-300" : "border-[#333] bg-[#111] text-gray-400"} flex items-center justify-center`}
                  >
                    Pass Back
                  </button>
                  <button
                    onClick={() => {
                      AppState.cameraMode = "thirdPersonFront";
                      setRenderTick((t) => t + 1);
                    }}
                    className={`p-2 text-[9px] border ${AppState.cameraMode === "thirdPersonFront" ? "border-blue-500 bg-blue-900/40 text-blue-300" : "border-[#333] bg-[#111] text-gray-400"} flex items-center justify-center`}
                  >
                    Ext Front
                  </button>
                  <button
                    onClick={() => {
                      AppState.cameraMode = "thirdPersonRear";
                      setRenderTick((t) => t + 1);
                    }}
                    className={`p-2 text-[9px] border ${AppState.cameraMode === "thirdPersonRear" ? "border-blue-500 bg-blue-900/40 text-blue-300" : "border-[#333] bg-[#111] text-gray-400"} flex items-center justify-center`}
                  >
                    Ext Rear
                  </button>
                  <button
                    onClick={() => {
                      AppState.cameraMode = "trackLevel";
                      setRenderTick((t) => t + 1);
                    }}
                    className={`p-2 text-[9px] border ${AppState.cameraMode === "trackLevel" ? "border-blue-500 bg-blue-900/40 text-blue-300" : "border-[#333] bg-[#111] text-gray-400"} flex items-center justify-center`}
                  >
                    Track Level
                  </button>
                  <button
                    onClick={() => {
                      AppState.cameraMode = "sideFollow";
                      setRenderTick((t) => t + 1);
                    }}
                    className={`p-2 text-[9px] border ${AppState.cameraMode === "sideFollow" ? "border-blue-500 bg-blue-900/40 text-blue-300" : "border-[#333] bg-[#111] text-gray-400"} flex items-center justify-center`}
                  >
                    Side Follow
                  </button>
                  <button
                    onClick={() => {
                      AppState.cameraMode = "fixed";
                      setRenderTick((t) => t + 1);
                    }}
                    className={`p-2 text-[9px] border ${AppState.cameraMode === "fixed" ? "border-blue-500 bg-blue-900/40 text-blue-300" : "border-[#333] bg-[#111] text-gray-400"} flex items-center justify-center`}
                  >
                    Fixed Station
                  </button>
                </div>
              </div>

              <div className="mb-[15px] border-b border-[#222] pb-[15px]">
                <span className="text-[9px] text-[#777] uppercase tracking-[2px] mb-[5px] block">
                  Environment & Weather
                </span>
                <div className="grid grid-cols-2 gap-2 mb-3">
                  <button
                    onClick={() => {
                      AppState.biome = "subway";
                      buildScene();
                      setRenderTick((t) => t + 1);
                    }}
                    className={`p-2 text-[9px] border ${AppState.biome === "subway" ? "border-blue-500 bg-blue-900/40 text-blue-300" : "border-[#333] bg-[#111] text-gray-400"} flex items-center justify-center`}
                  >
                    Stops & Tunnels
                  </button>
                  <button
                    onClick={() => {
                      AppState.biome = "deep_tube";
                      buildScene();
                      setRenderTick((t) => t + 1);
                    }}
                    className={`p-2 text-[9px] border ${AppState.biome === "deep_tube" ? "border-blue-500 bg-blue-900/40 text-blue-300" : "border-[#333] bg-[#111] text-gray-400"} flex items-center justify-center`}
                  >
                    Deep Tube Only
                  </button>
                </div>
              </div>

              <div className="mb-[15px] border-b border-[#222] pb-[15px]">
                <span className="text-[9px] text-[#777] uppercase tracking-[2px] mb-[5px] block">
                  Features & Lights
                </span>
                <button
                  className="px-[10px] py-[6px] border border-[#444] bg-[#111] text-white text-[9px] font-bold uppercase transition-[0.15s] w-full text-left flex justify-between items-center mb-[4px]"
                  onClick={toggleShell}
                >
                  Shell Opacity{" "}
                  <span
                    className={
                      AppState.shellOpaque ? "text-green-500" : "text-red-500"
                    }
                  >
                    {AppState.shellOpaque ? "OPAQUE" : "TRANS"}
                  </span>
                </button>
                <button
                  className="px-[10px] py-[6px] border border-[#444] bg-[#111] text-white text-[9px] font-bold uppercase transition-[0.15s] w-full text-left flex justify-between items-center mb-[4px]"
                  onClick={() => {
                    AppState.doorsOpen = !AppState.doorsOpen;
                    setRenderTick((t) => t + 1);
                  }}
                >
                  Passenger Doors{" "}
                  <span
                    className={
                      AppState.doorsOpen ? "text-green-500" : "text-[#888]"
                    }
                  >
                    {AppState.doorsOpen ? "OPEN" : "CLOSED"}
                  </span>
                </button>
                <button
                  className="px-[10px] py-[6px] border border-[#444] bg-[#111] text-white text-[9px] font-bold uppercase transition-[0.15s] w-full text-left flex justify-between items-center mb-[4px]"
                  onClick={() => {
                    AppState.driverDoorsOpen = !AppState.driverDoorsOpen;
                    setRenderTick((t) => t + 1);
                  }}
                >
                  Driver Doors{" "}
                  <span
                    className={
                      AppState.driverDoorsOpen
                        ? "text-green-500"
                        : "text-[#888]"
                    }
                  >
                    {AppState.driverDoorsOpen ? "OPEN" : "CLOSED"}
                  </span>
                </button>
                <button
                  className="px-[10px] py-[6px] border border-[#444] bg-[#111] text-white text-[9px] font-bold uppercase transition-[0.15s] w-full text-left flex justify-between items-center mb-[4px]"
                  onClick={() => {
                    AppState.sceneLive = !AppState.sceneLive;
                    setRenderTick((t) => t + 1);
                  }}
                >
                  Live Scene Assets{" "}
                  <span
                    className={
                      AppState.sceneLive ? "text-green-500" : "text-[#888]"
                    }
                  >
                    {AppState.sceneLive ? "LIVE" : "STATIC"}
                  </span>
                </button>
                <button
                  className="px-[10px] py-[6px] border border-[#444] bg-[#111] text-white text-[9px] font-bold uppercase transition-[0.15s] w-full text-left flex justify-between items-center mb-[4px]"
                  onClick={() => {
                    AppState.sceneryAI = !AppState.sceneryAI;
                    setRenderTick((t) => t + 1);
                  }}
                >
                  Scene Trains Autopilot{" "}
                  <span
                    className={
                      AppState.sceneryAI ? "text-green-500" : "text-[#888]"
                    }
                  >
                    {AppState.sceneryAI ? "ON" : "OFF"}
                  </span>
                </button>
                <button
                  className="px-[10px] py-[6px] border border-[#444] bg-[#111] text-white text-[9px] font-bold uppercase transition-[0.15s] w-full text-left flex justify-between items-center mb-[4px]"
                  onClick={() => {
                    AppState.bloomEnabled = !AppState.bloomEnabled;
                    setRenderTick((t) => t + 1);
                  }}
                >
                  Post-Processing{" "}
                  <span
                    className={
                      AppState.bloomEnabled ? "text-green-500" : "text-[#888]"
                    }
                  >
                    {AppState.bloomEnabled ? "ON" : "OFF"}
                  </span>
                </button>
                {AppState.bloomEnabled && (
                  <div className="p-2 border border-[#333] bg-[#0a0a0a] mb-2 space-y-2">
                    <div>
                      <div className="flex justify-between text-[8px] text-gray-500 mb-1">
                        <span>Bloom Strength</span>
                        <span>{AppState.bloomStrength.toFixed(2)}</span>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="3"
                        step="0.05"
                        value={AppState.bloomStrength}
                        onChange={(e) => {
                          AppState.bloomStrength = parseFloat(e.target.value);
                          updateViewState();
                          setRenderTick((t) => t + 1);
                        }}
                        className="w-full h-1 bg-[#444] accent-[#dc2626]"
                      />
                    </div>
                    <div>
                      <div className="flex justify-between text-[8px] text-gray-500 mb-1">
                        <span>Bloom Threshold</span>
                        <span>{AppState.bloomThreshold.toFixed(2)}</span>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="2"
                        step="0.05"
                        value={AppState.bloomThreshold}
                        onChange={(e) => {
                          AppState.bloomThreshold = parseFloat(e.target.value);
                          updateViewState();
                          setRenderTick((t) => t + 1);
                        }}
                        className="w-full h-1 bg-[#444] accent-[#dc2626]"
                      />
                    </div>
                  </div>
                )}

                <button
                  className="px-[10px] py-[6px] border border-[#444] bg-[#111] text-white text-[9px] font-bold uppercase transition-[0.15s] w-full text-left flex justify-between items-center mb-[4px]"
                  onClick={() => {
                    AppState.hdBogies = !AppState.hdBogies;
                    buildScene();
                    setRenderTick((t) => t + 1);
                  }}
                >
                  HD Bogies{" "}
                  <span
                    className={
                      AppState.hdBogies ? "text-green-500" : "text-[#888]"
                    }
                  >
                    {AppState.hdBogies ? "ON" : "OFF"}
                  </span>
                </button>

                <div className="space-y-3">
                  <div>
                    <div className="flex justify-between text-[9px] text-gray-400 mb-1">
                      <span>Scene Day/Night</span>
                      <span>{AppState.sceneLighting}%</span>
                    </div>
                    <input
                      type="range"
                      min="-50"
                      max="250"
                      value={AppState.sceneLighting}
                      onChange={(e) => {
                        AppState.sceneLighting = parseInt(e.target.value);
                        updateViewState();
                        setRenderTick((t) => t + 1);
                      }}
                      className="w-full h-1 bg-[#444]"
                    />
                  </div>
                  <div>
                    <div className="flex justify-between text-[9px] text-gray-400 mb-1">
                      <span>Cabin Illumination</span>
                      <span>{AppState.interiorLightingLevel}%</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={AppState.interiorLightingLevel}
                      onChange={(e) => {
                        AppState.interiorLightingLevel = parseInt(
                          e.target.value,
                        );
                        updateViewState();
                        setRenderTick((t) => t + 1);
                      }}
                      className="w-full h-1 bg-[#444]"
                    />
                  </div>
                  <div>
                    <div className="flex justify-between text-[9px] text-gray-400 mb-1">
                      <span>Cab Light</span>
                      <span>{AppState.cabLightingLevel}%</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={AppState.cabLightingLevel}
                      onChange={(e) => {
                        AppState.cabLightingLevel = parseInt(e.target.value);
                        updateViewState();
                        setRenderTick((t) => t + 1);
                      }}
                      className="w-full h-1 bg-[#444]"
                    />
                  </div>
                  <div>
                    <div className="flex justify-between text-[9px] text-gray-400 mb-1">
                      <span>Headlights</span>
                      <span>{AppState.headlightLevel}%</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={AppState.headlightLevel}
                      onChange={(e) => {
                        AppState.headlightLevel = parseInt(e.target.value);
                        updateViewState();
                        setRenderTick((t) => t + 1);
                      }}
                      className="w-full h-1 bg-[#444]"
                    />
                  </div>
                  <div>
                    <div className="flex justify-between text-[9px] text-gray-400 mb-1">
                      <span>Tail Lights</span>
                      <span>{AppState.taillightLevel}%</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={AppState.taillightLevel}
                      onChange={(e) => {
                        AppState.taillightLevel = parseInt(e.target.value);
                        updateViewState();
                        setRenderTick((t) => t + 1);
                      }}
                      className="w-full h-1 bg-[#444]"
                    />
                  </div>
                  <div>
                    <div className="flex justify-between text-[9px] text-gray-400 mb-1">
                      <span>Dest. Sign</span>
                      <span>{AppState.destinationSignLevel}%</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={AppState.destinationSignLevel}
                      onChange={(e) => {
                        AppState.destinationSignLevel = parseInt(
                          e.target.value,
                        );
                        updateViewState();
                        setRenderTick((t) => t + 1);
                      }}
                      className="w-full h-1 bg-[#444]"
                    />
                  </div>
                </div>
              </div>

              <div>
                <span className="text-[9px] text-[#777] uppercase tracking-[2px] mb-[8px] flex items-center">
                  <Zap className="w-3 h-3 mr-1 text-orange-500" /> Pending
                  High-Def Assets
                </span>
                <div className="space-y-2">
                  {REQUIRED_MODELS.map((model) => (
                    <div
                      key={model.id}
                      className="bg-[#111] border border-[#222] p-2 text-left rounded"
                    >
                      <div className="text-[9px] text-[#aaa] font-bold">
                        {model.id}
                      </div>
                      <div className="text-[8px] text-[#666]">{model.desc}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Right Panel */}
          <div className="pointer-events-auto bg-[#080808F2] border border-[#333] p-[20px] text-right backdrop-blur-md shadow-[0_4px_30px_rgba(0,0,0,0.8)]">
            <span className="text-[9px] text-[#777] uppercase tracking-[2px] mb-2 block">
              Controles [Controls]
            </span>
            <p className="text-[9px] text-[#888] font-mono m-0">
              ORBIT: LMB | PAN: RMB | ZOOM: SCR
            </p>
            <p className="text-[9px] text-yellow-500 font-mono mt-1 m-0">
              HOLD SHIFT + LMB FOR TORCH
            </p>
            {AppState.viewMode === "scene" && (
              <p className="text-[9px] text-blue-400 font-mono mt-2 m-0 bg-blue-900/20 p-2 border border-blue-900/50 rounded">
                SCENE IS DYNAMIC
                <br />
                SPEED: {Math.round(Math.abs(AppState.speed) * 3.6)} km/h
              </p>
            )}
          </div>
        </div>

        {/* Bottom Footer Panel */}
        <div className="pointer-events-auto bg-[#080808F2] border border-[#333] p-[20px] px-16 border-t-[1px] border-t-red-800 backdrop-blur-md shadow-[0_4px_30px_rgba(0,0,0,0.8)] self-center mb-1">
          <p className="text-[10px] tracking-[0.2em] text-center text-gray-400 m-0">
            1992 TUBE STOCK | LONDON UNDERGROUND
          </p>
        </div>
      </div>
    </div>
  );
}
