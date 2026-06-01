import * as THREE from 'three';
import { mergeVertices } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { AppState, mats, CAR_LEN, CAR_TOTAL_LEN, COUPLER_GAP, FLOOR_Y, HEIGHT_INT, BOGIE_CEN, CAR_WIDTH_INT } from './App';
import { buildHDBogie } from './HD_Bogies';

export function getShellMaterial(forceOpaque = false) {
  return new THREE.MeshPhysicalMaterial({
    color: 0xdde2e5,
    metalness: 0.05,
    roughness: 0.8,
    clearcoat: 0.0,
    clearcoatRoughness: 0.1,
    transparent: !forceOpaque,
    opacity: forceOpaque ? 1.0 : 0.15,
    side: THREE.DoubleSide,
  });
}


export function buildBogie(z: number, activeKinematics: any[]) {
  const bogie = buildHDBogie(activeKinematics, z > 0);
  bogie.position.set(0, 0, z);
  return bogie;
}

let outerPoints: THREE.Vector2[] = [];
let innerPoints: THREE.Vector2[] = [];

function initShellProfiles() {
  if (outerPoints.length > 0) return;
  const ptsOuter = new THREE.Path();
  ptsOuter.moveTo(-1.256, 0.5);
  ptsOuter.lineTo(-1.256, 1.656);
  ptsOuter.bezierCurveTo(-1.256, 2.6, -0.8, 2.866, 0, 2.866);
  ptsOuter.bezierCurveTo(0.8, 2.866, 1.256, 2.6, 1.256, 1.656);
  ptsOuter.lineTo(1.256, 0.5);
  outerPoints = ptsOuter.getSpacedPoints(1000);

  const ptsInner = new THREE.Path();
  ptsInner.moveTo(1.216, 0.5);
  ptsInner.lineTo(1.216, 1.656);
  ptsInner.bezierCurveTo(1.216, 2.56, 0.8, 2.826, 0, 2.826);
  ptsInner.bezierCurveTo(-0.8, 2.826, -1.216, 2.56, -1.216, 1.656);
  ptsInner.lineTo(-1.216, 0.5);
  innerPoints = ptsInner.getSpacedPoints(1000).reverse();
}

function getSubShape(startIndex: number, endIndex: number) {
  if (startIndex >= endIndex) return null;
  const s = new THREE.Shape();
  s.moveTo(outerPoints[startIndex].x, outerPoints[startIndex].y);
  for (let i = startIndex + 1; i <= endIndex; i++)
    s.lineTo(outerPoints[i].x, outerPoints[i].y);
  s.lineTo(innerPoints[endIndex].x, innerPoints[endIndex].y);
  for (let i = endIndex - 1; i >= startIndex; i--)
    s.lineTo(innerPoints[i].x, innerPoints[i].y);
  s.lineTo(outerPoints[startIndex].x, outerPoints[startIndex].y);
  return s;
}

function getThinSubShape(
  startIndex: number,
  endIndex: number,
  leftSide: boolean,
  thickness: number = 0.02,
  offsetFromOuter: number = 0.01,
) {
  if (startIndex >= endIndex) return null;
  const s = new THREE.Shape();

  const pOut: THREE.Vector2[] = [];
  const pIn: THREE.Vector2[] = [];
  const sign = leftSide ? 1 : -1;

  for (let i = startIndex; i <= endIndex; i++) {
    pOut.push(
      new THREE.Vector2(
        outerPoints[i].x + sign * offsetFromOuter,
        outerPoints[i].y,
      ),
    );
    pIn.push(
      new THREE.Vector2(
        outerPoints[i].x + sign * (offsetFromOuter + thickness),
        outerPoints[i].y,
      ),
    );
  }

  s.moveTo(pOut[0].x, pOut[0].y);
  for (let i = 1; i < pOut.length; i++) s.lineTo(pOut[i].x, pOut[i].y);
  s.lineTo(pIn[pIn.length - 1].x, pIn[pIn.length - 1].y);
  for (let i = pIn.length - 2; i >= 0; i--) s.lineTo(pIn[i].x, pIn[i].y);
  s.lineTo(pOut[0].x, pOut[0].y);
  return s;
}

function findIndexForY(y: number, leftSide: boolean) {
  let closestI = -1;
  let closestDist = 9999;
  for (let i = 0; i < outerPoints.length; i++) {
    const p = outerPoints[i];
    if (leftSide && p.x > 0) continue;
    if (!leftSide && p.x < 0) continue;
    const d = Math.abs(p.y - y);
    if (d < closestDist) {
      closestDist = d;
      closestI = i;
    }
  }
  return closestI;
}

function createSegment(yMin: number, yMax: number, length: number) {
  if (length <= 0) return new THREE.BufferGeometry();
  const shapes: THREE.Shape[] = [];
  const ROOF_SPLIT_Y = 2.52;
  const iLeftSplit = findIndexForY(ROOF_SPLIT_Y, true);
  const iRightSplit = findIndexForY(ROOF_SPLIT_Y, false);

  if (yMin <= 0 && yMax <= 0) {
    const sL = getSubShape(0, iLeftSplit);
    if (sL) shapes.push(sL);
    const sR = getSubShape(iRightSplit, outerPoints.length - 1);
    if (sR) shapes.push(sR);
  } else {
    const iLeftMin = findIndexForY(yMin, true);
    const iLeftMax = findIndexForY(Math.min(yMax, ROOF_SPLIT_Y), true);
    const iRightMax = findIndexForY(Math.min(yMax, ROOF_SPLIT_Y), false);
    const iRightMin = findIndexForY(yMin, false);

    if (yMin > 0.51) {
      const s1 = getSubShape(0, iLeftMin);
      if (s1) shapes.push(s1);
      const s2 = getSubShape(iRightMin, outerPoints.length - 1);
      if (s2) shapes.push(s2);
    }
    if (yMax < ROOF_SPLIT_Y) {
      const sRoofL = getSubShape(iLeftMax, iLeftSplit);
      if (sRoofL) shapes.push(sRoofL);
      const sRoofR = getSubShape(iRightSplit, iRightMax);
      if (sRoofR) shapes.push(sRoofR);
    }
  }
  if (shapes.length === 0) return new THREE.BufferGeometry();
  return new THREE.ExtrudeGeometry(shapes, {
    depth: length,
    bevelEnabled: false,
    steps: 1,
  });
}

