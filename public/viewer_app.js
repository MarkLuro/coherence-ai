/**
 * @file public/viewer_app.js
 * @version v2.1
 * @description Frontend para el Observatorio Ontológico 3D.
 *              Corrección semántica: compatibilidad con payload de ciudades {x, y}.
 */

import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

// --- Estado Global ---
let scene, camera, renderer, controls;
let cityMeshes = [];
let tourLines = null;
let explorationLines = null;
let areCitiesDrawn = false;
const infoDiv = document.getElementById('info');

// --- Inicialización de Escena ---
function init() {
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0a0a0a);
    scene.fog = new THREE.Fog(0x0a0a0a, 150, 300);

    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.set(0, 80, 130);

    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild(renderer.domElement);

    controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;

    scene.add(new THREE.AmbientLight(0xdddddd));
    const dirLight = new THREE.DirectionalLight(0xffffff, 0.5);
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

// --- Dibuja ciudades una vez ---
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

// --- Actualiza líneas dinámicas ---
function updateDynamicElements(state) {
    const tick = state.tick || 0;
    const distance = state.best_distance;
    const distanceText = (distance !== null && isFinite(distance)) ? distance.toFixed(2) : "Calculando...";
    infoDiv.textContent = `⏱️ Tick: ${tick} | 🧭 Mejor Distancia: ${distanceText}`;

    if (!areCitiesDrawn) return;

    // --- Exploración (aristas blancas) ---
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

    // --- Tour (ruta naranja) ---
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

// --- WebSocket ---
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
            if (data.type === 'init' && data.cities) {
                drawCities(data.cities);
            } else if (data.type === 'universe_state') {
                updateDynamicElements(data);
            }
        } catch (error) {
            console.error("❌ Error al procesar mensaje:", error, "Payload:", event.data);
        }
    };
}

// --- Entry Point ---
init();
connectToUniverse();
