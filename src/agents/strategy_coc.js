// src/agents/strategy_coc.js

export class StrategyCOC {
    /**
     * @param {string} id - Identificador único de la estrategia
     * @param {function} actionFn - Función que aplica esta estrategia al entorno (recibe tspEnv)
     * @param {object} [meta] - Metadatos opcionales (origen, padres, generación, etc.)
     */
    constructor(id, actionFn, meta = {}) {
        this.id = id;
        this.action = actionFn;

        this.coherence = 1.0;          // Valor inicial de fitness
        this.uses = 0;                 // Veces que ha sido activada
        this.successes = 0;            // Veces que ha mejorado la solución
        this.failures = 0;             // Veces que ha empeorado
        this.meta = meta;              // Datos evolutivos (padres, tipo, etc.)
    }

    /**
     * Ejecuta la acción de este COC sobre el entorno.
     * @param {TSPEnvironment} tspEnv - Entorno físico (estado del TSP)
     * @returns {boolean} - `true` si se modificó algo; `false` si no hizo nada.
     */
    apply(tspEnv) {
        try {
            const result = this.action(tspEnv);
            this.uses += 1;
            return result;
        } catch (err) {
            console.warn(`[StrategyCOC:${this.id}] Falló durante apply():`, err);
            return false;
        }
    }

    /**
     * Registra el resultado del efecto de esta estrategia.
     * @param {number} deltaScore - Cambio en la puntuación (ej. distancia total)
     */
    feedback(deltaScore) {
        if (deltaScore < 0) {
            this.successes += 1;
            this.coherence *= 1.05;
        } else if (deltaScore > 0) {
            this.failures += 1;
            this.coherence *= 0.95;
        }
        // Opcional: aplicar un límite inferior y superior
        this.coherence = Math.min(Math.max(this.coherence, 0.01), 10.0);
    }

    /**
     * Clona esta estrategia, con posible mutación.
     * @returns {StrategyCOC}
     */
    cloneWithMutation() {
        // Ejemplo: mutación básica que altera ligeramente el comportamiento
        const mutatedAction = this.mutateAction(this.action);
        const childMeta = {
            parent: this.id,
            generation: (this.meta.generation || 0) + 1,
        };
        const newId = `${this.id}_mut${Date.now() % 100000}`;
        return new StrategyCOC(newId, mutatedAction, childMeta);
    }

    /**
     * Punto de extensión: lógica de mutación de estrategias.
     * En la versión básica puede devolver la misma acción.
     * @param {function} actionFn
     * @returns {function}
     */
    mutateAction(actionFn) {
        // TODO: implementar mutación real
        return actionFn; // sin mutación aún
    }

    toString() {
        return `[COC:${this.id}] coh=${this.coherence.toFixed(2)} | uses=${this.uses} | meta=${JSON.stringify(this.meta)}`;
    }
}
