const fs = require('fs');

let content = fs.readFileSync('src/EnvironmentGenerator.ts', 'utf8');

// fix createStation
content = content.replace(
    /group\.position\.z = this\.config\.zOffset - length \/ 2;\s*this\.config\.zOffset -= length;/g,
    ''
);

// fix createCurvedTunnel
content = content.replace(
    /const zStart = this\.config\.zOffset;/g,
    'const zStart = 0;'
);

content = content.replace(
    /this\.config\.zOffset = zStart - curveRadius;/g,
    ''
);

fs.writeFileSync('src/EnvironmentGenerator.ts', content);
