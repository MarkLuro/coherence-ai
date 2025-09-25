/**
 * @file src/public/viewer_app.js
 * @version v3.2 - Interfaz de Cómputo Ontológico
 * @description Frontend para el Observatorio Ontológico 3D.
 *              Soporta edición de genoma, reseteo de parámetros y control en tiempo real.
 */

import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import GUI from 'lil-gui';
import 'chart.js/auto';

// --- Estado Global ---
let scene, camera, renderer, controls, ws;
let gui;
let universeType = null;
let isPaused = false;
let energyChart;
let activeStrategies = {};

const toolState = {
    currentTool: 'ADD', // Opciones: 'ADD', 'REMOVE', 'MOVE'
};

const infoDiv = document.getElementById('info');
const logDiv = document.getElementById('event-log');

// --- Parámetros por defecto y actuales ---
const defaultUniverseParams = {
    simulationSpeed: 20,
    mutationRate: 0.4,
    crossoverRate: 0.7,
    explorationRate: 0.05,
    coolingRate: 0.998
};
const universeParams = { ...defaultUniverseParams };

// --- Datos para gráfico ---
const chartData = {
    labels: [],
    datasets: [{
        label: 'Mejor Energía',
        data: [],
        borderColor: '#ff9900',
        backgroundColor: 'rgba(255, 153, 0, 0.2)',
        borderWidth: 1,
        tension: 0.4,
        fill: true,
    }]
};

// --- Estado TSP ---
let cityMeshes = [], tourLines = null, explorationLines = null, areCitiesDrawn = false;

// --- Estado Proteico ---
let aminoAcidMeshes = [], backboneLine = null, hMaterial, pMaterial, isProteinDrawn = false;

// --- API de Control ---
const controlsAPI = {
    togglePause: () => {
        isPaused = !isPaused;
        ws.send(JSON.stringify({ type: 'control', command: isPaused ? 'pause' : 'resume' }));
        logEvent(isPaused ? '⏸️ Simulación pausada.' : '▶️ Simulación reanudada.');
    },
    nextTick: () => {
        if (isPaused) {
            ws.send(JSON.stringify({ type: 'control', command: 'tick' }));
            logEvent('➡️ Ejecutando un solo tick.');
        }
    },
    resetUniverse: () => {
        ws.send(JSON.stringify({ type: 'control', command: 'reset' }));
        logEvent('💥 Big Bang! Universo reseteado.');
    },
    saveSnapshot: () => {
        ws.send(JSON.stringify({ type: 'control', command: 'save_snapshot' }));
        logEvent('💾 Snapshot solicitado.');
    },
    resetParameters: () => {
        Object.assign(universeParams, defaultUniverseParams);
        gui.controllersRecursive().forEach(c => c.updateDisplay());
        ws.send(JSON.stringify({ type: 'parameter', key: 'mutationRate', value: universeParams.mutationRate }));
        ws.send(JSON.stringify({ type: 'parameter', key: 'crossoverRate', value: universeParams.crossoverRate }));
        ws.send(JSON.stringify({ type: 'parameter', key: 'explorationRate', value: universeParams.explorationRate }));
        ws.send(JSON.stringify({ type: 'parameter', key: 'coolingRate', value: universeParams.coolingRate }));
        ws.send(JSON.stringify({ type: 'parameter', key: 'tickInterval', value: 1000 / universeParams.simulationSpeed }));
        logEvent('⚙️ Parámetros de génesis reseteados a sus valores por defecto.');
    }
};