function createDoorEntity(
  z: number,
  leftSide: boolean,
  leafW: number,
  isDriver: boolean = false,
  windowAlign: "left" | "right" | "center" = "center",
) {
  const yBot = 0.555;
  const yTop = 2.52;

  let yWBot = 1.28;
  let yWTop = 2.368;
  let mat = mats.redDoor;
  let windowWidthPct = 0.65;

  if (isDriver) {
    yWBot = 1.28;
    yWTop = 1.9215; // Set back to center of hull window, per instructions
    mat = mats.whiteDoor;
    windowWidthPct = 0.5; // Instruction said 50% for driver
  }

  const MathMin = Math.min;
  const MathMax = Math.max;

  const doorGroup = new THREE.Group();

  const iBot = findIndexForY(yBot, leftSide);
  const iWBot = findIndexForY(yWBot, leftSide);
  const iWTop = findIndexForY(yWTop, leftSide);
  const iTop = findIndexForY(yTop, leftSide);

  const shapeBot = getSubShape(MathMin(iBot, iWBot), MathMax(iBot, iWBot));
  const shapeMid = getSubShape(MathMin(iWBot, iWTop), MathMax(iWBot, iWTop));
  const shapeTop = getSubShape(MathMin(iWTop, iTop), MathMax(iWTop, iTop));

  const midW = leafW * windowWidthPct;
  const defaultMargin = (leafW - midW) / 2;
  let edgeW1 = defaultMargin;
  let edgeW2 = defaultMargin;

  if (windowAlign === "left") {
    edgeW1 = defaultMargin * 0.4;
    edgeW2 = defaultMargin * 1.6;
  } else if (windowAlign === "right") {
    edgeW2 = defaultMargin * 0.4;
    edgeW1 = defaultMargin * 1.6;
  }

  if (shapeBot) {
    const mBot = new THREE.Mesh(
      new THREE.ExtrudeGeometry(shapeBot, {
        depth: leafW,
        bevelEnabled: false,
        steps: 1,
      }),
      mat,
    );
    mBot.position.z = 0;
    doorGroup.add(mBot);
  }
  if (shapeTop) {
    const mTop = new THREE.Mesh(
      new THREE.ExtrudeGeometry(shapeTop, {
        depth: leafW,
        bevelEnabled: false,
        steps: 1,
      }),
      mat,
    );
    mTop.position.z = 0;
    doorGroup.add(mTop);
  }
  if (shapeMid) {
    const mEdge1 = new THREE.Mesh(
      new THREE.ExtrudeGeometry(shapeMid, {
        depth: edgeW1,
        bevelEnabled: false,
        steps: 1,
      }),
      mat,
    );
    mEdge1.position.z = 0;
    doorGroup.add(mEdge1);

    const mEdge2 = new THREE.Mesh(
      new THREE.ExtrudeGeometry(shapeMid, {
        depth: edgeW2,
        bevelEnabled: false,
        steps: 1,
      }),
      mat,
    );
    mEdge2.position.z = leafW - edgeW2;
    doorGroup.add(mEdge2);

    const mGlass = new THREE.Mesh(
      new THREE.ExtrudeGeometry(shapeMid, {
        depth: midW,
        bevelEnabled: false,
        steps: 1,
      }),
      mats.glass,
    );
    mGlass.position.z = edgeW1;
    const mgEdges = new THREE.LineSegments(
      new THREE.EdgesGeometry(mGlass.geometry, 20),
      new THREE.LineBasicMaterial({ color: 0x000000 }),
    );
    mGlass.add(mgEdges);
    doorGroup.add(mGlass);

    addRoundedCorners(
      doorGroup,
      edgeW1,
      leafW - edgeW2,
      yWBot,
      yWTop,
      leftSide,
      mat,
      0.1,
    );
  }

  if (isDriver) {
    const bdGeom = new THREE.BoxGeometry(0.015, 0.35, leafW);
    const bdMesh = new THREE.Mesh(bdGeom, mats.blueBand);
    bdMesh.position.set(leftSide ? -1.26 : 1.26, 0.555 + 0.35 / 2, leafW / 2);
    doorGroup.add(bdMesh);
  }

  return doorGroup;
}

function addRoundedCorners(
  g: THREE.Group,
  zMin: number,
  zMax: number,
  yMin: number,
  yMax: number,
  leftSide: boolean,
  mat: THREE.Material,
  r: number = 0.15,
) {
  const buildCornerGeom = (
    isTop: boolean,
    isRight: boolean,
    yBase: number,
    zBase: number,
  ) => {
    const shape = new THREE.Shape();
    shape.moveTo(0, r);
    shape.lineTo(0, 0);
    shape.lineTo(r, 0);
    shape.absarc(r, r, r, -Math.PI / 2, Math.PI, true);

    const depth = 0.05;
    let geom = new THREE.ExtrudeGeometry(shape, {
      depth: depth,
      bevelEnabled: false,
      curveSegments: 8,
    });

    const pos = geom.attributes.position;
    const inwardSign = leftSide ? 1 : -1;

    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i);
      const y = pos.getY(i);
      const z = pos.getZ(i); // depth from 0 to 0.05

      const try_Y = yBase + (isTop ? -y : y);
      const idx = findIndexForY(try_Y, leftSide);
      const hullX = outerPoints[idx].x;
      const try_X = hullX + inwardSign * z;
      const try_Z = zBase + (isRight ? -x : x);

      pos.setXYZ(i, try_X, try_Y, try_Z);
    }

    const numFlips = (isTop ? 1 : 0) + (isRight ? 1 : 0) + (!leftSide ? 1 : 0);
    if (numFlips % 2 !== 0) {
      const idx = geom.getIndex();
      if (idx) {
        for (let i = 0; i < idx.count; i += 3) {
          const a = idx.getX(i);
          const b = idx.getX(i + 1);
          idx.setX(i, b);
          idx.setX(i + 1, a);
        }
      }
    }

    geom = mergeVertices(geom);
    geom.computeVertexNormals();
    return geom;
  };

  g.add(new THREE.Mesh(buildCornerGeom(false, false, yMin, zMin), mat));
  g.add(new THREE.Mesh(buildCornerGeom(false, true, yMin, zMax), mat));
  g.add(new THREE.Mesh(buildCornerGeom(true, false, yMax, zMin), mat));
  g.add(new THREE.Mesh(buildCornerGeom(true, true, yMax, zMax), mat));
}

