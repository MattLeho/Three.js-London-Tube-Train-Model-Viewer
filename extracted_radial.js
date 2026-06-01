
        import * as THREE from 'three';
        import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

        function createGravelTexture() {
            const canvas = document.createElement('canvas'); canvas.width = 512; canvas.height = 512;
            const ctx = canvas.getContext('2d'); ctx.fillStyle = '#0a0a0a'; ctx.fillRect(0, 0, 512, 512);
            for (let i = 0; i < 30000; i++) {
                const v = 15 + Math.random() * 70; ctx.fillStyle = `rgb(${v},${v},${v})`;
                ctx.fillRect(Math.random() * 512, Math.random() * 512, 1 + Math.random() * 4, 1 + Math.random() * 4);
            }
            const tex = new THREE.CanvasTexture(canvas); tex.wrapS = THREE.RepeatWrapping; tex.wrapT = THREE.RepeatWrapping; return tex;
        }

        const texGravel = createGravelTexture();

        const assetMats = {
            metal: new THREE.MeshStandardMaterial({ color: 0x555555, metalness: 0.8, roughness: 0.4 }),
            metalGalvanised: new THREE.MeshStandardMaterial({ color: 0xcccccc, metalness: 0.9, roughness: 0.3 }),
            cableBlack: new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.9, metalness: 0.2 }),
            fanBladeMat: new THREE.MeshLambertMaterial({ color: 0x1a1a1a }),
            fanCasingMat: new THREE.MeshStandardMaterial({ color: 0x333333, metalness: 0.7, roughness: 0.6 }),
            wireMesh: new THREE.MeshBasicMaterial({ color: 0x222222, wireframe: true }),
        };

        const tracksideMats = {
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
            porcelain: new THREE.MeshStandardMaterial({ color: 0xe0e0e0, metalness: 0.05, roughness: 0.1, clearcoat: 1.0 }),
            glass: new THREE.MeshStandardMaterial({ color: 0x111111, metalness: 0.9, roughness: 0.1, transparent: true, opacity: 0.7 }),
            orangeEmissive: new THREE.MeshStandardMaterial({ color: 0xffaa00, emissive: 0xff6600, roughness: 0.1 }),
            white: new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.1 })
        };

        const envMats = {
            gravel: new THREE.MeshStandardMaterial({ map: texGravel, roughness: 1.0, color: 0x888888 }),
            concreteDark: new THREE.MeshStandardMaterial({ color: 0x1c1c1c, roughness: 0.9 }),
            track: new THREE.MeshStandardMaterial({ color: 0x2a2a2a, metalness: 0.7, roughness: 0.4 }),
            sleeper: new THREE.MeshStandardMaterial({ color: 0x1a1510, roughness: 1.0 }),
            tunnelLight: new THREE.MeshStandardMaterial({ color: 0xff8800, emissive: 0xff6600, emissiveIntensity: 3.0 })
        };

        class AssetFactory {
            static createMesh(geo, mat) {
                const mesh = new THREE.Mesh(geo, mat);
                mesh.castShadow = true; mesh.receiveShadow = true;
                return mesh;
            }

            static addBolts(group, count, radius, distance, yPos, material) {
                const boltGeo = new THREE.CylinderGeometry(0.015, 0.015, 0.02, 6);
                for(let i=0; i<count; i++) {
                    const angle = (i / count) * Math.PI * 2;
                    const bolt = this.createMesh(boltGeo, material);
                    bolt.position.set(Math.cos(angle) * distance, yPos, Math.sin(angle) * distance);
                    group.add(bolt);
                }
            }

            static buildExtractorFan() {
                const fanGroup = new THREE.Group();
                const casingGeo = new THREE.CylinderGeometry(1.4, 1.4, 1.0, 32, 1, true);
                const casing = new THREE.Mesh(casingGeo, assetMats.fanCasingMat); casing.rotation.x = Math.PI / 2; casing.castShadow = true;
                const grilleGeo = new THREE.CircleGeometry(1.4, 32);
                const grilleF = new THREE.Mesh(grilleGeo, assetMats.wireMesh); grilleF.position.z = 0.5;
                const grilleB = new THREE.Mesh(grilleGeo, assetMats.wireMesh); grilleB.position.z = -0.5;
                const motorGeo = new THREE.CylinderGeometry(0.3, 0.3, 0.6, 16);
                const motor = new THREE.Mesh(motorGeo, assetMats.metal); motor.rotation.x = Math.PI / 2; motor.castShadow = true;
                const strutGeo = new THREE.CylinderGeometry(0.03, 0.03, 2.8, 8);
                const strut1 = new THREE.Mesh(strutGeo, assetMats.metal); strut1.castShadow = true;
                const strut2 = strut1.clone(); strut2.rotation.z = Math.PI / 2;
                const bladeGeo = new THREE.BoxGeometry(0.3, 1.0, 0.02);
                const rotorGroup = new THREE.Group();
                for(let i=0; i<8; i++) {
                    const blade = new THREE.Mesh(bladeGeo, assetMats.fanBladeMat); blade.position.y = 0.6; blade.rotation.x = 0.6; blade.castShadow = true;
                    const pivot = new THREE.Group(); pivot.rotation.z = (Math.PI * 2 / 8) * i; pivot.add(blade); rotorGroup.add(pivot);
                }
                rotorGroup.position.z = 0.15;
                fanGroup.add(casing, grilleF, grilleB, motor, strut1, strut2, rotorGroup);
                fanGroup.userData = { isFan: true, rotor: rotorGroup }; return fanGroup;
            }

            static buildTunnelCase() {
                const group = new THREE.Group();
                const bracket1 = this.createMesh(new THREE.BoxGeometry(0.6, 0.05, 0.5), tracksideMats.galvanized);
                bracket1.position.set(0, 0.2, -0.2);
                const bracket2 = this.createMesh(new THREE.BoxGeometry(0.6, 0.05, 0.5), tracksideMats.galvanized);
                bracket2.position.set(0, 1.6, -0.2);
                const cabinet = this.createMesh(new THREE.BoxGeometry(0.8, 1.4, 0.3), tracksideMats.castIron);
                cabinet.position.set(0, 0.9, 0);
                const door = this.createMesh(new THREE.BoxGeometry(0.76, 1.36, 0.02), tracksideMats.greyMetal);
                door.position.set(0, 0.9, 0.16);
                const hingeGeo = new THREE.CylinderGeometry(0.01, 0.01, 0.1);
                [0.4, 1.4].forEach(y => {
                    const hinge = this.createMesh(hingeGeo, tracksideMats.darkMetal);
                    hinge.position.set(0.38, y, 0.16); group.add(hinge);
                });
                const handle = this.createMesh(new THREE.BoxGeometry(0.02, 0.15, 0.04), tracksideMats.galvanized);
                handle.position.set(-0.3, 0.9, 0.18);
                const label = this.createMesh(new THREE.PlaneGeometry(0.2, 0.15), tracksideMats.yellowWarning);
                label.position.set(0, 1.3, 0.171);
                group.add(bracket1, bracket2, cabinet, door, handle, label); return group;
            }

            static buildTunnelSignal() {
                const group = new THREE.Group();
                const post = this.createMesh(new THREE.BoxGeometry(0.1, 1.2, 0.1), tracksideMats.galvanized);
                post.position.set(0, 0.6, -0.2);
                const backplate = this.createMesh(new THREE.BoxGeometry(0.4, 1.0, 0.1), tracksideMats.castIron);
                backplate.position.set(0, 1.0, 0);
                const conduit = this.createMesh(new THREE.CylinderGeometry(0.02, 0.02, 1.0), tracksideMats.blackWire);
                conduit.position.set(0.08, 0.5, -0.15);
                const colors = [tracksideMats.redSignal, tracksideMats.greenSignal];
                for(let i=0; i<2; i++) {
                    const yPos = 1.2 - (i*0.4);
                    const light = this.createMesh(new THREE.CylinderGeometry(0.1, 0.1, 0.05), colors[i]);
                    light.rotation.x = Math.PI / 2; light.position.set(0, yPos, 0.05);
                    const hoodGeo = new THREE.CylinderGeometry(0.12, 0.14, 0.5, 32, 1, true, 0, Math.PI);
                    const hood = this.createMesh(hoodGeo, tracksideMats.darkMetal);
                    hood.material.side = THREE.DoubleSide; hood.rotation.x = Math.PI / 2; hood.position.set(0, yPos, 0.3);
                    const rim = this.createMesh(new THREE.TorusGeometry(0.14, 0.01, 8, 32, Math.PI), tracksideMats.castIron);
                    rim.rotation.z = Math.PI / 2; rim.position.set(0, yPos, 0.55);
                    group.add(light, hood, rim);
                }
                group.add(post, backplate, conduit); return group;
            }

            static buildSubPointMachine() {
                const group = new THREE.Group();
                const motorBox = this.createMesh(new THREE.BoxGeometry(0.9, 0.18, 0.6), tracksideMats.castIron);
                motorBox.position.set(0, 0.09, 0); 
                const lid = this.createMesh(new THREE.BoxGeometry(0.85, 0.02, 0.55), tracksideMats.greyMetal);
                lid.position.set(0, 0.19, 0);
                this.addBolts(lid, 6, 0.3, 0.4, 0.01, tracksideMats.darkMetal);
                const rodBase = this.createMesh(new THREE.BoxGeometry(1.2, 0.05, 0.15), tracksideMats.darkMetal);
                rodBase.position.set(-0.8, 0.1, 0);
                const driveRod = this.createMesh(new THREE.CylinderGeometry(0.02, 0.02, 1.2), tracksideMats.galvanized);
                driveRod.rotation.z = Math.PI/2; driveRod.position.set(-0.8, 0.15, 0.05);
                const cableIn = this.createMesh(new THREE.CylinderGeometry(0.04, 0.04, 0.2), tracksideMats.blackWire);
                cableIn.rotation.x = Math.PI/2; cableIn.position.set(0.4, 0.09, -0.3);
                group.add(motorBox, lid, rodBase, driveRod, cableIn); return group;
            }

            static buildTrackBonds() {
                const group = new THREE.Group();
                const bondBox = this.createMesh(new THREE.BoxGeometry(0.25, 0.2, 0.25), tracksideMats.castIron);
                bondBox.position.set(0, 0.1, 0);
                const lid = this.createMesh(new THREE.BoxGeometry(0.22, 0.02, 0.22), tracksideMats.greyMetal);
                lid.position.set(0, 0.21, 0);
                for(let i=0; i<3; i++) {
                    const wire = this.createMesh(new THREE.TubeGeometry(
                        new THREE.CatmullRomCurve3([
                            new THREE.Vector3(0.1, 0.15, 0 + (i*0.05)),
                            new THREE.Vector3(0.3, 0.2, 0 + (i*0.05)),
                            new THREE.Vector3(0.6, 0.3, 0)
                        ]), 10, 0.01, 8, false
                    ), tracksideMats.copper);
                    group.add(wire);
                }
                group.add(bondBox, lid); return group;
            }

            static buildTripcock() {
                const group = new THREE.Group();
                const base = this.createMesh(new THREE.BoxGeometry(0.35, 0.25, 0.35), tracksideMats.castIron);
                base.position.set(0, 0.125, 0);
                const cylinder = this.createMesh(new THREE.CylinderGeometry(0.08, 0.08, 0.2), tracksideMats.galvanized);
                cylinder.position.set(0, 0.35, 0);
                const arm = this.createMesh(new THREE.BoxGeometry(0.04, 0.45, 0.06), tracksideMats.yellowWarning);
                arm.position.set(0, 0.45, 0);
                const hose = this.createMesh(new THREE.TubeGeometry(
                    new THREE.CatmullRomCurve3([
                        new THREE.Vector3(0.15, 0.1, 0),
                        new THREE.Vector3(0.35, 0.05, 0.2),
                        new THREE.Vector3(0.55, 0, 0)
                    ]), 12, 0.02, 8, false
                ), tracksideMats.blackWire);
                group.add(base, cylinder, arm, hose); return group;
            }

            static buildLUImpedanceBond() {
                const group = new THREE.Group();
                const casing = this.createMesh(new THREE.BoxGeometry(0.6, 0.18, 0.9), tracksideMats.castIron);
                casing.position.set(0, 0.12, 0);
                const ribsGeo = new THREE.BoxGeometry(0.65, 0.02, 0.05);
                for(let i=0; i<5; i++) {
                    const rib = this.createMesh(ribsGeo, tracksideMats.castIron);
                    rib.position.set(0, 0.2, -0.3 + (i*0.15)); group.add(rib);
                }
                const term1 = this.createMesh(new THREE.CylinderGeometry(0.04, 0.04, 0.25), tracksideMats.copper);
                term1.position.set(-0.2, 0.25, 0.35);
                const term2 = this.createMesh(new THREE.CylinderGeometry(0.04, 0.04, 0.25), tracksideMats.copper);
                term2.position.set(0.2, 0.25, -0.35);
                const cableGen = (x, z) => this.createMesh(new THREE.TubeGeometry(
                    new THREE.CatmullRomCurve3([
                        new THREE.Vector3(x, 0.35, z),
                        new THREE.Vector3(x*1.5, 0.4, z),
                        new THREE.Vector3(x*3, 0.3, z)
                    ]), 10, 0.03, 8, false
                ), tracksideMats.blackWire);
                group.add(casing, term1, term2, cableGen(-0.2, 0.35), cableGen(0.2, -0.35)); return group;
            }

            static buildTunnelTelephone() {
                const group = new THREE.Group();
                const backplate = this.createMesh(new THREE.BoxGeometry(0.4, 0.6, 0.05), tracksideMats.galvanized);
                backplate.position.set(0, 1.2, -0.1);
                const box = this.createMesh(new THREE.BoxGeometry(0.3, 0.4, 0.2), tracksideMats.castIron);
                box.position.set(0, 1.2, 0.025);
                const label = this.createMesh(new THREE.PlaneGeometry(0.15, 0.05), tracksideMats.white); 
                label.position.set(0, 1.35, 0.13);
                const handset = this.createMesh(new THREE.BoxGeometry(0.06, 0.25, 0.08), tracksideMats.darkMetal);
                handset.position.set(0.2, 1.2, 0.05);
                const cordCurve = new THREE.CatmullRomCurve3([
                    new THREE.Vector3(0.2, 1.1, 0.05), new THREE.Vector3(0.1, 0.9, 0.1), new THREE.Vector3(0, 1.05, 0.1)
                ]);
                const cord = this.createMesh(new THREE.TubeGeometry(cordCurve, 20, 0.01, 8, false), tracksideMats.blackWire);
                group.add(backplate, box, label, handset, cord); return group;
            }

            static buildCableHangers() {
                const group = new THREE.Group();
                const strut = this.createMesh(new THREE.BoxGeometry(0.05, 2.4, 0.05), tracksideMats.galvanized);
                strut.position.set(0, 1.2, -0.2);
                for(let i=0; i<7; i++) {
                    const yPos = 0.3 + (i*0.3);
                    const hook = this.createMesh(new THREE.BoxGeometry(0.18, 0.02, 0.04), tracksideMats.rustyMetal);
                    hook.position.set(0.05, yPos, -0.2);
                    const hookLip = this.createMesh(new THREE.BoxGeometry(0.02, 0.08, 0.04), tracksideMats.rustyMetal);
                    hookLip.position.set(0.13, yPos + 0.03, -0.2);
                    const cable = this.createMesh(new THREE.CylinderGeometry(0.05, 0.05, 1.0), tracksideMats.blackWire);
                    cable.rotation.x = Math.PI / 2; cable.position.set(0.06, yPos + 0.05, 0);
                    const dataCable = this.createMesh(new THREE.CylinderGeometry(0.02, 0.02, 1.0), tracksideMats.greyMetal);
                    dataCable.rotation.x = Math.PI / 2; dataCable.position.set(0.1, yPos + 0.02, 0);
                    group.add(hook, hookLip, cable, dataCable);
                }
                group.add(strut); return group;
            }

            static buildDistBoard() {
                const group = new THREE.Group();
                const board = this.createMesh(new THREE.BoxGeometry(0.7, 1.0, 0.3), tracksideMats.greyMetal);
                board.position.set(0, 1.2, 0);
                const label = this.createMesh(new THREE.PlaneGeometry(0.3, 0.15), tracksideMats.yellowWarning);
                label.position.set(0, 1.5, 0.151);
                for(let i=0; i<4; i++) {
                    const switchBox = this.createMesh(new THREE.BoxGeometry(0.08, 0.12, 0.05), tracksideMats.darkMetal);
                    switchBox.position.set(-0.2 + (i*0.13), 1.0, 0.17);
                    const toggle = this.createMesh(new THREE.CylinderGeometry(0.01, 0.01, 0.05), tracksideMats.redSignal);
                    toggle.rotation.x = Math.PI/4; toggle.position.set(-0.2 + (i*0.13), 1.0, 0.19);
                    group.add(switchBox, toggle);
                }
                [-0.2, 0, 0.2].forEach(x => {
                    const conduit = this.createMesh(new THREE.CylinderGeometry(0.03, 0.03, 1.0), tracksideMats.galvanized);
                    conduit.position.set(x, 0.4, 0); group.add(conduit);
                });
                group.add(board, label); return group;
            }

            static buildTunnelLubricator() {
                const group = new THREE.Group();
                const reservoir = this.createMesh(new THREE.CylinderGeometry(0.2, 0.2, 0.5), tracksideMats.castIron);
                reservoir.position.set(0, 0.25, 0);
                const lid = this.createMesh(new THREE.CylinderGeometry(0.22, 0.22, 0.05), tracksideMats.greyMetal);
                lid.position.set(0, 0.5, 0);
                const pump = this.createMesh(new THREE.BoxGeometry(0.15, 0.2, 0.15), tracksideMats.darkMetal);
                pump.position.set(-0.25, 0.2, 0);
                const feedHose = this.createMesh(new THREE.TubeGeometry(
                    new THREE.CatmullRomCurve3([
                        new THREE.Vector3(-0.3, 0.2, 0), new THREE.Vector3(-0.5, 0.25, 0), new THREE.Vector3(-0.65, 0.35, 0)
                    ]), 10, 0.015, 8, false
                ), tracksideMats.blackWire);
                const applicator = this.createMesh(new THREE.BoxGeometry(0.05, 0.05, 0.4), tracksideMats.darkMetal);
                applicator.position.set(-0.6, 0.38, 0);
                group.add(reservoir, lid, pump, feedHose, applicator); return group;
            }
        }

        class EnvironmentGenerator {
            static config = { gauge: 1.435, trackOffset: 3.0, tunnelRadius: 8.0, zOffset: 0 };
            static animatedFans = [];

            static reset() { this.config.zOffset = 0; this.animatedFans = []; }
            static update() {
                this.animatedFans.forEach(fan => {
                    if (fan.userData.isFan && fan.userData.rotor) fan.userData.rotor.rotation.z -= 0.12; 
                });
            }

            static createCurvedTunnel(curveRadius = 120) {
                const group = new THREE.Group();
                const zStart = this.config.zOffset;
                const angle = Math.PI / 2;

                class CenterCurve extends THREE.Curve {
                    constructor(r, z0) { super(); this.r = r; this.z0 = z0; }
                    getPoint(t, optionalTarget = new THREE.Vector3()) {
                        const theta = t * angle;
                        return optionalTarget.set(this.r - this.r * Math.cos(theta), 0, this.z0 - this.r * Math.sin(theta));
                    }
                }
                const centerCurve = new CenterCurve(curveRadius, zStart);

                const tubeGeo = new THREE.TubeGeometry(centerCurve, 64, this.config.tunnelRadius, 64, false);
                const tube = new THREE.Mesh(tubeGeo, envMats.concreteDark);
                envMats.concreteDark.side = THREE.BackSide; tube.receiveShadow = true; group.add(tube);

                const getTransform = (t, locX, locY) => {
                    const theta = t * angle;
                    const x = (curveRadius - curveRadius * Math.cos(theta)) + locX * Math.cos(theta);
                    const y = locY;
                    const z = (zStart - curveRadius * Math.sin(theta)) + locX * Math.sin(theta);
                    const rotY = -theta; return { x, y, z, rotY };
                };

                class OffsetCurve extends THREE.Curve {
                    constructor(r, z0, lX, lY) { super(); this.r = r; this.z0 = z0; this.lX = lX; this.lY = lY; }
                    getPoint(t, optionalTarget = new THREE.Vector3()) {
                        const tr = getTransform(t, this.lX, this.lY); return optionalTarget.set(tr.x, tr.y, tr.z);
                    }
                }

                const bedWidth = (this.config.trackOffset * 2) + 3.0;
                const bedGeo = new THREE.RingGeometry(curveRadius - bedWidth/2, curveRadius + bedWidth/2, 64, 1, Math.PI/2, angle);
                bedGeo.rotateX(-Math.PI / 2);
                const localGravelMat = envMats.gravel.clone(); localGravelMat.map = texGravel.clone(); localGravelMat.map.needsUpdate = true; localGravelMat.map.repeat.set(bedWidth, curveRadius * angle / 2);
                const bed = new THREE.Mesh(bedGeo, localGravelMat); bed.position.set(curveRadius, 0, zStart); bed.receiveShadow = true; group.add(bed);

                const walkWidth = 1.2; const walkRingR = curveRadius - (-7.0); 
                const walkGeo = new THREE.RingGeometry(walkRingR - walkWidth/2, walkRingR + walkWidth/2, 64, 1, Math.PI/2, angle);
                walkGeo.rotateX(-Math.PI / 2); const walkway = new THREE.Mesh(walkGeo, assetMats.metalGalvanised);
                walkway.position.set(curveRadius, 0.5, zStart); walkway.receiveShadow = true; group.add(walkway);

                const sleeperGeo = new THREE.BoxGeometry(this.config.gauge + 0.6, 0.1, 0.25);
                const sleeperSpacing = 0.65; const arcLength = curveRadius * angle; const sleeperCount = Math.floor(arcLength / sleeperSpacing);
                const dummy = new THREE.Object3D();

                [-1, 1].forEach(sign => {
                    const locX = sign * this.config.trackOffset;
                    const instanced = new THREE.InstancedMesh(sleeperGeo, envMats.sleeper, sleeperCount);
                    instanced.castShadow = true; instanced.receiveShadow = true;

                    for(let i=0; i<sleeperCount; i++) {
                        const t = i / (sleeperCount - 1); const tr = getTransform(t, locX, 0.05);
                        dummy.position.set(tr.x, tr.y, tr.z); dummy.rotation.set(0, tr.rotY, 0); dummy.updateMatrix(); instanced.setMatrixAt(i, dummy.matrix);
                    }
                    group.add(instanced);

                    ['left', 'right'].forEach(railSide => {
                        const rs = railSide === 'left' ? -1 : 1; const rLocX = locX + (rs * this.config.gauge / 2);
                        const rCurve = new OffsetCurve(curveRadius, zStart, rLocX, 0.075); const railGeo = new THREE.TubeGeometry(rCurve, 64, 0.05, 4, false);
                        const rail = new THREE.Mesh(railGeo, envMats.track); rail.castShadow = true; rail.receiveShadow = true; group.add(rail);
                    });
                });

                const cableY = 2.0; const cableLocX = -(Math.sqrt(this.config.tunnelRadius**2 - cableY**2) - 0.2);
                const cableCurve = new OffsetCurve(curveRadius, zStart, cableLocX, cableY);
                const cableGeo = new THREE.TubeGeometry(cableCurve, 64, 0.05, 8, false); const cable = new THREE.Mesh(cableGeo, assetMats.cableBlack); group.add(cable);

                const pipeY = 1.5; const pipeLocX = Math.sqrt(this.config.tunnelRadius**2 - pipeY**2) - 0.2;
                const pipeCurve = new OffsetCurve(curveRadius, zStart, pipeLocX, pipeY);
                const pipeGeo = new THREE.TubeGeometry(pipeCurve, 64, 0.08, 8, false); const pipe = new THREE.Mesh(pipeGeo, assetMats.metal); group.add(pipe);

                const lightSpacing = 12; const lightCount = Math.floor(arcLength / lightSpacing); const nodeGeo = new THREE.BoxGeometry(0.2, 0.6, 0.1);

                for (let i = 0; i < lightCount; i++) {
                    const t = (i * lightSpacing + lightSpacing/2) / arcLength; const lightY = 3.5;
                    const wallLocX = Math.sqrt(this.config.tunnelRadius**2 - lightY**2) - 0.1;
                    
                    const trL = getTransform(t, -wallLocX, lightY); const ll = new THREE.Mesh(nodeGeo, envMats.tunnelLight);
                    ll.position.set(trL.x, trL.y, trL.z); ll.rotation.set(0, trL.rotY + Math.PI/2, 0);
                    if (i % 2 === 0) { const ptLight = new THREE.PointLight(0xff6600, 1.2, 25); ll.add(ptLight); } group.add(ll);

                    const trR = getTransform(t, wallLocX, lightY); const rl = new THREE.Mesh(nodeGeo, envMats.tunnelLight);
                    rl.position.set(trR.x, trR.y, trR.z); rl.rotation.set(0, trR.rotY - Math.PI/2, 0);
                    if (i % 2 === 1) { const ptLight = new THREE.PointLight(0xff6600, 1.2, 25); rl.add(ptLight); } group.add(rl);

                    if (i % 8 === 0) {
                        const fanY = 6.0; const trFan = getTransform(t, 0, fanY);
                        const fan = AssetFactory.buildExtractorFan(); fan.position.set(trFan.x, trFan.y, trFan.z); fan.rotation.set(0, trFan.rotY, 0);
                        const strut = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 2.0), assetMats.metal); strut.position.set(0, 1.5, 0);
                        fan.add(strut); group.add(fan); this.animatedFans.push(fan);
                    }

                    // --- TELEMETRY AND TRACKSIDE ASSET INTEGRATION ---
                    if (i % 3 === 0) {
                        const trHanger = getTransform(t, -wallLocX, 0);
                        const hangers = AssetFactory.buildCableHangers(); hangers.position.set(trHanger.x, trHanger.y, trHanger.z); hangers.rotation.set(0, trHanger.rotY + Math.PI/2, 0); group.add(hangers);
                    }
                    if (i % 4 === 1) {
                        const trPhone = getTransform(t, wallLocX - 0.2, 0);
                        const phone = AssetFactory.buildTunnelTelephone(); phone.position.set(trPhone.x, trPhone.y, trPhone.z); phone.rotation.set(0, trPhone.rotY - Math.PI/2, 0); group.add(phone);
                    }
                    if (i % 5 === 2) {
                        const trBoard = getTransform(t, -wallLocX + 0.2, 0);
                        const board = AssetFactory.buildDistBoard(); board.position.set(trBoard.x, trBoard.y, trBoard.z); board.rotation.set(0, trBoard.rotY + Math.PI/2, 0); group.add(board);
                    }
                    if (i % 5 === 0) {
                        const trBond = getTransform(t, 0, 0);
                        const bond = AssetFactory.buildLUImpedanceBond(); bond.position.set(trBond.x, trBond.y, trBond.z); bond.rotation.set(0, trBond.rotY, 0); group.add(bond);
                    }
                    if (i % 7 === 0) {
                        const trTrip = getTransform(t, this.config.trackOffset, 0);
                        const tripcock = AssetFactory.buildTripcock(); tripcock.position.set(trTrip.x, trTrip.y, trTrip.z); tripcock.rotation.set(0, trTrip.rotY, 0); group.add(tripcock);
                    }
                    if (i % 9 === 0) {
                        const trLube = getTransform(t, -this.config.trackOffset, 0);
                        const lube = AssetFactory.buildTunnelLubricator(); lube.position.set(trLube.x, trLube.y, trLube.z); lube.rotation.set(0, trLube.rotY, 0); group.add(lube);
                    }
                    if (i % 10 === 0) {
                        const trCase = getTransform(t, wallLocX - 0.5, 0);
                        const caseEq = AssetFactory.buildTunnelCase(); caseEq.position.set(trCase.x, trCase.y, trCase.z); caseEq.rotation.set(0, trCase.rotY - Math.PI/2, 0); group.add(caseEq);
                    }
                }

                this.config.zOffset = zStart - curveRadius; return group;
            }
        }

        let camera, scene, renderer, controls;

        function init() {
            scene = new THREE.Scene();
            scene.fog = new THREE.FogExp2(0x050505, 0.015);

            camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 200);
            camera.position.set(0, 5, -20);

            renderer = new THREE.WebGLRenderer({ antialias: true });
            renderer.setSize(window.innerWidth, window.innerHeight);
            renderer.shadowMap.enabled = true;
            renderer.shadowMap.type = THREE.PCFSoftShadowMap;
            document.body.appendChild(renderer.domElement);

            controls = new OrbitControls(camera, renderer.domElement);
            controls.target.set(40, 2, -80);
            controls.maxDistance = 100;
            controls.update();

            const ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
            scene.add(ambientLight);

            const dirLight = new THREE.DirectionalLight(0xffffee, 0.8);
            dirLight.position.set(10, 20, 10);
            dirLight.castShadow = true;
            dirLight.shadow.mapSize.width = 2048;
            dirLight.shadow.mapSize.height = 2048;
            scene.add(dirLight);

            EnvironmentGenerator.reset();
            const curvedTunnel = EnvironmentGenerator.createCurvedTunnel(120);
            scene.add(curvedTunnel);

            const guiParams = { lightIntensity: 0.8, ambientIntensity: 0.4 };
            const gui = new dat.GUI();
            const lightFolder = gui.addFolder('Illumination Matrix');
            lightFolder.add(guiParams, 'lightIntensity', 0, 2).name('Directional Flux').onChange(v => dirLight.intensity = v);
            lightFolder.add(guiParams, 'ambientIntensity', 0, 1).name('Ambient Base').onChange(v => ambientLight.intensity = v);
            lightFolder.open();

            window.addEventListener('resize', onWindowResize);
            animate();
        }

        function onWindowResize() {
            camera.aspect = window.innerWidth / window.innerHeight;
            camera.updateProjectionMatrix();
            renderer.setSize(window.innerWidth, window.innerHeight);
        }

        function animate() {
            requestAnimationFrame(animate);
            EnvironmentGenerator.update();
            renderer.render(scene, camera);
        }

        window.onload = init;
    