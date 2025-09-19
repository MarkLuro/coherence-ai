/**
 * @file src/kernel/core/coc.js
 * @description Implementación del Coherent Ontological Cubit (COC), la unidad fundamental del kernel ontológico.
 *              Cada COC representa un nodo computacional autónomo con estado interno, intencionalidad (telos),
 *              y capacidad de evolución en una red de coherencia.
 *              Canon v2.2 - Implementación para ES Modules.
 */

import { randomUUID } from 'crypto';

class CoherentOntologicalCubit {
    /**
     * Crea una nueva instancia del COC.
     * @param {object} [initialState={}] - Estado inicial opcional.
     * @param {string} [initialState.id] - ID único. Se genera automáticamente si no se proporciona.
     * @param {number[]} [initialState.cgpNet] - Vector de intención en S².
     * @param {number} [initialState.coherence] - Índice de coherencia fractal.
     * @param {string} [initialState.telos] - Simetría objetivo.
     */
    constructor({
        id = randomUUID(),
        cgpNet = [0, 0, 1],
        coherence = 0.1,
        telos = 'DEFAULT_SYMMETRY'
    } = {}) {
        this.id = id;
        this.state = this._normalize(cgpNet); // Estado vectorial dinámico en S²
        this.fractalCoherence = coherence;
        this.telos = telos;
        
        this.signature = 0;             // Firma computacional del último tick (simplificada)
        this.memory = [];               // Memoria de firmas previas
        this.operability = 0.0;         // Probabilidad de ser medido/interactuar
        this.connections = new Map();   // Conexiones con otros COCs (id -> peso sináptico)
    }

    /**
     * Normaliza un vector 3D para que viva en la esfera S².
     * @param {number[]} vec - Vector a normalizar.
     * @returns {number[]} - Vector normalizado.
     * @private
     */
    _normalize(vec) {
        const mag = Math.sqrt(vec[0]**2 + vec[1]**2 + vec[2]**2);
        return mag === 0 ? [0, 0, 1] : vec.map(x => x / mag);
    }

    /**
     * Agrega una conexión sináptica con otro COC.
     * @param {string} cocId - ID del COC objetivo.
     * @param {number} weight - Peso de la conexión, representa la inversa de la tensión.
     */
    connectTo(cocId, weight = 1.0) {
        this.connections.set(cocId, weight);
    }

    /**
     * Actualiza el estado vectorial del COC. Usado por el 'tick()' del Universo.
     * @param {number[]} newState - Nuevo vector estado.
     */
    updateState(newState) {
        this.state = this._normalize(newState);
    }

    /**
     * Registra la firma actual en la memoria para análisis de complejidad.
     */
    snapshotSignature() {
        // Simplificación: la firma es la suma de componentes, un proxy de su 'polaridad'.
        this.signature = this.state.reduce((acc, val) => acc + val, 0);
        this.memory.push(this.signature);
        if (this.memory.length > 10) {
            this.memory.shift(); // Mantiene una ventana de memoria temporal.
        }
    }

    /**
     * Devuelve una representación serializable del estado del COC.
     * @returns {object} - Estado simplificado para logging o transmisión.
     */
    toJSON() {
        return {
            id: this.id,
            state: this.state,
            coherence: this.fractalCoherence,
            connections: this.connections.size,
        };
    }
}

export default CoherentOntologicalCubit;