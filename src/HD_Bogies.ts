import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';

// --- System Globals ---
let scene: THREE.Scene;
let camera: THREE.PerspectiveCamera;
let renderer: THREE.WebGLRenderer;
let composer: EffectComposer;
let controls: OrbitControls;
let animationId: number;
let isInitialized = false;

// --- Kinematic Registry ---
interface KinematicPart {
    mesh: THREE.Object3D;
    type: 'wheel' | 'gear' | 'fan' | 'unsprung' | 'frame' | 'chassis' | 'primarySpring' | 'secondarySpring';
    ratio?: number;
    baseY?: number;
    baseScale?: number;
}


// --- Entity Groups ---
let trainAssembly: THREE.Group;
let trackGroup: THREE.Group;
let undercarriageGroup: THREE.Group;

// --- State Matrix ---
const SystemState = {
    renderMode: 0, 
    rotationActive: false,
    speed: 0.1,
    antiGravityElevation: 0.0,
    sceneLighting: 60,
    time: 0,
    floorVisible: true
};

// --- Material Definitions ---
const mats = {
    steel: new THREE.MeshPhysicalMaterial({ color: 0x888888, metalness: 0.8, roughness: 0.4, clearcoat: 0.1 }),
    polishedSteel: new THREE.MeshPhysicalMaterial({ color: 0xaaaaaa, metalness: 0.9, roughness: 0.2 }),
    darkMetal: new THREE.MeshStandardMaterial({ color: 0x222222, metalness: 0.7, roughness: 0.6 }),
    castIron: new THREE.MeshStandardMaterial({ color: 0x333333, metalness: 0.6, roughness: 0.8 }),
    yellowPaint: new THREE.MeshStandardMaterial({ color: 0xeab308, metalness: 0.2, roughness: 0.5 }),
    whitePaint: new THREE.MeshStandardMaterial({ color: 0xdddddd, metalness: 0.1, roughness: 0.4 }),
    springSteel: new THREE.MeshStandardMaterial({ color: 0x111111, metalness: 0.5, roughness: 0.6 }),
    rustedSteel: new THREE.MeshStandardMaterial({ color: 0x4a3b32, metalness: 0.4, roughness: 0.9 }),
    concrete: new THREE.MeshStandardMaterial({ color: 0x7a7a7a, roughness: 1.0 }),
    ballast: new THREE.MeshStandardMaterial({ color: 0x3b3b3b, roughness: 1.0, bumpScale: 0.02 }),
    copper: new THREE.MeshStandardMaterial({ color: 0xb87333, metalness: 0.8, roughness: 0.3 }),
    rubber: new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.9 }),
    brass: new THREE.MeshStandardMaterial({ color: 0xb5a642, metalness: 0.8, roughness: 0.4 }),
    pipeRubber: new THREE.MeshStandardMaterial({ color: 0x1a1a1a, roughness: 0.9, metalness: 0.1 }),
    hvCable: new THREE.MeshStandardMaterial({ color: 0xff5500, roughness: 0.6, metalness: 0.2 }),
    sensorWire: new THREE.MeshStandardMaterial({ color: 0x444444, roughness: 0.8 })
};

Object.values(mats).forEach(mat => {
    mat.transparent = true;
    mat.side = THREE.DoubleSide;
});

// --- Geometry Generators ---

class HelixCurve extends THREE.Curve<THREE.Vector3> {
    radius: number;
    height: number;
    coils: number;

    constructor(radius = 0.1, height = 0.25, coils = 5) {
        super();
        this.radius = radius;
        this.height = height;
        this.coils = coils;
    }

    getPoint(t: number, optionalTarget = new THREE.Vector3()) {
        const x = this.radius * Math.cos(t * Math.PI * 2 * this.coils);
        const z = this.radius * Math.sin(t * Math.PI * 2 * this.coils);
        const y = (t - 0.5) * this.height; 
        return optionalTarget.set(x, y, z);
    }
}

const geoCache: { [key: string]: THREE.BufferGeometry } = {};

function getCachedGeometry(key: string, creator: () => THREE.BufferGeometry): THREE.BufferGeometry {
    if (!geoCache[key]) {
        geoCache[key] = creator();
    }
    return geoCache[key];
}