// --- GUI ---
function initGUI(initialGenomeStatus = {}) {
    if (gui) gui.destroy();
    gui = new GUI();
    gui.title("Panel del Demiurgo");

    const flow = gui.addFolder('Flujo Computacional');
    flow.add(universeParams, 'simulationSpeed', 1, 60, 1).name('Velocidad (FPS)').onChange(v =>
        ws.send(JSON.stringify({ type: 'parameter', key: 'tickInterval', value: 1000 / v }))
    );
    flow.add(controlsAPI, 'togglePause').name('Pausa / Reanudar');
    flow.add(controlsAPI, 'nextTick').name('Siguiente Tick');

    const evolution = gui.addFolder('Parámetros de Génesis');
    evolution.add(universeParams, 'mutationRate', 0, 1, 0.01).name('Tasa de Mutación').onChange(v =>
        ws.send(JSON.stringify({ type: 'parameter', key: 'mutationRate', value: v }))
    );
    evolution.add(universeParams, 'crossoverRate', 0, 1, 0.01).name('Tasa de Crossover').onChange(v =>
        ws.send(JSON.stringify({ type: 'parameter', key: 'crossoverRate', value: v }))
    );
    evolution.add(universeParams, 'explorationRate', 0, 1, 0.01).name('Tasa de Exploración').onChange(v =>
        ws.send(JSON.stringify({ type: 'parameter', key: 'explorationRate', value: v }))
    );
    evolution.add(universeParams, 'coolingRate', 0.99, 1.0, 0.0001).name('Tasa de Enfriamiento').onChange(v =>
        ws.send(JSON.stringify({ type: 'parameter', key: 'coolingRate', value: v }))
    );
    evolution.add(controlsAPI, 'resetParameters').name('Resetear a Defecto');

    const memory = gui.addFolder('Memoria y Estado');
    memory.add(controlsAPI, 'resetUniverse').name('Resetear Universo');
    memory.add(controlsAPI, 'saveSnapshot').name('Guardar Snapshot');

    const genomeFolder = gui.addFolder('Editor del Genoma');
    genomeFolder.title("Editor del Genoma (Requiere Reset)");
    for (const strategyName in initialGenomeStatus) {
        genomeFolder.add(initialGenomeStatus, strategyName).name(strategyName)
            .onChange(value => {
                ws.send(JSON.stringify({
                    type: 'control',
                    command: 'toggle_strategy',
                    key: strategyName,
                    value: value
                }));
            });
    }
}

// --- Gráfico ---
function initChart() {
    const ctx = document.getElementById('energy-chart').getContext('2d');
    energyChart = new Chart(ctx, {
        type: 'line',
        data: chartData,
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                x: { ticks: { color: '#888' }, grid: { color: '#333' } },
                y: { ticks: { color: '#888' }, grid: { color: '#333' } }
            },
            plugins: { legend: { labels: { color: '#ccc' } } }
        }
    });
}

// --- Log de Eventos ---
function logEvent(msg) {
    logDiv.innerHTML += `${msg}<br>`;
    logDiv.scrollTop = logDiv.scrollHeight;
}

// --- Inicialización del Escenario ---
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

    scene.add(new THREE.AmbientLight(0xeeeeee, 0.5));
    const dirLight = new THREE.DirectionalLight(0xffffff, 1.0);
    dirLight.position.set(50, 100, 50);
    scene.add(dirLight);

    window.addEventListener('resize', onWindowResize);
    initChart();
    animate();
}

// --- Render Loop ---
function animate() {
    requestAnimationFrame(animate);
    controls.update();
    renderer.render(scene, camera);
}

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

// --- Dibujo de Ciudades ---
function drawCities(cities) {
    if (areCitiesDrawn || !cities) return;
    const geo = new THREE.SphereGeometry(1.5, 24, 24);
    const mat = new THREE.MeshPhongMaterial({ color: 0x0077ff, emissive: 0x112233 });

    cities.forEach(city => {
        const mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(city.x * 0.1 - 80, 0, city.y * 0.1 - 40);
        scene.add(mesh);
        cityMeshes.push(mesh);
    });

    areCitiesDrawn = true;
}

// --- Dibujo Proteico ---
function drawProteinChain(sequence) {
    if (isProteinDrawn || !sequence) return;

    hMaterial = new THREE.MeshPhongMaterial({ color: 0xff4444, emissive: 0x330000 });
    pMaterial = new THREE.MeshPhongMaterial({ color: 0x4444ff, emissive: 0x000033 });
    const geo = new THREE.SphereGeometry(1.0, 24, 24);
    const points = [];

    sequence.split('').forEach((type, i) => {
        const mat = type === 'H' ? hMaterial : pMaterial;
        const mesh = new THREE.Mesh(geo, mat);
        const pos = new THREE.Vector3(i * 3, 0, 0);
        mesh.position.copy(pos);
        scene.add(mesh);
        aminoAcidMeshes.push(mesh);
        points.push(pos);
    });

    const lineGeo = new THREE.BufferGeometry().setFromPoints(points);
    const lineMat = new THREE.LineBasicMaterial({ color: 0xcccccc });
    backboneLine = new THREE.Line(lineGeo, lineMat);
    scene.add(backboneLine);

    const center = (sequence.length - 1) * 3 / 2;
    camera.position.set(center, 40, 60);
    controls.target.set(center, 0, 0);
    isProteinDrawn = true;
}

