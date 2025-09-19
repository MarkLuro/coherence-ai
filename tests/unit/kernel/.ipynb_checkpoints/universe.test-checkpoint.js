/**
 * @file tests/unit/kernel/universe.test.js
 * @description Protocolo de Verificación para el COC 'Universe'. Asegura la coherencia
 *              entre el kernel ontológico y su manifestación dinámica.
 */

const assert = require('assert');
const Universe = require('../../../src/kernel/universe.js');
const CoherentOntologicalCubit = require('../../../src/kernel/core/coc.js');

describe('Kernel Component: Universe (Ω Operator)', () => {

    it('should instantiate a Universe with correct parameters', () => {
        const universe = new Universe({ zeta: 0.9, sigma: 0.0, dt: 0.1 });
        assert.strictEqual(universe.zeta, 0.9);
        assert.strictEqual(universe.sigma, 0.0);
        assert.strictEqual(universe.dt, 0.1);
    });

    it('should allow adding a COC and retrieving it', () => {
        const universe = new Universe({});
        const coc = new CoherentOntologicalCubit({ id: 'coc-alpha' });
        universe.addCOC(coc);
        const retrieved = universe.cocs.get('coc-alpha');
        assert.ok(retrieved);
        assert.strictEqual(retrieved.id, 'coc-alpha');
    });

    it('should execute a tick (Ω operator) and update states', () => {
        const universe = new Universe({ zeta: 1.0, sigma: 0.0, dt: 0.1 }); // Determinismo total
        const coc1 = new CoherentOntologicalCubit({ id: 'coc-1' });
        const coc2 = new CoherentOntologicalCubit({ id: 'coc-2' });

        universe.addCOC(coc1);
        universe.addCOC(coc2);
        coc1.connectTo('coc-2', 1.0); // Máxima tensión
        coc2.connectTo('coc-1', 1.0);

        const initialState = coc1.getState();
        universe.tick(); // Tick 1
        const newState = coc1.getState();

        assert.notDeepStrictEqual(newState.vector, initialState.vector, 'El COC debe haber evolucionado');
        
        // Verificar permanencia en S² (magnitud ≈ 1.0)
        const magnitude = Math.sqrt(newState.vector.reduce((sum, x) => sum + x * x, 0));
        assert.ok(Math.abs(1.0 - magnitude) < 1e-9, 'El COC debe permanecer en la Esfera de Coherencia (S²)');
    });

    it('should return a serializable state of the Universe', () => {
        const universe = new Universe({});
        const coc = new CoherentOntologicalCubit({ id: 'coc-X' });
        universe.addCOC(coc);
        const state = universe.getState();
        assert.ok(state.cocs['coc-X'], 'Estado serializado debe contener el COC');
    });

});