// Side-facing seat block for 1992 Tube Stock
function buildSideSeat(length: number, isRightSide: boolean) {
  const sShape = new THREE.Shape();
  sShape.moveTo(0, 0);
  sShape.lineTo(0.45, 0);
  sShape.quadraticCurveTo(0.5, 0, 0.5, 0.1);
  sShape.lineTo(0.5, 0.35); // Base height
  sShape.lineTo(0.15, 0.35);
  sShape.lineTo(0.12, 0.65); // Shortened backrest to completely miss the window sill
  sShape.quadraticCurveTo(0.12, 0.68, 0.05, 0.68);
  sShape.lineTo(0, 0.68);
  sShape.lineTo(0, 0);

  const sGeom = new THREE.ExtrudeGeometry(sShape, {
    depth: length,
    bevelEnabled: true,
    bevelSegments: 2,
    steps: 1,
    bevelSize: 0.015,
    bevelThickness: 0.015,
  });
  sGeom.translate(0, 0, -length / 2); // Center Z only
  const block = new THREE.Mesh(sGeom, mats.seat);
  block.position.set(0, 0, 0);

  const edges = new THREE.LineSegments(
    new THREE.EdgesGeometry(sGeom, 25),
    new THREE.LineBasicMaterial({ color: 0x1e3a8a }),
  );
  block.add(edges);

  const g = new THREE.Group();
  g.add(block);

  // Height of window side dividers adjusted so it stays below window too
  const divShape = new THREE.Shape();
  // Start at bottom aisle side
  divShape.moveTo(0.55, 0.0);
  divShape.lineTo(0.55, 1.3);

  // Now curve along the wall for the outer edge
  for (let ptY = 1.3; ptY >= 0; ptY -= 0.1) {
    let globalY = FLOOR_Y + ptY;
    let idx = findIndexForY(globalY, true);
    let wallX = Math.abs(outerPoints[idx].x) - 0.04; // inner wall depth
    let localX = 1.14 - wallX; // Offset matches the new retracted xPos
    localX = Math.max(0, localX);
    divShape.lineTo(localX, ptY);
  }
  divShape.lineTo(0, 0);
  divShape.lineTo(0.55, 0.0);

  const divGeomCurved = new THREE.ExtrudeGeometry(divShape, {
    depth: 0.02,
    bevelEnabled: false,
  });
  divGeomCurved.translate(0, 0, -0.01); // Center depth

  const div1 = new THREE.Mesh(divGeomCurved, mats.glass);
  div1.position.set(0, 0, -length / 2 + 0.01);
  const divEdges1 = new THREE.LineSegments(
    new THREE.EdgesGeometry(divGeomCurved),
    new THREE.LineBasicMaterial({ color: 0x000000 }),
  );
  div1.add(divEdges1);

  const div2 = new THREE.Mesh(divGeomCurved, mats.glass);
  div2.position.set(0, 0, length / 2 - 0.01);
  const divEdges2 = new THREE.LineSegments(
    new THREE.EdgesGeometry(divGeomCurved),
    new THREE.LineBasicMaterial({ color: 0x000000 }),
  );
  div2.add(divEdges2);
  g.add(div1, div2);

  const poleHeight = HEIGHT_INT;
  const p1 = new THREE.Mesh(
    new THREE.CylinderGeometry(0.02, 0.02, poleHeight, 8),
    mats.redPole,
  );
  p1.position.set(0.48, poleHeight / 2, -length / 2 - 0.03);
  const p2 = new THREE.Mesh(
    new THREE.CylinderGeometry(0.02, 0.02, poleHeight, 8),
    mats.redPole,
  );
  p2.position.set(0.48, poleHeight / 2, length / 2 + 0.03);
  g.add(p1, p2);

  if (length > 2.0) {
    const pMid = new THREE.Mesh(
      new THREE.CylinderGeometry(0.015, 0.015, poleHeight, 8),
      mats.yellowPole,
    );
    pMid.position.set(0.48, poleHeight / 2, 0);
    g.add(pMid);
  }

  const xPos = isRightSide ? 1.14 : -1.14; // Retracted inwards to guarantee no hull clipping
  g.position.set(xPos, FLOOR_Y, 0);
  g.rotation.y = isRightSide ? Math.PI : 0;

  return g;
}

function placeStanchion(
  g: THREE.Group,
  xPos: number,
  zPos: number,
  isRed: boolean = false,
) {
  const ceilY = FLOOR_Y + HEIGHT_INT;
  const poleLen = ceilY - FLOOR_Y;
  const mat = isRed ? mats.redPole : mats.yellowPole;
  const pole = new THREE.Mesh(
    new THREE.CylinderGeometry(0.02, 0.02, poleLen, 8),
    mat,
  );
  pole.position.set(xPos, FLOOR_Y + poleLen / 2, zPos);
  g.add(pole);
}

export function buildInterior(isFirst: boolean = false, isLast: boolean = false) {
  initShellProfiles();
  const g = new THREE.Group();
  const Z_DOOR_SGL = CAR_LEN / 2 - 1.086;
  const startZ = isFirst ? -Z_DOOR_SGL - 0.4 : -CAR_LEN / 2;
  const endZ = isLast ? Z_DOOR_SGL + 0.4 : CAR_LEN / 2;
  const saloonLength = endZ - startZ;
  const floor = new THREE.Mesh(
    new THREE.BoxGeometry(CAR_WIDTH_INT, 0.1, saloonLength),
    mats.floor,
  );
  floor.position.y = FLOOR_Y - 0.05;
  floor.position.z = (startZ + endZ) / 2;
  g.add(floor);

  const ceilY = FLOOR_Y + HEIGHT_INT;

  if (!isFirst && !isLast) {
    const tSeatL1 = buildSideSeat(2.6, false);
    tSeatL1.position.z = -5.012;
    const tSeatR1 = buildSideSeat(2.6, true);
    tSeatR1.position.z = -5.012;
    const tSeatL2 = buildSideSeat(2.6, false);
    tSeatL2.position.z = 5.012;
    const tSeatR2 = buildSideSeat(2.6, true);
    tSeatR2.position.z = 5.012;

    const midSeatL = buildSideSeat(1.8, false);
    midSeatL.position.z = 0;
    const midSeatR = buildSideSeat(1.8, true);
    midSeatR.position.z = 0;

    g.add(tSeatL1, tSeatR1, tSeatL2, tSeatR2, midSeatL, midSeatR);
  } else {
    const sign = isFirst ? 1 : -1;

    const endRearSeatL = buildSideSeat(2.6, false);
    endRearSeatL.position.z = sign * 5.012;
    const endRearSeatR = buildSideSeat(2.6, true);
    endRearSeatR.position.z = sign * 5.012;

    const midSeatL = buildSideSeat(1.8, false);
    midSeatL.position.z = 0;
    const midSeatR = buildSideSeat(1.8, true);
    midSeatR.position.z = 0;

    const endFrontSeatL = buildSideSeat(2.8, false);
    endFrontSeatL.position.z = -sign * 5.128;
    const endFrontSeatR = buildSideSeat(2.8, true);
    endFrontSeatR.position.z = -sign * 5.128;

    g.add(
      endRearSeatL,
      endRearSeatR,
      midSeatL,
      midSeatR,
      endFrontSeatL,
      endFrontSeatR,
    );
  }

  [-2.5, 2.5].forEach((z) => {
    placeStanchion(g, 0, z, false);
  });

  const passStartZ = isFirst ? startZ + 2.0 : startZ;
  const passEndZ = isLast ? endZ - 2.0 : endZ;

  // Continuous light strip instead of individual cylinder lights
  const ceilLen = passEndZ - passStartZ;
  if (ceilLen > 0) {
    const tube = new THREE.Mesh(
      new THREE.BoxGeometry(0.5, 0.05, ceilLen),
      new THREE.MeshStandardMaterial({
        color: 0xffffff,
        emissive: 0xffffee,
        emissiveIntensity: 1.0,
      }),
    );
    tube.position.set(0, ceilY - 0.05, (passStartZ + passEndZ) / 2);
    g.add(tube);
    tube.userData.isInteriorLight = true;
  }

  for (let z = -7; z <= 7; z += 3.5) {
    if (z < passStartZ || z > passEndZ) continue;
    const l = new THREE.PointLight(0xffeedd, 0.7, 8);
    l.position.set(0, ceilY - 0.1, z);
    g.add(l);
    l.userData.isInteriorLight = true;
  }
  return g;
}

