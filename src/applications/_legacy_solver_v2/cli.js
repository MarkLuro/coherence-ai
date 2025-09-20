/**
 * @file src/applications/ontological_solver/cli.js
 * @description Punto de entrada y orquestador para el Solucionador Ontológico.
 *              Este script ensambla un universo de problemas, sus agentes de IA
 *              y ejecuta el bucle de simulación para encontrar una solución.
 *              Canon v2.2 - Implementación para ES Modules.
 */

import TSP_Universe from './problems/tsp_universe.js';
import { GeneratorAI, DissolverAI } from './agents.js';
import { loadTsplibProblem } from '../../utils/data_parser.js'; // Asumiendo que crearemos este parser
import { plotSolution } from '../../utils/visualizer.js'; // Asumiendo que crearemos este visualizador

// --- Parámetros de la Simulación ---
const SIMULATION_CONFIG = {
    problemFile: './data/problems/tsp/berlin52.tsp',
    maxTicks: 20000,
    generatorProbability: 0.55, // Probabilidad de que el generador actúe en un tick
};

/**
 * Función principal que orquesta la ejecución del solver.
 */
async function main() {
    console.log('[ONTOLOGICAL_SOLVER] Iniciando...');

    try {
        // --- FASE 1: GÉNESIS E INSTANCIACIÓN ---
        console.log(`[SOLVER] Cargando problema: ${SIMULATION_CONFIG.problemFile}`);
        const cities = await loadTsplibProblem(SIMULATION_CONFIG.problemFile);

        console.log(`[SOLVER] Instanciando Universo TSP con ${cities.length} ciudades...`);
        const universe = new TSP_Universe(cities);

        const generator = new GeneratorAI(universe);
        const dissolver = new DissolverAI(universe);
        console.log('[SOLVER] Agentes de IA (Generator y Dissolver) instanciados.');

        // --- FASE 2: EVOLUCIÓN (LA GUERRA DE LA PREDICCIÓN) ---
        console.log(`[SOLVER] Iniciando bucle de evolución de ${SIMULATION_CONFIG.maxTicks} ticks...`);
        const startTime = Date.now();

        for (let tick = 0; tick < SIMULATION_CONFIG.maxTicks; tick++) {
            // Decidir qué agente actúa en este tick, creando la danza entre orden y caos.
            if (Math.random() < SIMULATION_CONFIG.generatorProbability) {
                generator.act();
            } else {
                dissolver.act();
            }
            universe.tick(); // Actualiza la mejor solución encontrada

            if ((tick + 1) % 1000 === 0) {
                console.log(`  [Tick ${tick + 1}] Mejor distancia actual: ${universe.best_distance.toFixed(2)}`);
            }
        }
        
        const endTime = Date.now();
        console.log('[SOLVER] Bucle de evolución completado.');

        // --- FASE 3: OBSERVACIÓN FINAL ---
        console.log('\n--- RESULTADO FINAL ---');
        console.log(`Mejor distancia encontrada: ${universe.best_distance.toFixed(2)}`);
        console.log(`Tiempo de cómputo: ${(endTime - startTime) / 1000} segundos.`);
        
        const outputPath = './visualizations/tsp_solution.png';
        await plotSolution(universe.cities, universe.best_tour, universe.best_distance, outputPath);
        console.log(`Visualización de la mejor ruta guardada en: ${outputPath}`);
        console.log('--------------------');


    } catch (error) {
        console.error('[SOLVER] Ha ocurrido un error fatal:', error);
        process.exit(1);
    }
}

// Iniciar la ejecución
main();