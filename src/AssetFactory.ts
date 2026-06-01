import * as THREE from "three";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";

function createBrickTexture() {
  const canvas = document.createElement("canvas");
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext("2d");
  ctx.fillStyle = "#333333";
  ctx.fillRect(0, 0, 512, 512);
  const rows = 16;
  const cols = 8;
  const rowHeight = 512 / rows;
  const colWidth = 512 / cols;
  const mortarGap = 4;
  for (let y = 0; y < rows; y++) {
    const offset = y % 2 === 0 ? 0 : colWidth / 2;
    for (let x = -1; x < cols + 1; x++) {
      const r = 80 + Math.random() * 40;
      const g = 25 + Math.random() * 20;
      const b = 20 + Math.random() * 20;
      ctx.fillStyle = `rgb(${r},${g},${b})`;
      ctx.fillRect(
        x * colWidth + offset + mortarGap / 2,
        y * rowHeight + mortarGap / 2,
        colWidth - mortarGap,
        rowHeight - mortarGap,
      );
    }
  }
  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  return tex;
}

function createGravelTexture() {
  const canvas = document.createElement("canvas");
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext("2d");
  ctx.fillStyle = "#0a0a0a";
  ctx.fillRect(0, 0, 512, 512);
  for (let i = 0; i < 30000; i++) {
    const v = 15 + Math.random() * 70;
    ctx.fillStyle = `rgb(${v},${v},${v})`;
    ctx.fillRect(
      Math.random() * 512,
      Math.random() * 512,
      1 + Math.random() * 4,
      1 + Math.random() * 4,
    );
  }
  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  return tex;
}

function createCopperTexture() {
  const canvas = document.createElement("canvas");
  canvas.width = 1024;
  canvas.height = 1024;
  const ctx = canvas.getContext("2d");
  ctx.fillStyle = "#1e3834";
  ctx.fillRect(0, 0, 1024, 1024);
  for (let i = 0; i < 40000; i++) {
    const v = Math.random();
    ctx.fillStyle = v > 0.7 ? "#3b7269" : v > 0.4 ? "#2c4c47" : "#1a2e2b";
    ctx.fillRect(
      Math.random() * 1024,
      Math.random() * 1024,
      3 + Math.random() * 6,
      3 + Math.random() * 6,
    );
  }
  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  return tex;
}

function createRoundelTexture() {
  const canvas = document.createElement("canvas");
  canvas.width = 1024;
  canvas.height = 1024;
  const ctx = canvas.getContext("2d");
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, 1024, 1024);
  ctx.strokeStyle = "#cc0000";
  ctx.lineWidth = 140;
  ctx.beginPath();
  ctx.arc(512, 512, 380, 0, Math.PI * 2);
  ctx.stroke();
  ctx.fillStyle = "#000099";
  ctx.fillRect(80, 412, 864, 200);
  ctx.fillStyle = "#ffffff";
  ctx.font = 'bold 90px "Arial", sans-serif';
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("BAKER STREET", 512, 512);
  return new THREE.CanvasTexture(canvas);
}

function createPlatform5BrickTexture() {
  const canvas = document.createElement("canvas");
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext("2d");
  ctx.fillStyle = "#a69e8f";
  ctx.fillRect(0, 0, 512, 512);
  const rows = 16;
  const cols = 8;
  const rowHeight = 512 / rows;
  const colWidth = 512 / cols;
  const mortarGap = 6;
  for (let y = 0; y < rows; y++) {
    const offset = y % 2 === 0 ? 0 : colWidth / 2;
    for (let x = -1; x < cols + 1; x++) {
      const lum = 160 + Math.random() * 50;
      ctx.fillStyle = `rgb(${lum}, ${lum * 0.9}, ${lum * 0.7})`;
      ctx.fillRect(
        x * colWidth + offset + mortarGap / 2,
        y * rowHeight + mortarGap / 2,
        colWidth - mortarGap,
        rowHeight - mortarGap,
      );
    }
  }
  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  return tex;
}

function createScreenTexture(platformNum, dest) {
  const canvas = document.createElement("canvas");
  canvas.width = 512;
  canvas.height = 128;
  const ctx = canvas.getContext("2d");
  ctx.fillStyle = "#050505";
  ctx.fillRect(0, 0, 512, 128);
  ctx.fillStyle = "#ff8800";
  ctx.font = "bold 36px monospace";
  ctx.fillText(`${platformNum}  PLATFORM ${platformNum}     1 MIN`, 20, 45);
  ctx.fillStyle = "#aa5500";
  ctx.font = "bold 28px monospace";
  ctx.fillText(`2  ${dest.padEnd(14, " ")} 5 MIN`, 20, 95);
  return new THREE.CanvasTexture(canvas);
}

function createWayOutTexture() {
  const canvas = document.createElement("canvas");
  canvas.width = 512;
  canvas.height = 128;
  const ctx = canvas.getContext("2d");
  ctx.fillStyle = "#ffcc00";
  ctx.fillRect(0, 0, 512, 128);
  ctx.fillStyle = "#000000";
  ctx.font = 'bold 50px "Arial", sans-serif';
  ctx.fillText("WAY OUT", 20, 75);
  return new THREE.CanvasTexture(canvas);
}

function createMindTheGapTexture() {
  const canvas = document.createElement("canvas");
  canvas.width = 1024;
  canvas.height = 128;
  const ctx = canvas.getContext("2d");
  ctx.fillStyle = "#eedd00";
  ctx.fillRect(0, 0, 1024, 128);
  ctx.fillStyle = "#222222";
  ctx.font = 'bold 70px "Arial", sans-serif';
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("MIND THE GAP", 512, 64);
  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  return tex;
}

function createPosterTexture() {
  const canvas = document.createElement("canvas");
  canvas.width = 512;
  canvas.height = 768;
  const ctx = canvas.getContext("2d");
  const grd = ctx.createLinearGradient(0, 0, 0, 768);
  grd.addColorStop(0, "#4444aa");
  grd.addColorStop(1, "#111155");
  ctx.fillStyle = grd;
  ctx.fillRect(0, 0, 512, 768);
  ctx.fillStyle = "#ffffff";
  ctx.font = "bold 50px sans-serif";
  ctx.textAlign = "center";
  ctx.fillText("VISIT LONDON", 256, 100);
  ctx.font = "30px sans-serif";
  ctx.fillText("Explore the city today", 256, 160);
  ctx.fillStyle = "#ff5555";
  ctx.beginPath();
  ctx.arc(256, 400, 150, 0, Math.PI * 2);
  ctx.fill();
  return new THREE.CanvasTexture(canvas);
}

export const texBrick = createBrickTexture();
export const texGravel = createGravelTexture();
export const texCopper = createCopperTexture();
export const texScreen1 = createScreenTexture(1, "BAKER ST");
export const texScreen2 = createScreenTexture(2, "WATERLOO");
export const texRoundel = createRoundelTexture();
export const texPlatformBrick = createPlatform5BrickTexture();
export const texWayOut = createWayOutTexture();
export const texMindTheGap = createMindTheGapTexture();
export const texPoster = createPosterTexture();