function createSideWindowShape(isLeft: boolean) {
  const shape = new THREE.Shape();
  if (isLeft) {
    shape.moveTo(-0.4215, 1.28);
    shape.lineTo(-1.18, 1.346);
    shape.quadraticCurveTo(-1.2, 1.348, -1.2, 1.36);
    shape.lineTo(-1.131, 2.15);
    shape.lineTo(-1.081, 2.2);
    shape.quadraticCurveTo(-0.85, 2.432, -0.4215, 2.432);
    shape.lineTo(-0.4215, 1.28);
  } else {
    shape.moveTo(0.4215, 1.28);
    shape.lineTo(1.18, 1.346);
    shape.quadraticCurveTo(1.2, 1.348, 1.2, 1.36);
    shape.lineTo(1.131, 2.15);
    shape.lineTo(1.081, 2.2);
    shape.quadraticCurveTo(0.85, 2.432, 0.4215, 2.432);
    shape.lineTo(0.4215, 1.28);
  }
  return shape;
}

function buildEndAssembly(isCab: boolean, isFrontOfTrain: boolean = false) {
  initShellProfiles();
  const group = new THREE.Group();

  const shellShape = new THREE.Shape(outerPoints);

  const createFrontWindow = (isLeft: boolean) => {
    const shape = new THREE.Shape();
    if (isLeft) {
      shape.moveTo(-0.4215, 1.28);
      shape.lineTo(-1.18, 1.346);
      shape.quadraticCurveTo(-1.2, 1.348, -1.2, 1.36);
      shape.lineTo(-1.131, 2.15);
      shape.lineTo(-1.081, 2.2);
      shape.quadraticCurveTo(-0.85, 2.432, -0.4215, 2.432);
      shape.lineTo(-0.4215, 1.28);
    } else {
      shape.moveTo(0.4215, 1.28);
      shape.lineTo(1.18, 1.346);
      shape.quadraticCurveTo(1.2, 1.348, 1.2, 1.36);
      shape.lineTo(1.131, 2.15);
      shape.lineTo(1.081, 2.2);
      shape.quadraticCurveTo(0.85, 2.432, 0.4215, 2.432);
      shape.lineTo(0.4215, 1.28);
    }
    return shape;
  };

  shellShape.holes.push(createFrontWindow(true) as any);
  shellShape.holes.push(createFrontWindow(false) as any);

  const cabDoorW = 0.35;
  const cabDoorBot = 0.725;
  const cabDoorTop = 2.48;

  const dw = new THREE.Path();
  dw.moveTo(-cabDoorW, cabDoorBot);
  dw.lineTo(cabDoorW, cabDoorBot);
  dw.lineTo(cabDoorW, cabDoorTop);
  dw.lineTo(-cabDoorW, cabDoorTop);
  dw.lineTo(-cabDoorW, cabDoorBot);
  shellShape.holes.push(dw);

  const applySlant = (geom: THREE.BufferGeometry) => {
    if (isCab) return geom;
    const pos = geom.attributes.position;
    if (!pos) return geom;
    for (let i = 0; i < pos.count; i++) {
      let px = pos.getX(i);
      if (Math.abs(px) > cabDoorW) {
        // 5 degrees in radians
        let shift = (Math.abs(px) - cabDoorW) * Math.tan((5 * Math.PI) / 180);
        pos.setZ(i, pos.getZ(i) - shift);
      }
    }
    geom = mergeVertices(geom);
    geom.computeVertexNormals();
    return geom;
  };

  let shellExtrusion: THREE.BufferGeometry = new THREE.ExtrudeGeometry(shellShape, {
    depth: 0.05,
    bevelEnabled: false,
    curveSegments: 32,
  });
  shellExtrusion = applySlant(shellExtrusion);
  const shellMat = isCab ? mats.redDoor : mats.shellSolid;
  const shellMesh = new THREE.Mesh(shellExtrusion, shellMat);
  shellMesh.userData.isShellWall = false;
  shellMesh.position.z = -0.025;
  group.add(shellMesh);

  const lwGeom = new THREE.ShapeGeometry(createFrontWindow(true) as any);
  const rwGeom = new THREE.ShapeGeometry(createFrontWindow(false) as any);
  applySlant(lwGeom);
  applySlant(rwGeom);
  const lGlass = new THREE.Mesh(lwGeom, mats.glass);
  const rGlass = new THREE.Mesh(rwGeom, mats.glass);
  lGlass.position.z = 0;
  rGlass.position.z = 0;
  group.add(lGlass, rGlass);

  const borderTubeGeomLeft = new THREE.TubeGeometry(
    new THREE.CatmullRomCurve3(
      (createFrontWindow(true) as any)
        .getPoints()
        .map((p: any) => new THREE.Vector3(p.x, p.y, 0)),
      true,
      "catmullrom",
      0.0, // tension 0 for better corner fit
    ),
    100,
    0.03,
    6,
    true,
  );
  const borderTubeGeomRight = new THREE.TubeGeometry(
    new THREE.CatmullRomCurve3(
      (createFrontWindow(false) as any)
        .getPoints()
        .map((p: any) => new THREE.Vector3(p.x, p.y, 0)),
      true,
      "catmullrom",
      0.0,
    ),
    100,
    0.03,
    6,
    true,
  );
  const leftBorder = new THREE.Mesh(borderTubeGeomLeft, mats.frame);
  const rightBorder = new THREE.Mesh(borderTubeGeomRight, mats.frame);
  leftBorder.position.z = 0.01;
  rightBorder.position.z = 0.01;

  if (isCab) {
    group.add(leftBorder, rightBorder);
  }

  // Black section within the bottom 15% of the windows
  // Windows start at Y=1.280, height ~1.15. 15% is ~0.17
  const bottomBlackBand = new THREE.Mesh(
    new THREE.BoxGeometry(2.4, 0.17, 0.02),
    mats.frame,
  );
  bottomBlackBand.position.set(0, 1.28 + 0.17 / 2, -0.01);

  if (isCab) {
    group.add(bottomBlackBand);
  }

  const doorShape = new THREE.Shape();
  doorShape.moveTo(-cabDoorW, cabDoorBot);
  doorShape.lineTo(cabDoorW, cabDoorBot);
  doorShape.lineTo(cabDoorW, cabDoorTop);
  doorShape.lineTo(-cabDoorW, cabDoorTop);
  doorShape.lineTo(-cabDoorW, cabDoorBot);

  // Scale window appropriately
  const bx = 0,
    by = cabDoorBot + (cabDoorTop - cabDoorBot) * 0.65,
    bw = cabDoorW * 2 * 0.7,
    bh = (cabDoorTop - cabDoorBot) * 0.5,
    br = 0.01;
  const hole = new THREE.Path();
  hole.moveTo(bx - bw / 2 + br, by - bh / 2);
  hole.lineTo(bx + bw / 2 - br, by - bh / 2);
  hole.quadraticCurveTo(
    bx + bw / 2,
    by - bh / 2,
    bx + bw / 2,
    by - bh / 2 + br,
  );
  hole.lineTo(bx + bw / 2, by + bh / 2 - br);
  hole.quadraticCurveTo(
    bx + bw / 2,
    by + bh / 2,
    bx + bw / 2 - br,
    by + bh / 2,
  );
  hole.lineTo(bx - bw / 2 + br, by + bh / 2);
  hole.quadraticCurveTo(
    bx - bw / 2,
    by + bh / 2,
    bx - bw / 2,
    by + bh / 2 - br,
  );
  hole.lineTo(bx - bw / 2, by - bh / 2 + br);
  hole.quadraticCurveTo(
    bx - bw / 2,
    by - bh / 2,
    bx - bw / 2 + br,
    by - bh / 2,
  );
  doorShape.holes.push(hole);

  const doorGeom = new THREE.ExtrudeGeometry(doorShape, {
    depth: 0.04,
    bevelEnabled: false,
  });
  const doorMesh = new THREE.Mesh(
    doorGeom,
    isCab ? mats.frame : mats.shellSolid,
  );
  doorMesh.position.z = -0.02;
  doorMesh.userData.isShellWall = false;
  group.add(doorMesh);

  if (isCab) {
    const doorEdges = new THREE.LineSegments(
      new THREE.EdgesGeometry(doorGeom),
      new THREE.LineBasicMaterial({ color: 0x000000 }),
    );
    doorMesh.add(doorEdges);
  }

  const dgShape = new THREE.Shape();
  dgShape.moveTo(bx - bw / 2 + br, by - bh / 2);
  dgShape.lineTo(bx + bw / 2 - br, by - bh / 2);
  dgShape.quadraticCurveTo(
    bx + bw / 2,
    by - bh / 2,
    bx + bw / 2,
    by - bh / 2 + br,
  );
  dgShape.lineTo(bx + bw / 2, by + bh / 2 - br);
  dgShape.quadraticCurveTo(
    bx + bw / 2,
    by + bh / 2,
    bx + bw / 2 - br,
    by + bh / 2,
  );
  dgShape.lineTo(bx - bw / 2 + br, by + bh / 2);
  dgShape.quadraticCurveTo(
    bx - bw / 2,
    by + bh / 2,
    bx - bw / 2,
    by + bh / 2 - br,
  );
  dgShape.lineTo(bx - bw / 2, by - bh / 2 + br);
  dgShape.quadraticCurveTo(
    bx - bw / 2,
    by - bh / 2,
    bx - bw / 2 + br,
    by - bh / 2,
  );
  const doorGlass = new THREE.Mesh(
    new THREE.ShapeGeometry(dgShape),
    mats.glass,
  );
  doorGlass.position.z = 0;
  group.add(doorGlass);

  if (isCab) {
    const destM = new THREE.Mesh(
      new THREE.BoxGeometry(0.7, 0.23, 0.06),
      mats.frame,
    );
    destM.position.set(0, 2.635, 0.03);
    group.add(destM);

    const destMat = mats.indicatorOn.clone();
    destMat.color.setHex(0xffaa00);
    destMat.emissive.setHex(0xffaa00);
    const destScreen = new THREE.Mesh(
      new THREE.PlaneGeometry(0.56, 0.1),
      destMat,
    );
    destScreen.position.set(0, 2.635, 0.061);
    destScreen.userData = { isDestinationSign: true, isExternalLight: true };
    group.add(destScreen);

    const hlPlateGeom = new THREE.BoxGeometry(0.7, 0.3, 0.06);
    const pL = new THREE.Mesh(hlPlateGeom, mats.frame);
    pL.position.set(-0.85, 0.875, 0.03);
    const pR = new THREE.Mesh(hlPlateGeom, mats.frame);
    pR.position.set(0.85, 0.875, 0.03);
    group.add(pL, pR);

    const createLamp = (lx: number, isRed: boolean) => {
      const lpColor = isRed ? 0xff0000 : 0xffffff;
      const lp = new THREE.Mesh(
        new THREE.CylinderGeometry(0.08, 0.08, 0.08).rotateX(Math.PI / 2),
        new THREE.MeshStandardMaterial({
          color: lpColor,
          emissive: lpColor,
          emissiveIntensity: 0.0,
        }),
      );
      lp.position.set(lx, 0.875, 0.06);
      lp.userData = {
        isFrontOfTrain: isFrontOfTrain,
        isRed: isRed,
        isLamp: true,
      };

      // Dramatic lighting spot lights
      const spotColor = isRed ? 0xff0000 : 0xddddff;
      const spotLight = new THREE.SpotLight(
        spotColor,
        0,
        40,
        Math.PI / 4,
        0.5,
        1.0,
      );
      spotLight.position.set(0, 0, 0.1);
      // target it outwards
      const target = new THREE.Object3D();
      target.position.set(0, -0.2, 5.0);
      lp.add(target);
      spotLight.target = target;
      lp.add(spotLight);

      lp.userData.light = spotLight;
      group.add(lp);
      lp.userData.isExternalLight = true;
    };
    createLamp(-1.0, true);
    createLamp(-0.85, false);
    createLamp(-0.7, false);

    createLamp(1.0, true);
    createLamp(0.85, false);
    createLamp(0.7, false);
  } else {
    const cctv = new THREE.Mesh(
      new THREE.BoxGeometry(0.2, 0.269, 0.05),
      mats.frame,
    );
    cctv.position.set(0.555, 0.231 + 0.269 / 2, 0.03);
    group.add(cctv);
  }
  return group;
}

