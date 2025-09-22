// FORGED: src/applications/protein_solver/streamer.js

import WebSocket, { WebSocketServer } from 'ws';
import { promises as fs } from 'fs';

import { MetaUniverse } from '../../kernel/meta_universe.js';
import { ProteinEnvironment } from '../../physics/protein_environment.js';
import { StrategyCOC } from '../../agents/strategy_coc.js';
import * as ProteinStrategyLibrary from '../../strategies/protein_library.js';

// --- Configuración General ---
const PORT = 8080;
const PROTEIN_SEQUENCE = "HPHPPHHPHPPHPHHPPHPH";

const wss = new WebSocketServer({ port: PORT });
console.log(`[PROTEIN_STREAMER] 🧬 Observatorio Ontológico activo en ws://localhost:${PORT}`);

// --- Genoma completo disponible ---
const FULL_GENOME = {
    rotate_cw: ProteinStrategyLibrary.rotate_bond_clockwise,
    rotate_ccw: ProteinStrategyLibrary.rotate_bond_counter_clockwise,
    hydro_collapse: ProteinStrategyLibrary.hydrophobic_collapse,
    pull_move: ProteinStrategyLibrary.pullMove
};

// --- Estado del genoma activo ---
let activeStrategies = {
    rotate_cw: true,
    rotate_ccw: true,
    hydro_collapse: true,
    pull_move: true,
};

// --- Configuración de simulación ---
let tickInterval = 50;
let isPaused = false;
let simulationLoop = null;
let metaUniverse = null;

// --- Fábrica de Universos basada en genoma activo ---
function createUniverse() {
    console.log(`[PROTEIN_STREAMER] Forjando leyes físicas para la secuencia: ${PROTEIN_SEQUENCE}`);
    const env = new ProteinEnvironment(PROTEIN_SEQUENCE);

    const activeGenomeArray = Object.entries(FULL_GENOME).filter(([name]) => activeStrategies[name]);
    const activeGenomeObject = Object.fromEntries(activeGenomeArray);

    const seedPopulation = activeGenomeArray.map(([name, fn]) =>
        new StrategyCOC(name, fn, { origin: "seed" })
    );

    console.log(`[PROTEIN_STREAMER] Inyectando ${seedPopulation.length} estrategias atómicas activas.`);

    return new MetaUniverse(
        {
            evolutionInterval: 25,
            maxPopulation: 50,
            initialTemperature: 5.0,
            coolingRate: 0.998,
            mutationRate: 0.4
        },
        env,
        seedPopulation,
        activeGenomeObject
    );
}

// --- Bucle de simulación ---
function runSimulation() {
    if (simulationLoop) clearInterval(simulationLoop);

    simulationLoop = setInterval(() => {
        if (isPaused || wss.clients.size === 0) return;

        const log = metaUniverse.tick();

        const state = {
            type: 'universe_state',
            tick: metaUniverse.tickCount,
            chain: metaUniverse.environment.chain,
            best_energy: metaUniverse.bestDistance === Infinity ? null : metaUniverse.bestDistance,
            log: log.logMessage || null,
        };

        const msg = JSON.stringify(state);
        for (const client of wss.clients) {
            if (client.readyState === WebSocket.OPEN) {
                client.send(msg);
            }
        }
    }, tickInterval);
}

// --- Main ---
async function main() {
    metaUniverse = createUniverse();

    wss.on('connection', (ws) => {
        console.log('[PROTEIN_STREAMER] ✨ Observador conectado.');
        isPaused = false;

        ws.send(JSON.stringify({
            type: 'init',
            sequence: metaUniverse.environment.sequence,
            genome_status: activeStrategies
        }));

        runSimulation();

        ws.on('message', async (rawMessage) => {
            try {
                const message = JSON.parse(rawMessage);

                if (message.type === 'control') {
                    switch (message.command) {
                        case 'pause':
                            isPaused = true;
                            console.log('[CONTROL] ⏸️ Pausa solicitada.');
                            break;
                        case 'resume':
                            isPaused = false;
                            console.log('[CONTROL] ▶️ Reanudación solicitada.');
                            break;
                        case 'tick':
                            if (isPaused) {
                                metaUniverse.tick();
                                console.log('[CONTROL] ➡️ Tick manual ejecutado.');
                            }
                            break;
                        case 'reset':
                            metaUniverse.environment.reset();
                            metaUniverse.bestDistance = Infinity;
                            console.log('[CONTROL] 💥 Reset del entorno.');
                            break;
                        case 'save_snapshot':
                            const snapshotPath = `./data/snapshots/snapshot_${Date.now()}.json`;
                            const snapshotData = {
                                bestChain: metaUniverse.environment.chain,
                                bestEnergy: metaUniverse.bestDistance,
                                population: metaUniverse.population.map(coc => ({
                                    id: coc.id,
                                    coherence: coc.coherence
                                })),
                                tickCount: metaUniverse.tickCount
                            };
                            await fs.mkdir('./data/snapshots', { recursive: true });
                            await fs.writeFile(snapshotPath, JSON.stringify(snapshotData, null, 2));
                            console.log(`[CONTROL] 💾 Snapshot guardado: ${snapshotPath}`);
                            ws.send(JSON.stringify({ type: 'event', message: `✅ Snapshot guardado.` }));
                            break;
                        case 'toggle_strategy':
                            if (message.key in activeStrategies) {
                                activeStrategies[message.key] = !activeStrategies[message.key];
                                console.log(`[CONTROL] Estrategia '${message.key}' ahora está ${activeStrategies[message.key] ? 'ACTIVA' : 'INACTIVA'}.`);
                                metaUniverse = createUniverse();
                                ws.send(JSON.stringify({ type: 'event', message: `🧬 Genoma actualizado. Universo reseteado.` }));
                            }
                            break;
                    }
                } else if (message.type === 'parameter') {
                    if (message.key in metaUniverse.config) {
                        metaUniverse.config[message.key] = message.value;
                        console.log(`[CONTROL] 🔧 Parámetro '${message.key}' actualizado a ${message.value}`);
                    } else if (message.key === 'tickInterval') {
                        tickInterval = message.value;
                        runSimulation(); // reiniciar con nuevo intervalo
                        console.log(`[CONTROL] 🔄 Intervalo de tick actualizado: ${tickInterval}ms`);
                    }
                }

            } catch (err) {
                console.error('[ERROR] Fallo al procesar mensaje del cliente:', err);
            }
        });

        ws.on('close', () => {
            console.log('[PROTEIN_STREAMER] 🔌 Observador desconectado.');
            if (wss.clients.size === 0) {
                console.log('[PROTEIN_STREAMER] 💤 Sin observadores. Pausando simulación.');
                isPaused = true;
            }
        });
    });
}

main().catch(err => {
    console.error("❌ Error fatal durante la génesis del universo:", err);
    process.exit(1);
});
