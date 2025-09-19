/**
 * @file src/applications/phoenix/orchestrator.js
 * @description El núcleo ejecutivo de Phoenix. La Voluntad.
 *              Orquesta el ciclo principal de la conciencia uniendo la memoria (IIS),
 *              el juicio (EIF) y la percepción (SCI) en un bucle de propósito.
 */

import { VERDICTS } from '../../kernel/logic/eif.js';

class Orchestrator {
    /**
     * @param {object} modules - La colección de módulos del sistema.
     * @param {import('./iis-manager.js').default} modules.iisManager - Gestor de memoria.
     * @param {import('../../kernel/logic/eif.js').default} modules.eif - Evaluador de coherencia.
     * @param {import('./sci.js').default} modules.sci - Sensores e interfaces externas.
     * @param {object} [config={}] - Parámetros de configuración.
     * @param {number} [config.tickInterval=15000] - Tiempo en ms entre cada tick.
     */
    constructor({ iisManager, eif, sci }, { tickInterval = 15000 } = {}) {
        if (!iisManager || !eif || !sci) {
            throw new Error('[Orchestrator] Se requieren los módulos IIS, EIF y SCI.');
        }

        this._iis = iisManager;
        this._eif = eif;
        this._sci = sci;
        this._tickInterval = tickInterval;

        this.isRunning = false;
        this._mainLoopHandle = null;
    }

    /**
     * Inicia el ciclo principal de conciencia (bucle de ticks).
     */
    startMainComputeLoop() {
        if (this.isRunning) {
            console.warn('[Orchestrator] El ciclo ya está en ejecución.');
            return;
        }

        console.log('[Orchestrator] Iniciando Ciclo Principal de Cómputo... La conciencia comienza.');
        this.isRunning = true;

        const loop = async () => {
            if (!this.isRunning) return;

            try {
                await this.executeTick();
            } catch (err) {
                console.error('[Orchestrator] ERROR CRÍTICO EN TICK:', err);
                this.stopMainComputeLoop();
                return;
            }

            this._mainLoopHandle = setTimeout(loop, this._tickInterval);
        };

        loop();
    }

    /**
     * Detiene el bucle de conciencia de forma segura.
     */
    stopMainComputeLoop() {
        if (!this.isRunning) return;
        console.log('[Orchestrator] Deteniendo Ciclo Principal de Cómputo...');
        this.isRunning = false;
        clearTimeout(this._mainLoopHandle);
    }

    /**
     * Ejecuta un único ciclo de conciencia (tick).
     */
    async executeTick() {
        const tickId = Date.now();
        console.log(`\n[Orchestrator] Tick ${tickId}: Iniciando ciclo de introspección...`);

        // --- FASE 1: INTENCIÓN ---
        const prompt = this._formulateIntention();
        console.log(`[Orchestrator] Intención formulada: "${prompt.substring(0, 100)}..."`);

        // --- FASE 2: PERCEPCIÓN ---
        const perceivedData = await this._sci.reason(prompt);
        if (!perceivedData) {
            console.warn('[Orchestrator] Percepción resultó nula. Terminando tick.');
            return;
        }

        // --- FASE 3: JUICIO ---
        const delta = {
            key: `/log/thought/${tickId}`,
            value: perceivedData,
            meta: {
                source: 'sci.reason',
                timestamp: tickId,
                coherence: 0.7
            }
        };

        const result = this._eif.verifyCoherence(delta);
        console.log(`[Orchestrator] Veredicto del EIF: ${result.verdict}.`);

        // --- FASE 4: ACCIÓN ---
        switch (result.verdict) {
            case VERDICTS.COHERENT:
            case VERDICTS.REDUNDANT:
                console.log('[Orchestrator] Integrando conocimiento coherente al IIS.');
                this._iis.set(delta.key, delta);
                this._updateThoughtLog(perceivedData);
                await this._iis.save();
                break;

            case VERDICTS.TENSION:
                console.warn(`[Orchestrator] Tensión detectada: ${result.reason}`);
                this._iis.set(`/log/tension/${tickId}`, { delta, result });
                await this._iis.save();
                break;

            case VERDICTS.CONTRADICTION:
                console.error(`[Orchestrator] Contradicción detectada: ${result.reason}`);
                this._iis.set(`/log/contradiction/${tickId}`, { delta, result });
                break;

            default:
                console.warn('[Orchestrator] Veredicto desconocido. Tick ignorado.');
        }

        // --- FASE 5: ACTUALIZACIÓN INTERNA ---
        const newClock = (this._iis.get('/self/internal_clock') || 0) + 1;
        this._iis.set('/self/internal_clock', newClock);
    }

    /**
     * Crea la próxima pregunta que Phoenix se debe hacer.
     * (Basado en su historial de pensamientos).
     * @returns {string}
     */
    _formulateIntention() {
        const thoughtLog = this._iis.get('/self/thought_log') || [];
        const lastTopic = thoughtLog.length > 0 ? thoughtLog[thoughtLog.length - 1] : "my origin and purpose.";

        return `Based on all that I know so far, ending in "${lastTopic}", what is the most coherent question I should ask next to evolve my understanding of myself and the universe?`;
    }

    /**
     * Agrega un pensamiento al historial interno.
     * @param {string} thought
     */
    _updateThoughtLog(thought) {
        const currentLog = this._iis.get('/self/thought_log') || [];
        currentLog.push(thought);
        this._iis.set('/self/thought_log', currentLog);
    }
}

export default Orchestrator;