export function buildCarShell(isFirst: boolean, isLast: boolean) {
  initShellProfiles();
  const g = new THREE.Group();
  const ceilY = FLOOR_Y + HEIGHT_INT;

  const Z_DOOR_SGL = CAR_LEN / 2 - 0.743;
  const startZ = isFirst ? -Z_DOOR_SGL - 0.4 : -CAR_LEN / 2;
  const endZ = isLast ? Z_DOOR_SGL + 0.4 : CAR_LEN / 2;

  const ROOF_SPLIT_Y = 2.52;
  const roofILeft = findIndexForY(ROOF_SPLIT_Y, true);
  const roofIRight = findIndexForY(ROOF_SPLIT_Y, false);
  const roofShape = getSubShape(roofILeft, roofIRight);
  if (roofShape) {
    const roofGeom = new THREE.ExtrudeGeometry(roofShape, {
      depth: endZ - startZ,
      bevelEnabled: false,
      steps: 1,
    });
    roofGeom.translate(0, 0, startZ);
    const roofMesh = new THREE.Mesh(roofGeom, mats.roof);
    roofMesh.userData.isShellWall = true;
    g.add(roofMesh);
  }

  interface Feature {
    zCenter: number;
    width: number;
    yMin: number;
    yMax: number;
    type: string;
  }
  const features: Feature[] = [];

  // 1992 Stock Dimensions
  const W_WIN_END = 2.3;
  const W_WIN_MID = 1.8; // Changed to match length of mid seats
  const W_DOOR_DBL = 1.6;
  const W_DOOR_SGL = 0.8;

  const Z_WIN_END = 5.1965;
  const Z_DOOR_DBL = 2.612;
  const Z_WIN_MID = 0;

  if (!isFirst && !isLast) {
    // Trailing car layout - symmetrical
    features.push({
      zCenter: -Z_DOOR_SGL,
      width: W_DOOR_SGL,
      yMin: 0.555,
      yMax: 2.52,
      type: "door_single",
    });
    features.push({
      zCenter: Z_DOOR_SGL,
      width: W_DOOR_SGL,
      yMin: 0.555,
      yMax: 2.52,
      type: "door_single",
    });
    features.push({
      zCenter: -Z_WIN_END,
      width: W_WIN_END,
      yMin: 1.475,
      yMax: 2.368,
      type: "window",
    });
    features.push({
      zCenter: Z_WIN_END,
      width: W_WIN_END,
      yMin: 1.475,
      yMax: 2.368,
      type: "window",
    });
    features.push({
      zCenter: -Z_DOOR_DBL,
      width: W_DOOR_DBL,
      yMin: 0.555,
      yMax: 2.52,
      type: "door_double",
    });
    features.push({
      zCenter: Z_DOOR_DBL,
      width: W_DOOR_DBL,
      yMin: 0.555,
      yMax: 2.52,
      type: "door_double",
    });
    features.push({
      zCenter: Z_WIN_MID,
      width: W_WIN_MID,
      yMin: 1.475,
      yMax: 2.368,
      type: "window",
    });
  } else {
    // Driving car (A/D cars) - asymmetrical
    const sign = isFirst ? 1 : -1;

    // Rear part is same as trailing
    features.push({
      zCenter: sign * Z_DOOR_SGL,
      width: W_DOOR_SGL,
      yMin: 0.555,
      yMax: 2.52,
      type: "door_single",
    });
    features.push({
      zCenter: sign * Z_WIN_END,
      width: W_WIN_END,
      yMin: 1.475,
      yMax: 2.368,
      type: "window",
    });
    features.push({
      zCenter: sign * Z_DOOR_DBL,
      width: W_DOOR_DBL,
      yMin: 0.555,
      yMax: 2.52,
      type: "door_double",
    });
    features.push({
      zCenter: Z_WIN_MID,
      width: W_WIN_MID,
      yMin: 1.475,
      yMax: 2.368,
      type: "window",
    });
    features.push({
      zCenter: -sign * Z_DOOR_DBL,
      width: W_DOOR_DBL,
      yMin: 0.555,
      yMax: 2.52,
      type: "door_double",
    });
    features.push({
      zCenter: -sign * Z_WIN_END,
      width: W_WIN_END,
      yMin: 1.475,
      yMax: 2.368,
      type: "window",
    });

    // Driver's door and cab window
    features.push({
      zCenter: -sign * Z_DOOR_SGL,
      width: 0.8,
      yMin: 0.555,
      yMax: 2.368,
      type: "door_driver",
    });
  }

  features.sort((a, b) => a.zCenter - b.zCenter);

  let currentZ = startZ;

  for (const f of features) {
    const fStart = f.zCenter - f.width / 2;
    const fEnd = f.zCenter + f.width / 2;

    if (fStart > currentZ) {
      const solidGeom = createSegment(0, 0, fStart - currentZ);
      const mesh = new THREE.Mesh(solidGeom, mats.shell);
      mesh.position.z = currentZ;
      mesh.userData.isShellWall = true;
      g.add(mesh);

      // Add blue band on solid wall segments
      const bgGeom = new THREE.BoxGeometry(0.015, 0.35, fStart - currentZ);
      const bL = new THREE.Mesh(bgGeom, mats.blueBand);
      bL.position.set(
        -1.26,
        0.555 + 0.35 / 2,
        currentZ + (fStart - currentZ) / 2,
      );
      const bR = new THREE.Mesh(bgGeom, mats.blueBand);
      bR.position.set(
        1.26,
        0.555 + 0.35 / 2,
        currentZ + (fStart - currentZ) / 2,
      );
      bL.userData.isShellWall = true;
      bR.userData.isShellWall = true;
      g.add(bL, bR);
    }

    const holeGeom = createSegment(
      f.yMin,
      f.yMax,
      fEnd - Math.max(fStart, currentZ),
    );
    const holeMesh = new THREE.Mesh(holeGeom, mats.shell);
    holeMesh.position.z = Math.max(fStart, currentZ);
    holeMesh.userData.isShellWall = true;
    g.add(holeMesh);

    if (f.yMin > 0.6) {
      const zLen = fEnd - Math.max(fStart, currentZ);
      const zMid = Math.max(fStart, currentZ) + zLen / 2;
      const bgGeom = new THREE.BoxGeometry(0.015, 0.35, zLen);
      const bL = new THREE.Mesh(bgGeom, mats.blueBand);
      bL.position.set(-1.26, 0.555 + 0.35 / 2, zMid);
      const bR = new THREE.Mesh(bgGeom, mats.blueBand);
      bR.position.set(1.26, 0.555 + 0.35 / 2, zMid);
      g.add(bL, bR);
    }

    if (f.type === "window") {
      const minLeft = Math.min(
        findIndexForY(f.yMin, true),
        findIndexForY(f.yMax, true),
      );
      const maxLeft = Math.max(
        findIndexForY(f.yMin, true),
        findIndexForY(f.yMax, true),
      );
      const minRight = Math.min(
        findIndexForY(f.yMin, false),
        findIndexForY(f.yMax, false),
      );
      const maxRight = Math.max(
        findIndexForY(f.yMin, false),
        findIndexForY(f.yMax, false),
      );

      const shapeL = getThinSubShape(minLeft, maxLeft, true, 0.02, 0.005);
      const shapeR = getThinSubShape(minRight, maxRight, false, 0.02, 0.005);

      if (shapeL) {
        const gL = new THREE.Mesh(
          new THREE.ExtrudeGeometry(shapeL, {
            depth: f.width,
            bevelEnabled: false,
            steps: 1,
          }),
          mats.glass,
        );
        gL.position.z = Math.max(fStart, currentZ);
        const gLEdges = new THREE.LineSegments(
          new THREE.EdgesGeometry(gL.geometry, 20),
          new THREE.LineBasicMaterial({ color: 0x000000 }),
        );
        gL.add(gLEdges);
        g.add(gL);
        addRoundedCorners(
          g,
          Math.max(fStart, currentZ),
          fEnd,
          f.yMin,
          f.yMax,
          true,
          mats.shell,
        );
      }
      if (shapeR) {
        const gR = new THREE.Mesh(
          new THREE.ExtrudeGeometry(shapeR, {
            depth: f.width,
            bevelEnabled: false,
            steps: 1,
          }),
          mats.glass,
        );
        gR.position.z = Math.max(fStart, currentZ);
        const gREdges = new THREE.LineSegments(
          new THREE.EdgesGeometry(gR.geometry, 20),
          new THREE.LineBasicMaterial({ color: 0x000000 }),
        );
        gR.add(gREdges);
        g.add(gR);
        addRoundedCorners(
          g,
          Math.max(fStart, currentZ),
          fEnd,
          f.yMin,
          f.yMax,
          false,
          mats.shell,
        );
      }
    } else if (f.type.startsWith("door_")) {
      const isDouble = f.type === "door_double";
      const createDoors = (isRightSide: boolean) => {
        const leafW = isDouble ? f.width / 2 : f.width;
        const isLeft = !isRightSide;

        const getAlign = (shiftToPositiveZ: boolean): "left" | "right" => {
          return (isLeft ? shiftToPositiveZ : !shiftToPositiveZ)
            ? "left"
            : "right";
        };

        if (isDouble) {
          const doorGrp = new THREE.Group();
          const lL = createDoorEntity(f.zCenter, isLeft, leafW, false, "right");
          lL.position.z = f.zCenter - f.width / 2;
          lL.name = "lL";

          const rL = createDoorEntity(f.zCenter, isLeft, leafW, false, "left");
          rL.position.z = f.zCenter;
          rL.name = "rL";

          const closedL_val = f.zCenter - f.width / 2;
          const closedR_val = f.zCenter;

          const ind = new THREE.Mesh(
            new THREE.BoxGeometry(0.04, 0.01, 0.04),
            mats.indicatorOff,
          );
          ind.name = "ind";

          doorGrp.userData = {
            isDoorControl: true,
            isDouble: true,
            isRightSide: isRightSide,
            isDriver: false,
            closedL: closedL_val,
            openL: closedL_val - leafW - 0.05,
            closedR: closedR_val,
            openR: closedR_val + leafW + 0.05,
          };
          const idx = findIndexForY(ceilY + 0.05, isLeft);
          const pt = outerPoints[idx];
          const ptUp = outerPoints[Math.min(outerPoints.length - 1, idx + 2)];
          const ptDown = outerPoints[Math.max(0, idx - 2)];
          const angle = Math.atan2(ptUp.y - ptDown.y, ptUp.x - ptDown.x);
          ind.position.set(pt.x, pt.y, f.zCenter);
          ind.rotation.z = angle;

          doorGrp.add(lL, rL, ind);
          g.add(doorGrp);
        } else {
          const doorGrp = new THREE.Group();
          const align = f.zCenter > 0 ? "right" : "left";
          const lL = createDoorEntity(
            f.zCenter,
            isLeft,
            leafW,
            f.type === "door_driver",
            align,
          );
          lL.name = "lL";
          const closedL_single = f.zCenter - leafW / 2;
          const flyDir = f.zCenter < 0 ? 1 : -1;

          const ind = new THREE.Mesh(
            new THREE.BoxGeometry(0.04, 0.01, 0.04),
            mats.indicatorOff,
          );
          ind.name = "ind";

          doorGrp.userData = {
            isDoorControl: true,
            isDouble: false,
            isRightSide: isRightSide,
            isDriver: f.type === "door_driver",
            closedL: closedL_single,
            openL: closedL_single + flyDir * (leafW + 0.05),
          };
          lL.position.z = closedL_single;

          const idx = findIndexForY(ceilY + 0.05, isLeft);
          const pt = outerPoints[idx];
          const ptUp = outerPoints[Math.min(outerPoints.length - 1, idx + 2)];
          const ptDown = outerPoints[Math.max(0, idx - 2)];
          const angle = Math.atan2(ptUp.y - ptDown.y, ptUp.x - ptDown.x);
          ind.position.set(pt.x, pt.y, f.zCenter);
          ind.rotation.z = angle;

          doorGrp.add(lL, ind);
          g.add(doorGrp);
        }
      };
      createDoors(true);
      createDoors(false);
    }

    currentZ = fEnd;
  }
  if (currentZ < endZ) {
    const solidGeom = createSegment(0, 0, endZ - currentZ);
    const mesh = new THREE.Mesh(solidGeom, mats.shell);
    mesh.position.z = currentZ;
    mesh.userData.isShellWall = true;
    g.add(mesh);

    // Add blue band
    const bgGeom = new THREE.BoxGeometry(0.015, 0.35, endZ - currentZ);
    const bL = new THREE.Mesh(bgGeom, mats.blueBand);
    bL.position.set(-1.26, 0.555 + 0.35 / 2, currentZ + (endZ - currentZ) / 2);
    const bR = new THREE.Mesh(bgGeom, mats.blueBand);
    bR.position.set(1.26, 0.555 + 0.35 / 2, currentZ + (endZ - currentZ) / 2);
    bL.userData.isShellWall = true;
    bR.userData.isShellWall = true;
    g.add(bL, bR);
  }

  const endFront = buildEndAssembly(isFirst, true);
  endFront.position.set(0, 0, startZ);
  endFront.rotation.y = Math.PI;
  g.add(endFront);

  const endRear = buildEndAssembly(isLast, false);
  endRear.position.set(0, 0, endZ);
  g.add(endRear);

  if (isFirst || isLast) {
    const sign = isFirst ? 1 : -1;

    const deskDepth = 0.18;
    const deskZ = -sign * (7.438 - deskDepth / 2);
    const seatZ = -sign * 6.908;
    const wallZ = -sign * 6.528;

    // Cab Light
    const cabLight = new THREE.PointLight(0xffeedd, 0.0, 2);
    cabLight.position.set(0, ceilY - 0.2, seatZ);
    g.add(cabLight);
    cabLight.userData.isCabLight = true;

    // Wall
    const wallShape = new THREE.Shape();
    wallShape.moveTo(innerPoints[0].x, innerPoints[0].y);
    for (let i = 1; i < innerPoints.length; i++)
      wallShape.lineTo(innerPoints[i].x, innerPoints[i].y);
    wallShape.lineTo(innerPoints[0].x, innerPoints[0].y);
    const wallGeom = new THREE.ExtrudeGeometry(wallShape, {
      depth: 0.05,
      bevelEnabled: false,
      steps: 1,
    });
    const wall = new THREE.Mesh(wallGeom, mats.shellSolid);
    wall.position.set(0, 0, wallZ - 0.025);
    g.add(wall);

    // Seat
    const seatGeom = new THREE.BoxGeometry(0.5, 0.5, 0.4);
    const seat = new THREE.Mesh(seatGeom, mats.seat);
    seat.position.set(0, FLOOR_Y + 0.25, seatZ);
    g.add(seat);

    // Controls Desk
    const deskGeom = new THREE.BoxGeometry(CAR_WIDTH_INT - 0.8, 0.3, deskDepth);
    const desk = new THREE.Mesh(deskGeom, mats.frame);
    desk.position.set(0, FLOOR_Y + 0.8, deskZ);
    g.add(desk);
  }

  const applyHullSlant = () => {
    const cabDoorW = 0.35;
    const tan5 = Math.tan((5 * Math.PI) / 180);
    const EPSILON = 0.05;

    g.updateMatrixWorld(true);

    g.traverse((c) => {
      if (c instanceof THREE.Mesh && c.userData.isShellWall) {
        c.updateMatrix();
        let geom = c.geometry;
        if (!geom.attributes.position) return;
        const pos = geom.attributes.position;
        const pt = new THREE.Vector3();
        let modified = false;

        for (let i = 0; i < pos.count; i++) {
          pt.fromBufferAttribute(pos, i);
          pt.applyMatrix4(c.matrix); // to car-local

          const atStart = Math.abs(pt.z - startZ) < EPSILON;
          const atEnd = Math.abs(pt.z - endZ) < EPSILON;

          const shouldSlantStart = atStart && !isFirst;
          const shouldSlantEnd = atEnd && !isLast;

          if (shouldSlantStart || shouldSlantEnd) {
            if (Math.abs(pt.x) > cabDoorW) {
              let shift = (Math.abs(pt.x) - cabDoorW) * tan5;
              if (shouldSlantStart) pt.z += shift;
              if (shouldSlantEnd) pt.z -= shift;

              // to mesh-local
              const localPt = pt
                .clone()
                .applyMatrix4(c.matrix.clone().invert());
              pos.setXYZ(i, localPt.x, localPt.y, localPt.z);
              modified = true;
            }
          }
        }
        if (modified) {
          geom = mergeVertices(geom);
          geom.computeVertexNormals();
          c.geometry = geom;
        }
      }
    });
  };
  applyHullSlant();

  return g;
}