export const tracksideMats = {
  greyMetal: new THREE.MeshStandardMaterial({ color: 0x555555, metalness: 0.7, roughness: 0.5 }),
  darkMetal: new THREE.MeshStandardMaterial({ color: 0x222222, metalness: 0.85, roughness: 0.4 }),
  rustyMetal: new THREE.MeshStandardMaterial({ color: 0x3a2218, metalness: 0.4, roughness: 0.9 }),
  galvanized: new THREE.MeshStandardMaterial({ color: 0x888888, metalness: 0.95, roughness: 0.3 }),
  concrete: new THREE.MeshStandardMaterial({ color: 0x6a6a65, roughness: 1.0 }),
  yellowWarning: new THREE.MeshStandardMaterial({ color: 0xd4a017, roughness: 0.6 }),
  redSignal: new THREE.MeshStandardMaterial({ color: 0xff1111, emissive: 0x550000, roughness: 0.2 }),
  greenSignal: new THREE.MeshStandardMaterial({ color: 0x11ff11, emissive: 0x005500, roughness: 0.2 }),
  blueSignal: new THREE.MeshStandardMaterial({ color: 0x1188ff, emissive: 0x002255, roughness: 0.2 }),
  copper: new THREE.MeshStandardMaterial({ color: 0x8b5a2b, metalness: 0.9, roughness: 0.4 }),
  wood: new THREE.MeshStandardMaterial({ color: 0x2a1604, roughness: 1.0 }),
  blackWire: new THREE.MeshStandardMaterial({ color: 0x080808, roughness: 0.8 }),
  castIron: new THREE.MeshStandardMaterial({ color: 0x1c1c1c, metalness: 0.5, roughness: 0.7 }),
  porcelain: new THREE.MeshStandardMaterial({ color: 0xe0e0e0, metalness: 0.05, roughness: 0.1 }),
  glass: new THREE.MeshStandardMaterial({ color: 0x111111, metalness: 0.9, roughness: 0.1, transparent: true, opacity: 0.7 }),
  white: new THREE.MeshBasicMaterial({ color: 0xffffff }),
};

export const assetMats = {
  woodDark: (m => (m.name = "woodDark", m))(new THREE.MeshStandardMaterial({ color: 0x3d2314, roughness: 0.9 })),
  ironCast: (m => (m.name = "ironCast", m))(new THREE.MeshStandardMaterial({
    color: 0x111111,
    roughness: 0.8,
    metalness: 0.6,
  })),
  brass: (m => (m.name = "brass", m))(new THREE.MeshStandardMaterial({
    color: 0xb5a642,
    roughness: 0.3,
    metalness: 0.8,
  })),
  glassMilkOff: (m => (m.name = "glassMilkOff", m))(new THREE.MeshPhysicalMaterial({
    color: 0xeeeeee,
    roughness: 0.2,
    transmission: 0.2,
    opacity: 0.9,
    transparent: true,
  })),
  glassMilkOn: (m => (m.name = "glassMilkOn", m))(new THREE.MeshStandardMaterial({
    color: 0xffffff,
    emissive: 0xfff5e6,
    emissiveIntensity: 2.0,
  })),
  signageOff: (m => (m.name = "signageOff", m))(new THREE.MeshStandardMaterial({
    map: texRoundel,
    roughness: 0.4,
  })),
  signageOn: (m => (m.name = "signageOn", m))(new THREE.MeshStandardMaterial({
    map: texRoundel,
    emissiveMap: texRoundel,
    emissive: 0xffffff,
    emissiveIntensity: 1.5,
  })),
  bakerBrick: (m => (m.name = "bakerBrick", m))(new THREE.MeshStandardMaterial({
    map: texPlatformBrick,
    roughness: 0.9,
    color: 0xdddddd,
  })),
  readerYellow: (m => (m.name = "readerYellow", m))(new THREE.MeshStandardMaterial({
    color: 0xffcc00,
    roughness: 0.4,
  })),
  readerRing: (m => (m.name = "readerRing", m))(new THREE.MeshStandardMaterial({
    color: 0x00ffff,
    emissive: 0x00ffff,
    emissiveIntensity: 2.5,
  })),
  redMetal: (m => (m.name = "redMetal", m))(new THREE.MeshStandardMaterial({
    color: 0xaa1111,
    metalness: 0.6,
    roughness: 0.4,
  })),
  metal: (m => (m.name = "metal", m))(new THREE.MeshStandardMaterial({
    color: 0x555555,
    metalness: 0.8,
    roughness: 0.4,
  })),
  metalGalvanised: (m => (m.name = "metalGalvanised", m))(new THREE.MeshStandardMaterial({
    color: 0xcccccc,
    metalness: 0.9,
    roughness: 0.3,
  })),
  signalRed: (m => (m.name = "signalRed", m))(new THREE.MeshStandardMaterial({
    color: 0xff0000,
    emissive: 0xff0000,
    emissiveIntensity: 3.0,
  })),
  signalAmber: (m => (m.name = "signalAmber", m))(new THREE.MeshStandardMaterial({
    color: 0xffbf00,
    emissive: 0x332200,
    emissiveIntensity: 0.1,
  })),
  signalGreen: (m => (m.name = "signalGreen", m))(new THREE.MeshStandardMaterial({
    color: 0x00ff00,
    emissive: 0x003300,
    emissiveIntensity: 0.1,
  })),
  cableBlack: (m => (m.name = "cableBlack", m))(new THREE.MeshStandardMaterial({
    color: 0x111111,
    roughness: 0.9,
    metalness: 0.2,
  })),
  cableOrange: (m => (m.name = "cableOrange", m))(new THREE.MeshStandardMaterial({
    color: 0xdd5500,
    roughness: 0.8,
    metalness: 0.1,
  })),
  cctvGrey: (m => (m.name = "cctvGrey", m))(new THREE.MeshStandardMaterial({
    color: 0x999999,
    metalness: 0.3,
    roughness: 0.4,
  })),
  cctvGlass: (m => (m.name = "cctvGlass", m))(new THREE.MeshStandardMaterial({
    color: 0x020202,
    roughness: 0.05,
    metalness: 0.95,
  })),
  wayOutMat: (m => (m.name = "wayOutMat", m))(new THREE.MeshStandardMaterial({ map: texWayOut, roughness: 0.5 })),
  fanBladeMat: (m => (m.name = "fanBladeMat", m))(new THREE.MeshLambertMaterial({ color: 0x1a1a1a })),
  fanCasingMat: (m => (m.name = "fanCasingMat", m))(new THREE.MeshStandardMaterial({
    color: 0x333333,
    metalness: 0.7,
    roughness: 0.6,
  })),
  wireMesh: (m => (m.name = "wireMesh", m))(new THREE.MeshBasicMaterial({ color: 0x222222, wireframe: true })),
  irRing: (m => (m.name = "irRing", m))(new THREE.MeshStandardMaterial({
    color: 0xff0000,
    emissive: 0xff0000,
    emissiveIntensity: 1.0,
  })),
  posterMat: (m => (m.name = "posterMat", m))(new THREE.MeshStandardMaterial({ map: texPoster, roughness: 0.2 })),
};

