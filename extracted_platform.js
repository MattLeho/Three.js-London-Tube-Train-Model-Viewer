
        import * as THREE from 'three';
        import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

        function createBrickTexture() {
            const canvas = document.createElement('canvas');
            canvas.width = 512; canvas.height = 512;
            const ctx = canvas.getContext('2d');
            ctx.fillStyle = '#333333'; ctx.fillRect(0, 0, 512, 512);
            const rows = 16; const cols = 8;
            const rowHeight = 512 / rows; const colWidth = 512 / cols;
            const mortarGap = 4;
            for (let y = 0; y < rows; y++) {
                const offset = (y % 2 === 0) ? 0 : colWidth / 2;
                for (let x = -1; x < cols + 1; x++) {
                    const r = 80 + Math.random() * 40;
                    const g = 25 + Math.random() * 20;
                    const b = 20 + Math.random() * 20;
                    ctx.fillStyle = `rgb(${r},${g},${b})`;
                    ctx.fillRect(x * colWidth + offset + mortarGap / 2, y * rowHeight + mortarGap / 2, colWidth - mortarGap, rowHeight - mortarGap);
                }
            }
            ctx.fillStyle = 'rgba(0,0,0,0.4)';
            for(let i=0; i<1000; i++) {
                ctx.beginPath(); ctx.arc(Math.random()*512, Math.random()*512, Math.random()*4, 0, Math.PI*2); ctx.fill();
            }
            const tex = new THREE.CanvasTexture(canvas);
            tex.wrapS = THREE.RepeatWrapping; tex.wrapT = THREE.RepeatWrapping; return tex;
        }

        function createGravelTexture() {
            const canvas = document.createElement('canvas');
            canvas.width = 512; canvas.height = 512;
            const ctx = canvas.getContext('2d');
            ctx.fillStyle = '#0a0a0a'; ctx.fillRect(0, 0, 512, 512);
            for (let i = 0; i < 30000; i++) {
                const v = 15 + Math.random() * 70;
                ctx.fillStyle = `rgb(${v},${v},${v})`;
                ctx.fillRect(Math.random() * 512, Math.random() * 512, 1 + Math.random() * 4, 1 + Math.random() * 4);
            }
            const tex = new THREE.CanvasTexture(canvas);
            tex.wrapS = THREE.RepeatWrapping; tex.wrapT = THREE.RepeatWrapping; return tex;
        }

        function createCopperTexture() {
            const canvas = document.createElement('canvas');
            canvas.width = 1024; canvas.height = 1024;
            const ctx = canvas.getContext('2d');
            ctx.fillStyle = '#1e3834'; ctx.fillRect(0, 0, 1024, 1024);
            for (let i = 0; i < 40000; i++) {
                const v = Math.random();
                ctx.fillStyle = (v > 0.7) ? '#3b7269' : ((v > 0.4) ? '#2c4c47' : '#1a2e2b');
                ctx.fillRect(Math.random() * 1024, Math.random() * 1024, 3 + Math.random() * 6, 3 + Math.random() * 6);
            }
            const tex = new THREE.CanvasTexture(canvas);
            tex.wrapS = THREE.RepeatWrapping; tex.wrapT = THREE.RepeatWrapping; return tex;
        }

        function createRoundelTexture() {
            const canvas = document.createElement('canvas');
            canvas.width = 1024; canvas.height = 1024;
            const ctx = canvas.getContext('2d');
            ctx.fillStyle = '#ffffff'; ctx.fillRect(0, 0, 1024, 1024);
            ctx.strokeStyle = '#cc0000'; ctx.lineWidth = 140;
            ctx.beginPath(); ctx.arc(512, 512, 380, 0, Math.PI * 2); ctx.stroke();
            ctx.fillStyle = '#000099'; ctx.fillRect(80, 412, 864, 200);
            ctx.fillStyle = '#ffffff'; ctx.font = 'bold 90px "Arial", sans-serif';
            ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
            ctx.fillText('BAKER STREET', 512, 512);
            return new THREE.CanvasTexture(canvas);
        }

        function createPlatform5BrickTexture() {
            const canvas = document.createElement('canvas');
            canvas.width = 512; canvas.height = 512;
            const ctx = canvas.getContext('2d');
            ctx.fillStyle = '#a69e8f'; ctx.fillRect(0, 0, 512, 512);
            const rows = 16; const cols = 8;
            const rowHeight = 512 / rows; const colWidth = 512 / cols;
            const mortarGap = 6;
            for (let y = 0; y < rows; y++) {
                const offset = (y % 2 === 0) ? 0 : colWidth / 2;
                for (let x = -1; x < cols + 1; x++) {
                    const lum = 160 + Math.random() * 50;
                    ctx.fillStyle = `rgb(${lum}, ${lum * 0.9}, ${lum * 0.7})`;
                    ctx.fillRect(x * colWidth + offset + mortarGap / 2, y * rowHeight + mortarGap / 2, colWidth - mortarGap, rowHeight - mortarGap);
                }
            }
            const tex = new THREE.CanvasTexture(canvas);
            tex.wrapS = THREE.RepeatWrapping; tex.wrapT = THREE.RepeatWrapping; return tex;
        }

        function createScreenTexture(platformNum, dest) {
            const canvas = document.createElement('canvas');
            canvas.width = 512; canvas.height = 128;
            const ctx = canvas.getContext('2d');
            ctx.fillStyle = '#050505'; ctx.fillRect(0, 0, 512, 128);
            ctx.fillStyle = '#ff8800'; ctx.font = 'bold 36px monospace';
            ctx.fillText(`${platformNum}  PLATFORM ${platformNum}     1 MIN`, 20, 45);
            ctx.fillStyle = '#aa5500'; ctx.font = 'bold 28px monospace';
            ctx.fillText(`2  ${dest.padEnd(14, ' ')} 5 MIN`, 20, 95);
            return new THREE.CanvasTexture(canvas);
        }

        function createWayOutTexture() {
            const canvas = document.createElement('canvas');
            canvas.width = 512; canvas.height = 128;
            const ctx = canvas.getContext('2d');
            ctx.fillStyle = '#ffcc00'; ctx.fillRect(0, 0, 512, 128);
            ctx.fillStyle = '#000000'; ctx.font = 'bold 50px "Arial", sans-serif';
            ctx.fillText('WAY OUT', 20, 75);
            return new THREE.CanvasTexture(canvas);
        }

        function createMindTheGapTexture() {
            const canvas = document.createElement('canvas');
            canvas.width = 1024; canvas.height = 128;
            const ctx = canvas.getContext('2d');
            ctx.fillStyle = '#eedd00'; ctx.fillRect(0, 0, 1024, 128);
            ctx.fillStyle = '#222222'; ctx.font = 'bold 70px "Arial", sans-serif';
            ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
            ctx.fillText('MIND THE GAP', 512, 64);
            const tex = new THREE.CanvasTexture(canvas);
            tex.wrapS = THREE.RepeatWrapping; tex.wrapT = THREE.RepeatWrapping; return tex;
        }

        function createPosterTexture() {
            const canvas = document.createElement('canvas');
            canvas.width = 512; canvas.height = 768;
            const ctx = canvas.getContext('2d');
            const grd = ctx.createLinearGradient(0,0,0,768);
            grd.addColorStop(0,"#4444aa"); grd.addColorStop(1,"#111155");
            ctx.fillStyle = grd; ctx.fillRect(0,0,512,768);
            ctx.fillStyle = '#ffffff'; ctx.font = 'bold 50px sans-serif';
            ctx.textAlign = 'center'; ctx.fillText('VISIT LONDON', 256, 100);
            ctx.font = '30px sans-serif'; ctx.fillText('Explore the city today', 256, 160);
            ctx.fillStyle = '#ff5555'; ctx.beginPath(); ctx.arc(256, 400, 150, 0, Math.PI*2); ctx.fill();
            return new THREE.CanvasTexture(canvas);
        }

        const texBrick = createBrickTexture();
        const texGravel = createGravelTexture();
        const texCopper = createCopperTexture();
        const texScreen1 = createScreenTexture(1, "BAKER ST");
        const texScreen2 = createScreenTexture(2, "WATERLOO");
        const texRoundel = createRoundelTexture();
        const texPlatformBrick = createPlatform5BrickTexture();
        const texWayOut = createWayOutTexture();
        const texMindTheGap = createMindTheGapTexture();
        const texPoster = createPosterTexture();

        const assetMats = {
            woodDark: new THREE.MeshStandardMaterial({ color: 0x3d2314, roughness: 0.9 }),
            ironCast: new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.8, metalness: 0.6 }),
            brass: new THREE.MeshStandardMaterial({ color: 0xb5a642, roughness: 0.3, metalness: 0.8 }),
            glassMilkOff: new THREE.MeshPhysicalMaterial({ color: 0xeeeeee, roughness: 0.2, transmission: 0.2, opacity: 0.9, transparent: true }),
            glassMilkOn: new THREE.MeshStandardMaterial({ color: 0xffffff, emissive: 0xfff5e6, emissiveIntensity: 2.0 }),
            signageOff: new THREE.MeshStandardMaterial({ map: texRoundel, roughness: 0.4 }),
            signageOn: new THREE.MeshStandardMaterial({ map: texRoundel, emissiveMap: texRoundel, emissive: 0xffffff, emissiveIntensity: 1.5 }),
            bakerBrick: new THREE.MeshStandardMaterial({ map: texPlatformBrick, roughness: 0.9, color: 0xdddddd }),
            readerYellow: new THREE.MeshStandardMaterial({ color: 0xffcc00, roughness: 0.4 }),
            readerRing: new THREE.MeshStandardMaterial({ color: 0x00ffff, emissive: 0x00ffff, emissiveIntensity: 2.5 }),
            redMetal: new THREE.MeshStandardMaterial({ color: 0xaa1111, metalness: 0.6, roughness: 0.4 }),
            metal: new THREE.MeshStandardMaterial({ color: 0x555555, metalness: 0.8, roughness: 0.4 }),
            metalGalvanised: new THREE.MeshStandardMaterial({ color: 0xcccccc, metalness: 0.9, roughness: 0.3 }),
            signalRed: new THREE.MeshStandardMaterial({ color: 0xff0000, emissive: 0xff0000, emissiveIntensity: 3.0 }),
            signalAmber: new THREE.MeshStandardMaterial({ color: 0xffbf00, emissive: 0x332200, emissiveIntensity: 0.1 }),
            signalGreen: new THREE.MeshStandardMaterial({ color: 0x00ff00, emissive: 0x003300, emissiveIntensity: 0.1 }),
            cableBlack: new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.9, metalness: 0.2 }),
            cableOrange: new THREE.MeshStandardMaterial({ color: 0xdd5500, roughness: 0.8, metalness: 0.1 }),
            cctvGrey: new THREE.MeshStandardMaterial({ color: 0x999999, metalness: 0.3, roughness: 0.4 }),
            cctvGlass: new THREE.MeshStandardMaterial({ color: 0x020202, roughness: 0.05, metalness: 0.95 }),
            wayOutMat: new THREE.MeshStandardMaterial({ map: texWayOut, roughness: 0.5 }),
            fanBladeMat: new THREE.MeshLambertMaterial({ color: 0x1a1a1a }),
            fanCasingMat: new THREE.MeshStandardMaterial({ color: 0x333333, metalness: 0.7, roughness: 0.6 }),
            wireMesh: new THREE.MeshBasicMaterial({ color: 0x222222, wireframe: true }),
            irRing: new THREE.MeshStandardMaterial({ color: 0xff0000, emissive: 0xff0000, emissiveIntensity: 1.0 }),
            posterMat: new THREE.MeshStandardMaterial({ map: texPoster, roughness: 0.2 })
        };

        const envMats = {
            gravel: new THREE.MeshStandardMaterial({ map: texGravel, roughness: 1.0, color: 0x888888 }),
            brick: new THREE.MeshStandardMaterial({ map: texBrick, roughness: 0.9, color: 0xdddddd }),
            concrete: new THREE.MeshStandardMaterial({ color: 0x444444, roughness: 0.9, side: THREE.DoubleSide }),
            concreteDark: new THREE.MeshStandardMaterial({ color: 0x1c1c1c, roughness: 0.9 }),
            platform: new THREE.MeshStandardMaterial({ color: 0x555555, roughness: 0.8 }),
            tactile: new THREE.MeshStandardMaterial({ map: texMindTheGap, color: 0xddaa00, roughness: 0.6 }),
            track: new THREE.MeshStandardMaterial({ color: 0x2a2a2a, metalness: 0.7, roughness: 0.4 }),
            sleeper: new THREE.MeshStandardMaterial({ color: 0x1a1510, roughness: 1.0 }),
            tunnelLight: new THREE.MeshStandardMaterial({ color: 0xff8800, emissive: 0xff6600, emissiveIntensity: 3.0 }),
            stationLight: new THREE.MeshStandardMaterial({ color: 0xffffee, emissive: 0xffffee, emissiveIntensity: 3.0 }),
            metal: new THREE.MeshStandardMaterial({ color: 0x333333, metalness: 0.8, roughness: 0.4 }),
            redMetal: new THREE.MeshStandardMaterial({ color: 0x9b1b1b, metalness: 0.4, roughness: 0.6 }),
            copper: new THREE.MeshStandardMaterial({ map: texCopper, metalness: 0.5, roughness: 0.6 }),
            infoScreen1: new THREE.MeshStandardMaterial({ map: texScreen1, emissiveMap: texScreen1, emissive: 0xffffff, emissiveIntensity: 2.0 }),
            infoScreen2: new THREE.MeshStandardMaterial({ map: texScreen2, emissiveMap: texScreen2, emissive: 0xffffff, emissiveIntensity: 2.0 }),
            rubbishBinMat: new THREE.MeshStandardMaterial({ color: 0x111111, metalness: 0.5, roughness: 0.8 }),
            ticketMachineMat: new THREE.MeshStandardMaterial({ color: 0x0033cc, metalness: 0.3, roughness: 0.4 })
        };

        class AssetFactory {
            static buildHeritageBench() {
                const group = new THREE.Group();
                const slatGeo = new THREE.BoxGeometry(2.4, 0.04, 0.08);
                for(let i = 0; i < 7; i++) {
                    const slat = new THREE.Mesh(slatGeo, assetMats.woodDark);
                    slat.position.set(0, 0.45, -0.25 + (i * 0.09));
                    slat.castShadow = true; group.add(slat);
                }
                for(let i = 0; i < 5; i++) {
                    const slat = new THREE.Mesh(slatGeo, assetMats.woodDark);
                    slat.position.set(0, 0.55 + (i * 0.09), -0.32);
                    slat.rotation.x = Math.PI / 12;
                    slat.castShadow = true; group.add(slat);
                }
                const legShape = new THREE.Shape();
                legShape.moveTo(0.35, 0); legShape.lineTo(-0.25, 0); legShape.lineTo(-0.25, 0.4);
                legShape.lineTo(-0.35, 0.45); legShape.lineTo(0.38, 1.0); legShape.lineTo(0.45, 0.4); legShape.lineTo(0.35, 0);
                const extrudeSettings = { depth: 0.06, bevelEnabled: true, bevelSegments: 2, steps: 2, bevelSize: 0.01, bevelThickness: 0.01 };
                const legGeo = new THREE.ExtrudeGeometry(legShape, extrudeSettings);
                [-1.1, 0, 1.1].forEach(x => {
                    const leg = new THREE.Mesh(legGeo, assetMats.ironCast);
                    leg.position.set(x - 0.03, 0, -0.03); 
                    leg.rotation.y = Math.PI / 2; leg.castShadow = true; group.add(leg);
                });
                return group;
            }
            static buildCCTV_Dome_Ceiling() {
                const group = new THREE.Group();
                const base = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.2, 0.05, 16), assetMats.cctvGrey);
                const dome = new THREE.Mesh(new THREE.SphereGeometry(0.18, 16, 16, 0, Math.PI * 2, 0, Math.PI / 2), assetMats.cctvGlass);
                dome.position.y = -0.02; dome.rotation.x = Math.PI;
                base.castShadow = true; group.add(base, dome); return group;
            }
            static buildCCTV_Dome_Wall() {
                const group = new THREE.Group();
                const arm = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.3), assetMats.metal);
                arm.rotation.x = Math.PI / 2; arm.position.z = 0.15; arm.castShadow = true;
                const head = this.buildCCTV_Dome_Ceiling();
                head.position.set(0, -0.05, 0.3); head.rotation.x = Math.PI / 4;
                group.add(arm, head); return group;
            }
            static buildCCTV_PTZ() {
                const group = new THREE.Group();
                const arm = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.1, 0.4), assetMats.metal);
                arm.position.set(0, 0.4, 0.2); arm.castShadow = true;
                const housing = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.15, 0.25, 16), assetMats.cctvGrey);
                housing.position.set(0, 0.25, 0.4); housing.rotation.x = Math.PI / 8; housing.castShadow = true;
                const dome = new THREE.Mesh(new THREE.SphereGeometry(0.14, 16, 16, 0, Math.PI*2, 0, Math.PI/2), assetMats.cctvGlass);
                dome.position.y = -0.12; dome.rotation.x = Math.PI; housing.add(dome);
                group.add(arm, housing); return group;
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
            static buildPipingRun_Standard(length = 10.0) {
                const group = new THREE.Group();
                const pipeGeo = new THREE.CylinderGeometry(0.08, 0.08, length, 16);
                for(let i=0; i<3; i++) {
                    const pipe = new THREE.Mesh(pipeGeo, assetMats.metal); pipe.rotation.x = Math.PI / 2; pipe.position.set(0, i * 0.25, 0); 
                    pipe.castShadow = true; pipe.receiveShadow = true; group.add(pipe);
                }
                const bracketGeo = new THREE.BoxGeometry(0.1, 0.8, 0.2);
                for(let z=-length/2 + 1; z<=length/2; z+=2.5) {
                    const bracket = new THREE.Mesh(bracketGeo, assetMats.ironCast); bracket.position.set(-0.05, 0.25, z); 
                    bracket.castShadow = true; group.add(bracket);
                }
                return group;
            }
            static buildWallCables_Sagging(length = 10.0) {
                const group = new THREE.Group();
                class CustomSagCurve extends THREE.Curve {
                    constructor(len) { super(); this.len = len; }
                    getPoint(t, optionalTarget = new THREE.Vector3()) {
                        const ty = -Math.sin(t * Math.PI) * 0.2; return optionalTarget.set(0, ty, (t - 0.5) * this.len);
                    }
                }
                const bracketSpacing = 2.5; const bracketGeo = new THREE.BoxGeometry(0.2, 0.4, 0.1);
                for(let z = -length/2; z <= length/2; z += bracketSpacing) {
                    const bracket = new THREE.Mesh(bracketGeo, assetMats.metal); bracket.position.set(-0.05, -0.1, z); 
                    bracket.castShadow = true; group.add(bracket);
                }
                for(let s=0; s < length/bracketSpacing; s++) {
                    const path = new CustomSagCurve(bracketSpacing); const cableGeo = new THREE.TubeGeometry(path, 12, 0.02, 8, false);
                    for(let i=0; i<4; i++) {
                        const cable = new THREE.Mesh(cableGeo, assetMats.cableBlack);
                        cable.position.set(0.05, -0.1 - (i * 0.04), -length/2 + (s * bracketSpacing) + (bracketSpacing/2));
                        cable.castShadow = true; group.add(cable);
                    }
                }
                return group;
            }
            static buildHVACDuct_Industrial(length = 10.0) {
                const group = new THREE.Group(); const ductGeo = new THREE.BoxGeometry(0.8, 0.6, length);
                const duct = new THREE.Mesh(ductGeo, assetMats.metalGalvanised); duct.castShadow = true; group.add(duct);
                const ribGeo = new THREE.BoxGeometry(0.85, 0.65, 0.05);
                for(let z=-length/2 + 0.5; z<=length/2; z+=1.5) { 
                    const rib = new THREE.Mesh(ribGeo, assetMats.metal); rib.position.z = z; rib.castShadow = true; group.add(rib); 
                }
                return group;
            }
            static buildRoundelSign(isOn) { 
                const g = new THREE.Group(); 
                const frame = new THREE.Mesh(new THREE.CylinderGeometry(0.85, 0.85, 0.1, 64).rotateX(Math.PI/2), assetMats.brass); frame.castShadow = true;
                const faceMat = isOn ? assetMats.signageOn : assetMats.signageOff; 
                const faceF = new THREE.Mesh(new THREE.CircleGeometry(0.8, 64), faceMat); faceF.position.z = 0.051; 
                const faceB = new THREE.Mesh(new THREE.CircleGeometry(0.8, 64), faceMat); faceB.rotation.y = Math.PI; faceB.position.z = -0.051; 
                const b = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.5, 0.05), assetMats.ironCast); b.position.y = 1.0; b.castShadow = true;
                g.add(frame, faceF, faceB, b); return g; 
            }
            static buildOysterReader() { 
                const g = new THREE.Group(); 
                const p = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 1.1, 16), assetMats.ironCast); p.position.y=0.55; p.castShadow = true;
                const h = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.15, 0.4), assetMats.ironCast); h.position.set(0, 1.15, 0); h.rotation.x = Math.PI/8; h.castShadow = true;
                const pad = new THREE.Mesh(new THREE.CircleGeometry(0.12, 32), assetMats.readerYellow); pad.position.set(0, 1.23, 0.02); pad.rotation.x = -Math.PI/2 + Math.PI/8; 
                const rng = new THREE.Mesh(new THREE.RingGeometry(0.09, 0.11, 32), assetMats.readerRing); rng.position.set(0, 1.231, 0.02); rng.rotation.x = -Math.PI/2 + Math.PI/8; 
                g.add(p, h, pad, rng); return g; 
            }
            static buildWayOutSign() { 
                const g = new THREE.Group(); 
                const s = new THREE.Mesh(new THREE.BoxGeometry(2.0, 0.5, 0.05), assetMats.wayOutMat); 
                s.castShadow = true; g.add(s); return g; 
            }
            static buildGlobeLamp(isOn) { 
                const g = new THREE.Group(); 
                const globeMat = isOn ? assetMats.glassMilkOn : assetMats.glassMilkOff; 
                const globe = new THREE.Mesh(new THREE.SphereGeometry(0.3, 32, 32), globeMat); 
                globe.position.y = 3.0; 
                if(isOn) { const pl = new THREE.PointLight(0xfff5e6, 2.0, 10); pl.position.y = 3.0; g.add(pl); } 
                const post = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.1, 3.0, 16), assetMats.ironCast); 
                post.position.y = 1.5; 
                const base = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.3, 0.4, 16), assetMats.ironCast); 
                base.position.y = 0.2; 
                g.add(globe, post, base); return g; 
            }
            static buildCableTray_Bundle(length = 10.0) {
                const group = new THREE.Group();
                const trayGeo = new THREE.BoxGeometry(0.4, 0.05, length);
                const tray = new THREE.Mesh(trayGeo, assetMats.metalGalvanised); group.add(tray);
                const wireGeo = new THREE.CylinderGeometry(0.015, 0.015, length, 8); wireGeo.rotateX(Math.PI/2);
                for(let i=0; i<12; i++) {
                    const wireMat = Math.random() > 0.8 ? assetMats.cableOrange : assetMats.cableBlack;
                    const wire = new THREE.Mesh(wireGeo, wireMat);
                    wire.position.set((Math.random()-0.5)*0.3, 0.04 + Math.random()*0.02, 0);
                    group.add(wire);
                }
                return group;
            }
            static buildVerticalConduit_Drop() {
                const group = new THREE.Group();
                const pipeGeo = new THREE.CylinderGeometry(0.05, 0.05, 6.0, 16);
                const pipe = new THREE.Mesh(pipeGeo, assetMats.metal); pipe.position.y = 3.0;
                const boxGeo = new THREE.BoxGeometry(0.3, 0.4, 0.15);
                const junction = new THREE.Mesh(boxGeo, assetMats.ironCast); junction.position.y = 0.2;
                group.add(pipe, junction); return group;
            }
            static buildCCTV_Box() {
                const group = new THREE.Group();
                const bracket = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.4, 0.05), assetMats.metal); bracket.position.y = 0.2;
                const housing = new THREE.Mesh(new THREE.BoxGeometry(0.15, 0.15, 0.4), assetMats.cctvGrey);
                housing.position.set(0, 0.35, 0.15); housing.rotation.x = Math.PI / 6;
                const lens = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.05, 16), assetMats.cctvGlass);
                lens.rotation.x = Math.PI / 2; lens.position.z = 0.22; housing.add(lens);
                const wire = new THREE.Mesh(new THREE.CylinderGeometry(0.01, 0.01, 0.2), assetMats.cableBlack);
                wire.position.set(0, 0.3, 0); wire.rotation.x = Math.PI / 8;
                group.add(bracket, housing, wire); return group;
            }
            static buildCCTV_Bullet_Standard() {
                const group = new THREE.Group();
                const arm = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.2), assetMats.metal);
                arm.rotation.x = Math.PI / 2; arm.position.z = 0.1;
                const body = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 0.3, 16), assetMats.cctvGrey);
                body.position.set(0, -0.05, 0.25); body.rotation.x = (Math.PI / 2) + (Math.PI / 6); 
                const lens = new THREE.Mesh(new THREE.CircleGeometry(0.06, 16), assetMats.cctvGlass);
                lens.position.set(0, 0.151, 0); lens.rotation.x = -Math.PI / 2; body.add(lens);
                group.add(arm, body); return group;
            }
            static buildCCTV_Bullet_IR() {
                const group = this.buildCCTV_Bullet_Standard();
                const ir = new THREE.Mesh(new THREE.RingGeometry(0.04, 0.06, 16), assetMats.irRing);
                ir.position.set(0, 0.152, 0); ir.rotation.x = -Math.PI / 2; group.children[1].add(ir); return group;
            }
            static buildCCTV_Dual_Bullet() {
                const group = new THREE.Group();
                const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.5), assetMats.metal); pole.position.y = 0.25;
                const cam1 = this.buildCCTV_Bullet_Standard(); cam1.position.set(-0.05, 0.5, 0); cam1.rotation.y = Math.PI / 4; 
                const cam2 = this.buildCCTV_Bullet_Standard(); cam2.position.set(0.05, 0.5, 0); cam2.rotation.y = -Math.PI / 4; 
                group.add(pole, cam1, cam2); return group;
            }
            static buildCCTV_360() {
                const group = new THREE.Group();
                const base = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.3, 0.1, 16), assetMats.cctvGrey);
                for(let i=0; i<4; i++) {
                    const sensor = new THREE.Mesh(new THREE.SphereGeometry(0.08, 16, 16, 0, Math.PI*2, 0, Math.PI/2), assetMats.cctvGlass);
                    sensor.rotation.x = Math.PI; const angle = (Math.PI / 2) * i;
                    sensor.position.set(Math.cos(angle)*0.15, -0.05, Math.sin(angle)*0.15);
                    sensor.rotation.z = Math.cos(angle) * (Math.PI/6); sensor.rotation.x += Math.sin(angle) * (Math.PI/6);
                    base.add(sensor);
                }
                group.add(base); return group;
            }
            static buildHangingSign() { 
                const g = new THREE.Group(); 
                const m1 = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 1.0), assetMats.metal); m1.position.set(1.0, 0.5, 0); m1.castShadow = true;
                const m2 = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 1.0), assetMats.metal); m2.position.set(-1.0, 0.5, 0); m2.castShadow = true;
                const sb = new THREE.Mesh(new THREE.BoxGeometry(2.5, 0.8, 0.1), assetMats.metal); sb.castShadow = true;
                const d1 = new THREE.Mesh(new THREE.PlaneGeometry(2.4, 0.7), assetMats.metal); d1.position.z = 0.051; 
                const d2 = new THREE.Mesh(new THREE.PlaneGeometry(2.4, 0.7), assetMats.metal); d2.rotation.y = Math.PI; d2.position.z = -0.051; 
                sb.add(d1, d2); g.add(m1, m2, sb); return g; 
            }
            static buildAdvertisementPoster() {
                const g = new THREE.Group();
                const frame = new THREE.Mesh(new THREE.BoxGeometry(1.6, 2.4, 0.05), assetMats.metal); frame.castShadow = true;
                const poster = new THREE.Mesh(new THREE.PlaneGeometry(1.5, 2.3), assetMats.posterMat); poster.position.z = 0.026;
                g.add(frame, poster); return g;
            }
            static buildRubbishBin() {
                const g = new THREE.Group();
                const body = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.3, 0.8, 16), envMats.rubbishBinMat);
                body.position.y = 0.4; body.castShadow = true;
                const rim = new THREE.Mesh(new THREE.TorusGeometry(0.3, 0.03, 8, 16), assetMats.metal);
                rim.rotation.x = Math.PI / 2; rim.position.y = 0.8; rim.castShadow = true;
                g.add(body, rim); return g;
            }
            static buildTicketMachine() {
                const g = new THREE.Group();
                const body = new THREE.Mesh(new THREE.BoxGeometry(1.0, 1.8, 0.6), envMats.ticketMachineMat); body.position.y = 0.9; body.castShadow = true;
                const screen = new THREE.Mesh(new THREE.PlaneGeometry(0.6, 0.4), new THREE.MeshBasicMaterial({color: 0x88ccff})); screen.position.set(0, 1.3, 0.301);
                const pad = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.2, 0.1), assetMats.metal);
                pad.position.set(0, 0.9, 0.3); pad.rotation.x = -Math.PI / 6; pad.castShadow = true;
                g.add(body, screen, pad); return g;
            }
            static buildPedestrianBridgeStandalone() {
                const group = new THREE.Group();
                const deckHeight = 6.0; const bWidth = 4.0; const span = 21.0; 
                
                const deckGeo = new THREE.BoxGeometry(span, 0.4, bWidth);
                const deck = new THREE.Mesh(deckGeo, assetMats.redMetal);
                deck.position.set(0, deckHeight, 0); deck.receiveShadow = true; deck.castShadow = true; group.add(deck);

                const beamGeo = new THREE.BoxGeometry(span, 0.8, 0.2);
                const beamF = new THREE.Mesh(beamGeo, assetMats.redMetal); beamF.position.set(0, deckHeight - 0.4, bWidth/2 - 0.1); beamF.castShadow = true;
                const beamB = new THREE.Mesh(beamGeo, assetMats.redMetal); beamB.position.set(0, deckHeight - 0.4, -bWidth/2 + 0.1); beamB.castShadow = true;
                group.add(beamF, beamB);

                const colGeo = new THREE.CylinderGeometry(0.2, 0.2, deckHeight);
                [-8.5, 8.5].forEach(x => {
                    const colF = new THREE.Mesh(colGeo, assetMats.redMetal); colF.position.set(x, deckHeight/2, bWidth/2 - 0.2); colF.castShadow = true;
                    const colB = new THREE.Mesh(colGeo, assetMats.redMetal); colB.position.set(x, deckHeight/2, -bWidth/2 + 0.2); colB.castShadow = true;
                    group.add(colF, colB);
                });

                const frontRailSegments = [{x: -10.2, len: 0.6}, {x: 0, len: 14.2}, {x: 10.2, len: 0.6}];
                frontRailSegments.forEach(seg => {
                    const r = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, seg.len).rotateZ(Math.PI/2), assetMats.redMetal);
                    r.position.set(seg.x, deckHeight + 1.1, bWidth/2 - 0.1); group.add(r);
                });

                const railBack = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, span).rotateZ(Math.PI/2), assetMats.redMetal);
                railBack.position.set(0, deckHeight + 1.1, -bWidth/2 + 0.1); group.add(railBack);

                const createFlight = (xOffset) => {
                    const flight = new THREE.Group();
                    const stepCount = 28; const stairRise = deckHeight - 1.1; const stepRise = stairRise / stepCount; 
                    const stepRun = 0.3; const stairRun = stepCount * stepRun; const stairWidth = 2.8;

                    const stepsGeo = new THREE.BoxGeometry(stairWidth, stepRise, stepRun);
                    const stepsInstanced = new THREE.InstancedMesh(stepsGeo, assetMats.redMetal, stepCount);
                    const dummy = new THREE.Object3D();

                    for (let s = 0; s < stepCount; s++) {
                        dummy.position.set(0, 1.1 + stairRise - (s * stepRise) - (stepRise/2), -(bWidth/2 + (s * stepRun) + (stepRun/2)));
                        dummy.updateMatrix(); stepsInstanced.setMatrixAt(s, dummy.matrix);
                    }
                    stepsInstanced.castShadow = true; flight.add(stepsInstanced);

                    const stairLength = Math.sqrt(stairRun**2 + stairRise**2); const stairAngle = Math.atan2(stairRise, stairRun);
                    const hRailGeo = new THREE.CylinderGeometry(0.06, 0.06, stairLength); hRailGeo.rotateX(Math.PI/2); 
                    
                    [-1, 1].forEach(side => {
                        const rail = new THREE.Mesh(hRailGeo, assetMats.redMetal);
                        rail.position.set((stairWidth/2 - 0.15) * side, 1.1 + (stairRise/2) + 0.9, -(bWidth/2 + (stairRun/2)));
                        rail.rotation.x = -stairAngle; 
                        
                        const postGeo = new THREE.CylinderGeometry(0.03, 0.03, 0.9);
                        for(let p=0; p<6; p++) {
                            const fract = p / 5; const post = new THREE.Mesh(postGeo, assetMats.redMetal);
                            post.position.set(0, -0.45, (fract - 0.5) * stairLength); post.rotation.x = stairAngle; rail.add(post);
                        }
                        flight.add(rail);
                    });
                    flight.position.x = xOffset; return flight;
                };

                group.add(createFlight(8.5)); group.add(createFlight(-8.5)); return group;
            }

            static buildTrackSignal() { 
                const g = new THREE.Group(); 
                const p = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 2.0), assetMats.metal); p.position.y = 1.0; p.castShadow = true;
                const h = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.9, 0.2), assetMats.ironCast); h.position.set(0, 1.8, 0.1); h.castShadow = true;
                const lr = new THREE.Mesh(new THREE.CircleGeometry(0.1, 16), assetMats.signalRed); lr.position.set(0, 2.1, 0.201); 
                const la = new THREE.Mesh(new THREE.CircleGeometry(0.1, 16), assetMats.signalAmber); la.position.set(0, 1.8, 0.201); 
                const lg = new THREE.Mesh(new THREE.CircleGeometry(0.1, 16), assetMats.signalGreen); lg.position.set(0, 1.5, 0.201); 
                g.add(p, h, lr, la, lg); return g; 
            }
        }

        class EnvironmentGenerator {
            static config = {
                gauge: 1.435, trackOffset: 3.0, tunnelRadius: 8.0, platformWidth: 7.0, platformHeight: 1.1, wallHeight: 4.5, zOffset: 0
            };
            static animatedFans = [];

            static reset() { this.config.zOffset = 0; this.animatedFans = []; }

            static update() {
                this.animatedFans.forEach(fan => {
                    if (fan.userData.isFan && fan.userData.rotor) fan.userData.rotor.rotation.z -= 0.12; 
                });
            }

            static createDoubleTrackBed(length, isTunnel = false, transitionLength = 0) {
                const group = new THREE.Group(); const offset = this.config.trackOffset; 
                const bedWidth = (offset * 2) + 3.0;
                
                const deckGeo = new THREE.PlaneGeometry(bedWidth, length);
                const localGravelMat = envMats.gravel.clone(); localGravelMat.map = texGravel.clone(); localGravelMat.map.needsUpdate = true; localGravelMat.map.repeat.set((bedWidth) / 2, length / 2);
                const bed = new THREE.Mesh(deckGeo, localGravelMat); bed.rotation.x = -Math.PI / 2; bed.receiveShadow = true; group.add(bed);

                const sleeperGeo = new THREE.BoxGeometry(this.config.gauge + 0.6, 0.1, 0.25);
                const sleeperCount = Math.floor(length / 0.65);
                const sleeperInstanced = new THREE.InstancedMesh(sleeperGeo, envMats.sleeper, sleeperCount * 2);
                sleeperInstanced.receiveShadow = true; sleeperInstanced.castShadow = true;

                let sleeperIndex = 0; const dummy = new THREE.Object3D();
                [-1, 1].forEach(sign => {
                    const x = sign * offset;
                    ['left', 'right'].forEach(railSide => {
                        const rs = railSide === 'left' ? -1 : 1;
                        const railGeom = new THREE.BoxGeometry(0.1, 0.15, length); const rail = new THREE.Mesh(railGeom, envMats.track);
                        rail.position.set(x + rs * this.config.gauge / 2, 0.075, 0); rail.castShadow = true; rail.receiveShadow = true; group.add(rail);
                    });
                    for (let i = 0; i < sleeperCount; i++) {
                        const z = length / 2 - (i / (sleeperCount - 1)) * length; 
                        dummy.position.set(x, 0.05, z); dummy.rotation.y = 0; dummy.updateMatrix(); sleeperInstanced.setMatrixAt(sleeperIndex++, dummy.matrix);
                    }
                });
                group.add(sleeperInstanced); return group;
            }

            static createStation(length) {
                const group = new THREE.Group(); group.add(this.createDoubleTrackBed(length));
                const gapFromTrack = 1.0;
                const platformInnerX = this.config.trackOffset + (this.config.gauge / 2) + gapFromTrack;
                const platformOuterX = platformInnerX + this.config.platformWidth;
                const totalHeight = 16.0;

                const wallGeo = new THREE.PlaneGeometry(length, totalHeight);
                const localBrickMat = envMats.brick.clone(); localBrickMat.map = texBrick.clone(); localBrickMat.map.needsUpdate = true; localBrickMat.map.repeat.set(length / 4, totalHeight / 4);

                const rightWall = new THREE.Mesh(wallGeo, localBrickMat); rightWall.position.set(platformOuterX, totalHeight / 2, 0); rightWall.rotation.y = -Math.PI / 2; rightWall.receiveShadow = true; group.add(rightWall);
                const leftWall = new THREE.Mesh(wallGeo, localBrickMat); leftWall.position.set(-platformOuterX, totalHeight / 2, 0); leftWall.rotation.y = Math.PI / 2; leftWall.receiveShadow = true; group.add(leftWall);

                const roofGeo = new THREE.PlaneGeometry(platformOuterX * 2, length);
                const roofMat = new THREE.MeshBasicMaterial({ color: 0x050505 });
                const roof = new THREE.Mesh(roofGeo, roofMat); roof.rotation.x = Math.PI / 2; roof.position.set(0, totalHeight, 0); group.add(roof);

                const platGeo = new THREE.BoxGeometry(this.config.platformWidth, this.config.platformHeight, length);
                const rightPlatform = new THREE.Mesh(platGeo, envMats.platform); rightPlatform.position.set(platformInnerX + (this.config.platformWidth / 2), this.config.platformHeight / 2, 0); rightPlatform.receiveShadow = true;
                const leftPlatform = new THREE.Mesh(platGeo, envMats.platform); leftPlatform.position.set(-(platformInnerX + (this.config.platformWidth / 2)), this.config.platformHeight / 2, 0); leftPlatform.receiveShadow = true;
                group.add(rightPlatform, leftPlatform);

                const tactileGeo = new THREE.PlaneGeometry(0.5, length);
                const localTactileMat = envMats.tactile.clone(); localTactileMat.map = texMindTheGap.clone(); localTactileMat.map.needsUpdate = true; localTactileMat.map.repeat.set(length / 2, 1);
                
                const rightTactile = new THREE.Mesh(tactileGeo, localTactileMat); rightTactile.rotation.x = -Math.PI / 2; rightTactile.position.set(platformInnerX + 0.25, this.config.platformHeight + 0.005, 0); rightTactile.receiveShadow = true;
                const leftTactile = new THREE.Mesh(tactileGeo, localTactileMat); leftTactile.rotation.x = -Math.PI / 2; leftTactile.position.set(-(platformInnerX + 0.25), this.config.platformHeight + 0.005, 0); leftTactile.rotation.z = Math.PI; leftTactile.receiveShadow = true;
                group.add(rightTactile, leftTactile);

                const bridge = AssetFactory.buildPedestrianBridgeStandalone(); bridge.position.set(0, 0, (length / 2) - 25); group.add(bridge);

                const capShape = new THREE.Shape();
                capShape.moveTo(-platformOuterX, -8); capShape.lineTo(platformOuterX, -8); capShape.lineTo(platformOuterX, 16); capShape.lineTo(-platformOuterX, 16); capShape.lineTo(-platformOuterX, -8);
                const hole = new THREE.Path(); hole.absarc(0, 0, this.config.tunnelRadius, 0, Math.PI * 2, false); capShape.holes.push(hole);
                const capGeo = new THREE.ExtrudeGeometry(capShape, {depth: 1.0, bevelEnabled: false});
                const capFront = new THREE.Mesh(capGeo, envMats.concreteDark); capFront.position.set(0, 0, length / 2);
                const capBack = new THREE.Mesh(capGeo, envMats.concreteDark); capBack.position.set(0, 0, -length / 2 - 1.0);
                group.add(capFront, capBack);

                this.addDetailedInfrastructure(group, length, platformInnerX, platformOuterX, 1); 
                this.addDetailedInfrastructure(group, length, -platformOuterX, -platformInnerX, -1); 

                group.position.z = this.config.zOffset - (length / 2); this.config.zOffset -= length; return group;
            }

            static addDetailedInfrastructure(group, length, innerVal, outerVal, dir) {
                const wallX = dir === 1 ? outerVal : innerVal;
                const spacing = 15; const count = Math.floor(length / spacing); const midX = (innerVal + outerVal) / 2;

                const cable = AssetFactory.buildWallCables_Sagging(length); cable.position.set(wallX - (0.1 * dir), this.config.platformHeight + 5.0, 0); group.add(cable);
                const duct = AssetFactory.buildHVACDuct_Industrial(length); duct.position.set(wallX - (0.6 * dir), this.config.platformHeight + 6.0, 0); group.add(duct);
                const trayCable = AssetFactory.buildCableTray_Bundle(length); trayCable.position.set(wallX - (0.4 * dir), this.config.platformHeight + 5.5, 0); group.add(trayCable);
                const pipes = AssetFactory.buildPipingRun_Standard(length); pipes.position.set(wallX - (0.2 * dir), this.config.platformHeight + 4.0, 0); group.add(pipes);

                for (let i = 0; i < count; i++) {
                    const zPos = (length / 2) - (i * spacing) - (spacing / 2);

                    if (i % 2 === 0) { const bench = AssetFactory.buildHeritageBench(); bench.position.set(wallX - (dir * 0.8), this.config.platformHeight, zPos); bench.rotation.y = (dir === 1) ? -Math.PI / 2 : Math.PI / 2; group.add(bench); }
                    if (i % 4 === 1) { const reader = AssetFactory.buildOysterReader(); reader.position.set(midX, this.config.platformHeight, zPos - 2); reader.rotation.y = (dir === 1) ? -Math.PI / 2 : Math.PI / 2; group.add(reader); }
                    if (i % 3 === 0) { const wayOut = AssetFactory.buildWayOutSign(); wayOut.position.set(wallX - (0.05 * dir), this.config.platformHeight + 3.0, zPos - 2); wayOut.rotation.y = (dir === 1) ? -Math.PI / 2 : Math.PI / 2; group.add(wayOut); }
                    if (i % 2 === 0) {
                        const sign = AssetFactory.buildRoundelSign(true); sign.position.set(wallX - (0.8 * dir), this.config.platformHeight + 2.5, zPos + 4); sign.rotation.y = 0;
                        const bracket = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.8).rotateZ(Math.PI/2), assetMats.metal); bracket.position.set(dir * 0.4, 1.0, 0); sign.add(bracket); group.add(sign);
                    }
                    if (i % 2 === 1) { const poster = AssetFactory.buildAdvertisementPoster(); poster.position.set(wallX - (0.05 * dir), this.config.platformHeight + 1.8, zPos + 2); poster.rotation.y = (dir === 1) ? -Math.PI / 2 : Math.PI / 2; group.add(poster); }
                    if (i % 3 === 0) {
                        const hang = AssetFactory.buildHangingSign(); const dropY = this.config.platformHeight + 3.5; hang.position.set(midX, dropY, zPos + 6); hang.rotation.y = 0;
                        const poleLen = 16.0 - dropY;
                        const pole1 = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, poleLen), assetMats.metal); pole1.position.set(1.0, poleLen / 2 + 0.5, 0);
                        const pole2 = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, poleLen), assetMats.metal); pole2.position.set(-1.0, poleLen / 2 + 0.5, 0);
                        hang.add(pole1, pole2); group.add(hang);
                    }
                    if (i % 2 === 0) { const lamp = AssetFactory.buildGlobeLamp(true); lamp.position.set(midX + (dir * 1.5), this.config.platformHeight, zPos - 3); group.add(lamp); }
                    if (i % 4 === 1) { const conduit = AssetFactory.buildVerticalConduit_Drop(); conduit.position.set(wallX - (dir * 0.1), this.config.platformHeight, zPos - 4); group.add(conduit); }
                    if (i % 2 === 0) { const bin = AssetFactory.buildRubbishBin(); bin.position.set(midX + (dir * 0.5), this.config.platformHeight, zPos - 5); group.add(bin); }
                    if (i % 4 === 2) { const ticketMachine = AssetFactory.buildTicketMachine(); ticketMachine.position.set(wallX - (dir * 0.6), this.config.platformHeight, zPos + 7); ticketMachine.rotation.y = (dir === 1) ? -Math.PI / 2 : Math.PI / 2; group.add(ticketMachine); }
                    if (i % 8 === 0) {
                        const cctv = AssetFactory.buildCCTV_PTZ(); const dropY = this.config.platformHeight + 4.5; cctv.position.set(midX, dropY, zPos - 5); cctv.rotation.y = (dir === 1) ? -Math.PI / 2 : Math.PI / 2;
                        const poleLen = 16.0 - dropY; const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, poleLen), assetMats.metal); pole.position.set(0, poleLen / 2 + 0.25, 0); cctv.add(pole); group.add(cctv);
                    }
                    if (i % 8 === 4) {
                        const cctv360 = AssetFactory.buildCCTV_360(); const dropY = this.config.platformHeight + 5.0; cctv360.position.set(midX, dropY, zPos + 3);
                        const poleLen = 16.0 - dropY; const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, poleLen), assetMats.metal); pole.position.set(0, poleLen / 2, 0); cctv360.add(pole); group.add(cctv360);
                    }
                    if (i % 6 === 0) { const cctvWall = AssetFactory.buildCCTV_Dome_Wall(); cctvWall.position.set(wallX - (0.2 * dir), this.config.platformHeight + 4.0, zPos + 2); cctvWall.rotation.y = (dir === 1) ? -Math.PI / 2 : Math.PI / 2; group.add(cctvWall); }
                    if (i % 6 === 3) { const cctvDual = AssetFactory.buildCCTV_Dual_Bullet(); cctvDual.position.set(wallX - (0.3 * dir), this.config.platformHeight + 3.5, zPos - 1); cctvDual.rotation.y = (dir === 1) ? -Math.PI / 2 : Math.PI / 2; group.add(cctvDual); }
                    if (i % 5 === 0) {
                        const fanGroup = new THREE.Group(); const fan = AssetFactory.buildExtractorFan(); fan.rotation.y = 0; 
                        const clearance = 2.6; const bracket = new THREE.Mesh(new THREE.BoxGeometry(clearance, 0.2, 0.2), assetMats.metal); bracket.position.set(dir * (clearance / 2), 0, 0); 
                        const diag = new THREE.Mesh(new THREE.BoxGeometry(clearance * 1.2, 0.1, 0.1), assetMats.metal); diag.position.set(dir * (clearance / 2), 0.6, 0); diag.rotation.z = dir * Math.PI / 6;
                        fanGroup.add(fan, bracket, diag); fanGroup.position.set(wallX - (clearance * dir), this.config.platformHeight + 6.5, zPos); group.add(fanGroup); EnvironmentGenerator.animatedFans.push(fan);
                    }
                    
                    const lightGeo = new THREE.BoxGeometry(0.5, 0.1, 2.0); const sl = new THREE.Mesh(lightGeo, envMats.stationLight); sl.position.set(midX, this.config.wallHeight - 0.1, zPos); group.add(sl);
                    if (i % 2 === 0) { const pLight = new THREE.PointLight(0xffeedd, 1.0, 30); pLight.position.set(midX, this.config.wallHeight - 1.0, zPos); group.add(pLight); }
                }
            }
        }

        let camera, scene, renderer, controls;

        function init() {
            scene = new THREE.Scene();
            scene.fog = new THREE.FogExp2(0x050505, 0.015);

            camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 200);
            camera.position.set(0, 10, 60);

            renderer = new THREE.WebGLRenderer({ antialias: true });
            renderer.setSize(window.innerWidth, window.innerHeight);
            renderer.shadowMap.enabled = true;
            renderer.shadowMap.type = THREE.PCFSoftShadowMap;
            document.body.appendChild(renderer.domElement);

            controls = new OrbitControls(camera, renderer.domElement);
            controls.target.set(0, 2, 0);
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
            const station = EnvironmentGenerator.createStation(160);
            scene.add(station);

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
    