/**
 * @file src/applications/meta_solver/streamer.js
 * @description Servidor de streaming para el META-UNIVERSO.
 *              Ejecuta la evolución de estrategias y transmite el estado del
 *              entorno TSP resultante al visualizador en tiempo real.
 */

import WebSocket, { WebSocketServer } from 'ws';
import path from 'path';
import { MetaUniverse } from '../../kernel/meta_universe.js';
import { TSPEnvironment } from '../../physics/tsp_environment.js';
import { StrategyCOC } from '../../agents/strategy_coc.js';
import * as StrategyLibrary from '../../strategies/library.js';
import { loadTsplibProblem } from '../../utils/data_parser.js';

const PORT = 8080;
const PROBLEM_FILE = path.join(process.cwd(), 'data', 'problems', 'tsp', 'berlin52.tsp');

const wss = new WebSocketServer({ port: PORT });
console.log(`[META_STREAMER] Observatorio Evolutivo activo en ws://localhost:${PORT}`);

async function main() {
    // 1. Crear el entorno físico
    const cities = await loadTsplibProblem(PROBLEM_FILE);
    const tspEnv = new TSPEnvironment(cities);

    // 2. Crear la población inicial de estrategias
    const seedPopulation = [
        new StrategyCOC("connectNearest", StrategyLibrary.connectNearest),
        new StrategyCOC("breakLongestEdge", StrategyLibrary.breakLongestEdge),
        // --- INICIO DE LA CORRECCIÓN DE INTELIGENCIA ---
        new StrategyCOC("twoOptSwap", StrategyLibrary.twoOptSwap, { origin: "seed", generation: 0 }),
        // --- FIN DE LA CORRECCIÓN DE INTELIGENCIA ---
    ];

    // 3. Instanciar el Meta-Universo
    const metaUniverse = new MetaUniverse(
        {
            evolutionInterval: 20,
            maxPopulation: 100
        },
        tspEnv,
        seedPopulation
    );

    // 4. Registrar las semillas originales para reinyección genética
    metaUniverse.originalSeeds = seedPopulation;

    console.log('[META_STREAMER] Meta-Universo instanciado. Esperando observadores...');

    wss.on('connection', (ws) => {
        console.log('[META_STREAMER] Observador conectado. Iniciando stream evolutivo...');

        // Enviar ciudades al cliente al inicio
        ws.send(JSON.stringify({ type: 'init', cities: tspEnv.cities }));

        const simulationLoop = setInterval(() => {
            if (ws.readyState !== WebSocket.OPEN) {
                clearInterval(simulationLoop);
                return;
            }

            // 5. Ejecutar un tick de evolución
            const log = metaUniverse.tick();

            // Instrumentación en consola
            const bestDistStr =
                metaUniverse.bestDistance === Infinity
                    ? "N/A"
                    : metaUniverse.bestDistance.toFixed(2);

            const activeStrategy = log.strategy?.split(']')[0]?.substring(1) || "N/A";

            process.stdout.write(
                `[META_STREAMER] 🌀 Tick: ${metaUniverse.tickCount} | ` +
                `Strategy: ${activeStrategy} | ` +
                `Pop: ${metaUniverse.population.length} | ` +
                `Best Dist: ${bestDistStr}\r`
            );

            // 6. Transmitir el estado actual
            const state = {
                type: 'universe_state',
                tick: metaUniverse.tickCount,
                tour: metaUniverse.bestTour,
                best_distance: metaUniverse.bestDistance === Infinity ? null : metaUniverse.bestDistance,
                edges: tspEnv.extractEdges(),
                top_strategy: log.strategy,
                population_size: metaUniverse.population.length
            };

            ws.send(JSON.stringify(state));
        }, 100); // Cada 100ms

        ws.on('close', () => {
            console.log('[META_STREAMER] Observador desconectado.');
            clearInterval(simulationLoop);
        });
    });
}

main().catch(err => {
    console.error("Error fatal:", err);
    process.exit(1);
});