function createGearGeometry(radius: number, teeth: number, depth: number): THREE.ExtrudeGeometry {
    const key = `gear_${radius}_${teeth}_${depth}`;
    return getCachedGeometry(key, () => {
        const shape = new THREE.Shape();
        const innerRadius = radius * 0.85;
        for (let i = 0; i < teeth * 2; i++) {
            const angle = (i / (teeth * 2)) * Math.PI * 2;
            const r = i % 2 === 0 ? radius : innerRadius;
            if (i === 0) shape.moveTo(Math.cos(angle) * r, Math.sin(angle) * r);
            else shape.lineTo(Math.cos(angle) * r, Math.sin(angle) * r);
        }
        shape.closePath();
        
        const holePath = new THREE.Path();
        holePath.absarc(0, 0, radius * 0.3, 0, Math.PI * 2, false);
        shape.holes.push(holePath);

        return new THREE.ExtrudeGeometry(shape, { depth: depth, bevelEnabled: true, bevelSegments: 1, steps: 1, bevelSize: 0.01, bevelThickness: 0.01 });
    }) as THREE.ExtrudeGeometry;
}

function applyWireframeDetail(mesh: THREE.Mesh) {
    // Disabled to dramatically improve performance and reduce lag
    /*
    const edges = new THREE.EdgesGeometry(mesh.geometry, 15);
    const lineMat = new THREE.LineBasicMaterial({ color: 0x00ffff, transparent: true, opacity: 0.8 });
    const lineSegments = new THREE.LineSegments(edges, lineMat);
    lineSegments.name = "CAD_Edge";
    lineSegments.visible = false;
    mesh.add(lineSegments);
    */
}

