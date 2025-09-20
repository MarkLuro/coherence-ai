/**
 * @file public/viewer_app.js
 * @version v3.0 - Universal Observer
 * @description Frontend para el Observatorio Ontológico 3D.
 *              Visualiza múltiples universos físicos (TSP y Plegamiento de Proteínas)
 *              seleccionando el modo según los datos iniciales.
 */

import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

// --- Estado Global ---
let scene, camera, renderer, controls;
const infoDiv = document.getElementById('info');
let universeType = null; // 'TSP' o 'PROTEIN'

// --- Estado del Universo TSP ---
let cityMeshes = [];
let tourLines = null;
let explorationLines = null;
let areCitiesDrawn = false;

// --- Estado del Universo Proteico ---
let aminoAcidMeshes = [];
let backboneLine = null;
let hMaterial, pMaterial;
let isProteinDrawn = false;

// --- Inicialización Común ---
function init() {
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0a0a0a);
    scene.fog = new THREE.Fog(0x0a0a0a, 150, 400);

    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.set(0, 80, 130);

    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild(renderer.domElement);

    controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;

    scene.add(new THREE.AmbientLight(0xeeeeee, 0.5));
    const dirLight = new THREE.DirectionalLight(0xffffff, 1.0);
    dirLight.position.set(50, 100, 50);
    scene.add(dirLight);

    window.addEventListener('resize', onWindowResize);
    animate();
}

// --- Render Loop ---
function animate() {
    requestAnimationFrame(animate);
    controls.update();
    renderer.render(scene, camera);
}

// --- Resize ---
function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

// --- [TSP] Dibuja ciudades una sola vez ---
function drawCities(cities) {
    if (areCitiesDrawn || !cities) return;

    const cityGeometry = new THREE.SphereGeometry(1.5, 24, 24);
    const cityMaterial = new THREE.MeshPhongMaterial({ color: 0x0077ff, emissive: 0x112233 });

    cities.forEach(city => {
        const mesh = new THREE.Mesh(cityGeometry, cityMaterial);
        mesh.position.set(city.x * 0.1 - 80, 0, city.y * 0.1 - 40);
        scene.add(mesh);
        cityMeshes.push(mesh);
    });

    areCitiesDrawn = true;
}

// --- [PROTEIN] Dibuja cadena de aminoácidos una sola vez ---
function drawProteinChain(sequence) {
    if (isProteinDrawn || !sequence) return;

    hMaterial = new THREE.MeshPhongMaterial({ color: 0xff4444, emissive: 0x330000 });
    pMaterial = new THREE.MeshPhongMaterial({ color: 0x4444ff, emissive: 0x000033 });

    const aminoAcidGeometry = new THREE.SphereGeometry(1.0, 24, 24);
    const initialChainPoints = [];

    sequence.split('').forEach((type, i) => {
        const material = type === 'H' ? hMaterial : pMaterial;
        const mesh = new THREE.Mesh(aminoAcidGeometry, material);
        const position = new THREE.Vector3(i * 3, 0, 0);
        mesh.position.copy(position);
        scene.add(mesh);
        aminoAcidMeshes.push(mesh);
        initialChainPoints.push(position);
    });

    const lineGeometry = new THREE.BufferGeometry().setFromPoints(initialChainPoints);
    const lineMaterial = new THREE.LineBasicMaterial({ color: 0xcccccc, linewidth: 2 });
    backboneLine = new THREE.Line(lineGeometry, lineMaterial);
    scene.add(backboneLine);

    const chainCenter = (sequence.length - 1) * 3 / 2;
    camera.position.set(chainCenter, 40, 60);
    controls.target.set(chainCenter, 0, 0);

    isProteinDrawn = true;
}

// --- Despachador de vista dinámico ---
function updateDynamicElements(state) {
    if (universeType === 'TSP') {
        updateTSPView(state);
    } else if (universeType === 'PROTEIN') {
        updateProteinView(state);
    }
}

// --- [TSP] Actualización dinámica ---
function updateTSPView(state) {
    const tick = state.tick || 0;
    const distance = state.best_distance;
    const distanceText = (distance !== null && isFinite(distance)) ? distance.toFixed(2) : "Calculando...";
    infoDiv.textContent = `[TSP] ⏱️ Tick: ${tick} | 🧭 Mejor Distancia: ${distanceText}`;

    if (!areCitiesDrawn) return;

    if (explorationLines) scene.remove(explorationLines);
    const explorationMaterial = new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.05 });
    const explorationPoints = (state.edges || []).flatMap(([a, b]) => {
        if (cityMeshes[a] && cityMeshes[b]) {
            return [cityMeshes[a].position, cityMeshes[b].position];
        }
        return [];
    });
    if (explorationPoints.length > 0) {
        const explorationGeometry = new THREE.BufferGeometry().setFromPoints(explorationPoints);
        explorationLines = new THREE.LineSegments(explorationGeometry, explorationMaterial);
        scene.add(explorationLines);
    }

    if (tourLines) scene.remove(tourLines);
    if (state.tour && state.tour.length > 0) {
        const tourMaterial = new THREE.LineBasicMaterial({ color: 0xff9900 });
        const tourPoints = state.tour.map(i => cityMeshes[i].position.clone());
        tourPoints.push(tourPoints[0]); // cerrar ciclo
        const tourGeometry = new THREE.BufferGeometry().setFromPoints(tourPoints);
        tourLines = new THREE.Line(tourGeometry, tourMaterial);
        scene.add(tourLines);
    }
}

// --- [PROTEIN] Actualización dinámica ---
function updateProteinView(state) {
    const tick = state.tick || 0;
    const energy = state.best_energy;
    const energyText = (energy !== null && isFinite(energy)) ? energy.toFixed(2) : "Calculando...";
    infoDiv.textContent = `[PROTEIN] ⏱️ Tick: ${tick} | ⚡️ Mejor Energía: ${energyText}`;

    if (!isProteinDrawn || !state.chain) return;

    const scalingFactor = 3.0;

    state.chain.forEach((pos, i) => {
        if (aminoAcidMeshes[i]) {
            aminoAcidMeshes[i].position.set(pos.x * scalingFactor, pos.y * scalingFactor, 0);
        }
    });

    if (backboneLine) {
        const points = aminoAcidMeshes.map(mesh => mesh.position);
        backboneLine.geometry.setFromPoints(points);
        backboneLine.geometry.computeBoundingSphere();
    }
}

// --- Conexión WebSocket + Detección de Universo ---
function connectToUniverse() {
    const ws = new WebSocket('ws://localhost:8080');

    ws.onopen = () => {
        infoDiv.textContent = "🟢 Conectado al universo. Esperando datos iniciales...";
    };

    ws.onclose = () => {
        infoDiv.textContent = "🔴 Desconectado. Reintentando en 3s...";
        setTimeout(connectToUniverse, 3000);
    };

    ws.onerror = (err) => {
        console.error("🚨 Error WebSocket:", err);
        ws.close();
    };

    ws.onmessage = (event) => {
        try {
            const data = JSON.parse(event.data);

            if (data.type === 'init') {
                if (data.cities) {
                    universeType = 'TSP';
                    drawCities(data.cities);
                } else if (data.sequence) {
                    universeType = 'PROTEIN';
                    drawProteinChain(data.sequence);
                }
            } else if (data.type === 'universe_state') {
                updateDynamicElements(data);
            }
        } catch (error) {
            console.error("❌ Error al procesar mensaje:", error, "Payload:", event.data);
        }
    };
}

// --- Punto de Entrada ---
init();
connectToUniverse();