// --- Actualización Visual Dinámica ---
function updateDynamicElements(state) {
    if (universeType === 'TSP') updateTSPView(state);
    else if (universeType === 'PROTEIN') updateProteinView(state);

    if (state.tick % 10 === 0) {
        chartData.labels.push(state.tick);
        const val = state.best_energy ?? state.best_distance;
        chartData.datasets[0].data.push(val);
        if (chartData.labels.length > 100) {
            chartData.labels.shift();
            chartData.datasets[0].data.shift();
        }
        energyChart.update();
    }

    if (state.log) logEvent(state.log);
}

function updateTSPView(state) {
    const tick = state.tick || 0;
    const dist = state.best_distance;
    infoDiv.textContent = `[TSP] ⏱️ Tick: ${tick} | 🧭 Mejor Distancia: ${dist?.toFixed(2) ?? 'Calculando...'}`;

    if (!areCitiesDrawn) return;

    if (explorationLines) scene.remove(explorationLines);
    if (state.edges?.length) {
        const points = state.edges.flatMap(([a, b]) =>
            cityMeshes[a] && cityMeshes[b]
                ? [cityMeshes[a].position, cityMeshes[b].position]
                : []
        );
        const geo = new THREE.BufferGeometry().setFromPoints(points);
        const mat = new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.05 });
        explorationLines = new THREE.LineSegments(geo, mat);
        scene.add(explorationLines);
    }

    if (tourLines) scene.remove(tourLines);
    if (state.tour?.length) {
        const tourPoints = state.tour.map(i => cityMeshes[i].position.clone());
        tourPoints.push(tourPoints[0]);
        const geo = new THREE.BufferGeometry().setFromPoints(tourPoints);
        const mat = new THREE.LineBasicMaterial({ color: 0xff9900 });
        tourLines = new THREE.Line(geo, mat);
        scene.add(tourLines);
    }
}

function updateProteinView(state) {
    const tick = state.tick || 0;
    const energy = state.best_energy;
    infoDiv.textContent = `[PROTEIN] ⏱️ Tick: ${tick} | ⚡️ Mejor Energía: ${energy?.toFixed(2) ?? 'Calculando...'}`;

    if (!isProteinDrawn || !state.chain) return;

    const factor = 3.0;
    state.chain.forEach((pos, i) => {
        aminoAcidMeshes[i].position.set(pos.x * factor, pos.y * factor, 0);
    });

    if (backboneLine) {
        const points = aminoAcidMeshes.map(m => m.position);
        backboneLine.geometry.setFromPoints(points);
        backboneLine.geometry.computeBoundingSphere();
    }
}

// --- Conexión WebSocket ---
function connectToUniverse() {
    ws = new WebSocket('ws://localhost:8080');

    ws.onopen = () => {
        infoDiv.textContent = "🟢 Conectado al universo. Esperando datos iniciales...";
    };

    ws.onclose = () => {
        infoDiv.textContent = "🔴 Desconectado. Reintentando en 3s...";
        setTimeout(connectToUniverse, 3000);
    };

    ws.onerror = err => {
        console.error("🚨 Error WebSocket:", err);
        ws.close();
    };

    ws.onmessage = event => {
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

                if (data.genome_status) {
                    activeStrategies = data.genome_status;
                    initGUI(activeStrategies);
                } else {
                    initGUI();
                }

            } else if (data.type === 'universe_state') {
                updateDynamicElements(data);
            } else if (data.type === 'event') {
                logEvent(data.message);
            }

        } catch (e) {
            console.error("❌ Error procesando mensaje:", e, event.data);
        }
    };
}

// --- Iniciar App ---
init();
connectToUniverse();