export function buildHDWheelset(activeKinematics: any[], isReversed: boolean = false) {
    const group = new THREE.Group();
    const staticGroup = new THREE.Group();
    const gauge = 1.435;
    const offset = gauge / 2;

    const getWheelGeom = () => getCachedGeometry("wheelGeom", () => {
        const points = [];
        points.push(new THREE.Vector2(0, 0.15));
        points.push(new THREE.Vector2(0.2, 0.12));
        points.push(new THREE.Vector2(0.43, -0.04));
        points.push(new THREE.Vector2(0.43, -0.02));
        points.push(new THREE.Vector2(0.40, 0.00));
        points.push(new THREE.Vector2(0.40, 0.06));
        points.push(new THREE.Vector2(0.38, 0.08));
        points.push(new THREE.Vector2(0.2, 0.05));
        points.push(new THREE.Vector2(0, -0.05));
        const geom = new THREE.LatheGeometry(points, 64).rotateZ(-Math.PI / 2);
        geom.computeVertexNormals();
        return geom;
    });

    const wheelL = new THREE.Mesh(getWheelGeom(), mats.polishedSteel);
    wheelL.position.x = -offset;
    wheelL.rotation.y = Math.PI;
    applyWireframeDetail(wheelL);
    
    const wheelR = new THREE.Mesh(getWheelGeom(), mats.polishedSteel);
    wheelR.position.x = offset;
    applyWireframeDetail(wheelR);

    const getAxleGeom = () => getCachedGeometry(`axleGeom_${gauge}`, () => new THREE.CylinderGeometry(0.09, 0.09, gauge + 0.4, 32).rotateZ(Math.PI / 2));
    const axle = new THREE.Mesh(getAxleGeom(), mats.steel);
    applyWireframeDetail(axle);

    const spurRadius = 0.25;
    const getSpurGeom = () => getCachedGeometry("spurGeom", () => createGearGeometry(spurRadius, 24, 0.1).rotateY(Math.PI / 2));
    const spurGear = new THREE.Mesh(getSpurGeom(), mats.brass);
    const gearXAlignment = -0.4; 
    spurGear.position.x = gearXAlignment;
    applyWireframeDetail(spurGear);
    
    // --- High-Fidelity Brake Assembly (*Conjunto de frenos* [Brake assembly]) ---
    const brakeDiscRadius = 0.18;
    const getBrakeDiscGeom = () => getCachedGeometry("brakeDiscGeom", () => new THREE.CylinderGeometry(brakeDiscRadius, brakeDiscRadius, 0.04, 32).rotateZ(Math.PI / 2));
    
    const discL = new THREE.Mesh(getBrakeDiscGeom(), mats.polishedSteel);
    discL.position.x = -0.15; // Shifted inboard to clear gear
    applyWireframeDetail(discL);
    
    const discR = new THREE.Mesh(getBrakeDiscGeom(), mats.polishedSteel);
    discR.position.x = 0.15; // Shifted inboard
    applyWireframeDetail(discR);
    
    group.add(wheelL, wheelR, axle, spurGear, discL, discR);
    group.userData.kinematicType = 'wheel';
    group.userData.kinematic = { type: 'wheel' };

    const boxGeom = new THREE.BoxGeometry(0.3, 0.3, 0.3);
    const boxL = new THREE.Mesh(boxGeom, mats.yellowPaint);
    boxL.position.x = -(gauge / 2 + 0.15);
    applyWireframeDetail(boxL);
    
    const boxR = new THREE.Mesh(boxGeom, mats.yellowPaint);
    boxR.position.x = (gauge / 2 + 0.15);
    applyWireframeDetail(boxR);

    // Calipers (*Pinzas* [Calipers]) attached to unsprung static
    const caliperGeom = new THREE.BoxGeometry(0.12, 0.16, 0.20);
    const caliperL = new THREE.Mesh(caliperGeom, mats.castIron);
    caliperL.position.set(-0.15, 0.14, 0); // Realigned to discL
    applyWireframeDetail(caliperL);

    const caliperR = new THREE.Mesh(caliperGeom, mats.castIron);
    caliperR.position.set(0.15, 0.14, 0); // Realigned to discR
    applyWireframeDetail(caliperR);

    // Brake actuators / pneumatic cylinders
    const actuatorGeom = new THREE.CylinderGeometry(0.04, 0.04, 0.1, 16).rotateZ(Math.PI / 2);
    const actL = new THREE.Mesh(actuatorGeom, mats.darkMetal);
    actL.position.set(-0.06, 0.05, 0); 
    applyWireframeDetail(actL);
    
    // Gland connector for orange pneumatic sensor line
    const glandGeom = new THREE.CylinderGeometry(0.02, 0.02, 0.05, 16);
    const glandL = new THREE.Mesh(glandGeom, mats.brass);
    glandL.position.set(-0.12, 0.05, 0);
    glandL.rotation.z = Math.PI / 2;
    caliperL.add(actL, glandL);

    const actR = new THREE.Mesh(actuatorGeom, mats.darkMetal);
    actR.position.set(0.06, 0.05, 0); 
    applyWireframeDetail(actR);

    const glandR = new THREE.Mesh(glandGeom, mats.brass);
    glandR.position.set(0.12, 0.05, 0);
    glandR.rotation.z = Math.PI / 2;
    caliperR.add(actR, glandR);

    staticGroup.add(boxL, boxR, caliperL, caliperR);

    // Motor Assembly
    const motorAssembly = new THREE.Group();
    const dir = isReversed ? -1 : 1;
    const pinionRadius = 0.1;
    const centerDist = spurRadius + pinionRadius; 

    const motorGeom = new THREE.CylinderGeometry(0.22, 0.22, 0.5, 32).rotateZ(Math.PI/2);
    const motor = new THREE.Mesh(motorGeom, mats.darkMetal);
    motor.position.set(gearXAlignment, 0, dir * 0.65);
    applyWireframeDetail(motor);

    const gearboxGeom = new THREE.BoxGeometry(0.3, 0.35, 0.45);
    const gearbox = new THREE.Mesh(gearboxGeom, mats.castIron);
    gearbox.position.set(gearXAlignment, 0, dir * 0.45);
    applyWireframeDetail(gearbox);

    const pinionGeom = createGearGeometry(pinionRadius, 10, 0.08).rotateY(Math.PI / 2);
    const pinion = new THREE.Mesh(pinionGeom, mats.steel);
    pinion.position.set(gearXAlignment, 0, dir * centerDist);
    pinion.rotation.x = Math.PI / 10; 
    applyWireframeDetail(pinion);
    
    pinion.userData.kinematic = { type: 'gear', ratio: -2.4 };

    motorAssembly.add(motor, gearbox, pinion);
    staticGroup.add(motorAssembly);

    const assembly = new THREE.Group();
    assembly.add(group); 
    assembly.add(staticGroup); 
    return { assembly };
}

