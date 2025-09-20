// FORGED: src/applications/protein_solver/streamer.js

/**
 * @file src/applications/protein_solver/streamer.js
 * @description Servidor de streaming para el UNIVERSO DE PLEGAMIENTO DE PROTEÍNAS.
 *              Este es el ensamblador para la PRUEBA DE UNIVERSALIDAD.
 *              Utiliza el MISMO KERNEL (`MetaUniverse`) que el solver TSP, pero lo aplica
 *              a una nueva física (`ProteinEnvironment`) y a un nuevo set de acciones atómicas
 *              (`protein_library`), demostrando la agnosticismia del motor ontológico.
 */

import WebSocket, { WebSocketServer } from 'ws';
import path from 'path';

// --- Dependencias del Kernel y la Nueva Física ---
import { MetaUniverse } from '../../kernel/meta_universe.js';
import { ProteinEnvironment } from '../../physics/protein_environment.js';
import { StrategyCOC } from '../../agents/strategy_coc.js';
import * as ProteinStrategyLibrary from '../../strategies/protein_library.js';

// --- Configuración del Universo Proteico ---
const PORT = 8080;
// Secuencia de benchmark canónica de 20 aminoácidos.
const PROTEIN_SEQUENCE = "HPHPPHHPHPPHPHHPPHPH";
const TICK_INTERVAL_MS = 50; // Aumentamos la velocidad para una visualización más fluida

const wss = new WebSocketServer({ port: PORT });
console.log(`[PROTEIN_STREAMER] 🧬 Observatorio de Plegamiento Molecular activo en ws://localhost:${PORT}`);

async function main() {
    // 1. FORJAR LAS LEYES FÍSICAS: Instanciar el entorno con la secuencia proteica.
    console.log(`[PROTEIN_STREAMER] Forjando leyes físicas para la secuencia: ${PROTEIN_SEQUENCE}`);
    const proteinEnv = new ProteinEnvironment(PROTEIN_SEQUENCE);

    // 2. CREAR LAS SEMILLAS DE LA VIDA (ESTRATEGIAS INICIALES):
    const seedPopulation = [
        new StrategyCOC("rotate_cw", ProteinStrategyLibrary.rotate_bond_clockwise, { origin: "seed" }),
        new StrategyCOC("rotate_ccw", ProteinStrategyLibrary.rotate_bond_counter_clockwise, { origin: "seed" }),
        new StrategyCOC("hydro_collapse", ProteinStrategyLibrary.hydrophobic_collapse, { origin: "seed" }),
    ];
    console.log(`[PROTEIN_STREAMER] Inyectando ${seedPopulation.length} estrategias atómicas primordiales.`);

    // 3. INSTANCIAR EL META-UNIVERSO: con física + genoma correctamente inyectados
    const metaUniverse = new MetaUniverse(
        {
            evolutionInterval: 25,
            maxPopulation: 50,
            initialTemperature: 5.0,
            coolingRate: 0.998,
            mutationRate: 0.4
        },
        proteinEnv,
        seedPopulation,
        ProteinStrategyLibrary // ✅ Inyección explícita del genoma
    );

    console.log('[PROTEIN_STREAMER] Meta-Universo instanciado. La computación emergente del plegamiento está lista.');
    console.log('[PROTEIN_STREAMER] Esperando observadores...');

    // 4. Servidor WebSocket para observadores visuales
    wss.on('connection', (ws) => {
        console.log('[PROTEIN_STREAMER] ✨ Observador conectado. Iniciando stream de conformación molecular...');

        // Enviar metadatos iniciales
        ws.send(JSON.stringify({
            type: 'init',
            sequence: proteinEnv.sequence,
        }));

        // Iniciar el bucle de simulación
        const simulationLoop = setInterval(() => {
            if (ws.readyState !== WebSocket.OPEN) {
                clearInterval(simulationLoop);
                return;
            }

            // Ejecutar un tick del universo
            const log = metaUniverse.tick();

            // Log en consola (en la terminal del servidor)
            const bestEnergyStr = metaUniverse.bestDistance === Infinity
                ? "N/A"
                : metaUniverse.bestDistance.toFixed(2);
            const activeStrategy = log.strategy?.split(']')[0]?.substring(1) || "N/A";

            process.stdout.write(
                `[PROTEIN_STREAMER] 🌀 Tick: ${metaUniverse.tickCount} | ` +
                `Pop: ${metaUniverse.population.length} | ` +
                `Strategy: ${activeStrategy} | ` +
                `Best Energy: ${bestEnergyStr}\r`
            );

            // Enviar estado al cliente visualizador
            const state = {
                type: 'universe_state',
                tick: metaUniverse.tickCount,
                chain: proteinEnv.chain,
                best_energy: metaUniverse.bestDistance === Infinity ? null : metaUniverse.bestDistance,
                edges: Array.from({ length: proteinEnv.numAminoAcids - 1 }, (_, i) => [i, i + 1]),
                top_strategy: log.strategy,
                population_size: metaUniverse.population.length
            };

            ws.send(JSON.stringify(state));
        }, TICK_INTERVAL_MS);

        // Cleanup al desconectar
        ws.on('close', () => {
            console.log('\n[PROTEIN_STREAMER] Observador desconectado. Pausando cómputo.');
            clearInterval(simulationLoop);
        });
    });
}

// Entrypoint
main().catch(err => {
    console.error("❌ Error fatal durante la génesis del universo proteico:", err);
    process.exit(1);
});
