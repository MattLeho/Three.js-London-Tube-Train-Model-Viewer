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

// Extract classes
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

const platAF = extractClassMethods(platform, 'AssetFactory');
const radAF = extractClassMethods(radial, 'AssetFactory');
const linAF = extractClassMethods(linear, 'AssetFactory');

// Build an AssetFactory combining all static methods, avoiding duplicates
const removeConfigAndReset = (body) => {
    return body.replace(/static config = \{[^}]+\};\s*/g, '')
               .replace(/static animatedFans = \[\];\s*/g, '')
               .replace(/static reset\(\) \{[^\}]+\}\s*/g, '')
               .replace(/static update\(\) \{([\s\S]*?)\}\s*/g, '');
};

const extractMethods = (body) => {
    const functionRegex = /static\s+([a-zA-Z0-9_]+)\s*\([^)]*\)\s*\{/g;
    const methods = [];
    let match;
    while ((match = functionRegex.exec(body)) !== null) {
        const methodName = match[1];
        const startIndex = match.index;
        let openCount = 0;
        let endIndex = -1;
        let started = false;
        for (let i = startIndex; i < body.length; i++) {
            if (body[i] === '{') {
                openCount++;
                started = true;
            } else if (body[i] === '}') {
                openCount--;
            }
            if (started && openCount === 0) {
                endIndex = i;
                break;
            }
        }
        if (endIndex !== -1) {
            methods.push({
                name: methodName,
                code: body.substring(startIndex, endIndex + 1)
            });
        }
    }
    return methods;
};

const allAFMethods = new Map();
extractMethods(platAF).forEach(m => allAFMethods.set(m.name, m.code));
extractMethods(radAF).forEach(m => allAFMethods.set(m.name, m.code));
extractMethods(linAF).forEach(m => allAFMethods.set(m.name, m.code));

const platEG = extractClassMethods(platform, 'EnvironmentGenerator');
const radEG = extractClassMethods(radial, 'EnvironmentGenerator');
const linEG = extractClassMethods(linear, 'EnvironmentGenerator');

const allEGMethods = new Map();
extractMethods(platEG).forEach(m => allEGMethods.set(m.name, m.code));
extractMethods(radEG).forEach(m => allEGMethods.set(m.name, m.code));
extractMethods(linEG).forEach(m => allEGMethods.set(m.name, m.code));

const txStart = platform.indexOf('function createBrickTexture()');
const txEnd = platform.indexOf('const assetMats = {');
const texCode = platform.substring(txStart, txEnd);

const platMatStart = platform.indexOf('const assetMats = {');
const platMatEnd = platform.indexOf('class AssetFactory');
const platMats = platform.substring(platMatStart, platMatEnd);

let outputAF = `
import * as THREE from 'three';

${texCode}

${platMats.replace(/const/g, 'export const').replace(/let/g, 'export let')}

export class AssetFactory {
    ${Array.from(allAFMethods.values()).join('\n\n    ')}
}
`;

fs.writeFileSync('src/AssetFactory.ts', outputAF);

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

    ${Array.from(allEGMethods.values())
        .filter(m => !['reset', 'update'].includes(m.name))
        .map(m => m.code).join('\n\n    ')}
}
`;

fs.writeFileSync('src/EnvironmentGenerator.ts', outputEG);
