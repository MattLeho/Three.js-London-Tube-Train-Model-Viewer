import * as THREE from 'three';
import { GLTFExporter } from 'three/examples/jsm/exporters/GLTFExporter.js';
import { OBJExporter } from 'three/examples/jsm/exporters/OBJExporter.js';

const g = new THREE.Group();
g.add(new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1), new THREE.MeshBasicMaterial()));

try {
    const objExporter = new OBJExporter();
    const result = objExporter.parse(g);
    console.log("OBJ Exporter Success, length:", result.length);
} catch (e) {
    console.error("OBJ Exporter Error:", e);
}

try {
    const gltfExporter = new GLTFExporter();
    gltfExporter.parse(g, (buffer) => {
        console.log("GLTF Exporter callback success");
    }, (err) => {
        console.error("GLTF Exporter callback error:", err);
    }, { binary: true });
} catch (e) {
    console.error("GLTF Exporter Error:", e);
}
