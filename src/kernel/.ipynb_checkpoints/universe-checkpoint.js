/**
 * @file src/kernel/universe.js
 * @description El contenedor computacional y motor de la Infogénesis.
 *              Implementa el Operador de Coherencia Ontológica (Ω) para
 *              evolucionar el estado de una red de COCs según la EDE canónica.
 */

import CoherentOntologicalCubit from './core/coc.js';
import { Vector3 } from '../utils/linear_algebra.js';

class Universe {
    /**
     * @param {object} [params={}] - Parámetros de la física del universo.
     * @param {number} [params.zeta=1.0] - Zoom Computacional (no usado en este tick, pero reservado).
     * @param {number} [params.sigma=0.01] - Magnitud del MBI (ruido estocástico).
     * @param {number} [params.dt=0.1] - Paso de tiempo para la integración de la EDE.
     */
    constructor({ zeta = 1.0, sigma = 0.01, dt = 0.1 } = {}) {
        this.cocs = new Map(); // Almacena todos los COCs (X_t), indexados por ID
        this.zeta = zeta;
        this.sigma = sigma;
        this.dt = dt;
        this.tickCount = 0;
    }

    /**
     * Añade un COC al universo.
     * @param {CoherentOntologicalCubit} coc
     */
    addCOC(coc) {
        if (!(coc instanceof CoherentOntologicalCubit)) {
            throw new TypeError('Solo se pueden añadir instancias de CoherentOntologicalCubit.');
        }
        this.cocs.set(coc.id, coc);
    }

    /**
     * Implementación del Operador de Coherencia Ontológica (Ω).
     * Computa un único paso de evolución del estado del Universo (X_t -> X_{t+1}).
     */
    tick() {
        const nextStates = new Map();

        // FASE DE CÓMPUTO: Calcular todos los estados futuros sin modificar el presente.
        for (const [id, coc] of this.cocs.entries()) {
            // 1. Fuerza de Sincronización (Σ w_ij * x_j)
            let syncForce = new Vector3(0, 0, 0);
            for (const [neighborId, weight] of coc.connections.entries()) {
                const neighbor = this.cocs.get(neighborId);
                if (neighbor) {
                    syncForce.add(new Vector3(...neighbor.state).multiplyScalar(weight));
                }
            }

            // 2. Ruido Browniano (σ * dW_t)
            const mbiTerm = Vector3.random().multiplyScalar(this.sigma);

            // 3. Fuerza Total
            const totalForce = syncForce.add(mbiTerm);

            // 4. Proyección Tangente: F_tangent = F - x * dot(x, F)
            const currentStateVec = new Vector3(...coc.state);
            const tangentForce = totalForce.subtract(
                currentStateVec.clone().multiplyScalar(totalForce.dot(currentStateVec))
            );

            // 5. Integración de Euler: dx = F_tangent * dt
            const deltaState = tangentForce.multiplyScalar(this.dt);
            const nextState = currentStateVec.clone().add(deltaState).normalize();

            nextStates.set(id, nextState.toArray());
        }

        // FASE DE MANIFESTACIÓN: Aplicar todos los cambios de forma síncrona.
        for (const [id, newState] of nextStates.entries()) {
            const coc = this.cocs.get(id);
            coc.updateState(newState);
            coc.snapshotSignature();
        }

        this.tickCount++;
    }

    /**
     * Devuelve una representación serializable del estado del universo.
     */
    getState() {
        const state = {};
        for (const [id, coc] of this.cocs.entries()) {
            state[id] = coc.toJSON();
        }
        return state;
    }
}

export default Universe;