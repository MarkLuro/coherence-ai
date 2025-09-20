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
    const citiesData = await loadTsplibProblem(PROBLEM_FILE);
    const cities = citiesData.map(c => ({ x: c[0], y: c[1] }));
    const tspEnv = new TSPEnvironment(cities);

    // 2. Crear la población inicial de estrategias
    const seedPopulation = [
        new StrategyCOC("connectNearest", StrategyLibrary.connectNearest),
        new StrategyCOC("breakLongestEdge", StrategyLibrary.breakLongestEdge),
    ];

    // 3. Instanciar el Meta-Universo
    const metaUniverse = new MetaUniverse(
        { evolutionInterval: 20, maxPopulation: 50 },
        tspEnv,
        seedPopulation
    );

    console.log('[META_STREAMER] Meta-Universo instanciado. Esperando observadores...');

    wss.on('connection', (ws) => {
        console.log('[META_STREAMER] Observador conectado. Iniciando stream evolutivo...');

        // Enviar datos iniciales (ciudades)
        ws.send(JSON.stringify({ type: 'init', cities: tspEnv.cities }));

        // Bucle de simulación (stream de evolución)
        const simulationLoop = setInterval(() => {
            if (ws.readyState !== WebSocket.OPEN) {
                clearInterval(simulationLoop);
                return;
            }

            // 4. Ejecutar un tick de evolución
            const log = metaUniverse.tick();

            // 5. Transmitir el estado del ENTORNO FÍSICO y meta-datos
            const state = {
                type: 'universe_state',
                tick: metaUniverse.tickCount,

                // --- INICIO DE LA CORRECCIÓN ONTOLÓGICA ---
                // Usamos la memoria persistente del Meta-Universo
                tour: metaUniverse.bestTour,
                best_distance:
                    metaUniverse.bestDistance === Infinity
                        ? null
                        : metaUniverse.bestDistance,
                // --- FIN DE LA CORRECCIÓN ONTOLÓGICA ---

                // Aún mostramos la exploración en tiempo real (caótica)
                edges: tspEnv.extractEdges(),

                // Meta-información sobre la evolución
                top_strategy: log.strategy,
                population_size: metaUniverse.population.length
            };

            ws.send(JSON.stringify(state));
        }, 100); // Lento para observar la evolución

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