export function buildHDBogie(activeKinematics: any[], flipSymmetry: boolean = false) {
    const bogie = new THREE.Group();
    const wheelbase = 2.2; 
    const gauge = 1.435;
    const frameWidth = gauge + 0.3;
    const frameBaseY = 0.65; 

    // --- M0: Unsprung Mass Registration ---
    const ws1 = buildHDWheelset(activeKinematics, false);
    ws1.assembly.position.set(0, 0.4, -wheelbase / 2);
    ws1.assembly.userData.kinematic = { type: 'unsprung', baseY: 0.4 };
    
    const ws2 = buildHDWheelset(activeKinematics, true);
    ws2.assembly.position.set(0, 0.4, wheelbase / 2);
    ws2.assembly.userData.kinematic = { type: 'unsprung', baseY: 0.4 };

    bogie.add(ws1.assembly, ws2.assembly);

    // --- M1: Frame Mass Registration ---
    const frameGroup = new THREE.Group();
    frameGroup.position.y = frameBaseY;
    frameGroup.userData.kinematic = { type: 'frame', baseY: frameBaseY };

    const sideShape = new THREE.Shape();
    sideShape.moveTo(-1.6, -0.05);
    sideShape.lineTo(-1.2, 0.15);
    sideShape.lineTo(1.2, 0.15);
    sideShape.lineTo(1.6, -0.05);
    sideShape.lineTo(1.6, -0.25);
    sideShape.lineTo(1.3, -0.25);
    sideShape.lineTo(1.3, -0.05); 
    sideShape.lineTo(0.9, -0.05);
    sideShape.lineTo(0.9, -0.25);
    sideShape.lineTo(-0.9, -0.25);
    sideShape.lineTo(-0.9, -0.05); 
    sideShape.lineTo(-1.3, -0.05);
    sideShape.lineTo(-1.3, -0.25);
    sideShape.lineTo(-1.6, -0.25);
    sideShape.lineTo(-1.6, -0.05);

    const extrudeSettings = { depth: 0.15, bevelEnabled: true, bevelSegments: 2, steps: 1, bevelSize: 0.02, bevelThickness: 0.02 };
    const sideGeom = new THREE.ExtrudeGeometry(sideShape, extrudeSettings);
    sideGeom.center();
    sideGeom.rotateY(Math.PI / 2);

    const sideL = new THREE.Mesh(sideGeom, mats.castIron);
    sideL.position.x = -frameWidth / 2;
    applyWireframeDetail(sideL);
    
    const sideR = new THREE.Mesh(sideGeom, mats.castIron);
    sideR.position.x = frameWidth / 2;
    applyWireframeDetail(sideR);
    
    frameGroup.add(sideL, sideR);

    const crossbeamGeom = new THREE.BoxGeometry(frameWidth - 0.2, 0.20, 0.5);
    const crossbeam = new THREE.Mesh(crossbeamGeom, mats.castIron);
    crossbeam.position.y = -0.05;
    applyWireframeDetail(crossbeam);
    frameGroup.add(crossbeam);

    const pivotReceiverGeom = new THREE.CylinderGeometry(0.18, 0.18, 0.2, 16);
    const pivotReceiver = new THREE.Mesh(pivotReceiverGeom, mats.darkMetal);
    pivotReceiver.position.y = 0.05;
    applyWireframeDetail(pivotReceiver);
    
    const lateralStopGeom = new THREE.BoxGeometry(0.1, 0.15, 0.2);
    const stopL = new THREE.Mesh(lateralStopGeom, mats.yellowPaint);
    stopL.position.set(-0.3, 0.1, 0);
    applyWireframeDetail(stopL);
    
    const stopR = new THREE.Mesh(lateralStopGeom, mats.yellowPaint);
    stopR.position.set(0.3, 0.1, 0);
    applyWireframeDetail(stopR);
    
    frameGroup.add(pivotReceiver, stopL, stopR);

    // --- Primary Suspension ---
    const buildPrimarySuspension = (x: number, z: number, assemblyParent: THREE.Group) => {
        const path = new HelixCurve(0.06, 0.25, 5); 
        const springGeom = new THREE.TubeGeometry(path, 64, 0.015, 8, false);
        const spring = new THREE.Mesh(springGeom, mats.springSteel);
        spring.position.set(x, -0.125, z); 
        applyWireframeDetail(spring);
        frameGroup.add(spring);
        spring.userData.kinematic = { type: 'primarySpring', baseScale: 1.0 };
        
        const damperHousing = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 0.15, 16), mats.darkMetal);
        damperHousing.position.set(x + 0.12, -0.05, z);
        applyWireframeDetail(damperHousing);
        frameGroup.add(damperHousing);

        const damperPiston = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.2, 16), mats.polishedSteel);
        damperPiston.position.set(x + 0.12, 0.15, 0); 
        applyWireframeDetail(damperPiston);
        assemblyParent.add(damperPiston); 
    };

    const axleBoxDist = gauge / 2 + 0.15;
    buildPrimarySuspension(-axleBoxDist, -wheelbase / 2, ws1.assembly);
    buildPrimarySuspension(axleBoxDist, -wheelbase / 2, ws1.assembly);
    buildPrimarySuspension(-axleBoxDist, wheelbase / 2, ws2.assembly);
    buildPrimarySuspension(axleBoxDist, wheelbase / 2, ws2.assembly);

    // --- Secondary Suspension ---
    const buildAirSpring = (x: number) => {
        const seatGeom = new THREE.CylinderGeometry(0.28, 0.28, 0.05, 32);
        const seat = new THREE.Mesh(seatGeom, mats.darkMetal);
        seat.position.set(x, 0.075, 0);
        applyWireframeDetail(seat);
        frameGroup.add(seat);

        const airSpringGeom = new THREE.CylinderGeometry(0.25, 0.25, 0.15, 32);
        airSpringGeom.translate(0, 0.075, 0); 
        const airSpring = new THREE.Mesh(airSpringGeom, mats.rubber);
        airSpring.position.set(x, 0.125, 0); 
        applyWireframeDetail(airSpring);
        frameGroup.add(airSpring);
        airSpring.userData.kinematic = { type: 'secondarySpring', baseScale: 1.0 };

        // Telescopic Damper Base (*Amortiguadores secundarios* [Secondary dampers])
        const lowerDamperGeom = new THREE.CylinderGeometry(0.03, 0.03, 0.3, 16);
        const lowerDamper = new THREE.Mesh(lowerDamperGeom, mats.polishedSteel);
        lowerDamper.position.set(x + (0.35 * Math.sign(x)), 0.2, 0);
        applyWireframeDetail(lowerDamper);
        frameGroup.add(lowerDamper);

        // Levelling Valve (*Válvulas niveladoras* [Levelling valves])
        const valveGeom = new THREE.BoxGeometry(0.08, 0.08, 0.08);
        const valve = new THREE.Mesh(valveGeom, mats.brass);
        valve.position.set(x - (0.3 * Math.sign(x)), 0.15, 0);
        applyWireframeDetail(valve);
        frameGroup.add(valve);
    };
    buildAirSpring(-frameWidth / 2);
    buildAirSpring(frameWidth / 2);

    bogie.add(frameGroup);
    return bogie;
}

