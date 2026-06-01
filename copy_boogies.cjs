const fs = require('fs');
const content = fs.readFileSync('boogies.html', 'utf8');
const lines = content.split('\n');

const startIndex = lines.findIndex(l => l.includes('import * as THREE'));
const stopIndex = lines.findIndex(l => l.includes('export function buildAssembly'));

let out = lines.slice(startIndex, stopIndex).join('\n');
out = out.replace("const activeKinematics: KinematicPart[] = [];", "");

// Modify the functions to accept activeKinematics
out = out.replace(/export function buildHDWheelset\(isReversed: boolean = false\)/, "export function buildHDWheelset(activeKinematics: any[], isReversed: boolean = false)");
out = out.replace(/buildHDWheelset\(false\)/g, "buildHDWheelset(activeKinematics, false)");
out = out.replace(/buildHDWheelset\(true\)/g, "buildHDWheelset(activeKinematics, true)");

out = out.replace(/export function buildHDBogie\(flipSymmetry: boolean = false\)/, "export function buildHDBogie(activeKinematics: any[], flipSymmetry: boolean = false)");

out = out.replace(/export function buildUndercarriage\(\)/, "export function buildUndercarriage(activeKinematics: any[])");

fs.writeFileSync('src/HD_Bogies.ts', out);
