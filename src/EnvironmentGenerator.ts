import { AppState } from "./App";
import * as THREE from "three";
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import {
  AssetFactory,
  assetMats,
  envMats,
  texGravel,
  texBrick,
  texMindTheGap,
} from "./AssetFactory";

export class EnvironmentGenerator {
  static config = {
    gauge: 1.435,
    trackOffset: 3.0,
    tunnelRadius: 8.0,
    platformWidth: 7.0,
    platformHeight: 1.1,
    wallHeight: 4.5,
    zOffset: 0,
  };
  static animatedFans: any[] = [];

  static reset() {
    this.config.zOffset = 0;
    this.animatedFans = [];
  }

  static update() {
    if (AppState.sceneLive) {
      this.animatedFans.forEach((fan) => {
        if (fan.userData.isFan && fan.userData.rotor)
          fan.userData.rotor.rotation.z -= 0.12;
      });
    }
  }

  static addDetailedInfrastructure(group, length, innerVal, outerVal, dir) {
    const wallX = dir === 1 ? outerVal : innerVal;
    const spacing = 15;
    const count = Math.floor(length / spacing);
    const midX = (innerVal + outerVal) / 2;

    // Collect geometries for merging
    const geoContainers: { [key: string]: THREE.BufferGeometry[] } = {};

    const addGeo = (geo: THREE.BufferGeometry, matName: string, pos: THREE.Vector3, rotY: number = 0) => {
      const g = geo.index ? geo.clone().toNonIndexed() : geo.clone();
      if (rotY !== 0) g.rotateY(rotY);
      g.translate(pos.x, pos.y, pos.z);
      if (!geoContainers[matName]) geoContainers[matName] = [];
      geoContainers[matName].push(g);
    };

    const addGroupToMerge = (assetGroup: THREE.Object3D, fallbackMat: string) => {
      assetGroup.updateMatrixWorld(true);
      assetGroup.traverse((child: any) => {
        if (child.isMesh) {
          const mName = child.material.name || fallbackMat;
          const g = child.geometry.index ? child.geometry.clone().toNonIndexed() : child.geometry.clone();
          g.applyMatrix4(child.matrixWorld);
          if (!geoContainers[mName]) geoContainers[mName] = [];
          geoContainers[mName].push(g);
        } else if (child.isPointLight) {
          const light = child.clone();
          const pos = new THREE.Vector3();
          child.getWorldPosition(pos);
          light.position.copy(pos);
          light.userData.isStationLight = true;
          group.add(light);
        }
      });
    };

    // Ducting and piping (long segments)
    const cablePos = new THREE.Vector3(wallX - 0.1 * dir, this.config.platformHeight + 5.0, 0);
    const ductPos = new THREE.Vector3(wallX - 0.6 * dir, this.config.platformHeight + 6.0, 0);
    const trayPos = new THREE.Vector3(wallX - 0.4 * dir, this.config.platformHeight + 5.5, 0);
    const pipesPos = new THREE.Vector3(wallX - 0.2 * dir, this.config.platformHeight + 4.0, 0);

    const cableGeo = AssetFactory.buildWallCables_Sagging_Geo(length);
    if (cableGeo) addGeo(cableGeo, "cableBlack", cablePos);

    const ductGeo = AssetFactory.buildHVACDuct_Industrial_Geo(length);
    if (ductGeo) addGeo(ductGeo, "metal", ductPos);

    const trayGeo = AssetFactory.buildCableTray_Bundle_Geo(length);
    if (trayGeo) addGeo(trayGeo, "metal", trayPos);

    const pipesGeo = AssetFactory.buildPipingRun_Standard_Geo(length);
    if (pipesGeo) addGeo(pipesGeo, "metal", pipesPos);

    for (let i = 0; i < count; i++) {
      const zPos = length / 2 - i * spacing - spacing / 2;
      const rotY = dir === 1 ? -Math.PI / 2 : Math.PI / 2;

      if (i % 2 === 0) {
        // Heritage Bench
        const bench = AssetFactory.buildHeritageBench();
        bench.position.set(wallX - dir * 0.8, this.config.platformHeight, zPos);
        bench.rotation.y = rotY;
        addGroupToMerge(bench, "woodDark");
      }

      if (i % 4 === 1) {
        // Oyster Reader
        const reader = AssetFactory.buildOysterReader();
        reader.position.set(midX, this.config.platformHeight, zPos - 2);
        reader.rotation.y = rotY;
        addGroupToMerge(reader, "metal");
      }

      if (i % 3 === 0) {
        const wayOut = AssetFactory.buildWayOutSign();
        wayOut.position.set(wallX - 0.05 * dir, this.config.platformHeight + 3.0, zPos - 2);
        wayOut.rotation.y = rotY;
        addGroupToMerge(wayOut, "metal");
      }

      if (i % 2 === 0) {
        const sign = AssetFactory.buildRoundelSign(true); 
        sign.position.set(wallX - (0.8 * dir), this.config.platformHeight + 2.5, zPos + 4); 
        sign.rotation.y = 0;
        const bracket = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.8).rotateZ(Math.PI/2), assetMats.metal); 
        bracket.position.set(dir * 0.4, 1.0, 0); 
        sign.add(bracket); 
        addGroupToMerge(sign, "metal");
      }

