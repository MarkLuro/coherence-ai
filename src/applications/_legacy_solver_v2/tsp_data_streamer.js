/**
 * @file src/applications/ontological_solver/tsp_data_streamer.js
 * @description Servidor de streaming para el Solucionador Ontológico de TSP.
 *              v2.5: Control por parte del cliente + arquitectura robusta por conexión.
 */

import WebSocket, { WebSocketServer } from 'ws';
import path from 'path';
import { TSP_Universe } from './problems/tsp_universe.js';
import { GeneratorAI, DissolverAI } from './agents.js';
import { loadTsplibProblem } from '../../utils/data_parser.js';

// --- Configuración ---
const PORT = 8080;
const TICK_INTERVAL_MS = 50; // 20 FPS (ajustado desde 16ms)
const PROBLEM_FILE = path.join(process.cwd(), 'data', 'problems', 'tsp', 'berlin52.tsp');

// --- Servidor WebSocket ---
const wss = new WebSocketServer({ port: PORT });
console.log(`[STREAMER] 🧠 Observatorio Ontológico activo en ws://localhost:${PORT}`);

// --- Main ---
main().catch(err => {
    console.error("❌ Error fatal al iniciar el streamer:", err);
    process.exit(1);
});

async function main() {
    console.log(`[STREAMER] 📦 Cargando problema desde: ${PROBLEM_FILE}`);
    const cities = await loadTsplibProblem(PROBLEM_FILE);
    const universe = new TSP_Universe(cities);
    const generator = new GeneratorAI(universe);
    const dissolver = new DissolverAI(universe);
    console.log(`[STREAMER] 🌍 Universo con ${cities.length} ciudades listo. Esperando observadores...`);

    // --- Bucle Principal de Simulación ---
    const simulationLoop = setInterval(() => {
        // Danza de los agentes
        if (Math.random() < 0.75) { // Mayor probabilidad de construir
            generator.act();
        } else {
            dissolver.act();
        }

        universe.tick();
        const state = universe.getState();

        // --- LOG DE DEBUGGING EN EL SERVIDOR ---
        const edgeCount = state.edges.length;
        const tourStatus = state.tour ? `Tour Completo de ${state.tour.length} ciudades` : "Sin tour completo";
        process.stdout.write(`[STREAMER] Tick: ${state.tick} | Aristas: ${edgeCount} | Mejor Distancia: ${isFinite(state.best_distance) ? state.best_distance.toFixed(2) : "N/A"} | ${tourStatus}\r`);

        // --- Broadcast del Estado del Universo ---
        if (wss.clients.size > 0) {
            const message = JSON.stringify(state);
            for (const client of wss.clients) {
                if (client.readyState === WebSocket.OPEN) {
                    client.send(message);
                }
            }
        }
    }, TICK_INTERVAL_MS);

    // --- Manejo de Conexiones de Clientes ---
    wss.on('connection', (ws) => {
        console.log('[STREAMER] 🛰️ Nuevo observador conectado.');

        // Paso 1: Enviar mensaje de bienvenida
        ws.send(JSON.stringify({ type: 'welcome', message: 'Conexión establecida. Esperando confirmación del cliente...' }));

        let clientLoop = null;

        ws.on('message', (raw) => {
            try {
                const message = JSON.parse(raw);

                if (message.type === 'ready_for_data') {
                    console.log('[STREAMER] ✅ Cliente listo. Enviando datos iniciales...');

                    // Paso 2: Enviar estado inicial (ciudades)
                    ws.send(JSON.stringify({
                        type: 'init',
                        cities: universe.cities
                    }));

                    // Paso 3: Iniciar bucle de envío de actualizaciones
                    clientLoop = setInterval(() => {
                        if (ws.readyState !== WebSocket.OPEN) {
                            clearInterval(clientLoop);
                            return;
                        }

                        const state = universe.getState();

                        ws.send(JSON.stringify({
                            type: 'update',
                            tick: state.tick,
                            best_distance: isFinite(state.best_distance) ? state.best_distance : null,
                            tour: state.best_tour || [],
                            edges: state.edges
                        }));
                    }, TICK_INTERVAL_MS);
                }

            } catch (err) {
                console.error("[STREAMER] ⚠️ Error procesando mensaje del cliente:", err);
            }
        });

        ws.on('close', () => {
            console.log('[STREAMER] 🔌 Observador desconectado.');
            if (clientLoop) clearInterval(clientLoop);
        });
    });
}

/**
 * Convierte una matriz de adyacencia a lista de aristas.
 * (Ya no se usa directamente si el universo tiene extractEdges())
 * @param {number[][]} matrix
 * @returns {number[][]}
 */
function getEdgesFromAdjacency(matrix) {
    const edges = [];
    for (let i = 0; i < matrix.length; i++) {
        for (let j = i + 1; j < matrix.length; j++) {
            if (matrix[i][j] === 1) {
                edges.push([i, j]);
            }
        }
    }
    return edges;
}