export function buildUndercarriage(activeKinematics: any[]) {
    const uc = new THREE.Group();
    uc.userData.kinematic = { type: 'chassis', baseY: 0 };
    const chassisBaseY = 0.15; // Considerably lowered to prevent floor clipping

    // Under-floor Cable Trays (*Bandejas de cables* [Cable trays])
    const trayGeom = new THREE.BoxGeometry(0.5, 0.08, 11.0);
    const trayL = new THREE.Mesh(trayGeom, mats.castIron);
    trayL.position.set(-0.5, chassisBaseY + 0.22, 0); 
    const trayR = new THREE.Mesh(trayGeom, mats.castIron);
    trayR.position.set(0.5, chassisBaseY + 0.22, 0);
    applyWireframeDetail(trayL); applyWireframeDetail(trayR);
    uc.add(trayL, trayR);

    const createBox = (w: number, h: number, d: number, x: number, y: number, z: number, mat: THREE.Material) => {
        const geom = new THREE.BoxGeometry(w, h, d);
        const mesh = new THREE.Mesh(geom, mat);
        mesh.position.set(x, y, z);
        applyWireframeDetail(mesh);
        uc.add(mesh);
    };

    createBox(2.2, 0.5, 3.0, 0, chassisBaseY, 0, mats.darkMetal); 

    // Central Pneumatic Junction (*Bloque de distribución* [Distribution block])
    const centralJunctionGeom = new THREE.BoxGeometry(0.8, 0.2, 0.8);
    const centralJunction = new THREE.Mesh(centralJunctionGeom, mats.castIron);
    centralJunction.position.set(0, chassisBaseY + 0.15, 0);
    applyWireframeDetail(centralJunction);
    uc.add(centralJunction);

    // Detailed Traction Inverter (*Convertidor de tracción* [Traction converter])
    const buildTractionInverter = () => {
        const inverterGroup = new THREE.Group();
        inverterGroup.position.set(0, chassisBaseY, 0);

        const mainBlock = new THREE.Mesh(new THREE.BoxGeometry(2.2, 0.5, 3.0), mats.darkMetal);
        applyWireframeDetail(mainBlock);
        inverterGroup.add(mainBlock);

        // Cooling Fins
        for(let i=0; i<15; i++) {
            const fin = new THREE.Mesh(new THREE.BoxGeometry(2.0, 0.1, 0.05), mats.steel);
            fin.position.set(0, -0.3, -1.4 + (i * 0.2));
            applyWireframeDetail(fin);
            inverterGroup.add(fin);
        }

        // Phase Junction Boxes with *Puertos* [Ports] and Diagnostic Panels
        const jBoxL = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.3, 1.0), mats.castIron);
        jBoxL.position.set(-1.25, 0, 0);
        applyWireframeDetail(jBoxL);
        
        const portL1 = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.1, 16).rotateZ(Math.PI/2), mats.whitePaint);
        portL1.position.set(-1.4, 0, 0.3);
        const portL2 = portL1.clone(); portL2.position.set(-1.4, 0, -0.3);
        const panelL = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.15, 0.4), mats.whitePaint);
        panelL.position.set(-1.4, 0, 0);
        inverterGroup.add(jBoxL, portL1, portL2, panelL);
        
        const jBoxR = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.3, 1.0), mats.castIron);
        jBoxR.position.set(1.25, 0, 0);
        applyWireframeDetail(jBoxR);

        const portR1 = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.1, 16).rotateZ(Math.PI/2), mats.whitePaint);
        portR1.position.set(1.4, 0, 0.3);
        const portR2 = portR1.clone(); portR2.position.set(1.4, 0, -0.3);
        const panelR = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.15, 0.4), mats.whitePaint);
        panelR.position.set(1.4, 0, 0);
        inverterGroup.add(jBoxR, portR1, portR2, panelR);

        uc.add(inverterGroup);
    };
    buildTractionInverter();
    
    const buildConduit = (points: THREE.Vector3[], radius: number, mat: THREE.Material) => {
        const curve = new THREE.CatmullRomCurve3(points);
        const tubeGeom = new THREE.TubeGeometry(curve, 32, radius, 8, false);
        const tube = new THREE.Mesh(tubeGeom, mat);
        applyWireframeDetail(tube);
        uc.add(tube);
    };

    // --- Interconnect Geometry ---
    const buildChassisInterface = (zOffset: number) => {
        const frameWidth = 1.435 + 0.3;
        const dir = zOffset > 0 ? 1 : -1;
        const shY = -0.9; // Shift amount increased downward matching lower chassisBaseY
        
        const pinGeom = new THREE.CylinderGeometry(0.16, 0.16, 0.4, 16);
        const pin = new THREE.Mesh(pinGeom, mats.steel);
        pin.position.set(0, 0.90 + shY, zOffset); 
        applyWireframeDetail(pin);
        uc.add(pin);

        const padGeom = new THREE.BoxGeometry(0.4, 0.4, 0.4);
        const padL = new THREE.Mesh(padGeom, mats.darkMetal);
        padL.position.set(-frameWidth / 2, 1.125 + shY, zOffset); 
        applyWireframeDetail(padL);
        
        const padR = new THREE.Mesh(padGeom, mats.darkMetal);
        padR.position.set(frameWidth / 2, 1.125 + shY, zOffset);
        applyWireframeDetail(padR);
        uc.add(padL, padR);

        const yawGeom = new THREE.CylinderGeometry(0.04, 0.04, 0.6, 16);
        yawGeom.rotateX(Math.PI / 4);
        
        const yawL = new THREE.Mesh(yawGeom, mats.darkMetal);
        yawL.position.set(-0.6, 0.85 + shY, zOffset - (0.25 * dir));
        applyWireframeDetail(yawL);
        
        const yawR = new THREE.Mesh(yawGeom, mats.darkMetal);
        yawR.position.set(0.6, 0.85 + shY, zOffset + (0.25 * dir));
        applyWireframeDetail(yawR);
        uc.add(yawL, yawR);

        const auxTankGeom = new THREE.CylinderGeometry(0.18, 0.18, 0.8, 16).rotateX(Math.PI/2);
        const auxTankL = new THREE.Mesh(auxTankGeom, mats.yellowPaint);
        auxTankL.position.set(-frameWidth / 2, 1.10 + shY, zOffset);
        const auxTankR = new THREE.Mesh(auxTankGeom, mats.yellowPaint);
        auxTankR.position.set(frameWidth / 2, 1.10 + shY, zOffset);
        applyWireframeDetail(auxTankL); applyWireframeDetail(auxTankR);
        uc.add(auxTankL, auxTankR);

        const conduitJunctionGeom = new THREE.BoxGeometry(0.15, 0.15, 0.15);
        const conduitJunctionL = new THREE.Mesh(conduitJunctionGeom, mats.castIron);
        conduitJunctionL.position.set(-0.4, 1.0 + shY, zOffset);
        const conduitJunctionR = new THREE.Mesh(conduitJunctionGeom, mats.castIron);
        conduitJunctionR.position.set(0.4, 1.0 + shY, zOffset);
        applyWireframeDetail(conduitJunctionL); applyWireframeDetail(conduitJunctionR);
        uc.add(conduitJunctionL, conduitJunctionR);

        const bolsterGeom = new THREE.BoxGeometry(1.8, 0.25, 0.8);
        const bolster = new THREE.Mesh(bolsterGeom, mats.darkMetal);
        bolster.position.set(0, 1.175 + shY, zOffset); 
        applyWireframeDetail(bolster);
        uc.add(bolster);
        
        const linkGeom = new THREE.CylinderGeometry(0.03, 0.03, 0.45, 16);
        const linkL = new THREE.Mesh(linkGeom, mats.steel);
        linkL.position.set(-0.8, 0.85 + shY, zOffset + (0.4 * dir));
        const linkR = new THREE.Mesh(linkGeom, mats.steel);
        linkR.position.set(0.8, 0.85 + shY, zOffset + (0.4 * dir));
        applyWireframeDetail(linkL); applyWireframeDetail(linkR);
        uc.add(linkL, linkR);

        const upperDamperGeom = new THREE.CylinderGeometry(0.04, 0.04, 0.4, 16);
        const upperDamperL = new THREE.Mesh(upperDamperGeom, mats.darkMetal);
        upperDamperL.position.set(-frameWidth / 2 - 0.35, 1.0 + shY, zOffset);
        const upperDamperR = new THREE.Mesh(upperDamperGeom, mats.darkMetal);
        upperDamperR.position.set(frameWidth / 2 + 0.35, 1.0 + shY, zOffset);
        applyWireframeDetail(upperDamperL); applyWireframeDetail(upperDamperR);
        uc.add(upperDamperL, upperDamperR);

        const routeBrakeCables = (axleZOffset: number) => {
            buildConduit([
                new THREE.Vector3(-0.4, 1.0 + shY, zOffset),
                new THREE.Vector3(-0.2, 0.8 + shY, axleZOffset + (0.3 * Math.sign(zOffset))),
                new THREE.Vector3(-0.15, 0.54, axleZOffset) 
            ], 0.015, mats.sensorWire);

            buildConduit([
                new THREE.Vector3(0.4, 1.0 + shY, zOffset),
                new THREE.Vector3(0.2, 0.8 + shY, axleZOffset + (0.3 * Math.sign(zOffset))),
                new THREE.Vector3(0.15, 0.54, axleZOffset) 
            ], 0.015, mats.sensorWire);
        };

        routeBrakeCables(zOffset - 1.1);
        routeBrakeCables(zOffset + 1.1);

        buildConduit([
            new THREE.Vector3(-0.4, 1.0 + shY, zOffset),
            new THREE.Vector3(-0.4, 1.15 + shY, zOffset - (1.5 * dir)),
            new THREE.Vector3(0, 1.2 + shY, 0)
        ], 0.02, mats.sensorWire);

        buildConduit([
            new THREE.Vector3(0.4, 1.0 + shY, zOffset),
            new THREE.Vector3(0.4, 1.15 + shY, zOffset - (1.5 * dir)),
            new THREE.Vector3(0, 1.2 + shY, 0)
        ], 0.02, mats.sensorWire);

        const hvStartX = -1.4;
        const hvStartY = chassisBaseY;
        const hvStartZ = zOffset > 0 ? 0.3 : -0.3; 
        
        const motorTargetX = -0.4; // gearXAlignment
        const motorTargetZ = zOffset + (0.65 * dir);

        buildConduit([
            new THREE.Vector3(hvStartX, hvStartY, hvStartZ),
            new THREE.Vector3(hvStartX + 0.3, hvStartY - 0.2, hvStartZ + (0.4 * dir)),
            new THREE.Vector3(motorTargetX - 0.2, 0.8, motorTargetZ - (0.2 * dir)),
            new THREE.Vector3(motorTargetX, 0.65, motorTargetZ) // Mates exactly to motor top
        ], 0.035, mats.hvCable);

        const hvStartXR = 1.4;
        buildConduit([
            new THREE.Vector3(hvStartXR, hvStartY, hvStartZ),
            new THREE.Vector3(hvStartXR - 0.3, hvStartY - 0.2, hvStartZ + (0.4 * dir)),
            new THREE.Vector3(motorTargetX + 0.2, 0.8, motorTargetZ - (0.2 * dir)),
            new THREE.Vector3(motorTargetX, 0.65, motorTargetZ)
        ], 0.035, mats.hvCable);
    };

    buildChassisInterface(-5.5);
    buildChassisInterface(5.5);

    const buildTank = (x: number, y: number, z: number, mat: THREE.Material) => {
        const tankGroup = new THREE.Group();
        const resGeom = new THREE.CylinderGeometry(0.2, 0.2, 1.8, 32).rotateX(Math.PI/2);
        const res = new THREE.Mesh(resGeom, mat);
        applyWireframeDetail(res);
        tankGroup.add(res);

        const capGeom = new THREE.SphereGeometry(0.2, 32, 16);
        const cap1 = new THREE.Mesh(capGeom, mat); cap1.position.z = -0.9;
        const cap2 = new THREE.Mesh(capGeom, mat); cap2.position.z = 0.9;
        applyWireframeDetail(cap1); applyWireframeDetail(cap2);
        tankGroup.add(cap1, cap2);

        const strapGeom = new THREE.TorusGeometry(0.205, 0.02, 16, 32).rotateX(Math.PI/2);
        const strap1 = new THREE.Mesh(strapGeom, mats.darkMetal);
        strap1.position.z = -0.6;
        const strap2 = new THREE.Mesh(strapGeom, mats.darkMetal);
        strap2.position.z = 0.6;
        applyWireframeDetail(strap1); applyWireframeDetail(strap2);
        tankGroup.add(strap1, strap2);

        const mountGeom = new THREE.BoxGeometry(0.05, 0.45, 0.1);
        const mount1 = new THREE.Mesh(mountGeom, mats.castIron);
        mount1.position.set(0, 0.25, -0.6); 
        const mount2 = new THREE.Mesh(mountGeom, mats.castIron);
        mount2.position.set(0, 0.25, 0.6);
        applyWireframeDetail(mount1); applyWireframeDetail(mount2);
        tankGroup.add(mount1, mount2);

        tankGroup.position.set(x, y, z);
        uc.add(tankGroup);
    }

    buildTank(-0.8, chassisBaseY - 0.1, -2.5, mats.yellowPaint);
    buildTank(-0.8, chassisBaseY - 0.1, 2.5, mats.yellowPaint);
    buildTank(-0.3, chassisBaseY - 0.1, -2.5, mats.whitePaint);
    buildTank(0.8, chassisBaseY - 0.1, 2.5, mats.yellowPaint);

    buildConduit([
        new THREE.Vector3(-0.8, chassisBaseY, -1.6),
        new THREE.Vector3(-0.8, chassisBaseY, 0),
        new THREE.Vector3(-0.8, chassisBaseY, 1.6)
    ], 0.04, mats.pipeRubber);

    buildConduit([
        new THREE.Vector3(-0.8, chassisBaseY, 0),
        new THREE.Vector3(0, chassisBaseY, 0),
        new THREE.Vector3(0.8, chassisBaseY, 1.6) 
    ], 0.04, mats.pipeRubber);

    const compressorBox = new THREE.Group();
    compressorBox.position.set(0.6, chassisBaseY, -2.5);
    
    const casingShape = new THREE.Shape();
    casingShape.moveTo(-0.6, -0.25);
    casingShape.lineTo(0.6, -0.25);
    casingShape.lineTo(0.6, 0.25);
    casingShape.lineTo(-0.6, 0.25);
    casingShape.closePath();
    
    const fanHole = new THREE.Path();
    fanHole.absarc(0, 0, 0.22, 0, Math.PI * 2, false);
    casingShape.holes.push(fanHole);

    const cHousingGeom = new THREE.ExtrudeGeometry(casingShape, { depth: 0.8, bevelEnabled: false });
    cHousingGeom.rotateY(Math.PI / 2);
    cHousingGeom.center(); 
    
    const cHousing = new THREE.Mesh(cHousingGeom, mats.castIron);
    applyWireframeDetail(cHousing);
    compressorBox.add(cHousing);

    const fanGroup = new THREE.Group();
    fanGroup.position.set(0.38, 0, 0); 
    
    const fanHub = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.08, 16).rotateZ(Math.PI/2), mats.darkMetal);
    applyWireframeDetail(fanHub);
    fanGroup.add(fanHub);

    for(let i=0; i<8; i++) {
        const blade = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.18, 0.06), mats.polishedSteel);
        blade.position.set(0, 0.1, 0);
        blade.rotation.y = Math.PI / 4;
        
        const pivot = new THREE.Group();
        pivot.rotation.x = (Math.PI * 2 / 8) * i; 
        pivot.add(blade);
        applyWireframeDetail(blade);
        fanGroup.add(pivot);
    }
    
    fanGroup.userData.kinematicType = 'fan';
    fanGroup.userData.kinematic = { type: 'fan', ratio: 15.0 };
    compressorBox.add(fanGroup);
    uc.add(compressorBox);

    return uc;
}
