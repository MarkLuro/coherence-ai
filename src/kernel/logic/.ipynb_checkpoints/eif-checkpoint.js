// src/kernel/logic/eif.js
// El Epistemic Integrity Framework (EIF). El guardián del ser ontológico.

export const VERDICTS = Object.freeze({
    COHERENT: 'COHERENT',
    REDUNDANT: 'REDUNDANT',
    TENSION: 'TENSION',
    CONTRADICTION: 'CONTRADICTION',
});

class EpistemicIntegrityFramework {
    /**
     * @param {Object} iisManager - Gestor del sistema de información interna (memoria ontológica).
     * Debe implementar un método `get(key)` que devuelva un nodo o undefined.
     */
    constructor(iisManager) {
        if (!iisManager || typeof iisManager.get !== 'function') {
            throw new Error('[EIF] Se requiere una instancia válida de IISManager.');
        }
        this._iisManager = iisManager;
    }

    /**
     * Analiza si un delta informacional puede integrarse sin romper la coherencia.
     * @param {{ key: string, value: any, meta?: object }} delta
     * @returns {{ verdict: string, reason: string, tension?: number }}
     */
    verifyCoherence(delta) {
        const existingNode = this._iisManager.get(delta.key);

        // Caso 1: Información nueva
        if (existingNode === undefined) {
            return {
                verdict: VERDICTS.COHERENT,
                reason: `El nodo '${delta.key}' no existe. El conocimiento es nuevo.`
            };
        }

        // Caso 2: Comparación con valor existente
        const areEqual = this._deepCompare(existingNode.value, delta.value);

        if (areEqual) {
            return {
                verdict: VERDICTS.REDUNDANT,
                reason: `El valor para '${delta.key}' ya existe y es idéntico.`
            };
        }

        // Caso 3: Conflicto detectado. Aplicar juicio de tensión.
        const oldCoherence = existingNode.meta?.coherence ?? 0.5;
        const newCoherence = delta.meta?.coherence ?? 0.7;

        const tension = Math.abs(newCoherence - oldCoherence);

        if (oldCoherence >= 0.9 && newCoherence < oldCoherence) {
            return {
                verdict: VERDICTS.CONTRADICTION,
                reason: `La nueva información contradice un principio con alta coherencia (${oldCoherence}).`,
                tension
            };
        }

        return {
            verdict: VERDICTS.TENSION,
            reason: `Conflicto entre valor antiguo y nuevo. Requiere revisión ontológica.`,
            tension
        };
    }

    /**
     * Compara profundamente dos estructuras de datos.
     * @private
     */
    _deepCompare(a, b) {
        try {
            return JSON.stringify(a) === JSON.stringify(b);
        } catch {
            return false;
        }
    }
}

export default EpistemicIntegrityFramework;