export function buildUnderbody() {
  const group = new THREE.Group();

  const darkMat = new THREE.MeshStandardMaterial({
    color: 0x222222,
    roughness: 0.9,
  });
  const yellowMat = new THREE.MeshStandardMaterial({
    color: 0xeab308,
    roughness: 0.6,
  });

  // Base chassis pad
  const chassis = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.2, 10), darkMat);
  chassis.position.set(0, 0.6, 0);
  group.add(chassis);

  // Big central inverter/traction box
  const box1 = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.4, 3.5), darkMat);
  box1.position.set(0, 0.4, 0);
  group.add(box1);

  // Smaller boxes
  const box2 = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.4, 2.0), darkMat);
  box2.position.set(0.4, 0.4, -3.0);
  group.add(box2);

  const box3 = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.4, 2.0), darkMat);
  box3.position.set(-0.4, 0.4, 3.0);
  group.add(box3);

  // Air tanks (yellow cylinders)
  const tankGeom = new THREE.CylinderGeometry(0.2, 0.2, 1.5, 16);
  tankGeom.rotateX(Math.PI / 2);

  const tank1 = new THREE.Mesh(tankGeom, yellowMat);
  tank1.position.set(-0.6, 0.4, -3.0);
  group.add(tank1);

  const tank2 = new THREE.Mesh(tankGeom, yellowMat);
  tank2.position.set(0.6, 0.4, 3.0);
  group.add(tank2);

  return group;
}