export const envMats = {
  gravel: new THREE.MeshStandardMaterial({
    map: texGravel,
    roughness: 1.0,
    color: 0x888888,
  }),
  brick: new THREE.MeshStandardMaterial({
    map: texBrick,
    roughness: 0.9,
    color: 0xdddddd,
  }),
  concrete: new THREE.MeshStandardMaterial({
    color: 0x444444,
    roughness: 0.9,
    side: THREE.DoubleSide,
  }),
  concreteDark: new THREE.MeshStandardMaterial({
    color: 0x1c1c1c,
    roughness: 0.9,
  }),
  platform: new THREE.MeshStandardMaterial({ color: 0x555555, roughness: 0.8 }),
  tactile: new THREE.MeshStandardMaterial({
    map: texMindTheGap,
    color: 0xddaa00,
    roughness: 0.6,
  }),
  track: new THREE.MeshStandardMaterial({
    color: 0x2a2a2a,
    metalness: 0.7,
    roughness: 0.4,
  }),
  sleeper: new THREE.MeshStandardMaterial({ color: 0x1a1510, roughness: 1.0 }),
  tunnelLight: new THREE.MeshStandardMaterial({
    color: 0xff8800,
    emissive: 0xff6600,
    emissiveIntensity: 3.0,
  }),
  stationLight: new THREE.MeshStandardMaterial({
    color: 0xffffee,
    emissive: 0xffffee,
    emissiveIntensity: 3.0,
  }),
  metal: new THREE.MeshStandardMaterial({
    color: 0x333333,
    metalness: 0.8,
    roughness: 0.4,
  }),
  redMetal: new THREE.MeshStandardMaterial({
    color: 0x9b1b1b,
    metalness: 0.4,
    roughness: 0.6,
  }),
  copper: new THREE.MeshStandardMaterial({
    map: texCopper,
    metalness: 0.5,
    roughness: 0.6,
  }),
  infoScreen1: new THREE.MeshStandardMaterial({
    map: texScreen1,
    emissiveMap: texScreen1,
    emissive: 0xffffff,
    emissiveIntensity: 2.0,
  }),
  infoScreen2: new THREE.MeshStandardMaterial({
    map: texScreen2,
    emissiveMap: texScreen2,
    emissive: 0xffffff,
    emissiveIntensity: 2.0,
  }),
  rubbishBinMat: new THREE.MeshStandardMaterial({
    color: 0x111111,
    metalness: 0.5,
    roughness: 0.8,
  }),
  ticketMachineMat: new THREE.MeshStandardMaterial({
    color: 0x0033cc,
    metalness: 0.3,
    roughness: 0.4,
  }),
};

export class AssetFactory {
  static buildHeritageBench() {
    const group = new THREE.Group();
    const slatGeo = new THREE.BoxGeometry(2.4, 0.04, 0.08);
    for (let i = 0; i < 7; i++) {
      const slat = new THREE.Mesh(slatGeo, assetMats.woodDark);
      slat.position.set(0, 0.45, -0.25 + i * 0.09);
      slat.castShadow = true;
      group.add(slat);
    }
    for (let i = 0; i < 5; i++) {
      const slat = new THREE.Mesh(slatGeo, assetMats.woodDark);
      slat.position.set(0, 0.55 + i * 0.09, -0.32);
      slat.rotation.x = Math.PI / 12;
      slat.castShadow = true;
      group.add(slat);
    }
    const legShape = new THREE.Shape();
    legShape.moveTo(0.35, 0);
    legShape.lineTo(-0.25, 0);
    legShape.lineTo(-0.25, 0.4);
    legShape.lineTo(-0.35, 0.45);
    legShape.lineTo(0.38, 1.0);
    legShape.lineTo(0.45, 0.4);
    legShape.lineTo(0.35, 0);
    const extrudeSettings = {
      depth: 0.06,
      bevelEnabled: true,
      bevelSegments: 2,
      steps: 2,
      bevelSize: 0.01,
      bevelThickness: 0.01,
    };
    const legGeo = new THREE.ExtrudeGeometry(legShape, extrudeSettings);
    [-1.1, 0, 1.1].forEach((x) => {
      const leg = new THREE.Mesh(legGeo, assetMats.ironCast);
      leg.position.set(x - 0.03, 0, -0.03);
      leg.rotation.y = Math.PI / 2;
      leg.castShadow = true;
      group.add(leg);
    });
    return group;
  }

  static buildCCTV_Dome_Ceiling() {
    const group = new THREE.Group();
    const base = new THREE.Mesh(
      new THREE.CylinderGeometry(0.2, 0.2, 0.05, 16),
      assetMats.cctvGrey,
    );
    const dome = new THREE.Mesh(
      new THREE.SphereGeometry(0.18, 16, 16, 0, Math.PI * 2, 0, Math.PI / 2),
      assetMats.cctvGlass,
    );
    dome.position.y = -0.02;
    dome.rotation.x = Math.PI;
    base.castShadow = true;
    group.add(base, dome);
    return group;
  }

  static buildCCTV_Dome_Wall() {
    const group = new THREE.Group();
    const arm = new THREE.Mesh(
      new THREE.CylinderGeometry(0.04, 0.04, 0.3),
      assetMats.metal,
    );
    arm.rotation.x = Math.PI / 2;
    arm.position.z = 0.15;
    arm.castShadow = true;
    const head = this.buildCCTV_Dome_Ceiling();
    head.position.set(0, -0.05, 0.3);
    head.rotation.x = Math.PI / 4;
    group.add(arm, head);
    return group;
  }

  static buildCCTV_PTZ() {
    const group = new THREE.Group();
    const arm = new THREE.Mesh(
      new THREE.BoxGeometry(0.1, 0.1, 0.4),
      assetMats.metal,
    );
    arm.position.set(0, 0.4, 0.2);
    arm.castShadow = true;
    const housing = new THREE.Mesh(
      new THREE.CylinderGeometry(0.15, 0.15, 0.25, 16),
      assetMats.cctvGrey,
    );
    housing.position.set(0, 0.25, 0.4);
    housing.rotation.x = Math.PI / 8;
    housing.castShadow = true;
    const dome = new THREE.Mesh(
      new THREE.SphereGeometry(0.14, 16, 16, 0, Math.PI * 2, 0, Math.PI / 2),
      assetMats.cctvGlass,
    );
    dome.position.y = -0.12;
    dome.rotation.x = Math.PI;
    housing.add(dome);
    group.add(arm, housing);
    return group;
  }

  static buildExtractorFan() {
    const fanGroup = new THREE.Group();
    const casingGeo = new THREE.CylinderGeometry(1.4, 1.4, 1.0, 32, 1, true);
    const casing = new THREE.Mesh(casingGeo, assetMats.fanCasingMat);
    casing.rotation.x = Math.PI / 2;
    casing.castShadow = true;
    const grilleGeo = new THREE.CircleGeometry(1.4, 32);
    const grilleF = new THREE.Mesh(grilleGeo, assetMats.wireMesh);
    grilleF.position.z = 0.5;
    const grilleB = new THREE.Mesh(grilleGeo, assetMats.wireMesh);
    grilleB.position.z = -0.5;
    const motorGeo = new THREE.CylinderGeometry(0.3, 0.3, 0.6, 16);
    const motor = new THREE.Mesh(motorGeo, assetMats.metal);
    motor.rotation.x = Math.PI / 2;
    motor.castShadow = true;
    const strutGeo = new THREE.CylinderGeometry(0.03, 0.03, 2.8, 8);
    const strut1 = new THREE.Mesh(strutGeo, assetMats.metal);
    strut1.castShadow = true;
    const strut2 = strut1.clone();
    strut2.rotation.z = Math.PI / 2;
    const bladeGeo = new THREE.BoxGeometry(0.3, 1.0, 0.02);
    const rotorGroup = new THREE.Group();
    for (let i = 0; i < 8; i++) {
      const blade = new THREE.Mesh(bladeGeo, assetMats.fanBladeMat);
      blade.position.y = 0.6;
      blade.rotation.x = 0.6;
      blade.castShadow = true;
      const pivot = new THREE.Group();
      pivot.rotation.z = ((Math.PI * 2) / 8) * i;
      pivot.add(blade);
      rotorGroup.add(pivot);
    }
    rotorGroup.position.z = 0.15;
    fanGroup.add(casing, grilleF, grilleB, motor, strut1, strut2, rotorGroup);
    fanGroup.userData = { isFan: true, rotor: rotorGroup };
    return fanGroup;
  }

