/**
 * @file tests/integration/kernel_simulation.test.js
 * @description Test de integración para el kernel. Verifica que un universo genérico
 *              pueda ser instanciado, poblado y evolucionado.
 *              Basado en el script de prueba original 'cli.js'.
 */

import Universe from '../../src/kernel/universe.js';
import CoherentOntologicalCubit from '../../src/kernel/core/coc.js';
import { jest } from '@jest/globals'; // Necesario para usar mocks de Jest con ES Modules

// Mock console.log para mantener la salida del test limpia.
jest.spyOn(console, 'log').mockImplementation(() => {});

describe('Kernel Integration: Generic Universe Simulation', () => {
    
    it('should successfully run a short, generic simulation without errors', () => {
        // --- PARÁMETROS DE LA SIMULACIÓN ---
        const NUM_COCS = 1;
        const NUM_TICKS = 5;

        // --- CUERPO DEL TEST ---
        
        // 1. GÉNESIS
        const universe = new Universe({ sigma: 0.05, dt: 0.1 });
        expect(universe).toBeInstanceOf(Universe);

        // 2. CUANTIZACIÓN INICIAL
        for (let i = 0; i < NUM_COCS; i++) {
            universe.addCOC(new CoherentOntologicalCubit({ id: `coc-${i}` }));
        }
        expect(universe.cocs.size).toBe(NUM_COCS);

        // Crear una red de conexiones simple
        const allIds = Array.from(universe.cocs.keys());
        for (const id1 of allIds) {
            for (const id2 of allIds) {
                if (id1 !== id2) {
                    universe.cocs.get(id1).connectTo(id2, 0.1);
                }
            }
        }

        // 3. EVOLUCIÓN
        const initialState = JSON.stringify(universe.getState());
        for (let t = 0; t < NUM_TICKS; t++) {
            expect(() => universe.tick()).not.toThrow();
        }
        const finalState = JSON.stringify(universe.getState());

        // 4. OBSERVACIÓN FINAL
        expect(finalState).not.toEqual(initialState);
    });
});