      if (i % 2 === 1) { 
        const poster = AssetFactory.buildAdvertisementPoster(); 
        poster.position.set(wallX - (0.05 * dir), this.config.platformHeight + 1.8, zPos + 2); 
        poster.rotation.y = rotY; 
        addGroupToMerge(poster, "metal"); 
      }

      if (i % 3 === 0) {
        const hang = AssetFactory.buildHangingSign(); 
        const dropY = this.config.platformHeight + 3.5; 
        hang.position.set(midX, dropY, zPos + 6); 
        hang.rotation.y = 0;
        const poleLen = 16.0 - dropY;
        const pole1 = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, poleLen), assetMats.metal); 
        pole1.position.set(1.0, poleLen / 2 + 0.5, 0);
        const pole2 = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, poleLen), assetMats.metal); 
        pole2.position.set(-1.0, poleLen / 2 + 0.5, 0);
        hang.add(pole1, pole2); 
        addGroupToMerge(hang, "metal");
      }

      if (i % 2 === 0) { 
        const lamp = AssetFactory.buildGlobeLamp(true); 
        lamp.position.set(midX + (dir * 1.5), this.config.platformHeight, zPos - 3); 
        addGroupToMerge(lamp, "glass"); 
      }

      if (i % 4 === 1) { 
        const conduit = AssetFactory.buildVerticalConduit_Drop(); 
        conduit.position.set(wallX - (dir * 0.1), this.config.platformHeight, zPos - 4); 
        addGroupToMerge(conduit, "metal"); 
      }

      if (i % 2 === 0) { 
        const bin = AssetFactory.buildRubbishBin(); 
        bin.position.set(midX + (dir * 0.5), this.config.platformHeight, zPos - 5); 
        addGroupToMerge(bin, "metal"); 
      }

      if (i % 4 === 2) { 
        const ticketMachine = AssetFactory.buildTicketMachine(); 
        ticketMachine.position.set(wallX - (dir * 0.6), this.config.platformHeight, zPos + 7); 
        ticketMachine.rotation.y = rotY; 
        addGroupToMerge(ticketMachine, "metal"); 
      }

      if (i % 8 === 0) {
        const cctv = AssetFactory.buildCCTV_PTZ(); 
        const dropY = this.config.platformHeight + 4.5; 
        cctv.position.set(midX, dropY, zPos - 5); 
        cctv.rotation.y = rotY;
        const poleLen = 16.0 - dropY; 
        const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, poleLen), assetMats.metal); 
        pole.position.set(0, poleLen / 2 + 0.25, 0); 
        cctv.add(pole); 
        addGroupToMerge(cctv, "metal");
      }

      if (i % 8 === 4) {
        const cctv360 = AssetFactory.buildCCTV_360(); 
        const dropY = this.config.platformHeight + 5.0; 
        cctv360.position.set(midX, dropY, zPos + 3);
        const poleLen = 16.0 - dropY; 
        const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, poleLen), assetMats.metal); 
        pole.position.set(0, poleLen / 2, 0); 
        cctv360.add(pole); 
        addGroupToMerge(cctv360, "metal");
      }

      if (i % 6 === 0) { 
        const cctvWall = AssetFactory.buildCCTV_Dome_Wall(); 
        cctvWall.position.set(wallX - (0.2 * dir), this.config.platformHeight + 4.0, zPos + 2); 
        cctvWall.rotation.y = rotY; 
        addGroupToMerge(cctvWall, "metal"); 
      }

      if (i % 6 === 3) { 
        const cctvDual = AssetFactory.buildCCTV_Dual_Bullet(); 
        cctvDual.position.set(wallX - (0.3 * dir), this.config.platformHeight + 3.5, zPos - 1); 
        cctvDual.rotation.y = rotY; 
        addGroupToMerge(cctvDual, "metal"); 
      }

      if (i % 5 === 0) {
        const fanGroup = new THREE.Group(); 
        const fan = AssetFactory.buildExtractorFan(); 
        fan.rotation.y = 0; 
        const clearance = 2.6; 
        const bracket = new THREE.Mesh(new THREE.BoxGeometry(clearance, 0.2, 0.2), assetMats.metal); 
        bracket.position.set(dir * (clearance / 2), 0, 0); 
        const diag = new THREE.Mesh(new THREE.BoxGeometry(clearance * 1.2, 0.1, 0.1), assetMats.metal); 
        diag.position.set(dir * (clearance / 2), 0.6, 0); 
        diag.rotation.z = dir * Math.PI / 6;
        fanGroup.add(fan, bracket, diag); 
        fanGroup.position.set(wallX - (clearance * dir), this.config.platformHeight + 6.5, zPos); 
        group.add(fanGroup); // Add directly because fans are animated
        EnvironmentGenerator.animatedFans.push(fan);
      }

      // Point lights remain as individual objects for distance culling
      if (i % 2 === 0) {
        const marker = new THREE.Object3D();
        marker.position.set(midX, this.config.wallHeight - 1.0, zPos);
        marker.userData.wantsLight = true;
        marker.userData.isStationLight = true;
        group.add(marker);
      }
      
      const sl = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.1, 2.0), envMats.stationLight);
      sl.position.set(midX, this.config.wallHeight - 0.1, zPos);
      group.add(sl);
    }

    // Finalize Merging
    for (const matName in geoContainers) {
      if (geoContainers[matName].length > 0) {
        const mergedGeo = mergeGeometries(geoContainers[matName]);
        if (mergedGeo) {
           const mat = assetMats[matName] || envMats[matName] || new THREE.MeshStandardMaterial({ color: 0x888888 });
           const mesh = new THREE.Mesh(mergedGeo, mat);
           mesh.receiveShadow = true;
           group.add(mesh);
        }
      }
      // Clean up clones
      geoContainers[matName].forEach(g => g.dispose());
    }
  }

  static createStation(length) {
    const group = new THREE.Group();
    group.add(this.createDoubleTrackBed(length));
    const gapFromTrack = 1.0;
    const platformInnerX =
      this.config.trackOffset + this.config.gauge / 2 + gapFromTrack;
    const platformOuterX = platformInnerX + this.config.platformWidth;
    const totalHeight = 16.0;

    const wallGeo = new THREE.PlaneGeometry(length, totalHeight);
    const localBrickMat = envMats.brick.clone();
    localBrickMat.map = texBrick.clone();
    localBrickMat.map.needsUpdate = true;
    localBrickMat.map.repeat.set(length / 4, totalHeight / 4);

    const rightWall = new THREE.Mesh(wallGeo, localBrickMat);
    rightWall.position.set(platformOuterX, totalHeight / 2, 0);
    rightWall.rotation.y = -Math.PI / 2;
    rightWall.receiveShadow = true;
    group.add(rightWall);
    const leftWall = new THREE.Mesh(wallGeo, localBrickMat);
    leftWall.position.set(-platformOuterX, totalHeight / 2, 0);
    leftWall.rotation.y = Math.PI / 2;
    leftWall.receiveShadow = true;
    group.add(leftWall);

    const roofGeo = new THREE.PlaneGeometry(platformOuterX * 2, length);
    const roofMat = new THREE.MeshBasicMaterial({ color: 0x050505 });
    const roof = new THREE.Mesh(roofGeo, roofMat);
    roof.rotation.x = Math.PI / 2;
    roof.position.set(0, totalHeight, 0);
    group.add(roof);

    const platGeo = new THREE.BoxGeometry(
      this.config.platformWidth,
      this.config.platformHeight,
      length,
    );
    const rightPlatform = new THREE.Mesh(platGeo, envMats.platform);
    rightPlatform.position.set(
      platformInnerX + this.config.platformWidth / 2,
      this.config.platformHeight / 2,
      0,
    );
    rightPlatform.receiveShadow = true;
    const leftPlatform = new THREE.Mesh(platGeo, envMats.platform);
    leftPlatform.position.set(
      -(platformInnerX + this.config.platformWidth / 2),
      this.config.platformHeight / 2,
      0,
    );
    leftPlatform.receiveShadow = true;
    group.add(rightPlatform, leftPlatform);

    const tactileGeo = new THREE.PlaneGeometry(0.5, length);
    const localTactileMat = envMats.tactile.clone();
    localTactileMat.map = texMindTheGap.clone();
    localTactileMat.map.needsUpdate = true;
    localTactileMat.map.repeat.set(length / 2, 1);

    const rightTactile = new THREE.Mesh(tactileGeo, localTactileMat);
    rightTactile.rotation.x = -Math.PI / 2;
    rightTactile.position.set(
      platformInnerX + 0.25,
      this.config.platformHeight + 0.005,
      0,
    );
    rightTactile.receiveShadow = true;
    const leftTactile = new THREE.Mesh(tactileGeo, localTactileMat);
    leftTactile.rotation.x = -Math.PI / 2;
    leftTactile.position.set(
      -(platformInnerX + 0.25),
      this.config.platformHeight + 0.005,
      0,
    );
    leftTactile.rotation.z = Math.PI;
    leftTactile.receiveShadow = true;
    group.add(rightTactile, leftTactile);

    const bridge = AssetFactory.buildPedestrianBridgeStandalone();
    bridge.position.set(0, 0, length / 2 - 25);
    group.add(bridge);

    const capShape = new THREE.Shape();
    capShape.moveTo(-platformOuterX, -8);
    capShape.lineTo(platformOuterX, -8);
    capShape.lineTo(platformOuterX, 16);
    capShape.lineTo(-platformOuterX, 16);
    capShape.lineTo(-platformOuterX, -8);
    const hole = new THREE.Path();
    hole.absarc(0, 0, this.config.tunnelRadius, 0, Math.PI * 2, false);
    capShape.holes.push(hole);
    const capGeo = new THREE.ExtrudeGeometry(capShape, {
      depth: 1.0,
      bevelEnabled: false,
    });
    const capFront = new THREE.Mesh(capGeo, envMats.concreteDark);
    capFront.position.set(0, 0, length / 2);
    const capBack = new THREE.Mesh(capGeo, envMats.concreteDark);
    capBack.position.set(0, 0, -length / 2 - 1.0);
    group.add(capFront, capBack);

    this.addDetailedInfrastructure(
      group,
      length,
      platformInnerX,
      platformOuterX,
      1,
    );
    this.addDetailedInfrastructure(
      group,
      length,
      -platformOuterX,
      -platformInnerX,
      -1,
    );

    return group;
  }

  static createCurvedTunnel(curveRadius = 120) {
    const group = new THREE.Group();
    const zStart = 0;
    const angle = Math.PI / 2;

    class CenterCurve extends THREE.Curve<THREE.Vector3> {
      r: number;
      z0: number;
      constructor(r: number, z0: number) {
        super();
        this.r = r;
        this.z0 = z0;
      }
      getPoint(t: number, optionalTarget = new THREE.Vector3()) {
        const theta = t * angle;
        return optionalTarget.set(
          this.r - this.r * Math.cos(theta),
          0,
          this.z0 - this.r * Math.sin(theta),
        );
      }
    }
    const centerCurve = new CenterCurve(curveRadius, zStart);

    const tubeGeo = new THREE.TubeGeometry(
      centerCurve,
      64,
      this.config.tunnelRadius,
      64,
      false,
    );
    const tube = new THREE.Mesh(tubeGeo, envMats.concreteDark);
    envMats.concreteDark.side = THREE.BackSide;
    tube.receiveShadow = true;
    group.add(tube);

    const getTransform = (t: number, locX: number, locY: number) => {
      const theta = t * angle;
      const x =
        curveRadius - curveRadius * Math.cos(theta) + locX * Math.cos(theta);
      const y = locY;
      const z = zStart - curveRadius * Math.sin(theta) + locX * Math.sin(theta);
      const rotY = -theta;
      return { x, y, z, rotY };
    };

    class OffsetCurve extends THREE.Curve<THREE.Vector3> {
      r: number;
      z0: number;
      lX: number;
      lY: number;
      constructor(r: number, z0: number, lX: number, lY: number) {
        super();
        this.r = r;
        this.z0 = z0;
        this.lX = lX;
        this.lY = lY;
      }
      getPoint(t: number, optionalTarget = new THREE.Vector3()) {
        const tr = getTransform(t, this.lX, this.lY);
        return optionalTarget.set(tr.x, tr.y, tr.z);
      }
    }

    const bedWidth = this.config.trackOffset * 2 + 3.0;
    const bedGeo = new THREE.RingGeometry(
      curveRadius - bedWidth / 2,
      curveRadius + bedWidth / 2,
      64,
      1,
      Math.PI / 2,
      angle,
    );
    bedGeo.rotateX(-Math.PI / 2);
    const bed = new THREE.Mesh(bedGeo, envMats.concrete);
    bed.position.set(curveRadius, 0, zStart);
    bed.receiveShadow = true;
    group.add(bed);

    const walkWidth = 1.2;
    const walkRingR = curveRadius - -7.0;
    const walkGeo = new THREE.RingGeometry(
      walkRingR - walkWidth / 2,
      walkRingR + walkWidth / 2,
      64,
      1,
      Math.PI / 2,
      angle,
    );
    walkGeo.rotateX(-Math.PI / 2);
    const walkway = new THREE.Mesh(walkGeo, assetMats.metalGalvanised);
    walkway.position.set(curveRadius, 0.5, zStart);
    walkway.receiveShadow = true;
    group.add(walkway);

    const sleeperGeo = new THREE.BoxGeometry(
      this.config.gauge + 0.6,
      0.1,
      0.25,
    );
    const sleeperSpacing = 0.65;
    const arcLength = curveRadius * angle;
    const sleeperCount = Math.floor(arcLength / sleeperSpacing);
    const dummy = new THREE.Object3D();

    [-1, 1].forEach((sign) => {
      const locX = sign * this.config.trackOffset;
      const instanced = new THREE.InstancedMesh(
        sleeperGeo,
        envMats.sleeper,
        sleeperCount,
      );
      instanced.castShadow = true;
      instanced.receiveShadow = true;

      for (let i = 0; i < sleeperCount; i++) {
        const t = i / (sleeperCount - 1);
        const tr = getTransform(t, locX, 0.05);
        dummy.position.set(tr.x, tr.y, tr.z);
        dummy.rotation.set(0, tr.rotY, 0);
        dummy.updateMatrix();
        instanced.setMatrixAt(i, dummy.matrix);
      }
      group.add(instanced);

      ["left", "right"].forEach((railSide) => {
        const rs = railSide === "left" ? -1 : 1;
        const rLocX = locX + (rs * this.config.gauge) / 2;
        const rCurve = new OffsetCurve(curveRadius, zStart, rLocX, 0.075);
        const railGeo = new THREE.TubeGeometry(rCurve, 64, 0.05, 4, false);
        const rail = new THREE.Mesh(railGeo, envMats.track);
        rail.castShadow = true;
        rail.receiveShadow = true;
        group.add(rail);
      });
    });

    const cableY = 2.0;
    const cableLocX = -(
      Math.sqrt(this.config.tunnelRadius ** 2 - cableY ** 2) - 0.2
    );
    const cableCurve = new OffsetCurve(curveRadius, zStart, cableLocX, cableY);
    const cableGeo = new THREE.TubeGeometry(cableCurve, 64, 0.05, 8, false);
    const cable = new THREE.Mesh(cableGeo, assetMats.cableBlack);
    group.add(cable);

    const pipeY = 1.5;
    const pipeLocX =
      Math.sqrt(this.config.tunnelRadius ** 2 - pipeY ** 2) - 0.2;
    const pipeCurve = new OffsetCurve(curveRadius, zStart, pipeLocX, pipeY);
    const pipeGeo = new THREE.TubeGeometry(pipeCurve, 64, 0.08, 8, false);
    const pipe = new THREE.Mesh(pipeGeo, assetMats.metal);
    group.add(pipe);

    const lightSpacing = 12;
    const lightCount = Math.floor(arcLength / lightSpacing);
    const nodeGeo = new THREE.BoxGeometry(0.2, 0.6, 0.1);

    for (let i = 0; i < lightCount; i++) {
      const t = (i * lightSpacing + lightSpacing / 2) / arcLength;
      const lightY = 3.5;
      const wallLocX =
        Math.sqrt(this.config.tunnelRadius ** 2 - lightY ** 2) - 0.1;

      const trL = getTransform(t, -wallLocX, lightY);
      const ll = new THREE.Mesh(nodeGeo, envMats.tunnelLight);
      ll.position.set(trL.x, trL.y, trL.z);
      ll.rotation.set(0, trL.rotY + Math.PI / 2, 0);
      if (i % 2 === 0) {
        ll.userData.wantsLight = true;
      }
      group.add(ll);

      const trR = getTransform(t, wallLocX, lightY);
      const rl = new THREE.Mesh(nodeGeo, envMats.tunnelLight);
      rl.position.set(trR.x, trR.y, trR.z);
      rl.rotation.set(0, trR.rotY - Math.PI / 2, 0);
      if (i % 2 === 1) {
        rl.userData.wantsLight = true;
      }
      group.add(rl);

      if (i % 8 === 0) {
        const fanY = 6.0;
        const trFan = getTransform(t, 0, fanY);
        const fan = AssetFactory.buildExtractorFan();
        fan.position.set(trFan.x, trFan.y, trFan.z);
        fan.rotation.set(0, trFan.rotY, 0);
        const strut = new THREE.Mesh(
          new THREE.CylinderGeometry(0.05, 0.05, 2.0),
          assetMats.metal,
        );
        strut.position.set(0, 1.5, 0);
        fan.add(strut);
        group.add(fan);
        this.animatedFans.push(fan);
      }

      // --- TELEMETRY AND TRACKSIDE ASSET INTEGRATION ---
      if (i % 3 === 0) {
        const trHanger = getTransform(t, -wallLocX, 0);
        const hangers = AssetFactory.buildCableHangers();
        hangers.position.set(trHanger.x, trHanger.y, trHanger.z);
        hangers.rotation.set(0, trHanger.rotY + Math.PI / 2, 0);
        group.add(hangers);
      }
      if (i % 4 === 1) {
        const trPhone = getTransform(t, wallLocX - 0.2, 0);
        const phone = AssetFactory.buildTunnelTelephone();
        phone.position.set(trPhone.x, trPhone.y, trPhone.z);
        phone.rotation.set(0, trPhone.rotY - Math.PI / 2, 0);
        group.add(phone);
      }
      if (i % 5 === 2) {
        const trBoard = getTransform(t, -wallLocX + 0.2, 0);
        const board = AssetFactory.buildDistBoard();
        board.position.set(trBoard.x, trBoard.y, trBoard.z);
        board.rotation.set(0, trBoard.rotY + Math.PI / 2, 0);
        group.add(board);
      }
      if (i % 5 === 0) {
        const trBond = getTransform(t, 0, 0);
        const bond = AssetFactory.buildLUImpedanceBond();
        bond.position.set(trBond.x, trBond.y, trBond.z);
        bond.rotation.set(0, trBond.rotY, 0);
        group.add(bond);
      }
      if (i % 7 === 0) {
        const trTrip = getTransform(t, this.config.trackOffset, 0);
        const tripcock = AssetFactory.buildTripcock();
        tripcock.position.set(trTrip.x, trTrip.y, trTrip.z);
        tripcock.rotation.set(0, trTrip.rotY, 0);
        group.add(tripcock);
      }
      if (i % 9 === 0) {
        const trLube = getTransform(t, -this.config.trackOffset, 0);
        const lube = AssetFactory.buildTunnelLubricator();
        lube.position.set(trLube.x, trLube.y, trLube.z);
        lube.rotation.set(0, trLube.rotY, 0);
        group.add(lube);
      }
      if (i % 10 === 0) {
        const trCase = getTransform(t, wallLocX - 0.5, 0);
        const caseEq = AssetFactory.buildTunnelCase();
        caseEq.position.set(trCase.x, trCase.y, trCase.z);
        caseEq.rotation.set(0, trCase.rotY - Math.PI / 2, 0);
        group.add(caseEq);
      }
    }

    return group;
  }

  static createDoubleTrackBed(length, isTunnel = false) {
    const group = new THREE.Group();
    const offset = this.config.trackOffset;
    const bedWidth = offset * 2 + 3.0;

    const deckGeo = new THREE.PlaneGeometry(bedWidth, length);
    const bed = new THREE.Mesh(deckGeo, envMats.concrete);
    bed.rotation.x = -Math.PI / 2;
    bed.receiveShadow = true;
    group.add(bed);

    const sleeperGeo = new THREE.BoxGeometry(
      this.config.gauge + 0.6,
      0.1,
      0.25,
    );
    const sleeperCount = Math.floor(length / 0.65);
    const sleeperInstanced = new THREE.InstancedMesh(
      sleeperGeo,
      envMats.sleeper,
      sleeperCount * 2,
    );
    sleeperInstanced.receiveShadow = true;
    sleeperInstanced.castShadow = true;

    let sleeperIndex = 0;
    const dummy = new THREE.Object3D();
    [-1, 1].forEach((sign) => {
      const x = sign * offset;
      ["left", "right"].forEach((railSide) => {
        const rs = railSide === "left" ? -1 : 1;
        const railGeom = new THREE.BoxGeometry(0.1, 0.15, length);
        const rail = new THREE.Mesh(railGeom, envMats.track);
        rail.position.set(x + (rs * this.config.gauge) / 2, 0.075, 0);
        rail.castShadow = true;
        rail.receiveShadow = true;
        group.add(rail);
      });
      for (let i = 0; i < sleeperCount; i++) {
        const z = length / 2 - (i / (sleeperCount - 1)) * length;
        dummy.position.set(x, 0.05, z);
        dummy.rotation.y = 0;
        dummy.updateMatrix();
        sleeperInstanced.setMatrixAt(sleeperIndex++, dummy.matrix);
      }
    });
    group.add(sleeperInstanced);
    return group;
  }

  static createCircularTunnel(length) {
    const group = new THREE.Group();
    group.add(this.createDoubleTrackBed(length, true));

    const tunnelRadius = this.config.tunnelRadius;
    const tubeGeo = new THREE.CylinderGeometry(
      tunnelRadius,
      tunnelRadius,
      length,
      64,
      1,
      true,
    );
    tubeGeo.rotateX(Math.PI / 2);
    const tube = new THREE.Mesh(tubeGeo, envMats.concreteDark);
    envMats.concreteDark.side = THREE.BackSide;
    tube.receiveShadow = true;
    group.add(tube);

    const lightSpacing = 12;
    const lightCount = Math.floor(length / lightSpacing);
    const nodeGeo = new THREE.BoxGeometry(0.2, 0.6, 0.1);
    const cableY = 2.0;
    const cableX =
      Math.sqrt(tunnelRadius * tunnelRadius - cableY * cableY) - 0.2;
    const cable = AssetFactory.buildWallCables_Sagging(length);
    cable.position.set(-cableX, cableY, 0);
    group.add(cable);
    const pipeY = 1.5;
    const pipeX = Math.sqrt(tunnelRadius * tunnelRadius - pipeY * pipeY) - 0.2;
    const pipe = AssetFactory.buildPipingRun_Standard(length);
    pipe.position.set(pipeX, pipeY, 0);
    group.add(pipe);

    const walkwayGeo = new THREE.BoxGeometry(1.2, 0.1, length);
    const walkway = new THREE.Mesh(walkwayGeo, assetMats.metalGalvanised);
    walkway.position.set(tunnelRadius - 1.0, 0.5, 0);
    walkway.receiveShadow = true;
    group.add(walkway);

    for (let i = 0; i < lightCount; i++) {
      const z = length / 2 - (i * lightSpacing + lightSpacing / 2);
      const lightY = 3.5;
      const wallXLight =
        Math.sqrt(tunnelRadius * tunnelRadius - lightY * lightY) - 0.1;

      const ll = new THREE.Mesh(nodeGeo, envMats.tunnelLight);
      ll.position.set(-wallXLight, lightY, z);
      ll.rotation.y = Math.PI / 2;
      if (i % 2 === 0) {
        ll.userData.wantsLight = true;
      }
      group.add(ll);

      const rl = new THREE.Mesh(nodeGeo, envMats.tunnelLight);
      rl.position.set(wallXLight, lightY, z);
      rl.rotation.y = -Math.PI / 2;
      if (i % 2 === 1) {
        rl.userData.wantsLight = true;
      }
      group.add(rl);

      if (i % 8 === 0) {
        const fanY = 6.0;
        const fan = AssetFactory.buildExtractorFan();
        fan.position.set(0, fanY, z);
        fan.rotation.set(0, 0, 0);
        const strut = new THREE.Mesh(
          new THREE.CylinderGeometry(0.05, 0.05, 2.0),
          assetMats.metal,
        );
        strut.position.set(0, 1.5, 0);
        fan.add(strut);
        group.add(fan);
        this.animatedFans.push(fan);
      }

      if (i % 6 === 0) {
        const signal = AssetFactory.buildTrackSignal();
        signal.position.set(this.config.trackOffset + 1.5, 0, z);
        group.add(signal);
      }

      // --- TELEMETRY AND TRACKSIDE ASSET INTEGRATION ---
      if (i % 3 === 0) {
        const hangers = AssetFactory.buildCableHangers();
        hangers.position.set(-wallXLight, 0, z);
        hangers.rotation.y = Math.PI / 2;
        group.add(hangers);
      }
      if (i % 4 === 1) {
        const phone = AssetFactory.buildTunnelTelephone();
        phone.position.set(wallXLight - 0.2, 0, z);
        phone.rotation.y = -Math.PI / 2;
        group.add(phone);
      }
      if (i % 5 === 2) {
        const board = AssetFactory.buildDistBoard();
        board.position.set(-wallXLight + 0.2, 0, z);
        board.rotation.y = Math.PI / 2;
        group.add(board);
      }
      if (i % 5 === 0) {
        const bond = AssetFactory.buildLUImpedanceBond();
        bond.position.set(0, 0, z);
        group.add(bond);
      }
      if (i % 7 === 0) {
        const tripcock = AssetFactory.buildTripcock();
        tripcock.position.set(this.config.trackOffset, 0, z);
        group.add(tripcock);
      }
      if (i % 9 === 0) {
        const lube = AssetFactory.buildTunnelLubricator();
        lube.position.set(-this.config.trackOffset, 0, z);
        group.add(lube);
      }
      if (i % 10 === 0) {
        const caseEq = AssetFactory.buildTunnelCase();
        caseEq.position.set(wallXLight - 0.5, 0, z);
        caseEq.rotation.y = -Math.PI / 2;
        group.add(caseEq);
      }
    }

    return group;
  }
}
