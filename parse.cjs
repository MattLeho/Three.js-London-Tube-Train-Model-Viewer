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

console.log("Radial Mat len:", radial.indexOf("class AssetFactory"));
console.log("Platform Mat len:", platform.indexOf("class AssetFactory"));

fs.writeFileSync('extracted_radial.js', radial);
fs.writeFileSync('extracted_platform.js', platform);
