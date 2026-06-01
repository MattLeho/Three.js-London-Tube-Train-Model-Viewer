const fs = require('fs');

const extractScripts = (filename) => {
    try {
        const content = fs.readFileSync(filename, 'utf8');
        const scriptMatch = content.match(/<script type="module">([\s\S]*?)<\/script>/);
        if (scriptMatch) return scriptMatch[1];
        return '';
    } catch(e) {
        return '';
    }
};

const radial = extractScripts('radialtunnel.html');
const platform = extractScripts('Platforms.html') || extractScripts('platforms.html');
const linear = extractScripts('lineartunnel.html');

const extractClassMethods = (code, className) => {
    const classStart = code.indexOf(`class ${className}`);
    if (classStart === -1) return '';
    const startBracket = code.indexOf('{', classStart);
    let openCount = 1;
    let endBracket = -1;
    for (let i = startBracket + 1; i < code.length; i++) {
        if (code[i] === '{') openCount++;
        else if (code[i] === '}') openCount--;
        
        if (openCount === 0) {
            endBracket = i;
            break;
        }
    }
    const classBody = code.substring(startBracket + 1, endBracket);
    return classBody.trim();
};

const platEG = extractClassMethods(platform, 'EnvironmentGenerator');
const radEG = extractClassMethods(radial, 'EnvironmentGenerator');
const linEG = extractClassMethods(linear, 'EnvironmentGenerator');

const extractMethods = (body) => {
    const methods = [];
    const keywords = ['static createDoubleTrackBed(length, isTunnel = false) {',
      'static createCurvedTunnel(curveRadius = 120) {',
      'static addDetailedInfrastructure(group, length, innerVal, outerVal, dir) {',
      'static createStation(length) {',
      'static createCircularTunnel(length) {'
    ];

    for (const kw of keywords) {
        let startIndex = body.indexOf(kw);
        if (startIndex === -1) continue;
        const openBrace = body.indexOf('{', startIndex);
        let openCount = 1;
        let endIndex = -1;
        for (let i = openBrace + 1; i < body.length; i++) {
            if (body[i] === '{') openCount++;
            else if (body[i] === '}') openCount--;
            if (openCount === 0) {
                endIndex = i;
                break;
            }
        }
        methods.push(body.substring(startIndex, endIndex + 1));
    }
    return methods;
};

const EGMethods = new Set();
extractMethods(platEG).forEach(m => EGMethods.add(m));
extractMethods(radEG).forEach(m => EGMethods.add(m));
extractMethods(linEG).forEach(m => EGMethods.add(m));

let outputEG = `
import * as THREE from 'three';
import { AssetFactory, assetMats, envMats, texGravel, texBrick, texMindTheGap } from './AssetFactory';

export class EnvironmentGenerator {
    static config = {
        gauge: 1.435,
        trackOffset: 3.0,
        tunnelRadius: 8.0,
        platformWidth: 7.0,
        platformHeight: 1.1,
        wallHeight: 4.5,
        zOffset: 0
    };
    static animatedFans = [];

    static reset() {
        this.config.zOffset = 0;
        this.animatedFans = [];
    }

    static update() {
        this.animatedFans.forEach(fan => {
            if (fan.userData.isFan && fan.userData.rotor) fan.userData.rotor.rotation.z -= 0.12; 
        });
    }

    ${Array.from(EGMethods).join('\n\n    ')}
}
`;

fs.writeFileSync('src/EnvironmentGenerator.ts', outputEG);