  static buildPipingRun_Standard(length = 10.0) {
    const group = new THREE.Group();
    const geo = Array.from({length: 3}, (_, i) => {
      const p = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, length, 16), assetMats.metal);
      p.rotation.x = Math.PI / 2;
      p.position.set(0, i * 0.25, 0);
      return p;
    });
    group.add(...geo);
    const bracketGeo = new THREE.BoxGeometry(0.1, 0.8, 0.2);
    for (let z = -length / 2 + 1; z <= length / 2; z += 2.5) {
      const bracket = new THREE.Mesh(bracketGeo, assetMats.ironCast);
      bracket.position.set(-0.05, 0.25, z);
      bracket.castShadow = true;
      group.add(bracket);
    }
    return group;
  }

  static buildPipingRun_Standard_Geo(length = 10.0) {
     const geos = [];
     const pGeo = new THREE.CylinderGeometry(0.08, 0.08, length, 16).rotateX(Math.PI / 2);
     for(let i=0; i<3; i++) {
        const g = pGeo.clone().translate(0, i * 0.25, 0);
        geos.push(g);
     }
     const bGeo = new THREE.BoxGeometry(0.1, 0.8, 0.2);
     for (let z = -length / 2 + 1; z <= length / 2; z += 2.5) {
        geos.push(bGeo.clone().translate(-0.05, 0.25, z));
     }
     return mergeGeometries(geos.map(g => g.index ? g.toNonIndexed() : g.clone()));
  }

  static buildWallCables_Sagging(length = 10.0) {
    const group = new THREE.Group();
    class CustomSagCurve extends THREE.Curve<THREE.Vector3> {
      len: number;
      constructor(len: number) {
        super();
        this.len = len;
      }
      getPoint(t: number, optionalTarget = new THREE.Vector3()) {
        const ty = -Math.sin(t * Math.PI) * 0.2;
        return optionalTarget.set(0, ty, (t - 0.5) * this.len);
      }
    }
    const bracketSpacing = 2.5;
    const bracketGeo = new THREE.BoxGeometry(0.2, 0.4, 0.1);
    for (let z = -length / 2; z <= length / 2; z += bracketSpacing) {
      const bracket = new THREE.Mesh(bracketGeo, assetMats.metal);
      bracket.position.set(-0.05, -0.1, z);
      bracket.castShadow = true;
      group.add(bracket);
    }
    for (let s = 0; s < length / bracketSpacing; s++) {
      const path = new CustomSagCurve(bracketSpacing);
      const cableGeo = new THREE.TubeGeometry(path, 12, 0.02, 8, false);
      for (let i = 0; i < 4; i++) {
        const cable = new THREE.Mesh(cableGeo, assetMats.cableBlack);
        cable.position.set(
          0.05,
          -0.1 - i * 0.04,
          -length / 2 + s * bracketSpacing + bracketSpacing / 2,
        );
        cable.castShadow = true;
        group.add(cable);
      }
    }
    return group;
  }

  static buildWallCables_Sagging_Geo(length = 10.0) {
    class CustomSagCurve extends THREE.Curve<THREE.Vector3> {
      len: number;
      constructor(len: number) { super(); this.len = len; }
      getPoint(t: number, optionalTarget = new THREE.Vector3()) {
        return optionalTarget.set(0, -Math.sin(t * Math.PI) * 0.2, (t - 0.5) * this.len);
      }
    }
    const bracketSpacing = 2.5;
    const geos = [];
    const bGeo = new THREE.BoxGeometry(0.2, 0.4, 0.1);
    for (let z = -length / 2; z <= length / 2; z += bracketSpacing) {
       geos.push(bGeo.clone().translate(-0.05, -0.1, z));
    }
    for (let s = 0; s < length / bracketSpacing; s++) {
      const path = new CustomSagCurve(bracketSpacing);
      const cGeo = new THREE.TubeGeometry(path, 12, 0.02, 8, false);
      for (let i = 0; i < 4; i++) {
        geos.push(cGeo.clone().translate(0.05, -0.1 - i * 0.04, -length / 2 + s * bracketSpacing + bracketSpacing / 2));
      }
    }
    return mergeGeometries(geos.map(g => g.index ? g.toNonIndexed() : g.clone()));
  }

  static buildHVACDuct_Industrial(length = 10.0) {
    const group = new THREE.Group();
    const ductGeo = new THREE.BoxGeometry(0.8, 0.6, length);
    const duct = new THREE.Mesh(ductGeo, assetMats.metalGalvanised);
    duct.castShadow = true;
    group.add(duct);
    const ribGeo = new THREE.BoxGeometry(0.85, 0.65, 0.05);
    for (let z = -length / 2 + 0.5; z <= length / 2; z += 1.5) {
      const rib = new THREE.Mesh(ribGeo, assetMats.metal);
      rib.position.z = z;
      rib.castShadow = true;
      group.add(rib);
    }
    return group;
  }

  static buildHVACDuct_Industrial_Geo(length = 10.0) {
     const geos = [];
     geos.push(new THREE.BoxGeometry(0.8, 0.6, length));
     const rGeo = new THREE.BoxGeometry(0.85, 0.65, 0.05);
     for (let z = -length / 2 + 0.5; z <= length / 2; z += 1.5) {
        geos.push(rGeo.clone().translate(0, 0, z));
     }
     return mergeGeometries(geos.map(g => g.index ? g.toNonIndexed() : g.clone()));
  }

  static buildRoundelSign(isOn) {
    const g = new THREE.Group();
    const frame = new THREE.Mesh(
      new THREE.CylinderGeometry(0.85, 0.85, 0.1, 64).rotateX(Math.PI / 2),
      assetMats.brass,
    );
    frame.castShadow = true;
    const faceMat = isOn ? assetMats.signageOn : assetMats.signageOff;
    const faceF = new THREE.Mesh(new THREE.CircleGeometry(0.8, 64), faceMat);
    faceF.position.z = 0.051;
    const faceB = new THREE.Mesh(new THREE.CircleGeometry(0.8, 64), faceMat);
    faceB.rotation.y = Math.PI;
    faceB.position.z = -0.051;
    const b = new THREE.Mesh(
      new THREE.BoxGeometry(0.05, 0.5, 0.05),
      assetMats.ironCast,
    );
    b.position.y = 1.0;
    b.castShadow = true;
    g.add(frame, faceF, faceB, b);
    return g;
  }

  static buildOysterReader() {
    const g = new THREE.Group();
    const p = new THREE.Mesh(
      new THREE.CylinderGeometry(0.08, 0.08, 1.1, 16),
      assetMats.ironCast,
    );
    p.position.y = 0.55;
    p.castShadow = true;
    const h = new THREE.Mesh(
      new THREE.BoxGeometry(0.3, 0.15, 0.4),
      assetMats.ironCast,
    );
    h.position.set(0, 1.15, 0);
    h.rotation.x = Math.PI / 8;
    h.castShadow = true;
    const pad = new THREE.Mesh(
      new THREE.CircleGeometry(0.12, 32),
      assetMats.readerYellow,
    );
    pad.position.set(0, 1.23, 0.02);
    pad.rotation.x = -Math.PI / 2 + Math.PI / 8;
    const rng = new THREE.Mesh(
      new THREE.RingGeometry(0.09, 0.11, 32),
      assetMats.readerRing,
    );
    rng.position.set(0, 1.231, 0.02);
    rng.rotation.x = -Math.PI / 2 + Math.PI / 8;
    g.add(p, h, pad, rng);
    return g;
  }

  static buildWayOutSign() {
    const g = new THREE.Group();
    const s = new THREE.Mesh(
      new THREE.BoxGeometry(2.0, 0.5, 0.05),
      assetMats.wayOutMat,
    );
    s.castShadow = true;
    g.add(s);
    return g;
  }

  static buildGlobeLamp(isOn) {
    const g = new THREE.Group();
    const globeMat = isOn ? assetMats.glassMilkOn : assetMats.glassMilkOff;
    const globe = new THREE.Mesh(
      new THREE.SphereGeometry(0.3, 32, 32),
      globeMat,
    );
    globe.position.y = 3.0;
    if (isOn) {
      const marker = new THREE.Object3D();
      marker.position.y = 3.0;
      marker.userData.wantsLight = true;
      marker.userData.isStationLight = true;
      g.add(marker);
    }
    const post = new THREE.Mesh(
      new THREE.CylinderGeometry(0.05, 0.1, 3.0, 16),
      assetMats.ironCast,
    );
    post.position.y = 1.5;
    const base = new THREE.Mesh(
      new THREE.CylinderGeometry(0.2, 0.3, 0.4, 16),
      assetMats.ironCast,
    );
    base.position.y = 0.2;
    g.add(globe, post, base);
    return g;
  }

  static buildCableTray_Bundle(length = 10.0) {
    const group = new THREE.Group();
    const trayGeo = new THREE.BoxGeometry(0.4, 0.05, length);
    const tray = new THREE.Mesh(trayGeo, assetMats.metalGalvanised);
    group.add(tray);
    const wireGeo = new THREE.CylinderGeometry(0.015, 0.015, length, 8);
    wireGeo.rotateX(Math.PI / 2);
    for (let i = 0; i < 12; i++) {
      const wireMat =
        Math.random() > 0.8 ? assetMats.cableOrange : assetMats.cableBlack;
      const wire = new THREE.Mesh(wireGeo, wireMat);
      wire.position.set(
        (Math.random() - 0.5) * 0.3,
        0.04 + Math.random() * 0.02,
        0,
      );
      group.add(wire);
    }
    return group;
  }

  static buildCableTray_Bundle_Geo(length = 10.0) {
    const geos = [];
    geos.push(new THREE.BoxGeometry(0.4, 0.05, length));
    const wGeo = new THREE.CylinderGeometry(0.015, 0.015, length, 8).rotateX(Math.PI / 2);
    for (let i = 0; i < 12; i++) {
      geos.push(wGeo.clone().translate((Math.random() - 0.5) * 0.3, 0.04 + Math.random() * 0.02, 0));
    }
    return mergeGeometries(geos.map(g => g.index ? g.toNonIndexed() : g.clone()));
  }

  static buildVerticalConduit_Drop() {
    const group = new THREE.Group();
    const pipeGeo = new THREE.CylinderGeometry(0.05, 0.05, 6.0, 16);
    const pipe = new THREE.Mesh(pipeGeo, assetMats.metal);
    pipe.position.y = 3.0;
    const boxGeo = new THREE.BoxGeometry(0.3, 0.4, 0.15);
    const junction = new THREE.Mesh(boxGeo, assetMats.ironCast);
    junction.position.y = 0.2;
    group.add(pipe, junction);
    return group;
  }

  static buildCCTV_Box() {
    const group = new THREE.Group();
    const bracket = new THREE.Mesh(
      new THREE.BoxGeometry(0.05, 0.4, 0.05),
      assetMats.metal,
    );
    bracket.position.y = 0.2;
    const housing = new THREE.Mesh(
      new THREE.BoxGeometry(0.15, 0.15, 0.4),
      assetMats.cctvGrey,
    );
    housing.position.set(0, 0.35, 0.15);
    housing.rotation.x = Math.PI / 6;
    const lens = new THREE.Mesh(
      new THREE.CylinderGeometry(0.05, 0.05, 0.05, 16),
      assetMats.cctvGlass,
    );
    lens.rotation.x = Math.PI / 2;
    lens.position.z = 0.22;
    housing.add(lens);
    const wire = new THREE.Mesh(
      new THREE.CylinderGeometry(0.01, 0.01, 0.2),
      assetMats.cableBlack,
    );
    wire.position.set(0, 0.3, 0);
    wire.rotation.x = Math.PI / 8;
    group.add(bracket, housing, wire);
    return group;
  }

  static buildCCTV_Bullet_Standard() {
    const group = new THREE.Group();
    const arm = new THREE.Mesh(
      new THREE.CylinderGeometry(0.03, 0.03, 0.2),
      assetMats.metal,
    );
    arm.rotation.x = Math.PI / 2;
    arm.position.z = 0.1;
    const body = new THREE.Mesh(
      new THREE.CylinderGeometry(0.08, 0.08, 0.3, 16),
      assetMats.cctvGrey,
    );
    body.position.set(0, -0.05, 0.25);
    body.rotation.x = Math.PI / 2 + Math.PI / 6;
    const lens = new THREE.Mesh(
      new THREE.CircleGeometry(0.06, 16),
      assetMats.cctvGlass,
    );
    lens.position.set(0, 0.151, 0);
    lens.rotation.x = -Math.PI / 2;
    body.add(lens);
    group.add(arm, body);
    return group;
  }

  static buildCCTV_Bullet_IR() {
    const group = this.buildCCTV_Bullet_Standard();
    const ir = new THREE.Mesh(
      new THREE.RingGeometry(0.04, 0.06, 16),
      assetMats.irRing,
    );
    ir.position.set(0, 0.152, 0);
    ir.rotation.x = -Math.PI / 2;
    group.children[1].add(ir);
    return group;
  }

  static buildCCTV_Dual_Bullet() {
    const group = new THREE.Group();
    const pole = new THREE.Mesh(
      new THREE.CylinderGeometry(0.04, 0.04, 0.5),
      assetMats.metal,
    );
    pole.position.y = 0.25;
    const cam1 = this.buildCCTV_Bullet_Standard();
    cam1.position.set(-0.05, 0.5, 0);
    cam1.rotation.y = Math.PI / 4;
    const cam2 = this.buildCCTV_Bullet_Standard();
    cam2.position.set(0.05, 0.5, 0);
    cam2.rotation.y = -Math.PI / 4;
    group.add(pole, cam1, cam2);
    return group;
  }

  static buildCCTV_360() {
    const group = new THREE.Group();
    const base = new THREE.Mesh(
      new THREE.CylinderGeometry(0.3, 0.3, 0.1, 16),
      assetMats.cctvGrey,
    );
    for (let i = 0; i < 4; i++) {
      const sensor = new THREE.Mesh(
        new THREE.SphereGeometry(0.08, 16, 16, 0, Math.PI * 2, 0, Math.PI / 2),
        assetMats.cctvGlass,
      );
      sensor.rotation.x = Math.PI;
      const angle = (Math.PI / 2) * i;
      sensor.position.set(
        Math.cos(angle) * 0.15,
        -0.05,
        Math.sin(angle) * 0.15,
      );
      sensor.rotation.z = Math.cos(angle) * (Math.PI / 6);
      sensor.rotation.x += Math.sin(angle) * (Math.PI / 6);
      base.add(sensor);
    }
    group.add(base);
    return group;
  }

  static buildHangingSign() {
    const g = new THREE.Group();
    const m1 = new THREE.Mesh(
      new THREE.CylinderGeometry(0.05, 0.05, 1.0),
      assetMats.metal,
    );
    m1.position.set(1.0, 0.5, 0);
    m1.castShadow = true;
    const m2 = new THREE.Mesh(
      new THREE.CylinderGeometry(0.05, 0.05, 1.0),
      assetMats.metal,
    );
    m2.position.set(-1.0, 0.5, 0);
    m2.castShadow = true;
    const sb = new THREE.Mesh(
      new THREE.BoxGeometry(2.5, 0.8, 0.1),
      assetMats.metal,
    );
    sb.castShadow = true;
    const d1 = new THREE.Mesh(
      new THREE.PlaneGeometry(2.4, 0.7),
      assetMats.metal,
    );
    d1.position.z = 0.051;
    const d2 = new THREE.Mesh(
      new THREE.PlaneGeometry(2.4, 0.7),
      assetMats.metal,
    );
    d2.rotation.y = Math.PI;
    d2.position.z = -0.051;
    sb.add(d1, d2);
    g.add(m1, m2, sb);
    return g;
  }

  static buildAdvertisementPoster() {
    const g = new THREE.Group();
    const frame = new THREE.Mesh(
      new THREE.BoxGeometry(1.6, 2.4, 0.05),
      assetMats.metal,
    );
    frame.castShadow = true;
    const poster = new THREE.Mesh(
      new THREE.PlaneGeometry(1.5, 2.3),
      assetMats.posterMat,
    );
    poster.position.z = 0.026;
    g.add(frame, poster);
    return g;
  }

  static buildRubbishBin() {
    const g = new THREE.Group();
    const body = new THREE.Mesh(
      new THREE.CylinderGeometry(0.3, 0.3, 0.8, 16),
      envMats.rubbishBinMat,
    );
    body.position.y = 0.4;
    body.castShadow = true;
    const rim = new THREE.Mesh(
      new THREE.TorusGeometry(0.3, 0.03, 8, 16),
      assetMats.metal,
    );
    rim.rotation.x = Math.PI / 2;
    rim.position.y = 0.8;
    rim.castShadow = true;
    g.add(body, rim);
    return g;
  }

  static buildTicketMachine() {
    const g = new THREE.Group();
    const body = new THREE.Mesh(
      new THREE.BoxGeometry(1.0, 1.8, 0.6),
      envMats.ticketMachineMat,
    );
    body.position.y = 0.9;
    body.castShadow = true;
    const screen = new THREE.Mesh(
      new THREE.PlaneGeometry(0.6, 0.4),
      new THREE.MeshBasicMaterial({ color: 0x88ccff }),
    );
    screen.position.set(0, 1.3, 0.301);
    const pad = new THREE.Mesh(
      new THREE.BoxGeometry(0.8, 0.2, 0.1),
      assetMats.metal,
    );
    pad.position.set(0, 0.9, 0.3);
    pad.rotation.x = -Math.PI / 6;
    pad.castShadow = true;
    g.add(body, screen, pad);
    return g;
  }

  static buildPedestrianBridgeStandalone() {
    const group = new THREE.Group();
    const deckHeight = 6.0;
    const bWidth = 4.0;
    const span = 21.0;

    const deckGeo = new THREE.BoxGeometry(span, 0.4, bWidth);
    const deck = new THREE.Mesh(deckGeo, assetMats.redMetal);
    deck.position.set(0, deckHeight, 0);
    deck.receiveShadow = true;
    deck.castShadow = true;
    group.add(deck);

    const beamGeo = new THREE.BoxGeometry(span, 0.8, 0.2);
    const beamF = new THREE.Mesh(beamGeo, assetMats.redMetal);
    beamF.position.set(0, deckHeight - 0.4, bWidth / 2 - 0.1);
    beamF.castShadow = true;
    const beamB = new THREE.Mesh(beamGeo, assetMats.redMetal);
    beamB.position.set(0, deckHeight - 0.4, -bWidth / 2 + 0.1);
    beamB.castShadow = true;
    group.add(beamF, beamB);

    const colGeo = new THREE.CylinderGeometry(0.2, 0.2, deckHeight);
    [-8.5, 8.5].forEach((x) => {
      const colF = new THREE.Mesh(colGeo, assetMats.redMetal);
      colF.position.set(x, deckHeight / 2, bWidth / 2 - 0.2);
      colF.castShadow = true;
      const colB = new THREE.Mesh(colGeo, assetMats.redMetal);
      colB.position.set(x, deckHeight / 2, -bWidth / 2 + 0.2);
      colB.castShadow = true;
      group.add(colF, colB);
    });

    const frontRailSegments = [
      { x: -10.2, len: 0.6 },
      { x: 0, len: 14.2 },
      { x: 10.2, len: 0.6 },
    ];
    frontRailSegments.forEach((seg) => {
      const r = new THREE.Mesh(
        new THREE.CylinderGeometry(0.08, 0.08, seg.len).rotateZ(Math.PI / 2),
        assetMats.redMetal,
      );
      r.position.set(seg.x, deckHeight + 1.1, bWidth / 2 - 0.1);
      group.add(r);
    });

    const railBack = new THREE.Mesh(
      new THREE.CylinderGeometry(0.08, 0.08, span).rotateZ(Math.PI / 2),
      assetMats.redMetal,
    );
    railBack.position.set(0, deckHeight + 1.1, -bWidth / 2 + 0.1);
    group.add(railBack);

    const createFlight = (xOffset) => {
      const flight = new THREE.Group();
      const stepCount = 28;
      const stairRise = deckHeight - 1.1;
      const stepRise = stairRise / stepCount;
      const stepRun = 0.3;
      const stairRun = stepCount * stepRun;
      const stairWidth = 2.8;

      const stepsGeo = new THREE.BoxGeometry(stairWidth, stepRise, stepRun);
      const stepsInstanced = new THREE.InstancedMesh(
        stepsGeo,
        assetMats.redMetal,
        stepCount,
      );
      const dummy = new THREE.Object3D();

      for (let s = 0; s < stepCount; s++) {
        dummy.position.set(
          0,
          1.1 + stairRise - s * stepRise - stepRise / 2,
          -(bWidth / 2 + s * stepRun + stepRun / 2),
        );
        dummy.updateMatrix();
        stepsInstanced.setMatrixAt(s, dummy.matrix);
      }
      stepsInstanced.castShadow = true;
      flight.add(stepsInstanced);

      const stairLength = Math.sqrt(stairRun ** 2 + stairRise ** 2);
      const stairAngle = Math.atan2(stairRise, stairRun);
      const hRailGeo = new THREE.CylinderGeometry(0.06, 0.06, stairLength);
      hRailGeo.rotateX(Math.PI / 2);

      [-1, 1].forEach((side) => {
        const rail = new THREE.Mesh(hRailGeo, assetMats.redMetal);
        rail.position.set(
          (stairWidth / 2 - 0.15) * side,
          1.1 + stairRise / 2 + 0.9,
          -(bWidth / 2 + stairRun / 2),
        );
        rail.rotation.x = -stairAngle;

        const postGeo = new THREE.CylinderGeometry(0.03, 0.03, 0.9);
        for (let p = 0; p < 6; p++) {
          const fract = p / 5;
          const post = new THREE.Mesh(postGeo, assetMats.redMetal);
          post.position.set(0, -0.45, (fract - 0.5) * stairLength);
          post.rotation.x = stairAngle;
          rail.add(post);
        }
        flight.add(rail);
      });
      flight.position.x = xOffset;
      return flight;
    };

    group.add(createFlight(8.5));
    group.add(createFlight(-8.5));
    return group;
  }

  static buildTrackSignal() {
    const g = new THREE.Group();
    const p = new THREE.Mesh(
      new THREE.CylinderGeometry(0.05, 0.05, 2.0),
      assetMats.metal,
    );
    p.position.y = 1.0;
    p.castShadow = true;
    const h = new THREE.Mesh(
      new THREE.BoxGeometry(0.4, 0.9, 0.2),
      assetMats.ironCast,
    );
    h.position.set(0, 1.8, 0.1);
    h.castShadow = true;
    const lr = new THREE.Mesh(
      new THREE.CircleGeometry(0.1, 16),
      assetMats.signalRed,
    );
    lr.position.set(0, 2.1, 0.201);
    const la = new THREE.Mesh(
      new THREE.CircleGeometry(0.1, 16),
      assetMats.signalAmber,
    );
    la.position.set(0, 1.8, 0.201);
    const lg = new THREE.Mesh(
      new THREE.CircleGeometry(0.1, 16),
      assetMats.signalGreen,
    );
    lg.position.set(0, 1.5, 0.201);
    g.add(p, h, lr, la, lg);
    return g;
  }

  static createMesh(geo, mat) {
    const mesh = new THREE.Mesh(geo, mat);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    return mesh;
  }

  static addBolts(group, count, radius, distance, yPos, material) {
    const boltGeo = new THREE.CylinderGeometry(0.015, 0.015, 0.02, 6);
    for (let i = 0; i < count; i++) {
      const angle = (i / count) * Math.PI * 2;
      const bolt = this.createMesh(boltGeo, material);
      bolt.position.set(
        Math.cos(angle) * distance,
        yPos,
        Math.sin(angle) * distance,
      );
      group.add(bolt);
    }
  }

  static buildTunnelCase() {
    const group = new THREE.Group();
    const bracket1 = this.createMesh(
      new THREE.BoxGeometry(0.6, 0.05, 0.5),
      tracksideMats.galvanized,
    );
    bracket1.position.set(0, 0.2, -0.2);
    const bracket2 = this.createMesh(
      new THREE.BoxGeometry(0.6, 0.05, 0.5),
      tracksideMats.galvanized,
    );
    bracket2.position.set(0, 1.6, -0.2);
    const cabinet = this.createMesh(
      new THREE.BoxGeometry(0.8, 1.4, 0.3),
      tracksideMats.castIron,
    );
    cabinet.position.set(0, 0.9, 0);
    const door = this.createMesh(
      new THREE.BoxGeometry(0.76, 1.36, 0.02),
      tracksideMats.greyMetal,
    );
    door.position.set(0, 0.9, 0.16);
    const hingeGeo = new THREE.CylinderGeometry(0.01, 0.01, 0.1);
    [0.4, 1.4].forEach((y) => {
      const hinge = this.createMesh(hingeGeo, tracksideMats.darkMetal);
      hinge.position.set(0.38, y, 0.16);
      group.add(hinge);
    });
    const handle = this.createMesh(
      new THREE.BoxGeometry(0.02, 0.15, 0.04),
      tracksideMats.galvanized,
    );
    handle.position.set(-0.3, 0.9, 0.18);
    const label = this.createMesh(
      new THREE.PlaneGeometry(0.2, 0.15),
      tracksideMats.yellowWarning,
    );
    label.position.set(0, 1.3, 0.171);
    group.add(bracket1, bracket2, cabinet, door, handle, label);
    return group;
  }

  static buildTunnelSignal() {
    const group = new THREE.Group();
    const post = this.createMesh(
      new THREE.BoxGeometry(0.1, 1.2, 0.1),
      tracksideMats.galvanized,
    );
    post.position.set(0, 0.6, -0.2);
    const backplate = this.createMesh(
      new THREE.BoxGeometry(0.4, 1.0, 0.1),
      tracksideMats.castIron,
    );
    backplate.position.set(0, 1.0, 0);
    const conduit = this.createMesh(
      new THREE.CylinderGeometry(0.02, 0.02, 1.0),
      tracksideMats.blackWire,
    );
    conduit.position.set(0.08, 0.5, -0.15);
    const colors = [tracksideMats.redSignal, tracksideMats.greenSignal];
    for (let i = 0; i < 2; i++) {
      const yPos = 1.2 - i * 0.4;
      const light = this.createMesh(
        new THREE.CylinderGeometry(0.1, 0.1, 0.05),
        colors[i],
      );
      light.rotation.x = Math.PI / 2;
      light.position.set(0, yPos, 0.05);
      const hoodGeo = new THREE.CylinderGeometry(
        0.12,
        0.14,
        0.5,
        32,
        1,
        true,
        0,
        Math.PI,
      );
      const hood = this.createMesh(hoodGeo, tracksideMats.darkMetal);
      hood.material.side = THREE.DoubleSide;
      hood.rotation.x = Math.PI / 2;
      hood.position.set(0, yPos, 0.3);
      const rim = this.createMesh(
        new THREE.TorusGeometry(0.14, 0.01, 8, 32, Math.PI),
        tracksideMats.castIron,
      );
      rim.rotation.z = Math.PI / 2;
      rim.position.set(0, yPos, 0.55);
      group.add(light, hood, rim);
    }
    group.add(post, backplate, conduit);
    return group;
  }

  static buildSubPointMachine() {
    const group = new THREE.Group();
    const motorBox = this.createMesh(
      new THREE.BoxGeometry(0.9, 0.18, 0.6),
      tracksideMats.castIron,
    );
    motorBox.position.set(0, 0.09, 0);
    const lid = this.createMesh(
      new THREE.BoxGeometry(0.85, 0.02, 0.55),
      tracksideMats.greyMetal,
    );
    lid.position.set(0, 0.19, 0);
    this.addBolts(lid, 6, 0.3, 0.4, 0.01, tracksideMats.darkMetal);
    const rodBase = this.createMesh(
      new THREE.BoxGeometry(1.2, 0.05, 0.15),
      tracksideMats.darkMetal,
    );
    rodBase.position.set(-0.8, 0.1, 0);
    const driveRod = this.createMesh(
      new THREE.CylinderGeometry(0.02, 0.02, 1.2),
      tracksideMats.galvanized,
    );
    driveRod.rotation.z = Math.PI / 2;
    driveRod.position.set(-0.8, 0.15, 0.05);
    const cableIn = this.createMesh(
      new THREE.CylinderGeometry(0.04, 0.04, 0.2),
      tracksideMats.blackWire,
    );
    cableIn.rotation.x = Math.PI / 2;
    cableIn.position.set(0.4, 0.09, -0.3);
    group.add(motorBox, lid, rodBase, driveRod, cableIn);
    return group;
  }

  static buildTrackBonds() {
    const group = new THREE.Group();
    const bondBox = this.createMesh(
      new THREE.BoxGeometry(0.25, 0.2, 0.25),
      tracksideMats.castIron,
    );
    bondBox.position.set(0, 0.1, 0);
    const lid = this.createMesh(
      new THREE.BoxGeometry(0.22, 0.02, 0.22),
      tracksideMats.greyMetal,
    );
    lid.position.set(0, 0.21, 0);
    for (let i = 0; i < 3; i++) {
      const wire = this.createMesh(
        new THREE.TubeGeometry(
          new THREE.CatmullRomCurve3([
            new THREE.Vector3(0.1, 0.15, 0 + i * 0.05),
            new THREE.Vector3(0.3, 0.2, 0 + i * 0.05),
            new THREE.Vector3(0.6, 0.3, 0),
          ]),
          10,
          0.01,
          8,
          false,
        ),
        tracksideMats.copper,
      );
      group.add(wire);
    }
    group.add(bondBox, lid);
    return group;
  }

  static buildTripcock() {
    const group = new THREE.Group();
    const base = this.createMesh(
      new THREE.BoxGeometry(0.35, 0.25, 0.35),
      tracksideMats.castIron,
    );
    base.position.set(0, 0.125, 0);
    const cylinder = this.createMesh(
      new THREE.CylinderGeometry(0.08, 0.08, 0.2),
      tracksideMats.galvanized,
    );
    cylinder.position.set(0, 0.35, 0);
    const arm = this.createMesh(
      new THREE.BoxGeometry(0.04, 0.45, 0.06),
      tracksideMats.yellowWarning,
    );
    arm.position.set(0, 0.45, 0);
    const hose = this.createMesh(
      new THREE.TubeGeometry(
        new THREE.CatmullRomCurve3([
          new THREE.Vector3(0.15, 0.1, 0),
          new THREE.Vector3(0.35, 0.05, 0.2),
          new THREE.Vector3(0.55, 0, 0),
        ]),
        12,
        0.02,
        8,
        false,
      ),
      tracksideMats.blackWire,
    );
    group.add(base, cylinder, arm, hose);
    return group;
  }

  static buildLUImpedanceBond() {
    const group = new THREE.Group();
    const casing = this.createMesh(
      new THREE.BoxGeometry(0.6, 0.18, 0.9),
      tracksideMats.castIron,
    );
    casing.position.set(0, 0.12, 0);
    const ribsGeo = new THREE.BoxGeometry(0.65, 0.02, 0.05);
    for (let i = 0; i < 5; i++) {
      const rib = this.createMesh(ribsGeo, tracksideMats.castIron);
      rib.position.set(0, 0.2, -0.3 + i * 0.15);
      group.add(rib);
    }
    const term1 = this.createMesh(
      new THREE.CylinderGeometry(0.04, 0.04, 0.25),
      tracksideMats.copper,
    );
    term1.position.set(-0.2, 0.25, 0.35);
    const term2 = this.createMesh(
      new THREE.CylinderGeometry(0.04, 0.04, 0.25),
      tracksideMats.copper,
    );
    term2.position.set(0.2, 0.25, -0.35);
    const cableGen = (x, z) =>
      this.createMesh(
        new THREE.TubeGeometry(
          new THREE.CatmullRomCurve3([
            new THREE.Vector3(x, 0.35, z),
            new THREE.Vector3(x * 1.5, 0.4, z),
            new THREE.Vector3(x * 3, 0.3, z),
          ]),
          10,
          0.03,
          8,
          false,
        ),
        tracksideMats.blackWire,
      );
    group.add(casing, term1, term2, cableGen(-0.2, 0.35), cableGen(0.2, -0.35));
    return group;
  }

  static buildTunnelTelephone() {
    const group = new THREE.Group();
    const backplate = this.createMesh(
      new THREE.BoxGeometry(0.4, 0.6, 0.05),
      tracksideMats.galvanized,
    );
    backplate.position.set(0, 1.2, -0.1);
    const box = this.createMesh(
      new THREE.BoxGeometry(0.3, 0.4, 0.2),
      tracksideMats.castIron,
    );
    box.position.set(0, 1.2, 0.025);
    const label = this.createMesh(
      new THREE.PlaneGeometry(0.15, 0.05),
      tracksideMats.white,
    );
    label.position.set(0, 1.35, 0.13);
    const handset = this.createMesh(
      new THREE.BoxGeometry(0.06, 0.25, 0.08),
      tracksideMats.darkMetal,
    );
    handset.position.set(0.2, 1.2, 0.05);
    const cordCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(0.2, 1.1, 0.05),
      new THREE.Vector3(0.1, 0.9, 0.1),
      new THREE.Vector3(0, 1.05, 0.1),
    ]);
    const cord = this.createMesh(
      new THREE.TubeGeometry(cordCurve, 20, 0.01, 8, false),
      tracksideMats.blackWire,
    );
    group.add(backplate, box, label, handset, cord);
    return group;
  }

  static buildCableHangers() {
    const group = new THREE.Group();
    const strut = this.createMesh(
      new THREE.BoxGeometry(0.05, 2.4, 0.05),
      tracksideMats.galvanized,
    );
    strut.position.set(0, 1.2, -0.2);
    for (let i = 0; i < 7; i++) {
      const yPos = 0.3 + i * 0.3;
      const hook = this.createMesh(
        new THREE.BoxGeometry(0.18, 0.02, 0.04),
        tracksideMats.rustyMetal,
      );
      hook.position.set(0.05, yPos, -0.2);
      const hookLip = this.createMesh(
        new THREE.BoxGeometry(0.02, 0.08, 0.04),
        tracksideMats.rustyMetal,
      );
      hookLip.position.set(0.13, yPos + 0.03, -0.2);
      const cable = this.createMesh(
        new THREE.CylinderGeometry(0.05, 0.05, 1.0),
        tracksideMats.blackWire,
      );
      cable.rotation.x = Math.PI / 2;
      cable.position.set(0.06, yPos + 0.05, 0);
      const dataCable = this.createMesh(
        new THREE.CylinderGeometry(0.02, 0.02, 1.0),
        tracksideMats.greyMetal,
      );
      dataCable.rotation.x = Math.PI / 2;
      dataCable.position.set(0.1, yPos + 0.02, 0);
      group.add(hook, hookLip, cable, dataCable);
    }
    group.add(strut);
    return group;
  }

  static buildDistBoard() {
    const group = new THREE.Group();
    const board = this.createMesh(
      new THREE.BoxGeometry(0.7, 1.0, 0.3),
      tracksideMats.greyMetal,
    );
    board.position.set(0, 1.2, 0);
    const label = this.createMesh(
      new THREE.PlaneGeometry(0.3, 0.15),
      tracksideMats.yellowWarning,
    );
    label.position.set(0, 1.5, 0.151);
    for (let i = 0; i < 4; i++) {
      const switchBox = this.createMesh(
        new THREE.BoxGeometry(0.08, 0.12, 0.05),
        tracksideMats.darkMetal,
      );
      switchBox.position.set(-0.2 + i * 0.13, 1.0, 0.17);
      const toggle = this.createMesh(
        new THREE.CylinderGeometry(0.01, 0.01, 0.05),
        tracksideMats.redSignal,
      );
      toggle.rotation.x = Math.PI / 4;
      toggle.position.set(-0.2 + i * 0.13, 1.0, 0.19);
      group.add(switchBox, toggle);
    }
    [-0.2, 0, 0.2].forEach((x) => {
      const conduit = this.createMesh(
        new THREE.CylinderGeometry(0.03, 0.03, 1.0),
        tracksideMats.galvanized,
      );
      conduit.position.set(x, 0.4, 0);
      group.add(conduit);
    });
    group.add(board, label);
    return group;
  }

  static buildTunnelLubricator() {
    const group = new THREE.Group();
    const reservoir = this.createMesh(
      new THREE.CylinderGeometry(0.2, 0.2, 0.5),
      tracksideMats.castIron,
    );
    reservoir.position.set(0, 0.25, 0);
    const lid = this.createMesh(
      new THREE.CylinderGeometry(0.22, 0.22, 0.05),
      tracksideMats.greyMetal,
    );
    lid.position.set(0, 0.5, 0);
    const pump = this.createMesh(
      new THREE.BoxGeometry(0.15, 0.2, 0.15),
      tracksideMats.darkMetal,
    );
    pump.position.set(-0.25, 0.2, 0);
    const feedHose = this.createMesh(
      new THREE.TubeGeometry(
        new THREE.CatmullRomCurve3([
          new THREE.Vector3(-0.3, 0.2, 0),
          new THREE.Vector3(-0.5, 0.25, 0),
          new THREE.Vector3(-0.65, 0.35, 0),
        ]),
        10,
        0.015,
        8,
        false,
      ),
      tracksideMats.blackWire,
    );
    const applicator = this.createMesh(
      new THREE.BoxGeometry(0.05, 0.05, 0.4),
      tracksideMats.darkMetal,
    );
    applicator.position.set(-0.6, 0.38, 0);
    group.add(reservoir, lid, pump, feedHose, applicator);
    return group;
  }
}
