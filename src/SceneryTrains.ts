import * as THREE from 'three';
import { AppState, getAnalyticalPointAndDir } from './App';

export function updateSceneryTrains(delta: number, trackLength: number, stationsZ: number[]) {
  if (!(window as any)._sceneryTrains || trackLength <= 0) return;

  const trains = (window as any)._sceneryTrains as THREE.Group[];
  const trainLengthOffset = (((window as any)._lastNumCars || 8) * 16.248) / 2;

  trains.forEach((t2) => {
    t2.visible = AppState.viewMode === "scene";
    if (AppState.viewMode !== "scene") return; // Do not animate or move if hidden
    t2.position.set(0, 0, 0); // Train group root remains static

      if (t2.userData.trackZ === undefined) {
        t2.userData.trackZ = trackLength / 2;
        t2.userData.state = "cruising"; 
        t2.userData.doorsOpen = false;
        t2.userData.timer = 0;
      }

      let t2Speed = t2.userData.speed !== undefined ? t2.userData.speed : 50.0;

      // Auto stop at stations for t2 (going forwards over trackPath)
      let bestDistT2 = Infinity;
      let targetStationZT2 = 0;
      stationsZ.forEach((z) => {
        let targetPos = (z - trainLengthOffset) % trackLength;
        if (targetPos < 0) targetPos += trackLength;
        
        let diff = targetPos - t2.userData.trackZ;
        if (diff < -trackLength / 2) diff += trackLength;
        if (diff > trackLength / 2) diff -= trackLength;

        if (diff <= 0.1) diff += trackLength;

        if (diff > 0.1 && diff < bestDistT2) {
          bestDistT2 = diff;
          targetStationZT2 = targetPos;
        }
      });

      const distToStation = bestDistT2;
      const brakeData = 15.0;
      const t2ReqBrake = (t2Speed * t2Speed) / (2 * brakeData) + 15;

      if (t2.userData.state === "cruising") {
        if (distToStation > 0 && distToStation < t2ReqBrake) {
          t2.userData.state = "braking";
        }
      } else if (t2.userData.state === "braking") {
        const idealV = Math.sqrt(
          2 * brakeData * Math.max(0, distToStation - 1.0),
        );
        t2Speed = idealV;
        if (distToStation <= 1.0 || (idealV < 1.0 && distToStation < 2.0)) {
          t2.userData.state = "stopped";
          t2.userData.timer = 5.0; // Wait 3s open + 2s close
          t2.userData.doorsOpen = true;
          t2.userData.trackZ = targetStationZT2;
          t2Speed = 0;
        }
      } else if (t2.userData.state === "stopped") {
        t2Speed = 0;
        t2.userData.timer -= delta;
        if (t2.userData.timer <= 2.0) {
          t2.userData.doorsOpen = false;
        }
        if (t2.userData.timer <= 0) {
          t2.userData.state = "accelerating";
        }
      } else if (t2.userData.state === "accelerating") {
        t2Speed = Math.min(50.0, t2Speed + 8.0 * delta);
        if (t2Speed >= 50.0 || distToStation < -50) {
          t2.userData.state = "cruising";
        }
      }

      t2.userData.speed = t2Speed;

      // Move t2 along track (moves forward along s)
      t2.userData.trackZ += t2Speed * delta;

      // Normalize t2 offset
      while (t2.userData.trackZ < 0) t2.userData.trackZ += trackLength;
      t2.userData.trackZ %= trackLength;

      // Update T2 cars on path
      t2.children.forEach((car: THREE.Object3D) => {
        if (car.userData.offsetZ !== undefined) {
          const UP = new THREE.Vector3(0, 1, 0);

          if (car.userData.isCar) {
            const BOGIE_OFFSET = 5.5; 
            
            const sFront = t2.userData.trackZ + car.userData.offsetZ - BOGIE_OFFSET;
            const sRear = t2.userData.trackZ + car.userData.offsetZ + BOGIE_OFFSET;

            const pFront = getAnalyticalPointAndDir(sFront);
            const pRear = getAnalyticalPointAndDir(sRear);

            const rightDirFront = pFront.dir.clone().cross(UP).normalize();
            const rightDirRear = pRear.dir.clone().cross(UP).normalize();

            const trackOffset = 3.0; // The other track
            const carFrontPos = pFront.pos.clone().add(rightDirFront.multiplyScalar(trackOffset));
            const carRearPos = pRear.pos.clone().add(rightDirRear.multiplyScalar(trackOffset));

            const carPos = carFrontPos.clone().lerp(carRearPos, 0.5);
            carPos.y = 0;

            const dir = carRearPos.clone().sub(carFrontPos).normalize();
            const target = carPos.clone().add(dir);

            car.position.copy(carPos);
            car.lookAt(carPos.clone().sub(dir));
          } else {
            const s = t2.userData.trackZ + car.userData.offsetZ;
            const p = getAnalyticalPointAndDir(s);
  
            const rightDir = p.dir.clone().cross(UP).normalize();
            
            const trackOffset = 3.0;
            const carPos = p.pos.clone().add(rightDir.multiplyScalar(trackOffset));
            car.position.copy(carPos);
            car.position.y = 0;
  
            // Face opposite direction of tangent
            const target = carPos.clone().add(p.dir.clone().multiplyScalar(-1));
            target.y = 0;
            car.lookAt(target);
          }
        }
      });

      if (!t2.userData.cachedNodes) {
        t2.userData.cachedNodes = {
          lamps: [],
          signs: [],
          pointLights: [],
          wheels: [],
          fans: [],
          doors: []
        };
        t2.traverse((child: any) => {
          if (child.userData.isLamp) t2.userData.cachedNodes.lamps.push(child);
          else if (child.userData.isDestinationSign) t2.userData.cachedNodes.signs.push(child);
          else if (child.isPointLight) t2.userData.cachedNodes.pointLights.push(child);
          else if (child.userData.kinematicType === "wheel") t2.userData.cachedNodes.wheels.push(child);
          else if (child.userData.kinematicType === "fan") t2.userData.cachedNodes.fans.push(child);
          else if (child.userData && child.userData.openL !== undefined) {
             t2.userData.cachedNodes.doors.push(child);
          }
        });
      }

      // Lighting and Doors and Kinematics
      t2.userData.cachedNodes.lamps.forEach((child: any) => {
        const isFront = child.userData.isFrontOfTrain;
        const isRed = child.userData.isRed;
        let shouldBeOn = false;
        // Train goes forward, so direction matches
        if (isFront && !isRed) shouldBeOn = true;
        if (!isFront && isRed) shouldBeOn = true; 
        
        if (shouldBeOn) {
          child.material.emissiveIntensity = isRed ? 20.0 : 8.0;
        } else {
          child.material.emissiveIntensity = 0.0;
        }
      });
      t2.userData.cachedNodes.signs.forEach((child: any) => {
        child.material.emissiveIntensity = 2.0;
      });
      t2.userData.cachedNodes.pointLights.forEach((child: any) => {
        child.intensity = Math.pow(AppState.interiorLightingLevel / 100, 2) * 1.5;
      });
      t2.userData.cachedNodes.wheels.forEach((child: any) => {
        // Scenery trains move forwards over track paths
        child.rotation.x -= t2Speed * 0.1 * delta * 50; 
      });
      if (AppState.sceneLive) {
        t2.userData.cachedNodes.fans.forEach((child: any) => {
          child.rotation.x += t2Speed * 1.5 * delta * 50;
        });
      }

      // Iterate over doors to open/close them
      t2.userData.cachedNodes.doors.forEach((child: any) => {
        const isRightSide = child.userData.isRightSide;
        const isDriver = child.userData.isDriver;
        // Platform is actually in the middle, so Left doors for T2
        const shouldBeOpen = t2.userData.doorsOpen && !isRightSide && !isDriver;

        const left = child.children.find((c: any) => c.name === "lL");
        const right = child.children.find((c: any) => c.name === "rL");

        if (left) {
          const targetL = shouldBeOpen ? child.userData.openL : child.userData.closedL;
          const diffL = targetL - left.position.z;
          left.position.z += diffL * 0.08;
        }
        
        if (right && child.userData.isDouble) {
          const targetR = shouldBeOpen ? child.userData.openR : child.userData.closedR;
          const diffR = targetR - right.position.z;
          right.position.z += diffR * 0.08;
        }
      });
  });
}
