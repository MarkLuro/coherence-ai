/**
 * @file src/applications/ontological_solver/cli.js
 * @description Punto de entrada para interactuar con el Solucionador Ontológico desde
 *              la línea de comandos. Este módulo traduce la intención humana en
 *              acciones computacionales dentro de un Universo simulado.
 */

// Se usan 'import' en lugar de 'require' para alinearse con el package.json ("type": "module")
import Universe from '../../kernel/universe.js';
import CoherentOntologicalCubit from '../../kernel/core/coc.js';

// --- PARÁMETROS DE LA SIMULACIÓN ---
const NUM_COCS = 20;
const NUM_TICKS = 100;

/**
 * Función principal que ejecuta el ciclo de vida del solucionador.
 */
function main() {
    console.log('[CLI] Iniciando Solucionador Ontológico...');

    // 1. GÉNESIS: Se instancia el Universo.
    const universe = new Universe({
        zeta: 0.8,
        sigma: 0.05,
        dt: 0.1
    });
    console.log('[CLI] Universo cuantificado. Parámetros:', {
        zeta: universe.zeta,
        sigma: universe.sigma,
        dt: universe.dt
    });

    // 2. CUANTIZACIÓN INICIAL: Se puebla el Universo con COCs.
    for (let i = 0; i < NUM_COCS; i++) {
        const coc = new CoherentOntologicalCubit({ id: `coc-${i}` });
        universe.addCOC(coc);
    }
    console.log(`[CLI] ${NUM_COCS} COCs manifestados en el Universo.`);

    // Crear una red de conexiones simple (todos contra todos) para generar tensión.
    const allIds = Array.from(universe.cocs.keys());
    for (const id1 of allIds) {
        for (const id2 of allIds) {
            if (id1 !== id2) {
                // El peso representa la inversa de la tensión. Un peso bajo significa alta tensión inicial.
                universe.cocs.get(id1).connectTo(id2, 0.1);
            }
        }
    }
    console.log('[CLI] Red de coherencia primordial establecida.');

    // 3. EVOLUCIÓN: Se ejecuta el bucle principal (Operador Ω).
    console.log(`[CLI] Iniciando bucle de evolución de ${NUM_TICKS} ticks...`);
    for (let t = 0; t < NUM_TICKS; t++) {
        universe.tick();
        
        // Reporte de estado cada 10 ticks para observar el progreso.
        if ((t + 1) % 10 === 0) {
            console.log(`  [Tick ${t + 1}] Universo evolucionando...`);
        }
    }
    console.log('[CLI] Bucle de evolución completado.');

    // 4. OBSERVACIÓN FINAL: Se reporta el estado final del sistema.
    const finalState = universe.getState();
    console.log('[CLI] Estado final del Universo (primeros 5 COCs):');
    // Imprimir solo una parte del estado para no saturar la consola.
    const statePreview = Object.fromEntries(Object.entries(finalState).slice(0, 5));
    console.log(JSON.stringify(statePreview, null, 2));
}

// Ejecutar el programa
main();